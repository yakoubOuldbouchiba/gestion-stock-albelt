package com.albelt.gestionstock.domain.clients.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Client Email Entity - Represents an email address for a client
 */
@Entity
@Table(name = "client_emails", indexes = {
        @Index(name = "idx_client_emails_client_id", columnList = "client_id"),
        @Index(name = "idx_client_emails_is_main", columnList = "client_id, is_main")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientEmail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "email_address", nullable = false, length = 255)
    private String emailAddress;

    @Column(name = "is_main", nullable = false)
    @Builder.Default
    private Boolean isMain = false;

    @Column(name = "email_type", length = 50)
    @Builder.Default
    private String emailType = "BUSINESS"; // BUSINESS, PERSONAL, OTHER

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
