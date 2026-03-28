package com.albelt.gestionstock.domain.clients.repository;

import com.albelt.gestionstock.domain.clients.entity.ClientRepresentative;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Client Representative Repository - Data access layer for ClientRepresentative entity
 */
@Repository
public interface ClientRepresentativeRepository extends JpaRepository<ClientRepresentative, UUID> {

    /**
     * Find all representatives for a client
     */
    List<ClientRepresentative> findByClientId(UUID clientId);

    /**
     * Find primary representative for a client
     */
    Optional<ClientRepresentative> findByClientIdAndIsPrimaryTrue(UUID clientId);

    /**
     * Find all representatives for a client ordered by creation date
     */
    @Query("SELECT cr FROM ClientRepresentative cr WHERE cr.client.id = :clientId ORDER BY cr.createdAt DESC")
    List<ClientRepresentative> findByClientIdOrderByCreatedAtDesc(@Param("clientId") UUID clientId);

    /**
     * Search representatives by name
     */
    @Query("SELECT cr FROM ClientRepresentative cr WHERE cr.client.id = :clientId AND LOWER(cr.name) LIKE LOWER(CONCAT('%', :namePattern, '%'))")
    List<ClientRepresentative> findByClientIdAndNamePattern(@Param("clientId") UUID clientId, @Param("namePattern") String namePattern);
}
