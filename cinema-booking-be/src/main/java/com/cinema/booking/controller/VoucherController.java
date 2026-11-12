package com.cinema.booking.controller;

import com.cinema.booking.dto.request.ApplyVoucherRequest;
import com.cinema.booking.dto.request.CreateVoucherRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.dto.response.BookingSummaryResponse;
import com.cinema.booking.model.User;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.service.BookingService;
import com.cinema.booking.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
@Tag(name = "5. Voucher Management", description = "Quản lý mã khuyến mãi (FIXED / PERCENT có mức trần)")
public class VoucherController {

    private final VoucherService voucherService;
    private final BookingService bookingService;

    @GetMapping
    @Operation(summary = "Danh sách tất cả mã giảm giá (Public)")
    public ResponseEntity<ApiResponse<List<Voucher>>> getAllVouchers() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách mã giảm giá", voucherService.getAllVouchers()));
    }

    @PostMapping
    @Operation(summary = "Tạo mã giảm giá mới (Admin)")
    public ResponseEntity<ApiResponse<Voucher>> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        Voucher voucher = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo mã giảm giá thành công", voucher));
    }

    @PostMapping("/apply")
    @Operation(summary = "Áp dụng thử hoặc áp dụng mã giảm giá vào đơn hàng")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> applyVoucher(
            @Valid @RequestBody ApplyVoucherRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        BookingSummaryResponse response = bookingService.applyVoucher(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Áp dụng mã giảm giá thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mã giảm giá (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable String id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mã giảm giá thành công", null));
    }
}

