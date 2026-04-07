package com.albelt.gestionstock.domain.returns.repository;

import com.albelt.gestionstock.domain.returns.entity.ReturnBon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReturnBonRepository extends JpaRepository<ReturnBon, UUID> {
    List<ReturnBon> findByCommande_IdOrderByCreatedAtDesc(UUID commandeId);
}
