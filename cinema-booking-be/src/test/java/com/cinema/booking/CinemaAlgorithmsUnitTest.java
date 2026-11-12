package com.cinema.booking;

import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.OrphanSeatException;
import com.cinema.booking.model.Seat;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.VoucherRepository;
import com.cinema.booking.service.BookingService;
import com.cinema.booking.service.ShowtimeService;
import com.cinema.booking.service.VoucherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CinemaAlgorithmsUnitTest {

    private ShowtimeService showtimeService;
    private BookingService bookingService;
    private VoucherService voucherService;

    @BeforeEach
    void setUp() {
        showtimeService = new ShowtimeService(null, null, null);
        voucherService = new VoucherService(null);
        bookingService = new BookingService(null, null, voucherService, null);
    }

    @Test
    @DisplayName("Khởi tạo ghế tự động: 56 ghế (A-C STANDARD, D-F VIP +20k, G COUPLE nhân đôi + phụ thu)")
    void testGenerateSeats() {
        double basePrice = 80000;
        List<Seat> seats = showtimeService.generateSeats(basePrice);

        assertEquals(56, seats.size());

        Seat a1 = seats.stream().filter(s -> s.getSeatCode().equals("A1")).findFirst().orElseThrow();
        assertEquals("STANDARD", a1.getType());
        assertEquals(80000, a1.getPrice());

        Seat d1 = seats.stream().filter(s -> s.getSeatCode().equals("D1")).findFirst().orElseThrow();
        assertEquals("VIP", d1.getType());
        assertEquals(100000, d1.getPrice());

        Seat g1 = seats.stream().filter(s -> s.getSeatCode().equals("G1")).findFirst().orElseThrow();
        assertEquals("COUPLE", g1.getType());
        assertEquals(180000, g1.getPrice());
    }

    @Test
    @DisplayName("Thuật toán 2 (Orphan Seat): Chọn A1, A3 để trống A2 ở giữa -> Ném lỗi 400 OrphanSeatException")
    void testOrphanSeatInMiddle() {
        List<Seat> seats = showtimeService.generateSeats(80000);
        LocalDateTime now = LocalDateTime.now();

        assertThrows(OrphanSeatException.class, () ->
                bookingService.validateNoOrphanSeats(seats, Set.of("A1", "A3"), now)
        );
    }

    @Test
    @DisplayName("Thuật toán 2 (Orphan Seat): Chọn A2 để trống A1 ở bìa trái -> Ném lỗi 400 OrphanSeatException")
    void testOrphanSeatAtLeftEdge() {
        List<Seat> seats = showtimeService.generateSeats(80000);
        LocalDateTime now = LocalDateTime.now();

        assertThrows(OrphanSeatException.class, () ->
                bookingService.validateNoOrphanSeats(seats, Set.of("A2"), now)
        );
    }

    @Test
    @DisplayName("Thuật toán 2 (Orphan Seat): Chọn A7 để trống A8 ở bìa phải -> Ném lỗi 400 OrphanSeatException")
    void testOrphanSeatAtRightEdge() {
        List<Seat> seats = showtimeService.generateSeats(80000);
        LocalDateTime now = LocalDateTime.now();

        assertThrows(OrphanSeatException.class, () ->
                bookingService.validateNoOrphanSeats(seats, Set.of("A7"), now)
        );
    }

    @Test
    @DisplayName("Thuật toán 2 (Orphan Seat): Chọn A1, A2 hợp lệ -> Không ném lỗi")
    void testValidAdjacentSeats() {
        List<Seat> seats = showtimeService.generateSeats(80000);
        LocalDateTime now = LocalDateTime.now();

        assertDoesNotThrow(() ->
                bookingService.validateNoOrphanSeats(seats, Set.of("A1", "A2"), now)
        );
    }

    @Test
    @DisplayName("Thuật toán 4 (Voucher): Tính giảm giá FIXED và PERCENT có trần maxDiscountAmount")
    void testVoucherDiscountCalculation() {
        LocalDateTime now = LocalDateTime.now();

        Voucher fixed50k = Voucher.builder()
                .code("GIAM50K")
                .discountType("FIXED")
                .discountValue(50000)
                .minOrderValue(150000)
                .usageLimit(100)
                .usedCount(0)
                .startDate(now.minusDays(1))
                .expiryDate(now.plusDays(1))
                .isActive(true)
                .build();

        assertEquals(50000, voucherService.validateAndCalculateDiscount(fixed50k, 180000));
        assertThrows(BadRequestException.class, () ->
                voucherService.validateAndCalculateDiscount(fixed50k, 100000)
        );

        Voucher percentCapped = Voucher.builder()
                .code("VIP50PT")
                .discountType("PERCENT")
                .discountValue(50)
                .maxDiscountAmount(80000.0)
                .minOrderValue(200000)
                .usageLimit(10)
                .usedCount(0)
                .startDate(now.minusDays(1))
                .expiryDate(now.plusDays(1))
                .isActive(true)
                .build();

        // 50% của 300.000đ = 150.000đ nhưng bị trần ở 80.000đ
        assertEquals(80000, voucherService.validateAndCalculateDiscount(percentCapped, 300000));
    }
}

