package com.cinema.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplyVoucherRequest {
    private String bookingId;

    @NotBlank(message = "Mã giảm giá (voucherCode) không được để trống")
    private String voucherCode;

    /**
     * Optional originalAmount when previewing voucher before holding seats
     */
    private Double originalAmount;
}

