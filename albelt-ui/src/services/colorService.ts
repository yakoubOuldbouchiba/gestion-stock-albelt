import ApiService from './api';
import type { Color, ApiResponse } from '../types/index';

/**
 * Color API Service - UI color configuration
 */
export const ColorService = {
  async getAll(): Promise<ApiResponse<Color[]>> {
    return ApiService.get<Color[]>('/colors');
  },

  async getById(id: string): Promise<ApiResponse<Color>> {
    return ApiService.get<Color>(`/colors/${id}`);
  },

  async getByName(name: string): Promise<ApiResponse<Color>> {
    return ApiService.get<Color>('/colors/search/name', { name });
  },

  async create(request: Omit<Color, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Color>> {
    return ApiService.post<Color>('/colors', request);
  },

  async update(id: string, request: Partial<Omit<Color, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Color>> {
    return ApiService.put<Color>(`/colors/${id}`, request);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete(`/colors/${id}`);
  },
};
