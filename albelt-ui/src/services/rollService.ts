import ApiService from './api';
import type { Roll, RollRequest, MaterialType, ApiResponse, PagedResponse, RollStatus } from '../types/index';

/**
 * Roll API Service - Focus on FIFO operations
 */
export const RollService = {
    /**
     * Get grouped roll statistics by color, nbPlis, thicknessMm, materialType, altierId, status
     */
    async getGroupedByAllFields(): Promise<ApiResponse<any[]>> {
      return ApiService.get<any[]>('/rolls/grouped');
    },
  /**
   * Get all rolls
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: RollStatus;
    materialType?: MaterialType;
    supplierId?: string;
    altierId?: string;
    colorId?: string;
    nbPlis?: number;
    thicknessMm?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<Roll>>> {
    return ApiService.get<PagedResponse<Roll>>('/rolls', params);
  },

  /**
   * Get transfer source rolls for a given from-altier.
   * GET /api/rolls/transfer-sources?fromAltierId={id}
   */
  async getTransferSources(params: {
    fromAltierId: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PagedResponse<Roll>>> {
    return ApiService.get<PagedResponse<Roll>>('/rolls/transfer-sources', params);
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
   * Get available rolls for a material type (scoped to current user's accessible altiers)
   */
  async getAvailableByMaterial(materialType: MaterialType): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/available', { materialType });
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
   * Get inventory statistics grouped by material type
   * GET /api/rolls/stats/by-material
   */
  async getStatsByMaterial(): Promise<
    ApiResponse<Array<{ material: MaterialType; count: number; totalArea: number }>>
  > {
    return ApiService.get<Array<{ material: MaterialType; count: number; totalArea: number }>>(
      '/rolls/stats/by-material'
    );
  },

  /**
   * Get rolls filtered by supplier and material type
   * Used for chute form dropdown
   */
  async getBySupplierAndMaterial(
    supplierId: string,
    materialType: MaterialType
  ): Promise<ApiResponse<Roll[]>> {
    return ApiService.get<Roll[]>('/rolls/filter/by-supplier-material', {
      supplierId,
      material: materialType,
    });
  },
};
