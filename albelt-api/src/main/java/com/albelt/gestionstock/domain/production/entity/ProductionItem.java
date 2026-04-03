package com.albelt.gestionstock.domain.production.entity;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ProductionItem entity - Represents produced pieces linked to a commande item
 */
@Entity
@Table(name = "production_items", indexes = {
        @Index(name = "idx_production_items_commande_item_id", columnList = "commande_item_id"),
        @Index(name = "idx_production_items_roll_id", columnList = "roll_id"),
        @Index(name = "idx_production_items_waste_piece_id", columnList = "waste_piece_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_item_id", nullable = false)
    private CommandeItem commandeItem;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roll_id")
    private Roll roll;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "waste_piece_id")
    private WastePiece wastePiece;

    @Column(name = "piece_length_m", nullable = false, precision = 10, scale = 2)
    private BigDecimal pieceLengthM;

    @Column(name = "piece_width_mm", nullable = false)
    private Integer pieceWidthMm;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "area_per_piece_m2", nullable = false, precision = 12, scale = 4)
    private BigDecimal areaPerPieceM2;

    @Column(name = "total_area_m2", nullable = false, precision = 12, scale = 4)
    private BigDecimal totalAreaM2;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
