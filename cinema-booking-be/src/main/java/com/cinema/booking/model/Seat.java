package com.cinema.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Seat {
    /**
     * Mã ghế: A1, A2, ..., G8
     */
    private String seatCode;

    /**
     * Hàng ghế: A, B, C, D, E, F, G
     */
    private String row;

    /**
     * Số ghế trong hàng: 1..8
     */
    private int number;

    /**
     * Loại ghế: STANDARD (hàng A-C), VIP (hàng D-F), COUPLE (hàng G)
     */
    private String type;

    /**
     * Phụ thu theo loại ghế: STANDARD = 0, VIP = 20000, COUPLE = basePrice + 20000
     */
    private double surcharge;

    /**
     * Giá ghế = basePrice + surcharge
     */
    private double price;

    /**
     * Trạng thái ghế: AVAILABLE, LOCKED, BOOKED
     */
    @Builder.Default
    private String status = "AVAILABLE";

    /**
     * ID của user đang giữ ghế
     */
    private String lockedBy;

    /**
     * Thời hạn giữ ghế (now + 10 minutes)
     */
    private LocalDateTime lockedUntil;
}

