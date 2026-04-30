package com.albelt.gestionstock.domain.purchasebons.dto;

import com.albelt.gestionstock.domain.users.dto.UserDTO;
import com.albelt.gestionstock.shared.enums.PurchaseBonStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBonResponse {
    private UUID id;
    private String reference;
    private LocalDate bonDate;

    private UUID supplierId;
    private String supplierName;

    private PurchaseBonStatus status;
    private String notes;

    private UserDTO createdBy;
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer itemCount;
    private List<PurchaseBonItemResponse> items;
}
