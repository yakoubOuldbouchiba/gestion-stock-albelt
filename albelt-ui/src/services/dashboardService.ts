import ApiService from './api';
import type { ApiResponse, InventoryMetrics, WasteMetrics, Roll } from '../types/index';

export interface DashboardStats {
  inventoryMetrics: InventoryMetrics;
  wasteMetrics: WasteMetrics;
  recentRolls: Roll[];
}

export const DashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return ApiService.get<DashboardStats>('/dashboard/stats');
  },
};
