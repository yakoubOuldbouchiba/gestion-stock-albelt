package com.albelt.gestionstock.domain.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnBonRequest {

    @NotNull(message = "Commande is required")
    private UUID commandeId;

    @NotBlank(message = "Return mode is required")
    private String returnMode; // TOTAL, PARTIAL

    @NotBlank(message = "Reason is required")
    private String reason;

    private String reasonDetails;

    private String notes;

    @Valid
    @NotNull(message = "Items are required")
    private List<ReturnBonItemRequest> items;
}
