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
 * Client Phone Entity - Represents a phone number for a client
 */
@Entity
@Table(name = "client_phones", indexes = {
        @Index(name = "idx_client_phones_client_id", columnList = "client_id"),
        @Index(name = "idx_client_phones_is_main", columnList = "client_id, is_main")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientPhone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "is_main", nullable = false)
    @Builder.Default
    private Boolean isMain = false;

    @Column(name = "phone_type", length = 50)
    @Builder.Default
    private String phoneType = "MOBILE"; // MOBILE, LANDLINE, OTHER

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
