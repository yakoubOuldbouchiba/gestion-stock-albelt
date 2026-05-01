package com.albelt.gestionstock.domain.colors.repository;

import com.albelt.gestionstock.domain.colors.entity.Color;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ColorRepository extends JpaRepository<Color, UUID> {
    Optional<Color> findByNameIgnoreCase(String name);

    @Query("SELECT c FROM Color c " +
            "WHERE (:search = '' OR " +
            "LOWER(c.name) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(c.hexCode) LIKE CONCAT('%', :search, '%')) " +
            "AND (c.isActive = COALESCE(:isActive, c.isActive))")
    Page<Color> findFiltered(
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
