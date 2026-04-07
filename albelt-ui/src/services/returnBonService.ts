import ApiService from './api';
import type { ApiResponse, ReturnBon, ReturnBonRequest } from '../types/index';

/**
 * Return Bon API Service
 */
export const ReturnBonService = {
  async create(request: ReturnBonRequest): Promise<ApiResponse<ReturnBon>> {
    return ApiService.post<ReturnBon>('/return-bons', request);
  },

  async getByCommandeId(commandeId: string): Promise<ApiResponse<ReturnBon[]>> {
    return ApiService.get<ReturnBon[]>(`/return-bons/by-commande/${commandeId}`);
  },

  async getById(id: string): Promise<ApiResponse<ReturnBon>> {
    return ApiService.get<ReturnBon>(`/return-bons/${id}`);
  },
};

export default ReturnBonService;
