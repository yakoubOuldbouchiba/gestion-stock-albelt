package com.albelt.gestionstock.domain.clients.repository;

import com.albelt.gestionstock.domain.clients.entity.ClientAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Client Address Repository - Data access layer for ClientAddress entity
 */
@Repository
public interface ClientAddressRepository extends JpaRepository<ClientAddress, UUID> {

    /**
     * Find all addresses for a client
     */
    List<ClientAddress> findByClientId(UUID clientId);

    /**
     * Find main address for a client
     */
    Optional<ClientAddress> findByClientIdAndIsMainTrue(UUID clientId);

    /**
     * Find all main addresses for a client (there can be multiple)
     */
    @Query("SELECT ca FROM ClientAddress ca WHERE ca.client.id = :clientId AND ca.isMain = true")
    List<ClientAddress> findMainAddressesByClientId(@Param("clientId") UUID clientId);

    /**
     * Find addresses by type
     */
    @Query("SELECT ca FROM ClientAddress ca WHERE ca.client.id = :clientId AND ca.addressType = :addressType")
    List<ClientAddress> findByClientIdAndAddressType(@Param("clientId") UUID clientId, @Param("addressType") String addressType);

    /**
     * Find addresses by country
     */
    List<ClientAddress> findByClientIdAndCountry(UUID clientId, String country);
}
