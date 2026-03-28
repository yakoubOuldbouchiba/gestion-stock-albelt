package com.albelt.gestionstock.domain.settings.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning threshold configuration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialChuteThresholdResponse {
    private UUID id;
    private MaterialType materialType;
    private Integer minWidthMm;
    private BigDecimal minLengthM;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
