import ApiService from './api';
import type { ApiResponse, MaterialChuteThreshold } from '../types/index';

export type MaterialChuteThresholdUpdate = Pick<
  MaterialChuteThreshold,
  'materialType' | 'minWidthMm' | 'minLengthM'
>;

/**
 * Material Chute Thresholds API Service
 */
export const MaterialChuteThresholdService = {
  async getAll(): Promise<ApiResponse<MaterialChuteThreshold[]>> {
    return ApiService.get<MaterialChuteThreshold[]>('/material-chute-thresholds');
  },

  async upsertAll(
    updates: MaterialChuteThresholdUpdate[]
  ): Promise<ApiResponse<MaterialChuteThreshold[]>> {
    return ApiService.put<MaterialChuteThreshold[]>('/material-chute-thresholds', updates);
  },
};
