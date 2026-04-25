package com.albelt.gestionstock.domain.optimization.data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OptimizationCandidateFingerprint(
    long candidateCount,
    LocalDateTime latestUpdatedAt,
    BigDecimal totalAvailableAreaM2
) {

    public String cacheToken() {
        return candidateCount
            + "|"
            + (latestUpdatedAt != null ? latestUpdatedAt.toString() : "null")
            + "|"
            + (totalAvailableAreaM2 != null ? totalAvailableAreaM2.toPlainString() : "0");
    }
}
