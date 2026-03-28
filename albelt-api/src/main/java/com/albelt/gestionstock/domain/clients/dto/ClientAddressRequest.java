package com.albelt.gestionstock.domain.clients.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * ClientAddressRequest DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientAddressRequest {
    
    @NotBlank(message = "Street address is required")
    private String streetAddress;
    
    private String city;
    
    private String postalCode;
    
    private String country = "DZ";
    
    private Boolean isMain = false;
    
    private String addressType = "BUSINESS";
    
    private String notes;
}
