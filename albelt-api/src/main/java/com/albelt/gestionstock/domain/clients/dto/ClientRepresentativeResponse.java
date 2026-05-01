package com.albelt.gestionstock.domain.clients.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ClientRepresentativeResponse DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientRepresentativeResponse {

    private UUID id;

    private String name;

    private String position;

    private String phone;

    private String email;

    private Boolean isPrimary;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
