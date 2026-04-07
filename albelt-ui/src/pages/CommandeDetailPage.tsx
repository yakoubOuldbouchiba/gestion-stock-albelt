import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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
import type {
  Commande,
  CommandeItem,
  ItemStatus,
  PlacedRectangle,
  ProductionItem,
  Roll,
} from '../types';

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [rollsLoading, setRollsLoading] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [wasteForItem, setWasteForItem] = useState<any[]>([]);
  const [productionForItem, setProductionForItem] = useState<ProductionItem[]>([]);
  const [placementsForItem, setPlacementsForItem] = useState<PlacedRectangle[]>([]);
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

  const [productionForm, setProductionForm] = useState({
    placedRectangleId: '',
    pieceLengthM: '',
    pieceWidthMm: '',
    quantity: '',
    notes: '',
  });

  const statuses = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const itemStatuses: ItemStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

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
    if (showChuteForm && chuteSourceType === 'WASTE_PIECE') {
      loadParentWastePieces();
    }
  }, [showChuteForm, chuteSourceType]);

  useEffect(() => {
    const needsRolls = showPlacementModal || (showChuteForm && chuteSourceType === 'ROLL');
    if (!needsRolls || rolls.length > 0) return;
    loadRolls();
  }, [showPlacementModal, showChuteForm, chuteSourceType, rolls.length]);

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

  const handleStatusUpdate = async () => {
    if (!commande || !id) return;

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

  const handleItemStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    if (!commande) return;

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

  const handleDeleteItem = (itemId: string) => {
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
    if (commande?.id) {
      navigate(`/commandes/${commande.id}/edit`);
    }
  };

  const handleReturnOrder = () => {
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
      // Fetch waste for this specific commande item
      const response = await WastePieceService.getAll();
      if (response.data) {
        const wastes = Array.isArray(response.data)
          ? response.data
          : (response.data as any).items || [];
        const itemWaste = wastes.filter((w: any) => w.commandeItemId === itemId);
        setWasteForItem(itemWaste);
      }
    } catch (err) {
      console.error('Error loading waste:', err);
    }
  };

  const loadRolls = async () => {
    if (rollsLoading) return;
    setRollsLoading(true);
    try {
      const rollsRes = await RollService.getAll();
      if (rollsRes.data) {
        const rollItems = Array.isArray(rollsRes.data)
          ? rollsRes.data
          : (rollsRes.data as any).items ?? (rollsRes.data as any).content ?? [];
        setRolls(rollItems);
      }
    } catch (err) {
      console.error('Error loading rolls:', err);
    } finally {
      setRollsLoading(false);
    }
  };

  const loadParentWastePieces = async () => {
    setParentWastePiecesLoading(true);
    try {
      const response = await WastePieceService.getAll({
        page: 0,
        size: 200,
        status: 'AVAILABLE',
      });
      if (response.data) {
        const items = Array.isArray(response.data) ? response.data : response.data.items || [];
        setParentWastePieces(items);
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
      showError('Placement source not found.');
      return false;
    }

    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      showError('Placement dimensions are required.');
      return false;
    }

    const sourceWidth = Number(source.widthMm) || 0;
    const sourceLengthMm = Math.round((Number(source.lengthM) || 0) * 1000);
    if (sourceWidth <= 0 || sourceLengthMm <= 0) {
      showError('Source dimensions are required for placement.');
      return false;
    }

    if (xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0) {
      showError('Placement values must be positive.');
      return false;
    }

    if (xMm >= sourceWidth || yMm >= sourceLengthMm || xMm + widthMm > sourceWidth || yMm + heightMm > sourceLengthMm) {
      showError('Placement is outside the source bounds.');
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
      showError('Placement overlaps an existing rectangle.');
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
      setPlacementForm((prev) => ({
        ...prev,
        xMm: '',
        yMm: '',
        widthMm: '',
        heightMm: '',
      }));
      setEditingPlacementId(null);
      showSuccess(isEditing ? 'Placement updated.' : 'Placement saved.');
      didSucceed = true;
    } catch (err) {
      console.error('Error creating placement:', err);
      showError(isEditing ? 'Unable to update placement.' : 'Unable to save placement.');
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
    if (!placementTargetItem) {
      showError('Placement item is required.');
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
    confirmDialog({
      message: 'Delete this placement?',
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await PlacedRectangleService.delete(placementId);
          await loadPlacementsForItem(itemId);
          if (editingPlacementId === placementId) {
            resetPlacementForm();
          }
          showSuccess('Placement deleted.');
        } catch (err) {
          console.error('Error deleting placement:', err);
          showError('Unable to delete placement.');
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
      showError('Select a placement before creating a chute.');
      return;
    }
    const chuteLengthMm = chuteDimensions.lengthM * 1000;
    if (chuteDimensions.widthMm > selectedPlacement.widthMm || chuteLengthMm > selectedPlacement.heightMm) {
      showError('Chute dimensions exceed the selected placement.');
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

  const toggleItemDetails = (item: CommandeItem) => {
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      setPlacementsForItem([]);
      resetPlacementForm();
      return;
    }
    setExpandedItemId(item.id);
    loadWasteForItem(item.id);
    loadProductionForItem(item.id);
    loadPlacementsForItem(item.id);
    resetPlacementForm();
  };

  const handleOpenProductionModal = (item: CommandeItem, placementId: string) => {
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
      warnings.push(`piece_width_mm exceeds placed rectangle width (${placementWidth} mm)`);
    }
    if (placementHeight !== null && pieceLength * 1000 > placementHeight) {
      warnings.push(`piece_length_m exceeds placed rectangle length (${placementHeight} mm)`);
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

  const statusOptions = statuses.map((status) => ({ label: status, value: status }));
  const itemStatusOptions = itemStatuses.map((status) => ({ label: status, value: status }));
  const isBusy =
    updating ||
    creatingProduction ||
    creatingChute ||
    creatingPlacement ||
    deletingOrder ||
    deletingItemId !== null ||
    updatingItemStatusId !== null;

  const rollOptionsBase = rolls.map((roll) => {
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

  const filterRollOptions = (materialType?: string) =>
    rollOptionsBase.filter((option) => !materialType || option.materialType === materialType);

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

  const chuteRollOptions = filterRollOptions(chuteTargetItem?.materialType);
  const chuteParentOptions = parentWastePieces
    .filter((piece: any) => !chuteTargetItem || piece.materialType === chuteTargetItem.materialType)
    .map((piece: any) => ({
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

  const placementRollOptionsDialog = filterRollOptions(placementTargetItem?.materialType);
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
        />
        <Button
          label={t('common.edit')}
          icon="pi pi-pencil"
          text
          onClick={() => handleOpenEditPlacementModal(item, placement)}
        />
        <Button
          label={t('common.delete')}
          icon="pi pi-trash"
          severity="danger"
          text
          onClick={() => handleDeletePlacement(placement.id, item.id)}
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
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Placements (SVG)</div>
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
              <div style={{ fontWeight: 600 }}>Existing placements</div>
              <Button
                label="Add placement"
                icon="pi pi-plus"
                severity="secondary"
                onClick={() => handleOpenPlacementModal(item)}
                disabled={isBusy}
              />
            </div>
              <DataTable
                value={placementRows}
                dataKey="id"
                emptyMessage="No placements recorded for this item."
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
                <Column header="Source" body={renderPlacementSource} />
                <Column field="xMm" header="X (mm)" />
                <Column field="yMm" header="Y (mm)" />
                <Column field="widthMm" header="Width (mm)" />
                <Column field="heightMm" header="Height (mm)" />
                <Column header="Color" body={renderPlacementColor} />
                <Column header="Actions" body={renderPlacementActions} />
              </DataTable>
          </div>

        </div>
      </div>
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

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!commande) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Message severity="warn" text={t('commandes.notFound')} style={{ marginBottom: '1rem' }} />
        <Button label={t('commandes.backToOrders')} onClick={() => navigate('/commandes')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Toast ref={toastRef} />
      <ConfirmDialog />

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

      {error && <Message severity="error" text={error} style={{ marginBottom: '1rem' }} />}

      <OrderInfoCard commande={commande} t={t} />

      <StatusUpdateCard
        selectedStatus={selectedStatus}
        statusOptions={statusOptions}
        updating={updating}
        currentStatus={commande.status}
        onStatusChange={(nextStatus) => setSelectedStatus(nextStatus)}
        onUpdate={handleStatusUpdate}
        t={t}
      />

      <Card title={`${t('commandes.orderItems')} (${commande.items?.length || 0})`}>
        {!commande.items || commande.items.length === 0 ? (
          <Message severity="info" text={t('commandes.noItems')} />
        ) : (
          <div>
            {commande.items.map((item: CommandeItem) => {
              const totalConforme = item.totalItemsConforme ?? 0;
              const totalNonConforme = item.totalItemsNonConforme ?? 0;
              const totalProduced = totalConforme + totalNonConforme;
              const remaining = Math.max(0, item.quantite - totalProduced);
              const over = Math.max(0, totalProduced - item.quantite);

              return (
                <Card key={item.id} style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        flex: '1 1 240px',
                        backgroundColor: item.colorHexCode ? item.colorHexCode : 'transparent',
                        color: item.colorHexCode ? getContrastTextColor(item.colorHexCode) : 'inherit',
                        padding: '0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{item.materialType}</div>
                      <div style={{ fontSize: '0.9rem' }}>
                        {item.nbPlis}P | {item.thicknessMm}mm | {item.longueurM}m x {item.largeurMm}mm
                      </div>
                    </div>
                    <div style={{ minWidth: '90px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.qty')}</div>
                      <div>{item.quantite}</div>
                    </div>
                    <div style={{ minWidth: '150px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.itemsConforme')}</div>
                      <div>{totalConforme}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.35rem' }}>
                        {t('commandes.itemsNonConforme')}
                      </div>
                      <div>{totalNonConforme}</div>
                    </div>
                    <div style={{ minWidth: '140px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.itemsRemaining')}</div>
                      <div>{remaining}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.35rem' }}>
                        {t('commandes.itemsOver')}
                      </div>
                      <div>{over}</div>
                    </div>
                    <Dropdown
                      value={item.status}
                      options={itemStatusOptions}
                      onChange={(e) => handleItemStatusUpdate(item.id, e.value as ItemStatus)}
                      style={{ minWidth: '180px' }}
                      disabled={isBusy}
                    />
                    <Tag value={item.typeMouvement} severity="info" />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button
                        label={expandedItemId === item.id ? t('commandes.hide') : t('commandes.show')}
                        icon={expandedItemId === item.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
                        outlined
                        onClick={() => toggleItemDetails(item)}
                        disabled={isBusy}
                      />
                      <Button
                        icon="pi pi-trash"
                        label={t('commandes.delete')}
                        severity="danger"
                        outlined
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isBusy}
                        loading={deletingItemId === item.id}
                      />
                    </div>
                  </div>

                {expandedItemId === item.id && (
                  <div style={{ marginTop: '1rem' }}>
                    <WasteSection
                      wasteForItem={wasteForItem}
                      onCreateChute={() => handleOpenChuteModal(item)}
                      isBusy={isBusy}
                      t={t}
                    />

                    <ProductionSection
                      productionForItem={productionForItem}
                      placementsForItem={placementsForItem}
                      t={t}
                    />

                    {renderPlacementSection(item)}
                  </div>
                )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <ChuteDialog
        chuteTargetItem={chuteTargetItem}
        showChuteForm={showChuteForm}
        onHide={handleCloseChuteModal}
        t={t}
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
        selectedProductionColorHex={selectedProductionColorHex}
        selectedProductionColorName={selectedProductionColorName}
        selectedProductionLabel={selectedProductionLabel}
        productionForm={productionForm}
        onFieldChange={(name, value) => updateProductionField(name, value)}
        onSave={handleCreateProductionItem}
        creatingProduction={creatingProduction}
      />
    </div>
  );
}

export default CommandeDetailPage;
