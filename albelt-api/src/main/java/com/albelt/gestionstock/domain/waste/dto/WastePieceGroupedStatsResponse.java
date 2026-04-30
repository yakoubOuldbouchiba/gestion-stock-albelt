package com.albelt.gestionstock.domain.waste.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for grouped roll statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WastePieceGroupedStatsResponse {
    private UUID colorId;
    private String colorName;
    private String colorHexCode;
    private Integer nbPlis;
    private BigDecimal thicknessMm;
    private MaterialType materialType;
    private UUID supplierId;
    private String supplierName;
    private UUID altierId;
    private String altierName;
    private WasteStatus status;
    private Long rollCount;
    private BigDecimal totalAreaM2;
    private BigDecimal totalWasteAreaM2;
}
