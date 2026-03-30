package com.albelt.gestionstock.domain.suppliers.repository;

import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
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
 * Repository for Supplier entity
 * Provides CRUD operations and custom queries for supplier management
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    /**
     * Find supplier by name (case-insensitive)
     */
    Optional<Supplier> findByNameIgnoreCase(String name);

    /**
     * Find all suppliers in a specific country
     */
    List<Supplier> findByCountryOrderByNameAsc(String country);

    /**
     * Find suppliers by partial name match
     */
       @Query("SELECT s FROM Supplier s WHERE LOWER(s.name) LIKE CONCAT('%', :namePattern, '%') ORDER BY s.name ASC")
    List<Supplier> searchByNamePattern(@Param("namePattern") String namePattern);

    /**
     * Find all suppliers sorted by creation date (most recent first)
     */
    @Query("SELECT s FROM Supplier s ORDER BY s.createdAt DESC")
    List<Supplier> findAllRecentFirst();

    /**
     * Paged supplier search with optional filters
     */
    @Query("SELECT s FROM Supplier s " +
           "WHERE (:search = '' OR " +
           "LOWER(s.name) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(s.country) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(s.contactPerson) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(s.email) LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(s.phone) LIKE CONCAT('%', :search, '%')) " +
           "AND (:country = '' OR LOWER(s.country) = :country) " +
           "AND s.createdAt >= :fromDate " +
           "AND s.createdAt <= :toDate")
    Page<Supplier> findFiltered(
            @Param("search") String search,
            @Param("country") String country,
            @Param("fromDate") java.time.LocalDateTime fromDate,
            @Param("toDate") java.time.LocalDateTime toDate,
            Pageable pageable);
}
