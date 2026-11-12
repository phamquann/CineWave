package com.cinema.booking.controller;

import com.cinema.booking.dto.request.CreateShowtimeRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.service.ShowtimeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
@Tag(name = "3. Showtime & Seat Map", description = "Tạo suất chiếu (Check trùng lịch + Tự sinh 56 ghế) & Xem sơ đồ ghế thời gian thực")
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping
    @Operation(summary = "Xem danh sách lịch chiếu & Sơ đồ ghế (Public - kèm Lazy Expiration Check)")
    public ResponseEntity<ApiResponse<List<Showtime>>> getAllShowtimes(@RequestParam(required = false) String movieId) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách suất chiếu", showtimeService.getAllShowtimes(movieId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết suất chiếu & Sơ đồ ghế theo thời gian thực (Public)")
    public ResponseEntity<ApiResponse<Showtime>> getShowtimeById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Chi tiết suất chiếu và sơ đồ ghế", showtimeService.getShowtimeById(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo suất chiếu mới & Tự động sinh 56 ghế (Admin - Thuật toán 1: Check trùng giờ chiếu)")
    public ResponseEntity<ApiResponse<Showtime>> createShowtime(@Valid @RequestBody CreateShowtimeRequest request) {
        Showtime created = showtimeService.createShowtime(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Tạo suất chiếu và khởi tạo sơ đồ ghế thành công", created));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa suất chiếu (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteShowtime(@PathVariable String id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa suất chiếu thành công", null));
    }
}

