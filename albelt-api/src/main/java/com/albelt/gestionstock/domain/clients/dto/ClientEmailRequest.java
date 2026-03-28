package com.albelt.gestionstock.domain.clients.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * ClientEmailRequest DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientEmailRequest {
    
    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be valid")
    private String emailAddress;
    
    private Boolean isMain = false;
    
    private String emailType = "BUSINESS";
    
    private String notes;
}
