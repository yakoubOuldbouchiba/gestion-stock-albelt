package com.albelt.gestionstock.domain.optimization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "optimization_plans", indexes = {
    @Index(name = "idx_optimization_plans_item_status", columnList = "commande_item_id,status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "commande_item_id", nullable = false)
    private UUID commandeItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OptimizationPlanStatus status = OptimizationPlanStatus.ACTIVE;

    @Column(name = "algorithm_version", nullable = false, length = 20)
    @Builder.Default
    private String algorithmVersion = "v1";

    @Column(name = "rotation_allowed", nullable = false)
    @Builder.Default
    private Boolean rotationAllowed = Boolean.TRUE;

    @Column(name = "multi_source_allowed", nullable = false)
    @Builder.Default
    private Boolean multiSourceAllowed = Boolean.TRUE;

    @Column(name = "total_pieces", nullable = false)
    @Builder.Default
    private Integer totalPieces = 0;

    @Column(name = "placed_pieces", nullable = false)
    @Builder.Default
    private Integer placedPieces = 0;

    @Column(name = "source_count", nullable = false)
    @Builder.Default
    private Integer sourceCount = 0;

    @Column(name = "used_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal usedAreaM2 = BigDecimal.ZERO;

    @Column(name = "waste_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal wasteAreaM2 = BigDecimal.ZERO;

    @Column(name = "utilization_pct", nullable = false, columnDefinition = "DECIMAL(6,2)")
    @Builder.Default
    private BigDecimal utilizationPct = BigDecimal.ZERO;

    @Column(name = "svg", columnDefinition = "TEXT")
    private String svg;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
