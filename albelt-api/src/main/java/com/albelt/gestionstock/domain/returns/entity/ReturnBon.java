package com.albelt.gestionstock.domain.returns.entity;

import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * ReturnBon (Bon de Retour) - Groups return items for a commande.
 */
@Entity
@Table(name = "return_bons", indexes = {
        @Index(name = "idx_return_bons_commande_id", columnList = "commande_id"),
        @Index(name = "idx_return_bons_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnBon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    @Column(name = "return_mode", nullable = false, length = 20)
    private String returnMode; // TOTAL, PARTIAL

    @Column(name = "reason", nullable = false, length = 100)
    private String reason;

    @Column(name = "reason_details", columnDefinition = "TEXT")
    private String reasonDetails;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "returnBon", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReturnBonItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
