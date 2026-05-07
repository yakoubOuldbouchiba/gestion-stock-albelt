import ApiService from './api';
import type { AuditLog, AuditAction, ApiResponse, PagedResponse } from '../types/index';

export const AuditLogService = {
  async getAll(params?: {
    page?: number;
    size?: number;
    actorId?: string;
    action?: AuditAction;
    targetEntity?: string;
    targetId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<AuditLog>>> {
    return ApiService.get<PagedResponse<AuditLog>>('/audit-logs', params as Record<string, unknown>);
  },
};
