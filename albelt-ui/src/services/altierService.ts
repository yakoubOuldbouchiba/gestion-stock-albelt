import ApiService from './api';
import type { Altier, AltierRequest, ApiResponse } from '../types/index';

/**
 * Altier API Service
 */
export const AltierService = {
  /**
   * Get all altiers
   */
  async getAll(): Promise<ApiResponse<Altier[]>> {
    return ApiService.get<Altier[]>('/altiers');
  },

  /**
   * Get altier by ID
   */
  async getById(id: string): Promise<ApiResponse<Altier>> {
    return ApiService.get<Altier>(`/altiers/${id}`);
  },

  /**
   * Create new altier
   */
  async create(request: AltierRequest): Promise<ApiResponse<Altier>> {
    return ApiService.post<Altier>('/altiers', request);
  },

  /**
   * Update altier
   */
  async update(id: string, request: AltierRequest): Promise<ApiResponse<Altier>> {
    return ApiService.put<Altier>(`/altiers/${id}`, request);
  },

  /**
   * Delete altier
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/altiers/${id}`);
  },

  /**
   * Search by libelle
   */
  async searchByLibelle(libelle: string): Promise<ApiResponse<Altier>> {
    return ApiService.get<Altier>('/altiers/search/libelle', { libelle });
  },
};
