package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.dto.LoginRequest;
import com.albelt.gestionstock.api.dto.LoginResponse;
import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import com.albelt.gestionstock.shared.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());
        
        try {
            // Find user by username
            var userOpt = userService.getByUsername(request.getUsername());
            if (userOpt.isEmpty()) {
                log.warn("Login failed: User not found: {}", request.getUsername());
                return ResponseEntity.ok(ApiResponse.error("Invalid username or password"));
            }
            
            var user = userOpt.get();
            
            // Validate password
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                log.warn("Login failed: Invalid password for user: {}", request.getUsername());
                return ResponseEntity.ok(ApiResponse.error("Invalid username or password"));
            }
            
            // Check if user is active
            if (!user.getIsActive()) {
                log.warn("Login failed: User inactive: {}", request.getUsername());
                return ResponseEntity.ok(ApiResponse.error("User account is inactive"));
            }
            
            // Generate JWT token
            String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());
            
            log.info("JWT token generated for user: {} (ID: {})", user.getUsername(), user.getId());
            
            // Get altiers user has access to
            var altierIds = userAltierService.getAccessibleAltiers(user.getId());
            
            var response = LoginResponse.builder()
                    .token(token)
                    .user(user)
                    .altierIds(altierIds)
                    .build();
            
            return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity.ok(ApiResponse.error("Login failed: " + e.getMessage()));
        }
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
