package com.albelt.gestionstock.domain.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationPlanResponse {

    private UUID suggestionId;
    private String status;
    private OptimizationMetricsResponse metrics;
    private String svg;

    private List<OptimizationSourceReportResponse> sources;
    private List<OptimizationPlacementReportResponse> placements;
}
