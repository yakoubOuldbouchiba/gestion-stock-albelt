package com.albelt.gestionstock.domain.rolls.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Roll entity
 * FIFO-based inventory queries and status tracking
 */
@Repository
public interface RollRepository extends JpaRepository<Roll, UUID> {

    /**
     * FIFO Query: Get oldest available roll for a specific material
     * Critical performance query - uses composite index (material_type, status, received_date)
     */
    @Query("SELECT r FROM Roll r WHERE r.materialType = :materialType AND r.status = :status " +
           "ORDER BY r.receivedDate ASC LIMIT 1")
    Optional<Roll> findOldestAvailableByMaterial(@Param("materialType") MaterialType materialType,
                                                  @Param("status") RollStatus status);

    /**
     * Get all available rolls for a material, sorted by received date (FIFO order)
     */
    @Query("SELECT r FROM Roll r WHERE r.materialType = :materialType AND r.status IN (:statuses) " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findFifoQueue(@Param("materialType") MaterialType materialType,
                             @Param("statuses") List<RollStatus> statuses);

    /**
     * Get available rolls for a material in FIFO order, optionally restricted to a specific altier.
     */
    @Query("SELECT r FROM Roll r WHERE r.materialType = :materialType AND r.status IN (:statuses) " +
           "AND (:altierId IS NULL OR r.altier.id = :altierId) " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findFifoQueueByAltier(@Param("materialType") MaterialType materialType,
                                     @Param("statuses") List<RollStatus> statuses,
                                     @Param("altierId") UUID altierId);

    /**
     * Find rolls with sufficient area for cutting
     */
    @Query("SELECT r FROM Roll r WHERE r.materialType = :materialType " +
           "AND r.status IN (:statuses) " +
           "AND r.availableAreaM2 >= :requiredArea " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findRollsBySizeAndMaterial(@Param("materialType") MaterialType materialType,
                                          @Param("requiredArea") BigDecimal requiredArea,
                                          @Param("statuses") List<RollStatus> statuses);

    /**
     * Find rolls by supplier
     */
    List<Roll> findBySupplierIdOrderByReceivedDateDesc(UUID supplierId);

    /**
     * Find rolls by altier (workshop)
     */
    List<Roll> findByAltierIdOrderByReceivedDateDesc(UUID altierId);

    /**
     * Find rolls by status
     */
    @Query("SELECT r FROM Roll r WHERE r.status = :status ORDER BY r.receivedDate DESC")
    List<Roll> findByStatus(@Param("status") RollStatus status, Pageable pageable);

    /**
     * Find rolls received between specific dates
     */
    @Query("SELECT r FROM Roll r WHERE r.receivedDate BETWEEN :startDate AND :endDate ORDER BY r.receivedDate DESC")
    List<Roll> findByReceivedDateRange(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);

    /**
     * Count available rolls by material type
     */
    @Query("SELECT COUNT(r) FROM Roll r WHERE r.materialType = :materialType AND r.status IN :statuses")
    long countByMaterialAndStatus(@Param("materialType") MaterialType materialType,
                                  @Param("statuses") List<RollStatus> statuses);

    /**
     * Get statistics: total area available by material type
     */
    @Query("SELECT r.materialType, SUM(r.availableAreaM2) FROM Roll r " +
           "WHERE r.status IN (:statuses) GROUP BY r.materialType")
    List<Object[]> getTotalAreaByMaterial(@Param("statuses") List<RollStatus> statuses);

    /**
     * Find all rolls in user's assigned altiers
     */
    @Query("SELECT r FROM Roll r WHERE r.altier.id IN (:altierIds) ORDER BY r.receivedDate DESC")
    List<Roll> findByAltierIds(@Param("altierIds") List<UUID> altierIds);

    /**
     * Find available rolls in user's assigned altiers (FIFO-compatible)
     */
    @EntityGraph(attributePaths = {"article", "article.color", "supplier", "altier"})
    @Query("SELECT r FROM Roll r WHERE r.altier.id IN (:altierIds) " +
           "AND r.status IN (:statuses) ORDER BY r.receivedDate ASC")
    List<Roll> findAvailableByAltierIds(@Param("altierIds") List<UUID> altierIds,
                                       @Param("statuses") List<RollStatus> statuses);

    @EntityGraph(attributePaths = {"article", "article.color", "supplier", "altier"})
    @Query("SELECT r FROM Roll r " +
           "JOIN r.article article " +
           "WHERE r.altier.id IN (:altierIds) " +
           "AND article.id = :articleId " +
           "AND r.status IN (:statuses) " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findAvailableByAltierIdsAndArticle(
           @Param("altierIds") List<UUID> altierIds,
           @Param("articleId") UUID articleId,
           @Param("statuses") List<RollStatus> statuses);

    /**
     * Find available rolls for a specific material in user's assigned altiers.
     */
    @Query("SELECT r FROM Roll r WHERE r.altier.id IN (:altierIds) " +
           "AND r.materialType = :materialType " +
           "AND r.status IN (:statuses) " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findAvailableByAltierIdsAndMaterial(
           @Param("altierIds") List<UUID> altierIds,
           @Param("materialType") MaterialType materialType,
           @Param("statuses") List<RollStatus> statuses);

    /**
     * Paged roll search with optional filters and altier restriction
     */
    @EntityGraph(attributePaths = {"article", "article.color", "supplier", "altier"})
    @Query("SELECT r FROM Roll r " +
           "WHERE r.altier.id IN (:altierIds) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:articleId IS NULL OR r.article.id = :articleId) " +
           "AND (:materialType IS NULL OR r.materialType = :materialType) " +
           "AND (:supplierId IS NULL OR r.supplier.id = :supplierId) " +
           "AND (:altierId IS NULL OR r.altier.id = :altierId) " +
           "AND (:colorId IS NULL OR r.article.color.id = :colorId) " +
           "AND (:nbPlis IS NULL OR r.nbPlis = :nbPlis) " +
           "AND (:thicknessMm IS NULL OR r.thicknessMm = :thicknessMm) " +
           "AND r.receivedDate >= :fromDate " +
           "AND r.receivedDate <= :toDate " +
           "AND (:search = '' OR " +
           "LOWER(r.qrCode) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(r.supplier.name) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(r.altier.libelle) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(r.materialType) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(r.article.reference) LIKE CONCAT('%', :search, '%'))")
    Page<Roll> findFiltered(
            @Param("altierIds") List<UUID> altierIds,
            @Param("status") RollStatus status,
            @Param("articleId") UUID articleId,
            @Param("materialType") MaterialType materialType,
            @Param("supplierId") UUID supplierId,
            @Param("altierId") UUID altierId,
            @Param("colorId") UUID colorId,
            @Param("nbPlis") Integer nbPlis,
            @Param("thicknessMm") BigDecimal thicknessMm,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Find rolls by supplier and material type
     * Used for chute form dropdown when selecting from existing rolls
     */
    @EntityGraph(attributePaths = {"article", "article.color", "supplier", "altier"})
    @Query("SELECT r FROM Roll r WHERE r.supplier.id = :supplierId " +
           "AND r.materialType = :materialType " +
           "AND r.status IN (:statuses) " +
           "ORDER BY r.receivedDate ASC")
    List<Roll> findBySupplierAndMaterial(
            @Param("supplierId") UUID supplierId,
            @Param("materialType") MaterialType materialType,
            @Param("statuses") List<RollStatus> statuses);

    /**
     * Get statistics by material type only (aggregated across all waste types)
     * Returns count and total area for each material
     */
    @Query("SELECT r.materialType, COUNT(r), SUM(r.availableAreaM2) FROM Roll r " +
           "WHERE r.status IN (:statuses) " +
           "GROUP BY r.materialType")
    List<Object[]> getStatsByMaterial(@Param("statuses") List<RollStatus> statuses);

    /**
     * Get inventory stats for a set of altiers (scoped for user permissions).
     * Returns: materialType, count, totalArea
     */
    @Query("SELECT r.materialType, COUNT(r), SUM(r.areaM2) FROM Roll r " +
           "WHERE r.altier.id IN (:altierIds) " +
           "AND r.status IN (:statuses) " +
           "GROUP BY r.materialType")
    List<Object[]> getStatsByMaterialForAltiers(
            @Param("altierIds") List<UUID> altierIds,
            @Param("statuses") List<RollStatus> statuses);

    /**
     * Fetch recent rolls for a set of altiers (LIMIT via Pageable).
     */
    @Query("SELECT r FROM Roll r JOIN FETCH r.article ra LEFT JOIN FETCH ra.color WHERE r.altier.id IN (:altierIds) ORDER BY r.receivedDate DESC")
    List<Roll> findRecentByAltierIds(@Param("altierIds") List<UUID> altierIds, Pageable pageable);

    /**
     * Transfer sources: rolls that are AVAILABLE/OPENED in a given altier and not already reserved
     * by a pending transfer bon movement (transferBon != null AND dateEntree IS NULL).
     */
    @Query("SELECT r FROM Roll r " +
           "JOIN FETCH r.article ra " +
           "LEFT JOIN FETCH ra.color " +
           "WHERE r.altier.id IN (:accessibleAltierIds) " +
           "AND r.altier.id = :fromAltierId " +
           "AND r.status IN (:statuses) " +
           "AND NOT EXISTS (" +
           "  SELECT 1 FROM RollMovement rm " +
           "  WHERE rm.roll = r " +
           "  AND rm.fromAltier.id = :fromAltierId " +
           "  AND rm.transferBon IS NOT NULL " +
           "  AND rm.dateEntree IS NULL" +
           ")")
    Page<Roll> findTransferSources(
           @Param("accessibleAltierIds") List<UUID> accessibleAltierIds,
           @Param("fromAltierId") UUID fromAltierId,
           @Param("statuses") List<RollStatus> statuses,
           Pageable pageable);
       /**
        * Group by color, nbPlis, thicknessMm, materialType, altierId, status
        */
    @Query("""
        SELECT 
               r.article.color.id, 
               c.name, 
               c.hexCode, 
               r.nbPlis, 
               r.thicknessMm, 
               r.materialType, 
               r.altier.id, 
               a.libelle,
               r.status, 
               COUNT(r), 
               SUM(r.areaM2),
               SUM(r.usedAreaM2)       
        FROM Roll r
        LEFT JOIN r.article.color c
        LEFT JOIN r.supplier s
        LEFT JOIN r.altier a
        GROUP BY 
               r.article.color.id, c.name, c.hexCode, 
               r.nbPlis, r.thicknessMm, r.materialType,  
               r.altier.id, r.status , a.libelle
        """)
       List<Object[]> groupByAllFields();

    @Query("""
        select new com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint(
            count(r),
            max(r.updatedAt),
            coalesce(sum(coalesce(r.availableAreaM2, r.areaM2)), 0)
        )
        from Roll r
        join r.article article
        where article.id = :articleId
          and r.status in (com.albelt.gestionstock.shared.enums.RollStatus.AVAILABLE, com.albelt.gestionstock.shared.enums.RollStatus.OPENED)
          and (:altierId is null or r.altier.id = :altierId)
          and (:colorId is null or article.color.id = :colorId)
        """)
    OptimizationCandidateFingerprint findOptimizationFingerprint(
        @Param("articleId") UUID articleId,
        @Param("colorId") UUID colorId,
        @Param("altierId") UUID altierId
    );

    @Query("""
        select new com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot(
            com.albelt.gestionstock.domain.optimization.entity.OptimizationSourceType.ROLL,
            r.id,
            null,
            article.id,
            coalesce(r.widthRemainingMm, r.widthMm),
            coalesce(r.lengthRemainingM, r.lengthM),
            coalesce(r.availableAreaM2, r.areaM2),
            r.areaM2,
            article.nbPlis,
            article.thicknessMm,
            color.id,
            article.reference,
            r.receivedDate,
            r.updatedAt
        )
        from Roll r
        join r.article article
        left join article.color color
        where article.id = :articleId
          and r.status in (com.albelt.gestionstock.shared.enums.RollStatus.AVAILABLE, com.albelt.gestionstock.shared.enums.RollStatus.OPENED)
          and (:altierId is null or r.altier.id = :altierId)
          and (:colorId is null or color.id = :colorId)
        order by r.receivedDate asc, r.createdAt asc
        """)
    List<OptimizationSourceSnapshot> findOptimizationCandidates(
        @Param("articleId") UUID articleId,
        @Param("colorId") UUID colorId,
        @Param("altierId") UUID altierId
    );
}

