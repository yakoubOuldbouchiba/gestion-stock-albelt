package com.albelt.gestionstock.domain.production.repository;

import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Repository for ProductionItem entity
 */
@Repository
public interface ProductionItemRepository extends JpaRepository<ProductionItem, UUID> {

    @Query("SELECT COALESCE(SUM(pi.totalAreaM2), 0) FROM ProductionItem pi " +
           "WHERE pi.roll.id = :rollId " +
           "AND (:excludeId IS NULL OR pi.id <> :excludeId)")
    BigDecimal sumTotalAreaByRollIdExcludingId(@Param("rollId") UUID rollId,
                                               @Param("excludeId") UUID excludeId);

    @Query("SELECT COALESCE(SUM(pi.totalAreaM2), 0) FROM ProductionItem pi " +
           "WHERE pi.wastePiece.id = :wastePieceId " +
           "AND (:excludeId IS NULL OR pi.id <> :excludeId)")
    BigDecimal sumTotalAreaByWastePieceIdExcludingId(@Param("wastePieceId") UUID wastePieceId,
                                                     @Param("excludeId") UUID excludeId);

    @Query("SELECT COALESCE(SUM(pi.quantity), 0) FROM ProductionItem pi " +
           "WHERE pi.commandeItem.id = :commandeItemId " +
           "AND (:excludeId IS NULL OR pi.id <> :excludeId)")
    Long sumQuantityByCommandeItemIdExcludingId(@Param("commandeItemId") UUID commandeItemId,
                                                @Param("excludeId") UUID excludeId);

    List<ProductionItem> findByCommandeItemId(UUID commandeItemId);

    List<ProductionItem> findByRollId(UUID rollId);

    List<ProductionItem> findByWastePieceId(UUID wastePieceId);
}
