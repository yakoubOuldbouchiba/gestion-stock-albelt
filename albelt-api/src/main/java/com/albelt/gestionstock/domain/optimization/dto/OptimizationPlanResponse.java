package com.albelt.gestionstock.domain.optimization.dto;

import lombok.*;

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
}
