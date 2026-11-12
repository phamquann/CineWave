package com.cinema.booking.controller;

import com.cinema.booking.dto.request.ApplyVoucherRequest;
import com.cinema.booking.dto.request.CheckInRequest;
import com.cinema.booking.dto.request.HoldSeatRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.dto.response.BookingSummaryResponse;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.User;
import com.cinema.booking.service.BookingService;
import com.cinema.booking.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "4. Core Booking & Voucher", description = "Giữ ghế 10 phút (Orphan Seat + Atomic Seat Locking), Áp dụng Voucher, Lịch sử vé")
public class BookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    @PostMapping({"/hold", ""})
    @Operation(summary = "Giữ ghế tạm thời 10 phút (1-8 ghế, kiểm tra ghế lẻ Orphan Seat, khóa ghế nguyên tử Atomic Lock)")
    public ResponseEntity<ApiResponse<Booking>> holdSeats(
            @Valid @RequestBody HoldSeatRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        Booking booking = bookingService.holdSeats(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Giữ ghế thành công trong 10 phút", booking));
    }

    @PostMapping("/apply-voucher")
    @Operation(summary = "Áp dụng mã giảm giá (Voucher) cho đơn hàng đang giữ ghế hoặc tính thử")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> applyVoucher(
            @Valid @RequestBody ApplyVoucherRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingSummaryResponse response = bookingService.applyVoucher(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Áp dụng mã giảm giá thành công", response));
    }

    @PostMapping("/{id}/apply-voucher")
    @Operation(summary = "Áp dụng mã giảm giá (Voucher) theo bookingId trên URL")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> applyVoucherByBookingId(
            @PathVariable String id,
            @Valid @RequestBody ApplyVoucherRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        request.setBookingId(id);
        BookingSummaryResponse response = bookingService.applyVoucher(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Áp dụng mã giảm giá thành công", response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng đang giữ ghế (PENDING) và giải phóng ghế về AVAILABLE")
    public ResponseEntity<ApiResponse<Booking>> cancelBooking(@PathVariable String id) {
        Booking cancelled = paymentService.cancelBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đơn hàng và giải phóng ghế", cancelled));
    }

    @PostMapping("/check-in")
    @Operation(summary = "Soát vé bằng mã QR (Staff / Admin)")
    public ResponseEntity<ApiResponse<Booking>> checkInTicket(@Valid @RequestBody CheckInRequest request) {
        Booking checkedIn = paymentService.checkInByQrCode(request.getQrCode());
        return ResponseEntity.ok(ApiResponse.success("Soát vé QR thành công (CHECKED_IN)", checkedIn));
    }

    @GetMapping({"/my-bookings", "/me"})
    @Operation(summary = "Xem lịch sử đặt vé và mã QR của khách hàng đang đăng nhập")
    public ResponseEntity<ApiResponse<List<Booking>>> getMyBookings(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Lịch sử đặt vé của bạn", bookingService.getMyBookings(currentUser.getId())));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách đơn đặt vé (Admin/Staff xem toàn bộ, Customer xem của mình)")
    public ResponseEntity<ApiResponse<List<Booking>>> getBookings(@AuthenticationPrincipal User currentUser) {
        if (currentUser != null && ("ADMIN".equalsIgnoreCase(currentUser.getRole()) || "STAFF".equalsIgnoreCase(currentUser.getRole()))) {
            return ResponseEntity.ok(ApiResponse.success("Danh sách toàn bộ đơn đặt vé", bookingService.getAllBookings()));
        }
        String userId = currentUser != null ? currentUser.getId() : "";
        return ResponseEntity.ok(ApiResponse.success("Danh sách đơn đặt vé", bookingService.getMyBookings(userId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết đơn đặt vé theo ID")
    public ResponseEntity<ApiResponse<Booking>> getBookingById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Chi tiết đơn đặt vé", bookingService.getBookingById(id)));
    }
}

