package com.albelt.gestionstock.domain.waste.dto;

import com.albelt.gestionstock.domain.articles.dto.ArticleResponse;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning waste piece data in API responses
 * SAME STRUCTURE as RollResponse, with roll_id reference
 * Aligned with clean V2 migration schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WastePieceResponse {

    private UUID id;
    private Integer lotId;

    private UUID articleId;
    private ArticleResponse article;

    // Source Reference (ONLY DIFFERENCE from RollResponse)
    private UUID rollId;
    private UUID parentWastePieceId;

    // Material Specifications (same as Roll)
    private MaterialType materialType;
    private Integer nbPlis;
    private BigDecimal thicknessMm;

    // Dimensions (same as Roll)
    private Integer widthMm;
    private Integer widthRemainingMm;
    private BigDecimal lengthM;
    private BigDecimal lengthRemainingM;
    private BigDecimal areaM2;
    private BigDecimal usedAreaM2;
    private BigDecimal availableAreaM2;


    // Status & Classification (same as Roll)
    private String status;
    private WasteType wasteType;

    // Location (same as Roll)
    private UUID altierId;
    private String altierLibelle;

    private UUID supplierId;
    private String supplierName;

    private String qrCode;
    private UUID colorId;
    private String colorName;
    private String colorHexCode;

    // Processing tracking (same as Roll)
    private Integer totalCuts;
    private BigDecimal totalWasteAreaM2;
    private LocalDateTime lastProcessingDate;

    // Waste-specific tracking
    private UUID commandeItemId;
    private LocalDateTime classificationDate;

    // External/Internal Reference
    private String reference;

    // Audit
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
