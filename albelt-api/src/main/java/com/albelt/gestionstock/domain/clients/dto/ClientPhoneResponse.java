package com.albelt.gestionstock.domain.clients.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ClientPhoneResponse DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientPhoneResponse {

    private UUID id;

    private String phoneNumber;

    private Boolean isMain;

    private String phoneType;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
