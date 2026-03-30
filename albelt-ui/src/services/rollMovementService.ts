import ApiService from './api';
import type { ApiResponse, PagedResponse } from '../types/index';

export interface RollMovement {
  id: string;
  rollId: string;
  transferBonId?: string;
  fromAltier: {
    id: string;
    libelle: string;
    adresse: string;
  };
  toAltier: {
    id: string;
    libelle: string;
    adresse: string;
  };
  dateSortie: string;
  dateEntree: string;
  statusSortie?: boolean;  // true when item exits from_altier
  statusEntree?: boolean;  // true when item enters to_altier
  reason: string;
  operator: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  notes: string;
  durationHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface RollMovementRequest {
  rollId: string;
  fromAltierID: string;  // Now required
  toAltierID: string;
  dateSortie: string;
  dateEntree: string;
  transferBonId?: string;
  reason?: string;
  notes?: string;
}

class RollMovementService {
  /**
   * Record a new roll movement
   */
  async recordMovement(request: RollMovementRequest & { operatorId: string }): Promise<ApiResponse<RollMovement>> {
    const params = new URLSearchParams();
    params.append('rollId', request.rollId);
    if (request.fromAltierID) {
      params.append('fromAltierID', request.fromAltierID);
    }
    params.append('toAltierID', request.toAltierID);
    params.append('dateSortie', request.dateSortie);
    params.append('dateEntree', request.dateEntree);
    if (request.transferBonId) {
      params.append('transferBonId', request.transferBonId);
    }
    if (request.reason) {
      params.append('reason', request.reason);
    }
    params.append('operatorId', request.operatorId);
    if (request.notes) {
      params.append('notes', request.notes);
    }

    return ApiService.post<RollMovement>(`/roll-movements?${params.toString()}`);
  }

  /**
   * Get movement history for a roll
   */
  async getRollMovementHistory(rollId: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/roll/${rollId}/history`, { page, size });
  }

  /**
   * Get current location of a roll
   */
  async getCurrentLocation(rollId: string): Promise<ApiResponse<RollMovement>> {
    return ApiService.get<RollMovement>(`/roll-movements/roll/${rollId}/current-location`);
  }

  /**
   * Get incoming movements for an altier
   */
  async getIncomingMovements(altierID: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/altier/${altierID}/incoming`, { page, size });
  }

  /**
   * Get outgoing movements for an altier
   */
  async getOutgoingMovements(altierID: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/altier/${altierID}/outgoing`, { page, size });
  }

  /**
   * Get movements from an altier (alias for outgoing movements)
   */
  async getMovementsFromAltier(altierID: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return this.getOutgoingMovements(altierID, page, size);
  }

  /**
   * Get movements recorded by an operator
   */
  async getOperatorMovements(operatorId: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/operator/${operatorId}`, { page, size });
  }

  /**
   * Update a movement
   */
  async updateMovement(movementId: string, data: Partial<RollMovement>): Promise<ApiResponse<RollMovement>> {
    return ApiService.put<RollMovement>(`/roll-movements/${movementId}`, data);
  }

  /**
   * Delete a movement
   */
  async deleteMovement(movementId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/roll-movements/${movementId}`);
  }

  /**
   * Confirm receipt of a movement (set entry date)
   */
  async confirmReceipt(movementId: string, dateEntree: string): Promise<ApiResponse<RollMovement>> {
    const params = new URLSearchParams();
    params.append('dateEntree', dateEntree);
    return ApiService.post<RollMovement>(`/roll-movements/${movementId}/confirm?${params.toString()}`);
  }

  /**
   * Get pending receipts for a specific altier
   */
  async getPendingReceiptsByAltier(altierID: string, page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/altier/${altierID}/pending-receipts`, { page, size });
  }

  /**
   * Get all pending receipts (admin)
   */
  async getAllPendingReceipts(page = 0, size = 20): Promise<ApiResponse<PagedResponse<RollMovement>>> {
    return ApiService.get<PagedResponse<RollMovement>>(`/roll-movements/pending-receipts`, { page, size });
  }
}

export default new RollMovementService();
