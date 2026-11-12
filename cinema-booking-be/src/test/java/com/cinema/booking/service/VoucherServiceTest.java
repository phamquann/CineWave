package com.cinema.booking.service;

import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.model.Voucher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Test thuật toán 4: Tính giá vé động & Khuyến mãi có trần.
 * Kỹ thuật: Decision Table + Boundary Value Analysis.
 * Không cần DB: VoucherService.validateAndCalculateDiscount là hàm thuần (pure function).
 */
@DisplayName("VoucherService - Decision Table & Boundary Value")
class VoucherServiceTest {

    private VoucherService service;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        service = new VoucherService(null); // không dùng repository trong hàm tính toán
        now = LocalDateTime.now();
    }

    /** Voucher hợp lệ mặc định: FIXED 50k, đơn tối thiểu 150k. Mỗi test chỉ phá 1 điều kiện. */
    private Voucher.VoucherBuilder validFixed() {
        return Voucher.builder()
                .code("GIAM50K")
                .discountType("FIXED")
                .discountValue(50000)
                .maxDiscountAmount(50000.0)
                .minOrderValue(150000)
                .usageLimit(10)
                .usedCount(0)
                .startDate(now.minusDays(1))
                .expiryDate(now.plusDays(1))
                .isActive(true);
    }

    // ---------- Decision Table: các điều kiện KHÔNG hợp lệ ----------

    @Test
    @DisplayName("DT1: Voucher bị vô hiệu hóa (isActive=false) -> 400")
    void inactiveVoucher() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.validateAndCalculateDiscount(validFixed().isActive(false).build(), 200000));
        assertTrue(ex.getMessage().contains("khóa"));
    }

    @Test
    @DisplayName("DT2: Chưa tới ngày áp dụng (startDate > now) -> 400")
    void notStartedYet() {
        Voucher v = validFixed().startDate(now.plusDays(2)).expiryDate(now.plusDays(5)).build();
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.validateAndCalculateDiscount(v, 200000));
        assertTrue(ex.getMessage().contains("chưa tới ngày"));
    }

    @Test
    @DisplayName("DT3: Đã hết hạn (expiryDate < now) -> 400")
    void expired() {
        Voucher v = validFixed().startDate(now.minusDays(10)).expiryDate(now.minusMinutes(1)).build();
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.validateAndCalculateDiscount(v, 200000));
        assertTrue(ex.getMessage().contains("hết hạn"));
    }

    @Test
    @DisplayName("DT4: Hết lượt dùng (usedCount == usageLimit) -> 400")
    void usageLimitReached() {
        Voucher v = validFixed().usageLimit(10).usedCount(10).build();
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.validateAndCalculateDiscount(v, 200000));
        assertTrue(ex.getMessage().contains("hết lượt"));
    }

    @Test
    @DisplayName("DT5: Loại giảm giá không hỗ trợ -> 400")
    void unknownDiscountType() {
        Voucher v = validFixed().discountType("BOGO").build();
        assertThrows(BadRequestException.class, () -> service.validateAndCalculateDiscount(v, 200000));
    }

    // ---------- Boundary Value Analysis ----------

    @ParameterizedTest(name = "BVA minOrder: đơn {0}đ -> hợp lệ = {1}")
    @CsvSource({
            "149999, false",   // ngay dưới biên
            "150000, true",    // đúng biên
            "150001, true"     // ngay trên biên
    })
    void minOrderValueBoundary(double orderAmount, boolean shouldPass) {
        Voucher v = validFixed().build();
        if (shouldPass) {
            assertEquals(50000, service.validateAndCalculateDiscount(v, orderAmount));
        } else {
            assertThrows(BadRequestException.class, () -> service.validateAndCalculateDiscount(v, orderAmount));
        }
    }

    @ParameterizedTest(name = "BVA usage: used={0}/limit=10 -> hợp lệ = {1}")
    @CsvSource({"8,true", "9,true", "10,false", "11,false"})
    void usageBoundary(int used, boolean shouldPass) {
        Voucher v = validFixed().usageLimit(10).usedCount(used).build();
        if (shouldPass) {
            assertDoesNotThrow(() -> service.validateAndCalculateDiscount(v, 200000));
        } else {
            assertThrows(BadRequestException.class, () -> service.validateAndCalculateDiscount(v, 200000));
        }
    }

    // ---------- Công thức tính tiền ----------

    @Test
    @DisplayName("FIXED: giảm thẳng 50.000đ")
    void fixedDiscount() {
        assertEquals(50000, service.validateAndCalculateDiscount(validFixed().build(), 180000));
    }

    @Test
    @DisplayName("FIXED lớn hơn tổng đơn -> không giảm quá tổng đơn (FinalAmount >= 0)")
    void fixedDiscountNeverExceedsOrder() {
        Voucher v = validFixed().discountValue(500000).minOrderValue(0).build();
        assertEquals(100000, service.validateAndCalculateDiscount(v, 100000));
    }

    @ParameterizedTest(name = "PERCENT 50%, trần 80k: đơn {0}đ -> giảm {1}đ")
    @CsvSource({
            "200000, 80000",   // 50% = 100k > trần 80k -> bị chặn trần
            "160000, 80000",   // 50% = 80k = trần (đúng biên)
            "150000, 75000"    // 50% = 75k < trần -> giữ nguyên
    })
    void percentWithCap(double order, double expected) {
        Voucher v = validFixed().discountType("PERCENT").discountValue(50)
                .maxDiscountAmount(80000.0).minOrderValue(100000).build();
        assertEquals(expected, service.validateAndCalculateDiscount(v, order));
    }

    @Test
    @DisplayName("PERCENT không có trần (maxDiscountAmount=null) -> giảm đúng %")
    void percentWithoutCap() {
        Voucher v = validFixed().discountType("PERCENT").discountValue(20)
                .maxDiscountAmount(null).minOrderValue(0).build();
        assertEquals(40000, service.validateAndCalculateDiscount(v, 200000));
    }
}

