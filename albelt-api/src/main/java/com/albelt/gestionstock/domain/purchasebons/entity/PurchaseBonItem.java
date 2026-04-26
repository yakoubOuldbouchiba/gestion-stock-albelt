package com.albelt.gestionstock.domain.purchasebons.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.articles.entity.Article;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
@Builder
public class PurchaseBonItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_bon_id", nullable = false)
    private PurchaseBon purchaseBon;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "article_id")
    private Article article;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType;

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "thickness_mm", nullable = false, columnDefinition = "DECIMAL(8,3)")
    private BigDecimal thicknessMm;

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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void syncLegacyFieldsFromArticleLifecycle() {
        syncLegacyFieldsFromArticle();
    }

    public MaterialType getMaterialType() {
        MaterialType fromArticle = parseMaterialType(article != null ? article.getMaterialType() : null);
        return fromArticle != null ? fromArticle : materialType;
    }

    public Integer getNbPlis() {
        return article != null && article.getNbPlis() != null ? article.getNbPlis() : nbPlis;
    }

    public BigDecimal getThicknessMm() {
        return article != null && article.getThicknessMm() != null ? article.getThicknessMm() : thicknessMm;
    }

    public void setArticle(Article article) {
        this.article = article;
        syncLegacyFieldsFromArticle();
    }

    public void syncLegacyFieldsFromArticle() {
        if (article == null) {
            return;
        }
        MaterialType articleMaterialType = parseMaterialType(article.getMaterialType());
        if (articleMaterialType != null) {
            this.materialType = articleMaterialType;
        }
        if (article.getNbPlis() != null) {
            this.nbPlis = article.getNbPlis();
        }
        if (article.getThicknessMm() != null) {
            this.thicknessMm = article.getThicknessMm();
        }
    }

    private MaterialType parseMaterialType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return MaterialType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
