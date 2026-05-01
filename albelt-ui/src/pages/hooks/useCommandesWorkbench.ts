import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { ClientService } from '../../services/clientService';
import { CommandeService } from '../../services/commandeService';
import type { Client, Commande, CommandeStatus, OrderSummaryStats } from '../../types';
import type { CommandesWorkbenchState, WorkbenchClientOption, WorkbenchStatusOption, WorkbenchSummaryMetric } from '../../components/commande/CommandesWorkbench.types';
import { getOrderMetrics } from '../../components/commande/commandesWorkbench.utils';

interface UseCommandesWorkbenchOptions {
  t: TFunction;
}

export function useCommandesWorkbench({ t }: UseCommandesWorkbenchOptions): CommandesWorkbenchState {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CommandeStatus | ''>('');
  const [clientId, setClientId] = useState<string | ''>('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    setClientsLoading(true);
    ClientService.getAllActive()
      .then((res) => setClients(res.data || []))
      .finally(() => setClientsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    CommandeService.getAll({
      search: search || undefined,
      status: status || undefined,
      clientId: clientId || undefined,
    })
      .then((response) => setCommandes(response.data?.items ?? []))
      .finally(() => setLoading(false));
  }, [search, status, clientId]);

  const statusOptions = useMemo<WorkbenchStatusOption[]>(
    () => [
      { label: t('common.all', 'All'), value: '' },
      { label: t('statuses.PENDING', 'Pending'), value: 'PENDING' },
      { label: t('statuses.ENCOURS', 'In Progress'), value: 'ENCOURS' },
      { label: t('statuses.COMPLETED', 'Completed'), value: 'COMPLETED' },
      { label: t('statuses.CANCELLED', 'Cancelled'), value: 'CANCELLED' },
      { label: t('statuses.ON_HOLD', 'On Hold'), value: 'ON_HOLD' },
    ],
    [t]
  );

  const clientOptions = useMemo<WorkbenchClientOption[]>(
    () => [
      { label: t('ordersWorkbench.allClients', 'All clients'), value: '' },
      ...clients.map((client) => ({ label: client.name, value: client.id })),
    ],
    [clients, t]
  );

  const activeOrders = useMemo(
    () => commandes.filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED'),
    [commandes]
  );

  const fallbackOrder = activeOrders[0] ?? commandes[0];
  const highlightedOrder = commandes.find((order) => order.id === selectedOrderId) ?? fallbackOrder;

  useEffect(() => {
    if (!commandes.length) {
      setSelectedOrderId('');
      return;
    }

    const currentOrderStillVisible = commandes.some((order) => order.id === selectedOrderId);
    if (!currentOrderStillVisible) {
      setSelectedOrderId((activeOrders[0] ?? commandes[0]).id);
    }
  }, [activeOrders, commandes, selectedOrderId]);

  const [summaryStats, setSummaryMetrics] = useState<OrderSummaryStats | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await CommandeService.getSummaryStats();
        setSummaryMetrics(res.data);
      } catch (err) {
        console.error('Failed to fetch summary stats', err);
      }
    };

    fetchSummary();
  }, []);

  const summaryMetrics = useMemo<WorkbenchSummaryMetric[]>(() => {
    if (!summaryStats) return [];

    return [
      {
        key: 'active-orders',
        label: t('ordersWorkbench.activeOrders', 'Active orders'),
        value: summaryStats.activeOrders,
        accentClass: 'orders-workbench__summary-card--accent',
      },
      {
        key: 'items-waiting',
        label: t('ordersWorkbench.itemsWaiting', 'Items waiting'),
        value: summaryStats.waitingItems,
        accentClass: 'orders-workbench__summary-card--amber',
      },
      {
        key: 'cutting-now',
        label: t('ordersWorkbench.cuttingNow', 'Cutting now'),
        value: summaryStats.cuttingItems,
        accentClass: 'orders-workbench__summary-card--cool',
      },
      {
        key: 'items-done',
        label: t('ordersWorkbench.itemsDone', 'Items done'),
        value: summaryStats.completedItems,
        accentClass: 'orders-workbench__summary-card--ink',
      },
    ];
  }, [summaryStats, t]);

  return {
    commandes,
    loading,
    search,
    setSearch,
    status,
    setStatus,
    clientId,
    setClientId,
    clientsLoading,
    statusOptions,
    clientOptions,
    summaryMetrics,
    highlightedOrder,
    selectedOrderId,
    setSelectedOrderId,
    getOrderMetrics: (order) => getOrderMetrics(order.items),
  };
}
