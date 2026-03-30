package com.albelt.gestionstock.domain.purchasebons.entity;

import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.shared.enums.PurchaseBonStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * PurchaseBon (Bon d'achat) - Receipt document for incoming rolls.
 */
@Entity
@Table(name = "purchase_bons", indexes = {
        @Index(name = "idx_purchase_bons_supplier_id", columnList = "supplier_id"),
        @Index(name = "idx_purchase_bons_bon_date", columnList = "bon_date"),
        @Index(name = "idx_purchase_bons_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference", nullable = false, unique = true)
    private String reference;

    @Column(name = "bon_date", nullable = false)
    private LocalDate bonDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PurchaseBonStatus status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @OneToMany(mappedBy = "purchaseBon", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<PurchaseBonItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
