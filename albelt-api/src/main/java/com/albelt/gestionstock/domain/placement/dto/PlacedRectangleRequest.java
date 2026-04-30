package com.albelt.gestionstock.domain.placement.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacedRectangleRequest {

    private UUID rollId;
    private UUID wastePieceId;
    private UUID commandeItemId;

    @JsonProperty("xMm")
    @NotNull(message = "X position is required")
    @Min(value = 0, message = "X position must be >= 0")
    private Integer xMm;

    @JsonProperty("yMm")
    @NotNull(message = "Y position is required")
    @Min(value = 0, message = "Y position must be >= 0")
    private Integer yMm;

    @NotNull(message = "Width is required")
    @Positive(message = "Width must be > 0")
    private Integer widthMm;

    @NotNull(message = "Height is required")
    @Positive(message = "Height must be > 0")
    private Integer heightMm;

    private UUID colorId;
}
