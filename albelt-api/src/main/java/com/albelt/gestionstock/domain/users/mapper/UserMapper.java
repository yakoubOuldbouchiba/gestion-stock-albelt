package com.albelt.gestionstock.domain.users.mapper;

import com.albelt.gestionstock.domain.users.dto.UserDTO;
import com.albelt.gestionstock.domain.users.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper for User entity <-> UserDTO conversions
 */
@Component
public class UserMapper {

    public UserDTO toDTO(User entity) {
        if (entity == null) {
            return null;
        }

        return UserDTO.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .fullName(entity.getFullName())
                .role(entity.getRole())
                .isActive(entity.getIsActive())
                .lastLogin(entity.getLastLogin())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }

        return User.builder()
                .id(dto.getId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .fullName(dto.getFullName())
                .role(dto.getRole())
                .isActive(dto.getIsActive())
                .lastLogin(dto.getLastLogin())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
