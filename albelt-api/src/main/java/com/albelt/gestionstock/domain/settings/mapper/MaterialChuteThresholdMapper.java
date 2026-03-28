package com.albelt.gestionstock.domain.settings.mapper;

import com.albelt.gestionstock.domain.settings.dto.MaterialChuteThresholdRequest;
import com.albelt.gestionstock.domain.settings.dto.MaterialChuteThresholdResponse;
import com.albelt.gestionstock.domain.settings.entity.MaterialChuteThreshold;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class MaterialChuteThresholdMapper {

    public MaterialChuteThresholdResponse toResponse(MaterialChuteThreshold entity) {
        if (entity == null) return null;
        return MaterialChuteThresholdResponse.builder()
                .id(entity.getId())
                .materialType(entity.getMaterialType())
                .minWidthMm(entity.getMinWidthMm())
                .minLengthM(entity.getMinLengthM())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<MaterialChuteThresholdResponse> toResponseList(List<MaterialChuteThreshold> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void applyRequest(MaterialChuteThreshold entity, MaterialChuteThresholdRequest request) {
        entity.setMaterialType(request.getMaterialType());
        entity.setMinWidthMm(request.getMinWidthMm());
        entity.setMinLengthM(request.getMinLengthM());
    }
}
