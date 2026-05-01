package com.albelt.gestionstock.domain.optimization.entity;

import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "optimization_placements", indexes = {
        @Index(name = "idx_optimization_placements_plan_id", columnList = "plan_id"),
        @Index(name = "idx_optimization_placements_roll_id", columnList = "roll_id"),
        @Index(name = "idx_optimization_placements_waste_id", columnList = "waste_piece_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationPlacement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private OptimizationPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 10)
    private OptimizationSourceType sourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roll_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Roll roll;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waste_piece_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private WastePiece wastePiece;

    @Column(name = "x_mm", nullable = false)
    private Integer xMm;

    @Column(name = "y_mm", nullable = false)
    private Integer yMm;

    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "height_mm", nullable = false)
    private Integer heightMm;

    @Column(name = "rotated", nullable = false)
    @Builder.Default
    private Boolean rotated = Boolean.FALSE;

    @Column(name = "piece_width_mm", nullable = false)
    private Integer pieceWidthMm;

    @Column(name = "piece_length_m", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal pieceLengthM;

    @Column(name = "area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    private BigDecimal areaM2;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
