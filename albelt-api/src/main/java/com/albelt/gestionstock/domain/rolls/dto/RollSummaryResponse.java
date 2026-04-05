package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollSummaryResponse {

    private UUID id;

    private String reference;

    private MaterialType materialType;

    private Integer nbPlis;

    private BigDecimal thicknessMm;

    private Integer widthMm;

    private Integer widthRemainingMm;

    private BigDecimal lengthM;

    private BigDecimal lengthRemainingM;

    private BigDecimal areaM2;

    private RollStatus status;

    private UUID colorId;

    private String colorName;

    private String colorHexCode;
}
