package com.albelt.gestionstock.domain.waste.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for creating/updating waste pieces
 * SAME STRUCTURE as Roll, with roll_id reference
 * Simplified to match clean V2 migration schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WastePieceRequest {

    // Source Reference (ONLY DIFFERENCE from RollRequest)
    @NotNull(message = "Roll ID is required")
    private UUID rollId;

    // Material Specifications (same as Roll)
    @NotNull(message = "Material type is required")
    private MaterialType materialType;

    @NotNull(message = "Number of plies is required")
    @Positive(message = "Number of plies must be greater than 0")
    private Integer nbPlis;

    @NotNull(message = "Thickness in mm is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Thickness must be greater than 0")
    private BigDecimal thicknessMm;

    // Dimensions (same as Roll)
    @NotNull(message = "Width in mm is required")
    @Positive(message = "Width must be greater than 0")
    private Integer widthMm;

    @NotNull(message = "Length in meters is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Length must be greater than 0")
    private BigDecimal lengthM;

    @NotNull(message = "Area in m² is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal areaM2;

    // Remaining dimensions (optional)
    private Integer widthRemainingMm;
    private BigDecimal lengthRemainingM;

    // Status & Classification (same as Roll)
    private String status; // AVAILABLE, OPENED, SCRAP, etc.

    private String wasteType; // CHUTE_EXPLOITABLE, DECHET

    // Location (same as Roll)
    private UUID altierID;
    private String qrCode;
    private UUID colorId;

    // Waste-specific tracking
    private UUID commandeItemId; // Link to specific order line
}
