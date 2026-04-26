package com.albelt.gestionstock.domain.articles.mapper;

import com.albelt.gestionstock.domain.articles.dto.ArticleRequest;
import com.albelt.gestionstock.domain.articles.dto.ArticleResponse;
import com.albelt.gestionstock.domain.articles.entity.Article;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ArticleMapper {

    public Article toEntity(ArticleRequest request) {
        if (request == null) {
            return null;
        }
        return Article.builder()
                .materialType(request.getMaterialType() != null ? request.getMaterialType().name() : null)
                .thicknessMm(request.getThicknessMm())
                .nbPlis(request.getNbPlis())
                .reference(request.getReference() != null ? request.getReference() : "")
                .name(request.getName())
                .code(request.getCode())
                .externalId(request.getExternalId())
                .build();
    }

    public Article updateEntity(Article existing, ArticleRequest request) {
        if (request == null) {
            return existing;
        }
        if (request.getMaterialType() != null) {
            existing.setMaterialType(request.getMaterialType().name());
        }
        if (request.getThicknessMm() != null) {
            existing.setThicknessMm(request.getThicknessMm());
        }
        if (request.getNbPlis() != null) {
            existing.setNbPlis(request.getNbPlis());
        }
        if (request.getReference() != null) {
            existing.setReference(request.getReference());
        }
        if (request.getName() != null) {
            existing.setName(request.getName());
        }
        if (request.getCode() != null) {
            existing.setCode(request.getCode());
        }
        if (request.getExternalId() != null) {
            existing.setExternalId(request.getExternalId());
        }
        return existing;
    }

    public ArticleResponse toResponse(Article entity) {
        if (entity == null) {
            return null;
        }
        var builder = ArticleResponse.builder()
                .id(entity.getId())
                .materialType(entity.getMaterialType())
                .thicknessMm(entity.getThicknessMm())
                .nbPlis(entity.getNbPlis())
                .reference(entity.getReference())
                .name(entity.getName())
                .code(entity.getCode())
                .externalId(entity.getExternalId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        if (entity.getColor() != null) {
            // Accessing ID on a proxy typically doesn't trigger initialization
            builder.colorId(entity.getColor().getId());
            
            // Only access other fields if initialized to avoid LazyInitializationException
            if (org.hibernate.Hibernate.isInitialized(entity.getColor())) {
                builder.colorName(entity.getColor().getName());
                builder.colorHexCode(entity.getColor().getHexCode());
            }
        }

        return builder.build();
    }

    public List<ArticleResponse> toResponseList(List<Article> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
