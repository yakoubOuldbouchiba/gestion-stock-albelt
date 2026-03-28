package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.users.dto.UserAltierDTO;
import com.albelt.gestionstock.domain.users.entity.UserAltier;
import com.albelt.gestionstock.domain.users.mapper.UserAltierMapper;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import com.albelt.gestionstock.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for User-Altier (User-Location) management
 * Base path: /api/user-altiers
 * Requires ADMIN role for all operations
 */
@RestController
@RequestMapping("/api/user-altiers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class UserAltierController {

    private final UserAltierService userAltierService;
    private final UserAltierMapper userAltierMapper;

    /**
     * Get altiers assigned to a user
     * GET /api/user-altiers/user/{userId}
     * Only accessible to ADMIN users
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserAltierDTO>>> getAltiersByUser(@PathVariable UUID userId) {
        log.debug("ADMIN fetching altiers for user: {}", userId);
        List<UserAltier> assignments = userAltierService.getAltiersByUser(userId);
        List<UserAltierDTO> dtos = assignments.stream()
                .map(userAltierMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "User altier assignments retrieved"));
    }

    /**
     * Get users assigned to an altier
     * GET /api/user-altiers/altier/{altierId}
     * Only accessible to ADMIN users
     */
    @GetMapping("/altier/{altierId}")
    public ResponseEntity<ApiResponse<List<UserAltierDTO>>> getUsersByAltier(@PathVariable UUID altierId) {
        log.debug("ADMIN fetching users for altier: {}", altierId);
        List<UserAltier> assignments = userAltierService.getUsersByAltier(altierId);
        List<UserAltierDTO> dtos = assignments.stream()
                .map(userAltierMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos, "Altier user assignments retrieved"));
    }

    /**
     * Assign an altier to a user
     * POST /api/user-altiers/assign
     * Only accessible to ADMIN users
     */
    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<UserAltierDTO>> assignAltierToUser(
            @RequestParam UUID userId,
            @RequestParam UUID altierId) {
        log.info("ADMIN assigning altier {} to user {}", altierId, userId);
        
        UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserAltier assignment = userAltierService.assignAltier(userId, altierId, currentUser);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(userAltierMapper.toDTO(assignment), "Altier assigned to user successfully"));
    }

    /**
     * Unassign an altier from a user
     * DELETE /api/user-altiers/unassign
     * Only accessible to ADMIN users
     */
    @DeleteMapping("/unassign")
    public ResponseEntity<ApiResponse<Void>> unassignAltierFromUser(
            @RequestParam UUID userId,
            @RequestParam UUID altierId) {
        log.info("ADMIN unassigning altier {} from user {}", altierId, userId);
        userAltierService.unassignAltier(userId, altierId);
        return ResponseEntity.ok(ApiResponse.success(null, "Altier unassigned from user successfully"));
    }

    /**
     * Check if user has access to altier
     * GET /api/user-altiers/check-access
     * Only accessible to ADMIN users
     */
    @GetMapping("/check-access")
    public ResponseEntity<ApiResponse<Boolean>> checkAccess(
            @RequestParam UUID userId,
            @RequestParam UUID altierId) {
        boolean hasAccess = userAltierService.hasAccess(userId, altierId);
        return ResponseEntity.ok(ApiResponse.success(hasAccess, "Access check completed"));
    }
}
