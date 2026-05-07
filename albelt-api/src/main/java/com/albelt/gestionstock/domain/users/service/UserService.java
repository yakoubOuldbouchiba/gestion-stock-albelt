package com.albelt.gestionstock.domain.users.service;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.repository.AltierRepository;
import com.albelt.gestionstock.domain.users.dto.ChangePasswordRequest;
import com.albelt.gestionstock.domain.users.dto.CreateUserRequest;
import com.albelt.gestionstock.domain.users.dto.UpdateUserRequest;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.repository.UserRepository;
import com.albelt.gestionstock.shared.audit.Audited;
import com.albelt.gestionstock.shared.enums.AuditAction;
import com.albelt.gestionstock.shared.enums.UserRole;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;
    private final AltierRepository altierRepository;

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
     * Get users with pagination and optional filters
     */
    @Transactional(readOnly = true)
    public Page<User> getAllPaged(String search, UserRole role, Boolean isActive,
                                  LocalDateTime fromDate, LocalDateTime toDate, int page, int size) {
        String normalizedSearch = normalize(search);
        LocalDateTime safeFromDate = fromDate != null ? fromDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime safeToDate = toDate != null ? toDate : LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findFiltered(normalizedSearch, role, isActive, safeFromDate, safeToDate, pageable);
    }

    @Transactional(readOnly = true)
    public long countFiltered(String search, UserRole role, Boolean isActive,
                              LocalDateTime fromDate, LocalDateTime toDate) {
        String normalizedSearch = normalize(search);
        LocalDateTime safeFromDate = fromDate != null ? fromDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime safeToDate = toDate != null ? toDate : LocalDateTime.of(2100, 1, 1, 0, 0);
        return userRepository.countFiltered(normalizedSearch, role, isActive, safeFromDate, safeToDate);
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
    @Audited(action = AuditAction.USER_DEACTIVATED, entity = "User", idExpression = "#userId.toString()")
    public void deactivateUser(UUID userId) {
        User user = getById(userId);
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", userId);
    }

    /**
     * Activate user account
     */
    @Audited(action = AuditAction.USER_ACTIVATED, entity = "User", idExpression = "#userId.toString()")
    public void activateUser(UUID userId) {
        User user = getById(userId);
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {}", userId);
    }

    /**
     * Change user role
     */
    @Audited(action = AuditAction.USER_ROLE_CHANGED, entity = "User", idExpression = "#userId.toString()")
    public void changeRole(UUID userId, UserRole newRole) {
        User user = getById(userId);
        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        userRepository.save(user);
        log.info("User role changed: id={}, old_role={}, new_role={}", userId, oldRole, newRole);
    }

    private String normalize(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed.toLowerCase();
    }

    // ------------------------------------------------------------------ admin

    /**
     * Create a new user (admin operation).
     */
    @Audited(action = AuditAction.USER_CREATED, entity = "User")
    public User createUser(CreateUserRequest req) {
        if (userRepository.existsByUsernameIgnoreCase(req.getUsername())) {
            throw new BusinessException("Username already exists: " + req.getUsername());
        }
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            throw new BusinessException("Email already exists: " + req.getEmail());
        }

        Altier altier = null;
        if (req.getPrimaryAltierId() != null) {
            altier = altierRepository.findById(req.getPrimaryAltierId())
                    .orElseThrow(() -> ResourceNotFoundException.forEntity("Altier", req.getPrimaryAltierId().toString()));
        }

        User user = User.builder()
                .username(req.getUsername().trim())
                .email(req.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(req.getRole())
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .primaryAltier(altier)
                .build();

        User saved = userRepository.save(user);
        log.info("User created by admin: id={}, username={}", saved.getId(), saved.getUsername());
        return saved;
    }

    /**
     * Update an existing user's mutable fields (admin operation).
     */
    @Audited(action = AuditAction.USER_UPDATED, entity = "User", idExpression = "#id.toString()")
    public User updateUser(UUID id, UpdateUserRequest req) {
        User user = getById(id);

        if (req.getEmail() != null) {
            String normalizedEmail = req.getEmail().trim().toLowerCase();
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new BusinessException("Email already in use: " + normalizedEmail);
            }
            user.setEmail(normalizedEmail);
        }

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName());
        }
        if (req.getRole() != null) {
            user.setRole(req.getRole());
        }
        if (req.getIsActive() != null) {
            user.setIsActive(req.getIsActive());
        }
        if (req.getPrimaryAltierId() != null) {
            Altier altier = altierRepository.findById(req.getPrimaryAltierId())
                    .orElseThrow(() -> ResourceNotFoundException.forEntity("Altier", req.getPrimaryAltierId().toString()));
            user.setPrimaryAltier(altier);
        }

        User saved = userRepository.save(user);
        log.info("User updated by admin: id={}", id);
        return saved;
    }

    /**
     * Admin-initiated password reset (no current-password check).
     */
    @Audited(action = AuditAction.USER_PASSWORD_RESET, entity = "User", idExpression = "#userId.toString()")
    public void adminResetPassword(UUID userId, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new BusinessException("Password must be at least 8 characters");
        }
        User user = getById(userId);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password reset by admin for user: {}", userId);
    }

    /**
     * Self-service password change (requires current password verification).
     */
    @Audited(action = AuditAction.USER_PASSWORD_CHANGED, entity = "User", idExpression = "#userId.toString()")
    public void changeOwnPassword(UUID userId, ChangePasswordRequest req) {
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new BusinessException("New password and confirmation do not match");
        }
        User user = getById(userId);
        if (req.getCurrentPassword() != null
                && !passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", userId);
    }
}
