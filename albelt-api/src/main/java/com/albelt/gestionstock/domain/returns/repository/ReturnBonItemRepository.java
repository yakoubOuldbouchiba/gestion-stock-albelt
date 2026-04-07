package com.albelt.gestionstock.domain.returns.repository;

import com.albelt.gestionstock.domain.returns.entity.ReturnBonItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReturnBonItemRepository extends JpaRepository<ReturnBonItem, UUID> {

    List<ReturnBonItem> findByReturnBon_Id(UUID returnBonId);

    @Query("SELECT COALESCE(SUM(r.quantity), 0) FROM ReturnBonItem r WHERE r.commandeItem.id = :commandeItemId")
    Integer sumReturnedQuantityByCommandeItemId(@Param("commandeItemId") UUID commandeItemId);

    @Query("SELECT COALESCE(SUM(r.quantity), 0) FROM ReturnBonItem r WHERE r.productionItem.id = :productionItemId")
    Integer sumReturnedQuantityByProductionItemId(@Param("productionItemId") UUID productionItemId);
}
