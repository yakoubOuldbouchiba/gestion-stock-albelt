package com.albelt.gestionstock.domain.production.dto;

import lombok.*;

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

    private UUID commandeItemId;

    private UUID rollId;

    private UUID wastePieceId;

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
