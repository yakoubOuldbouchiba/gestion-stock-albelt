package com.albelt.gestionstock.domain.users.repository;

import com.albelt.gestionstock.domain.users.entity.UserAltier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for UserAltier - User to Workshop Location mappings
 */
@Repository
public interface UserAltierRepository extends JpaRepository<UserAltier, UUID> {

    /**
     * Find all altiers assigned to a user
     */
    @Query("SELECT ua.altier.id FROM UserAltier ua WHERE ua.user.id = ?1")
    List<UUID> findAltierIdsByUserId(UUID userId);

    /**
     * Find all altier assignments for a user with all relationships eagerly loaded
     */
    @Query("SELECT DISTINCT ua FROM UserAltier ua " +
            "LEFT JOIN FETCH ua.user " +
            "LEFT JOIN FETCH ua.altier " +
            "LEFT JOIN FETCH ua.assignedBy " +
            "WHERE ua.user.id = ?1")
    List<UserAltier> findByUserId(UUID userId);

    /**
     * Find all users assigned to an altier with all relationships eagerly loaded
     */
    @Query("SELECT DISTINCT ua FROM UserAltier ua " +
            "LEFT JOIN FETCH ua.user " +
            "LEFT JOIN FETCH ua.altier " +
            "LEFT JOIN FETCH ua.assignedBy " +
            "WHERE ua.altier.id = ?1")
    List<UserAltier> findByAltierId(UUID altierId);

    /**
     * Find UserAltier by ID with all relationships eagerly loaded
     */
    @Query("SELECT DISTINCT ua FROM UserAltier ua " +
            "LEFT JOIN FETCH ua.user " +
            "LEFT JOIN FETCH ua.altier " +
            "LEFT JOIN FETCH ua.assignedBy " +
            "WHERE ua.id = ?1")
    Optional<UserAltier> findByIdWithRelations(UUID id);

    /**
     * Check if user has access to altier
     */
    boolean existsByUserIdAndAltierId(UUID userId, UUID altierId);

    /**
     * Delete specific user-altier assignment
     */
    void deleteByUserIdAndAltierId(UUID userId, UUID altierId);
}
