package com.albelt.gestionstock.domain.cutting.entity;

import com.albelt.gestionstock.domain.rolls.entity.Roll;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CuttingOperation entity - DEPRECATED
 * No longer used - workflow simplified to direct Roll → Waste → Commande linkage
 * Kept for reference only. Table removed in V22 migration.
 */
// @Entity
// @Table(name = "cutting_operations", indexes = {
//        @Index(name = "idx_cutting_operations_roll_id", columnList = "roll_id"),
//        @Index(name = "idx_cutting_operations_operator_id", columnList = "operator_id"),
//        @Index(name = "idx_cutting_operations_timestamp", columnList = "timestamp DESC"),
//        @Index(name = "idx_cutting_operations_roll_timestamp", columnList = "roll_id,timestamp DESC")
// })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuttingOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roll_id", nullable = false)
    private Roll roll;

    @Column(name = "commande_item_id")
    private UUID commandeItemId; // Reference to order item being cut

    @Column(name = "pieces_requested", columnDefinition = "TEXT", nullable = false)
    private String piecesRequested; // JSON array: [{"width":400,"length":500,"qty":3}, ...]

    @Column(name = "nesting_result", columnDefinition = "TEXT", nullable = false)
    private String nestingResult; // JSON object: calculated layout and placements

    @Column(name = "final_utilization_pct", columnDefinition = "DECIMAL(5,2)", nullable = false)
    private BigDecimal finalUtilizationPct; // 0-100%

    @Column(name = "final_waste_area_m2", columnDefinition = "DECIMAL(12,4)")
    private BigDecimal finalWasteAreaM2;

    @Column(name = "final_waste_kg")
    private BigDecimal finalWasteKg;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "COMPLETED"; // PREPARED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED

    @Column(name = "operator_id", nullable = false)
    private UUID operatorId;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "visualization_svg", columnDefinition = "TEXT")
    private String visualizationSvg; // SVG rendering for audit

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void setDefaultTimestamp() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    /**
     * Check if cutting was highly efficient (>75% utilization)
     */
    public boolean isHighEfficiency() {
        return this.finalUtilizationPct != null &&
                this.finalUtilizationPct.compareTo(BigDecimal.valueOf(75)) >= 0;
    }

    /**
     * Check if significant waste was generated
     */
    public boolean hasSignificantWaste() {
        return this.finalWasteAreaM2 != null &&
                this.finalWasteAreaM2.compareTo(BigDecimal.valueOf(3.0)) >= 0;
    }
}
