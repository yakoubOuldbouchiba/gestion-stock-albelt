package com.albelt.gestionstock.domain.altier.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Altier entity - Represents physical workshop locations in ALBEL system
 */
@Entity
@Table(name = "altier", indexes = {
        @Index(name = "idx_altier_libelle", columnList = "libelle"),
        @Index(name = "idx_altier_created_at", columnList = "created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Altier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "libelle", nullable = false, unique = true)
    private String libelle;

    @Column(name = "adresse", nullable = false)
    private String adresse;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
