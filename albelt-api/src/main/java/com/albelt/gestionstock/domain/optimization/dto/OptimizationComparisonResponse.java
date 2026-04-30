package com.albelt.gestionstock.domain.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
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
    private List<OptimizationSourceReportResponse> actualSources;
    private List<OptimizationPlacementReportResponse> actualPlacements;
    private BigDecimal wasteSavedM2;
    private BigDecimal utilizationGainPct;
}
