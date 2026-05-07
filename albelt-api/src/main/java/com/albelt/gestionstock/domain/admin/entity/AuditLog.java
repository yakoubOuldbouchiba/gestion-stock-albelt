package com.albelt.gestionstock.domain.admin.entity;

import com.albelt.gestionstock.shared.enums.AuditAction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persistent record of every admin / user-management action.
 * Mapped to the audit_logs table created in V50.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_logs_actor_id",      columnList = "actor_id"),
        @Index(name = "idx_audit_logs_action",        columnList = "action"),
        @Index(name = "idx_audit_logs_timestamp",     columnList = "timestamp DESC"),
        @Index(name = "idx_audit_logs_target_entity", columnList = "target_entity"),
        @Index(name = "idx_audit_logs_target_id",     columnList = "target_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The user who performed the action (null for unauthenticated events). */
    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_username", nullable = false, length = 100)
    private String actorUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 80)
    private AuditAction action;

    /** Entity class simple name, e.g. "User", "Role". */
    @Column(name = "target_entity", length = 100)
    private String targetEntity;

    /** Primary key of the target entity as string. */
    @Column(name = "target_id", length = 100)
    private String targetId;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    /** JSON string with additional context (before/after values, etc.). */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
}
