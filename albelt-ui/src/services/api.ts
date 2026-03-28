import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '../types/index';

/**
 * Base API Service with interceptors and error handling
 */
class ApiService {
  private api: AxiosInstance;

  constructor() {
    // @ts-ignore - import.meta.env is a Vite feature
    const env = import.meta.env;
    this.api = axios.create({
      baseURL: env.VITE_API_BASE_URL || 'http://localhost:8080/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(endpoint);
    return response.data;
  }
}

export default new ApiService();
