import ApiService from './api';
import type { ApiResponse, PlacedRectangle, PlacedRectangleRequest } from '../types/index';

export const PlacedRectangleService = {
  async create(request: PlacedRectangleRequest): Promise<ApiResponse<PlacedRectangle>> {
    return ApiService.post<PlacedRectangle>('/placed-rectangles', request);
  },

  async update(id: string, request: PlacedRectangleRequest): Promise<ApiResponse<PlacedRectangle>> {
    return ApiService.put<PlacedRectangle>(`/placed-rectangles/${id}`, request);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/placed-rectangles/${id}`);
  },

  async getById(id: string): Promise<ApiResponse<PlacedRectangle>> {
    return ApiService.get<PlacedRectangle>(`/placed-rectangles/${id}`);
  },

  async getByRoll(rollId: string): Promise<ApiResponse<PlacedRectangle[]>> {
    return ApiService.get<PlacedRectangle[]>(`/placed-rectangles/by-roll/${rollId}`);
  },

  async getByWastePiece(wastePieceId: string): Promise<ApiResponse<PlacedRectangle[]>> {
    return ApiService.get<PlacedRectangle[]>(`/placed-rectangles/by-waste-piece/${wastePieceId}`);
  },

  async getByCommandeItem(commandeItemId: string): Promise<ApiResponse<PlacedRectangle[]>> {
    return ApiService.get<PlacedRectangle[]>(`/placed-rectangles/by-commande-item/${commandeItemId}`);
  },

  async clearByRoll(rollId: string): Promise<ApiResponse<number>> {
    return ApiService.delete<number>(`/placed-rectangles/by-roll/${rollId}`);
  },

  async clearByWastePiece(wastePieceId: string): Promise<ApiResponse<number>> {
    return ApiService.delete<number>(`/placed-rectangles/by-waste-piece/${wastePieceId}`);
  },
};
