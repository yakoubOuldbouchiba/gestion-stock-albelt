package com.albelt.gestionstock.domain.returns.entity;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ReturnBonItem - Item-level return details.
 */
@Entity
@Table(name = "return_bon_items", indexes = {
        @Index(name = "idx_return_bon_items_bon_id", columnList = "return_bon_id"),
        @Index(name = "idx_return_bon_items_commande_item_id", columnList = "commande_item_id"),
        @Index(name = "idx_return_bon_items_production_item_id", columnList = "production_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnBonItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_bon_id", nullable = false)
    private ReturnBon returnBon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_item_id", nullable = false)
    private CommandeItem commandeItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_item_id")
    private ProductionItem productionItem;

    @Column(name = "return_type", nullable = false, length = 20)
    private String returnType; // MATIERE, MESURE

    @Column(name = "measure_action", length = 20)
    private String measureAction; // AJUST, DECHET

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "adjusted_width_mm")
    private Integer adjustedWidthMm;

    @Column(name = "adjusted_length_m", precision = 10, scale = 2)
    private BigDecimal adjustedLengthM;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
