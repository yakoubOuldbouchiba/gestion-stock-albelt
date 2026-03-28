package com.albelt.gestionstock.domain.clients.repository;

import com.albelt.gestionstock.domain.clients.entity.ClientPhone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Client Phone Repository - Data access layer for ClientPhone entity
 */
@Repository
public interface ClientPhoneRepository extends JpaRepository<ClientPhone, UUID> {

    /**
     * Find all phones for a client
     */
    List<ClientPhone> findByClientId(UUID clientId);

    /**
     * Find main phone for a client
     */
    Optional<ClientPhone> findByClientIdAndIsMainTrue(UUID clientId);

    /**
     * Find all main phones for a client (there can be multiple)
     */
    @Query("SELECT cp FROM ClientPhone cp WHERE cp.client.id = :clientId AND cp.isMain = true")
    List<ClientPhone> findMainPhonesByClientId(@Param("clientId") UUID clientId);

    /**
     * Find phones by type
     */
    @Query("SELECT cp FROM ClientPhone cp WHERE cp.client.id = :clientId AND cp.phoneType = :phoneType")
    List<ClientPhone> findByClientIdAndPhoneType(@Param("clientId") UUID clientId, @Param("phoneType") String phoneType);
}
