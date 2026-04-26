package com.albelt.gestionstock.domain.purchasebons.repository;

import com.albelt.gestionstock.domain.purchasebons.entity.PurchaseBon;
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
public interface PurchaseBonRepository extends JpaRepository<PurchaseBon, UUID> {

    boolean existsByReferenceIgnoreCase(String reference);

    List<PurchaseBon> findAllByOrderByCreatedAtDesc();

        /**
         * Paged purchase bon search with optional filters
         */
          @Query(value = "SELECT DISTINCT pb FROM PurchaseBon pb " +
              "LEFT JOIN FETCH pb.items i " +
              "LEFT JOIN FETCH i.article a " +
              "LEFT JOIN FETCH a.color " +
              "WHERE (:status IS NULL OR pb.status = :status) " +
              "AND (:supplierId IS NULL OR pb.supplier.id = :supplierId) " +
              "AND (:fromDate IS NULL OR pb.bonDate >= :fromDate) " +
              "AND (:toDate IS NULL OR pb.bonDate <= :toDate) " +
              "AND (:search = '' OR LOWER(pb.reference) LIKE CONCAT('%', :search, '%')) ",
              countQuery = "SELECT COUNT(pb) FROM PurchaseBon pb " +
              "WHERE (:status IS NULL OR pb.status = :status) " +
              "AND (:supplierId IS NULL OR pb.supplier.id = :supplierId) " +
              "AND (:fromDate IS NULL OR pb.bonDate >= :fromDate) " +
              "AND (:toDate IS NULL OR pb.bonDate <= :toDate) " +
              "AND (:search = '' OR LOWER(pb.reference) LIKE CONCAT('%', :search, '%')) ")
        Page<PurchaseBon> findFiltered(
            @Param("status") com.albelt.gestionstock.shared.enums.PurchaseBonStatus status,
            @Param("supplierId") UUID supplierId,
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate") java.time.LocalDate toDate,
            @Param("search") String search,
            Pageable pageable);

    @EntityGraph(attributePaths = {"items", "items.color", "items.altier", "items.article", "items.article.color", "supplier", "createdBy"})
    Optional<PurchaseBon> findWithItemsById(UUID id);
}
