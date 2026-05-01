package com.albelt.gestionstock.domain.clients.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ClientRequest DTO - Input for creating or updating a client
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRequest {

    @NotBlank(message = "Client name is required")
    private String name;

    private String description;

    private Boolean isActive = true;

    @Valid
    private List<ClientPhoneRequest> phones;

    @Valid
    private List<ClientEmailRequest> emails;

    @Valid
    private List<ClientAddressRequest> addresses;

    @Valid
    private List<ClientRepresentativeRequest> representatives;
}
