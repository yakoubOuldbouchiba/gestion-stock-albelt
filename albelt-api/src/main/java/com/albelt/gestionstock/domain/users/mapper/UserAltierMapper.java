package com.albelt.gestionstock.domain.users.mapper;

import com.albelt.gestionstock.domain.altier.dto.AltierDTO;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.users.dto.UserAltierDTO;
import com.albelt.gestionstock.domain.users.dto.UserDTO;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.entity.UserAltier;
import org.springframework.stereotype.Component;

/**
 * Mapper for UserAltier entity to DTO conversion
 * Handles conversion of entities to DTOs to avoid Hibernate lazy loading issues
 */
@Component
public class UserAltierMapper {

    /**
     * Convert UserAltier entity to DTO
     */
    public UserAltierDTO toDTO(UserAltier entity) {
        if (entity == null) {
            return null;
        }

        return UserAltierDTO.builder()
                .id(entity.getId())
                .user(userToDTO(entity.getUser()))
                .altier(altierToDTO(entity.getAltier()))
                .assignedBy(userToDTO(entity.getAssignedBy()))
                .assignedAt(entity.getAssignedAt())
                .build();
    }

    /**
     * Convert User entity to DTO
     */
    private UserDTO userToDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Convert Altier entity to DTO
     */
    private AltierDTO altierToDTO(Altier altier) {
        if (altier == null) {
            return null;
        }

        return AltierDTO.builder()
                .id(altier.getId())
                .libelle(altier.getLibelle())
                .adresse(altier.getAdresse())
                .createdAt(altier.getCreatedAt())
                .updatedAt(altier.getUpdatedAt())
                .build();
    }
}
