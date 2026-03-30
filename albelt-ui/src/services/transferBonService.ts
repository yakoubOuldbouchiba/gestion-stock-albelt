import ApiService from './api';
import type { ApiResponse, TransferBon, PagedResponse } from '../types/index';

export interface TransferBonCreateRequest {
  fromAltierID: string;
  toAltierID: string;
  dateSortie: string;
  dateEntree?: string;
  operatorId: string;
  notes?: string;
}

class TransferBonService {
  async createBon(request: TransferBonCreateRequest): Promise<ApiResponse<TransferBon>> {
    const params = new URLSearchParams();
    params.append('fromAltierID', request.fromAltierID);
    params.append('toAltierID', request.toAltierID);
    params.append('dateSortie', request.dateSortie);
    if (request.dateEntree) params.append('dateEntree', request.dateEntree);
    params.append('operatorId', request.operatorId);
    if (request.notes) params.append('notes', request.notes);

    return ApiService.post<TransferBon>(`/transfer-bons?${params.toString()}`);
  }

  async listBons(params?: {
    page?: number;
    size?: number;
    fromAltierId?: string;
    toAltierId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<TransferBon>>> {
    return ApiService.get<PagedResponse<TransferBon>>(`/transfer-bons`, params);
  }

  async getBonDetails(bonId: string): Promise<ApiResponse<TransferBon>> {
    return ApiService.get<TransferBon>(`/transfer-bons/${bonId}`);
  }

  async deleteBon(bonId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/transfer-bons/${bonId}`);
  }

  async removeMovement(bonId: string, movementId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/transfer-bons/${bonId}/movements/${movementId}`);
  }

  async confirmReceipt(bonId: string, dateEntree: string): Promise<ApiResponse<TransferBon>> {
    const params = new URLSearchParams();
    params.append('dateEntree', dateEntree);
    return ApiService.post<TransferBon>(`/transfer-bons/${bonId}/confirm?${params.toString()}`);
  }
}

export default new TransferBonService();
