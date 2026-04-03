package com.albelt.gestionstock.domain.commandes.entity;

import com.albelt.gestionstock.domain.colors.entity.Color;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CommandeItem Entity - Represents a line item in an order
 */
@Entity
@Table(name = "commande_items", indexes = {
        @Index(name = "idx_commande_items_commande_id", columnList = "commande_id"),
        @Index(name = "idx_commande_items_roll_id", columnList = "roll_id"),
        @Index(name = "idx_commande_items_status", columnList = "status"),
        @Index(name = "idx_commande_items_type_mouvement", columnList = "type_mouvement"),
    @Index(name = "idx_commande_items_material_type", columnList = "material_type"),
    @Index(name = "idx_commande_items_color_id", columnList = "color_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    // Material Specifications
    @Column(name = "material_type", nullable = false, length = 20)
    private String materialType;  // PU, PVC, CAOUTCHOUC

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "thickness_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal thicknessMm;

    // Dimensions
    @Column(name = "longueur_m", nullable = false, precision = 10, scale = 2)
    private BigDecimal longueurM;

    @Column(name = "longueur_tolerance_m", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal longueurToleranceM = BigDecimal.ZERO;

    @Column(name = "largeur_mm", nullable = false)
    private Integer largeurMm;

    // Quantity & Consumption
    @Column(name = "quantite", nullable = false)
    private Integer quantite;

    @Column(name = "surface_consommee_m2", nullable = false, precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal surfaceConsommeeM2 = BigDecimal.ZERO;

    // Movement Type
    @Column(name = "type_mouvement", nullable = false, length = 50)
    private String typeMouvement;  // ENCOURS, COUPE, SORTIE, RETOUR

    // Status
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";  // PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    // Additional Info
    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "reference", length = 100)
    private String reference;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "color_id")
    private Color color;

    // Sequence
    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    // Roll processing tracking (simplified workflow)
    @Column(name = "last_roll_used_id")
    private UUID lastRollUsedId; // Last roll used to process this item

    @Column(name = "processing_date")
    private LocalDateTime processingDate; // When this item was last processed

    @Column(name = "waste_created_m2", precision = 12, scale = 4)
    @Builder.Default
    private BigDecimal wasteCreatedM2 = BigDecimal.ZERO; // Total waste created for this item

    @Column(name = "total_items_conforme", nullable = false)
    @Builder.Default
    private Integer totalItemsConforme = 0;

    @Column(name = "total_items_non_conforme", nullable = false)
    @Builder.Default
    private Integer totalItemsNonConforme = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
