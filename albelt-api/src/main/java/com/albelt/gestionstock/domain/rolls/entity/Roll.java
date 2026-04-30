package com.albelt.gestionstock.domain.rolls.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.persistence.ReferencedArticleSnapshotEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

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
        @Index(name = "idx_rolls_created_by", columnList = "created_by"),
        @Index(name = "idx_rolls_article_id", columnList = "article_id"),
        @Index(name = "idx_rolls_lot_id", columnList = "lot_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class Roll extends ReferencedArticleSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "lot_id", nullable = false)
    private Integer lotId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

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

    @Column(name = "used_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal usedAreaM2 = BigDecimal.ZERO;

    @Column(name = "available_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal availableAreaM2 = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RollStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "altier_id")
    private Altier altier;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "total_cuts", nullable = false)
    @Builder.Default
    private Integer totalCuts = 0;

    @Column(name = "total_waste_area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    @Builder.Default
    private BigDecimal totalWasteAreaM2 = BigDecimal.ZERO;

    @Column(name = "last_processing_date")
    private LocalDateTime lastProcessingDate;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    public boolean hasEnoughArea(BigDecimal requiredArea) {
        BigDecimal available = this.availableAreaM2 != null ? this.availableAreaM2 : this.areaM2;
        return available != null && available.compareTo(requiredArea) >= 0;
    }

    public boolean isAvailableForCutting() {
        return RollStatus.AVAILABLE.equals(this.status) || RollStatus.OPENED.equals(this.status);
    }
}
