package com.albelt.gestionstock.domain.suppliers.mapper;

import com.albelt.gestionstock.domain.suppliers.dto.SupplierRequest;
import com.albelt.gestionstock.domain.suppliers.dto.SupplierResponse;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Supplier entity and DTOs
 */
@Component
public class SupplierMapper {

    /**
     * Convert SupplierRequest DTO to Supplier entity
     */
    public Supplier toEntity(SupplierRequest request) {
        if (request == null) {
            return null;
        }
        return Supplier.builder()
                .name(request.getName())
                .country(request.getCountry())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .leadTimeDays(request.getLeadTimeDays())
                .notes(request.getNotes())
                .build();
    }

    /**
     * Update existing Supplier entity with request data
     */
    public Supplier updateEntity(Supplier existing, SupplierRequest request) {
        if (request == null) {
            return existing;
        }
        if (request.getName() != null) {
            existing.setName(request.getName());
        }
        if (request.getCountry() != null) {
            existing.setCountry(request.getCountry());
        }
        if (request.getContactPerson() != null) {
            existing.setContactPerson(request.getContactPerson());
        }
        if (request.getEmail() != null) {
            existing.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            existing.setPhone(request.getPhone());
        }
        if (request.getLeadTimeDays() != null) {
            existing.setLeadTimeDays(request.getLeadTimeDays());
        }
        if (request.getNotes() != null) {
            existing.setNotes(request.getNotes());
        }
        return existing;
    }

    /**
     * Convert Supplier entity to SupplierResponse DTO
     */
    public SupplierResponse toResponse(Supplier entity) {
        if (entity == null) {
            return null;
        }
        return SupplierResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .country(entity.getCountry())
                .contactPerson(entity.getContactPerson())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .leadTimeDays(entity.getLeadTimeDays())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * Convert list of entities to list of responses
     */
    public List<SupplierResponse> toResponseList(List<Supplier> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
