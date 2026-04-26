import type { Article, MaterialType } from '../types';

type MaybeArticleBacked = {
  article?: Article | null;
  articleId?: string | null;
  article_id?: string | null;
  materialType?: MaterialType | string | null;
  thicknessMm?: number | null;
  thickness?: number | null;
  nbPlis?: number | null;
  reference?: string | null;
};

export function getArticleId(item?: MaybeArticleBacked | null): string | null {
  if (!item) {
    return null;
  }
  return item.articleId ?? item.article_id ?? item.article?.id ?? null;
}

export function getArticleMaterialType(item?: MaybeArticleBacked | null): string | undefined {
  if (!item) {
    return undefined;
  }
  return item.article?.materialType ?? item.materialType ?? undefined;
}

export function getArticleThicknessMm(item?: MaybeArticleBacked | null): number | undefined {
  if (!item) {
    return undefined;
  }
  return item.article?.thicknessMm ?? item.thicknessMm ?? item.thickness ?? undefined;
}

export function getArticleNbPlis(item?: MaybeArticleBacked | null): number | undefined {
  if (!item) {
    return undefined;
  }
  return item.article?.nbPlis ?? item.nbPlis ?? undefined;
}

export function getArticleReference(item?: MaybeArticleBacked | null): string | undefined {
  if (!item) {
    return undefined;
  }
  return item.article?.reference ?? item.reference ?? undefined;
}

export function getArticleDisplayLabel(item?: MaybeArticleBacked | null): string {
  const reference = getArticleReference(item);
  if (reference) {
    return reference;
  }

  const materialType = getArticleMaterialType(item);
  const thicknessMm = getArticleThicknessMm(item);
  const nbPlis = getArticleNbPlis(item);

  return [materialType, thicknessMm != null ? `${thicknessMm}mm` : null, nbPlis != null ? `${nbPlis} plis` : null]
    .filter(Boolean)
    .join(' - ');
}

export function applyArticleToPayload<T extends MaybeArticleBacked>(
  payload: T,
  article?: Article | null
): T & {
  articleId?: string;
  article?: Article | null;
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  reference: string;
} {
  return {
    ...payload,
    articleId: article?.id,
    article: article ?? null,
    materialType: article?.materialType ?? (payload.materialType as MaterialType),
    nbPlis: article?.nbPlis ?? Number(payload.nbPlis ?? 0),
    thicknessMm: article?.thicknessMm ?? Number(payload.thicknessMm ?? payload.thickness ?? 0),
    reference: article?.reference ?? String(payload.reference ?? ''),
  };
}

export function normalizeArticleBackedItem<T extends MaybeArticleBacked>(item: T): T & {
  articleId?: string | null;
  article?: Article | null;
  materialType?: string | null;
  nbPlis?: number | null;
  thicknessMm?: number | null;
  reference?: string | null;
} {
  return {
    ...item,
    articleId: getArticleId(item),
    article: item.article ?? null,
    materialType: getArticleMaterialType(item) ?? null,
    nbPlis: getArticleNbPlis(item) ?? null,
    thicknessMm: getArticleThicknessMm(item) ?? null,
    reference: getArticleReference(item) ?? null,
  };
}
