package com.albelt.gestionstock.domain.optimization.data;

import com.albelt.gestionstock.shared.enums.MaterialType;

import java.math.BigDecimal;
import java.util.UUID;

public record OptimizationCandidateFilter(
    MaterialType materialType,
    Integer nbPlis,
    BigDecimal thicknessMm,
    UUID colorId,
    String reference,
    UUID altierId
) {
}
