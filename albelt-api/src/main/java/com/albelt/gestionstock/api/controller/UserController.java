package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.users.dto.ChangePasswordRequest;
import com.albelt.gestionstock.domain.users.dto.CreateUserRequest;
import com.albelt.gestionstock.domain.users.dto.UpdateUserRequest;
import com.albelt.gestionstock.domain.users.dto.UserDTO;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.shared.enums.UserRole;
import com.albelt.gestionstock.shared.security.AltierSecurityContext;
import com.albelt.gestionstock.shared.security.Roles;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
    private final UserService userService;
    private final UserMapper userMapper;
    private final AltierSecurityContext altierSecurityContext;

    /**
     * Get users with pagination and filters
     * GET /api/users?page={page}&size={size}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserDTO>>> getAll(
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
        var paged = PagedResponse.<UserDTO>builder()
                .items(users.getContent().stream().map(userMapper::toDTO).toList())
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

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable UUID id) {
        log.debug("Fetching user: {}", id);
        var user = userService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDTO(user)));
    }

    /**
     * Get user by username
     * GET /api/users/search/username?username={username}
     */
    @GetMapping("/search/username")
    public ResponseEntity<ApiResponse<UserDTO>> getByUsername(@RequestParam String username) {
        log.debug("Searching user by username: {}", username);
        var userOpt = userService.getByUsername(username);

        if (userOpt.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(userMapper.toDTO(userOpt.get())));
        }
        return ResponseEntity.ok(ApiResponse.error("User not found: " + username));
    }

    /**
     * Get all active users
     * GET /api/users/active
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllActive() {
        log.debug("Fetching active users");
        var users = userService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(users.stream().map(userMapper::toDTO).toList()));
    }

    /**
     * Get users by role
     * GET /api/users/by-role?role={role}
     */
    @GetMapping("/by-role")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getByRole(@RequestParam UserRole role) {
        log.debug("Fetching users by role: {}", role);
        var users = userService.getByRole(role);
        return ResponseEntity.ok(ApiResponse.success(users.stream().map(userMapper::toDTO).toList()));
    }

    /**
     * Get all active operators (for work assignment)
     * GET /api/users/operators
     */
    @GetMapping("/operators")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getActiveOperators() {
        log.debug("Fetching active operators");
        var users = userService.getActiveOperators();
        return ResponseEntity.ok(ApiResponse.success(users.stream().map(userMapper::toDTO).toList()));
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
     * Change user role.
     * Restricted to SUPER_ADMIN to prevent an ADMIN from self-promoting to SUPER_ADMIN.
     * PATCH /api/users/{id}/role?newRole={role}
     */
    @PreAuthorize(Roles.SUPER_ADMIN_ONLY)
    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(
            @PathVariable UUID id,
            @RequestParam UserRole newRole) {
        log.info("Changing user role: id={}, newRole={}", id, newRole);
        userService.changeRole(id, newRole);
        return ResponseEntity.ok(ApiResponse.success(null, "User role changed"));
    }

    /**
     * Create a new user
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("Creating user: {}", request.getUsername());
        var user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userMapper.toDTO(user), "User created"));
    }

    /**
     * Update an existing user
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("Updating user: {}", id);
        var user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toDTO(user), "User updated"));
    }

    /**
     * Admin password reset
     * PATCH /api/users/{id}/password
     */
    @PatchMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("Admin resetting password for user: {}", id);
        userService.adminResetPassword(id, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }

    /**
     * Self-service password change (uses currentPassword verification).
     * Any authenticated user may change their own password.
     * PATCH /api/users/me/password
     */
    @PreAuthorize(Roles.AUTHENTICATED)
    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changeOwnPassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = altierSecurityContext.getCurrentUserId();
        log.info("User changing own password: {}", userId);
        userService.changeOwnPassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    /**
     * Toggle user active status
     * PATCH /api/users/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable UUID id,
            @RequestParam boolean active) {
        log.info("Toggling user status: id={}, active={}", id, active);
        if (active) {
            userService.activateUser(id);
        } else {
            userService.deactivateUser(id);
        }
        return ResponseEntity.ok(ApiResponse.success(null, active ? "User activated" : "User deactivated"));
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
