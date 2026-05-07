package com.albelt.gestionstock.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.albelt.gestionstock.shared.security.Roles;

/**
 * Utility endpoint for generating BCrypt password hashes.
 * FOR SETUP / TESTING ONLY — disable or remove this controller before going to production.
 * Path is /api/admin/hash (not "public") to ensure it never gets caught by a future permitAll wildcard.
 */
@RestController
@RequestMapping("/api/admin/hash")
@RequiredArgsConstructor
@PreAuthorize(Roles.ADMIN_OR_ABOVE)
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
