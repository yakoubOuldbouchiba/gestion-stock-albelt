import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { CommandeService } from '../services/commandeService';
import { WastePieceService } from '../services/wastePieceService';
import { ProductionItemService } from '../services/productionItemService';
import { RollService } from '../services/rollService';
import { PlacedRectangleService } from '../services/placedRectangleService';
import { useI18n } from '@hooks/useI18n';
import { ChuteDialog } from '../components/commande/ChuteDialog';
import { OrderHeaderCard } from '../components/commande/OrderHeaderCard';
import { OrderInfoCard } from '../components/commande/OrderInfoCard';
import { PlacementDialog } from '../components/commande/PlacementDialog';
import { PlacementPreviewDialog } from '../components/commande/PlacementPreviewDialog';
import { ProductionDialog } from '../components/commande/ProductionDialog';
import { ProductionSection } from '../components/commande/ProductionSection';
import { StatusUpdateCard } from '../components/commande/StatusUpdateCard';
import { WasteSection } from '../components/commande/WasteSection';
import type { StatusSeverity } from '../components/commande/commandeTypes';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import './CommandeDetailPage.css';
import type {
  Commande,
  CommandeItem,
  ItemStatus,
  AltierScore,
  OptimizationComparison,
  PlacedRectangle,
  ProductionItem,
  Roll,
} from '../types';

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useI18n();
  const toastRef = useRef<Toast>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeItemDetailTabIndex, setActiveItemDetailTabIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedAltierId, setSelectedAltierId] = useState<string | null>(null);
  const [altierScores, setAltierScores] = useState<AltierScore[]>([]);
  const [altierScoresLoading, setAltierScoresLoading] = useState(false);
  const [altierSaving, setAltierSaving] = useState(false);
  const [rollsByMaterial, setRollsByMaterial] = useState<Record<string, Roll[]>>({});
  const [rollsLoadingByMaterial, setRollsLoadingByMaterial] = useState<Record<string, boolean>>({});
  const [wasteForItem, setWasteForItem] = useState<any[]>([]);
  const [productionForItem, setProductionForItem] = useState<ProductionItem[]>([]);
  const [placementsForItem, setPlacementsForItem] = useState<PlacedRectangle[]>([]);
  const [optimizationComparison, setOptimizationComparison] = useState<OptimizationComparison | null>(null);
  const [optimizationItemId, setOptimizationItemId] = useState<string | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [svgZoomPreview, setSvgZoomPreview] = useState<{ title: string; svg: string } | null>(null);
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    sourceType: 'ROLL' as 'ROLL' | 'WASTE_PIECE',
    sourceId: '',
    xMm: '',
    yMm: '',
    widthMm: '',
    heightMm: '',
  });
  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementTargetItem, setPlacementTargetItem] = useState<CommandeItem | null>(null);
  const [showPlacementPreview, setShowPlacementPreview] = useState(false);
  const [previewPlacement, setPreviewPlacement] = useState<PlacedRectangle | null>(null);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionTargetItem, setProductionTargetItem] = useState<CommandeItem | null>(null);
  const [showChuteForm, setShowChuteForm] = useState(false);
  const [chuteTargetItem, setChuteTargetItem] = useState<CommandeItem | null>(null);
  const [chuteSourceType, setChuteSourceType] = useState<'ROLL' | 'WASTE_PIECE'>('ROLL');
  const [chuteRollId, setChuteRollId] = useState('');
  const [parentWastePieceId, setParentWastePieceId] = useState('');
  const [parentWastePieces, setParentWastePieces] = useState<any[]>([]);
  const [parentWastePiecesLoading, setParentWastePiecesLoading] = useState(false);
  const [chutePlacementId, setChutePlacementId] = useState('');
  const [chutePlacements, setChutePlacements] = useState<PlacedRectangle[]>([]);
  const [chutePlacementsLoading, setChutePlacementsLoading] = useState(false);
  const [chuteDimensions, setChuteDimensions] = useState({
    widthMm: 0,
    lengthM: 0,
    areaM2: 0,
  });
  const [creatingProduction, setCreatingProduction] = useState(false);
  const [creatingChute, setCreatingChute] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemStatusId, setUpdatingItemStatusId] = useState<string | null>(null);
  const optimizationRequestRef = useRef(0);

  const [productionForm, setProductionForm] = useState({
    placedRectangleId: '',
    pieceLengthM: '',
    pieceWidthMm: '',
    quantity: '',
    notes: '',
  });

  const statusKeys = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const statuses = statusKeys.map((key) => t(`${key}`));
  const itemStatuses: ItemStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const isCommandeLocked = useMemo(() => {
    const normalized = (commande?.status ?? '').trim().toUpperCase();
    return normalized === 'COMPLETED' || normalized === 'CANCELLED';
  }, [commande?.status]);

  useEffect(() => {
    if (!id) {
      setError(t('commandes.loadError'));
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CommandeService.getById(id);
        if (res.data) {
          setCommande(res.data);
          setSelectedStatus(res.data.status);
          setSelectedAltierId(res.data.altierId ?? null);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('commandes.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  useEffect(() => {
    if (!id) return;

    const fetchScores = async () => {
      setAltierScoresLoading(true);
      try {
        const res = await CommandeService.getAltierScores(id);
        setAltierScores(res.data || []);
      } catch (err) {
        console.error('Error fetching altier scores:', err);
        setAltierScores([]);
      } finally {
        setAltierScoresLoading(false);
      }
    };

    fetchScores();
  }, [id]);

  useEffect(() => {
    const items = commande?.items ?? [];
    if (items.length === 0) {
      setSelectedItemId(null);
      return;
    }

    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [commande?.items, selectedItemId]);

  useEffect(() => {
    if (showChuteForm && chuteSourceType === 'WASTE_PIECE') {
      loadParentWastePieces(chuteTargetItem?.materialType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChuteForm, chuteSourceType, chuteTargetItem?.materialType]);

  useEffect(() => {
    const materialsToLoad: string[] = [];
    if (showPlacementModal && placementTargetItem?.materialType) {
      materialsToLoad.push(placementTargetItem.materialType);
    }
    if (showChuteForm && chuteSourceType === 'ROLL' && chuteTargetItem?.materialType) {
      materialsToLoad.push(chuteTargetItem.materialType);
    }
    const unique = Array.from(new Set(materialsToLoad)).filter(Boolean);
    if (unique.length === 0) return;

    for (const materialType of unique) {
      void ensureRollsForMaterial(materialType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlacementModal, placementTargetItem?.materialType, showChuteForm, chuteSourceType, chuteTargetItem?.materialType]);

  const rolls = useMemo(() => Object.values(rollsByMaterial).flat(), [rollsByMaterial]);

  useEffect(() => {
    if (!showChuteForm || chuteSourceType !== 'ROLL' || !chuteRollId) return;
    const source = rolls.find((roll) => roll.id === chuteRollId);
    if (!source) return;
    const width = source.widthMm ?? 0;
    const length = source.lengthM ?? 0;
    setChuteDimensions({ widthMm: width, lengthM: length, areaM2: (width / 1000) * length });
  }, [showChuteForm, chuteSourceType, chuteRollId, rolls]);

  useEffect(() => {
    if (!showChuteForm || chuteSourceType !== 'WASTE_PIECE' || !parentWastePieceId) return;
    const source = parentWastePieces.find((piece: any) => piece.id === parentWastePieceId);
    if (!source) return;
    const width = source.widthMm ?? 0;
    const length = source.lengthM ?? 0;
    setChuteDimensions({ widthMm: width, lengthM: length, areaM2: (width / 1000) * length });
  }, [showChuteForm, chuteSourceType, parentWastePieceId, parentWastePieces]);

  useEffect(() => {
    if (!showChuteForm) {
      setChutePlacements([]);
      setChutePlacementId('');
      return;
    }
    const sourceId = chuteSourceType === 'ROLL' ? chuteRollId : parentWastePieceId;
    if (!sourceId) {
      setChutePlacements([]);
      setChutePlacementId('');
      return;
    }

    const loadPlacements = async () => {
      setChutePlacementsLoading(true);
      try {
        const response = chuteSourceType === 'ROLL'
          ? await PlacedRectangleService.getByRoll(sourceId)
          : await PlacedRectangleService.getByWastePiece(sourceId);
        if (response.success && response.data) {
          setChutePlacements(Array.isArray(response.data) ? response.data : []);
        } else {
          setChutePlacements([]);
        }
      } catch (err) {
        console.error('Error loading placements:', err);
        setChutePlacements([]);
      } finally {
        setChutePlacementsLoading(false);
      }
    };

    loadPlacements();
  }, [showChuteForm, chuteSourceType, chuteRollId, parentWastePieceId]);

  useEffect(() => {
    if (!selectedItemId) {
      setWasteForItem([]);
      setProductionForItem([]);
      setPlacementsForItem([]);
      setOptimizationComparison(null);
      setOptimizationItemId(null);
      setOptimizationError(null);
      return;
    }

    setActiveItemDetailTabIndex(0);
    resetPlacementForm();
    void loadWasteForItem(selectedItemId);
    void loadProductionForItem(selectedItemId);
    void loadPlacementsForItem(selectedItemId);
    void loadOptimizationForItem(selectedItemId);
  }, [selectedItemId]);

  const showError = (detail: string) => {
    toastRef.current?.show({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  };

  const showSuccess = (detail: string) => {
    toastRef.current?.show({
      severity: 'success',
      summary: t('common.success'),
      detail,
      life: 2500,
    });
  };

  const showWarning = (detail: string) => {
    toastRef.current?.show({
      severity: 'warn',
      summary: t('common.warning'),
      detail,
      life: 3000,
    });
  };

  const hasProductionQuantityMismatch = (order: Commande) => {
    const items = order.items ?? [];
    return items.some((item) => {
      const totalConforme = item.totalItemsConforme ?? 0;
      const totalNonConforme = item.totalItemsNonConforme ?? 0;
      const totalProduced = totalConforme + totalNonConforme;
      const ordered = item.quantite ?? 0;
      return totalProduced !== ordered;
    });
  };

  const handleStatusUpdate = async () => {
    if (!commande || !id) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }

    const submitStatusUpdate = async () => {
      try {
        setUpdating(true);
        const res = await CommandeService.updateStatus(id, selectedStatus);
        if (res.data) {
          setCommande(res.data);
          setError(null);
          showSuccess(t('commandes.updateStatus'));
        }
      } catch (err) {
        console.error('Error updating status:', err);
        setError(t('commandes.errorLoadingOrders'));
        showError(t('commandes.errorLoadingOrders'));
      } finally {
        setUpdating(false);
      }
    };

    if (selectedStatus === 'COMPLETED' && commande.status !== 'COMPLETED') {
      if (hasProductionQuantityMismatch(commande)) {
        showWarning(t('commandes.completeQuantityWarning'));
      }
    }

    if (selectedStatus === 'CANCELLED' && commande.status !== 'CANCELLED') {
      confirmDialog({
        message: t('commandes.cancelCreatesChuteWarning'),
        header: t('common.confirm'),
        icon: 'pi pi-exclamation-triangle',
        accept: submitStatusUpdate,
      });
      return;
    }

    await submitStatusUpdate();
  };

  const handleAltierSave = async () => {
    if (!commande || !id) return;
    if (altierSaving) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }

    try {
      setAltierSaving(true);
      const res = await CommandeService.update(id, {
        numeroCommande: commande.numeroCommande,
        clientId: commande.clientId,
        altierId: selectedAltierId || undefined,
        status: commande.status,
        description: commande.description,
        notes: commande.notes,
      });

      if (res.data) {
        setCommande(res.data);
        setSelectedAltierId(res.data.altierId ?? null);
        showSuccess(t('common.updated'));
      }
    } catch (err) {
      console.error('Error updating workshop:', err);
      showError(t('commandes.updateError'));
    } finally {
      setAltierSaving(false);
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    if (!commande) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }

    try {
      if (updatingItemStatusId) return;
      setUpdatingItemStatusId(itemId);
      const res = await CommandeService.updateItemStatus(itemId, newStatus);
      if (res.data) {
        // Refetch the order to get updated data
        const commandeRes = await CommandeService.getById(commande.id);
        if (commandeRes.data) {
          setCommande(commandeRes.data);
        }
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      setError(t('commandes.deleteItemError'));
      showError(t('commandes.deleteItemError'));
    } finally {
      setUpdatingItemStatusId(null);
    }
  };

  const handleDeleteProductionItem = (productionItemId: string, itemId: string) => {
    if (!id) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    confirmDialog({
      message: 'Delete this production item?',
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await ProductionItemService.delete(productionItemId);
          await loadProductionForItem(itemId);
          const commandeRes = await CommandeService.getById(id);
          if (commandeRes.data) {
            setCommande(commandeRes.data);
          }
          showSuccess('Production item deleted.');
        } catch (err) {
          console.error('Error deleting production item:', err);
          showError('Unable to delete production item.');
        }
      },
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    confirmDialog({
      message: t('commandes.confirmDeleteItem'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (deletingItemId) return;
          setDeletingItemId(itemId);
          await CommandeService.deleteItem(itemId);
          if (commande) {
            setCommande({
              ...commande,
              items: commande.items.filter((item) => item.id !== itemId),
            });
          }
          showSuccess(t('commandes.delete'));
        } catch (err) {
          console.error('Error deleting item:', err);
          setError(t('commandes.deleteItemError'));
          showError(t('commandes.deleteItemError'));
        } finally {
          setDeletingItemId(null);
        }
      },
    });
  };

  const handleDeleteOrder = () => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    confirmDialog({
      message: t('commandes.confirmDeleteOrder'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (deletingOrder) return;
          setDeletingOrder(true);
          if (commande?.id) {
            await CommandeService.delete(commande.id);
            navigate('/commandes');
          }
        } catch (err) {
          console.error('Error deleting order:', err);
          setError(t('commandes.confirmDeleteError'));
          showError(t('commandes.confirmDeleteError'));
        } finally {
          setDeletingOrder(false);
        }
      },
    });
  };

  const handleEditOrder = () => {
    if (!commande?.id) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    navigate(`/commandes/${commande.id}/edit`);
  };

  const handleReturnOrder = () => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    if (commande?.id) {
      navigate(`/commandes/${commande.id}/returns`);
    }
  };

  const getStatusSeverity = (status: string) => {
    const severities: Record<string, StatusSeverity> = {
      PENDING: 'warning',
      ENCOURS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      ON_HOLD: 'secondary',
      IN_PROGRESS: 'info',
    };
    return severities[status] || 'secondary';
  };

  const loadWasteForItem = async (itemId: string) => {
    try {
      const response = await WastePieceService.getByCommandeItem(itemId);
      if (response.data) {
        setWasteForItem(response.data);
      }
    } catch (err) {
      console.error('Error loading waste:', err);
    }
  };

  const ensureRollsForMaterial = async (materialType?: string) => {
    if (!materialType) return;
    if ((rollsByMaterial[materialType] || []).length > 0) return;
    if (rollsLoadingByMaterial[materialType]) return;

    setRollsLoadingByMaterial((prev) => ({ ...prev, [materialType]: true }));
    try {
      const response = await RollService.getAvailableByMaterial(materialType as any);
      if (response.success && response.data) {
        setRollsByMaterial((prev) => ({ ...prev, [materialType]: response.data || [] }));
      } else {
        setRollsByMaterial((prev) => ({ ...prev, [materialType]: [] }));
      }
    } catch (err) {
      console.error('Error loading rolls:', err);
      setRollsByMaterial((prev) => ({ ...prev, [materialType]: [] }));
    } finally {
      setRollsLoadingByMaterial((prev) => ({ ...prev, [materialType]: false }));
    }
  };

  const loadParentWastePieces = async (materialType?: string) => {
    setParentWastePiecesLoading(true);
    try {
      if (!materialType) {
        setParentWastePieces([]);
        return;
      }
      const response = await WastePieceService.getAvailableByMaterial(materialType as any, 0, 200);
      if (response.success && response.data) {
        setParentWastePieces(response.data);
      } else {
        setParentWastePieces([]);
      }
    } catch (err) {
      console.error('Error loading parent waste pieces:', err);
      setParentWastePieces([]);
    } finally {
      setParentWastePiecesLoading(false);
    }
  };

  const loadProductionForItem = async (itemId: string) => {
    try {
      const response = await ProductionItemService.getByCommandeItemId(itemId);
      if (response.data) {
        const items = Array.isArray(response.data) ? response.data : [];
        setProductionForItem(items);
      } else {
        setProductionForItem([]);
      }
    } catch (err) {
      console.error('Error loading production items:', err);
      setProductionForItem([]);
    }
  };

  const loadPlacementsForItem = async (itemId: string) => {
    try {
      const response = await PlacedRectangleService.getByCommandeItem(itemId);
      if (response.data) {
        const items = Array.isArray(response.data) ? response.data : [];
        setPlacementsForItem(items);
        if (items.length > 0) {
          setPlacementForm((prev) => {
            if (prev.sourceId) {
              return prev;
            }
            const first = items[0];
            if (first.rollId) {
              return {
                ...prev,
                sourceType: 'ROLL',
                sourceId: first.rollId,
              };
            }
            if (first.wastePieceId) {
              return {
                ...prev,
                sourceType: 'WASTE_PIECE',
                sourceId: first.wastePieceId,
              };
            }
            return prev;
          });
        }
      } else {
        setPlacementsForItem([]);
      }
    } catch (err) {
      console.error('Error loading placements:', err);
      setPlacementsForItem([]);
    }
  };

  const loadOptimizationForItem = async (itemId: string, forceRegenerate = false) => {
    if (forceRegenerate && isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    const requestId = optimizationRequestRef.current + 1;
    optimizationRequestRef.current = requestId;
    setOptimizationLoading(true);
    setOptimizationError(null);
    setOptimizationItemId(itemId);
    try {
      const response = forceRegenerate
        ? await CommandeService.regenerateOptimization(itemId)
        : await CommandeService.getOptimizationComparison(itemId);

      if (optimizationRequestRef.current !== requestId) {
        return;
      }

      if (response.data) {
        setOptimizationComparison(response.data);
      } else {
        setOptimizationComparison(null);
      }
    } catch (err) {
      if (optimizationRequestRef.current !== requestId) {
        return;
      }
      console.error('Error loading optimization comparison:', err);
      setOptimizationError(t('messages.failedToLoad'));
      setOptimizationComparison(null);
    } finally {
      if (optimizationRequestRef.current === requestId) {
        setOptimizationLoading(false);
      }
    }
  };

  const resetPlacementForm = () => {
    setPlacementForm({
      sourceType: 'ROLL',
      sourceId: '',
      xMm: '',
      yMm: '',
      widthMm: '',
      heightMm: '',
    });
    setEditingPlacementId(null);
  };

  const updatePlacementField = (name: keyof typeof placementForm, value: string) => {
    setPlacementForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePlacement = async (item: CommandeItem) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return false;
    }
    const isEditing = editingPlacementId !== null;
    const sourceId = placementForm.sourceId;
    const isRollSource = placementForm.sourceType === 'ROLL';
    if (!sourceId && !isEditing) {
      showError('Select a roll or waste piece for placement.');
      return false;
    }

    const source = isRollSource
      ? rolls.find((roll) => roll.id === sourceId)
      : wasteForItem.find((waste: any) => waste.id === sourceId);
    if (!source) {
      showError(t('inventory.placementSourceNotFound'));
      return false;
    }

    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      showError(t('inventory.placementDimensionsRequired'));
      return false;
    }

    const sourceWidth = Number(source.widthMm) || 0;
    const sourceLengthMm = Math.round((Number(source.lengthM) || 0) * 1000);
    if (sourceWidth <= 0 || sourceLengthMm <= 0) {
      showError(t('inventory.sourceDimensionsRequired'));
      return false;
    }

    if (xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0) {
      showError(t('inventory.placementValuesMustBePositive'));
      return false;
    }

    if (xMm >= sourceWidth || yMm >= sourceLengthMm || xMm + widthMm > sourceWidth || yMm + heightMm > sourceLengthMm) {
      showError(t('inventory.placementOutsideSourceBounds'));
      return false;
    }

    const placementsForSource = placementsForItem.filter((placement) => (
      isRollSource
        ? placement.rollId === sourceId
        : placement.wastePieceId === sourceId
    ));
    const hasOverlap = placementsForSource.some((placement) => {
      if (isEditing && placement.id === editingPlacementId) {
        return false;
      }
      const exX = placement.xMm;
      const exY = placement.yMm;
      const exW = placement.widthMm;
      const exH = placement.heightMm;
      return xMm < exX + exW && xMm + widthMm > exX && yMm < exY + exH && yMm + heightMm > exY;
    });
    if (hasOverlap) {
      showError(t('inventory.placementOverlapsExistingRectangle'));
      return false;
    }

    let didSucceed = false;
    try {
      if (creatingPlacement) return false;
      setCreatingPlacement(true);
      if (isEditing && editingPlacementId) {
        await PlacedRectangleService.update(editingPlacementId, {
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
      } else {
        await PlacedRectangleService.create({
          rollId: isRollSource ? sourceId : undefined,
          wastePieceId: isRollSource ? undefined : sourceId,
          commandeItemId: item.id,
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
      }
      await loadPlacementsForItem(item.id);
      await loadOptimizationForItem(item.id);
      setPlacementForm((prev) => ({
        ...prev,
        xMm: '',
        yMm: '',
        widthMm: '',
        heightMm: '',
      }));
      setEditingPlacementId(null);
      showSuccess(isEditing ? t('inventory.placementUpdated') : t('inventory.placementSaved'));
      didSucceed = true;
    } catch (err) {
      console.error('Error creating placement:', err);
      showError(isEditing ? t('inventory.placementUpdateFailed') : t('inventory.placementSaveFailed'));
    } finally {
      setCreatingPlacement(false);
    }
    return didSucceed;
  };

  const startEditPlacement = (placement: PlacedRectangle) => {
    const sourceType = placement.rollId ? 'ROLL' : 'WASTE_PIECE';
    const sourceId = placement.rollId ?? placement.wastePieceId ?? '';
    setEditingPlacementId(placement.id);
    setPlacementForm({
      sourceType,
      sourceId,
      xMm: String(placement.xMm),
      yMm: String(placement.yMm),
      widthMm: String(placement.widthMm),
      heightMm: String(placement.heightMm),
    });
  };

  const handleOpenPlacementModal = (item: CommandeItem) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    setPlacementTargetItem(item);
    setEditingPlacementId(null);
    setPlacementForm((prev) => ({
      ...prev,
      xMm: '',
      yMm: '',
      widthMm: '',
      heightMm: '',
    }));
    setShowPlacementModal(true);
  };

  const handleOpenEditPlacementModal = (item: CommandeItem, placement: PlacedRectangle) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    setPlacementTargetItem(item);
    startEditPlacement(placement);
    setShowPlacementModal(true);
  };

  const handleClosePlacementModal = () => {
    setShowPlacementModal(false);
    setPlacementTargetItem(null);
    resetPlacementForm();
  };

  const handleSavePlacement = async () => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    if (!placementTargetItem) {
      showError(t('inventory.placementItemRequired'));
      return;
    }
    const didSucceed = await handleCreatePlacement(placementTargetItem);
    if (didSucceed) {
      setShowPlacementModal(false);
      setPlacementTargetItem(null);
    }
  };

  const handleOpenPlacementPreview = (placement: PlacedRectangle) => {
    setPreviewPlacement(placement);
    setShowPlacementPreview(true);
  };

  const handleClosePlacementPreview = () => {
    setShowPlacementPreview(false);
    setPreviewPlacement(null);
  };

  const handleDeletePlacement = (placementId: string, itemId: string) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    const performDelete = async () => {
      await PlacedRectangleService.delete(placementId);
      await loadPlacementsForItem(itemId);
      await loadOptimizationForItem(itemId);
      if (editingPlacementId === placementId) {
        resetPlacementForm();
      }
      showSuccess(t('inventory.placementDeleted'));
    };

    confirmDialog({
      message: t('inventory.confirmDeletePlacement'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const productionRes = await ProductionItemService.getByCommandeItemId(itemId);
          const productionItems = Array.isArray(productionRes.data) ? productionRes.data : [];
          const linked = productionItems.filter((p) => p.placedRectangleId === placementId);

          if (linked.length > 0) {
            confirmDialog({
              message: ` ${t('inventory.placementHasLinkedProductionItems', { count: linked.length })}`,
              header: t('common.confirm'),
              icon: 'pi pi-exclamation-triangle',
              accept: async () => {
                try {
                  await Promise.all(linked.map((p) => ProductionItemService.delete(p.id)));
                  await loadProductionForItem(itemId);
                  await performDelete();
                  if (id) {
                    const commandeRes = await CommandeService.getById(id);
                    if (commandeRes.data) {
                      setCommande(commandeRes.data);
                    }
                  }
                  showSuccess(t('inventory.productionItemsDeleted'));
                } catch (err) {
                  console.error('Error deleting linked production items:', err);
                  showError(t('inventory.unableToDeleteProductionItems'));
                }
              },
            });
            return;
          }

          await performDelete();
        } catch (err) {
          console.error('Error deleting placement:', err);
          showError(t('inventory.placementDeleteFailed'));
        }
      },
    });
  };

  const resetChuteForm = () => {
    setChuteSourceType('ROLL');
    setChuteRollId('');
    setParentWastePieceId('');
    setChutePlacementId('');
    setChutePlacements([]);
    setChuteDimensions({ widthMm: 0, lengthM: 0, areaM2: 0 });
  };

  const handleOpenChuteModal = (item: CommandeItem) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    setChuteTargetItem(item);
    resetChuteForm();
    setShowChuteForm(true);
  };

  const handleCloseChuteModal = () => {
    setShowChuteForm(false);
    setChuteTargetItem(null);
    resetChuteForm();
  };

  const updateChuteDimension = (field: 'widthMm' | 'lengthM', value: string) => {
    const nextWidth = field === 'widthMm' ? parseFloat(value) || 0 : chuteDimensions.widthMm;
    const nextLength = field === 'lengthM' ? parseFloat(value) || 0 : chuteDimensions.lengthM;
    const nextArea = (nextWidth / 1000) * nextLength;
    setChuteDimensions({ widthMm: nextWidth, lengthM: nextLength, areaM2: nextArea });
  };

  const handleCreateChute = async () => {
    if (!chuteTargetItem) return;

    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }

    if (creatingChute) return;
    setCreatingChute(true);

    const isRollSource = chuteSourceType === 'ROLL';
    const source = isRollSource
      ? rolls.find((roll) => roll.id === chuteRollId)
      : parentWastePieces.find((piece: any) => piece.id === parentWastePieceId);

    if (!source) {
      showError(t('commandes.productionItemSourceRequired'));
      return;
    }

    if (chuteDimensions.widthMm <= 0 || chuteDimensions.lengthM <= 0) {
      showError(t('commandes.invalidDimensionsError'));
      return;
    }

    const selectedPlacement = chutePlacements.find((placement) => placement.id === chutePlacementId);
    if (!selectedPlacement) {
      showError(t('inventory.placementItemRequired'));
      return;
    }
    const chuteLengthMm = chuteDimensions.lengthM * 1000;
    if (chuteDimensions.widthMm > selectedPlacement.widthMm || chuteLengthMm > selectedPlacement.heightMm) {
      showError(t('inventory.placementDimensionsExceeded'));
      return;
    }

    const wasteData = {
      rollId: isRollSource ? source.id : source.rollId,
      parentWastePieceId: isRollSource ? undefined : source.id,
      materialType: source.materialType,
      nbPlis: source.nbPlis,
      thicknessMm: source.thicknessMm,
      widthMm: chuteDimensions.widthMm,
      lengthM: chuteDimensions.lengthM,
      areaM2: chuteDimensions.areaM2,
      status: 'AVAILABLE',
      wasteType: 'CHUTE_EXPLOITABLE',
      altierID: source.altierId,
      colorId: source.colorId,
      reference: source.reference,
      commandeItemId: chuteTargetItem.id,
    };

    try {
      await WastePieceService.create(wasteData);
      await loadWasteForItem(chuteTargetItem.id);
      showSuccess(t('commandes.wasteRecordedSuccess'));
      handleCloseChuteModal();
    } catch (err) {
      console.error('Error creating chute:', err);
      showError(t('commandes.wasteRecordError'));
    } finally {
      setCreatingChute(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleOpenProductionModal = (item: CommandeItem, placementId: string) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    if (!placementId) {
      showError(t('commandes.productionItemSourceRequired'));
      return;
    }
    setProductionTargetItem(item);
    setProductionForm({
      placedRectangleId: placementId,
      pieceLengthM: '',
      pieceWidthMm: '',
      quantity: '',
      notes: '',
    });
    loadPlacementsForItem(item.id);
    setShowProductionModal(true);
  };

  const handleCloseProductionModal = () => {
    setShowProductionModal(false);
    setProductionTargetItem(null);
    setProductionForm({
      placedRectangleId: '',
      pieceLengthM: '',
      pieceWidthMm: '',
      quantity: '',
      notes: '',
    });
  };

  const updateProductionField = (name: keyof typeof productionForm, value: string) => {
    setProductionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return NaN;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const getSourceColorLabel = (source: any) => source?.colorName ?? source?.colorHexCode;
  const formatSourceLabel = (source: any, fallbackRef?: string) => {
    if (!source) return fallbackRef ?? t('commandes.notAvailable');
    return formatRollChuteLabel({
      reference: source.reference ?? fallbackRef,
      nbPlis: source.nbPlis,
      thicknessMm: source.thicknessMm,
      colorName: source.colorName,
      colorHexCode: source.colorHexCode,
    });
  };

  const getItemDisplayLabel = (item: CommandeItem) => {
    const parts = [
      item.lineNumber ? `Line ${item.lineNumber}` : null,
      item.reference ?? null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : item.materialType;
  };

  const getItemProgress = (item: CommandeItem) => {
    const conforme = item.totalItemsConforme ?? 0;
    const nonConforme = item.totalItemsNonConforme ?? 0;
    const produced = conforme + nonConforme;
    return {
      conforme,
      nonConforme,
      produced,
      remaining: Math.max(0, item.quantite - produced),
      over: Math.max(0, produced - item.quantite),
    };
  };

  const summarizeOptimizationSources = (sources?: Array<{ sourceType?: 'ROLL' | 'WASTE_PIECE' }>) => {
    return (sources ?? []).reduce(
      (summary, source) => {
        if (source.sourceType === 'ROLL') {
          summary.rolls += 1;
        } else if (source.sourceType === 'WASTE_PIECE') {
          summary.chutes += 1;
        }

        return summary;
      },
      { rolls: 0, chutes: 0 }
    );
  };

  const getProductionWarnings = (
    item: CommandeItem,
    placement: PlacedRectangle | undefined,
    pieceLength: number,
    pieceWidth: number
  ) => {
    const warnings: string[] = [];

    const source = placement?.roll ?? placement?.wastePiece ?? null;

    const placementWidth = placement?.widthMm ?? null;
    const placementHeight = placement?.heightMm ?? null;
    if (placementWidth !== null && pieceWidth > placementWidth) {
      warnings.push(t('inventory.placementDimensionsExceeded'));
    }
    if (placementHeight !== null && pieceLength * 1000 > placementHeight) {
      warnings.push(t('inventory.placementDimensionsExceeded'));
    }

    if (source?.materialType && source.materialType !== item.materialType) {
      warnings.push(
        t('commandes.productionMismatchMaterial', {
          expected: item.materialType,
          actual: source.materialType,
        })
      );
    }

    const sourcePlis = toNumber(source?.nbPlis);
    if (!Number.isNaN(sourcePlis) && sourcePlis !== item.nbPlis) {
      warnings.push(
        t('commandes.productionMismatchPlies', {
          expected: item.nbPlis,
          actual: sourcePlis,
        })
      );
    }

    const sourceThickness = toNumber(source?.thicknessMm);
    const itemThickness = toNumber(item.thicknessMm);
    if (!Number.isNaN(sourceThickness) && !Number.isNaN(itemThickness) && sourceThickness !== itemThickness) {
      warnings.push(
        t('commandes.productionMismatchThickness', {
          expected: itemThickness,
          actual: sourceThickness,
        })
      );
    }

    const itemWidth = toNumber(item.largeurMm);
    if (!Number.isNaN(itemWidth) && pieceWidth !== itemWidth) {
      warnings.push(
        t('commandes.productionMismatchWidth', {
          expected: itemWidth,
          actual: pieceWidth,
        })
      );
    }

    const itemLength = toNumber(item.longueurM);
    const rawTolerance = toNumber(item.longueurToleranceM ?? 0);
    const lengthTolerance = Number.isNaN(rawTolerance) ? 0 : rawTolerance;
    const minLength = itemLength - lengthTolerance;
    const maxLength = itemLength + lengthTolerance;
    if (!Number.isNaN(itemLength) && (pieceLength < minLength || pieceLength > maxLength)) {
      warnings.push(
        t('commandes.productionMismatchLength', {
          expected: itemLength,
          actual: pieceLength,
          tolerance: lengthTolerance,
        })
      );
    }

    const existingColors = new Set<string>();
    productionForItem.forEach((production) => {
      const productionPlacement = production.placedRectangle
        ?? placementsForItem.find((item) => item.id === production.placedRectangleId);
      const placementSource = productionPlacement?.roll ?? productionPlacement?.wastePiece;
      const color = getSourceColorLabel(placementSource) ?? productionPlacement?.colorHexCode;
      if (color) {
        existingColors.add(color);
      }
    });

    const sourceColor = getSourceColorLabel(source) ?? placement?.colorHexCode;
    if (sourceColor && existingColors.size > 0 && !existingColors.has(sourceColor)) {
      warnings.push(
        t('commandes.productionMismatchColor', {
          actual: sourceColor,
        })
      );
    }

    return warnings;
  };

  const handleCreateProductionItem = async () => {
    if (!productionTargetItem) return;

    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }

    const quantity = parseInt(productionForm.quantity, 10);
    const pieceLength = parseFloat(productionForm.pieceLengthM);
    const pieceWidth = parseInt(productionForm.pieceWidthMm, 10);

    if (!quantity || !pieceLength || !pieceWidth) {
      showError(t('commandes.productionItemRequired'));
      return;
    }

    const placementId = productionForm.placedRectangleId;
    if (!placementId) {
      showError(t('commandes.productionItemSourceRequired'));
      return;
    }

    const placement = placementsForItem.find((item) => item.id === placementId);
    if (!placement) {
      showError(t('commandes.productionItemSourceRequired'));
      return;
    }

    const warnings = getProductionWarnings(productionTargetItem, placement, pieceLength, pieceWidth);

    const saveProductionItem = async () => {
      try {
        if (creatingProduction) return;
        setCreatingProduction(true);
        await ProductionItemService.create({
          placedRectangleId: placementId,
          pieceLengthM: pieceLength,
          pieceWidthMm: pieceWidth,
          quantity,
          notes: productionForm.notes || undefined,
        });

        await loadProductionForItem(productionTargetItem.id);
        await loadOptimizationForItem(productionTargetItem.id);
        showSuccess(t('commandes.productionItemCreated'));
        handleCloseProductionModal();
      } catch (err) {
        console.error('Error creating production item:', err);
        showError(t('commandes.productionItemCreateError'));
      } finally {
        setCreatingProduction(false);
      }
    };

    if (warnings.length > 0) {
      confirmDialog({
        header: t('commandes.productionMismatchTitle'),
        message: (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>{t('commandes.productionMismatchMessage')}</div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        ),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t('commandes.continueSave'),
        rejectLabel: t('commandes.cancel'),
        accept: saveProductionItem,
      });
      return;
    }

    await saveProductionItem();
  };

  const statusOptions = statuses.map((status) => ({ label: t(`statuses.${status}`), value: status }));
  const itemStatusOptions = itemStatuses.map((status) => ({ label: t(`statuses.${status}`), value: status }));
  const isBusy =
    updating ||
    creatingProduction ||
    creatingChute ||
    creatingPlacement ||
    deletingOrder ||
    deletingItemId !== null ||
    updatingItemStatusId !== null;

  const buildRollOptions = (rollItems: Roll[]) =>
    rollItems.map((roll) => {
      const reference = roll.reference ?? (roll as any).referenceRouleau ?? t('commandes.notAvailable');
      return {
        label: formatRollChuteLabel({
          reference,
          nbPlis: roll.nbPlis,
          thicknessMm: roll.thicknessMm,
          colorName: roll.colorName,
          colorHexCode: roll.colorHexCode,
        }),
        value: roll.id,
        materialType: roll.materialType,
        nbPlis: roll.nbPlis,
        thicknessMm: roll.thicknessMm,
        colorHexCode: roll.colorHexCode,
        colorName: roll.colorName,
      };
    });

  const selectedProductionPlacement = placementsForItem.find(
    (placement) => placement.id === productionForm.placedRectangleId
  );
  const selectedProductionSource = selectedProductionPlacement?.roll
    ?? selectedProductionPlacement?.wastePiece
    ?? null;
  const selectedProductionColorHex =
    selectedProductionSource?.colorHexCode ?? selectedProductionPlacement?.colorHexCode ?? '';
  const selectedProductionColorName =
    selectedProductionSource?.colorName ?? selectedProductionPlacement?.colorName ?? '';
  const selectedProductionLabel = selectedProductionPlacement
    ? `${formatSourceLabel(selectedProductionSource, selectedProductionPlacement.id.slice(0, 8))} | x:${selectedProductionPlacement.xMm} y:${selectedProductionPlacement.yMm} ${selectedProductionPlacement.widthMm}x${selectedProductionPlacement.heightMm}mm`
    : productionForm.placedRectangleId
      ? productionForm.placedRectangleId.slice(0, 8)
      : t('commandes.notAvailable');

  const chuteSourceOptions = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const placementSourceOptionsDialog = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const chuteRollOptions = buildRollOptions(
    chuteTargetItem?.materialType ? (rollsByMaterial[chuteTargetItem.materialType] || []) : []
  );
  const chuteParentOptions = parentWastePieces.map((piece: any) => ({
    label: formatRollChuteLabel({
      reference: piece.reference ?? piece.id.slice(0, 8),
      nbPlis: piece.nbPlis,
      thicknessMm: piece.thicknessMm,
      colorName: piece.colorName,
      colorHexCode: piece.colorHexCode,
    }),
    value: piece.id,
  }));

  const chutePlacementOptions = chutePlacements.map((placement) => ({
    label: `Placement ${placement.id.substring(0, 8)} • ${placement.widthMm}x${placement.heightMm}mm • x:${placement.xMm} y:${placement.yMm}`,
    value: placement.id,
  }));

  const placementRollOptionsDialog = buildRollOptions(
    placementTargetItem?.materialType ? (rollsByMaterial[placementTargetItem.materialType] || []) : []
  );
  const placementWasteOptionsDialog = wasteForItem
    .filter((waste: any) => !placementTargetItem || waste.materialType === placementTargetItem.materialType)
    .map((waste: any) => ({
      label: formatRollChuteLabel({
        reference: waste.reference ?? waste.id.slice(0, 8),
        nbPlis: waste.nbPlis,
        thicknessMm: waste.thicknessMm,
        colorName: waste.colorName,
        colorHexCode: waste.colorHexCode,
      }),
      value: waste.id,
    }));

  const chuteSource = chuteSourceType === 'ROLL'
    ? rolls.find((roll) => roll.id === chuteRollId)
    : parentWastePieces.find((piece: any) => piece.id === parentWastePieceId);

  const renderRollOption = (option: any) => {
    if (!option) return null;
    const colorHex = option.colorHexCode;
    const colorName = option.colorName ?? t('commandes.notAvailable');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '3px',
            backgroundColor: colorHex || 'transparent',
            border: '1px solid var(--surface-border)',
          }}
          title={colorName}
        />
        <span>{colorName}</span>
        <span style={{ color: 'var(--text-color-secondary)' }}>•</span>
        <span>{option.label}</span>
      </div>
    );
  };

  const renderPlacementSection = (item: CommandeItem) => {

    const getPlacementSource = (placement: PlacedRectangle) => (
      placement.roll ?? placement.wastePiece ?? null
    );

    const renderPlacementSource = (placement: PlacedRectangle) => {
      const source = getPlacementSource(placement);
      const isRollSource = Boolean(placement.rollId ?? placement.roll?.id);
      const isWasteSource = Boolean(placement.wastePieceId ?? placement.wastePiece?.id);
      const typeLabel = isRollSource ? 'Roll' : isWasteSource ? 'Waste' : t('commandes.notAvailable');
      const itemLabel = placement.commandeItem
        ? [
          placement.commandeItem.lineNumber
            ? `Line ${placement.commandeItem.lineNumber}`
            : null,
          placement.commandeItem.reference ?? null,
        ]
          .filter(Boolean)
          .join(' • ')
        : null;
      const sourceLabel = formatSourceLabel(source, placement.id.slice(0, 8));
      const label = itemLabel ?? sourceLabel;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span style={{ fontWeight: 600 }}>{typeLabel}</span>
          <span style={{ color: 'var(--text-color-secondary)' }}>{label}</span>
        </div>
      );
    };

    const renderPlacementColor = (placement: PlacedRectangle) => {
      const source = getPlacementSource(placement);
      const colorHex = placement.colorHexCode ?? source?.colorHexCode;
      const colorName = placement.colorName ?? source?.colorName ?? colorHex;
      if (!colorHex) return null;
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: colorHex,
              borderRadius: '3px',
              border: '1px solid var(--surface-border)',
            }}
          />
          <span>{colorName}</span>
        </span>
      );
    };

    const renderPlacementActions = (placement: PlacedRectangle) => (
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        <Button
          label={t('commandes.addProductionItem')}
          icon="pi pi-plus"
          text
          onClick={() => handleOpenProductionModal(item, placement.id)}
          disabled={isBusy || isCommandeLocked}
        />
        <Button
          label={t('common.edit')}
          icon="pi pi-pencil"
          text
          onClick={() => handleOpenEditPlacementModal(item, placement)}
          disabled={isBusy || isCommandeLocked}
        />
        <Button
          label={t('common.delete')}
          icon="pi pi-trash"
          severity="danger"
          text
          onClick={() => handleDeletePlacement(placement.id, item.id)}
          disabled={isBusy || isCommandeLocked}
        />
      </div>
    );

    const placementRows = placementsForItem
      .map((placement) => {
        const source = getPlacementSource(placement);
        const rollId = placement.rollId ?? placement.roll?.id;
        const wastePieceId = placement.wastePieceId ?? placement.wastePiece?.id;
        const type = rollId ? 'ROLL' : wastePieceId ? 'WASTE_PIECE' : 'UNKNOWN';
        const sourceId = rollId ?? wastePieceId ?? placement.id;
        const reference = source?.reference ?? source?.materialType ?? sourceId.slice(0, 8);
        const sourceLabel = formatSourceLabel(source, reference);
        const itemLabel = placement.commandeItem
          ? [
            placement.commandeItem.lineNumber
              ? `Line ${placement.commandeItem.lineNumber}`
              : null,
            placement.commandeItem.reference ?? null,
          ]
            .filter(Boolean)
            .join(' • ')
          : null;
        const groupLabel = type === 'ROLL'
          ? `Roll ${sourceLabel}`
          : type === 'WASTE_PIECE'
            ? `Waste ${sourceLabel}`
            : `Source ${sourceLabel}`;
        return {
          ...placement,
          groupKey: `${type}:${sourceId}`,
          groupLabel,
          groupItemLabel: itemLabel,
        };
      })
      .sort((a, b) => a.groupKey.localeCompare(b.groupKey));

    return (
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('rollDetail.placements')}</div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontWeight: 600 }}>{t('rollDetail.existingPlacements')}</div>
              <Button
                label={t('rollDetail.addPlacement')}
                icon="pi pi-plus"
                severity="secondary"
                onClick={() => handleOpenPlacementModal(item)}
                disabled={isBusy || isCommandeLocked}
              />
            </div>
            <DataTable
              value={placementRows}
              dataKey="id"
              emptyMessage={t('rollDetail.noPlacements') || "No placements recorded for this item."}
              size="small"
              className="p-datatable-sm"
              rowGroupMode="subheader"
              groupRowsBy="groupKey"
              sortField="groupKey"
              sortOrder={1}
              rowGroupHeaderTemplate={(row) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.25rem 0',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600 }}>{row.groupLabel}</span>
                    {row.groupItemLabel ? (
                      <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                        {row.groupItemLabel}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    label="Preview"
                    icon="pi pi-eye"
                    text
                    onClick={() => handleOpenPlacementPreview(row)}
                  />
                </div>
              )}
            >
              <Column header={t('rollDetail.source')} body={renderPlacementSource} />
              <Column field="xMm" header={t('rollDetail.xMm')} />
              <Column field="yMm" header={t('rollDetail.yMm')} />
              <Column field="widthMm" header={t('rollDetail.widthMm')} />
              <Column field="heightMm" header={t('rollDetail.heightMm')} />
              <Column header={t('rollDetail.color')} body={renderPlacementColor} />
              <Column header={t('rollDetail.actions')} body={renderPlacementActions} />
            </DataTable>
          </div>

        </div>
      </div>
    );
  };

  const formatMetricValue = (value?: number, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return Number(value).toFixed(digits);
  };

  const normalizeOptimizationSvg = (rawSvg: string) =>
    rawSvg.replace(
      /<svg([^>]*?)>/,
      (_, attrs) => {
        // Strip any existing width/height/preserveAspectRatio so we can control sizing via CSS.
        const cleaned = attrs
          .replace(/\s*width="[^"]*"/g, '')
          .replace(/\s*height="[^"]*"/g, '')
          .replace(/\s*preserveAspectRatio="[^"]*"/g, '')
          .replace(/\s*class="[^"]*"/g, '');
        return `<svg${cleaned} class="albel-generated-svg" preserveAspectRatio="xMinYMid meet">`;
      }
    );

  const buildOptimizationSvgSlices = (rawSvg: string, maxAspectRatio = 6, maxSlices = 12) => {
    try {
      const parsed = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
      const svgEl = parsed.querySelector('svg');
      if (!svgEl) return null;

      const viewBox = svgEl.getAttribute('viewBox');
      if (!viewBox) return null;
      const parts = viewBox.split(/[\s,]+/).filter(Boolean).map((v) => Number(v));
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
      const [minX, minY, vbW, vbH] = parts;
      if (vbW <= 0 || vbH <= 0) return null;

      const inner = svgEl.innerHTML ?? '';
      const ratioW = vbW / vbH;
      const ratioH = vbH / vbW;

      if (ratioW <= maxAspectRatio && ratioH <= maxAspectRatio) return null;

      const sliceAlongX = ratioW >= ratioH;
      const idealSlices = sliceAlongX
        ? Math.ceil(ratioW / maxAspectRatio)
        : Math.ceil(ratioH / maxAspectRatio);
      const sliceCount = Math.min(Math.max(2, idealSlices), maxSlices);

      if (sliceAlongX) {
        const sliceW = vbW / sliceCount;
        return Array.from({ length: sliceCount }, (_, idx) => {
          const x = minX + idx * sliceW;
          const sliceViewBox = `${x} ${minY} ${sliceW} ${vbH}`;
          return normalizeOptimizationSvg(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sliceViewBox}">${inner}</svg>`
          );
        });
      }

      const sliceH = vbH / sliceCount;
      return Array.from({ length: sliceCount }, (_, idx) => {
        const y = minY + idx * sliceH;
        const sliceViewBox = `${minX} ${y} ${vbW} ${sliceH}`;
        return normalizeOptimizationSvg(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sliceViewBox}">${inner}</svg>`
        );
      });
    } catch {
      return null;
    }
  };

  const zoomSvgSlices = useMemo(() => {
    if (!svgZoomPreview?.svg) return null;
    return buildOptimizationSvgSlices(svgZoomPreview.svg);
  }, [svgZoomPreview?.svg]);

  const renderOptimizationSection = (item: CommandeItem) => {
    const isCurrent = optimizationItemId === item.id;
    const comparison = isCurrent ? optimizationComparison : null;
    const isLoading = isCurrent && optimizationLoading;
    const errorText = isCurrent ? optimizationError : null;

    const actual = comparison?.actualMetrics;
    const suggested = comparison?.suggested?.metrics;
    const actualConforme = item.totalItemsConforme ?? 0;
    const actualNonConforme = item.totalItemsNonConforme ?? 0;

    type PrintInfo = {
      leftRows: { label: string; value: string }[];
      rightRows: { label: string; value: string }[];
      sources?: any[];
      placements?: any[];
    };

    const printServerGeneratedLayout = async (variant: 'actual' | 'suggested') => {
      if (!optimizationItemId) {
        return;
      }

      try {
        const blob = await CommandeService.printOptimization(optimizationItemId, variant, i18n.language || 'fr');
        const url = URL.createObjectURL(blob);
        const opened = window.open(url, '_blank');
        if (!opened) {
          window.location.href = url;
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        console.error('Failed to generate server print document', err);
        toastRef.current?.show({
          severity: 'error',
          summary: t('common.error') || 'Error',
          detail: t('messages.operationFailed') || 'Failed to generate print document',
        });
      }
    };



    const renderSvgPanel = (
      title: string,
      variant: 'actual' | 'suggested',
      svg?: string | null,
      emptyMessage?: string,
      info?: PrintInfo
    ) => {
      void info;
      const svgSlices = svg ? buildOptimizationSvgSlices(svg) : null;
      const isSliced = Array.isArray(svgSlices) && svgSlices.length > 1;
      return (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{title}</span>
              {svg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Button
                    icon="pi pi-search-plus"
                    text
                    size="small"
                    tooltip={t('common.enlarge') || 'Enlarge'}
                    tooltipOptions={{ position: 'left' }}
                    onClick={() => setSvgZoomPreview({ title, svg })}
                  />
                  <Button
                    icon="pi pi-print"
                    text
                    size="small"
                    tooltip={t('common.print') || 'Print'}
                    tooltipOptions={{ position: 'left' }}
                    onClick={() => void printServerGeneratedLayout(variant)}
                  />
                </div>
              )}
            </div>
          }
          className="albel-svg-card"
          style={{ minHeight: '280px' }}
        >
          {svg ? (
            <div
              className={`albel-svg-viewer${isSliced ? ' albel-svg-viewer--sliced' : ''}`}
              style={{
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-card)',
                padding: '0.5rem',
              }}
            >
              {isSliced ? (
                <div className="albel-svg-slices">
                  {svgSlices!.map((slice, idx) => (
                    <div
                      key={`${variant}-slice-${idx}`}
                      className="albel-svg-slice"
                      dangerouslySetInnerHTML={{ __html: slice }}
                    />
                  ))}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: normalizeOptimizationSvg(svg) }} />
              )}
            </div>
          ) : (
            <Message severity="info" text={emptyMessage ?? t('messages.noDataAvailable')} />
          )}
        </Card>
      );
    };



    return (
      <div style={{ marginTop: '0.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ fontWeight: 600 }}>{t('commandes.optimizationComparison')}</div>
          <Button
            label={t('commandes.regenerateSuggestion')}
            icon="pi pi-refresh"
            severity="secondary"
            onClick={() => loadOptimizationForItem(item.id, true)}
            disabled={isBusy || isCommandeLocked || isLoading}
            loading={isLoading}
          />
        </div>

        {errorText && <Message severity="error" text={errorText} style={{ marginBottom: '0.5rem' }} />}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <ProgressSpinner />
          </div>
        )}

        {!isLoading && !comparison && (
          <Message severity="info" text={t('commandes.noOptimizationSuggestion')} />
        )}

        {!isLoading && comparison && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <Card>
              <div className="albel-compare-grid">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.metric')}</div>
                  <div>{t('commandes.usedAreaM2')}</div>
                  <div>{t('commandes.wasteAreaM2')}</div>
                  <div>{t('commandes.utilizationPct')}</div>
                  <div>{t('commandes.sources')}</div>
                  <div>{t('commandes.pieces')}</div>
                  <div>{t('commandes.conformePieces')}</div>
                  <div>{t('commandes.nonConformePieces')}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.actual')}</div>
                  <div>{formatMetricValue(actual?.usedAreaM2)}</div>
                  <div>{formatMetricValue(actual?.wasteAreaM2)}</div>
                  <div>{formatMetricValue(actual?.utilizationPct)}</div>
                  <div>{actual?.sourceCount ?? '-'}</div>
                  <div>{actual?.placedPieces ?? '-'}/{actual?.totalPieces ?? '-'}</div>
                  <div>{actualConforme}</div>
                  <div>{actualNonConforme}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.suggested')}</div>
                  <div>{formatMetricValue(suggested?.usedAreaM2)}</div>
                  <div>{formatMetricValue(suggested?.wasteAreaM2)}</div>
                  <div>{formatMetricValue(suggested?.utilizationPct)}</div>
                  <div>{suggested?.sourceCount ?? '-'}</div>
                  <div>{suggested?.placedPieces ?? '-'}/{suggested?.totalPieces ?? '-'}</div>
                  <div>-</div>
                  <div>-</div>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>{t('commandes.wasteSavedM2')}: {formatMetricValue(comparison.wasteSavedM2)}</div>
                <div>{t('commandes.utilizationGainPct')}: {formatMetricValue(comparison.utilizationGainPct)}</div>
              </div>
            </Card>

            <div className="albel-grid albel-grid--min280" style={{ gap: '0.75rem' }}>
              {renderSvgPanel(t('commandes.actualLayout'), 'actual', comparison.actualSvg, t('commandes.noActualSvg'), {
                leftRows: [
                  { label: t('commandes.material') || 'Material', value: item.materialType },
                  { label: t('commandes.plies') || 'Plies', value: String(item.nbPlis) },
                  { label: t('commandes.thickness') || 'Thickness', value: `${item.thicknessMm} mm` },
                ],
                rightRows: [
                  { label: t('commandes.cutting') || 'Cutting', value: `${item.longueurM} m × ${item.largeurMm} mm` },
                  { label: t('commandes.qty') || 'Qty', value: String(item.quantite) },
                  { label: t('commandes.usedAreaM2') || 'Used area', value: `${formatMetricValue(actual?.usedAreaM2)} m²` },
                ],
                sources: comparison.actualSources ?? [],
                placements: comparison.actualPlacements ?? [],
              })}
              {renderSvgPanel(t('commandes.suggestedLayout'), 'suggested', comparison.suggested?.svg, t('commandes.noSuggestedSvg'), {
                leftRows: [
                  { label: t('commandes.material') || 'Material', value: item.materialType },
                  { label: t('commandes.plies') || 'Plies', value: String(item.nbPlis) },
                  { label: t('commandes.thickness') || 'Thickness', value: `${item.thicknessMm} mm` },
                ],
                rightRows: [
                  { label: t('commandes.cutting') || 'Cutting', value: `${item.longueurM} m × ${item.largeurMm} mm` },
                  { label: t('commandes.utilizationPct') || 'Utilization', value: `${formatMetricValue(suggested?.utilizationPct)} %` },
                  { label: t('commandes.pieces') || 'Pieces', value: `${suggested?.placedPieces ?? '-'} / ${suggested?.totalPieces ?? '-'}` },
                ],
                sources: comparison.suggested?.sources ?? [],
                placements: comparison.suggested?.placements ?? [],
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderItemCommonSection = (item: CommandeItem) => {
    const totalConforme = item.totalItemsConforme ?? 0;
    const totalNonConforme = item.totalItemsNonConforme ?? 0;
    const totalProduced = totalConforme + totalNonConforme;
    const remaining = Math.max(0, item.quantite - totalProduced);
    const over = Math.max(0, totalProduced - item.quantite);

    return (
      <Card title={t('commandes.common') || 'Common'}>
        <div className="albel-compare-grid">
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.metric')}</div>
            <div>{t('commandes.material') || 'Material'}</div>
            <div>{t('commandes.plies') || 'Plies'}</div>
            <div>{t('commandes.thickness') || 'Thickness'}</div>
            <div>{t('commandes.lengthM') || 'Length'}</div>
            <div>{t('commandes.widthMm') || 'Width'}</div>
            <div>{t('commandes.qty') || 'Qty'}</div>
            <div>{t('commandes.itemsConforme')}</div>
            <div>{t('commandes.itemsNonConforme')}</div>
            <div>{t('commandes.itemsRemaining')}</div>
            <div>{t('commandes.itemsOver')}</div>
            <div>{t('commandes.status') || 'Status'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('common.details') || 'Details'}</div>
            <div>{item.materialType || '-'}</div>
            <div>{item.nbPlis ?? '-'}</div>
            <div>{item.thicknessMm != null ? `${item.thicknessMm} mm` : '-'}</div>
            <div>{item.longueurM != null ? `${item.longueurM} m` : '-'}</div>
            <div>{item.largeurMm != null ? `${item.largeurMm} mm` : '-'}</div>
            <div>{item.quantite ?? '-'}</div>
            <div>{totalConforme}</div>
            <div>{totalNonConforme}</div>
            <div>{remaining}</div>
            <div>{over}</div>
            <div>{item.status || '-'}</div>
          </div>
        </div>
      </Card>
    );
  };

  const getContrastTextColor = (hexColor?: string) => {
    if (!hexColor) return 'inherit';
    const normalized = hexColor.replace('#', '').trim();
    if (normalized.length !== 3 && normalized.length !== 6) return 'inherit';

    const fullHex = normalized.length === 3
      ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
      : normalized;

    const r = parseInt(fullHex.slice(0, 2), 16) / 255;
    const g = parseInt(fullHex.slice(2, 4), 16) / 255;
    const b = parseInt(fullHex.slice(4, 6), 16) / 255;
    if ([r, g, b].some((value) => Number.isNaN(value))) return 'inherit';

    const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
    return luminance > 0.6 ? '#000000' : '#ffffff';
  };

  const orderItems = commande?.items ?? [];
  const filteredItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();
    if (!query) return orderItems;

    return orderItems.filter((item) => {
      const haystack = [
        item.lineNumber ? `line ${item.lineNumber}` : '',
        item.reference ?? '',
        item.materialType ?? '',
        item.colorName ?? '',
        item.typeMouvement ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orderItems, itemSearchQuery]);

  const selectedItem = useMemo(
    () => orderItems.find((item) => item.id === selectedItemId) ?? null,
    [orderItems, selectedItemId]
  );

  const orderTotals = useMemo(
    () =>
      orderItems.reduce(
        (summary, item) => {
          const progress = getItemProgress(item);
          summary.lines += 1;
          summary.ordered += item.quantite ?? 0;
          summary.produced += progress.produced;
          summary.remaining += progress.remaining;
          return summary;
        },
        { lines: 0, ordered: 0, produced: 0, remaining: 0 }
      ),
    [orderItems]
  );

  const selectedItemProgress = selectedItem ? getItemProgress(selectedItem) : null;
  const selectedActualSources = summarizeOptimizationSources(optimizationComparison?.actualSources);
  const selectedSuggestedSources = summarizeOptimizationSources(optimizationComparison?.suggested?.sources);

  if (loading) {
    return (
      <div className="commande-detail-page commande-detail-page--loading">
        <ProgressSpinner />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="commande-detail-page">
        <Message severity="warn" text={t('commandes.notFound')} style={{ marginBottom: '1rem' }} />
        <Button label={t('commandes.backToOrders')} onClick={() => navigate('/commandes')} />
      </div>
    );
  }

  return (
    <div className="commande-detail-page">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <div className="commande-detail-shell">
        <OrderHeaderCard
          commande={commande}
          isBusy={isBusy}
          deletingOrder={deletingOrder}
          getStatusSeverity={getStatusSeverity}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onReturn={handleReturnOrder}
          onBack={() => navigate('/commandes')}
          t={t}
        />

        <div className="commande-detail-overview">
          <div className="commande-detail-overview__main">
            <OrderInfoCard commande={commande} t={t} />

            <div className="commande-detail-summary-grid">
              <div className="commande-detail-summary-card">
                <span className="commande-detail-summary-card__label">Order lines</span>
                <strong>{orderTotals.lines}</strong>
              </div>
              <div className="commande-detail-summary-card">
                <span className="commande-detail-summary-card__label">Pieces ordered</span>
                <strong>{orderTotals.ordered}</strong>
              </div>
              <div className="commande-detail-summary-card">
                <span className="commande-detail-summary-card__label">Produced</span>
                <strong>{orderTotals.produced}</strong>
              </div>
              <div className="commande-detail-summary-card">
                <span className="commande-detail-summary-card__label">Still to cut</span>
                <strong>{orderTotals.remaining}</strong>
              </div>
            </div>
          </div>

          <div className="commande-detail-overview__side">
            <Card className="commande-detail-card" title={t('rollDetail.workshop')}>
              <div className="commande-detail-form-stack">
                <Dropdown
                  options={altierScores.map((s) => ({
                    label: `${s.altierLibelle} (${Number(s.coveragePct).toFixed(1)}%)`,
                    value: s.altierId,
                  }))}
                  value={selectedAltierId}
                  onChange={(e) => setSelectedAltierId(e.value)}
                  placeholder={t('inventory.selectWorkshop')}
                  showClear
                  disabled={altierScoresLoading || altierSaving || isCommandeLocked}
                  className="commande-detail-input-full"
                />

                <div className="commande-detail-actions-end">
                  <Button
                    label={altierSaving ? t('common.saving') : t('common.save')}
                    icon="pi pi-check"
                    onClick={handleAltierSave}
                    disabled={altierSaving || isCommandeLocked}
                  />
                </div>
              </div>
            </Card>

            <StatusUpdateCard
              selectedStatus={selectedStatus}
              statusOptions={statusOptions}
              updating={updating}
              currentStatus={commande.status}
              disabled={isCommandeLocked}
              onStatusChange={(nextStatus) => setSelectedStatus(nextStatus)}
              onUpdate={handleStatusUpdate}
              t={t}
            />
          </div>
        </div>

        {error && <Message severity="error" text={error} style={{ marginBottom: '1rem' }} />}

        <Card className="commande-detail-workspace-card">
          {!orderItems.length ? (
            <Message severity="info" text={t('commandes.noItems')} />
          ) : (
            <div className="commande-detail-workspace">
              <aside className="commande-detail-sidebar">
                <div className="commande-detail-sidebar__header">
                  <div>
                    <h2 className="commande-detail-sidebar__title">Items to process</h2>
                    <p className="commande-detail-sidebar__subtitle">
                      Pick one item to see its cut plan, material source, production, and leftovers.
                    </p>
                  </div>
                  <span className="commande-detail-sidebar__count">
                    {filteredItems.length}/{orderItems.length}
                  </span>
                </div>

                <span className="p-input-icon-left commande-detail-search">
                  <i className="pi pi-search" />
                  <InputText
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search line, ref, material"
                  />
                </span>

                <div className="commande-detail-item-list">
                  {filteredItems.length === 0 ? (
                    <Message severity="info" text="No items match this search." />
                  ) : (
                    filteredItems.map((item: CommandeItem) => {
                      const progress = getItemProgress(item);
                      const isSelected = item.id === selectedItemId;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`commande-detail-item-card${isSelected ? ' is-selected' : ''}`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          <div className="commande-detail-item-card__topline">
                            <span className="commande-detail-item-card__eyebrow">{getItemDisplayLabel(item)}</span>
                            <Tag
                              value={t(`statuses.${item.status}`)}
                              severity={getStatusSeverity(item.status)}
                            />
                          </div>

                          <div
                            className="commande-detail-item-card__material"
                            style={{
                              backgroundColor: item.colorHexCode || '#f4efe5',
                              color: getContrastTextColor(item.colorHexCode),
                            }}
                          >
                            <strong>{item.materialType}</strong>
                            <span>
                              {item.nbPlis}P • {item.thicknessMm} mm • {item.longueurM} m x {item.largeurMm} mm
                            </span>
                          </div>

                          <div className="commande-detail-item-card__stats">
                            <div>
                              <span>Qty</span>
                              <strong>{item.quantite}</strong>
                            </div>
                            <div>
                              <span>Done</span>
                              <strong>{progress.produced}</strong>
                            </div>
                            <div>
                              <span>Left</span>
                              <strong>{progress.remaining}</strong>
                            </div>
                          </div>

                          <div className="commande-detail-item-card__footer">
                            <Tag value={item.typeMouvement} severity="info" />
                            {progress.over > 0 ? <Tag value={`Over ${progress.over}`} severity="danger" /> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="commande-detail-main">
                {selectedItem ? (
                  <>
                    <div className="commande-detail-main__hero">
                      <div className="commande-detail-main__hero-copy">
                        <span className="commande-detail-main__eyebrow">Selected item</span>
                        <h2>{getItemDisplayLabel(selectedItem)}</h2>
                        <p>
                          Operators can verify the cut need, then move through placement, production, and leftover
                          recording without changing screens.
                        </p>
                      </div>

                      <div className="commande-detail-main__hero-actions">
                        <Dropdown
                          value={selectedItem.status}
                          options={itemStatusOptions}
                          onChange={(e) => handleItemStatusUpdate(selectedItem.id, e.value as ItemStatus)}
                          className="commande-detail-main__status-dropdown"
                          disabled={isBusy || isCommandeLocked}
                        />
                        <Button
                          icon="pi pi-trash"
                          label={t('commandes.delete')}
                          severity="danger"
                          outlined
                          onClick={() => handleDeleteItem(selectedItem.id)}
                          disabled={isBusy || isCommandeLocked}
                          loading={deletingItemId === selectedItem.id}
                        />
                      </div>
                    </div>

                    <div className="commande-detail-main__pills">
                      <span
                        className="commande-detail-main__material-pill"
                        style={{
                          backgroundColor: selectedItem.colorHexCode || '#f4efe5',
                          color: getContrastTextColor(selectedItem.colorHexCode),
                        }}
                      >
                        {selectedItem.materialType} • {selectedItem.nbPlis}P • {selectedItem.thicknessMm} mm
                      </span>
                      <Tag value={selectedItem.typeMouvement} severity="info" />
                      <Tag value={t(`statuses.${selectedItem.status}`)} severity={getStatusSeverity(selectedItem.status)} />
                    </div>

                    <div className="commande-detail-main__stats-grid">
                      <div className="commande-detail-kpi-card">
                        <span>Pieces ordered</span>
                        <strong>{selectedItem.quantite}</strong>
                      </div>
                      <div className="commande-detail-kpi-card">
                        <span>Produced</span>
                        <strong>{selectedItemProgress?.produced ?? 0}</strong>
                      </div>
                      <div className="commande-detail-kpi-card">
                        <span>Still to cut</span>
                        <strong>{selectedItemProgress?.remaining ?? 0}</strong>
                      </div>
                      <div className="commande-detail-kpi-card">
                        <span>Current material use</span>
                        <strong>{selectedActualSources.rolls} rolls / {selectedActualSources.chutes} chutes</strong>
                      </div>
                      <div className="commande-detail-kpi-card">
                        <span>Suggested material use</span>
                        <strong>{selectedSuggestedSources.rolls} rolls / {selectedSuggestedSources.chutes} chutes</strong>
                      </div>
                      <div className="commande-detail-kpi-card">
                        <span>Cut size</span>
                        <strong>{selectedItem.longueurM} m x {selectedItem.largeurMm} mm</strong>
                      </div>
                    </div>

                    <TabView
                      className="albel-item-detail-tabs commande-detail-tabs"
                      activeIndex={activeItemDetailTabIndex}
                      onTabChange={(e) => setActiveItemDetailTabIndex(e.index)}
                    >
                      <TabPanel header="Cut need">
                        {renderItemCommonSection(selectedItem)}
                      </TabPanel>
                      <TabPanel header="Material plan">
                        {renderOptimizationSection(selectedItem)}
                      </TabPanel>
                      <TabPanel header="Cut areas">
                        {renderPlacementSection(selectedItem)}
                      </TabPanel>
                      <TabPanel header="Produced pieces">
                        <ProductionSection
                          productionForItem={productionForItem}
                          placementsForItem={placementsForItem}
                          t={t}
                          isBusy={isBusy || isCommandeLocked}
                          onDeleteProduction={(productionItemId) => handleDeleteProductionItem(productionItemId, selectedItem.id)}
                        />
                      </TabPanel>
                      <TabPanel header="Reusable leftovers">
                        <WasteSection
                          wasteForItem={wasteForItem}
                          onCreateChute={() => handleOpenChuteModal(selectedItem)}
                          isBusy={isBusy || isCommandeLocked}
                          t={t}
                        />
                      </TabPanel>
                    </TabView>
                  </>
                ) : (
                  <Message severity="info" text="Select an item to continue." />
                )}
              </section>
            </div>
          )}
        </Card>
      </div>

      <ChuteDialog
        chuteTargetItem={chuteTargetItem}
        showChuteForm={showChuteForm}
        onHide={handleCloseChuteModal}
        t={t}
        disabled={isCommandeLocked}
        chuteSourceType={chuteSourceType}
        chuteSourceOptions={chuteSourceOptions}
        onSourceTypeChange={(value) => {
          setChuteSourceType(value as 'ROLL' | 'WASTE_PIECE');
          setChuteRollId('');
          setParentWastePieceId('');
          setChutePlacementId('');
          setChutePlacements([]);
          setChuteDimensions({ widthMm: 0, lengthM: 0, areaM2: 0 });
        }}
        chuteRollId={chuteRollId}
        chuteRollOptions={chuteRollOptions}
        onRollChange={(value) => {
          setChuteRollId(value);
          setChutePlacementId('');
        }}
        parentWastePieceId={parentWastePieceId}
        chuteParentOptions={chuteParentOptions}
        onParentWasteChange={(value) => {
          setParentWastePieceId(value);
          setChutePlacementId('');
        }}
        parentWastePiecesLoading={parentWastePiecesLoading}
        chutePlacementId={chutePlacementId}
        chutePlacementOptions={chutePlacementOptions}
        onPlacementChange={(value) => setChutePlacementId(value)}
        chutePlacementsLoading={chutePlacementsLoading}
        renderRollOption={renderRollOption}
        chuteSource={chuteSource}
        chuteDimensions={chuteDimensions}
        onDimensionChange={updateChuteDimension}
        onCreate={handleCreateChute}
        creatingChute={creatingChute}
      />

      <PlacementDialog
        showPlacementModal={showPlacementModal}
        editingPlacementId={editingPlacementId}
        placementTargetItem={placementTargetItem}
        onHide={handleClosePlacementModal}
        t={t}
        disabled={isCommandeLocked}
        placementForm={placementForm}
        placementSourceOptionsDialog={placementSourceOptionsDialog}
        onSourceTypeChange={(value) => {
          setPlacementForm((prev) => ({
            ...prev,
            sourceType: value as 'ROLL' | 'WASTE_PIECE',
            sourceId: '',
          }));
        }}
        placementRollOptionsDialog={placementRollOptionsDialog}
        placementWasteOptionsDialog={placementWasteOptionsDialog}
        renderRollOption={renderRollOption}
        onSourceIdChange={(value) => updatePlacementField('sourceId', value)}
        rolls={rolls}
        wasteForItem={wasteForItem}
        placementsForItem={placementsForItem}
        onFieldChange={(name, value) => updatePlacementField(name, value)}
        onSave={handleSavePlacement}
        creatingPlacement={creatingPlacement}
      />

      <PlacementPreviewDialog
        showPlacementPreview={showPlacementPreview}
        onHide={handleClosePlacementPreview}
        previewPlacement={previewPlacement}
        placementsForItem={placementsForItem}
      />

      <ProductionDialog
        productionTargetItem={productionTargetItem}
        showProductionModal={showProductionModal}
        onHide={handleCloseProductionModal}
        t={t}
        disabled={isCommandeLocked}
        selectedProductionColorHex={selectedProductionColorHex}
        selectedProductionColorName={selectedProductionColorName}
        selectedProductionLabel={selectedProductionLabel}
        productionForm={productionForm}
        onFieldChange={(name, value) => updateProductionField(name, value)}
        onSave={handleCreateProductionItem}
        creatingProduction={creatingProduction}
      />

      <Dialog
        header={svgZoomPreview?.title ?? ''}
        visible={!!svgZoomPreview}
        modal
        dismissableMask
        maximizable
        style={{ width: 'min(1100px, 95vw)' }}
        onHide={() => setSvgZoomPreview(null)}
      >
        {svgZoomPreview?.svg && (
          <div
            className={`albel-svg-viewer albel-svg-viewer--zoom${
              zoomSvgSlices && zoomSvgSlices.length > 1 ? ' albel-svg-viewer--sliced' : ''
            }`}
            style={{
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-card)',
              padding: '0.5rem',
            }}
          >
            {zoomSvgSlices && zoomSvgSlices.length > 1 ? (
              <div className="albel-svg-slices">
                {zoomSvgSlices.map((slice, idx) => (
                  <div
                    key={`zoom-slice-${idx}`}
                    className="albel-svg-slice"
                    dangerouslySetInnerHTML={{ __html: slice }}
                  />
                ))}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: normalizeOptimizationSvg(svgZoomPreview.svg) }} />
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default CommandeDetailPage;
