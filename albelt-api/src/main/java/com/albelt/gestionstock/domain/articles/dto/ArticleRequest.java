package com.albelt.gestionstock.domain.articles.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleRequest {
    @NotNull(message = "Material type is required")
    private MaterialType materialType;

    @NotNull(message = "Thickness is required")
    private BigDecimal thicknessMm;

    @NotNull(message = "Number of plis is required")
    private Integer nbPlis;

    private String reference;
    private String name;
    private String code;
    private String externalId;
    private UUID colorId;
}
