import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { ClientService } from '../../services/clientService';
import { CommandeService } from '../../services/commandeService';
import type { Client, Commande, CommandeStatus } from '../../types';
import type { CommandesWorkbenchState, WorkbenchClientOption, WorkbenchStatusOption, WorkbenchSummaryMetric } from '../../components/commande/CommandesWorkbench.types';
import { getItemCounts, getOrderMetrics } from '../../components/commande/commandesWorkbench.utils';

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
      { label: t('orders.status.all', 'All'), value: '' },
      { label: t('orders.status.PENDING', 'Pending'), value: 'PENDING' },
      { label: t('orders.status.ENCOURS', 'In Progress'), value: 'ENCOURS' },
      { label: t('orders.status.COMPLETED', 'Completed'), value: 'COMPLETED' },
      { label: t('orders.status.CANCELLED', 'Cancelled'), value: 'CANCELLED' },
      { label: t('orders.status.ON_HOLD', 'On Hold'), value: 'ON_HOLD' },
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

  const summaryMetrics = useMemo<WorkbenchSummaryMetric[]>(() => {
    const waitingItems = commandes.reduce((sum, order) => sum + getItemCounts(order.items).pending, 0);
    const cuttingItems = commandes.reduce((sum, order) => sum + getItemCounts(order.items).inProgress, 0);
    const doneItems = commandes.reduce((sum, order) => sum + getItemCounts(order.items).completed, 0);

    return [
      {
        key: 'active-orders',
        label: t('ordersWorkbench.activeOrders', 'Active orders'),
        value: activeOrders.length,
        accentClass: 'orders-workbench__summary-card--accent',
      },
      {
        key: 'items-waiting',
        label: t('ordersWorkbench.itemsWaiting', 'Items waiting'),
        value: waitingItems,
        accentClass: 'orders-workbench__summary-card--amber',
      },
      {
        key: 'cutting-now',
        label: t('ordersWorkbench.cuttingNow', 'Cutting now'),
        value: cuttingItems,
        accentClass: 'orders-workbench__summary-card--cool',
      },
      {
        key: 'items-done',
        label: t('ordersWorkbench.itemsDone', 'Items done'),
        value: doneItems,
        accentClass: 'orders-workbench__summary-card--ink',
      },
    ];
  }, [activeOrders.length, commandes, t]);

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
