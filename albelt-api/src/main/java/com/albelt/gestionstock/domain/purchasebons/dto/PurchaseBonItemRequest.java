package com.albelt.gestionstock.domain.purchasebons.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBonItemRequest {

    @NotNull(message = "Material type is required")
    private MaterialType materialType;

    @NotNull(message = "Number of plies is required")
    @Positive(message = "Number of plies must be greater than 0")
    private Integer nbPlis;

    @NotNull(message = "Thickness in mm is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Thickness must be greater than 0")
    private BigDecimal thicknessMm;

    @NotNull(message = "Width in mm is required")
    @Positive(message = "Width must be greater than 0")
    private Integer widthMm;

    @NotNull(message = "Length in meters is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Length must be greater than 0")
    private BigDecimal lengthM;

    @NotNull(message = "Area in m2 is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Area must be greater than 0")
    private BigDecimal areaM2;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;

    private UUID colorId;
    private UUID altierId;
    private String qrCode;
}
