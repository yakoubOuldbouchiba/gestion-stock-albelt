package com.albelt.gestionstock.domain.returns.mapper;

import com.albelt.gestionstock.domain.returns.dto.ReturnBonItemResponse;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonResponse;
import com.albelt.gestionstock.domain.returns.entity.ReturnBon;
import com.albelt.gestionstock.domain.returns.entity.ReturnBonItem;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ReturnBonMapper {

    private final UserMapper userMapper;

    public ReturnBonMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public ReturnBonResponse toSummaryDTO(ReturnBon entity) {
        if (entity == null) return null;

        Integer itemCount = entity.getItems() != null ? entity.getItems().size() : null;

        return ReturnBonResponse.builder()
                .id(entity.getId())
                .commandeId(entity.getCommande() != null ? entity.getCommande().getId() : null)
                .returnMode(entity.getReturnMode())
                .reason(entity.getReason())
                .reasonDetails(entity.getReasonDetails())
                .notes(entity.getNotes())
                .createdBy(entity.getCreatedBy() != null ? userMapper.toDTO(entity.getCreatedBy()) : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .itemCount(itemCount)
                .build();
    }

    public ReturnBonResponse toDetailsDTO(ReturnBon entity) {
        ReturnBonResponse dto = toSummaryDTO(entity);
        if (dto == null) return null;

        if (entity.getItems() != null) {
            List<ReturnBonItemResponse> items = entity.getItems().stream()
                    .map(this::toItemResponse)
                    .collect(Collectors.toList());
            dto.setItems(items);
            dto.setItemCount(items.size());
        }

        return dto;
    }

    public ReturnBonItemResponse toItemResponse(ReturnBonItem item) {
        if (item == null) return null;

        return ReturnBonItemResponse.builder()
                .id(item.getId())
                .returnBonId(item.getReturnBon() != null ? item.getReturnBon().getId() : null)
                .commandeItemId(item.getCommandeItem() != null ? item.getCommandeItem().getId() : null)
                .productionItemId(item.getProductionItem() != null ? item.getProductionItem().getId() : null)
                .quantity(item.getQuantity())
                .returnType(item.getReturnType())
                .measureAction(item.getMeasureAction())
                .adjustedWidthMm(item.getAdjustedWidthMm())
                .adjustedLengthM(item.getAdjustedLengthM())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
