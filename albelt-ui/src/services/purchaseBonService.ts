import ApiService from './api';
import type { ApiResponse, PurchaseBon, PurchaseBonRequest, PagedResponse, PurchaseBonStatus } from '../types/index';

/**
 * Purchase Bon API Service
 */
export const PurchaseBonService = {
  /**
   * Get all purchase bons
   */
  async list(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: PurchaseBonStatus;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<PurchaseBon>>> {
    return ApiService.get<PagedResponse<PurchaseBon>>('/purchase-bons', params);
  },

  /**
   * Get purchase bon details
   */
  async getById(id: string): Promise<ApiResponse<PurchaseBon>> {
    return ApiService.get<PurchaseBon>(`/purchase-bons/${id}`);
  },

  async downloadPdf(id: string, lang: string): Promise<Blob> {
    return ApiService.getBlob(`/purchase-bons/${id}/pdf`, { lang });
  },

  /**
   * Create purchase bon
   */
  async create(request: PurchaseBonRequest): Promise<ApiResponse<PurchaseBon>> {
    return ApiService.post<PurchaseBon>('/purchase-bons', request);
  },

  /**
   * Update purchase bon (draft only)
   */
  async update(id: string, request: PurchaseBonRequest): Promise<ApiResponse<PurchaseBon>> {
    return ApiService.put<PurchaseBon>(`/purchase-bons/${id}`, request);
  },

  /**
   * Validate purchase bon
   */
  async validate(id: string): Promise<ApiResponse<PurchaseBon>> {
    return ApiService.post<PurchaseBon>(`/purchase-bons/${id}/validate`, {});
  },

  /**
   * Delete purchase bon (draft only)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/purchase-bons/${id}`);
  }
};

export default PurchaseBonService;
