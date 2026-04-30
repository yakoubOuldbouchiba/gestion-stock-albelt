package com.albelt.gestionstock.domain.purchasebons.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseBonRequest {

    @NotNull(message = "Reference is required")
    private String reference;

    @NotNull(message = "Bon date is required")
    private LocalDate bonDate;

    @NotNull(message = "Supplier ID is required")
    private UUID supplierId;

    private String notes;

    @Valid
    @NotEmpty(message = "At least one line item is required")
    private List<PurchaseBonItemRequest> items;
}
