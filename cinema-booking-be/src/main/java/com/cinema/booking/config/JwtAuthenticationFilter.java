package com.cinema.booking.config;

import com.cinema.booking.model.User;
import com.cinema.booking.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String userId = jwtUtil.extractUserId(token);
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            String email = jwtUtil.extractEmail(token);
            userOpt = userRepository.findByEmail(email);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Kịch bản Test quan trọng: Token hợp lệ nhưng tài khoản vừa bị Admin khóa (isActive = false) -> Chặn 403 Forbidden
            if (!user.isActive()) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                String body = String.format(
                        "{\"code\":403,\"message\":\"Tài khoản đã bị khóa (isActive = false). Bạn không có quyền thực hiện thao tác này.\",\"data\":null,\"timestamp\":\"%s\"}",
                        LocalDateTime.now()
                );
                response.getWriter().write(body);
                return;
            }

            String role = user.getRole() != null ? user.getRole().toUpperCase() : "CUSTOMER";
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}

