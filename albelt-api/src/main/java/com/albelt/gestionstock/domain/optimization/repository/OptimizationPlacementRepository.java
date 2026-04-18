package com.albelt.gestionstock.domain.optimization.repository;

import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlacement;
import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface OptimizationPlacementRepository extends JpaRepository<OptimizationPlacement, UUID> {

    List<OptimizationPlacement> findByPlanIdOrderByCreatedAtAsc(UUID planId);

    @Query("""
        select op from OptimizationPlacement op
        left join fetch op.roll r
        left join fetch r.color
        left join fetch op.wastePiece w
        left join fetch w.color
        where op.plan.id = :planId
        order by op.createdAt asc
        """)
    List<OptimizationPlacement> findByPlanIdWithSourcesOrderByCreatedAtAsc(@Param("planId") UUID planId);

    long deleteByPlanId(UUID planId);

    @Query("""
        select op from OptimizationPlacement op
        join op.plan plan
        where (
            (:rollId is not null and op.roll.id = :rollId)
            or (:wastePieceId is not null and op.wastePiece.id = :wastePieceId)
        )
        and plan.status = :planStatus
        and plan.commandeItemId <> :commandeItemId
        and plan.commandeItemId in (
            select ci.id from CommandeItem ci
            join ci.commande c
            where c.status in :activeStatuses
        )
        """)
    List<OptimizationPlacement> findActivePlacementsExcludingItem(
        @Param("rollId") UUID rollId,
        @Param("wastePieceId") UUID wastePieceId,
        @Param("planStatus") OptimizationPlanStatus planStatus,
        @Param("commandeItemId") UUID commandeItemId,
        @Param("activeStatuses") Collection<String> activeStatuses
    );
}
