package com.albelt.gestionstock.domain.clients.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Client Address Entity - Represents an address for a client
 */
@Entity
@Table(name = "client_addresses", indexes = {
        @Index(name = "idx_client_addresses_client_id", columnList = "client_id"),
        @Index(name = "idx_client_addresses_is_main", columnList = "client_id, is_main")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "street_address", nullable = false, length = 500)
    private String streetAddress;

    @Column(name = "city", length = 200)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", nullable = false, length = 100)
    @Builder.Default
    private String country = "DZ";

    @Column(name = "is_main", nullable = false)
    @Builder.Default
    private Boolean isMain = false;

    @Column(name = "address_type", length = 50)
    @Builder.Default
    private String addressType = "BUSINESS"; // BUSINESS, BILLING, SHIPPING, OTHER

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
