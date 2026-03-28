package com.albelt.gestionstock.domain.waste.entity;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WastePiece entity - Byproduct tracking from roll processing
 * SAME STRUCTURE as Roll, plus roll_id reference
 * Waste pieces inherit material specifications and dimensions, tracked as reusable inventory
 */
@Entity
@Table(name = "waste_pieces", indexes = {
        @Index(name = "idx_waste_pieces_roll_id", columnList = "roll_id"),
        @Index(name = "idx_waste_pieces_material_type", columnList = "material_type"),
        @Index(name = "idx_waste_pieces_status", columnList = "status"),
        @Index(name = "idx_waste_pieces_commande_item", columnList = "commande_item_id"),
        @Index(name = "idx_waste_pieces_created_by", columnList = "created_by"),
        @Index(name = "idx_waste_pieces_altier_id", columnList = "altier_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WastePiece {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Source Reference (ONLY DIFFERENCE from rolls)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roll_id", nullable = false)
    private Roll roll;

    // Material Specifications (same as rolls)
    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType;

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "thickness_mm", nullable = false, columnDefinition = "DECIMAL(8,3)")
    private BigDecimal thicknessMm;

    // Dimensions (same as rolls)
    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "width_remaining_mm")
    private Integer widthRemainingMm;

    @Column(name = "length_m", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal lengthM;

    @Column(name = "length_remaining_m", columnDefinition = "DECIMAL(10,2)")
    private BigDecimal lengthRemainingM;

    @Column(name = "area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    private BigDecimal areaM2;

    // Status & Classification (same as rolls)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WasteStatus status;

    @Column(name = "waste_type", length = 50)
    private String wasteType; // NORMAL, CHUTE_EXPLOITABLE, DECHET

    // Location & Tracking (same as rolls)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "altier_id")
    private Altier altier;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "original_quantity")
    private String originalQuantity;

    // Processing tracking (same as rolls)
    @Column(name = "total_cuts", nullable = false)
    @Builder.Default
    private Integer totalCuts = 0;

    @Column(name = "total_waste_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal totalWasteAreaM2 = BigDecimal.ZERO;

    @Column(name = "last_processing_date")
    private LocalDateTime lastProcessingDate;

    // Waste-specific tracking
    @Column(name = "commande_item_id")
    private UUID commandeItemId;

    @Column(name = "classification_date")
    private LocalDateTime classificationDate;

    // Audit (same as rolls)
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Check if waste piece is large enough for reuse (> 3m²)
     */
    public boolean isLargeWaste() {
        return this.areaM2 != null && this.areaM2.compareTo(BigDecimal.valueOf(3.0)) >= 0;
    }

    /**
     * Check if waste piece can potentially be reused
     */
    public boolean isReuseCandidate() {
        return (WasteStatus.AVAILABLE.equals(this.status) || WasteStatus.RESERVED.equals(this.status)) &&
               this.isLargeWaste();
    }

    /**
     * Mark waste piece as scrap and update classification date
     */
    public void markAsScrap(LocalDate classificationDate) {
        this.status = WasteStatus.SCRAP;
        this.classificationDate = classificationDate != null ? classificationDate.atStartOfDay() : LocalDateTime.now();
    }
}
