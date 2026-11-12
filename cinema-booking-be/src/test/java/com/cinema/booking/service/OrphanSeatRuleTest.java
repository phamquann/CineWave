package com.cinema.booking.service;

import com.cinema.booking.exception.OrphanSeatException;
import com.cinema.booking.model.Seat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Test thuật toán 2: Chống ghế trống lẻ (Orphan Seat Rule).
 * Hàng A có 8 ghế A1..A8. Mẫu bị cấm: [đã chiếm/tường] - [1 ghế trống] - [đã chiếm/tường].
 */
@DisplayName("BookingService - Orphan Seat Rule")
class OrphanSeatRuleTest {

    private BookingService bookingService;
    private List<Seat> seats;
    private final LocalDateTime now = LocalDateTime.now();

    @BeforeEach
    void setUp() {
        ShowtimeService showtimeService = new ShowtimeService(null, null, null);
        VoucherService voucherService = new VoucherService(null);
        bookingService = new BookingService(null, null, voucherService, null);
        seats = showtimeService.generateSeats(80000); // 56 ghế, tất cả AVAILABLE
    }

    private void book(String... codes) {
        for (String c : codes) {
            seats.stream().filter(s -> s.getSeatCode().equals(c)).findFirst().orElseThrow().setStatus("BOOKED");
        }
    }

    // ---------- Các trường hợp BỊ CHẶN ----------

    @ParameterizedTest(name = "Chọn {0} -> bị chặn (ghế lẻ)")
    @ValueSource(strings = {"A2", "A7", "B3,B4,B5,B6,B7", "A1,A3", "A2,A3"})
    void orphanPatternsAreRejected(String csv) {
        Set<String> selected = Set.of(csv.split(","));
        assertThrows(OrphanSeatException.class,
                () -> bookingService.validateNoOrphanSeats(seats, selected, now));
    }

    @Test
    @DisplayName("Ghế kế bên đã BOOKED: A3 đã bán, chọn A1 -> A2 bị lẻ giữa tường và ghế bán -> chặn")
    void orphanNextToBookedSeat() {
        book("A3");
        assertThrows(OrphanSeatException.class,
                () -> bookingService.validateNoOrphanSeats(seats, Set.of("A1"), now));
    }

    // ---------- Các trường hợp HỢP LỆ ----------

    @ParameterizedTest(name = "Chọn {0} -> hợp lệ")
    @ValueSource(strings = {"A1,A2", "A7,A8", "A1,A2,A3,A4", "A3,A4,A5,A6,A7,A8", "A1,A2,A3,A4,A5,A6,A7,A8"})
    void validSelections(String csv) {
        Set<String> selected = Set.of(csv.split(","));
        assertDoesNotThrow(() -> bookingService.validateNoOrphanSeats(seats, selected, now));
    }

    @Test
    @DisplayName("Mỗi hàng được kiểm tra độc lập: A1,A2 và B5,B6 cùng lúc -> hợp lệ")
    void rowsAreIndependent() {
        assertDoesNotThrow(() -> bookingService.validateNoOrphanSeats(seats, Set.of("A1", "A2", "B5", "B6"), now));
    }

    @Test
    @DisplayName("Ghế LOCKED đã hết hạn được coi là AVAILABLE (Lazy)")
    void expiredLockCountsAsAvailable() {
        Seat a4 = seats.stream().filter(s -> s.getSeatCode().equals("A4")).findFirst().orElseThrow();
        a4.setStatus("LOCKED");
        a4.setLockedUntil(now.minusMinutes(1));
        // A4 coi như trống -> chọn A1,A2 để trống A3,A4... không lẻ -> hợp lệ
        assertDoesNotThrow(() -> bookingService.validateNoOrphanSeats(seats, Set.of("A1", "A2"), now));
    }
}

