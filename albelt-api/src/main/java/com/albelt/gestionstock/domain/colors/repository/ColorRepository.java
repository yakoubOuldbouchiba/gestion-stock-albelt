package com.albelt.gestionstock.domain.colors.repository;

import com.albelt.gestionstock.domain.colors.entity.Color;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ColorRepository extends JpaRepository<Color, UUID> {
    Optional<Color> findByNameIgnoreCase(String name);
}
