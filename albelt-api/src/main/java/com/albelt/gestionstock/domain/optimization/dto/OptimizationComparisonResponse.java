package com.albelt.gestionstock.domain.optimization.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationComparisonResponse {

    private UUID commandeItemId;
    private OptimizationMetricsResponse actualMetrics;
    private OptimizationPlanResponse suggested;
    private String actualSvg;
    private BigDecimal wasteSavedM2;
    private BigDecimal utilizationGainPct;
}
