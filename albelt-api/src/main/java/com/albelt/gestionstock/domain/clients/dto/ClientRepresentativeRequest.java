package com.albelt.gestionstock.domain.clients.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * ClientRepresentativeRequest DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRepresentativeRequest {
    
    @NotBlank(message = "Representative name is required")
    private String name;
    
    private String position;
    
    private String phone;
    
    @Email(message = "Email address must be valid")
    private String email;
    
    private Boolean isPrimary = false;
    
    private String notes;
}
