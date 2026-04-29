package com.albelt.gestionstock.domain.commandes.repository;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * CommandeItemRepository - Data access for CommandeItem entities
 */
@Repository
public interface CommandeItemRepository extends JpaRepository<CommandeItem, UUID> {

    /**
     * Find all items for a specific order
     */
    @Query("SELECT ci FROM CommandeItem ci JOIN FETCH ci.article a LEFT JOIN FETCH a.color WHERE ci.commande.id = :commandeId ORDER BY ci.lineNumber ASC")
    List<CommandeItem> findByCommandeId(@Param("commandeId") UUID commandeId);

    /**
     * Find all items with specific movement type
     */
    @Query("SELECT ci FROM CommandeItem ci JOIN FETCH ci.article a LEFT JOIN FETCH a.color WHERE ci.typeMouvement = :typeMouvement ORDER BY ci.createdAt DESC")
    List<CommandeItem> findByTypeMouvement(@Param("typeMouvement") String typeMouvement);

    /**
     * Find all items with specific status
     */
    @Query("SELECT ci FROM CommandeItem ci JOIN FETCH ci.article a LEFT JOIN FETCH a.color WHERE ci.status = :status ORDER BY ci.createdAt DESC")
    List<CommandeItem> findByStatus(@Param("status") String status);

    /**
     * Find items by material type
     */
    @Query("SELECT ci FROM CommandeItem ci JOIN FETCH ci.article a LEFT JOIN FETCH a.color WHERE ci.materialType = :materialType ORDER BY ci.createdAt DESC")
    List<CommandeItem> findByMaterialType(@Param("materialType") String materialType);

    @Query("""
        select new com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot(
            ci.id,
            c.id,
            c.status,
            a.id,
            article.id,
            article.materialType,
            article.nbPlis,
            article.thicknessMm,
            ci.longueurM,
            ci.largeurMm,
            ci.quantite,
            color.id,
            article.reference,
            ci.updatedAt,
            c.updatedAt
        )
        from CommandeItem ci
        join ci.commande c
        left join c.altier a
        join ci.article article
        left join article.color color
        where ci.id = :itemId
        """)
    java.util.Optional<OptimizationItemSnapshot> findOptimizationSnapshotById(@Param("itemId") UUID itemId);

    @Query("""
        select new com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot(
            ci.id,
            c.id,
            c.status,
            a.id,
            article.id,
            article.materialType,
            article.nbPlis,
            article.thicknessMm,
            ci.longueurM,
            ci.largeurMm,
            ci.quantite,
            color.id,
            article.reference,
            ci.updatedAt,
            c.updatedAt
        )
        from CommandeItem ci
        join ci.commande c
        left join c.altier a
        join ci.article article
        left join article.color color
        where c.id = :commandeId
        order by ci.lineNumber asc
        """)
    List<OptimizationItemSnapshot> findOptimizationSnapshotsByCommandeId(@Param("commandeId") UUID commandeId);
}
