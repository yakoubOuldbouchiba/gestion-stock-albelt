package com.albelt.gestionstock.domain.placement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacedRectangleResponse {

    private UUID id;
    private UUID rollId;
    private UUID wastePieceId;
    private UUID commandeItemId;

    @JsonProperty("xMm")
    private Integer xMm;
    @JsonProperty("yMm")
    private Integer yMm;
    private Integer widthMm;
    private Integer heightMm;

    private UUID colorId;
    private String colorName;
    private String colorHexCode;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
