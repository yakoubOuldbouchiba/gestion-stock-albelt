package com.albelt.gestionstock.domain.settings.entity;

import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MaterialChuteThreshold entity
 * Stores per-material min/max width/length thresholds for future chute classification
 */
@Entity
@Table(name = "material_chute_thresholds", indexes = {
        @Index(name = "idx_material_chute_thresholds_material_type", columnList = "material_type", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialChuteThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false, unique = true)
    private MaterialType materialType;

    @Column(name = "min_width_mm", nullable = false)
    private Integer minWidthMm;

    @Column(name = "min_length_m", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal minLengthM;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
