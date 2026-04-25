package com.albelt.gestionstock.domain.optimization.data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record OptimizationItemSnapshot(
    UUID itemId,
    UUID commandeId,
    UUID altierId,
    String materialType,
    Integer nbPlis,
    BigDecimal thicknessMm,
    BigDecimal longueurM,
    Integer largeurMm,
    Integer quantite,
    UUID colorId,
    String reference,
    LocalDateTime itemUpdatedAt,
    LocalDateTime commandeUpdatedAt
) {

    public OptimizationItemSnapshot withAltierId(UUID overriddenAltierId) {
        return new OptimizationItemSnapshot(
            itemId,
            commandeId,
            overriddenAltierId,
            materialType,
            nbPlis,
            thicknessMm,
            longueurM,
            largeurMm,
            quantite,
            colorId,
            reference,
            itemUpdatedAt,
            commandeUpdatedAt
        );
    }
}
