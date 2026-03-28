package com.albelt.gestionstock.domain.altier.repository;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Altier entity
 */
@Repository
public interface AltierRepository extends JpaRepository<Altier, UUID> {
    Optional<Altier> findByLibelle(String libelle);
    boolean existsByLibelle(String libelle);
}
