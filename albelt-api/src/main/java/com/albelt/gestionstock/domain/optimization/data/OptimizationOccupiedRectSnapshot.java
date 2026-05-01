package com.albelt.gestionstock.domain.optimization.data;

import java.time.LocalDateTime;
import java.util.UUID;

public record OptimizationOccupiedRectSnapshot(
        UUID rollId,
        UUID wastePieceId,
        Integer xMm,
        Integer yMm,
        Integer widthMm,
        Integer heightMm,
        LocalDateTime updatedAt
) {

    public UUID sourceId() {
        return rollId != null ? rollId : wastePieceId;
    }
}
