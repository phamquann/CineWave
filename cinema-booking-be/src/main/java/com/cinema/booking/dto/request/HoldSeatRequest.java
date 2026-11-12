package com.cinema.booking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoldSeatRequest {
    @NotBlank(message = "showtimeId không được để trống")
    private String showtimeId;

    @NotEmpty(message = "Danh sách ghế không được để trống")
    @Size(min = 1, max = 8, message = "Chỉ được chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch")
    private List<String> seatCodes;
}

