package com.albelt.gestionstock.domain.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationSourceReportResponse {

    /**
     * "ROLL" or "WASTE_PIECE" (aligned with front-end placement source types).
     */
    private String sourceType;

    private String sourceId;

    /**
     * Display label: "ROLL" or "CHUTE".
     */
    private String label;

    private String reference;
    private Integer lotId;
    private Integer nbPlis;
    private BigDecimal thicknessMm;

    private Integer widthMm;
    private BigDecimal lengthM;

    private String colorName;
    private String colorHexCode;

    /**
     * Usually a data URL like "data:image/png;base64,...".
     */
    private String qrCode;
}

