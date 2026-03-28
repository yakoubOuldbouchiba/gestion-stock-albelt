import ApiService from './api';
import type { Roll, RollRequest, MaterialType, ApiResponse, WasteType } from '../types/index';

/**
 * Roll API Service - Focus on FIFO operations
 */
export const RollService = {
  /**
   * Get all rolls
   */
  async getAll(): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls');
  },

  /**
   * Get rolls filtered by altier (workshop)
   */
  async getByAltier(altierLabel: string): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/altier/filter', { altier: altierLabel });
  },

  /**
   * FIFO Selection - Get oldest available roll
   */
  async selectByFifo(material: MaterialType): Promise<ApiResponse<Roll>> {
    return ApiService.get<Roll>('/rolls/fifo/select', { material });
  },

  /**
   * Get FIFO queue for material
   */
  async getFifoQueue(material: MaterialType): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/fifo/queue', { material });
  },

  /**
   * Receive new roll
   */
  async receive(request: RollRequest): Promise<ApiResponse<Roll>> {
    return ApiService.post<Roll>('/rolls/receive', request);
  },

  /**
   * Get roll by ID
   */
  async getById(id: string): Promise<ApiResponse<Roll>> {
    return ApiService.get<Roll>(`/rolls/${id}`);
  },

  /**
   * Find rolls by size
   */
  async findBySize(material: MaterialType, area: number): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/search/by-size', { material, area });
  },

  /**
   * Get rolls by supplier
   */
  async getBySupplier(supplierId: string): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>(`/rolls/supplier/${supplierId}`);
  },

  /**
   * Update roll status
   */
  async updateStatus(id: string, newStatus: string): Promise<ApiResponse<Roll>> {
    return ApiService.patch<Roll>(`/rolls/${id}/status`, { status: newStatus });
  },

  /**
   * Get inventory statistics
   */
  async getCountByMaterial(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/rolls/stats/count', { material });
  },

  async getTotalAreaByMaterial(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/rolls/stats/area', { material });
  },

  /**
   * Get rolls filtered by supplier, material type, and waste type
   * Used for chute form dropdown
   */
  async getBySupplierAndMaterialAndWasteType(
    supplierId: string,
    materialType: MaterialType,
    wasteType: WasteType
  ): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/filter/by-supplier-material-waste', {
      supplierId,
      material: materialType,
      wasteType,
    });
  },
};
