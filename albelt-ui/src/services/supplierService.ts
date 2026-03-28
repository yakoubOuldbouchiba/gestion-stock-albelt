import ApiService from './api';
import type { Supplier, SupplierRequest, ApiResponse } from '../types/index';

/**
 * Supplier API Service
 */
export const SupplierService = {
  /**
   * Get all suppliers
   */
  async getAll(): Promise<ApiResponse<Supplier[]>> {
    return ApiService.get<Supplier[]>('/suppliers');
  },

  /**
   * Get supplier by ID
   */
  async getById(id: string): Promise<ApiResponse<Supplier>> {
    return ApiService.get<Supplier>(`/suppliers/${id}`);
  },

  /**
   * Create new supplier
   */
  async create(request: SupplierRequest): Promise<ApiResponse<Supplier>> {
    return ApiService.post<Supplier>('/suppliers', request);
  },

  /**
   * Update supplier
   */
  async update(id: string, request: SupplierRequest): Promise<ApiResponse<Supplier>> {
    return ApiService.put<Supplier>(`/suppliers/${id}`, request);
  },

  /**
   * Delete supplier
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/suppliers/${id}`);
  },

  /**
   * Search by name
   */
  async searchByName(name: string): Promise<ApiResponse<Supplier[]>> {
    return ApiService.get<Supplier[]>('/suppliers/search/name', { name });
  },

  /**
   * Filter by country
   */
  async getByCountry(country: string): Promise<ApiResponse<Supplier[]>> {
    return ApiService.get<Supplier[]>('/suppliers/search/country', { country });
  },
};
