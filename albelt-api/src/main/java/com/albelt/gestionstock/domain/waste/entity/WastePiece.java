package com.albelt.gestionstock.domain.waste.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.persistence.ReferencedArticleSnapshotEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WastePiece entity - Byproduct tracking from roll processing
 * Waste pieces inherit material specifications and dimensions, tracked as reusable inventory.
 */
@Entity
@Table(name = "waste_pieces", indexes = {
    @Index(name = "idx_waste_pieces_roll_id", columnList = "roll_id"),
    @Index(name = "idx_waste_pieces_parent_id", columnList = "parent_waste_piece_id"),
    @Index(name = "idx_waste_pieces_material_type", columnList = "material_type"),
    @Index(name = "idx_waste_pieces_status", columnList = "status"),
    @Index(name = "idx_waste_pieces_commande_item", columnList = "commande_item_id"),
    @Index(name = "idx_waste_pieces_created_by", columnList = "created_by"),
    @Index(name = "idx_waste_pieces_altier_id", columnList = "altier_id"),
    @Index(name = "idx_waste_pieces_article_id", columnList = "article_id"),
    @Index(name = "idx_waste_pieces_lot_id", columnList = "lot_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class WastePiece extends ReferencedArticleSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "lot_id", nullable = false)
    private Integer lotId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roll_id", nullable = false)
    private Roll roll;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_waste_piece_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private WastePiece parentWastePiece;

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
    private WasteStatus status;

    @Column(name = "waste_type", length = 50)
    @Enumerated(EnumType.STRING)
    private WasteType wasteType;

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

    @Column(name = "commande_item_id")
    private UUID commandeItemId;

    @Column(name = "classification_date")
    private LocalDateTime classificationDate;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    public boolean isLargeWaste() {
        BigDecimal available = this.availableAreaM2 != null ? this.availableAreaM2 : this.areaM2;
        return available != null && available.compareTo(BigDecimal.valueOf(3.0)) >= 0;
    }

    public boolean isReuseCandidate() {
        return (WasteStatus.AVAILABLE.equals(this.status) || WasteStatus.OPENED.equals(this.status))
               && this.isLargeWaste();
    }

    public void markAsArchived(LocalDate classificationDate) {
        this.status = WasteStatus.ARCHIVED;
        this.classificationDate = classificationDate != null ? classificationDate.atStartOfDay() : LocalDateTime.now();
    }
}
