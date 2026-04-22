import type { Commande, CommandeItem, CommandeStatus } from '../../types';

export type WorkbenchTagSeverity = 'success' | 'info' | 'secondary' | 'contrast' | 'warning' | 'danger';

export interface WorkbenchItemCounts {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  quantity: number;
}

export interface WorkbenchOrderMetrics {
  counts: WorkbenchItemCounts;
  progress: number;
  nextItem?: CommandeItem;
  primaryMaterial: string;
}

export interface WorkbenchSummaryMetric {
  key: string;
  label: string;
  value: number;
  accentClass: string;
}

export interface WorkbenchStatusOption {
  label: string;
  value: CommandeStatus | '';
}

export interface WorkbenchClientOption {
  label: string;
  value: string;
}

export interface CommandesWorkbenchState {
  commandes: Commande[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  status: CommandeStatus | '';
  setStatus: (value: CommandeStatus | '') => void;
  clientId: string | '';
  setClientId: (value: string | '') => void;
  clientsLoading: boolean;
  statusOptions: WorkbenchStatusOption[];
  clientOptions: WorkbenchClientOption[];
  summaryMetrics: WorkbenchSummaryMetric[];
  highlightedOrder?: Commande;
  selectedOrderId: string;
  setSelectedOrderId: (value: string) => void;
  getOrderMetrics: (order: Commande) => WorkbenchOrderMetrics;
}
