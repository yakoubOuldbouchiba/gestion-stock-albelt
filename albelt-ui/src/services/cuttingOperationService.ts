/**
 * DEPRECATED SERVICE - DO NOT USE
 * 
 * CuttingOperation API endpoints were removed in v22
 * This service is kept for reference only and all endpoints are non-functional
 * 
 * The cutting workflow has been simplified:
 * - Rolls → Waste Pieces → Commande Items (direct linkage)
 * - No separate CuttingOperation tracking
 * 
 * Use WastePieceService and RollService instead
 */

import ApiService from './api';
import type { CuttingOperation, CuttingOperationRequest, ApiResponse } from '../types/index';

/**
 * Cutting Operation API Service
 */
export const CuttingOperationService = {
  /**
   * Get all cutting operations
   */
  async getAll(): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>('/cutting-operations');
  },

  /**
   * Create a new cutting operation
   */
  async create(request: CuttingOperationRequest): Promise<ApiResponse<CuttingOperation>> {
    return ApiService.post<CuttingOperation>('/cutting-operations', request);
  },

  /**
   * Get operation by ID
   */
  async getById(id: string): Promise<ApiResponse<CuttingOperation>> {
    return ApiService.get<CuttingOperation>(`/cutting-operations/${id}`);
  },

  /**
   * Get operations by operator
   */
  async getByOperator(operatorId: string, page = 0, size = 20): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>(`/cutting-operations/operator/${operatorId}`, { page, size });
  },

  /**
   * Get operations on roll
   */
  async getByRoll(rollId: string): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>(`/cutting-operations/roll/${rollId}`);
  },

  /**
   * Get high-efficiency operations
   */
  async getHighEfficiencyOperations(page = 0, size = 20): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>('/cutting-operations/analytics/high-efficiency', { page, size });
  },

  /**
   * Get operations with significant waste
   */
  async getOperationsWithSignificantWaste(page = 0, size = 20): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>('/cutting-operations/analytics/significant-waste', { page, size });
  },

  /**
   * Get operator performance metrics
   */
  async getOperatorPerformance(): Promise<ApiResponse<{ operatorId: string; averageUtilization: number }[]>> {
    return ApiService.get('/cutting-operations/analytics/operator-performance');
  },

  /**
   * Get operations by date range
   */
  async getByDateRange(start: string, end: string): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>('/cutting-operations/analytics/by-date-range', { start, end });
  },

  /**
   * Get total operations count
   */
  async getTotalCount(): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/cutting-operations/analytics/total-count');
  },

  /**
   * Update cutting operation status with new workflow support
   */
  async updateStatus(id: string, status: string): Promise<ApiResponse<CuttingOperation>> {
    return ApiService.patch<CuttingOperation>(`/cutting-operations/${id}/status`, { status });
  },

  /**
   * Update cutting operation with actual results
   */
  async updateWithResults(id: string, data: any): Promise<ApiResponse<CuttingOperation>> {
    return ApiService.patch<CuttingOperation>(`/cutting-operations/${id}`, data);
  },

  /**
   * Delete cutting operation
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete(`/cutting-operations/${id}`);
  },

  /**
   * Get operations linked to commande items
   */
  async getByCommandeItem(commandeItemId: string): Promise<ApiResponse<CuttingOperation[]>> {
    return ApiService.get<CuttingOperation[]>(`/cutting-operations/commande-item/${commandeItemId}`);
  },

  /**
   * Count operations by status
   */
  async countByStatus(): Promise<ApiResponse<Record<string, number>>> {
    return ApiService.get('/cutting-operations/analytics/count-by-status');
  },

  /**
   * Get waste metrics for cutting operation
   */
  async getWasteMetrics(id: string): Promise<ApiResponse<any>> {
    return ApiService.get(`/cutting-operations/${id}/waste-metrics`);
  },
};
