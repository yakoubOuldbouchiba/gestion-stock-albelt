package com.albelt.gestionstock.domain.purchasebons.mapper;

import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonItemResponse;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonResponse;
import com.albelt.gestionstock.domain.purchasebons.entity.PurchaseBon;
import com.albelt.gestionstock.domain.purchasebons.entity.PurchaseBonItem;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PurchaseBonMapper {

    private final UserMapper userMapper;

    public PurchaseBonMapper(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public PurchaseBonResponse toSummaryResponse(PurchaseBon entity) {
        if (entity == null) return null;

        Integer itemCount = entity.getItems() != null ? entity.getItems().size() : null;

        return PurchaseBonResponse.builder()
                .id(entity.getId())
                .reference(entity.getReference())
                .bonDate(entity.getBonDate())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null)
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .createdBy(entity.getCreatedBy() != null ? userMapper.toDTO(entity.getCreatedBy()) : null)
                .validatedAt(entity.getValidatedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .itemCount(itemCount)
                .build();
    }

    public PurchaseBonResponse toDetailsResponse(PurchaseBon entity) {
        PurchaseBonResponse response = toSummaryResponse(entity);
        if (response == null) return null;

        if (entity.getItems() != null) {
            response.setItems(entity.getItems().stream()
                    .map(this::toItemResponse)
                    .collect(Collectors.toList()));
            response.setItemCount(entity.getItems().size());
        }

        return response;
    }

    public PurchaseBonItemResponse toItemResponse(PurchaseBonItem item) {
        if (item == null) return null;

        return PurchaseBonItemResponse.builder()
                .id(item.getId())
                .lineNumber(item.getLineNumber())
                .materialType(item.getMaterialType())
                .nbPlis(item.getNbPlis())
                .thicknessMm(item.getThicknessMm())
                .widthMm(item.getWidthMm())
                .lengthM(item.getLengthM())
                .areaM2(item.getAreaM2())
                .quantity(item.getQuantity())
                .colorId(item.getColor() != null ? item.getColor().getId() : null)
                .colorName(item.getColor() != null ? item.getColor().getName() : null)
                .colorHexCode(item.getColor() != null ? item.getColor().getHexCode() : null)
                .altierId(item.getAltier() != null ? item.getAltier().getId() : null)
                .altierLibelle(item.getAltier() != null ? item.getAltier().getLibelle() : null)
                .qrCode(item.getQrCode())
                .build();
    }
}
