package com.albelt.gestionstock.domain.clients.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ClientPhoneRequest DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientPhoneRequest {

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private Boolean isMain = false;

    private String phoneType = "MOBILE";

    private String notes;
}
