package com.cinema.booking.service;

import com.cinema.booking.dto.request.MockPaymentRequest;
import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit Test máy trạng thái đơn hàng: PENDING -> PAID / CANCELLED / EXPIRED, PAID -> CHECKED_IN.
 * Mock BookingRepository + MongoTemplate để kiểm tra logic mà không cần database.
 */
@DisplayName("PaymentService - State machine & QR check-in (Mockito)")
class PaymentServiceTest {

    private BookingRepository bookingRepo;
    private MongoTemplate mongoTemplate;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        bookingRepo = Mockito.mock(BookingRepository.class);
        mongoTemplate = Mockito.mock(MongoTemplate.class);
        service = new PaymentService(bookingRepo, mongoTemplate);
        when(bookingRepo.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Booking pending(LocalDateTime expiresAt) {
        return Booking.builder()
                .id("booking-123456")
                .showtimeId("s1")
                .seatCodes(List.of("A1", "A2"))
                .status("PENDING")
                .expiresAt(expiresAt)
                .build();
    }

    private MockPaymentRequest pay(String status) {
        MockPaymentRequest r = new MockPaymentRequest();
        r.setBookingId("booking-123456");
        r.setPaymentStatus(status);
        return r;
    }

    @Test
    @DisplayName("SUCCESS: PENDING -> PAID, sinh qrCode dạng CW-QR-..., ghế chuyển BOOKED")
    void paymentSuccess() {
        when(bookingRepo.findById("booking-123456")).thenReturn(Optional.of(pending(LocalDateTime.now().plusMinutes(5))));

        Booking result = service.processMockPayment(pay("SUCCESS"));

        assertEquals("PAID", result.getStatus());
        assertNotNull(result.getQrCode());
        assertTrue(result.getQrCode().startsWith("CW-QR-"));
        assertNotNull(result.getPaidAt());
        verify(mongoTemplate).updateFirst(any(), any(), eq(Showtime.class)); // ghế LOCKED -> BOOKED
    }

    @Test
    @DisplayName("FAILED: PENDING -> CANCELLED và giải phóng ghế")
    void paymentFailed() {
        when(bookingRepo.findById("booking-123456")).thenReturn(Optional.of(pending(LocalDateTime.now().plusMinutes(5))));

        Booking result = service.processMockPayment(pay("FAILED"));

        assertEquals("CANCELLED", result.getStatus());
        assertNull(result.getQrCode());
        verify(mongoTemplate).updateFirst(any(), any(), eq(Showtime.class));
    }

    @Test
    @DisplayName("Thanh toán sau khi quá hạn giữ ghế 10 phút -> 400 và đơn thành EXPIRED")
    void paymentAfterExpiry() {
        Booking b = pending(LocalDateTime.now().minusSeconds(1));
        when(bookingRepo.findById("booking-123456")).thenReturn(Optional.of(b));

        assertThrows(BadRequestException.class, () -> service.processMockPayment(pay("SUCCESS")));
        assertEquals("EXPIRED", b.getStatus());
    }

    @Test
    @DisplayName("Thanh toán đơn đã PAID (thanh toán 2 lần) -> 400")
    void doublePayment() {
        Booking b = pending(LocalDateTime.now().plusMinutes(5));
        b.setStatus("PAID");
        when(bookingRepo.findById("booking-123456")).thenReturn(Optional.of(b));

        assertThrows(BadRequestException.class, () -> service.processMockPayment(pay("SUCCESS")));
        verify(bookingRepo, never()).save(any());
    }

    @Test
    @DisplayName("Đơn không tồn tại -> 404")
    void bookingNotFound() {
        when(bookingRepo.findById(anyString())).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.processMockPayment(pay("SUCCESS")));
    }

    @Test
    @DisplayName("Hủy đơn PENDING -> CANCELLED; hủy đơn PAID -> 400")
    void cancelBooking() {
        when(bookingRepo.findById("booking-123456")).thenReturn(Optional.of(pending(LocalDateTime.now().plusMinutes(5))));
        assertEquals("CANCELLED", service.cancelBooking("booking-123456").getStatus());

        Booking paid = pending(null);
        paid.setStatus("PAID");
        when(bookingRepo.findById("paid-1")).thenReturn(Optional.of(paid));
        assertThrows(BadRequestException.class, () -> service.cancelBooking("paid-1"));
    }

    // ---------- QR check-in: chỉ quét thành công 1 lần ----------

    @Test
    @DisplayName("Check-in vé PAID -> CHECKED_IN; quét lần 2 -> 409")
    void qrCheckInOnlyOnce() {
        Booking b = pending(null);
        b.setStatus("PAID");
        b.setQrCode("CW-QR-TEST");
        when(bookingRepo.findByQrCode("CW-QR-TEST")).thenReturn(Optional.of(b));

        Booking first = service.checkInByQrCode("CW-QR-TEST");
        assertEquals("CHECKED_IN", first.getStatus());
        assertNotNull(first.getCheckedInAt());

        assertThrows(SeatConflictException.class, () -> service.checkInByQrCode("CW-QR-TEST"));
    }

    @Test
    @DisplayName("Check-in vé chưa thanh toán (PENDING) -> 400; mã QR sai -> 404")
    void qrCheckInInvalid() {
        Booking b = pending(null);
        b.setQrCode("CW-QR-PENDING");
        when(bookingRepo.findByQrCode("CW-QR-PENDING")).thenReturn(Optional.of(b));
        when(bookingRepo.findByQrCode("WRONG")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> service.checkInByQrCode("CW-QR-PENDING"));
        assertThrows(ResourceNotFoundException.class, () -> service.checkInByQrCode("WRONG"));
    }
}

