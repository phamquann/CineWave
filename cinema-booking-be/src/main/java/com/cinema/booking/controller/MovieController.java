package com.cinema.booking.controller;

import com.cinema.booking.dto.request.MovieRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.model.Movie;
import com.cinema.booking.service.MovieService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
@Tag(name = "2. Movie Management", description = "Quản lý Phim (Public xem danh sách, Admin Thêm/Sửa/Xóa)")
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    @Operation(summary = "Lấy danh sách phim (Public) - Có thể lọc theo status: COMING_SOON, NOW_SHOWING, ENDED")
    public ResponseEntity<ApiResponse<List<Movie>>> getAllMovies(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Danh sách phim", movieService.getAllMovies(status)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một bộ phim (Public)")
    public ResponseEntity<ApiResponse<Movie>> getMovieById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Chi tiết phim", movieService.getMovieById(id)));
    }

    @PostMapping
    @Operation(summary = "Thêm phim mới (Admin)")
    public ResponseEntity<ApiResponse<Movie>> createMovie(@Valid @RequestBody MovieRequest request) {
        Movie created = movieService.createMovie(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Thêm phim mới thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin phim (Admin)")
    public ResponseEntity<ApiResponse<Movie>> updateMovie(
            @PathVariable String id,
            @Valid @RequestBody MovieRequest request
    ) {
        Movie updated = movieService.updateMovie(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phim thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa phim (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa phim thành công", null));
    }
}

