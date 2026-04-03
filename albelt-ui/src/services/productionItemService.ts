import ApiService from './api';
import type { ApiResponse, ProductionItem, ProductionItemRequest } from '../types/index';

/**
 * Production Item API Service
 */
export const ProductionItemService = {
  async getByCommandeItemId(commandeItemId: string): Promise<ApiResponse<ProductionItem[]>> {
    return ApiService.get<ProductionItem[]>(`/production-items/by-commande-item/${commandeItemId}`);
  },

  async getByRollId(rollId: string): Promise<ApiResponse<ProductionItem[]>> {
    return ApiService.get<ProductionItem[]>(`/production-items/by-roll/${rollId}`);
  },

  async getByWastePieceId(wastePieceId: string): Promise<ApiResponse<ProductionItem[]>> {
    return ApiService.get<ProductionItem[]>(`/production-items/by-waste-piece/${wastePieceId}`);
  },

  async getById(id: string): Promise<ApiResponse<ProductionItem>> {
    return ApiService.get<ProductionItem>(`/production-items/${id}`);
  },

  async create(request: ProductionItemRequest): Promise<ApiResponse<ProductionItem>> {
    return ApiService.post<ProductionItem>('/production-items', request);
  },

  async update(id: string, request: ProductionItemRequest): Promise<ApiResponse<ProductionItem>> {
    return ApiService.put<ProductionItem>(`/production-items/${id}`, request);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/production-items/${id}`);
  },
};

export default ProductionItemService;
