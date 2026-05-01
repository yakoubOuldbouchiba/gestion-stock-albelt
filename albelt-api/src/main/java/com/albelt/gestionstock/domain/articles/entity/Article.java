package com.albelt.gestionstock.domain.articles.entity;

import com.albelt.gestionstock.domain.colors.entity.Color;
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

@Entity
@Table(name = "articles", indexes = {
        @Index(name = "idx_articles_external_id", columnList = "external_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "material_type", nullable = false, length = 20)
    private String materialType;

    @Column(name = "thickness_mm", nullable = false, precision = 8, scale = 3)
    private BigDecimal thicknessMm;

    @Column(name = "nb_plis", nullable = false)
    private Integer nbPlis;

    @Column(name = "reference", nullable = false, length = 100)
    @Builder.Default
    private String reference = "";

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "code", length = 100)
    private String code;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id")
    private Color color;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public String getReference() {
        if (reference == null) {
            return null;
        }
        String trimmed = reference.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
