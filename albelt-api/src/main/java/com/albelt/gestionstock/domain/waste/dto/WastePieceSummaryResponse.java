package com.albelt.gestionstock.domain.waste.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WastePieceSummaryResponse {

    private UUID id;

    private UUID rollId;

    private UUID parentWastePieceId;

    private String reference;

    private MaterialType materialType;

    private Integer nbPlis;

    private BigDecimal thicknessMm;

    private Integer widthMm;

    private Integer widthRemainingMm;

    private BigDecimal lengthM;

    private BigDecimal lengthRemainingM;

    private BigDecimal areaM2;

    private BigDecimal usedAreaM2;

    private BigDecimal availableAreaM2;

    private WasteStatus status;

    private WasteType wasteType;

    private UUID colorId;

    private String colorName;

    private String colorHexCode;
}
