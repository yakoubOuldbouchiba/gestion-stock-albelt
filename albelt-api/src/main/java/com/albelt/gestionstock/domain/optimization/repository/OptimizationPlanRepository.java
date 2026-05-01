package com.albelt.gestionstock.domain.optimization.repository;

import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlan;
import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OptimizationPlanRepository extends JpaRepository<OptimizationPlan, UUID> {

    Optional<OptimizationPlan> findFirstByCommandeItemIdAndStatusOrderByCreatedAtDesc(UUID commandeItemId,
                                                                                      OptimizationPlanStatus status);

    Optional<OptimizationPlan> findFirstByCommandeItemIdAndStatusAndAlgorithmVersionAndInputSignatureAndStockSignatureOrderByCreatedAtDesc(
            UUID commandeItemId,
            OptimizationPlanStatus status,
            String algorithmVersion,
            String inputSignature,
            String stockSignature
    );

    List<OptimizationPlan> findByCommandeItemIdAndStatus(UUID commandeItemId, OptimizationPlanStatus status);

    @Query("select count(p) from OptimizationPlan p where p.commandeItemId = :itemId")
    long countByCommandeItemId(@Param("itemId") UUID commandeItemId);
}
