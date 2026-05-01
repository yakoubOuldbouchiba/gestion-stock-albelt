package com.albelt.gestionstock.domain.altier.repository;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Altier entity
 */
@Repository
public interface AltierRepository extends JpaRepository<Altier, UUID> {
    Optional<Altier> findByLibelle(String libelle);

    boolean existsByLibelle(String libelle);

    /**
     * Paged altier search with optional filters
     */
    @Query("SELECT a FROM Altier a " +
            "WHERE (:search = '' OR " +
            "LOWER(a.libelle) LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(a.adresse) LIKE CONCAT('%', :search, '%')) " +
            "AND a.createdAt >= :fromDate " +
            "AND a.createdAt <= :toDate")
    Page<Altier> findFiltered(
            @Param("search") String search,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);
}
