package com.albelt.gestionstock.domain.settings.service;

import com.albelt.gestionstock.domain.settings.dto.MaterialChuteThresholdRequest;
import com.albelt.gestionstock.domain.settings.entity.MaterialChuteThreshold;
import com.albelt.gestionstock.domain.settings.mapper.MaterialChuteThresholdMapper;
import com.albelt.gestionstock.domain.settings.repository.MaterialChuteThresholdRepository;
import com.albelt.gestionstock.shared.enums.MaterialType;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialChuteThresholdService {

    private final MaterialChuteThresholdRepository repository;
    private final MaterialChuteThresholdMapper mapper;

    public List<MaterialChuteThreshold> getAll() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(t -> t.getMaterialType().name()))
                .toList();
    }

    @Transactional
    public List<MaterialChuteThreshold> upsertAll(List<MaterialChuteThresholdRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return getAll();
        }

        for (var request : requests) {
            MaterialType materialType = request.getMaterialType();
            var entity = repository.findByMaterialType(materialType)
                    .orElseGet(() -> MaterialChuteThreshold.builder().materialType(materialType).build());

            mapper.applyRequest(entity, request);
            repository.save(entity);
        }

        return getAll();
    }
}
