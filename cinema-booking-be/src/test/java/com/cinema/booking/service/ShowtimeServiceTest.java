package com.cinema.booking.service;

import com.cinema.booking.dto.request.CreateShowtimeRequest;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Movie;
import com.cinema.booking.model.Seat;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit Test thuật toán 1 (Interval Overlap) và thuật toán 5 (Lazy Expiration).
 * Kỹ thuật: dùng Mockito để giả lập Repository (không cần MongoDB thật).
 */
@DisplayName("ShowtimeService - Overlap & Lazy Expiration (Mockito)")
class ShowtimeServiceTest {

    private ShowtimeRepository showtimeRepo;
    private MovieRepository movieRepo;
    private BookingRepository bookingRepo;
    private ShowtimeService service;

    // Phim 120 phút => 1 suất chiếm 135 phút (120 + 15 dọn phòng)
    private static final LocalDateTime BASE = LocalDateTime.of(2030, 1, 1, 10, 0);

    @BeforeEach
    void setUp() {
        showtimeRepo = Mockito.mock(ShowtimeRepository.class);
        movieRepo = Mockito.mock(MovieRepository.class);
        bookingRepo = Mockito.mock(BookingRepository.class);
        service = new ShowtimeService(showtimeRepo, movieRepo, bookingRepo);

        Movie movie = Movie.builder().id("m1").title("Phim Test").durationMinutes(120).build();
        when(movieRepo.findById("m1")).thenReturn(Optional.of(movie));
        when(showtimeRepo.save(any(Showtime.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    /** Suất đã tồn tại: 10:00 -> 12:15 tại Cinema 01. */
    private void givenExistingShowtime() {
        Showtime existing = Showtime.builder()
                .roomName("Cinema 01")
                .startTime(BASE)
                .endTime(BASE.plusMinutes(135))
                .build();
        when(showtimeRepo.findByRoomName("Cinema 01")).thenReturn(List.of(existing));
    }

    private CreateShowtimeRequest request(String room, LocalDateTime start) {
        return new CreateShowtimeRequest("m1", room, "IMAX", start, 80000);
    }

    // ---------- Thuật toán 1: Interval Overlap ----------

    @Test
    @DisplayName("endTime = startTime + duration + 15 phút")
    void endTimeIncludesCleaningBuffer() {
        when(showtimeRepo.findByRoomName("Cinema 01")).thenReturn(List.of());
        Showtime created = service.createShowtime(request("Cinema 01", BASE));
        assertEquals(BASE.plusMinutes(135), created.getEndTime());
        assertEquals(56, created.getSeats().size());
    }

    @Test
    @DisplayName("Trùng hoàn toàn khung giờ cùng phòng -> 409")
    void sameSlotConflicts() {
        givenExistingShowtime();
        assertThrows(SeatConflictException.class, () -> service.createShowtime(request("Cinema 01", BASE)));
        verify(showtimeRepo, never()).save(any());
    }

    @Test
    @DisplayName("Bắt đầu trong lúc suất cũ đang chiếu (11:00) -> 409")
    void startsInsideExisting() {
        givenExistingShowtime();
        assertThrows(SeatConflictException.class,
                () -> service.createShowtime(request("Cinema 01", BASE.plusHours(1))));
    }

    @Test
    @DisplayName("Kết thúc chồng lên đầu suất cũ (bắt đầu 08:00, kết thúc 10:15) -> 409")
    void endsInsideExisting() {
        givenExistingShowtime();
        assertThrows(SeatConflictException.class,
                () -> service.createShowtime(request("Cinema 01", BASE.minusHours(2))));
    }

    @Test
    @DisplayName("BVA: bắt đầu đúng lúc suất cũ kết thúc (12:15) -> HỢP LỆ (NewStart == ExistingEnd)")
    void startsExactlyWhenExistingEnds() {
        givenExistingShowtime();
        assertDoesNotThrow(() -> service.createShowtime(request("Cinema 01", BASE.plusMinutes(135))));
    }

    @Test
    @DisplayName("BVA: bắt đầu trước khi suất cũ kết thúc 1 phút (12:14) -> 409")
    void startsOneMinuteBeforeExistingEnds() {
        givenExistingShowtime();
        assertThrows(SeatConflictException.class,
                () -> service.createShowtime(request("Cinema 01", BASE.plusMinutes(134))));
    }

    @Test
    @DisplayName("Cùng giờ nhưng KHÁC phòng -> hợp lệ")
    void sameTimeDifferentRoomIsOk() {
        givenExistingShowtime();
        when(showtimeRepo.findByRoomName("Cinema 02")).thenReturn(List.of());
        assertDoesNotThrow(() -> service.createShowtime(request("Cinema 02", BASE)));
    }

    @Test
    @DisplayName("Phim không tồn tại -> 404")
    void movieNotFound() {
        when(movieRepo.findById("x")).thenReturn(Optional.empty());
        CreateShowtimeRequest req = new CreateShowtimeRequest("x", "Cinema 01", "IMAX", BASE, 80000);
        assertThrows(ResourceNotFoundException.class, () -> service.createShowtime(req));
    }

    // ---------- Sinh ghế ----------

    @Test
    @DisplayName("Sinh ghế: giá theo hạng STANDARD / VIP(+20k) / COUPLE(x2 + 20k)")
    void seatPricing() {
        List<Seat> seats = service.generateSeats(100000);
        assertEquals(56, seats.size());
        assertEquals(100000, price(seats, "C8"));   // STANDARD
        assertEquals(120000, price(seats, "D1"));   // VIP
        assertEquals(220000, price(seats, "G8"));   // COUPLE = 100k*2 + 20k
        assertTrue(seats.stream().allMatch(s -> "AVAILABLE".equals(s.getStatus())));
    }

    private double price(List<Seat> seats, String code) {
        return seats.stream().filter(s -> s.getSeatCode().equals(code)).findFirst().orElseThrow().getPrice();
    }

    // ---------- Thuật toán 5: Lazy Expiration ----------

    @Test
    @DisplayName("Lazy check: ghế LOCKED đã quá hạn -> trả về AVAILABLE và lưu DB")
    void lazyCheckReleasesExpiredLock() {
        List<Seat> seats = service.generateSeats(80000);
        Seat a1 = seats.get(0);
        a1.setStatus("LOCKED");
        a1.setLockedBy("u1");
        a1.setLockedUntil(LocalDateTime.now().minusMinutes(1));
        Showtime st = Showtime.builder().id("s1").seats(seats).build();
        when(bookingRepo.findByStatusAndExpiresAtBefore(eq("PENDING"), any())).thenReturn(List.of());

        Showtime result = service.applyLazyExpirationCheck(st);

        assertEquals("AVAILABLE", result.getSeats().get(0).getStatus());
        assertNull(result.getSeats().get(0).getLockedUntil());
        verify(showtimeRepo, times(1)).save(any(Showtime.class));
    }

    @Test
    @DisplayName("Lazy check: ghế LOCKED còn hạn -> giữ nguyên, không ghi DB")
    void lazyCheckKeepsActiveLock() {
        List<Seat> seats = service.generateSeats(80000);
        Seat a1 = seats.get(0);
        a1.setStatus("LOCKED");
        a1.setLockedUntil(LocalDateTime.now().plusMinutes(5));
        Showtime st = Showtime.builder().id("s1").seats(seats).build();

        Showtime result = service.applyLazyExpirationCheck(st);

        assertEquals("LOCKED", result.getSeats().get(0).getStatus());
        verify(showtimeRepo, never()).save(any());
    }

    @Test
    @DisplayName("Lazy check: ghế BOOKED không bao giờ bị nhả")
    void lazyCheckNeverReleasesBooked() {
        List<Seat> seats = service.generateSeats(80000);
        seats.get(0).setStatus("BOOKED");
        Showtime st = Showtime.builder().id("s1").seats(seats).build();

        service.applyLazyExpirationCheck(st);

        assertEquals("BOOKED", seats.get(0).getStatus());
    }
}

