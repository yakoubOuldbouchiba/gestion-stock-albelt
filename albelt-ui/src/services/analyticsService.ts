import ApiService from './api';
import type { CuttingOperation, MaterialType } from '../types/index';
import type { ApiResponse } from '../types/index';

/**
 * Analytics & Reporting API Service
 * 
 * NOTE: CuttingOperation-based analytics are DEPRECATED (v22+)
 * The cutting workflow has been simplified - use waste and roll statistics instead
 */
export const AnalyticsService = {
  /**
   * @deprecated Use waste piece statistics instead
   * Get high-efficiency cutting operations - NOT AVAILABLE
   */
  async getHighEfficiencyOperations(page = 0, size = 20): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getHighEfficiencyOperations - cutting operations no longer tracked');
    return { success: false, data: [], error: 'Cutting operations tracking deprecated' };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operations with significant waste - NOT AVAILABLE
   */
  async getSignificantWasteOperations(page = 0, size = 20): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getSignificantWasteOperations - cutting operations no longer tracked');
    return { success: false, data: [], error: 'Cutting operations tracking deprecated' };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operator performance metrics - NOT AVAILABLE
   */
  async getOperatorPerformance(): Promise<ApiResponse<{ operatorId: string; operatorName: string; avgUtilization: number }[]>> {
    console.warn('[DEPRECATED] getOperatorPerformance - cutting operations no longer tracked');
    return { success: false, data: [], error: 'Operator performance tracking deprecated' };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get total cutting operations count - NOT AVAILABLE
   */
  async getTotalOperationsCount(): Promise<ApiResponse<number>> {
    console.warn('[DEPRECATED] getTotalOperationsCount - cutting operations no longer tracked');
    return { success: false, data: 0, error: 'Cutting operations counting deprecated' };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operations within date range - NOT AVAILABLE
   */
  async getOperationsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getOperationsByDateRange - cutting operations no longer tracked');
    return { success: false, data: [], error: 'Cutting operations tracking deprecated' };
  },

  /**
   * Get waste count by status
   */
  async getWasteCountByStatus(status: string): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/waste-pieces/stats/count', { status });
  },

  /**
   * Get waste reuse efficiency by material
   */
  async getWasteReuseEfficiency(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/waste-pieces/stats/reuse-efficiency', { material });
  },

  /**
   * Get total waste area by material
   */
  async getTotalWasteAreaByMaterial(): Promise<ApiResponse<Record<MaterialType, number>>> {
    return ApiService.get('/waste-pieces/stats/total-area');
  },

  /**
   * Get inventory count by material
   */
  async getInventoryCountByMaterial(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/rolls/stats/count', { material });
  },

  /**
   * Get available area by material
   */
  async getAvailableAreaByMaterial(material: MaterialType): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/rolls/stats/area', { material });
  },

  /**
   * Get all materials inventory status
   */
  async getAllMaterialsStatus(): Promise<
    ApiResponse<{
      material: MaterialType;
      count: number;
      area: number;
    }[]>
  > {
    return ApiService.get('/rolls/stats/all-materials');
  },
};
