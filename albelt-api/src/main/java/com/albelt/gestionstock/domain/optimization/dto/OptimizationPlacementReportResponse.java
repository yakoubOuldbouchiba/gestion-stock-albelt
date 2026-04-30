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
public class OptimizationPlacementReportResponse {

    /**
     * "ROLL" or "WASTE_PIECE" (aligned with front-end placement source types).
     */
    private String sourceType;

    private String sourceId;

    private Integer xMm;
    private Integer yMm;
    private Integer widthMm;
    private Integer heightMm;

    /**
     * Suggested placements only (null for actual placements).
     */
    private Boolean rotated;
    private Integer pieceWidthMm;
    private BigDecimal pieceLengthM;
    private BigDecimal areaM2;

    /**
     * Placement color (actual placements usually have this).
     */
    private String placementColorName;
    private String placementColorHexCode;

    /**
     * Printable QR image for the placed rectangle/report row.
     */
    private String qrCode;
}
