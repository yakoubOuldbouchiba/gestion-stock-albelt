package com.albelt.gestionstock.shared.persistence;

import com.albelt.gestionstock.domain.articles.entity.Article;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class ReferencedArticleSnapshotEntity extends ArticleSnapshotEntity {

    @Column(name = "reference", length = 100)
    private String reference;

    public String getReference() {
        String articleReference = getArticle() != null ? getArticle().getReference() : null;
        return articleReference != null ? articleReference : reference;
    }

    @Override
    protected void onArticleSynchronized(Article article) {
        this.reference = article.getReference();
    }
}
