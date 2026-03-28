package com.albelt.gestionstock.domain.suppliers.repository;

import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
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
    @Query("SELECT s FROM Supplier s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY s.name ASC")
    List<Supplier> searchByNamePattern(@Param("namePattern") String namePattern);

    /**
     * Find all suppliers sorted by creation date (most recent first)
     */
    @Query("SELECT s FROM Supplier s ORDER BY s.createdAt DESC")
    List<Supplier> findAllRecentFirst();
}
