package com.albelt.gestionstock.domain.users.repository;

import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.shared.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity
 * Authentication and user management queries
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by username
     */
    Optional<User> findByUsername(String username);

    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);

    /**
     * Find all active users
     */
    @Query("SELECT u FROM User u WHERE u.isActive = true ORDER BY u.username ASC")
    List<User> findAllActive();

    /**
     * Find users by role
     */
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true ORDER BY u.fullName ASC")
    List<User> findByRole(@Param("role") UserRole role);

    /**
     * Find active operators (for cutting operations assignment)
     */
    @Query("SELECT u FROM User u WHERE u.role = 'OPERATOR' AND u.isActive = true ORDER BY u.fullName ASC")
    List<User> findActiveOperators();

    /**
     * Check if username exists
     */
    boolean existsByUsernameIgnoreCase(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Paged user search with optional filters
     */
    @Query("SELECT u FROM User u " +
           "WHERE (:search = '' OR " +
           "LOWER(u.username) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(u.email) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(u.fullName) LIKE CONCAT('%', :search, '%')) " +
           "AND (u.role = COALESCE(:role, u.role)) " +
           "AND (u.isActive = COALESCE(:isActive, u.isActive)) " +
           "AND (u.createdAt >= COALESCE(:fromDate, u.createdAt)) " +
           "AND (u.createdAt <= COALESCE(:toDate, u.createdAt))")
    Page<User> findFiltered(
            @Param("search") String search,
            @Param("role") UserRole role,
            @Param("isActive") Boolean isActive,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u " +
           "WHERE (:search = '' OR " +
           "LOWER(u.username) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(u.email) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(u.fullName) LIKE CONCAT('%', :search, '%')) " +
           "AND (u.role = COALESCE(:role, u.role)) " +
           "AND (u.isActive = COALESCE(:isActive, u.isActive)) " +
           "AND (u.createdAt >= COALESCE(:fromDate, u.createdAt)) " +
           "AND (u.createdAt <= COALESCE(:toDate, u.createdAt))")
    long countFiltered(
            @Param("search") String search,
            @Param("role") UserRole role,
            @Param("isActive") Boolean isActive,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate);
}
