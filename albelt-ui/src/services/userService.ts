import ApiService from './api';
import type { User, UserRole, ApiResponse, PagedResponse } from '../types/index';

/**
 * User API Service
 */
export const UserService = {
  /**
   * Get user by ID
   */
  async getById(id: string): Promise<ApiResponse<User>> {
    return ApiService.get<User>(`/users/${id}`);
  },

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<ApiResponse<User>> {
    return ApiService.get<User>('/users/search/username', { username });
  },

  /**
   * Get all active users
   */
  async getAllActive(): Promise<ApiResponse<User[]>> {
    return ApiService.get<User[]>('/users/active');
  },

  /**
   * Get users with pagination
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: UserRole;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<User>>> {
    return ApiService.get<PagedResponse<User>>('/users', params);
  },

  /**
   * Count users with optional filters
   */
  async count(params?: {
    search?: string;
    role?: UserRole;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<number>> {
    return ApiService.get<number>('/users/stats/count', params);
  },

  /**
   * Get users by role
   */
  async getByRole(role: UserRole): Promise<ApiResponse<User[]>> {
    return ApiService.get<User[]>('/users/by-role', { role });
  },

  /**
   * Get active operators
   */
  async getActiveOperators(): Promise<ApiResponse<User[]>> {
    return ApiService.get<User[]>('/users/operators');
  },

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<ApiResponse<void>> {
    return ApiService.patch<void>(`/users/${id}/deactivate`, null);
  },

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<ApiResponse<void>> {
    return ApiService.patch<void>(`/users/${id}/activate`, null);
  },

  /**
   * Change user role
   */
  async changeRole(id: string, newRole: UserRole): Promise<ApiResponse<void>> {
    return ApiService.patch<void>(`/users/${id}/role`, { newRole });
  },
};
