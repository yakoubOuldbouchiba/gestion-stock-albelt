package com.albelt.gestionstock.shared.security;

import com.albelt.gestionstock.domain.users.repository.UserRepository;
import com.albelt.gestionstock.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Centralizes security context access for atelier-based data filtering.
 *
 * <p>Determines whether the current authenticated user has unrestricted data access
 * (ADMIN role — sees everything, including records with a null atelier) or must be
 * scoped to their assigned ateliers (OPERATOR, READONLY).</p>
 *
 * <p>Usage pattern in controllers/services:</p>
 * <pre>
 *   UUID userId = altierSecurityContext.getCurrentUserId();
 *   boolean unrestricted = altierSecurityContext.isUnrestricted(userId);
 *   List&lt;UUID&gt; altierIds = userAltierService.getAccessibleAltiers(userId);
 *   // pass both to the service/repository layer
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class AltierSecurityContext {

    private final UserRepository userRepository;

    /**
     * Returns the current authenticated user's ID extracted from the SecurityContext.
     * Assumes the JWT filter has already placed the user UUID as the authentication principal.
     */
    public UUID getCurrentUserId() {
        return (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Returns {@code true} if the user holds the ADMIN role, granting unrestricted
     * access to all records regardless of atelier assignment — including records
     * whose {@code altier_id} is {@code null}.
     *
     * @param userId the authenticated user's ID
     * @return {@code true} for ADMIN; {@code false} for OPERATOR and READONLY
     */
    public boolean isUnrestricted(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == UserRole.ADMIN)
                .orElse(false);
    }
}
