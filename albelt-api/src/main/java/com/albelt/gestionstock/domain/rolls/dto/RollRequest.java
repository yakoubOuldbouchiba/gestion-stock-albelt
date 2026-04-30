package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating/updating rolls
 * Simplified schema aligned with clean V2 migration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollRequest {

    // Reception & Supplier
    @NotNull(message = "Received date is required")
    private LocalDate receivedDate;

    @NotNull(message = "Supplier ID is required")
    private UUID supplierId;

    // Material Specifications
    @NotNull(message = "Material type is required")
    private MaterialType materialType;

    @NotNull(message = "Number of plies is required")
    @Positive(message = "Number of plies must be greater than 0")
    private Integer nbPlis;

    @NotNull(message = "Thickness in mm is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Thickness must be greater than 0")
    private BigDecimal thicknessMm;

    // Dimensions (current state)
    @NotNull(message = "Width in mm is required")
    @Positive(message = "Width must be greater than 0")
    private Integer widthMm;

    @NotNull(message = "Length in meters is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Length must be greater than 0")
    private BigDecimal lengthM;

    @NotNull(message = "Area in m² is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal areaM2;

    // Remaining dimensions (optional updates)
    private Integer widthRemainingMm;
    private BigDecimal lengthRemainingM;

    // Status & Classification
    @NotNull(message = "Status is required")
    private RollStatus status;

    // External/Internal Reference
    private String reference;

    // Location (Altier) Reference
    private UUID altierId;

    // QR Code & Color
    private String qrCode;
    private UUID colorId;
}
