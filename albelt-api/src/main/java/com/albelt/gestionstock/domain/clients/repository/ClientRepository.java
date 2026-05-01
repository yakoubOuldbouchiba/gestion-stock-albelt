package com.albelt.gestionstock.domain.clients.repository;

import com.albelt.gestionstock.domain.clients.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Client Repository - Data access layer for Client entity
 */
@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    /**
     * Find client by name (case-insensitive)
     */
    Optional<Client> findByNameIgnoreCase(String name);

    /**
     * Search clients by name pattern
     */
    @Query("SELECT c FROM Client c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY c.name ASC")
    List<Client> searchByNamePattern(@Param("namePattern") String namePattern);

    /**
     * Find all active clients
     */
    @Query("SELECT c FROM Client c WHERE c.isActive = true ORDER BY c.name ASC")
    List<Client> findAllActive();

    /**
     * Find all inactive clients
     */
    @Query("SELECT c FROM Client c WHERE c.isActive = false ORDER BY c.name ASC")
    List<Client> findAllInactive();

    /**
     * Find all clients ordered by creation date (recent first)
     */
    @Query("SELECT c FROM Client c ORDER BY c.createdAt DESC")
    List<Client> findAllRecentFirst();

    /**
     * Paged client search with optional filters
     */
    @Query("SELECT c FROM Client c " +
            "WHERE (:search = '' OR LOWER(c.name) LIKE CONCAT('%', :search, '%')) " +
            "AND (:isActive IS NULL OR c.isActive = :isActive) " +
            "AND c.createdAt >= :fromDate " +
            "AND c.createdAt <= :toDate")
    Page<Client> findFiltered(
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);

    /**
     * Count active clients
     */
    long countByIsActiveTrue();
}
