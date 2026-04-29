package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.dto.LoginRequest;
import com.albelt.gestionstock.api.dto.LoginResponse;
import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import com.albelt.gestionstock.shared.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Authentication
 * Base path: /api/auth
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final UserAltierService userAltierService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        var userOpt = userService.getByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            log.warn("Login failed: User not found: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        }

        var user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: Invalid password for user: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Login failed: User inactive: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("User account is inactive"));
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());
        userService.updateLastLogin(user.getId());

        var response = LoginResponse.builder()
                .token(token)
                .user(userMapper.toDTO(user))
                .altierIds(userAltierService.getAccessibleAltiers(user.getId()))
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    /**
     * Health check endpoint
     * GET /api/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("OK", "Auth service is healthy"));
    }
}
