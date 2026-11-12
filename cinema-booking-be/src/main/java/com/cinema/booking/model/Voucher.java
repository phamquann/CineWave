package com.cinema.booking.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vouchers")
public class Voucher {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String description;

    /**
     * Hình thức giảm giá: FIXED (tiền mặt) hoặc PERCENT (phần trăm)
     */
    private String discountType;

    /**
     * Giá trị giảm (VD: 50000 cho FIXED, hoặc 20 cho 20% PERCENT)
     */
    private double discountValue;

    /**
     * Mức trần giảm tối đa (áp dụng cho PERCENT)
     */
    private Double maxDiscountAmount;

    /**
     * Tổng tiền ghế tối thiểu để áp dụng mã
     */
    private double minOrderValue;

    /**
     * Tổng số lượt sử dụng tối đa
     */
    private int usageLimit;

    /**
     * Số lượt đã sử dụng (tăng lên 1 khi thanh toán SUCCESS)
     */
    @Builder.Default
    private int usedCount = 0;

    private LocalDateTime startDate;

    private LocalDateTime expiryDate;

    @Builder.Default
    @JsonProperty("isActive")
    private boolean isActive = true;
}

