import ApiService from './api';
import type { ApiResponse, Article, ArticleRequest, PagedResponse } from '../types';

let articleListCache: Article[] | null = null;
let articleListPromise: Promise<Article[]> | null = null;

export const ArticleService = {
  async getAll(forceRefresh = false): Promise<ApiResponse<Article[]>> {
    if (!forceRefresh && articleListCache) {
      return {
        success: true,
        message: 'cached',
        data: articleListCache,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await ApiService.get<Article[]>('/articles');
    if (response.success && Array.isArray(response.data)) {
      articleListCache = response.data;
    }
    return response;
  },

  async getCachedList(forceRefresh = false): Promise<Article[]> {
    if (!forceRefresh && articleListCache) {
      return articleListCache;
    }

    if (!forceRefresh && articleListPromise) {
      return articleListPromise;
    }

    articleListPromise = this.getAll(forceRefresh)
      .then((response) => response.data ?? [])
      .finally(() => {
        articleListPromise = null;
      });

    return articleListPromise;
  },

  async getPaged(params?: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<ApiResponse<PagedResponse<Article>>> {
    return ApiService.get<PagedResponse<Article>>('/articles/paged', params);
  },

  async getById(id: string): Promise<ApiResponse<Article>> {
    return ApiService.get<Article>(`/articles/${id}`);
  },

  async create(request: ArticleRequest): Promise<ApiResponse<Article>> {
    const response = await ApiService.post<Article>('/articles', request);
    articleListCache = null;
    return response;
  },

  async update(id: string, request: Partial<ArticleRequest>): Promise<ApiResponse<Article>> {
    const response = await ApiService.put<Article>(`/articles/${id}`, request);
    articleListCache = null;
    return response;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await ApiService.delete<void>(`/articles/${id}`);
    articleListCache = null;
    return response;
  },
};

export default ArticleService;
