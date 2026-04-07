package com.albelt.gestionstock.domain.waste.repository;

import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * Find available waste pieces for a specific material (potential for reuse)
     * Uses composite index: (material_type, status, area_m2 DESC)
     */
    @Query("SELECT wp FROM WastePiece wp WHERE wp.materialType = :materialType " +
           "AND wp.status IN (:statuses) ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findAvailableByMaterial(@Param("materialType") MaterialType materialType,
                                             @Param("statuses") List<WasteStatus> statuses,
                                             Pageable pageable);

    /**
     * Find large waste pieces (> 3m²) ready for reuse
     * Critical for waste reuse workflow
     */
    @Query("SELECT wp FROM WastePiece wp WHERE wp.availableAreaM2 >= 3.0 " +
           "AND wp.status IN (:statuses) ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findLargeAvailablePieces(@Param("statuses") List<WasteStatus> statuses,
                                              Pageable pageable);

    /**
     * Paged waste piece search with optional filters
     */
    @Query("SELECT wp FROM WastePiece wp " +
           "WHERE (:materialType IS NULL OR wp.materialType = :materialType) " +
           "AND (:status IS NULL OR wp.status = :status) " +
           "AND (:altierId IS NULL OR wp.altier.id = :altierId) " +
          "AND (:colorId IS NULL OR wp.color.id = :colorId) " +
          "AND (:nbPlis IS NULL OR wp.nbPlis = :nbPlis) " +
          "AND (:thicknessMm IS NULL OR wp.thicknessMm = :thicknessMm) " +
           "AND wp.createdAt >= :fromDate " +
           "AND wp.createdAt <= :toDate " +
           "AND (:search = '' OR " +
           "LOWER(wp.qrCode) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(wp.materialType) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(wp.reference) LIKE CONCAT('%', :search, '%')) ")
    Page<WastePiece> findFiltered(
            @Param("materialType") MaterialType materialType,
            @Param("status") WasteStatus status,
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
    @Query("SELECT wp FROM WastePiece wp WHERE wp.materialType = :materialType " +
           "AND wp.availableAreaM2 >= :minArea " +
           "AND wp.status IN (:statuses) " +
           "ORDER BY wp.availableAreaM2 DESC")
    List<WastePiece> findReuseCandidate(@Param("materialType") MaterialType materialType,
                                        @Param("minArea") BigDecimal minArea,
                                        @Param("statuses") List<WasteStatus> statuses);

    /**
     * Find waste pieces for a specific commande item
     */
    @Query("SELECT wp FROM WastePiece wp WHERE wp.commandeItemId = :commandeItemId ORDER BY wp.areaM2 DESC")
    List<WastePiece> findByCommandeItem(@Param("commandeItemId") UUID commandeItemId);

       /**
        * Find waste pieces for a specific roll
        */
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
     * Get waste reuse efficiency (total reused vs total generated)
     */
    @Query("SELECT COUNT(CASE WHEN wp.status = 'EXHAUSTED' THEN 1 END) as reused, " +
           "COUNT(*) as total FROM WastePiece wp WHERE wp.materialType = :materialType")
    Object[] getWasteReuseStats(@Param("materialType") MaterialType materialType);
       /**
        * Group by color, nbPlis, thicknessMm, materialType, altierId, status
        */
       @Query("SELECT wp.color.id," +
               "    wp.color.name, " +
               "    wp.color.hexCode," +
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
               "Where wp.wasteType = :type " +
               "GROUP BY wp.color.id," +
               "         wp.color.name," +
               "         wp.color.hexCode, " +
               "         wp.status," +
               "         wp.nbPlis, " +
               "         wp.thicknessMm," +
               "         wp.materialType," +
               "         wp.altier.id," +
               "         wp.altier.libelle "
       )
       List<Object[]> groupByAllFields(@Param("type") WasteType type);
}
