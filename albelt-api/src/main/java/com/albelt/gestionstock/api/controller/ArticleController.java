package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.articles.dto.ArticleRequest;
import com.albelt.gestionstock.domain.articles.dto.ArticleResponse;
import com.albelt.gestionstock.domain.articles.mapper.ArticleMapper;
import com.albelt.gestionstock.domain.articles.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
@Slf4j
public class ArticleController {

    private final ArticleService articleService;
    private final ArticleMapper articleMapper;

    @PostMapping
    public ResponseEntity<ApiResponse<ArticleResponse>> create(@Valid @RequestBody ArticleRequest request) {
        log.info("Creating article");
        var article = articleService.create(request);
        var response = articleMapper.toResponse(article);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Article created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArticleResponse>>> getAll() {
        log.debug("Fetching all articles");
        var articles = articleService.getAll();
        var responses = articleMapper.toResponseList(articles);
        return ResponseEntity.ok(ApiResponse.success(responses, "Articles retrieved successfully"));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<PagedResponse<ArticleResponse>>> getPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        log.debug("Fetching articles paged");
        var articlesPage = articleService.getAllPaged(search, page, size);
        var responses = articleMapper.toResponseList(articlesPage.getContent());
        var paged = PagedResponse.<ArticleResponse>builder()
                .items(responses)
                .page(articlesPage.getNumber())
                .size(articlesPage.getSize())
                .totalElements(articlesPage.getTotalElements())
                .totalPages(articlesPage.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged, "Articles retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching article: {}", id);
        var article = articleService.getById(id);
        var response = articleMapper.toResponse(article);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArticleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ArticleRequest request) {
        log.info("Updating article: {}", id);
        var article = articleService.update(id, request);
        var response = articleMapper.toResponse(article);
        return ResponseEntity.ok(ApiResponse.success(response, "Article updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("Deleting article: {}", id);
        articleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Article deleted successfully"));
    }
}
