package com.albelt.gestionstock.domain.purchasebons.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBonItemResponse {
    private UUID id;
    private Integer lineNumber;

    private MaterialType materialType;
    private Integer nbPlis;
    private BigDecimal thicknessMm;
    private Integer widthMm;
    private BigDecimal lengthM;
    private BigDecimal areaM2;
    private Integer quantity;

    private UUID colorId;
    private String colorName;
    private String colorHexCode;

    private UUID altierId;
    private String altierLibelle;

    private String qrCode;
}
