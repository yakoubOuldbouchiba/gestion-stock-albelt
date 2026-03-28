package com.albelt.gestionstock.domain.clients.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ClientAddressResponse DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientAddressResponse {
    
    private UUID id;
    
    private String streetAddress;
    
    private String city;
    
    private String postalCode;
    
    private String country;
    
    private Boolean isMain;
    
    private String addressType;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
