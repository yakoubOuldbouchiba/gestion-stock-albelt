package com.albelt.gestionstock.domain.settings.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for creating/updating material chute thresholds
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialChuteThresholdRequest {

    @NotNull
    private MaterialType materialType;

    @NotNull
    @PositiveOrZero
    private Integer minWidthMm;

    @NotNull
    @PositiveOrZero
    private BigDecimal minLengthM;
}
