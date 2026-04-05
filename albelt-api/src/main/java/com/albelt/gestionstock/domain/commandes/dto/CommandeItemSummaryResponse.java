package com.albelt.gestionstock.domain.commandes.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeItemSummaryResponse {

    private UUID id;

    private Integer lineNumber;

    private String materialType;

    private Integer nbPlis;

    private BigDecimal thicknessMm;

    private BigDecimal longueurM;

    private BigDecimal longueurToleranceM;

    private Integer largeurMm;

    private Integer quantite;

    private String status;

    private String typeMouvement;

    private String reference;

    private UUID colorId;

    private String colorName;

    private String colorHexCode;
}
