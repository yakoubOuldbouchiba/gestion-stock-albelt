package com.albelt.gestionstock.domain.rolls.entity;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
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
 * Roll entity - Core inventory unit in ALBEL system
 * FIFO-based inventory management (received_date drives selection)
 * Schema aligned with clean V2 migration structure
 */
@Entity
@Table(name = "rolls", indexes = {
        @Index(name = "idx_rolls_fifo_selection", columnList = "material_type,status,received_date ASC"),
        @Index(name = "idx_rolls_supplier_id", columnList = "supplier_id"),
        @Index(name = "idx_rolls_status", columnList = "status"),
        @Index(name = "idx_rolls_received_date", columnList = "received_date DESC"),
        @Index(name = "idx_rolls_material_status", columnList = "material_type,status"),
        @Index(name = "idx_rolls_altier_id", columnList = "altier_id"),
        @Index(name = "idx_rolls_created_by", columnList = "created_by")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Roll {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Reception & Supplier Info
    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    // Material Specifications
    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType;

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "thickness_mm", nullable = false, columnDefinition = "DECIMAL(8,3)")
    private BigDecimal thicknessMm;

    // Dimensions (current state - no "initial" suffix)
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

    // Status & Classification
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RollStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "waste_type")
    private WasteType wasteType;

    // Location & Tracking
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "altier_id")
    private Altier altier;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "original_quantity")
    private Integer originalQuantity;

    // Processing tracking (same as waste_pieces)
    @Column(name = "total_cuts", nullable = false)
    @Builder.Default
    private Integer totalCuts = 0;

    @Column(name = "total_waste_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal totalWasteAreaM2 = BigDecimal.ZERO;

    @Column(name = "last_processing_date")
    private LocalDateTime lastProcessingDate;

    // Audit
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Check if roll has enough area for a requested size
     */
    public boolean hasEnoughArea(BigDecimal requiredArea) {
        return this.areaM2 != null && this.areaM2.compareTo(requiredArea) >= 0;
    }

    /**
     * Check if roll is available for cutting
     */
    public boolean isAvailableForCutting() {
        return RollStatus.AVAILABLE.equals(this.status) || RollStatus.OPENED.equals(this.status);
    }
}
