package com.albelt.gestionstock.domain.rolls.mapper;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.articles.mapper.ArticleMapper;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.rolls.dto.RollGroupedStatsResponse;
import com.albelt.gestionstock.domain.rolls.dto.RollRequest;
import com.albelt.gestionstock.domain.rolls.dto.RollResponse;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Roll entity and DTOs
 * Aligned with clean schema (no initial/remaining duplication)
 */
@Component
public class RollMapper {

    private final ArticleMapper articleMapper;

    public RollMapper(ArticleMapper articleMapper) {
        this.articleMapper = articleMapper;
    }

    /**
     * Convert Object[] from groupByAllFields to RollGroupedStatsResponse DTO
     */
    public RollGroupedStatsResponse toGroupedStatsResponse(Object[] row) {
        if (row == null || row.length < 11) return null;
        return RollGroupedStatsResponse.builder()
                .colorId((java.util.UUID) row[0])
                .colorName((String) row[1])
                .colorHexCode((String) row[2])
                .nbPlis((Integer) row[3])
                .thicknessMm(row[4] instanceof java.math.BigDecimal ? ((java.math.BigDecimal) row[4]) : row[4] != null ? new java.math.BigDecimal(row[4].toString()) : null)
                .materialType((com.albelt.gestionstock.shared.enums.MaterialType) row[5])
                .altierId((java.util.UUID) row[6])
                .altierName((String) row[7])
                .status((com.albelt.gestionstock.shared.enums.RollStatus) row[8])
                .rollCount(row[9] instanceof Long ? (Long) row[9] : row[9] != null ? Long.valueOf(row[9].toString()) : null)
                .totalAreaM2(row[10] instanceof java.math.BigDecimal ? (java.math.BigDecimal) row[10] : row[10] != null ? new java.math.BigDecimal(row[10].toString()) : null)
                .totalWasteAreaM2(row[11] instanceof java.math.BigDecimal ? (java.math.BigDecimal) row[11] : row[11] != null ? new java.math.BigDecimal(row[11].toString()) : null)
                .build();
    }

    public List<RollGroupedStatsResponse> toGroupedStatsResponseList(List<Object[]> rows) {
        if (rows == null) return List.of();
        return rows.stream().map(this::toGroupedStatsResponse).collect(Collectors.toList());
    }

    /**
     * Convert RollRequest DTO to Roll entity
     */
    public Roll toEntity(RollRequest request, Supplier supplier, Altier altier, java.util.UUID createdBy) {
        if (request == null) {
            return null;
        }
        
        Roll roll = Roll.builder()
            .receivedDate(request.getReceivedDate())
            .supplier(supplier)
            .altier(altier)
            .materialType(request.getMaterialType())
            .nbPlis(request.getNbPlis())
            .thicknessMm(request.getThicknessMm())
            .widthMm(request.getWidthMm())
            .widthRemainingMm(request.getWidthRemainingMm())
            .lengthM(request.getLengthM())
            .lengthRemainingM(request.getLengthRemainingM())
            .areaM2(request.getAreaM2())
            .usedAreaM2(BigDecimal.ZERO)
            .availableAreaM2(request.getAreaM2())
            .status(request.getStatus())
            .qrCode(request.getQrCode())
            .totalCuts(0)
            .totalWasteAreaM2(BigDecimal.ZERO)
            .createdBy(createdBy)
            .reference(request.getReference())
            .build();
        return roll;
    }

    /**
     * Update existing Roll entity with request data
     */
    public Roll updateEntity(Roll existing, RollRequest request, Supplier supplier, Altier altier) {
        if (request == null) {
            return existing;
        }
        
        if (request.getReceivedDate() != null) {
            existing.setReceivedDate(request.getReceivedDate());
        }
        if(request.getReference() != null) {
            existing.setReference(request.getReference());
        }
        if (supplier != null) {
            existing.setSupplier(supplier);
        }
        if (altier != null) {
            existing.setAltier(altier);
        }
        if (request.getMaterialType() != null) {
            existing.setMaterialType(request.getMaterialType());
        }
        if (request.getNbPlis() != null) {
            existing.setNbPlis(request.getNbPlis());
        }
        if (request.getThicknessMm() != null) {
            existing.setThicknessMm(request.getThicknessMm());
        }
        if (request.getWidthMm() != null) {
            existing.setWidthMm(request.getWidthMm());
        }
        if (request.getWidthRemainingMm() != null) {
            existing.setWidthRemainingMm(request.getWidthRemainingMm());
        }
        if (request.getLengthM() != null) {
            existing.setLengthM(request.getLengthM());
        }
        if (request.getLengthRemainingM() != null) {
            existing.setLengthRemainingM(request.getLengthRemainingM());
        }
        if (request.getAreaM2() != null) {
            existing.setAreaM2(request.getAreaM2());
            existing.setAvailableAreaM2(request.getAreaM2());
        }
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        if (request.getQrCode() != null) {
            existing.setQrCode(request.getQrCode());
        }
        
        return existing;
    }

    /**
     * Convert Roll entity to RollResponse DTO
     */
    public RollResponse toResponse(Roll entity) {
        if (entity == null) {
            return null;
        }
        Color color = entity.getArticle() != null ? entity.getArticle().getColor() : null;

        boolean supplierInitialized = entity.getSupplier() != null
            && org.hibernate.Hibernate.isInitialized(entity.getSupplier());
        boolean altierInitialized = entity.getAltier() != null
            && org.hibernate.Hibernate.isInitialized(entity.getAltier());

        return RollResponse.builder()
                .id(entity.getId())
                .lotId(entity.getLotId())
                .articleId(entity.getArticle() != null ? entity.getArticle().getId() : null)
                .article(entity.getArticle() != null ? articleMapper.toResponse(entity.getArticle()) : null)
                .reference(entity.getReference())
                .receivedDate(entity.getReceivedDate())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(supplierInitialized ? entity.getSupplier().getName() : null)
                .materialType(entity.getMaterialType())
                .nbPlis(entity.getNbPlis())
                .thicknessMm(entity.getThicknessMm())
                .widthMm(entity.getWidthMm())
                .widthRemainingMm(entity.getWidthRemainingMm())
                .lengthM(entity.getLengthM())
                .lengthRemainingM(entity.getLengthRemainingM())
                .areaM2(entity.getAreaM2())
                .usedAreaM2(entity.getUsedAreaM2())
                .availableAreaM2(entity.getAvailableAreaM2())
                .status(entity.getStatus())
                .altierId(entity.getAltier() != null ? entity.getAltier().getId() : null)
                .altierLibelle(altierInitialized ? entity.getAltier().getLibelle() : null)
                .qrCode(entity.getQrCode())
                .colorId(color != null ? color.getId() : null)
                .colorName(color != null && org.hibernate.Hibernate.isInitialized(color) ? color.getName() : null)
                .colorHexCode(color != null && org.hibernate.Hibernate.isInitialized(color) ? color.getHexCode() : null)
                .totalCuts(entity.getTotalCuts())
                .totalWasteAreaM2(entity.getTotalWasteAreaM2())
                .lastProcessingDate(entity.getLastProcessingDate())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .availableForCutting(entity.getStatus() == com.albelt.gestionstock.shared.enums.RollStatus.AVAILABLE
                    || entity.getStatus() == com.albelt.gestionstock.shared.enums.RollStatus.OPENED)
                .build();
    }

    /**
     * Convert list of entities to list of responses
     */
    public List<RollResponse> toResponseList(List<Roll> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
