package com.albelt.gestionstock.domain.articles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleResponse {
    private UUID id;
    private String materialType;
    private BigDecimal thicknessMm;
    private Integer nbPlis;
    private String reference;
    private String name;
    private String code;
    private String externalId;
    private UUID colorId;
    private String colorName;
    private String colorHexCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
