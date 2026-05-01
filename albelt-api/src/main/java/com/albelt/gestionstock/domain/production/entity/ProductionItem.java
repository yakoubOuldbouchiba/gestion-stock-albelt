package com.albelt.gestionstock.domain.production.entity;

import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
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
 * ProductionItem entity - Represents produced pieces linked to a commande item
 */
@Entity
@Table(name = "production_items", indexes = {
        @Index(name = "idx_production_items_placed_rectangle_id", columnList = "placed_rectangle_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "placed_rectangle_id", nullable = false)
    private PlacedRectangle placedRectangle;

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

    @Column(name = "good_production", nullable = false)
    @Builder.Default
    private Boolean goodProduction = true;

    @Column(name = "production_miss", columnDefinition = "TEXT")
    private String productionMiss;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
