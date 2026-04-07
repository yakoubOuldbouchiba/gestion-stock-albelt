package com.albelt.gestionstock.domain.rolls.entity;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.users.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * RollMovement entity - Tracks roll movements between altiers with timestamps
 * Complete audit trail for roll location history
 */
@Entity
@Table(name = "roll_movements", indexes = {
        @Index(name = "idx_roll_movements_roll_id", columnList = "roll_id"),
        @Index(name = "idx_roll_movements_from_altier", columnList = "from_altier_id"),
        @Index(name = "idx_roll_movements_to_altier", columnList = "to_altier_id"),
        @Index(name = "idx_roll_movements_date_entree", columnList = "date_entree DESC"),
        @Index(name = "idx_roll_movements_operator_id", columnList = "operator_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Roll Reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roll_id")
    private Roll roll;

    // Chute reference (optional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waste_piece_id")
    private WastePiece wastePiece;

    // Location References
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_altier_id", nullable = false)
    private Altier fromAltier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_altier_id", nullable = false)
    private Altier toAltier;

    // Movement Status
    @Column(name = "status_sortie")
    private Boolean statusSortie;  // true when item exits from_altier

    @Column(name = "status_entree")
    private Boolean statusEntree;  // true when item enters to_altier

    // Movement Timestamps
    @Column(name = "date_sortie", nullable = false)
    private LocalDateTime dateSortie;

    @Column(name = "date_entree", nullable = true)
    private LocalDateTime dateEntree;

    // Movement Details
    @Column(name = "reason")
    private String reason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operator_id", nullable = false)
    private User operator;

    // Documentation
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Optional grouping document (Bon de Transfert)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_bon_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TransferBon transferBon;

    // Audit
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Get duration of movement in hours
     */
    public long getDurationHours() {
        if (dateSortie != null && dateEntree != null) {
            return java.time.temporal.ChronoUnit.HOURS.between(dateSortie, dateEntree);
        }
        return 0;
    }

    /**
     * Check if movement is complete (has both dates)
     */
    public boolean isComplete() {
        return dateSortie != null && dateEntree != null;
    }
}
