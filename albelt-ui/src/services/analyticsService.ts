import ApiService from './api';
import type { ApiResponse, CuttingOperation, MaterialType } from '../types/index';

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
  async getHighEfficiencyOperations(
    _page = 0,
    _size = 20
  ): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getHighEfficiencyOperations - cutting operations no longer tracked');
    return {
      success: false,
      message: 'Cutting operations tracking deprecated',
      data: [],
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operations with significant waste - NOT AVAILABLE
   */
  async getSignificantWasteOperations(
    _page = 0,
    _size = 20
  ): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getSignificantWasteOperations - cutting operations no longer tracked');
    return {
      success: false,
      message: 'Cutting operations tracking deprecated',
      data: [],
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operator performance metrics - NOT AVAILABLE
   */
  async getOperatorPerformance(): Promise<
    ApiResponse<{ operatorId: string; operatorName: string; avgUtilization: number }[]>
  > {
    console.warn('[DEPRECATED] getOperatorPerformance - cutting operations no longer tracked');
    return {
      success: false,
      message: 'Operator performance tracking deprecated',
      data: [],
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get total cutting operations count - NOT AVAILABLE
   */
  async getTotalOperationsCount(): Promise<ApiResponse<number>> {
    console.warn('[DEPRECATED] getTotalOperationsCount - cutting operations no longer tracked');
    return {
      success: false,
      message: 'Cutting operations counting deprecated',
      data: 0,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * @deprecated Use waste piece statistics instead
   * Get operations within date range - NOT AVAILABLE
   */
  async getOperationsByDateRange(
    _startDate: string,
    _endDate: string
  ): Promise<ApiResponse<CuttingOperation[]>> {
    console.warn('[DEPRECATED] getOperationsByDateRange - cutting operations no longer tracked');
    return {
      success: false,
      message: 'Cutting operations tracking deprecated',
      data: [],
      timestamp: new Date().toISOString(),
    };
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
    return ApiService.get<Record<MaterialType, number>>('/waste-pieces/stats/total-area');
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
    ApiResponse<
      {
        material: MaterialType;
        count: number;
        area: number;
      }[]
    >
  > {
    return ApiService.get<
      {
        material: MaterialType;
        count: number;
        area: number;
      }[]
    >('/rolls/stats/all-materials');
  },
};
