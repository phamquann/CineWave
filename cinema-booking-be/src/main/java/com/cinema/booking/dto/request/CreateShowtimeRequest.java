package com.cinema.booking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateShowtimeRequest {
    @NotBlank(message = "movieId không được để trống")
    private String movieId;

    @NotBlank(message = "Phòng chiếu (roomName) không được để trống")
    private String roomName;

    private String format = "IMAX";

    @NotNull(message = "Thời gian bắt đầu (startTime) không được để trống")
    private LocalDateTime startTime;

    @Min(value = 50000, message = "Giá vé gốc (basePrice) tối thiểu là 50.000đ")
    private double basePrice;
}

