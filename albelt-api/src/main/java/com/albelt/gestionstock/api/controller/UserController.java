package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for User management
 * Base path: /api/users
 * Authentication helpers and role-based access
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    /**
     * Get users with pagination and filters
     * GET /api/users?page={page}&size={size}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<User>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.debug("Fetching users with pagination");
        Boolean isActive = parseStatus(status);
        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        var users = userService.getAllPaged(search, role, isActive, fromDate, toDate, page, size);
        var paged = PagedResponse.<User>builder()
                .items(users.getContent())
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    /**
     * Count users with optional filters
     * GET /api/users/stats/count
     */
    @GetMapping("/stats/count")
    public ResponseEntity<ApiResponse<Long>> count(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        Boolean isActive = parseStatus(status);
        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        long count = userService.countFiltered(search, role, isActive, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(count));
    }


    private final UserService userService;

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getById(@PathVariable UUID id) {
        log.debug("Fetching user: {}", id);
        var user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Get user by username
     * GET /api/users/search/username?username={username}
     */
    @GetMapping("/search/username")
    public ResponseEntity<ApiResponse<User>> getByUsername(@RequestParam String username) {
        log.debug("Searching user by username: {}", username);
        var userOpt = userService.getByUsername(username);
        
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(userOpt.get()));
        }
        return ResponseEntity.ok(ApiResponse.error("User not found: " + username));
    }

    /**
     * Get all active users
     * GET /api/users/active
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<User>>> getAllActive() {
        log.debug("Fetching active users");
        var users = userService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Get users by role
     * GET /api/users/by-role?role={role}
     */
    @GetMapping("/by-role")
    public ResponseEntity<ApiResponse<List<User>>> getByRole(@RequestParam UserRole role) {
        log.debug("Fetching users by role: {}", role);
        var users = userService.getByRole(role);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Get all active operators (for work assignment)
     * GET /api/users/operators
     */
    @GetMapping("/operators")
    public ResponseEntity<ApiResponse<List<User>>> getActiveOperators() {
        log.debug("Fetching active operators");
        var users = userService.getActiveOperators();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Deactivate user account
     * PATCH /api/users/{id}/deactivate
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable UUID id) {
        log.info("Deactivating user: {}", id);
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated"));
    }

    /**
     * Activate user account
     * PATCH /api/users/{id}/activate
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable UUID id) {
        log.info("Activating user: {}", id);
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User activated"));
    }

    /**
     * Change user role
     * PATCH /api/users/{id}/role?newRole={role}
     */
    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(
            @PathVariable UUID id,
            @RequestParam UserRole newRole) {
        log.info("Changing user role: id={}, newRole={}", id, newRole);
        userService.changeRole(id, newRole);
        return ResponseEntity.ok(ApiResponse.success(null, "User role changed"));
    }

    private Boolean parseStatus(String status) {
        if (status == null || status.trim().isEmpty()) return null;
        String normalized = status.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) return true;
        if ("INACTIVE".equals(normalized)) return false;
        return null;
    }

    private java.time.LocalDateTime parseDateStart(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atStartOfDay();
    }

    private java.time.LocalDateTime parseDateEnd(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atTime(23, 59, 59);
    }
}
