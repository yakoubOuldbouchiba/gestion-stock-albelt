package com.albelt.gestionstock.domain.users.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * UserAltier entity - Maps users to workshop locations they can access
 * Allows fine-grained multi-location access control
 */
@Entity
@Table(name = "user_altier", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "altier_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAltier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "altier_id", nullable = false)
    private Altier altier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
}
