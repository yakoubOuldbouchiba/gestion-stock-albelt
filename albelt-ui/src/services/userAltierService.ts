import api from './api';
import type { UserAltier } from '../types';

/**
 * User-Altier Service: Handle multi-location access control
 * Manages user assignments to workshops (altiers)
 */

export const userAltierService = {
  /**
   * Get all altier assignments for a user
   */
  getAltiersByUser: async (userId: string): Promise<UserAltier[]> => {
    const response = await api.get<UserAltier[]>(`/user-altiers/user/${userId}`);
    return response.data || [];
  },

  /**
   * Get all users assigned to an altier
   */
  getUsersByAltier: async (altierId: string): Promise<UserAltier[]> => {
    const response = await api.get<UserAltier[]>(`/user-altiers/altier/${altierId}`);
    return response.data || [];
  },

  /**
   * Assign an altier to a user
   */
  assignAltier: async (userId: string, altierId: string): Promise<UserAltier> => {
    const response = await api.post<UserAltier>(
      `/user-altiers/assign?userId=${userId}&altierId=${altierId}`
    );
    return response.data!;
  },

  /**
   * Unassign an altier from a user
   */
  unassignAltier: async (userId: string, altierId: string): Promise<void> => {
    await api.delete<void>(
      `/user-altiers/unassign?userId=${userId}&altierId=${altierId}`
    );
  },

  /**
   * Check if user has access to altier
   */
  checkAccess: async (userId: string, altierId: string): Promise<boolean> => {
    const response = await api.get<boolean>('/user-altiers/check-access', {
      userId,
      altierId,
    });
    return response.data || false;
  },
};

export default userAltierService;
