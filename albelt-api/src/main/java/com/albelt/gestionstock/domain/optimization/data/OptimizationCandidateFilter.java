package com.albelt.gestionstock.domain.optimization.data;

import java.util.UUID;

public record OptimizationCandidateFilter(
        UUID articleId,
        UUID colorId,
        UUID altierId
) {
}
