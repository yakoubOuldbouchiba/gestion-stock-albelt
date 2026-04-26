package com.albelt.gestionstock.domain.articles.service;

import com.albelt.gestionstock.domain.articles.dto.OdooArticleUpsertRequest;
import com.albelt.gestionstock.domain.articles.entity.Article;
import com.albelt.gestionstock.domain.articles.repository.ArticleRepository;
import com.albelt.gestionstock.shared.enums.MaterialType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final com.albelt.gestionstock.domain.articles.mapper.ArticleMapper articleMapper;
    private final com.albelt.gestionstock.domain.colors.repository.ColorRepository colorRepository;

    @Transactional
    public Article resolve(MaterialType materialType, BigDecimal thicknessMm, Integer nbPlis, String reference, java.util.UUID colorId) {
        return resolve(materialType != null ? materialType.name() : null, thicknessMm, nbPlis, reference, colorId);
    }

    @Transactional
    public Article resolve(String materialType, BigDecimal thicknessMm, Integer nbPlis, String reference, java.util.UUID colorId) {
        String normalizedMaterialType = normalizeMaterialType(materialType);
        if (normalizedMaterialType == null || thicknessMm == null || nbPlis == null) {
            return null;
        }

        String normalizedReference = normalizeReference(reference);
        return articleRepository.findBySignature(normalizedMaterialType, thicknessMm, nbPlis, normalizedReference, colorId)
            .orElseGet(() -> articleRepository.save(Article.builder()
                .materialType(normalizedMaterialType)
                .thicknessMm(thicknessMm)
                .nbPlis(nbPlis)
                .reference(normalizedReference)
                .color(colorId != null ? colorRepository.findById(colorId).orElse(null) : null)
                .build()));
    }

    @Transactional
    public Article upsertFromOdoo(OdooArticleUpsertRequest request) {
        if (request == null) {
            return null;
        }

        String externalId = normalizeNullable(request.getExternalId());
        if (externalId != null) {
            Article existing = articleRepository.findByExternalId(externalId).orElse(null);
            if (existing != null) {
                applyOdooValues(existing, request);
                return articleRepository.save(existing);
            }
        }

        Article article = resolve(
            request.getMaterialType(),
            request.getThicknessMm(),
            request.getNbPlis(),
            request.getReference(),
            null // Odoo articles might not have color in the signature yet
        );
        if (article == null) {
            return null;
        }

        applyOdooValues(article, request);
        return articleRepository.save(article);
    }

    @Transactional
    public List<Article> upsertBatchFromOdoo(List<OdooArticleUpsertRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }
        return requests.stream()
            .map(this::upsertFromOdoo)
            .filter(Objects::nonNull)
            .toList();
    }

    private void applyOdooValues(Article article, OdooArticleUpsertRequest request) {
        if (article == null || request == null) {
            return;
        }

        String materialType = normalizeMaterialType(request.getMaterialType());
        if (materialType != null) {
            article.setMaterialType(materialType);
        }
        if (request.getThicknessMm() != null) {
            article.setThicknessMm(request.getThicknessMm());
        }
        if (request.getNbPlis() != null) {
            article.setNbPlis(request.getNbPlis());
        }
        article.setReference(normalizeReference(request.getReference()));
        article.setExternalId(normalizeNullable(request.getExternalId()));
        article.setName(normalizeNullable(request.getName()));
        article.setCode(normalizeNullable(request.getCode()));
    }

    private String normalizeMaterialType(String value) {
        String normalized = normalizeNullable(value);
        return normalized != null ? normalized.toUpperCase(Locale.ROOT) : null;
    }

    private String normalizeReference(String value) {
        String normalized = normalizeNullable(value);
        return normalized != null ? normalized : "";
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Article> getAllPaged(String search, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return articleRepository.findFiltered(search, pageable);
    }

    @Transactional(readOnly = true)
    public List<Article> getAll() {
        return articleRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
    }

    @Transactional(readOnly = true)
    public Article getById(java.util.UUID id) {
        return articleRepository.findWithColorById(id)
                .orElseThrow(() -> new com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException("Article not found with id: " + id));
    }

    @Transactional
    public Article create(com.albelt.gestionstock.domain.articles.dto.ArticleRequest request) {
        Article article = articleMapper.toEntity(request);
        if (request.getColorId() != null) {
            article.setColor(colorRepository.findById(request.getColorId()).orElse(null));
        }
        return articleRepository.save(article);
    }

    @Transactional
    public Article update(java.util.UUID id, com.albelt.gestionstock.domain.articles.dto.ArticleRequest request) {
        Article existing = getById(id);
        Article updated = articleMapper.updateEntity(existing, request);
        if (request.getColorId() != null) {
            updated.setColor(colorRepository.findById(request.getColorId()).orElse(null));
        } else {
            updated.setColor(null);
        }
        return articleRepository.save(updated);
    }

    @Transactional
    public void delete(java.util.UUID id) {
        Article article = getById(id);
        articleRepository.delete(article);
    }
}
