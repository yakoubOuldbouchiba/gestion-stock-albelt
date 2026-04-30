package com.albelt.gestionstock.shared.persistence;

import com.albelt.gestionstock.domain.articles.entity.Article;
import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class ArticleSnapshotEntity extends TimestampedEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "article_id")
    private Article article;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type", nullable = false)
    private MaterialType materialType;

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "thickness_mm", nullable = false, columnDefinition = "DECIMAL(8,3)")
    private BigDecimal thicknessMm;

    @PrePersist
    @PreUpdate
    protected void syncLegacyFieldsFromArticleLifecycle() {
        syncLegacyFieldsFromArticle();
    }

    public void setArticle(Article article) {
        this.article = article;
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

        onArticleSynchronized(article);
    }

    protected void onArticleSynchronized(Article article) {
    }

    protected MaterialType parseMaterialType(String value) {
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
