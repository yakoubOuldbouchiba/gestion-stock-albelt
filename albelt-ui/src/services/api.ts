import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '../types/index';

/**
 * Base API Service with interceptors and error handling
 */
class ApiService {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // @ts-ignore - import.meta.env is a Vite feature
    const env = import.meta.env;

    const defaultBaseUrl = env.PROD
      ? 'https://gestion-stock-albelt.onrender.com/api'
      : 'http://localhost:8080/api';

    const normalizeBaseUrl = (baseUrl: string) => {
      try {
        const url = new URL(baseUrl);
        const path = url.pathname || '/';
        if (path === '/' || path === '') {
          url.pathname = '/api';
          return url.toString().replace(/\/$/, '');
        }
        return baseUrl.replace(/\/$/, '');
      } catch {
        return baseUrl;
      }
    };

    const rawBaseUrl = env.VITE_API_BASE_URL || defaultBaseUrl;
    const baseUrl = normalizeBaseUrl(rawBaseUrl);
    this.baseUrl = baseUrl;

    this.api = axios.create({
      baseURL: baseUrl,
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
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private normalizeEndpoint(endpoint: string) {
    if (!endpoint) return endpoint;
    // If endpoint starts with '/', Axios treats it as an absolute path and ignores baseURL path.
    // We want endpoints to be relative to baseURL (which already ends with '/api').
    return endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(this.normalizeEndpoint(endpoint), { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(this.normalizeEndpoint(endpoint), data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(this.normalizeEndpoint(endpoint), data);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(this.normalizeEndpoint(endpoint), data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(this.normalizeEndpoint(endpoint));
    return response.data;
  }

  async getBlob(endpoint: string, params?: Record<string, unknown>): Promise<Blob> {
    const response = await this.api.get(this.normalizeEndpoint(endpoint), {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default new ApiService();
