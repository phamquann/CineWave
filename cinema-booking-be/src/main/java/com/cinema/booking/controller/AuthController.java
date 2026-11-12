package com.cinema.booking.controller;

import com.cinema.booking.dto.request.LoginRequest;
import com.cinema.booking.dto.request.RegisterRequest;
import com.cinema.booking.dto.response.ApiResponse;
import com.cinema.booking.dto.response.AuthResponse;
import com.cinema.booking.model.User;
import com.cinema.booking.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "1. Auth & RBAC", description = "Đăng ký, Đăng nhập JWT, Khóa/Mở khóa tài khoản (Admin)")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/register")
    @Operation(summary = "Đăng ký tài khoản mới (Customer)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký tài khoản thành công", response));
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Đăng nhập (Customer, Staff, Admin) - Trả về JWT accessToken")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @GetMapping("/auth/me")
    @Operation(summary = "Lấy thông tin tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Thông tin người dùng hiện tại", currentUser));
    }

    @GetMapping({"/auth/users", "/users"})
    @Operation(summary = "Danh sách toàn bộ tài khoản (Admin)")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách người dùng", authService.getAllUsers()));
    }

    @PatchMapping({"/auth/users/{id}/status", "/users/{id}/status"})
    @PutMapping({"/auth/users/{id}/lock", "/users/{id}/lock"})
    @Operation(summary = "Khóa / Mở khóa tài khoản vi phạm (Admin) - Cập nhật isActive")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable String id,
            @RequestParam(required = false) Boolean isActive,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Boolean targetStatus = isActive;
        if (targetStatus == null && body != null && body.containsKey("isActive")) {
            Object val = body.get("isActive");
            if (val instanceof Boolean b) {
                targetStatus = b;
            } else if (val != null) {
                targetStatus = Boolean.parseBoolean(val.toString());
            }
        }
        User updatedUser = authService.updateUserActiveStatus(id, targetStatus);
        String msg = updatedUser.isActive()
                ? "Đã mở khóa tài khoản thành công (isActive = true)"
                : "Đã khóa tài khoản thành công (isActive = false)";
        return ResponseEntity.ok(ApiResponse.success(msg, updatedUser));
    }
}

