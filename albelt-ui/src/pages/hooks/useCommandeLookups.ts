import { useEffect, useState, useCallback } from 'react';
import { ArticleService } from '../../services/articleService';
import { ClientService } from '../../services/clientService';
import { ColorService } from '../../services/colorService';
import type { Article, Client, Color } from '../../types';
import { getArticleDisplayLabel } from '../../utils/article';

export interface ClientOption {
  label: string;
  value: string;
}

export interface ColorOption {
  label: string;
  value: string;
  hexCode?: string;
}

export interface ArticleOption {
  label: string;
  value: string;
  article: Article;
  materialType: string;
  nbPlis: number;
  thicknessMm: number;
  reference?: string | null;
}

interface UseCommandeLookupsOptions {
  t: (key: string) => string;
  onClientsError?: (message: string, error?: unknown) => void;
}

export function useCommandeLookups({ t, onClientsError }: UseCommandeLookupsOptions) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsPage, setClientsPage] = useState(0);
  const [clientsHasMore, setClientsHasMore] = useState(true);
  const CLIENTS_PAGE_SIZE = 20;

  // Lazy load clients (pagination)
  const loadMoreClients = useCallback(async (reset = false) => {
    setClientsLoading(true);
    try {
      const pageToLoad = reset ? 0 : clientsPage;
      const res = await ClientService.getAll({ page: pageToLoad, size: CLIENTS_PAGE_SIZE });
      const paged = res?.data;
      const dataArray = Array.isArray(paged?.items) ? paged.items : [];
      const clientOptions: ClientOption[] = (dataArray as Client[]).map((client) => ({
        label: client.name,
        value: client.id,
      }));
      setClients((prev) => reset ? clientOptions : [...prev, ...clientOptions]);
      setClientsPage(pageToLoad + 1);
      setClientsHasMore((paged?.totalPages ?? 0) > (pageToLoad + 1));
      if ((reset ? clientOptions.length : clients.length + clientOptions.length) === 0) {
        onClientsError?.(t('commandes.noClientsAvailable'));
      }
    } catch (err) {
      onClientsError?.(t('commandes.errorLoadingClients'), err);
    } finally {
      setClientsLoading(false);
    }
  }, [clientsPage, t, onClientsError]);

  // Initial load
  useEffect(() => {
    loadMoreClients(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchColors = async () => {
      try {
        const res = await ColorService.getAll();
        const colorData = res?.data;
        const colorArray = Array.isArray(colorData) ? colorData : [];
        const options = (colorArray as Color[]).map((color) => ({
          label: color.name,
          value: color.id,
          hexCode: color.hexCode,
        }));
        if (!cancelled) {
          setColors(options);
        }
      } catch {
        if (!cancelled) {
          setColors([]);
        }
      }
    };

    fetchColors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchArticles = async () => {
      setArticlesLoading(true);
      try {
        const articleData = await ArticleService.getCachedList();
        const options = articleData.map((article) => ({
          label: getArticleDisplayLabel(article),
          value: article.id,
          article,
          materialType: article.materialType,
          nbPlis: article.nbPlis,
          thicknessMm: article.thicknessMm,
          reference: article.reference,
        }));
        if (!cancelled) {
          setArticles(options);
        }
      } catch {
        if (!cancelled) {
          setArticles([]);
        }
      } finally {
        if (!cancelled) {
          setArticlesLoading(false);
        }
      }
    };

    fetchArticles();
    return () => {
      cancelled = true;
    };
  }, []);

  return { clients, colors, articles, articlesLoading, clientsLoading, loadMoreClients, clientsHasMore };
}
