package com.albelt.gestionstock.domain.production.dto;

import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ProductionItemResponse DTO - Output for production items
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionItemResponse {

    private UUID id;

    private UUID placedRectangleId;

    private PlacedRectangleResponse placedRectangle;

    private BigDecimal pieceLengthM;

    private Integer pieceWidthMm;

    private Integer quantity;

    private BigDecimal areaPerPieceM2;

    private BigDecimal totalAreaM2;

    private String notes;

    private Boolean goodProduction;

    private String productionMiss;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
