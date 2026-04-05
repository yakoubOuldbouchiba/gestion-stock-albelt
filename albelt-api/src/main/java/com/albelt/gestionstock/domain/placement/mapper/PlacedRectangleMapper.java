package com.albelt.gestionstock.domain.placement.mapper;

import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleRequest;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleResponse;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlacedRectangleMapper {

    public PlacedRectangle toEntity(PlacedRectangleRequest request, Roll roll, WastePiece wastePiece, Color color) {
        if (request == null) {
            return null;
        }
        return PlacedRectangle.builder()
                .roll(roll)
                .wastePiece(wastePiece)
                .commandeItemId(request.getCommandeItemId())
                .color(color)
                .xMm(request.getXMm())
                .yMm(request.getYMm())
                .widthMm(request.getWidthMm())
                .heightMm(request.getHeightMm())
                .build();
    }

    public PlacedRectangleResponse toResponse(PlacedRectangle entity) {
        if (entity == null) {
            return null;
        }
        return PlacedRectangleResponse.builder()
                .id(entity.getId())
                .rollId(entity.getRoll() != null ? entity.getRoll().getId() : null)
                .wastePieceId(entity.getWastePiece() != null ? entity.getWastePiece().getId() : null)
                .commandeItemId(entity.getCommandeItemId())
                .xMm(entity.getXMm())
                .yMm(entity.getYMm())
                .widthMm(entity.getWidthMm())
                .heightMm(entity.getHeightMm())
                .colorId(entity.getColor() != null ? entity.getColor().getId() : null)
                .colorName(entity.getColor() != null ? entity.getColor().getName() : null)
                .colorHexCode(entity.getColor() != null ? entity.getColor().getHexCode() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<PlacedRectangleResponse> toResponseList(List<PlacedRectangle> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream().map(this::toResponse).toList();
    }
}
