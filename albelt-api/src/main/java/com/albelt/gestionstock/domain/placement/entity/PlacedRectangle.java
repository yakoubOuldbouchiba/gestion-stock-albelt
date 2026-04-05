package com.albelt.gestionstock.domain.placement.entity;

import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "placed_rectangles", indexes = {
        @Index(name = "idx_placed_rectangles_roll_id", columnList = "roll_id"),
        @Index(name = "idx_placed_rectangles_waste_piece_id", columnList = "waste_piece_id"),
        @Index(name = "idx_placed_rectangles_commande_item_id", columnList = "commande_item_id"),
        @Index(name = "idx_placed_rectangles_color_id", columnList = "color_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacedRectangle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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

    @Column(name = "commande_item_id")
    private UUID commandeItemId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "color_id")
    private Color color;

    @Column(name = "x_mm", nullable = false)
    private Integer xMm;

    @Column(name = "y_mm", nullable = false)
    private Integer yMm;

    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "height_mm", nullable = false)
    private Integer heightMm;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
