package com.albelt.gestionstock.domain.settings.repository;

import com.albelt.gestionstock.domain.settings.entity.MaterialChuteThreshold;
import com.albelt.gestionstock.shared.enums.MaterialType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MaterialChuteThresholdRepository extends JpaRepository<MaterialChuteThreshold, UUID> {
    Optional<MaterialChuteThreshold> findByMaterialType(MaterialType materialType);
}
