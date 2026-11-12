package com.cinema.booking.service;

import com.cinema.booking.config.JwtUtil;
import com.cinema.booking.dto.request.LoginRequest;
import com.cinema.booking.dto.request.RegisterRequest;
import com.cinema.booking.dto.response.AuthResponse;
import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.ForbiddenException;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.exception.UnauthorizedException;
import com.cinema.booking.model.User;
import com.cinema.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new SeatConflictException("Email đã tồn tại trong hệ thống");
        }

        String role = "CUSTOMER";
        if (request.getRole() != null && !request.getRole().isBlank()) {
            String requestedRole = request.getRole().trim().toUpperCase();
            if (List.of("CUSTOMER", "STAFF", "ADMIN").contains(requestedRole)) {
                role = requestedRole;
            }
        }

        String fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                ? request.getFullName().trim()
                : normalizedEmail.split("@")[0];

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(fullName)
                .phone(request.getPhone() != null ? request.getPhone().trim() : "")
                .role(role)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user);
        long exp = jwtUtil.extractExpirationEpochSeconds(token);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .role(user.getRole())
                .exp(exp)
                .user(user)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("Tài khoản của bạn đã bị khóa (isActive = false)");
        }

        String token = jwtUtil.generateToken(user);
        long exp = jwtUtil.extractExpirationEpochSeconds(token);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .role(user.getRole())
                .exp(exp)
                .user(user)
                .build();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUserActiveStatus(String userId, Boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        boolean nextStatus = (isActive != null) ? isActive : !user.isActive();
        user.setActive(nextStatus);
        return userRepository.save(user);
    }
}

