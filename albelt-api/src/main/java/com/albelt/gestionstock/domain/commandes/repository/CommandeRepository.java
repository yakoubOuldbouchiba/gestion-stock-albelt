package com.albelt.gestionstock.domain.commandes.repository;

import com.albelt.gestionstock.domain.commandes.entity.Commande;
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
 * CommandeRepository - Data access for Commande entities
 */
@Repository
public interface CommandeRepository extends JpaRepository<Commande, UUID> {

    /**
     * Find order by order number
     */
    Optional<Commande> findByNumeroCommande(String numeroCommande);

    /**
     * Check if order number exists
     */
    boolean existsByNumeroCommande(String numeroCommande);

    /**
     * Find all orders for a specific client
     */
    @Query("SELECT c FROM Commande c WHERE c.client.id = :clientId ORDER BY c.createdAt DESC")
    List<Commande> findByClientId(@Param("clientId") UUID clientId);

    /**
     * Find all orders with specific status
     */
    @Query("SELECT c FROM Commande c WHERE c.status = :status ORDER BY c.createdAt DESC")
    List<Commande> findByStatus(@Param("status") String status);

    /**
     * Search orders by order number pattern
     */
    @Query("SELECT c FROM Commande c WHERE c.numeroCommande LIKE %:pattern% ORDER BY c.createdAt DESC")
    List<Commande> searchByNumeroPattern(@Param("pattern") String pattern);

    /**
     * Find all orders ordered by creation date
     */
    @Query("SELECT c FROM Commande c ORDER BY c.createdAt DESC")
    List<Commande> findAllOrderByCreatedAtDesc();

    /**
     * Paged order search with optional filters
     */
    @Query("SELECT c FROM Commande c " +
           "WHERE (:status IS NULL OR c.status = :status) " +
           "AND (:clientId IS NULL OR c.client.id = :clientId) " +
           "AND c.createdAt >= :fromDate " +
           "AND c.createdAt <= :toDate " +
           "AND (:search = '' OR LOWER(c.numeroCommande) LIKE CONCAT('%', :search, '%')) ")
    Page<Commande> findFiltered(
            @Param("status") String status,
            @Param("clientId") UUID clientId,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            @Param("search") String search,
            Pageable pageable);
}
