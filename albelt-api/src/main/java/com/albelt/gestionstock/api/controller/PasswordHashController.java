package com.albelt.gestionstock.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Utility endpoint for generating BCrypt password hashes (for setup/testing only)
 */
@RestController
@RequestMapping("/api/public/hash")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PasswordHashController {

    private final PasswordEncoder passwordEncoder;

    /**
     * Generate BCrypt hash for a password
     * GET /api/public/hash?password=admin123
     */
    @GetMapping
    public PasswordHashResponse generateHash(@RequestParam String password) {
        String hash = passwordEncoder.encode(password);
        return new PasswordHashResponse(hash);
    }

    public record PasswordHashResponse(String hash) {
    }
}
