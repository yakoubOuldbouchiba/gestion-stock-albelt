package com.albelt.gestionstock.domain.returns.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnBonItemResponse {

    private UUID id;

    private UUID returnBonId;

    private UUID commandeItemId;

    private UUID productionItemId;

    private Integer quantity;

    private String returnType;

    private String measureAction;

    private Integer adjustedWidthMm;

    private BigDecimal adjustedLengthM;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
