package com.albelt.gestionstock.domain.rolls.repository;

import com.albelt.gestionstock.domain.rolls.entity.RollMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for RollMovement entity
 */
@Repository
public interface RollMovementRepository extends JpaRepository<RollMovement, UUID> {

    /**
     * Find all movements for a specific roll
     */
    List<RollMovement> findByRollIdOrderByDateEntreeDesc(UUID rollId);

    Page<RollMovement> findByRollIdOrderByDateEntreeDesc(UUID rollId, Pageable pageable);

    List<RollMovement> findByWastePieceIdOrderByDateEntreeDesc(UUID wastePieceId);

    Page<RollMovement> findByWastePieceIdOrderByDateEntreeDesc(UUID wastePieceId, Pageable pageable);

    /**
     * Find movements for a roll within a date range
     */
    @Query("SELECT rm FROM RollMovement rm WHERE rm.roll.id = :rollId AND rm.dateEntree >= :startDate AND rm.dateEntree <= :endDate ORDER BY rm.dateEntree DESC")
    List<RollMovement> findMovementsByRollInDateRange(
            @Param("rollId") UUID rollId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate
    );

    /**
     * Find all movements to a specific altier
     */
    List<RollMovement> findByToAltierIdOrderByDateEntreeDesc(UUID altierID);

    Page<RollMovement> findByToAltierIdOrderByDateEntreeDesc(UUID altierID, Pageable pageable);

    Page<RollMovement> findByToAltierIdAndTransferBonIsNullOrderByDateEntreeDesc(UUID altierID, Pageable pageable);

    /**
     * Find all movements from a specific altier
     */
    List<RollMovement> findByFromAltierIdOrderByDateSortieDesc(UUID altierID);

    Page<RollMovement> findByFromAltierIdOrderByDateSortieDesc(UUID altierID, Pageable pageable);

    Page<RollMovement> findByFromAltierIdAndTransferBonIsNullOrderByDateSortieDesc(UUID altierID, Pageable pageable);

    /**
     * Find the most recent movement for a roll (current location)
     */
    @Query("SELECT rm FROM RollMovement rm WHERE rm.roll.id = :rollId ORDER BY rm.dateEntree DESC LIMIT 1")
    RollMovement findLatestMovementByRollId(@Param("rollId") UUID rollId);

    @Query("SELECT rm FROM RollMovement rm WHERE rm.wastePiece.id = :wastePieceId ORDER BY rm.dateEntree DESC LIMIT 1")
    RollMovement findLatestMovementByWastePieceId(@Param("wastePieceId") UUID wastePieceId);

    /**
     * Find all movements recorded by an operator
     */
    List<RollMovement> findByOperatorIdOrderByCreatedAtDesc(UUID operatorId);

    Page<RollMovement> findByOperatorIdOrderByCreatedAtDesc(UUID operatorId, Pageable pageable);

    /**
     * Find pending receipts for a specific altier (movements without entry date)
     */
    @Query("SELECT rm FROM RollMovement rm WHERE rm.toAltier.id = :altierID AND rm.dateEntree IS NULL ORDER BY rm.dateSortie DESC")
    List<RollMovement> findPendingReceiptsByAltier(@Param("altierID") UUID altierID);

    @Query("SELECT rm FROM RollMovement rm WHERE rm.toAltier.id = :altierID AND rm.dateEntree IS NULL ORDER BY rm.dateSortie DESC")
    Page<RollMovement> findPendingReceiptsByAltier(@Param("altierID") UUID altierID, Pageable pageable);

    @Query("SELECT rm FROM RollMovement rm WHERE rm.toAltier.id = :altierID AND rm.dateEntree IS NULL AND rm.transferBon IS NULL ORDER BY rm.dateSortie DESC")
    Page<RollMovement> findPendingReceiptsByAltierExcludeBon(@Param("altierID") UUID altierID, Pageable pageable);

    /**
     * Find all movements pending receipt (dateEntree is null)
     */
    @Query("SELECT rm FROM RollMovement rm WHERE rm.dateEntree IS NULL ORDER BY rm.dateSortie DESC")
    List<RollMovement> findAllPendingReceipts();

    @Query("SELECT rm FROM RollMovement rm WHERE rm.dateEntree IS NULL ORDER BY rm.dateSortie DESC")
    Page<RollMovement> findAllPendingReceipts(Pageable pageable);

    /**
     * Find all movements for a given transfer bon
     */
    List<RollMovement> findByTransferBon_IdOrderByCreatedAtDesc(UUID transferBonId);

    /**
     * Find movements for a given transfer bon that are not yet received
     */
    List<RollMovement> findByTransferBon_IdAndDateEntreeIsNullOrderByCreatedAtDesc(UUID transferBonId);

    long countByTransferBon_Id(UUID transferBonId);

    long countByTransferBon_IdAndStatusEntreeTrue(UUID transferBonId);
}
