package com.albelt.gestionstock.domain.clients.mapper;

import com.albelt.gestionstock.domain.clients.dto.*;
import com.albelt.gestionstock.domain.clients.entity.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Client Mapper - Converts between entities and DTOs
 */
@Component
public class ClientMapper {

    // ==================== CLIENT MAPPING ====================

    public Client toEntity(ClientRequest request) {
        if (request == null) {
            return null;
        }
        return Client.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .phones(request.getPhones() != null ?
                        request.getPhones().stream()
                                .map(this::toPhoneEntity)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .emails(request.getEmails() != null ?
                        request.getEmails().stream()
                                .map(this::toEmailEntity)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .addresses(request.getAddresses() != null ?
                        request.getAddresses().stream()
                                .map(this::toAddressEntity)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .representatives(request.getRepresentatives() != null ?
                        request.getRepresentatives().stream()
                                .map(this::toRepresentativeEntity)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    public ClientResponse toResponse(Client entity) {
        if (entity == null) {
            return null;
        }
        return ClientResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .phones(entity.getPhones() != null ?
                        entity.getPhones().stream()
                                .map(this::toPhoneResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .emails(entity.getEmails() != null ?
                        entity.getEmails().stream()
                                .map(this::toEmailResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .addresses(entity.getAddresses() != null ?
                        entity.getAddresses().stream()
                                .map(this::toAddressResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .representatives(entity.getRepresentatives() != null ?
                        entity.getRepresentatives().stream()
                                .map(this::toRepresentativeResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<ClientResponse> toResponseList(List<Client> entities) {
        if (entities == null) {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Client updateEntity(Client existing, ClientRequest request) {
        if (request == null) {
            return existing;
        }
        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setIsActive(request.getIsActive() != null ? request.getIsActive() : existing.getIsActive());

        // Update phones
        if (request.getPhones() != null) {
            existing.setPhones(request.getPhones().stream()
                    .map(this::toPhoneEntity)
                    .collect(Collectors.toList()));
        }

        // Update emails
        if (request.getEmails() != null) {
            existing.setEmails(request.getEmails().stream()
                    .map(this::toEmailEntity)
                    .collect(Collectors.toList()));
        }

        // Update addresses
        if (request.getAddresses() != null) {
            existing.setAddresses(request.getAddresses().stream()
                    .map(this::toAddressEntity)
                    .collect(Collectors.toList()));
        }

        // Update representatives
        if (request.getRepresentatives() != null) {
            existing.setRepresentatives(request.getRepresentatives().stream()
                    .map(this::toRepresentativeEntity)
                    .collect(Collectors.toList()));
        }

        return existing;
    }

    // ==================== PHONE MAPPING ====================

    public ClientPhone toPhoneEntity(ClientPhoneRequest request) {
        if (request == null) {
            return null;
        }
        return ClientPhone.builder()
                .phoneNumber(request.getPhoneNumber())
                .isMain(request.getIsMain() != null ? request.getIsMain() : false)
                .phoneType(request.getPhoneType() != null ? request.getPhoneType() : "MOBILE")
                .notes(request.getNotes())
                .build();
    }

    public ClientPhoneResponse toPhoneResponse(ClientPhone entity) {
        if (entity == null) {
            return null;
        }
        return ClientPhoneResponse.builder()
                .id(entity.getId())
                .phoneNumber(entity.getPhoneNumber())
                .isMain(entity.getIsMain())
                .phoneType(entity.getPhoneType())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // ==================== EMAIL MAPPING ====================

    public ClientEmail toEmailEntity(ClientEmailRequest request) {
        if (request == null) {
            return null;
        }
        return ClientEmail.builder()
                .emailAddress(request.getEmailAddress())
                .isMain(request.getIsMain() != null ? request.getIsMain() : false)
                .emailType(request.getEmailType() != null ? request.getEmailType() : "BUSINESS")
                .notes(request.getNotes())
                .build();
    }

    public ClientEmailResponse toEmailResponse(ClientEmail entity) {
        if (entity == null) {
            return null;
        }
        return ClientEmailResponse.builder()
                .id(entity.getId())
                .emailAddress(entity.getEmailAddress())
                .isMain(entity.getIsMain())
                .emailType(entity.getEmailType())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // ==================== ADDRESS MAPPING ====================

    public ClientAddress toAddressEntity(ClientAddressRequest request) {
        if (request == null) {
            return null;
        }
        return ClientAddress.builder()
                .streetAddress(request.getStreetAddress())
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .country(request.getCountry() != null ? request.getCountry() : "DZ")
                .isMain(request.getIsMain() != null ? request.getIsMain() : false)
                .addressType(request.getAddressType() != null ? request.getAddressType() : "BUSINESS")
                .notes(request.getNotes())
                .build();
    }

    public ClientAddressResponse toAddressResponse(ClientAddress entity) {
        if (entity == null) {
            return null;
        }
        return ClientAddressResponse.builder()
                .id(entity.getId())
                .streetAddress(entity.getStreetAddress())
                .city(entity.getCity())
                .postalCode(entity.getPostalCode())
                .country(entity.getCountry())
                .isMain(entity.getIsMain())
                .addressType(entity.getAddressType())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // ==================== REPRESENTATIVE MAPPING ====================

    public ClientRepresentative toRepresentativeEntity(ClientRepresentativeRequest request) {
        if (request == null) {
            return null;
        }
        return ClientRepresentative.builder()
                .name(request.getName())
                .position(request.getPosition())
                .phone(request.getPhone())
                .email(request.getEmail())
                .isPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false)
                .notes(request.getNotes())
                .build();
    }

    public ClientRepresentativeResponse toRepresentativeResponse(ClientRepresentative entity) {
        if (entity == null) {
            return null;
        }
        return ClientRepresentativeResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .position(entity.getPosition())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .isPrimary(entity.getIsPrimary())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
