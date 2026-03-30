package com.albelt.gestionstock.domain.rolls.repository;

import com.albelt.gestionstock.domain.rolls.entity.TransferBon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransferBonRepository extends JpaRepository<TransferBon, UUID> {

    List<TransferBon> findAllByOrderByCreatedAtDesc();

        /**
         * Paged transfer bon search with optional filters
         */
        @Query("SELECT tb FROM TransferBon tb " +
           "WHERE (:fromAltierId IS NULL OR tb.fromAltier.id = :fromAltierId) " +
           "AND (:toAltierId IS NULL OR tb.toAltier.id = :toAltierId) " +
           "AND (:statusEntree IS NULL OR tb.statusEntree = :statusEntree) " +
              "AND tb.dateSortie >= :fromDate " +
              "AND tb.dateSortie <= :toDate " +
              "AND (:search = '' OR " +
              "LOWER(tb.notes) LIKE CONCAT('%', :search, '%')) ")
        Page<TransferBon> findFiltered(
            @Param("fromAltierId") UUID fromAltierId,
            @Param("toAltierId") UUID toAltierId,
            @Param("statusEntree") Boolean statusEntree,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("search") String search,
            Pageable pageable);

    @EntityGraph(attributePaths = {"movements", "movements.roll", "movements.fromAltier", "movements.toAltier", "movements.operator"})
    Optional<TransferBon> findWithMovementsById(UUID id);
}
