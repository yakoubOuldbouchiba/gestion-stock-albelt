package com.albelt.gestionstock.domain.rolls.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * TransferBon (Bon de Transfert) - Groups multiple roll movements under one document.
 * Same principle of status as RollMovement: statusSortie / statusEntree.
 */
@Entity
@Table(name = "transfer_bons", indexes = {
        @Index(name = "idx_transfer_bons_from_altier_id", columnList = "from_altier_id"),
        @Index(name = "idx_transfer_bons_to_altier_id", columnList = "to_altier_id"),
        @Index(name = "idx_transfer_bons_date_sortie", columnList = "date_sortie"),
        @Index(name = "idx_transfer_bons_operator_id", columnList = "operator_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferBon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_altier_id", nullable = false)
    private Altier fromAltier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_altier_id", nullable = false)
    private Altier toAltier;

    @Column(name = "status_sortie")
    private Boolean statusSortie;

    @Column(name = "status_entree")
    private Boolean statusEntree;

    @Column(name = "date_sortie", nullable = false)
    private LocalDateTime dateSortie;

    @Column(name = "date_entree")
    private LocalDateTime dateEntree;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id", nullable = false)
    private User operator;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "transferBon", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RollMovement> movements;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
