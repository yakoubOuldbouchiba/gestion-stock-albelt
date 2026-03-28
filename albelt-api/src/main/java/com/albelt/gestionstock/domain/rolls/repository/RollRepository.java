package com.albelt.gestionstock.domain.rolls.repository;

import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
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
     * Find rolls with sufficient area for cutting
     */
    @Query("SELECT r FROM Roll r WHERE r.materialType = :materialType " +
           "AND r.status IN (:statuses) " +
           "AND r.areaM2 >= :requiredArea " +
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
    @Query("SELECT r.materialType, SUM(r.areaM2) FROM Roll r " +
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
    @Query("SELECT r FROM Roll r WHERE r.altier.id IN (:altierIds) " +
           "AND r.status IN (:statuses) ORDER BY r.receivedDate ASC")
    List<Roll> findAvailableByAltierIds(@Param("altierIds") List<UUID> altierIds,
                                       @Param("statuses") List<RollStatus> statuses);

    /**
     * Find rolls by supplier and material type
     * Used for chute form dropdown when selecting from existing rolls
     */
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
    @Query("SELECT r.materialType, COUNT(r), SUM(r.areaM2) FROM Roll r " +
           "WHERE r.status IN (:statuses) " +
           "GROUP BY r.materialType")
    List<Object[]> getStatsByMaterial(@Param("statuses") List<RollStatus> statuses);
}

