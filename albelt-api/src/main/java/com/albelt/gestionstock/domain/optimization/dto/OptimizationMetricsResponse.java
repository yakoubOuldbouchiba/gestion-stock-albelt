package com.albelt.gestionstock.domain.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizationMetricsResponse {

    private Integer totalPieces;
    private Integer placedPieces;
    private Integer sourceCount;
    private BigDecimal usedAreaM2;
    private BigDecimal wasteAreaM2;
    private BigDecimal utilizationPct;
}
