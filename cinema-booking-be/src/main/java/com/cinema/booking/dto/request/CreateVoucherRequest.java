package com.cinema.booking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVoucherRequest {
    @NotBlank(message = "Mã giảm giá không được để trống")
    private String code;

    private String description;

    @NotBlank(message = "Loại giảm giá không được để trống")
    @Pattern(regexp = "^(FIXED|PERCENT)$", message = "discountType phải là FIXED hoặc PERCENT")
    private String discountType;

    @Min(value = 1, message = "Giá trị giảm phải lớn hơn 0")
    private double discountValue;

    private Double maxDiscountAmount;

    @Min(value = 0, message = "Giá trị đơn hàng tối thiểu không được âm")
    private double minOrderValue;

    @Min(value = 1, message = "Số lượt sử dụng tối đa phải >= 1")
    private int usageLimit = 100;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Ngày hết hạn không được để trống")
    private LocalDateTime expiryDate;

    private Boolean isActive = true;
}

