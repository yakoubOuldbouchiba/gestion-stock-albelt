import ApiService from './api';
import type { WastePiece, MaterialType, ApiResponse } from '../types/index';

/**
 * Waste Piece API Service - Focus on reuse tracking and waste reduction
 */
export const WastePieceService = {
  /**
   * CRITICAL: Find waste piece for reuse
   */
  async findReuseCandidate(material: MaterialType, requiredArea: number): Promise<ApiResponse<WastePiece>> {
    return ApiService.get<WastePiece>('/waste-pieces/reuse/find', { material, requiredArea });
  },

  /**
   * Get large available waste pieces
   */
  async getLargeAvailable(page = 0, size = 20): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>('/waste-pieces/reuse/large', { page, size });
  },

  /**
   * Get waste piece by ID
   */
  async getById(id: string): Promise<ApiResponse<WastePiece>> {
    return ApiService.get<WastePiece>(`/waste-pieces/${id}`);
  },

  /**
   * Get available waste by material
   */
  async getAvailableByMaterial(material: MaterialType, page = 0, size = 20): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>('/waste-pieces/available', { material, page, size });
  },

  /**
   * Get waste from cutting operation
   */
  async getByCuttingOperation(cuttingOpId: string): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>(`/waste-pieces/cutting-operation/${cuttingOpId}`);
  },

  /**
   * Mark waste as used
   */
  async markAsUsed(wastePieceId: string): Promise<ApiResponse<WastePiece>> {
    return ApiService.patch<WastePiece>(`/waste-pieces/${wastePieceId}/mark-used`);
  },

  /**
   * Mark waste as scrap
   */
  async markAsScrap(id: string): Promise<ApiResponse<WastePiece>> {
    return ApiService.patch<WastePiece>(`/waste-pieces/${id}/mark-scrap`);
  },

  /**
   * Get waste statistics
   */
  async getWasteReuseEfficiency(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/waste-pieces/stats/reuse-efficiency', { material });
  },

  async getTotalWasteAreaByMaterial(): Promise<ApiResponse<{ material: MaterialType; area: number }[]>> {
    return ApiService.get('/waste-pieces/stats/total-area');
  },

  /**
   * Get all waste pieces with pagination
   */
  async getAll(page = 0, size = 20): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>('/waste-pieces', { page, size });
  },

  /**
  * Get waste pieces by type (DECHET or CHUTE_EXPLOITABLE)
   */
  async getByType(type: string, page = 0, size = 20): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>('/waste-pieces/by-type', { type, page, size });
  },

  /**
   * Get waste pieces by roll
   */
  async getByRoll(rollId: string): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>(`/waste-pieces/by-roll/${rollId}`);
  },

  /**
   * Get waste pieces consumed in operation
   */
  async getConsumedInOperation(operationId: string): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>(`/waste-pieces/consumed-in/${operationId}`);
  },

  /**
   * Create waste piece from cutting operation
   */
  async create(wastePiece: any): Promise<ApiResponse<WastePiece>> {
    return ApiService.post<WastePiece>('/waste-pieces', wastePiece);
  },

  /**
   * Update waste piece
   */
  async update(id: string, data: any): Promise<ApiResponse<WastePiece>> {
    return ApiService.patch<WastePiece>(`/waste-pieces/${id}`, data);
  },

  /**
   * Delete waste piece
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete(`/waste-pieces/${id}`);
  },

  /**
   * Get waste classification stats
   */
  async getClassificationStats(): Promise<ApiResponse<any>> {
    return ApiService.get('/waste-pieces/stats/classification');
  },
};
