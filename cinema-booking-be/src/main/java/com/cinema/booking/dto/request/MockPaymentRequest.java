package com.cinema.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MockPaymentRequest {
    @NotBlank(message = "bookingId không được để trống")
    private String bookingId;

    @NotBlank(message = "paymentStatus không được để trống")
    @Pattern(regexp = "^(SUCCESS|FAILED)$", message = "paymentStatus phải là SUCCESS hoặc FAILED")
    private String paymentStatus;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
}

