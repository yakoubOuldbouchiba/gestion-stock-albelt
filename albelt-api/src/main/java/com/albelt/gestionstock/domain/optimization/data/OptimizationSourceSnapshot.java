package com.albelt.gestionstock.domain.optimization.data;

import com.albelt.gestionstock.domain.optimization.entity.OptimizationSourceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record OptimizationSourceSnapshot(
    OptimizationSourceType sourceType,
    UUID rollId,
    UUID wastePieceId,
    UUID articleId,
    Integer widthMm,
    BigDecimal lengthM,
    BigDecimal availableAreaM2,
    BigDecimal fullAreaM2,
    String sourceStatus,
    Integer nbPlis,
    BigDecimal thicknessMm,
    UUID colorId,
    String reference,
    LocalDate receivedDate,
    LocalDateTime updatedAt
) {

    public OptimizationSourceSnapshot(OptimizationSourceType sourceType,
                                      UUID rollId,
                                      UUID wastePieceId,
                                      Integer widthMm,
                                      BigDecimal lengthM,
                                      BigDecimal availableAreaM2,
                                      BigDecimal fullAreaM2,
                                      Integer nbPlis,
                                      BigDecimal thicknessMm,
                                      UUID colorId,
                                      String reference,
                                      LocalDate receivedDate,
                                      LocalDateTime updatedAt) {
        this(
            sourceType,
            rollId,
            wastePieceId,
            null,
            widthMm,
            lengthM,
            availableAreaM2,
            fullAreaM2,
            null,
            nbPlis,
            thicknessMm,
            colorId,
            reference,
            receivedDate,
            updatedAt
        );
    }

    public OptimizationSourceSnapshot(OptimizationSourceType sourceType,
                                      UUID rollId,
                                      UUID wastePieceId,
                                      Integer widthMm,
                                      BigDecimal lengthM,
                                      BigDecimal availableAreaM2,
                                      BigDecimal fullAreaM2,
                                      String sourceStatus,
                                      Integer nbPlis,
                                      BigDecimal thicknessMm,
                                      UUID colorId,
                                      String reference,
                                      LocalDate receivedDate,
                                      LocalDateTime updatedAt) {
        this(
            sourceType,
            rollId,
            wastePieceId,
            null,
            widthMm,
            lengthM,
            availableAreaM2,
            fullAreaM2,
            sourceStatus,
            nbPlis,
            thicknessMm,
            colorId,
            reference,
            receivedDate,
            updatedAt
        );
    }

    public UUID sourceId() {
        return rollId != null ? rollId : wastePieceId;
    }

    public int lengthMm() {
        if (lengthM == null) {
            return 0;
        }
        return lengthM.multiply(BigDecimal.valueOf(1000)).intValue();
    }

    public BigDecimal effectiveAreaM2() {
        if (availableAreaM2 != null && availableAreaM2.compareTo(BigDecimal.ZERO) > 0) {
            return availableAreaM2;
        }
        return fullAreaM2 != null ? fullAreaM2 : BigDecimal.ZERO;
    }

    public boolean isOpened() {
        return sourceStatus != null && "OPENED".equalsIgnoreCase(sourceStatus);
    }
}
