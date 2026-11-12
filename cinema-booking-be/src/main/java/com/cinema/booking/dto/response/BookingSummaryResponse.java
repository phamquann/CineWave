package com.cinema.booking.dto.response;

import com.cinema.booking.model.Seat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingSummaryResponse {
    private String id;
    private String bookingId;
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
    private List<String> seatCodes;
    private List<Seat> seats;
    private double originalAmount;
    private String voucherCode;
    private double discountAmount;
    private double finalAmount;
    private String status;
    private String qrCode;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;
    private LocalDateTime checkedInAt;
}

