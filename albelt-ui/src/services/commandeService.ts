import ApiService from './api';
import type {
  Commande,
  CommandeRequest,
  CommandeItem,
  CommandeItemRequest,
  OptimizationComparison,
  AltierScore,
  ApiResponse,
  PagedResponse
} from '../types/index';

/**
 * Commande (Order) API Service
 */
export const CommandeService = {
  // ==================== ORDER CRUD ====================

  /**
   * Get all orders
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<PagedResponse<Commande>>> {
    return ApiService.get<PagedResponse<Commande>>('/commandes', params);
  },

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<ApiResponse<Commande>> {
    return ApiService.get<Commande>(`/commandes/${id}`);
  },

  /**
   * Get altiers ranked by score for fulfilling this order
   */
  async getAltierScores(commandeId: string): Promise<ApiResponse<AltierScore[]>> {
    return ApiService.get<AltierScore[]>(`/commandes/${commandeId}/altier-scores`);
  },

  /**
   * Get order by order number
   */
  async getByNumeroCommande(numeroCommande: string): Promise<ApiResponse<Commande>> {
    return ApiService.get<Commande>(`/commandes/numero/${numeroCommande}`);
  },

  /**
   * Get orders by client ID
   */
  async getByClientId(clientId: string): Promise<ApiResponse<Commande[]>> {
    return ApiService.get<Commande[]>(`/commandes/client/${clientId}`);
  },

  /**
   * Get orders by status
   */
  async getByStatus(status: string): Promise<ApiResponse<Commande[]>> {
    return ApiService.get<Commande[]>(`/commandes/status/${status}`);
  },

  /**
   * Search orders by number pattern
   */
  async search(query: string): Promise<ApiResponse<Commande[]>> {
    return ApiService.get<Commande[]>('/commandes/search', { q: query });
  },

  /**
   * Create new order
   */
  async create(request: CommandeRequest): Promise<ApiResponse<Commande>> {
    return ApiService.post<Commande>('/commandes', request);
  },

  /**
   * Update order
   */
  async update(id: string, request: CommandeRequest): Promise<ApiResponse<Commande>> {
    return ApiService.put<Commande>(`/commandes/${id}`, request);
  },

  /**
   * Update order status
   */
  async updateStatus(id: string, status: string): Promise<ApiResponse<Commande>> {
    return ApiService.patch<Commande>(`/commandes/${id}/status`, { status });
  },

  /**
   * Delete order
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/commandes/${id}`);
  },

  // ==================== ITEM MANAGEMENT ====================

  /**
   * Get all items for an order
   */
  async getItems(commandeId: string): Promise<ApiResponse<CommandeItem[]>> {
    return ApiService.get<CommandeItem[]>(`/commandes/${commandeId}/items`);
  },

  /**
   * Get item by ID
   */
  async getItemById(itemId: string): Promise<ApiResponse<CommandeItem>> {
    return ApiService.get<CommandeItem>(`/commandes/items/${itemId}`);
  },

  /**
   * Get items by movement type
   */
  async getItemsByMovement(typeMouvement: string): Promise<ApiResponse<CommandeItem[]>> {
    return ApiService.get<CommandeItem[]>(`/commandes/items/mouvement/${typeMouvement}`);
  },

  /**
   * Update item status
   */
  async updateItemStatus(itemId: string, status: string): Promise<ApiResponse<CommandeItem>> {
    return ApiService.patch<CommandeItem>(`/commandes/items/${itemId}/status`, { status });
  },

  /**
   * Create item for an order
   */
  async createItem(commandeId: string, request: CommandeItemRequest): Promise<ApiResponse<CommandeItem>> {
    return ApiService.post<CommandeItem>(`/commandes/${commandeId}/items`, request);
  },

  /**
   * Update item
   */
  async updateItem(itemId: string, request: CommandeItemRequest): Promise<ApiResponse<CommandeItem>> {
    return ApiService.put<CommandeItem>(`/commandes/items/${itemId}`, request);
  },

  /**
   * Delete item
   */
  async deleteItem(itemId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/commandes/items/${itemId}`);
  },

  /**
   * Get optimization comparison (actual vs suggested)
   */
  async getOptimizationComparison(itemId: string): Promise<ApiResponse<OptimizationComparison>> {
    return ApiService.get<OptimizationComparison>(`/commandes/items/${itemId}/optimization`);
  },

  /**
   * Regenerate optimization suggestion
   */
  async regenerateOptimization(itemId: string): Promise<ApiResponse<OptimizationComparison>> {
    return ApiService.post<OptimizationComparison>(`/commandes/items/${itemId}/optimization/regenerate`, {});
  },
};

export default CommandeService;
