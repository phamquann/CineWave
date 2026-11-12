package com.cinema.booking.controller;

import com.cinema.booking.dto.request.CheckInRequest;
import com.cinema.booking.dto.request.MockPaymentRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.model.Booking;
import com.cinema.booking.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "6. Payment Webhook & QR Check-in", description = "Giả lập thanh toán (SUCCESS/FAILED) & Soát vé QR Code (Staff/Admin)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping({"/mock", "/webhook", ""})
    @Operation(summary = "Giả lập kết quả thanh toán (SUCCESS -> PAID + BOOKED + sinh QR; FAILED -> CANCELLED + nhả ghế)")
    public ResponseEntity<ApiResponse<Booking>> processMockPayment(@Valid @RequestBody MockPaymentRequest request) {
        Booking booking = paymentService.processMockPayment(request);
        String msg = "PAID".equalsIgnoreCase(booking.getStatus())
                ? "Thanh toán thành công! Đã xuất mã vé QR: " + booking.getQrCode()
                : "Thanh toán thất bại hoặc đã hủy. Đã giải phóng ghế về AVAILABLE.";
        return ResponseEntity.ok(ApiResponse.success(msg, booking));
    }

    @PostMapping("/check-in")
    @Operation(summary = "Soát vé bằng mã QR (Staff / Admin) - Chỉ cho phép quét thành công duy nhất 1 lần")
    public ResponseEntity<ApiResponse<Booking>> checkInByQr(@Valid @RequestBody CheckInRequest request) {
        Booking booking = paymentService.checkInByQrCode(request.getQrCode());
        return ResponseEntity.ok(ApiResponse.success("Soát vé thành công! Trạng thái vé: CHECKED_IN", booking));
    }
}

