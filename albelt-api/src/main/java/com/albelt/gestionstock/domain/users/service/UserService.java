package com.albelt.gestionstock.domain.users.service;

import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.repository.UserRepository;
import com.albelt.gestionstock.shared.enums.UserRole;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for User management
 * Authentication helpers and role-based access
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get user by ID
     */
    @Transactional(readOnly = true)
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.user(id.toString()));
    }

    /**
     * Get user by username
     */
    @Transactional(readOnly = true)
    public Optional<User> getByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Get user by email
     */
    @Transactional(readOnly = true)
    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Get all active users
     */
    @Transactional(readOnly = true)
    public List<User> getAllActive() {
        return userRepository.findAllActive();
    }

    /**
     * Get users by role
     */
    @Transactional(readOnly = true)
    public List<User> getByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    /**
     * Get all active operators (for work assignment)
     */
    @Transactional(readOnly = true)
    public List<User> getActiveOperators() {
        return userRepository.findActiveOperators();
    }

    /**
     * Update last login timestamp
     */
    public void updateLastLogin(UUID userId) {
        User user = getById(userId);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        log.debug("Updated last login for user: {}", userId);
    }

    /**
     * Check if username exists
     */
    @Transactional(readOnly = true)
    public boolean usernameExists(String username) {
        return userRepository.existsByUsernameIgnoreCase(username);
    }

    /**
     * Check if email exists
     */
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    /**
     * Deactivate user account
     */
    public void deactivateUser(UUID userId) {
        User user = getById(userId);
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", userId);
    }

    /**
     * Activate user account
     */
    public void activateUser(UUID userId) {
        User user = getById(userId);
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {}", userId);
    }

    /**
     * Change user role
     */
    public void changeRole(UUID userId, UserRole newRole) {
        User user = getById(userId);
        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        userRepository.save(user);
        log.info("User role changed: id={}, old_role={}, new_role={}", userId, oldRole, newRole);
    }
}
