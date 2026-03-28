import { create } from 'zustand';
import type { User } from '../types/index';
import ApiService from '@services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial user from localStorage if available
  const initialUser = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!) : null;

  return {
    user: initialUser,
    token: localStorage.getItem('authToken'),
    isLoading: false,
    isAuthenticated: !!localStorage.getItem('authToken'),
    error: null,

    login: async (username: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await ApiService.post<{ token: string; user: User; altierIds: string[] }>(
          '/auth/login',
          { username, password }
        );
        
        if (response.success && response.data) {
          const { token, user, altierIds } = response.data;
          
          // Set user's primary altier to first one in the list
          const userData = {
            ...user,
            altierId: altierIds && altierIds.length > 0 ? altierIds[0] : undefined,
            altierIds: altierIds || []  // Store all accessible altiers
          };
          
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(userData));
          set({ 
            user: userData, 
            token, 
            isAuthenticated: true 
          });
        } else {
          throw new Error(response.message || 'Login failed');
        }
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Login failed';
        set({ error: message });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      set({ user: null, token: null, isAuthenticated: false, error: null });
    },

    checkAuth: () => {
      const token = localStorage.getItem('authToken');
      const authUser = localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser')!) : null;
      set({ token, user: authUser, isAuthenticated: !!token });
    },

    clearError: () => {
      set({ error: null });
    },
  };
});
