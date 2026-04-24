import ApiService from './api';
import type { WastePiece, MaterialType, ApiResponse, PagedResponse, WasteStatus, WasteType } from '../types/index';

/**
 * Waste Piece API Service - Focus on reuse tracking and waste reduction
 */
export const WastePieceService = {
  /**
   * Get grouped waste piece statistics by color, nbPlis, thicknessMm, materialType, altierId, status
   */
  async getGroupedByAllFields(type: WasteType): Promise<ApiResponse<any[]>> {
    return ApiService.get<any[]>('/waste-pieces/grouped', { type });
  },
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

  async regenerateQrCode(id: string): Promise<ApiResponse<WastePiece>> {
    return ApiService.post<WastePiece>(`/waste-pieces/${id}/qr-code/regenerate`, {});
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
   * Archive waste piece
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

  /**
   * Count waste pieces by status
   */
  async countByStatus(status: WasteStatus): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/waste-pieces/stats/count', { status });
  },

  async getTotalWasteAreaByMaterial(): Promise<ApiResponse<{ material: MaterialType; area: number }[]>> {
    return ApiService.get('/waste-pieces/stats/total-area');
  },

  /**
   * Get all waste pieces with pagination
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    materialType?: MaterialType;
    status?: WasteStatus;
    wasteType?: WasteType;
    altierId?: string;
    colorId?: string;
    nbPlis?: number;
    thicknessMm?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<WastePiece>>> {
    return ApiService.get<PagedResponse<WastePiece>>('/waste-pieces', params);
  },

  /**
   * Get transfer source waste pieces for a given from-altier.
   * GET /api/waste-pieces/transfer-sources?fromAltierId={id}
   */
  async getTransferSources(params: {
    fromAltierId: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PagedResponse<WastePiece>>> {
    return ApiService.get<PagedResponse<WastePiece>>('/waste-pieces/transfer-sources', params);
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
   * Get waste pieces by commande item
   */
  async getByCommandeItem(commandeItemId: string): Promise<ApiResponse<WastePiece[]>> {
    return ApiService.get<WastePiece[]>(`/waste-pieces/by-commande-item/${commandeItemId}`);
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
  /**
   * Get inventory statistics grouped by material type
   * GET /api/waste-pieces/stats/by-material
   */
  async getStatsByMaterial(type: WasteType): Promise<
    ApiResponse<Array<{ material: MaterialType; count: number; totalArea: number }>>
  > {
    return ApiService.get<Array<{ material: MaterialType; count: number; totalArea: number }>>(
      '/waste-pieces/stats/by-material',
      { type }
    );
  },
};
