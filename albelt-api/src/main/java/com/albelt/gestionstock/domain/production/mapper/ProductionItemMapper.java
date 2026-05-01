package com.albelt.gestionstock.domain.production.mapper;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.placement.mapper.PlacedRectangleMapper;
import com.albelt.gestionstock.domain.production.dto.ProductionItemRequest;
import com.albelt.gestionstock.domain.production.dto.ProductionItemResponse;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper for ProductionItem entity and DTOs
 */
@Component
@RequiredArgsConstructor
public class ProductionItemMapper {

    private final PlacedRectangleMapper placedRectangleMapper;
    private final CommandeItemRepository commandeItemRepository;

    public ProductionItem toEntity(ProductionItemRequest request,
                                   PlacedRectangle placedRectangle,
                                   BigDecimal areaPerPiece,
                                   BigDecimal totalArea) {
        if (request == null) {
            return null;
        }

        return ProductionItem.builder()
                .placedRectangle(placedRectangle)
                .pieceLengthM(request.getPieceLengthM())
                .pieceWidthMm(request.getPieceWidthMm())
                .quantity(request.getQuantity())
                .areaPerPieceM2(areaPerPiece)
                .totalAreaM2(totalArea)
                .notes(request.getNotes())
                .build();
    }

    public ProductionItemResponse toResponse(ProductionItem entity) {
        if (entity == null) {
            return null;
        }

        PlacedRectangle placedRectangle = entity.getPlacedRectangle();
        CommandeItem commandeItem = getCommandeItemForPlacement(placedRectangle);

        return ProductionItemResponse.builder()
                .id(entity.getId())
                .placedRectangleId(placedRectangle != null ? placedRectangle.getId() : null)
                .placedRectangle(placedRectangleMapper.toResponse(placedRectangle, commandeItem))
                .pieceLengthM(entity.getPieceLengthM())
                .pieceWidthMm(entity.getPieceWidthMm())
                .quantity(entity.getQuantity())
                .areaPerPieceM2(entity.getAreaPerPieceM2())
                .totalAreaM2(entity.getTotalAreaM2())
                .notes(entity.getNotes())
                .goodProduction(entity.getGoodProduction())
                .productionMiss(entity.getProductionMiss())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private CommandeItem getCommandeItemForPlacement(PlacedRectangle placedRectangle) {
        if (placedRectangle == null || placedRectangle.getCommandeItemId() == null) {
            return null;
        }
        return commandeItemRepository.findById(placedRectangle.getCommandeItemId()).orElse(null);
    }
}
