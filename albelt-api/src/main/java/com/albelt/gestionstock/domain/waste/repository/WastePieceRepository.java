package com.albelt.gestionstock.domain.waste.repository;

import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Repository for WastePiece entity
 * Reuse management and waste tracking
 */
@Repository
public interface WastePieceRepository extends JpaRepository<WastePiece, UUID> {

    @Override
    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    java.util.Optional<WastePiece> findById(UUID id);

    /**
     * Find available waste pieces for a specific material (potential for reuse)
     * Uses composite index: (material_type, status, area_m2 DESC)
     */
    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE wp.materialType = :materialType " +
            "AND wp.status IN (:statuses) ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findAvailableByMaterial(@Param("materialType") MaterialType materialType,
                                             @Param("statuses") List<WasteStatus> statuses,
                                             Pageable pageable);

    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE ra.id = :articleId " +
            "AND wp.status IN (:statuses) " +
            "AND (wp.wasteType = com.albelt.gestionstock.shared.enums.WasteType.CHUTE_EXPLOITABLE or wp.wasteType is null) " +
            "ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findAvailableByArticle(@Param("articleId") UUID articleId,
                                            @Param("statuses") List<WasteStatus> statuses,
                                            Pageable pageable);

    /**
     * Find available waste pieces for a specific material, optionally restricted to an altier.
     */
    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE wp.materialType = :materialType " +
            "AND wp.status IN (:statuses) " +
            "AND (:altierId IS NULL OR wp.altier.id = :altierId) " +
            "ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findAvailableByMaterialAndAltier(@Param("materialType") MaterialType materialType,
                                                      @Param("statuses") List<WasteStatus> statuses,
                                                      @Param("altierId") UUID altierId,
                                                      Pageable pageable);

    /**
     * Find large waste pieces (> 3m²) ready for reuse
     * Critical for waste reuse workflow
     */
    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE wp.availableAreaM2 >= 3.0 " +
            "AND wp.status IN (:statuses) ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findLargeAvailablePieces(@Param("statuses") List<WasteStatus> statuses,
                                              Pageable pageable);

    /**
     * Paged waste piece search with optional filters
     */
    @EntityGraph(attributePaths = {"article", "article.color"})
    @Query("SELECT wp FROM WastePiece wp " +
            "WHERE (:unrestricted = true OR wp.altier.id IN (:altierIds)) " +
            "AND (:articleId IS NULL OR wp.article.id = :articleId) " +
            "AND (:materialType IS NULL OR wp.materialType = :materialType) " +
            "AND (:status IS NULL OR wp.status = :status) " +
            "AND (:wasteType IS NULL OR wp.wasteType = :wasteType) " +
            "AND (:altierId IS NULL OR wp.altier.id = :altierId) " +
            "AND (:colorId IS NULL OR wp.article.color.id = :colorId) " +
            "AND (:nbPlis IS NULL OR wp.nbPlis = :nbPlis) " +
            "AND (:thicknessMm IS NULL OR wp.thicknessMm = :thicknessMm) " +
            "AND wp.createdAt >= :fromDate " +
            "AND wp.createdAt <= :toDate " +
            "AND (:search = '' OR " +
            "CAST(wp.lotId AS string) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(wp.qrCode) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(wp.materialType) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(wp.article.reference) LIKE CONCAT('%', :search, '%')) ")
    Page<WastePiece> findFiltered(
            @Param("unrestricted") boolean unrestricted,
            @Param("altierIds") List<UUID> altierIds,
            @Param("articleId") UUID articleId,
            @Param("materialType") MaterialType materialType,
            @Param("status") WasteStatus status,
            @Param("wasteType") WasteType wasteType,
            @Param("altierId") UUID altierId,
            @Param("colorId") UUID colorId,
            @Param("nbPlis") Integer nbPlis,
            @Param("thicknessMm") BigDecimal thicknessMm,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Find reuse candidates with sufficient area
     */
    @EntityGraph(attributePaths = {"article", "article.color", "altier", "roll"})
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE wp.materialType = :materialType " +
            "AND wp.availableAreaM2 >= :minArea " +
            "AND wp.status IN (:statuses) " +
            "ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findReuseCandidate(@Param("materialType") MaterialType materialType,
                                        @Param("minArea") BigDecimal minArea,
                                        @Param("statuses") List<WasteStatus> statuses);

    /**
     * Find waste pieces for a specific commande item
     */
    @EntityGraph(attributePaths = {"article", "article.color"})
    @Query("SELECT wp FROM WastePiece wp WHERE wp.commandeItemId = :commandeItemId ORDER BY wp.areaM2 DESC")
    List<WastePiece> findByCommandeItem(@Param("commandeItemId") UUID commandeItemId);

    /**
     * Find waste pieces for a specific roll
     */
    @EntityGraph(attributePaths = {"article", "article.color"})
    @Query("SELECT wp FROM WastePiece wp WHERE wp.roll.id = :rollId ORDER BY wp.createdAt DESC")
    List<WastePiece> findByRollId(@Param("rollId") UUID rollId);

    /**
     * Count waste pieces by status
     */
    @Query("SELECT COUNT(wp) FROM WastePiece wp WHERE wp.status = :status")
    long countByStatus(@Param("status") WasteStatus status);

    /**
     * Count waste pieces by material and status
     */
    @Query("SELECT COUNT(wp) FROM WastePiece wp WHERE wp.materialType = :materialType AND wp.status = :status")
    long countByMaterialAndStatus(@Param("materialType") MaterialType materialType,
                                  @Param("status") WasteStatus status);

    /**
     * Get total waste area by material type
     */
    @Query("SELECT wp.materialType, SUM(wp.availableAreaM2) FROM WastePiece wp " +
            "WHERE wp.status IN (:statuses) GROUP BY wp.materialType")
    List<Object[]> getTotalWasteAreaByMaterial(@Param("statuses") List<WasteStatus> statuses);

    /**
     * Dashboard stats: count/area grouped by status for a set of altiers.
     * Returns: status, count, totalArea
     */
    @Query("SELECT wp.status, COUNT(wp), SUM(wp.areaM2) FROM WastePiece wp " +
            "WHERE (:unrestricted = true OR wp.altier.id IN (:altierIds)) " +
            "GROUP BY wp.status")
    List<Object[]> getStatsByStatusForAltiers(@Param("unrestricted") boolean unrestricted,
                                              @Param("altierIds") List<UUID> altierIds);

    /**
     * Get waste reuse efficiency (total reused vs total generated)
     */
    @Query("SELECT COUNT(CASE WHEN wp.status = 'EXHAUSTED' THEN 1 END) as reused, " +
            "COUNT(*) as total FROM WastePiece wp WHERE wp.materialType = :materialType")
    Object[] getWasteReuseStats(@Param("materialType") MaterialType materialType);

    /**
     * Group by color, nbPlis, thicknessMm, materialType, altierId, status — scoped by atelier access.
     */
    @Query("SELECT wp.article.color.id," +
            "    wp.article.color.name, " +
            "    wp.article.color.hexCode," +
            "    wp.nbPlis," +
            "    wp.thicknessMm," +
            "    wp.materialType, " +
            "    wp.altier.id," +
            "    wp.altier.libelle," +
            "    wp.status, " +
            "    COUNT(wp)," +
            "    SUM(wp.areaM2), " +
            "    SUM(wp.usedAreaM2) " +
            "FROM WastePiece wp " +
            "WHERE wp.wasteType = :type " +
            "AND (:unrestricted = true OR wp.altier.id IN (:altierIds)) " +
            "GROUP BY wp.article.color.id," +
            "         wp.article.color.name," +
            "         wp.article.color.hexCode, " +
            "         wp.status," +
            "         wp.nbPlis, " +
            "         wp.thicknessMm," +
            "         wp.materialType," +
            "         wp.altier.id," +
            "         wp.altier.libelle "
    )
    List<Object[]> groupByAllFields(@Param("unrestricted") boolean unrestricted,
                                    @Param("altierIds") List<UUID> altierIds,
                                    @Param("type") WasteType type);

    /**
     * Transfer sources: reusable waste pieces (CHUTE_EXPLOITABLE) that are AVAILABLE/OPENED in a given altier
     * and not already reserved by a pending transfer bon movement (transferBon != null AND dateEntree IS NULL).
     */
    @Query("SELECT wp FROM WastePiece wp " +
            "JOIN FETCH wp.article ra " +
            "LEFT JOIN FETCH ra.color " +
            "WHERE wp.altier.id IN (:accessibleAltierIds) " +
            "AND wp.altier.id = :fromAltierId " +
            "AND wp.wasteType = :wasteType " +
            "AND wp.status IN (:statuses) " +
            "AND NOT EXISTS (" +
            "  SELECT 1 FROM RollMovement rm " +
            "  WHERE rm.wastePiece = wp " +
            "  AND rm.fromAltier.id = :fromAltierId " +
            "  AND rm.transferBon IS NOT NULL " +
            "  AND rm.dateEntree IS NULL" +
            ")")
    Page<WastePiece> findTransferSources(
            @Param("accessibleAltierIds") List<UUID> accessibleAltierIds,
            @Param("fromAltierId") UUID fromAltierId,
            @Param("wasteType") WasteType wasteType,
            @Param("statuses") List<WasteStatus> statuses,
            Pageable pageable);

    @Query("SELECT w.roll.materialType, COUNT(w), SUM(w.availableAreaM2) FROM WastePiece w " +
            "WHERE w.status IN (:activeStatuses) and w.wasteType = :wasteType " +
            "GROUP BY w.roll.materialType")
    List<Object[]> getStatsByMaterial(@Param("wasteType") WasteType wasteType,
                                      @Param("activeStatuses") List<WasteStatus> activeStatuses);

    @Query("""
            select new com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint(
                count(wp),
                max(wp.updatedAt),
                coalesce(sum(coalesce(wp.availableAreaM2, wp.areaM2)), 0)
            )
            from WastePiece wp
            join wp.article article
            where article.id = :articleId
              and wp.status in (com.albelt.gestionstock.shared.enums.WasteStatus.AVAILABLE, com.albelt.gestionstock.shared.enums.WasteStatus.OPENED)
              and (wp.wasteType = com.albelt.gestionstock.shared.enums.WasteType.CHUTE_EXPLOITABLE or wp.wasteType is null)
              and (:altierId is null or wp.altier.id = :altierId)
              and (:colorId is null or article.color.id = :colorId)
            """)
    OptimizationCandidateFingerprint findOptimizationFingerprint(
            @Param("articleId") UUID articleId,
            @Param("colorId") UUID colorId,
            @Param("altierId") UUID altierId
    );

    @Query("""
            select new com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot(
                com.albelt.gestionstock.domain.optimization.entity.OptimizationSourceType.WASTE,
                null,
                wp.id,
                article.id,
                coalesce(wp.widthRemainingMm, wp.widthMm),
                coalesce(wp.lengthRemainingM, wp.lengthM),
                coalesce(wp.availableAreaM2, wp.areaM2),
                wp.areaM2,
                cast(wp.status as string),
                article.nbPlis,
                article.thicknessMm,
                color.id,
                article.reference,
                null,
                wp.updatedAt
            )
            from WastePiece wp
            join wp.article article
            left join article.color color
            where article.id = :articleId
              and wp.status in (com.albelt.gestionstock.shared.enums.WasteStatus.AVAILABLE, com.albelt.gestionstock.shared.enums.WasteStatus.OPENED)
              and (wp.wasteType = com.albelt.gestionstock.shared.enums.WasteType.CHUTE_EXPLOITABLE or wp.wasteType is null)
              and (:altierId is null or wp.altier.id = :altierId)
              and (:colorId is null or color.id = :colorId)
            order by coalesce(wp.availableAreaM2, wp.areaM2) desc, wp.createdAt asc
            """)
    List<OptimizationSourceSnapshot> findOptimizationCandidates(
            @Param("articleId") UUID articleId,
            @Param("colorId") UUID colorId,
            @Param("altierId") UUID altierId
    );
}
