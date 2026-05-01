package com.albelt.gestionstock.domain.articles.repository;

import com.albelt.gestionstock.domain.articles.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArticleRepository extends JpaRepository<Article, UUID> {

    @EntityGraph(attributePaths = {"color"})
    @Query("""
            select a
            from Article a
            where a.materialType = :materialType
              and a.thicknessMm = :thicknessMm
              and a.nbPlis = :nbPlis
              and coalesce(a.reference, '') = :reference
              and ((:colorId is null and a.color is null) or (a.color.id = :colorId))
            """)
    Optional<Article> findBySignature(@Param("materialType") String materialType,
                                      @Param("thicknessMm") BigDecimal thicknessMm,
                                      @Param("nbPlis") Integer nbPlis,
                                      @Param("reference") String reference,
                                      @Param("colorId") UUID colorId);

    @EntityGraph(attributePaths = {"color"})
    Optional<Article> findByExternalId(String externalId);

    @Query("select a from Article a left join fetch a.color where a.id = :id")
    Optional<Article> findWithColorById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"color"})
    @Query("select a from Article a")
    List<Article> findAllWithColor(Sort sort);

    @EntityGraph(attributePaths = {"color"})
    @Query(value = """
            select a
            from Article a
            where (:search is null or :search = '' or lower(a.reference) like concat('%', lower(:search), '%') or lower(a.name) like concat('%', lower(:search), '%') or lower(a.code) like concat('%', lower(:search), '%'))
            """, countQuery = """
            select count(a)
            from Article a
            where (:search is null or :search = '' or lower(a.reference) like concat('%', lower(:search), '%') or lower(a.name) like concat('%', lower(:search), '%') or lower(a.code) like concat('%', lower(:search), '%'))
            """)
    Page<Article> findFiltered(@Param("search") String search, Pageable pageable);
}
