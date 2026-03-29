package com.albelt.gestionstock.domain.colors.mapper;

import com.albelt.gestionstock.domain.colors.dto.ColorRequest;
import com.albelt.gestionstock.domain.colors.dto.ColorResponse;
import com.albelt.gestionstock.domain.colors.entity.Color;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ColorMapper {

    public Color toEntity(ColorRequest request) {
        if (request == null) {
            return null;
        }
        return Color.builder()
                .name(request.getName())
                .hexCode(request.getHexCode())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
    }

    public Color updateEntity(Color existing, ColorRequest request) {
        if (request == null) {
            return existing;
        }
        if (request.getName() != null) {
            existing.setName(request.getName());
        }
        if (request.getHexCode() != null) {
            existing.setHexCode(request.getHexCode());
        }
        if (request.getIsActive() != null) {
            existing.setIsActive(request.getIsActive());
        }
        return existing;
    }

    public ColorResponse toResponse(Color entity) {
        if (entity == null) {
            return null;
        }
        return ColorResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .hexCode(entity.getHexCode())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<ColorResponse> toResponseList(List<Color> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
