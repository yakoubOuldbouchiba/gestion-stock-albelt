package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning roll data in API responses
 * Aligned with clean V2 migration schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollResponse {

    private UUID id;

    // Reception & Supplier
    private LocalDate receivedDate;
    private UUID supplierId;
    private String supplierName;

    // Material Specifications
    private MaterialType materialType;
    private Integer nbPlis;
    private BigDecimal thicknessMm;

    // Dimensions (current state)
    private Integer widthMm;
    private Integer widthRemainingMm;
    private BigDecimal lengthM;
    private BigDecimal lengthRemainingM;
    private BigDecimal areaM2;

    // Status & Classification
    private RollStatus status;
    // Location (Altier) Reference
    private UUID altierId;
    private String altierLibelle;

    // QR Code & Original Quantity
    private String qrCode;
    private Integer originalQuantity;

    // Processing tracking
    private Integer totalCuts;
    private BigDecimal totalWasteAreaM2;
    private LocalDateTime lastProcessingDate;

    // Audit
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Convenience flag for FIFO context
    private boolean availableForCutting;
}
