package com.albelt.gestionstock.domain.purchasebons.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.shared.persistence.ArticleSnapshotEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * PurchaseBonItem - Line item for bon d'achat.
 */
@Entity
@Table(name = "purchase_bon_items", indexes = {
        @Index(name = "idx_purchase_bon_items_bon_id", columnList = "purchase_bon_id"),
        @Index(name = "idx_purchase_bon_items_material", columnList = "material_type"),
        @Index(name = "idx_purchase_bon_items_article_id", columnList = "article_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PurchaseBonItem extends ArticleSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_bon_id", nullable = false)
    private PurchaseBon purchaseBon;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "length_m", nullable = false, columnDefinition = "DECIMAL(10,2)")
    private BigDecimal lengthM;

    @Column(name = "area_m2", nullable = false, columnDefinition = "DECIMAL(12,4)")
    private BigDecimal areaM2;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "color_id")
    private Color color;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "altier_id")
    private Altier altier;

    @Column(name = "qr_code")
    private String qrCode;
}
