package com.albelt.gestionstock.domain.altier.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating and updating Altier
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AltierRequest {

    @NotBlank(message = "Libelle is required")
    private String libelle;

    @NotBlank(message = "Adresse is required")
    private String adresse;
}
