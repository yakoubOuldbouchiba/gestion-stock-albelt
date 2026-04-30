package com.albelt.gestionstock.domain.clients.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * ClientResponse DTO - Output representation of a client
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientResponse {
    
    private UUID id;
    
    private String name;
    
    private String description;
    
    private Boolean isActive;
    
    private List<ClientPhoneResponse> phones;
    
    private List<ClientEmailResponse> emails;
    
    private List<ClientAddressResponse> addresses;
    
    private List<ClientRepresentativeResponse> representatives;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
