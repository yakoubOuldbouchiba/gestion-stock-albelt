import ApiService from './api';
import type {
  Client,
  ClientRequest,
  ClientPhone,
  ClientPhoneRequest,
  ClientEmail,
  ClientEmailRequest,
  ClientAddress,
  ClientAddressRequest,
  ClientRepresentative,
  ClientRepresentativeRequest,
  ApiResponse,
  PagedResponse
} from '../types/index';

/**
 * Client API Service
 */
export const ClientService = {
  // ==================== CLIENT CRUD ====================

  /**
   * Get all clients
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<Client>>> {
    return ApiService.get<PagedResponse<Client>>('/clients', params);
  },

  /**
   * Get all active clients
   */
  async getAllActive(): Promise<ApiResponse<Client[]>> {
    return ApiService.get<Client[]>('/clients/active');
  },

  /**
   * Get client by ID
   */
  async getById(id: string): Promise<ApiResponse<Client>> {
    return ApiService.get<Client>(`/clients/${id}`);
  },

  /**
   * Create new client
   */
  async create(request: ClientRequest): Promise<ApiResponse<Client>> {
    return ApiService.post<Client>('/clients', request);
  },

  /**
   * Update client
   */
  async update(id: string, request: ClientRequest): Promise<ApiResponse<Client>> {
    return ApiService.put<Client>(`/clients/${id}`, request);
  },

  /**
   * Deactivate client (soft delete)
   */
  async deactivate(id: string): Promise<ApiResponse<string>> {
    return ApiService.put<string>(`/clients/${id}/deactivate`, {});
  },

  /**
   * Activate client
   */
  async activate(id: string): Promise<ApiResponse<string>> {
    return ApiService.put<string>(`/clients/${id}/activate`, {});
  },

  /**
   * Delete client permanently
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/clients/${id}`);
  },

  /**
   * Search clients by name
   */
  async searchByName(name: string): Promise<ApiResponse<Client[]>> {
    return ApiService.get<Client[]>('/clients/search/name', { name });
  },

  // ==================== PHONE MANAGEMENT ====================

  /**
   * Get all phones for client
   */
  async getClientPhones(clientId: string): Promise<ApiResponse<ClientPhone[]>> {
    return ApiService.get<ClientPhone[]>(`/clients/${clientId}/phones`);
  },

  /**
   * Add phone to client
   */
  async addPhone(clientId: string, request: ClientPhoneRequest): Promise<ApiResponse<ClientPhone>> {
    return ApiService.post<ClientPhone>(`/clients/${clientId}/phones`, request);
  },

  /**
   * Update phone
   */
  async updatePhone(
    clientId: string,
    phoneId: string,
    request: ClientPhoneRequest
  ): Promise<ApiResponse<ClientPhone>> {
    return ApiService.put<ClientPhone>(`/clients/${clientId}/phones/${phoneId}`, request);
  },

  /**
   * Delete phone
   */
  async deletePhone(clientId: string, phoneId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/clients/${clientId}/phones/${phoneId}`);
  },

  // ==================== EMAIL MANAGEMENT ====================

  /**
   * Get all emails for client
   */
  async getClientEmails(clientId: string): Promise<ApiResponse<ClientEmail[]>> {
    return ApiService.get<ClientEmail[]>(`/clients/${clientId}/emails`);
  },

  /**
   * Add email to client
   */
  async addEmail(clientId: string, request: ClientEmailRequest): Promise<ApiResponse<ClientEmail>> {
    return ApiService.post<ClientEmail>(`/clients/${clientId}/emails`, request);
  },

  /**
   * Update email
   */
  async updateEmail(
    clientId: string,
    emailId: string,
    request: ClientEmailRequest
  ): Promise<ApiResponse<ClientEmail>> {
    return ApiService.put<ClientEmail>(`/clients/${clientId}/emails/${emailId}`, request);
  },

  /**
   * Delete email
   */
  async deleteEmail(clientId: string, emailId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/clients/${clientId}/emails/${emailId}`);
  },

  // ==================== ADDRESS MANAGEMENT ====================

  /**
   * Get all addresses for client
   */
  async getClientAddresses(clientId: string): Promise<ApiResponse<ClientAddress[]>> {
    return ApiService.get<ClientAddress[]>(`/clients/${clientId}/addresses`);
  },

  /**
   * Add address to client
   */
  async addAddress(clientId: string, request: ClientAddressRequest): Promise<ApiResponse<ClientAddress>> {
    return ApiService.post<ClientAddress>(`/clients/${clientId}/addresses`, request);
  },

  /**
   * Update address
   */
  async updateAddress(
    clientId: string,
    addressId: string,
    request: ClientAddressRequest
  ): Promise<ApiResponse<ClientAddress>> {
    return ApiService.put<ClientAddress>(`/clients/${clientId}/addresses/${addressId}`, request);
  },

  /**
   * Delete address
   */
  async deleteAddress(clientId: string, addressId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/clients/${clientId}/addresses/${addressId}`);
  },

  // ==================== REPRESENTATIVE MANAGEMENT ====================

  /**
   * Get all representatives for client
   */
  async getClientRepresentatives(clientId: string): Promise<ApiResponse<ClientRepresentative[]>> {
    return ApiService.get<ClientRepresentative[]>(`/clients/${clientId}/representatives`);
  },

  /**
   * Add representative to client
   */
  async addRepresentative(
    clientId: string,
    request: ClientRepresentativeRequest
  ): Promise<ApiResponse<ClientRepresentative>> {
    return ApiService.post<ClientRepresentative>(`/clients/${clientId}/representatives`, request);
  },

  /**
   * Update representative
   */
  async updateRepresentative(
    clientId: string,
    repId: string,
    request: ClientRepresentativeRequest
  ): Promise<ApiResponse<ClientRepresentative>> {
    return ApiService.put<ClientRepresentative>(`/clients/${clientId}/representatives/${repId}`, request);
  },

  /**
   * Delete representative
   */
  async deleteRepresentative(clientId: string, repId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/clients/${clientId}/representatives/${repId}`);
  },
};
