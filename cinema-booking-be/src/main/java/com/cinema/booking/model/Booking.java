package com.cinema.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;

    private String userId;

    private String userEmail;

    private String customerName;

    private String customerPhone;

    private String showtimeId;

    private String movieId;

    private String movieTitle;

    private String roomName;

    private String format;

    private LocalDateTime startTime;

    @Builder.Default
    private List<String> seatCodes = new ArrayList<>();

    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    /**
     * Tổng tiền gốc của các ghế
     */
    private double originalAmount;

    /**
     * Mã giảm giá đã áp dụng (nếu có)
     */
    private String voucherCode;

    /**
     * Số tiền được giảm từ Voucher
     */
    @Builder.Default
    private double discountAmount = 0.0;

    /**
     * Thành tiền cuối cùng = max(0, originalAmount - discountAmount)
     */
    private double finalAmount;

    /**
     * Trạng thái đơn: PENDING, PAID, CANCELLED, EXPIRED, CHECKED_IN
     */
    @Builder.Default
    private String status = "PENDING";

    /**
     * Chuỗi mã vé QR sinh ra khi thanh toán thành công (PAID)
     */
    @Indexed
    private String qrCode;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Thời hạn giữ ghế (createdAt + 10 phút)
     */
    private LocalDateTime expiresAt;

    private LocalDateTime paidAt;

    private LocalDateTime checkedInAt;
}

