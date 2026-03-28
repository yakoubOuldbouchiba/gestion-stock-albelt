package com.albelt.gestionstock.domain.rolls.repository;

import com.albelt.gestionstock.domain.rolls.entity.TransferBon;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransferBonRepository extends JpaRepository<TransferBon, UUID> {

    List<TransferBon> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"movements", "movements.roll", "movements.fromAltier", "movements.toAltier", "movements.operator"})
    Optional<TransferBon> findWithMovementsById(UUID id);
}
