package com.albelt.gestionstock.domain.clients.repository;

import com.albelt.gestionstock.domain.clients.entity.ClientEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Client Email Repository - Data access layer for ClientEmail entity
 */
@Repository
public interface ClientEmailRepository extends JpaRepository<ClientEmail, UUID> {

    /**
     * Find all emails for a client
     */
    List<ClientEmail> findByClientId(UUID clientId);

    /**
     * Find main email for a client
     */
    Optional<ClientEmail> findByClientIdAndIsMainTrue(UUID clientId);

    /**
     * Find all main emails for a client (there can be multiple)
     */
    @Query("SELECT ce FROM ClientEmail ce WHERE ce.client.id = :clientId AND ce.isMain = true")
    List<ClientEmail> findMainEmailsByClientId(@Param("clientId") UUID clientId);

    /**
     * Find emails by type
     */
    @Query("SELECT ce FROM ClientEmail ce WHERE ce.client.id = :clientId AND ce.emailType = :emailType")
    List<ClientEmail> findByClientIdAndEmailType(@Param("clientId") UUID clientId, @Param("emailType") String emailType);
}
