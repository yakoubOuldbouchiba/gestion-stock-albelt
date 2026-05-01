package com.albelt.gestionstock.domain.users.service;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.entity.UserAltier;
import com.albelt.gestionstock.domain.users.repository.UserAltierRepository;
import com.albelt.gestionstock.shared.enums.UserRole;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for User-Altier (User-Location) management
 * Handles multi-location access control
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserAltierService {

    private final UserAltierRepository userAltierRepository;
    private final UserService userService;
    private final AltierService altierService;

    /**
     * Get all altier IDs accessible by a user
     * Admin users can access all altiers
     */
    public List<UUID> getAccessibleAltiers(UUID userId) {
        User user = userService.getById(userId);

        // Admin users have access to all altiers
        if (user.getRole() == UserRole.ADMIN) {
            log.debug("User {} is ADMIN - returning all altiers", userId);
            return altierService.getAll().stream().map(Altier::getId).toList();
        }

        log.debug("Fetching altiers accessible by user: {}", userId);
        return userAltierRepository.findAltierIdsByUserId(userId);
    }

    /**
     * Assign an altier to a user
     */
    public UserAltier assignAltier(UUID userId, UUID altierId, UUID assignedBy) {
        User user = userService.getById(userId);
        Altier altier = altierService.getById(altierId);
        User admin = userService.getById(assignedBy);

        UserAltier userAltier = UserAltier.builder()
                .user(user)
                .altier(altier)
                .assignedBy(admin)
                .build();

        UserAltier saved = userAltierRepository.save(userAltier);

        // Re-fetch with eager loading to avoid lazy initialization issues
        UserAltier fetched = userAltierRepository.findByIdWithRelations(saved.getId())
                .orElseThrow(() -> new ResourceNotFoundException("UserAltier not found after creation"));

        log.info("Assigned altier {} to user {}", altierId, userId);
        return fetched;
    }

    /**
     * Unassign an altier from a user
     */
    public void unassignAltier(UUID userId, UUID altierId) {
        userAltierRepository.deleteByUserIdAndAltierId(userId, altierId);
        log.info("Unassigned altier {} from user {}", altierId, userId);
    }

    /**
     * Get all users assigned to an altier
     */
    public List<UserAltier> getUsersByAltier(UUID altierId) {
        return userAltierRepository.findByAltierId(altierId);
    }

    /**
     * Get all altier assignments for a user
     */
    public List<UserAltier> getAltiersByUser(UUID userId) {
        return userAltierRepository.findByUserId(userId);
    }

    /**
     * Check if user has access to altier
     */
    public boolean hasAccess(UUID userId, UUID altierId) {
        User user = userService.getById(userId);

        // Admin users have access to everything
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        return userAltierRepository.existsByUserIdAndAltierId(userId, altierId);
    }
}
