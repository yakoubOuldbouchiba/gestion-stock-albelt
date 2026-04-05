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
           "WHERE pi.placedRectangle.id = :placedRectangleId " +
           "AND (:excludeId IS NULL OR pi.id <> :excludeId)")
    BigDecimal sumTotalAreaByPlacedRectangleIdExcludingId(@Param("placedRectangleId") UUID placedRectangleId,
                                                          @Param("excludeId") UUID excludeId);

    @Query("SELECT COALESCE(SUM(pi.quantity), 0) FROM ProductionItem pi " +
           "WHERE pi.placedRectangle.commandeItemId = :commandeItemId " +
           "AND (:excludeId IS NULL OR pi.id <> :excludeId)")
    Long sumQuantityByCommandeItemIdExcludingId(@Param("commandeItemId") UUID commandeItemId,
                                                @Param("excludeId") UUID excludeId);

    @Query("SELECT pi FROM ProductionItem pi WHERE pi.placedRectangle.commandeItemId = :commandeItemId")
    List<ProductionItem> findByCommandeItemId(@Param("commandeItemId") UUID commandeItemId);

    @Query("SELECT pi FROM ProductionItem pi WHERE pi.placedRectangle.roll.id = :rollId")
    List<ProductionItem> findByRollId(@Param("rollId") UUID rollId);

    @Query("SELECT pi FROM ProductionItem pi WHERE pi.placedRectangle.wastePiece.id = :wastePieceId")
    List<ProductionItem> findByWastePieceId(@Param("wastePieceId") UUID wastePieceId);
}
