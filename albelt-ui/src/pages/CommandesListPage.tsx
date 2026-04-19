import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ClientService } from '../services/clientService';
import { CommandeService } from '../services/commandeService';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import { formatDate, formatDateTime } from '../utils/date';
import { useI18n } from '@hooks/useI18n';
import type {
  Client,
  Commande,
  CommandeItem,
  CommandeStatus,
  OptimizationComparison,
  OptimizationMetrics,
  OptimizationSourceReport,
  Roll,
  WastePiece,
} from '../types';
import './CommandesListPage.css';

type QueueFilter = 'ACTIONABLE' | 'ALL' | 'COMPLETED' | 'ON_HOLD';
type Severity = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

type SourceCandidate = {
  id: string;
  kind: 'ROLL' | 'WASTE_PIECE';
  title: string;
  badge: string;
  reason: string;
  reference: string;
  dimensions: string;
  availableAreaM2: number;
  availableWidthMm: number;
  availableLengthM: number;
  accentColor: string;
  statusLabel: string;
  fitsItem: boolean;
  timestampLabel?: string;
};

const DEFAULT_SOURCE_COLOR = '#d6d3d1';
const OPTIMIZATION_SOURCE_COLORS = ['#1f8a70', '#c53a2f', '#d07f2c', '#2563eb'];

const queueFilterLabels: Record<QueueFilter, string> = {
  ACTIONABLE: 'Needs action',
  ALL: 'All orders',
  COMPLETED: 'Completed',
  ON_HOLD: 'On hold',
};

const orderStatusLabels: Record<CommandeStatus, string> = {
  PENDING: 'Waiting',
  ENCOURS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On hold',
};

const orderStatusSeverities: Record<CommandeStatus, Severity> = {
  PENDING: 'warning',
  ENCOURS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ON_HOLD: 'secondary',
};

const itemStatusLabels: Record<CommandeItem['status'], string> = {
  PENDING: 'Waiting',
  IN_PROGRESS: 'Cutting',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
};

const itemStatusSeverities: Record<CommandeItem['status'], Severity> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const fitStatusLabels: Record<'true' | 'false', string> = {
  true: 'Fits item',
  false: 'Check size',
};

const formatSquareMeters = (value?: number | null, digits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return `${value.toFixed(digits)} m²`;
};

const formatMeters = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return `${value.toFixed(2)} m`;
};

const formatMillimeters = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return `${Math.round(value)} mm`;
};

const getProducedQuantity = (item: CommandeItem) =>
  (item.totalItemsConforme ?? 0) + (item.totalItemsNonConforme ?? 0);

const getRequiredArea = (item: CommandeItem) => {
  if (typeof item.surfaceConsommeeM2 === 'number' && item.surfaceConsommeeM2 > 0) {
    return item.surfaceConsommeeM2;
  }

  return (item.largeurMm / 1000) * item.longueurM * Math.max(item.quantite, 1);
};

const getItemCompletionPct = (item: CommandeItem) => {
  if (item.quantite <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (getProducedQuantity(item) / item.quantite) * 100));
};

const getOrderItemCounts = (order: Commande) => {
  const counts = {
    waiting: 0,
    cutting: 0,
    done: 0,
    blocked: 0,
  };

  for (const item of order.items ?? []) {
    if (item.status === 'PENDING') counts.waiting += 1;
    if (item.status === 'IN_PROGRESS') counts.cutting += 1;
    if (item.status === 'COMPLETED') counts.done += 1;
    if (item.status === 'CANCELLED') counts.blocked += 1;
  }

  return counts;
};

const getOrderCompletionPct = (order: Commande) => {
  const totalItems = order.items?.length ?? 0;
  if (totalItems === 0) {
    return 0;
  }

  const completed = order.items.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((completed / totalItems) * 100);
};

const getPreferredItem = (order: Commande | null) => {
  if (!order || order.items.length === 0) {
    return null;
  }

  return (
    order.items.find((item) => item.status === 'IN_PROGRESS')
    ?? order.items.find((item) => item.status === 'PENDING')
    ?? order.items.find((item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED')
    ?? order.items[0]
  );
};

const getNextActionableItem = (order: Commande | null, currentItemId: string | null) => {
  if (!order) {
    return null;
  }

  const actionableItems = order.items.filter(
    (item) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED'
  );

  if (actionableItems.length === 0) {
    return null;
  }

  if (!currentItemId) {
    return actionableItems[0];
  }

  const currentIndex = actionableItems.findIndex((item) => item.id === currentItemId);
  if (currentIndex === -1 || currentIndex === actionableItems.length - 1) {
    return actionableItems[0];
  }

  return actionableItems[currentIndex + 1];
};

const getRollAvailableArea = (roll: Roll) =>
  roll.availableAreaM2
  ?? roll.areaM2
  ?? ((roll.widthRemainingMm ?? roll.widthMm) / 1000) * (roll.lengthRemainingM ?? roll.lengthM);

const getWasteAvailableArea = (wastePiece: WastePiece) =>
  wastePiece.availableAreaM2
  ?? wastePiece.areaM2
  ?? ((wastePiece.widthRemainingMm ?? wastePiece.widthMm) / 1000) * (wastePiece.lengthRemainingM ?? wastePiece.lengthM);

const getSourceDimensions = (
  widthMm?: number | null,
  lengthM?: number | null
) => `${formatMeters(lengthM)} x ${formatMillimeters(widthMm)}`;

const mapOptimizationSource = (
  source: OptimizationSourceReport,
  index: number
): SourceCandidate => {
  const availableAreaM2 = typeof source.widthMm === 'number' && typeof source.lengthM === 'number'
    ? (source.widthMm / 1000) * source.lengthM
    : 0;

  return {
    id: source.sourceId || `${source.sourceType}-${index}`,
    kind: source.sourceType,
    title: source.label === 'CHUTE' ? 'Reusable leftover' : 'Roll',
    badge: index === 0 ? 'Recommended' : 'Also used',
    reason: index === 0
      ? 'This source starts the saved best-cut plan.'
      : 'The saved best-cut plan uses this source as well.',
    reference: source.reference || 'No reference',
    dimensions: getSourceDimensions(source.widthMm, source.lengthM),
    availableAreaM2,
    availableWidthMm: source.widthMm ?? 0,
    availableLengthM: source.lengthM ?? 0,
    accentColor: source.colorHexCode || OPTIMIZATION_SOURCE_COLORS[index % OPTIMIZATION_SOURCE_COLORS.length],
    statusLabel: source.label === 'CHUTE' ? 'Reusable leftover' : 'Roll',
    fitsItem: true,
  };
};

const buildWasteCandidate = (wastePiece: WastePiece, requiredAreaM2: number, index: number): SourceCandidate => {
  const availableAreaM2 = getWasteAvailableArea(wastePiece);
  const availableWidthMm = wastePiece.widthRemainingMm ?? wastePiece.widthMm;
  const availableLengthM = wastePiece.lengthRemainingM ?? wastePiece.lengthM;
  const fitsItem = availableAreaM2 >= requiredAreaM2;

  return {
    id: wastePiece.id,
    kind: 'WASTE_PIECE',
    title: 'Reusable leftover',
    badge: index === 0 && fitsItem ? 'Use first' : 'Available',
    reason: fitsItem
      ? 'Fits the item and helps reduce new roll usage.'
      : 'Visible for review, but may need a roll instead.',
    reference: wastePiece.reference || 'No reference',
    dimensions: getSourceDimensions(availableWidthMm, availableLengthM),
    availableAreaM2,
    availableWidthMm,
    availableLengthM,
    accentColor: wastePiece.colorHexCode || '#1f8a70',
    statusLabel: wastePiece.wasteType === 'CHUTE_EXPLOITABLE' ? 'Reusable leftover' : 'Scrap check',
    fitsItem,
    timestampLabel: wastePiece.createdAt,
  };
};

const buildRollCandidate = (roll: Roll, requiredAreaM2: number, index: number): SourceCandidate => {
  const availableAreaM2 = getRollAvailableArea(roll);
  const availableWidthMm = roll.widthRemainingMm ?? roll.widthMm;
  const availableLengthM = roll.lengthRemainingM ?? roll.lengthM;
  const fitsItem = availableAreaM2 >= requiredAreaM2;

  return {
    id: roll.id,
    kind: 'ROLL',
    title: 'Roll',
    badge: index === 0 && fitsItem ? 'Oldest fit' : 'Available',
    reason: index === 0 && fitsItem
      ? 'Oldest matching roll with enough area.'
      : fitsItem
        ? 'Matching backup roll.'
        : 'Visible for review, but may not cover the full item.',
    reference: roll.reference || 'No reference',
    dimensions: getSourceDimensions(availableWidthMm, availableLengthM),
    availableAreaM2,
    availableWidthMm,
    availableLengthM,
    accentColor: roll.colorHexCode || '#c53a2f',
    statusLabel: roll.status,
    fitsItem,
    timestampLabel: roll.receivedDate,
  };
};

const getPrimaryRecommendation = (
  suggestedSources: SourceCandidate[],
  wasteCandidates: SourceCandidate[],
  rollCandidates: SourceCandidate[]
) => {
  if (suggestedSources.length > 0) {
    return suggestedSources[0];
  }

  const bestWaste = wasteCandidates.find((candidate) => candidate.fitsItem);
  if (bestWaste) {
    return bestWaste;
  }

  const bestRoll = rollCandidates.find((candidate) => candidate.fitsItem);
  if (bestRoll) {
    return bestRoll;
  }

  return wasteCandidates[0] ?? rollCandidates[0] ?? null;
};

const getUsageSegments = (metrics: OptimizationMetrics | null, sourceTotalAreaM2: number) => {
  const usedAreaM2 = metrics?.usedAreaM2 ?? 0;
  const wasteAreaM2 = metrics?.wasteAreaM2 ?? 0;
  const totalArea = Math.max(sourceTotalAreaM2, usedAreaM2 + wasteAreaM2, 0.01);
  const remainingAreaM2 = Math.max(totalArea - usedAreaM2 - wasteAreaM2, 0);

  return {
    usedAreaM2,
    wasteAreaM2,
    remainingAreaM2,
    usedPct: (usedAreaM2 / totalArea) * 100,
    wastePct: (wasteAreaM2 / totalArea) * 100,
    remainingPct: (remainingAreaM2 / totalArea) * 100,
  };
};

export function CommandesListPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);
  const orderRequestRef = useRef(0);
  const workspaceRequestRef = useRef(0);

  const [clients, setClients] = useState<Client[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Commande | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ACTIONABLE');
  const [selectedClient, setSelectedClient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingSelectedOrder, setLoadingSelectedOrder] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [refreshingSuggestion, setRefreshingSuggestion] = useState(false);
  const [itemStatusLoadingId, setItemStatusLoadingId] = useState<string | null>(null);
  const [optimizationComparison, setOptimizationComparison] = useState<OptimizationComparison | null>(null);
  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [availableWaste, setAvailableWaste] = useState<WastePiece[]>([]);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const visibleCommandes = commandes.filter((order) => {
    if (queueFilter === 'ACTIONABLE') {
      return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    }

    if (queueFilter === 'COMPLETED') {
      return order.status === 'COMPLETED';
    }

    if (queueFilter === 'ON_HOLD') {
      return order.status === 'ON_HOLD';
    }

    return true;
  });

  const selectedOrderFromQueue = visibleCommandes.find((order) => order.id === selectedOrderId) ?? null;
  const activeOrder = selectedOrder ?? selectedOrderFromQueue;
  const selectedItem = activeOrder?.items.find((item) => item.id === selectedItemId)
    ?? getPreferredItem(activeOrder);
  const selectedOrderCounts = activeOrder ? getOrderItemCounts(activeOrder) : null;
  const requiredAreaM2 = selectedItem ? getRequiredArea(selectedItem) : 0;

  const suggestedSources = (optimizationComparison?.suggested?.sources ?? []).map(mapOptimizationSource);
  const optimizationMetrics = optimizationComparison?.suggested?.metrics ?? optimizationComparison?.actualMetrics ?? null;
  const suggestedSourceAreaM2 = suggestedSources.reduce((total, source) => total + source.availableAreaM2, 0);
  const usageSegments = getUsageSegments(optimizationMetrics, suggestedSourceAreaM2);

  const wasteCandidates = [...availableWaste]
    .map((wastePiece, index) => buildWasteCandidate(wastePiece, requiredAreaM2, index))
    .sort((left, right) => {
      if (left.fitsItem !== right.fitsItem) {
        return left.fitsItem ? -1 : 1;
      }

      return left.availableAreaM2 - right.availableAreaM2;
    });

  const rollCandidates = [...availableRolls]
    .map((roll, index) => buildRollCandidate(roll, requiredAreaM2, index))
    .sort((left, right) => {
      if (left.fitsItem !== right.fitsItem) {
        return left.fitsItem ? -1 : 1;
      }

      return String(left.timestampLabel || '').localeCompare(String(right.timestampLabel || ''));
    });

  const primaryRecommendation = getPrimaryRecommendation(suggestedSources, wasteCandidates, rollCandidates);
  const nextActionableItem = getNextActionableItem(activeOrder, selectedItem?.id ?? null);
  const previewSvg = optimizationComparison?.suggested?.svg ?? optimizationComparison?.actualSvg ?? null;
  const producedPieces = selectedItem ? getProducedQuantity(selectedItem) : 0;
  const remainingPieces = selectedItem ? Math.max(0, selectedItem.quantite - producedPieces) : 0;
  const completionPct = selectedItem ? getItemCompletionPct(selectedItem) : 0;

  const summaryStats = {
    activeOrders: commandes.filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED').length,
    waitingItems: commandes.reduce((total, order) => total + getOrderItemCounts(order).waiting, 0),
    cuttingItems: commandes.reduce((total, order) => total + getOrderItemCounts(order).cutting, 0),
    completedItems: commandes.reduce((total, order) => total + getOrderItemCounts(order).done, 0),
  };

  function showToast(severity: 'success' | 'error' | 'warn', detail: string) {
    toastRef.current?.show({
      severity,
      summary: severity === 'success' ? t('common.success') : severity === 'warn' ? t('common.warning') : t('common.error'),
      detail,
      life: 2600,
    });
  }

  async function loadClients() {
    try {
      const response = await ClientService.getAll({ page: 0, size: 200 });
      const clientItems = Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? [];
      setClients(clientItems);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async function loadOrders(preferredOrderId?: string | null) {
    try {
      setLoadingOrders(true);
      const statusParam = queueFilter === 'COMPLETED' || queueFilter === 'ON_HOLD'
        ? queueFilter
        : undefined;

      const response = await CommandeService.getAll({
        page: 0,
        size: 60,
        search: deferredSearchQuery.trim() || undefined,
        clientId: selectedClient || undefined,
        status: statusParam,
      });

      const orderItems = response.data?.items ?? [];
      setCommandes(orderItems);

      const nextSelectedOrderId = preferredOrderId && orderItems.some((order) => order.id === preferredOrderId)
        ? preferredOrderId
        : orderItems[0]?.id ?? null;

      setSelectedOrderId(nextSelectedOrderId);
      if (!nextSelectedOrderId) {
        setSelectedOrder(null);
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('error', 'Unable to load orders.');
      setCommandes([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setSelectedItemId(null);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadSelectedOrder(orderId: string, preferredItemId?: string | null) {
    const requestId = orderRequestRef.current + 1;
    orderRequestRef.current = requestId;

    try {
      setLoadingSelectedOrder(true);
      const response = await CommandeService.getById(orderId);
      if (orderRequestRef.current !== requestId) {
        return;
      }

      const order = response.data;
      if (!order) {
        setSelectedOrder(null);
        setSelectedItemId(null);
        return;
      }

      setSelectedOrder(order);

      const nextItem = preferredItemId && order.items.some((item) => item.id === preferredItemId)
        ? order.items.find((item) => item.id === preferredItemId) ?? null
        : getPreferredItem(order);

      setSelectedItemId(nextItem?.id ?? null);
    } catch (error) {
      console.error('Error loading selected order:', error);
      if (orderRequestRef.current === requestId) {
        showToast('error', 'Unable to load the selected order.');
        setSelectedOrder(null);
        setSelectedItemId(null);
      }
    } finally {
      if (orderRequestRef.current === requestId) {
        setLoadingSelectedOrder(false);
      }
    }
  }

  async function loadWorkspace(item: CommandeItem, forceRegenerate = false) {
    const requestId = workspaceRequestRef.current + 1;
    workspaceRequestRef.current = requestId;

    try {
      setWorkspaceError(null);
      if (forceRegenerate) {
        setRefreshingSuggestion(true);
      } else {
        setLoadingWorkspace(true);
      }

      const [optimizationResponse, rollsResponse, wasteResponse] = await Promise.all([
        forceRegenerate
          ? CommandeService.regenerateOptimization(item.id)
          : CommandeService.getOptimizationComparison(item.id),
        RollService.getAvailableByMaterial(item.materialType),
        WastePieceService.getAvailableByMaterial(item.materialType, 0, 30),
      ]);

      if (workspaceRequestRef.current !== requestId) {
        return;
      }

      setOptimizationComparison(optimizationResponse.data ?? null);
      setAvailableRolls(rollsResponse.data ?? []);
      setAvailableWaste(wasteResponse.data ?? []);
    } catch (error) {
      console.error('Error loading workspace:', error);
      if (workspaceRequestRef.current === requestId) {
        setWorkspaceError('Unable to load material suggestions for this item.');
        setOptimizationComparison(null);
        setAvailableRolls([]);
        setAvailableWaste([]);
      }
    } finally {
      if (workspaceRequestRef.current === requestId) {
        setLoadingWorkspace(false);
        setRefreshingSuggestion(false);
      }
    }
  }

  async function handleItemStatusChange(item: CommandeItem, nextStatus: CommandeItem['status']) {
    if (!activeOrder || itemStatusLoadingId) {
      return;
    }

    try {
      setItemStatusLoadingId(item.id);
      await CommandeService.updateItemStatus(item.id, nextStatus);
      showToast('success', `Line ${item.lineNumber} marked ${itemStatusLabels[nextStatus].toLowerCase()}.`);

      await Promise.all([
        loadOrders(activeOrder.id),
        loadSelectedOrder(activeOrder.id, item.id),
      ]);

      if (nextStatus === 'COMPLETED') {
        const refreshedOrder = await CommandeService.getById(activeOrder.id);
        const nextItem = getNextActionableItem(refreshedOrder.data ?? null, item.id);
        setSelectedOrder(refreshedOrder.data ?? null);
        setSelectedItemId(nextItem?.id ?? item.id);
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      showToast('error', 'Unable to update the item status.');
    } finally {
      setItemStatusLoadingId(null);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  useEffect(() => {
    void loadOrders(selectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearchQuery, selectedClient, queueFilter]);

  useEffect(() => {
    if (visibleCommandes.length === 0) {
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setSelectedItemId(null);
      return;
    }

    if (!selectedOrderId || !visibleCommandes.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(visibleCommandes[0].id);
    }
  }, [visibleCommandes, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      setSelectedItemId(null);
      return;
    }

    void loadSelectedOrder(selectedOrderId, selectedItemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId]);

  useEffect(() => {
    if (!selectedItem) {
      setOptimizationComparison(null);
      setAvailableRolls([]);
      setAvailableWaste([]);
      setWorkspaceError(null);
      return;
    }

    void loadWorkspace(selectedItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  const clientOptions = [
    { label: 'All clients', value: '' },
    ...clients.map((client) => ({ label: client.name, value: client.id })),
  ];

  const renderSummaryCard = (label: string, value: number, tone: 'accent' | 'cool' | 'amber' | 'ink') => (
    <div className={`orders-workbench__summary-card orders-workbench__summary-card--${tone}`}>
      <span className="orders-workbench__summary-label">{label}</span>
      <strong className="orders-workbench__summary-value">{value}</strong>
    </div>
  );

  return (
    <div className="page-container orders-workbench">
      <Toast ref={toastRef} />

      <div className="orders-workbench__hero">
        <div className="orders-workbench__hero-copy">
          <span className="orders-workbench__eyebrow">Operator workbench</span>
          <h1>Manage Orders</h1>
          <p>Choose an order, work the next item, and check the best material source without bouncing across tabs.</p>
        </div>

        <div className="orders-workbench__hero-actions">
          <Button
            icon="pi pi-plus"
            label="New order"
            severity="success"
            onClick={() => navigate('/commandes/create')}
          />
          <Button
            icon="pi pi-external-link"
            label="Open full order"
            severity="secondary"
            outlined
            disabled={!activeOrder}
            onClick={() => activeOrder && navigate(`/commandes/${activeOrder.id}`)}
          />
        </div>
      </div>

      <div className="orders-workbench__summary-grid">
        {renderSummaryCard('Active orders', summaryStats.activeOrders, 'accent')}
        {renderSummaryCard('Items waiting', summaryStats.waitingItems, 'amber')}
        {renderSummaryCard('Cutting now', summaryStats.cuttingItems, 'cool')}
        {renderSummaryCard('Items done', summaryStats.completedItems, 'ink')}
      </div>

      <Card className="orders-workbench__filters-card">
        <div className="orders-workbench__filters">
          <span className="p-input-icon-left orders-workbench__search">
            <i className="pi pi-search" />
            <InputText
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search order number or client"
            />
          </span>

          <Dropdown
            value={selectedClient}
            options={clientOptions}
            onChange={(event) => setSelectedClient(event.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="All clients"
            className="orders-workbench__client-filter"
          />

          <div className="orders-workbench__filter-pills">
            {(Object.keys(queueFilterLabels) as QueueFilter[]).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                className={`orders-workbench__filter-pill${queueFilter === filterKey ? ' is-active' : ''}`}
                onClick={() => setQueueFilter(filterKey)}
              >
                {queueFilterLabels[filterKey]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="orders-workbench__layout">
        <section className="orders-workbench__panel">
          <div className="orders-workbench__panel-header">
            <div>
              <h2>Orders queue</h2>
              <p>{loadingOrders ? 'Loading orders...' : `${visibleCommandes.length} orders on screen`}</p>
            </div>
          </div>

          <div className="orders-workbench__panel-body">
            {loadingOrders ? (
              <div className="orders-workbench__loading-state">
                <ProgressSpinner style={{ width: '42px', height: '42px' }} />
              </div>
            ) : visibleCommandes.length === 0 ? (
              <Message severity="info" text="No orders match the current filters." />
            ) : (
              <div className="orders-workbench__stack orders-workbench__stack--scroll">
                {visibleCommandes.map((order) => {
                  const itemCounts = getOrderItemCounts(order);
                  const completionPct = getOrderCompletionPct(order);
                  const isSelected = order.id === activeOrder?.id;

                  return (
                    <button
                      key={order.id}
                      type="button"
                      className={`orders-workbench__order-card${isSelected ? ' is-selected' : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="orders-workbench__card-topline">
                        <strong>{order.numeroCommande}</strong>
                        <Tag value={orderStatusLabels[order.status]} severity={orderStatusSeverities[order.status]} />
                      </div>

                      <div className="orders-workbench__card-subline">
                        <span>{order.clientName}</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="orders-workbench__mini-metrics">
                        <span>{itemCounts.waiting} waiting</span>
                        <span>{itemCounts.cutting} cutting</span>
                        <span>{itemCounts.done} done</span>
                      </div>

                      <div className="orders-workbench__progress-track">
                        <div
                          className="orders-workbench__progress-fill"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>

                      <div className="orders-workbench__card-subline">
                        <span>{completionPct}% complete</span>
                        <span>{order.altierLibelle || 'Workshop not set'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* <section className="orders-workbench__panel">
          <div className="orders-workbench__panel-header">
            <div>
              <h2>Items in order</h2>
              <p>
                {activeOrder
                  ? `${activeOrder.items.length} items in ${activeOrder.numeroCommande}`
                  : 'Select an order to see its items'}
              </p>
            </div>
          </div>

          <div className="orders-workbench__panel-body">
            {loadingSelectedOrder ? (
              <div className="orders-workbench__loading-state">
                <ProgressSpinner style={{ width: '42px', height: '42px' }} />
              </div>
            ) : !activeOrder ? (
              <Message severity="info" text="Choose an order from the queue to start." />
            ) : (
              <>
                <div className="orders-workbench__selected-order">
                  <div className="orders-workbench__card-topline">
                    <div>
                      <strong>{activeOrder.numeroCommande}</strong>
                      <div className="orders-workbench__card-subline">
                        <span>{activeOrder.clientName}</span>
                        <span>{activeOrder.altierLibelle || 'Workshop not set'}</span>
                      </div>
                    </div>
                    <Tag value={orderStatusLabels[activeOrder.status]} severity={orderStatusSeverities[activeOrder.status]} />
                  </div>

                  <div className="orders-workbench__mini-metrics">
                    <span>{selectedOrderCounts?.waiting ?? 0} waiting</span>
                    <span>{selectedOrderCounts?.cutting ?? 0} cutting</span>
                    <span>{selectedOrderCounts?.done ?? 0} done</span>
                    <span>{selectedOrderCounts?.blocked ?? 0} cancelled</span>
                  </div>

                  <div className="orders-workbench__progress-track">
                    <div
                      className="orders-workbench__progress-fill"
                      style={{ width: `${getOrderCompletionPct(activeOrder)}%` }}
                    />
                  </div>

                  <div className="orders-workbench__card-subline">
                    <span>Created {formatDateTime(activeOrder.createdAt)}</span>
                    <span>{getOrderCompletionPct(activeOrder)}% complete</span>
                  </div>

                  {(activeOrder.description || activeOrder.notes) && (
                    <div className="orders-workbench__note">
                      {activeOrder.description || activeOrder.notes}
                    </div>
                  )}
                </div>

                <div className="orders-workbench__stack orders-workbench__stack--scroll">
                  {activeOrder.items.map((item) => {
                    const producedQuantity = getProducedQuantity(item);
                    const completionPct = getItemCompletionPct(item);
                    const isSelected = item.id === selectedItem?.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`orders-workbench__item-card${isSelected ? ' is-selected' : ''}`}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <div className="orders-workbench__card-topline">
                          <strong>
                            Line {item.lineNumber}
                            {item.reference ? ` · ${item.reference}` : ''}
                          </strong>
                          <Tag value={itemStatusLabels[item.status]} severity={itemStatusSeverities[item.status]} />
                        </div>

                        <div className="orders-workbench__item-specs">
                          <span>{item.materialType}</span>
                          <span>{item.nbPlis} plies</span>
                          <span>{item.thicknessMm} mm</span>
                          <span>{item.longueurM.toFixed(2)} m x {item.largeurMm} mm</span>
                        </div>

                        <div className="orders-workbench__mini-metrics">
                          <span>{item.quantite} pcs needed</span>
                          <span>{producedQuantity} produced</span>
                          <span>{formatSquareMeters(getRequiredArea(item))}</span>
                        </div>

                        <div className="orders-workbench__progress-track">
                          <div
                            className="orders-workbench__progress-fill"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>

                        <div className="orders-workbench__card-subline">
                          <span>{completionPct.toFixed(0)}% complete</span>
                          <span>{item.colorName || 'No color set'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section> */}

        <section className="orders-workbench__panel orders-workbench__panel--workspace">
          <div className="orders-workbench__panel-header">
            <div>
              <h2>Cut workspace</h2>
              <p>
                {selectedItem
                  ? `Line ${selectedItem.lineNumber} material decision`
                  : 'Pick an item to inspect material usage'}
              </p>
            </div>

            <div className="orders-workbench__workspace-actions">
              <Button
                icon="pi pi-refresh"
                label="Refresh best cut"
                text
                disabled={!selectedItem}
                loading={refreshingSuggestion}
                onClick={() => selectedItem && loadWorkspace(selectedItem, true)}
              />
              <Button
                icon="pi pi-external-link"
                label="Advanced view"
                text
                disabled={!activeOrder}
                onClick={() => activeOrder && navigate(`/commandes/${activeOrder.id}`)}
              />
            </div>
          </div>

          <div className="orders-workbench__panel-body orders-workbench__panel-body--workspace">
            {loadingSelectedOrder ? (
              <div className="orders-workbench__loading-state">
                <ProgressSpinner style={{ width: '42px', height: '42px' }} />
              </div>
            ) : !activeOrder ? (
              <Message severity="info" text="Choose an order from the queue to start." />
            ) : !selectedItem ? (
              <Message severity="info" text="Choose an item to see the recommended source, usage, and next action." />
            ) : (
              <>
                <div className="orders-workbench__selected-order">
                  <div className="orders-workbench__card-topline">
                    <div>
                      <strong>{activeOrder.numeroCommande}</strong>
                      <div className="orders-workbench__card-subline">
                        <span>{activeOrder.clientName}</span>
                        <span>{activeOrder.altierLibelle || 'Workshop not set'}</span>
                      </div>
                    </div>
                    <Tag value={orderStatusLabels[activeOrder.status]} severity={orderStatusSeverities[activeOrder.status]} />
                  </div>

                  <div className="orders-workbench__mini-metrics">
                    <span>{selectedOrderCounts?.waiting ?? 0} waiting</span>
                    <span>{selectedOrderCounts?.cutting ?? 0} cutting</span>
                    <span>{selectedOrderCounts?.done ?? 0} done</span>
                    <span>{selectedOrderCounts?.blocked ?? 0} cancelled</span>
                  </div>

                  <div className="orders-workbench__progress-track">
                    <div
                      className="orders-workbench__progress-fill"
                      style={{ width: `${getOrderCompletionPct(activeOrder)}%` }}
                    />
                  </div>

                  <div className="orders-workbench__card-subline">
                    <span>Created {formatDateTime(activeOrder.createdAt)}</span>
                    <span>{getOrderCompletionPct(activeOrder)}% complete</span>
                  </div>

                  {(activeOrder.description || activeOrder.notes) && (
                    <div className="orders-workbench__note">
                      {activeOrder.description || activeOrder.notes}
                    </div>
                  )}
                </div>

                <div className="orders-workbench__workspace-items">
                  <div className="orders-workbench__workspace-items-header">
                    <div>
                      <h3>Items in this order</h3>
                      <p>Choose the next line without leaving the cut workspace.</p>
                    </div>
                  </div>

                  <div className="orders-workbench__workspace-item-strip">
                    {activeOrder.items.map((item) => {
                      const producedQuantity = getProducedQuantity(item);
                      const itemCompletionPct = getItemCompletionPct(item);
                      const isSelected = item.id === selectedItem?.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`orders-workbench__item-card orders-workbench__item-card--compact${isSelected ? ' is-selected' : ''}`}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <div className="orders-workbench__card-topline">
                            <strong>
                              Line {item.lineNumber}
                              {item.reference ? ` Â· ${item.reference}` : ''}
                            </strong>
                            <Tag value={itemStatusLabels[item.status]} severity={itemStatusSeverities[item.status]} />
                          </div>

                          <div className="orders-workbench__item-specs">
                            <span>{item.materialType}</span>
                            <span>{item.longueurM.toFixed(2)} m x {item.largeurMm} mm</span>
                          </div>

                          <div className="orders-workbench__mini-metrics">
                            <span>{item.quantite} pcs needed</span>
                            <span>{producedQuantity} produced</span>
                          </div>

                          <div className="orders-workbench__progress-track">
                            <div
                              className="orders-workbench__progress-fill"
                              style={{ width: `${itemCompletionPct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="orders-workbench__workspace-rail">
                  <div className="orders-workbench__workspace-step">
                    <span className="orders-workbench__workspace-step-index">1</span>
                    <div>
                      <span className="orders-workbench__workspace-step-label">What to cut</span>
                      <strong>{remainingPieces} pieces left</strong>
                    </div>
                  </div>
                  <div className="orders-workbench__workspace-step">
                    <span className="orders-workbench__workspace-step-index">2</span>
                    <div>
                      <span className="orders-workbench__workspace-step-label">Use this source</span>
                      <strong>{primaryRecommendation ? primaryRecommendation.reference : 'No source yet'}</strong>
                    </div>
                  </div>
                  <div className="orders-workbench__workspace-step">
                    <span className="orders-workbench__workspace-step-index">3</span>
                    <div>
                      <span className="orders-workbench__workspace-step-label">Expected result</span>
                      <strong>
                        {optimizationMetrics
                          ? `${optimizationMetrics.utilizationPct.toFixed(1)}% use`
                          : 'Awaiting cut plan'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="orders-workbench__workspace-grid">
                  <div className="orders-workbench__workspace-card orders-workbench__workspace-card--item">
                    <span className="orders-workbench__eyebrow">1. What to cut</span>
                    <div className="orders-workbench__workspace-heading">
                      <strong>
                        Line {selectedItem.lineNumber}
                        {selectedItem.reference ? ` · ${selectedItem.reference}` : ''}
                      </strong>
                      <Tag value={itemStatusLabels[selectedItem.status]} severity={itemStatusSeverities[selectedItem.status]} />
                    </div>

                    <div className="orders-workbench__detail-grid">
                      <div>
                        <span className="orders-workbench__detail-label">Needed</span>
                        <strong>{selectedItem.quantite} pcs</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Produced</span>
                        <strong>{producedPieces} pcs</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Still to cut</span>
                        <strong>{remainingPieces} pcs</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Piece size</span>
                        <strong>{selectedItem.longueurM.toFixed(2)} m x {selectedItem.largeurMm} mm</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Material need</span>
                        <strong>{formatSquareMeters(requiredAreaM2)}</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Material</span>
                        <strong>{selectedItem.materialType}</strong>
                      </div>
                      <div>
                        <span className="orders-workbench__detail-label">Build</span>
                        <strong>{selectedItem.nbPlis} plies · {selectedItem.thicknessMm} mm</strong>
                      </div>
                    </div>

                    <div className="orders-workbench__progress-track">
                      <div
                        className="orders-workbench__progress-fill"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="orders-workbench__card-subline">
                      <span>{completionPct.toFixed(0)}% complete</span>
                      <span>{selectedItem.materialType} • {selectedItem.colorName || 'No color set'}</span>
                    </div>
                  </div>

                  <div className="orders-workbench__workspace-card orders-workbench__workspace-card--highlight orders-workbench__workspace-card--source">
                    <span className="orders-workbench__eyebrow">2. Recommended source</span>
                    {loadingWorkspace && !refreshingSuggestion ? (
                      <div className="orders-workbench__loading-state">
                        <ProgressSpinner style={{ width: '42px', height: '42px' }} />
                      </div>
                    ) : primaryRecommendation ? (
                      <>
                        <div className="orders-workbench__workspace-heading">
                          <div className="orders-workbench__source-title">
                            <span
                              className="orders-workbench__swatch"
                              style={{ backgroundColor: primaryRecommendation.accentColor || DEFAULT_SOURCE_COLOR }}
                            />
                            <strong>{primaryRecommendation.title}</strong>
                          </div>
                          <Tag value={primaryRecommendation.badge} severity="success" />
                        </div>

                        <p className="orders-workbench__source-copy orders-workbench__source-copy--lead">
                          {suggestedSources.length > 1 && optimizationMetrics
                            ? `Start with ${primaryRecommendation.reference}. The saved best-cut plan uses ${optimizationMetrics.sourceCount} sources in total.`
                            : primaryRecommendation.reason}
                        </p>

                        <div className="orders-workbench__detail-grid">
                          <div>
                            <span className="orders-workbench__detail-label">Reference</span>
                            <strong>{primaryRecommendation.reference}</strong>
                          </div>
                          <div>
                            <span className="orders-workbench__detail-label">Current size</span>
                            <strong>{primaryRecommendation.dimensions}</strong>
                          </div>
                          <div>
                            <span className="orders-workbench__detail-label">Available area</span>
                            <strong>{formatSquareMeters(primaryRecommendation.availableAreaM2)}</strong>
                          </div>
                          <div>
                            <span className="orders-workbench__detail-label">Source type</span>
                            <strong>{primaryRecommendation.statusLabel}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Message severity="info" text="No matching roll or reusable leftover is available right now." />
                    )}
                  </div>

                  <div className="orders-workbench__workspace-card orders-workbench__workspace-card--usage">
                    <span className="orders-workbench__eyebrow">3. Expected result</span>
                    <div className="orders-workbench__usage">
                      <div className="orders-workbench__usage-bar">
                        <div
                          className="orders-workbench__usage-segment orders-workbench__usage-segment--used"
                          style={{ width: `${usageSegments.usedPct}%` }}
                        />
                        <div
                          className="orders-workbench__usage-segment orders-workbench__usage-segment--waste"
                          style={{ width: `${usageSegments.wastePct}%` }}
                        />
                        <div
                          className="orders-workbench__usage-segment orders-workbench__usage-segment--remaining"
                          style={{ width: `${usageSegments.remainingPct}%` }}
                        />
                      </div>

                      <div className="orders-workbench__usage-legend">
                        <span><i className="orders-workbench__legend-dot orders-workbench__legend-dot--used" />Used {formatSquareMeters(usageSegments.usedAreaM2)}</span>
                        <span><i className="orders-workbench__legend-dot orders-workbench__legend-dot--waste" />Scrap {formatSquareMeters(usageSegments.wasteAreaM2)}</span>
                        <span><i className="orders-workbench__legend-dot orders-workbench__legend-dot--remaining" />Left after cut {formatSquareMeters(usageSegments.remainingAreaM2)}</span>
                      </div>
                    </div>

                    <div className="orders-workbench__stats-grid">
                      <div className="orders-workbench__stat-chip">
                        <span>Utilization</span>
                        <strong>{optimizationMetrics ? `${optimizationMetrics.utilizationPct.toFixed(1)}%` : '-'}</strong>
                      </div>
                      <div className="orders-workbench__stat-chip">
                        <span>Sources used</span>
                        <strong>{optimizationMetrics?.sourceCount ?? 0}</strong>
                      </div>
                      <div className="orders-workbench__stat-chip">
                        <span>Placed pieces</span>
                        <strong>{optimizationMetrics?.placedPieces ?? 0}</strong>
                      </div>
                      <div className="orders-workbench__stat-chip">
                        <span>Waste saved</span>
                        <strong>{formatSquareMeters(optimizationComparison?.wasteSavedM2 ?? 0)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="orders-workbench__workspace-card orders-workbench__workspace-card--pool">
                    <span className="orders-workbench__eyebrow">Backup sources</span>
                    {workspaceError ? (
                      <Message severity="warn" text={workspaceError} />
                    ) : (
                      <div className="orders-workbench__source-groups">
                        <div>
                          <div className="orders-workbench__group-heading">
                            <strong>Reusable leftovers</strong>
                            <span>{availableWaste.length} found</span>
                          </div>
                          <div className="orders-workbench__stack">
                            {wasteCandidates.slice(0, 3).map((candidate) => (
                              <div key={candidate.id} className="orders-workbench__source-card">
                                <div className="orders-workbench__card-topline">
                                  <div className="orders-workbench__source-title">
                                    <span
                                      className="orders-workbench__swatch"
                                      style={{ backgroundColor: candidate.accentColor || DEFAULT_SOURCE_COLOR }}
                                    />
                                    <strong>{candidate.reference}</strong>
                                  </div>
                                  <Tag value={fitStatusLabels[String(candidate.fitsItem) as 'true' | 'false']} severity={candidate.fitsItem ? 'success' : 'warning'} />
                                </div>
                                <div className="orders-workbench__card-subline">
                                  <span>{candidate.dimensions}</span>
                                  <span>{formatSquareMeters(candidate.availableAreaM2)}</span>
                                </div>
                                <div className="orders-workbench__source-copy">{candidate.reason}</div>
                              </div>
                            ))}
                            {wasteCandidates.length === 0 && (
                              <Message severity="info" text="No reusable leftovers for this material." />
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="orders-workbench__group-heading">
                            <strong>Rolls</strong>
                            <span>{availableRolls.length} found</span>
                          </div>
                          <div className="orders-workbench__stack">
                            {rollCandidates.slice(0, 3).map((candidate) => (
                              <div key={candidate.id} className="orders-workbench__source-card">
                                <div className="orders-workbench__card-topline">
                                  <div className="orders-workbench__source-title">
                                    <span
                                      className="orders-workbench__swatch"
                                      style={{ backgroundColor: candidate.accentColor || DEFAULT_SOURCE_COLOR }}
                                    />
                                    <strong>{candidate.reference}</strong>
                                  </div>
                                  <Tag value={fitStatusLabels[String(candidate.fitsItem) as 'true' | 'false']} severity={candidate.fitsItem ? 'success' : 'warning'} />
                                </div>
                                <div className="orders-workbench__card-subline">
                                  <span>{candidate.dimensions}</span>
                                  <span>{formatSquareMeters(candidate.availableAreaM2)}</span>
                                </div>
                                <div className="orders-workbench__source-copy">{candidate.reason}</div>
                              </div>
                            ))}
                            {rollCandidates.length === 0 && (
                              <Message severity="info" text="No rolls are available for this material." />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="orders-workbench__workspace-card orders-workbench__workspace-card--preview">
                    <span className="orders-workbench__eyebrow">Cut preview</span>
                    {previewSvg ? (
                      <div
                        className="orders-workbench__svg-frame"
                        dangerouslySetInnerHTML={{ __html: previewSvg }}
                      />
                    ) : (
                      <Message severity="info" text="No saved cut preview yet. Use the advanced view to place pieces and save a preview." />
                    )}

                    {suggestedSources.length > 0 && (
                      <div className="orders-workbench__suggested-sources">
                        {suggestedSources.map((source) => (
                          <div key={source.id} className="orders-workbench__source-inline">
                            <span
                              className="orders-workbench__swatch"
                              style={{ backgroundColor: source.accentColor || DEFAULT_SOURCE_COLOR }}
                            />
                            <span>{source.reference}</span>
                            <Tag value={source.badge} severity="info" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="orders-workbench__footer-actions">
                  <Button
                    icon="pi pi-play"
                    label="Start cutting"
                    disabled={selectedItem.status !== 'PENDING' || itemStatusLoadingId === selectedItem.id}
                    loading={itemStatusLoadingId === selectedItem.id && selectedItem.status === 'PENDING'}
                    onClick={() => handleItemStatusChange(selectedItem, 'IN_PROGRESS')}
                  />
                  <Button
                    icon="pi pi-check"
                    label="Mark done"
                    severity="success"
                    disabled={selectedItem.status === 'COMPLETED' || selectedItem.status === 'CANCELLED' || itemStatusLoadingId === selectedItem.id}
                    loading={itemStatusLoadingId === selectedItem.id && selectedItem.status !== 'PENDING'}
                    onClick={() => handleItemStatusChange(selectedItem, 'COMPLETED')}
                  />
                  <Button
                    icon="pi pi-arrow-right"
                    label="Next item"
                    severity="secondary"
                    outlined
                    disabled={!nextActionableItem}
                    onClick={() => setSelectedItemId(nextActionableItem?.id ?? null)}
                  />
                  <Button
                    icon="pi pi-external-link"
                    label="Open full order"
                    text
                    onClick={() => activeOrder && navigate(`/commandes/${activeOrder.id}`)}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CommandesListPage;
