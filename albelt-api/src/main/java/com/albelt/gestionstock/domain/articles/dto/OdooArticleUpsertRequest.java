package com.albelt.gestionstock.domain.articles.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdooArticleUpsertRequest {

    private String externalId;
    private String materialType;
    private BigDecimal thicknessMm;
    private Integer nbPlis;
    private String reference;
    private String name;
    private String code;
}
