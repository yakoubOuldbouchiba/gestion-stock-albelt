import ApiService from './api';
import type {
  Commande,
  CommandeRequest,
  CommandeItem,
  CommandeItemRequest,
  OptimizationComparison,
  AltierScore,
  ApiResponse,
  PagedResponse,
  OrderSummaryStats
} from '../types/index';
import { normalizeArticleBackedItem } from '../utils/article';

const normalizeCommande = (commande: Commande): Commande => ({
  ...commande,
  items: (commande.items ?? []).map((item) => normalizeArticleBackedItem(item) as CommandeItem),
});

/**
 * Commande (Order) API Service
 */
export const CommandeService = {
  /**
   * Get summary statistics for orders and items
   */
  async getSummaryStats(): Promise<ApiResponse<OrderSummaryStats>> {
    return ApiService.get<OrderSummaryStats>('/commandes/summary-stats');
  },

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
    const response = await ApiService.get<PagedResponse<Commande>>('/commandes', params);
    if (response.data) {
      response.data = {
        ...response.data,
        items: (response.data.items ?? []).map(normalizeCommande),
      };
    }
    return response;
  },

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<ApiResponse<Commande>> {
    const response = await ApiService.get<Commande>(`/commandes/${id}`);
    if (response.data) {
      response.data = normalizeCommande(response.data);
    }
    return response;
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
    const response = await ApiService.get<Commande>(`/commandes/numero/${numeroCommande}`);
    if (response.data) {
      response.data = normalizeCommande(response.data);
    }
    return response;
  },

  /**
   * Get orders by client ID
   */
  async getByClientId(clientId: string): Promise<ApiResponse<Commande[]>> {
    const response = await ApiService.get<Commande[]>(`/commandes/client/${clientId}`);
    response.data = (response.data ?? []).map(normalizeCommande);
    return response;
  },

  /**
   * Get orders by status
   */
  async getByStatus(status: string): Promise<ApiResponse<Commande[]>> {
    const response = await ApiService.get<Commande[]>(`/commandes/status/${status}`);
    response.data = (response.data ?? []).map(normalizeCommande);
    return response;
  },

  /**
   * Search orders by number pattern
   */
  async search(query: string): Promise<ApiResponse<Commande[]>> {
    const response = await ApiService.get<Commande[]>('/commandes/search', { q: query });
    response.data = (response.data ?? []).map(normalizeCommande);
    return response;
  },

  /**
   * Create new order
   */
  async create(request: CommandeRequest): Promise<ApiResponse<Commande>> {
    const response = await ApiService.post<Commande>('/commandes', request);
    if (response.data) {
      response.data = normalizeCommande(response.data);
    }
    return response;
  },

  /**
   * Update order
   */
  async update(id: string, request: CommandeRequest): Promise<ApiResponse<Commande>> {
    const response = await ApiService.put<Commande>(`/commandes/${id}`, request);
    if (response.data) {
      response.data = normalizeCommande(response.data);
    }
    return response;
  },

  /**
   * Update order status
   */
  async updateStatus(id: string, status: string): Promise<ApiResponse<Commande>> {
    const response = await ApiService.patch<Commande>(`/commandes/${id}/status`, { status });
    if (response.data) {
      response.data = normalizeCommande(response.data);
    }
    return response;
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
    const response = await ApiService.get<CommandeItem[]>(`/commandes/${commandeId}/items`);
    response.data = (response.data ?? []).map((item) => normalizeArticleBackedItem(item) as CommandeItem);
    return response;
  },

  /**
   * Get item by ID
   */
  async getItemById(itemId: string): Promise<ApiResponse<CommandeItem>> {
    const response = await ApiService.get<CommandeItem>(`/commandes/items/${itemId}`);
    if (response.data) {
      response.data = normalizeArticleBackedItem(response.data) as CommandeItem;
    }
    return response;
  },

  /**
   * Get items by movement type
   */
  async getItemsByMovement(typeMouvement: string): Promise<ApiResponse<CommandeItem[]>> {
    const response = await ApiService.get<CommandeItem[]>(`/commandes/items/mouvement/${typeMouvement}`);
    response.data = (response.data ?? []).map((item) => normalizeArticleBackedItem(item) as CommandeItem);
    return response;
  },

  /**
   * Update item status
   */
  async updateItemStatus(itemId: string, status: string): Promise<ApiResponse<CommandeItem>> {
    const response = await ApiService.patch<CommandeItem>(`/commandes/items/${itemId}/status`, { status });
    if (response.data) {
      response.data = normalizeArticleBackedItem(response.data) as CommandeItem;
    }
    return response;
  },

  /**
   * Create item for an order
   */
  async createItem(commandeId: string, request: CommandeItemRequest): Promise<ApiResponse<CommandeItem>> {
    const response = await ApiService.post<CommandeItem>(`/commandes/${commandeId}/items`, request);
    if (response.data) {
      response.data = normalizeArticleBackedItem(response.data) as CommandeItem;
    }
    return response;
  },

  /**
   * Update item
   */
  async updateItem(itemId: string, request: CommandeItemRequest): Promise<ApiResponse<CommandeItem>> {
    const response = await ApiService.put<CommandeItem>(`/commandes/items/${itemId}`, request);
    if (response.data) {
      response.data = normalizeArticleBackedItem(response.data) as CommandeItem;
    }
    return response;
  },

  /**
   * Delete item
   */
  async deleteItem(itemId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/commandes/items/${itemId}`);
  },

  // ==================== OPTIMIZATION ====================

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

  /**
   * Open server-generated print view for optimization layout
   */
  async printOptimization(itemId: string, variant: 'actual' | 'suggested', lang: string): Promise<Blob> {
    return ApiService.getBlob(`/commandes/items/${itemId}/optimization/print`, { variant, lang });
  },

  /**
   * Open server-generated simple print view (SVG-focused, minimal whitespace)
   */
  async printOptimizationSimple(itemId: string, variant: 'actual' | 'suggested', lang: string): Promise<Blob> {
    return ApiService.getBlob(`/commandes/items/${itemId}/optimization/print-simple`, { variant, lang });
  },

  /**
   * Adopt a suggested optimization plan, replacing existing placements
   */

  async adoptOptimization(itemId: string, suggestionId: string): Promise<ApiResponse<void>> {
    return ApiService.post<void>(`/commandes/items/${itemId}/optimization/adopt`, { suggestionId });
  },
};

export default CommandeService;
