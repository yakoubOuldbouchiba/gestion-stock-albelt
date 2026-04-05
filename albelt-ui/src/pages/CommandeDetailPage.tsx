import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { CommandeService } from '../services/commandeService';
import { WastePieceService } from '../services/wastePieceService';
import { ProductionItemService } from '../services/productionItemService';
import { formatDate, formatDateTime } from '../utils/date';
import { RollService } from '../services/rollService';
import { PlacedRectangleService } from '../services/placedRectangleService';
import { useI18n } from '@hooks/useI18n';
import type {
  Commande,
  CommandeItem,
  ItemStatus,
  PlacedRectangle,
  ProductionItem,
  Roll,
  WasteType,
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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommandeItem | null>(null);
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
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionTargetItem, setProductionTargetItem] = useState<CommandeItem | null>(null);
  const [showChuteForm, setShowChuteForm] = useState(false);
  const [chuteTargetItem, setChuteTargetItem] = useState<CommandeItem | null>(null);
  const [chuteSourceType, setChuteSourceType] = useState<'ROLL' | 'WASTE_PIECE'>('ROLL');
  const [chuteRollId, setChuteRollId] = useState('');
  const [parentWastePieceId, setParentWastePieceId] = useState('');
  const [parentWastePieces, setParentWastePieces] = useState<any[]>([]);
  const [parentWastePiecesLoading, setParentWastePiecesLoading] = useState(false);
  const [chuteDimensions, setChuteDimensions] = useState({
    widthMm: 0,
    lengthM: 0,
    areaM2: 0,
  });
  const [creatingWaste, setCreatingWaste] = useState(false);
  const [creatingProduction, setCreatingProduction] = useState(false);
  const [creatingChute, setCreatingChute] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingItemStatusId, setUpdatingItemStatusId] = useState<string | null>(null);
  
  // Roll processing form
  const [processingForm, setProcessingForm] = useState({
    rollId: '',
    lengthUsedM: '',
    widthRemainingMm: '',
    wasteType: 'DECHET' as WasteType,
    weightKg: '',
    notes: '',
  });

  const [productionForm, setProductionForm] = useState({
    sourceType: 'ROLL',
    rollId: '',
    wastePieceId: '',
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
        
        // Fetch available rolls
        const rollsRes = await RollService.getAll();
        if (rollsRes.data) {
          const rollItems = Array.isArray(rollsRes.data)
            ? rollsRes.data
            : (rollsRes.data as any).items ?? (rollsRes.data as any).content ?? [];
          setRolls(rollItems);
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

  const getStatusSeverity = (status: string) => {
    const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      PENDING: 'warning',
      ENCOURS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      ON_HOLD: 'secondary',
      IN_PROGRESS: 'info',
    };
    return severities[status] || 'secondary';
  };

  const handleOpenProcessingModal = (item: CommandeItem) => {
    setSelectedItem(item);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
    // Load waste already created for this item
    loadWasteForItem(item.id);
    setShowProcessingModal(true);
  };

  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    setSelectedItem(null);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
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
      return;
    }

    const source = isRollSource
      ? rolls.find((roll) => roll.id === sourceId)
      : wasteForItem.find((waste: any) => waste.id === sourceId);
    if (!source) {
      showError('Placement source not found.');
      return;
    }

    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      showError('Placement dimensions are required.');
      return;
    }

    const sourceWidth = Number(source.widthMm) || 0;
    const sourceLengthMm = Math.round((Number(source.lengthM) || 0) * 1000);
    if (sourceWidth <= 0 || sourceLengthMm <= 0) {
      showError('Source dimensions are required for placement.');
      return;
    }

    if (xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0) {
      showError('Placement values must be positive.');
      return;
    }

    if (xMm >= sourceWidth || yMm >= sourceLengthMm || xMm + widthMm > sourceWidth || yMm + heightMm > sourceLengthMm) {
      showError('Placement is outside the source bounds.');
      return;
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
      return;
    }

    try {
      if (creatingPlacement) return;
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
    } catch (err) {
      console.error('Error creating placement:', err);
      showError(isEditing ? 'Unable to update placement.' : 'Unable to save placement.');
    } finally {
      setCreatingPlacement(false);
    }
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

  const handleClearSourcePlacements = (group: { type: 'ROLL' | 'WASTE_PIECE'; sourceId: string }, itemId: string) => {
    confirmDialog({
      message: 'Clear all placements for this source?',
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (group.type === 'ROLL') {
            await PlacedRectangleService.clearByRoll(group.sourceId);
          } else {
            await PlacedRectangleService.clearByWastePiece(group.sourceId);
          }
          await loadPlacementsForItem(itemId);
          if (placementForm.sourceId === group.sourceId) {
            resetPlacementForm();
          }
          showSuccess('Placements cleared.');
        } catch (err) {
          console.error('Error clearing placements:', err);
          showError('Unable to clear placements.');
        }
      },
    });
  };

  const updateProcessingField = (name: keyof typeof processingForm, value: string) => {
    setProcessingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetChuteForm = () => {
    setChuteSourceType('ROLL');
    setChuteRollId('');
    setParentWastePieceId('');
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

  const handleProcessRoll = async () => {
    if (!selectedItem || !processingForm.rollId) {
      showError(t('commandes.selectRollError'));
      return;
    }

    try {
      if (creatingWaste) return;
      setCreatingWaste(true);
      const selectedRoll = rolls.find(r => r.id === processingForm.rollId);
      if (!selectedRoll) {
        showError(t('commandes.rollNotFoundError'));
        return;
      }

      const lengthUsed = parseFloat(processingForm.lengthUsedM) || 0;
      const widthRemaining = parseInt(processingForm.widthRemainingMm) || selectedRoll.widthMm;
      
      // Calculate waste dimensions
      const wasteLength = lengthUsed;
      const wasteWidth = selectedRoll.widthMm - widthRemaining;

      if (wasteWidth > 0 && wasteLength > 0) {
        // Calculate waste area (m²)
        const wasteAreaM2 = (wasteWidth / 1000) * wasteLength;

        // Create waste record with all required fields
        const wasteData = {
          rollId: processingForm.rollId,
          materialType: selectedRoll.materialType,
          nbPlis: selectedRoll.nbPlis,
          thicknessMm: selectedRoll.thicknessMm,
          widthMm: wasteWidth,
          lengthM: wasteLength,
          areaM2: wasteAreaM2,
          status: 'AVAILABLE',
          wasteType: processingForm.wasteType,
          altierID: selectedRoll.altierId,
          commandeItemId: selectedItem.id,
        };

        await WastePieceService.create(wasteData);

        // Mark roll as opened (being used)
        await RollService.updateStatus(processingForm.rollId, 'OPENED');

        // Reload data
        await loadWasteForItem(selectedItem.id);
        const res = await CommandeService.getById(id!);
        if (res.data) {
          setCommande(res.data);
        }

        setError(null);
        // Don't close modal - let operator add more waste if needed
        showSuccess(t('commandes.wasteRecordedSuccess'));
      } else {
        showError(t('commandes.invalidDimensionsError'));
      }
    } catch (err) {
      console.error('Error processing roll:', err);
      setError(t('commandes.wasteRecordError'));
      showError(t('commandes.wasteRecordError'));
    } finally {
      setCreatingWaste(false);
    }
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

  const handleOpenProductionModal = (item: CommandeItem) => {
    setProductionTargetItem(item);
    setProductionForm({
      sourceType: 'ROLL',
      rollId: '',
      wastePieceId: '',
      pieceLengthM: '',
      pieceWidthMm: '',
      quantity: '',
      notes: '',
    });
    setShowProductionModal(true);
  };

  const handleCloseProductionModal = () => {
    setShowProductionModal(false);
    setProductionTargetItem(null);
    setProductionForm({
      sourceType: 'ROLL',
      rollId: '',
      wastePieceId: '',
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

  const getProductionWarnings = (
    item: CommandeItem,
    source: any,
    pieceLength: number,
    pieceWidth: number
  ) => {
    const warnings: string[] = [];

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
      const rollColor = production.rollId
        ? getSourceColorLabel(rolls.find((roll) => roll.id === production.rollId))
        : null;
      const wasteColor = production.wastePieceId
        ? getSourceColorLabel(wasteForItem.find((waste: any) => waste.id === production.wastePieceId))
        : null;
      const color = rollColor ?? wasteColor;
      if (color) {
        existingColors.add(color);
      }
    });

    const sourceColor = getSourceColorLabel(source);
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

    const isRoll = productionForm.sourceType === 'ROLL';
    const sourceId = isRoll ? productionForm.rollId : productionForm.wastePieceId;
    if (!sourceId) {
      showError(t('commandes.productionItemSourceRequired'));
      return;
    }

    const source = isRoll
      ? rolls.find((roll) => roll.id === sourceId)
      : wasteForItem.find((waste: any) => waste.id === sourceId);
    const warnings = source
      ? getProductionWarnings(productionTargetItem, source, pieceLength, pieceWidth)
      : [];

    const saveProductionItem = async () => {
      try {
        if (creatingProduction) return;
        setCreatingProduction(true);
        await ProductionItemService.create({
          commandeItemId: productionTargetItem.id,
          rollId: isRoll ? sourceId : undefined,
          wastePieceId: isRoll ? undefined : sourceId,
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
    creatingWaste ||
    creatingProduction ||
    creatingChute ||
    creatingPlacement ||
    deletingOrder ||
    deletingItemId !== null ||
    updatingItemStatusId !== null;

  const rollOptionsBase = rolls.map((roll) => {
    const reference = roll.reference ?? (roll as any).referenceRouleau ?? t('commandes.notAvailable');
    const lengthValue = roll.lengthRemainingM ?? roll.lengthM;
    return {
      label: `${reference} - ${roll.materialType} | ${roll.nbPlis}P | ${roll.thicknessMm}mm | ${lengthValue}m x ${roll.widthMm}mm`,
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

  const processingRollOptions = filterRollOptions(selectedItem?.materialType);

  const productionSourceOptions = [
    { label: t('commandes.productionSourceRoll'), value: 'ROLL' },
    { label: t('commandes.productionSourceWaste'), value: 'WASTE' },
  ];

  const productionRollOptions = filterRollOptions(productionTargetItem?.materialType);
  const productionWasteOptions = wasteForItem
    .filter((waste: any) => !productionTargetItem || waste.materialType === productionTargetItem.materialType)
    .map((waste: any) => ({
      label: `${waste.lengthM}m x ${waste.widthMm}mm (${waste.areaM2?.toFixed(2)}m2)`,
      value: waste.id,
    }));

  const chuteSourceOptions = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const chuteRollOptions = filterRollOptions(chuteTargetItem?.materialType);
  const chuteParentOptions = parentWastePieces
    .filter((piece: any) => !chuteTargetItem || piece.materialType === chuteTargetItem.materialType)
    .map((piece: any) => ({
      label: `${piece.materialType} | ${piece.lengthM}m x ${piece.widthMm}mm (${piece.areaM2?.toFixed(2)}m2)`,
      value: piece.id,
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
    const placementSourceOptions = [
      { label: t('inventory.roll'), value: 'ROLL' },
      { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
    ];

    const placementRollOptions = filterRollOptions(item.materialType);
    const placementWasteOptions = wasteForItem
      .filter((waste: any) => waste.materialType === item.materialType)
      .map((waste: any) => ({
        label: `${waste.lengthM}m x ${waste.widthMm}mm (${waste.areaM2?.toFixed(2)}m2)`,
        value: waste.id,
      }));

    const placementSource = placementForm.sourceType === 'ROLL'
      ? rolls.find((roll) => roll.id === placementForm.sourceId)
      : wasteForItem.find((waste: any) => waste.id === placementForm.sourceId);

    const sourceWidthMm = Number(placementSource?.widthMm) || 0;
    const sourceLengthMm = Math.round((Number(placementSource?.lengthM) || 0) * 1000);
    const placementsForSource = placementsForItem.filter((placement) => (
      placementForm.sourceType === 'ROLL'
        ? placement.rollId === placementForm.sourceId
        : placement.wastePieceId === placementForm.sourceId
    ));

    const placementGroups = placementsForItem.reduce((groups, placement) => {
      const sourceId = placement.rollId ?? placement.wastePieceId;
      if (!sourceId) {
        return groups;
      }
      const type = placement.rollId ? 'ROLL' : 'WASTE_PIECE';
      const key = `${type}:${sourceId}`;
      const existing = groups.get(key);
      if (existing) {
        existing.placements.push(placement);
      } else {
        groups.set(key, { type, sourceId, placements: [placement] });
      }
      return groups;
    }, new Map<string, { type: 'ROLL' | 'WASTE_PIECE'; sourceId: string; placements: PlacedRectangle[] }>());

    const groupedPlacements = Array.from(placementGroups.values());

    const getGroupSource = (group: { type: 'ROLL' | 'WASTE_PIECE'; sourceId: string }) => (
      group.type === 'ROLL'
        ? rolls.find((roll) => roll.id === group.sourceId)
        : wasteForItem.find((waste: any) => waste.id === group.sourceId)
    );

    const getGroupLabel = (group: { type: 'ROLL' | 'WASTE_PIECE'; sourceId: string }) => {
      const source = getGroupSource(group);
      const fallback = group.sourceId.slice(0, 8);
      if (group.type === 'ROLL') {
        return `Roll ${source?.reference ?? fallback}`;
      }
      return `Waste ${source?.reference ?? fallback}`;
    };

    return (
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Placements (SVG)</div>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Source</label>
              <Dropdown
                value={placementForm.sourceType}
                options={placementSourceOptions}
                onChange={(e) => {
                  const nextType = e.value as 'ROLL' | 'WASTE_PIECE';
                  setPlacementForm((prev) => ({
                    ...prev,
                    sourceType: nextType,
                    sourceId: '',
                  }));
                }}
                disabled={editingPlacementId !== null}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Roll / Waste</label>
              <Dropdown
                value={placementForm.sourceId}
                options={placementForm.sourceType === 'ROLL' ? placementRollOptions : placementWasteOptions}
                itemTemplate={placementForm.sourceType === 'ROLL' ? renderRollOption : undefined}
                valueTemplate={placementForm.sourceType === 'ROLL' ? (option) => renderRollOption(option) : undefined}
                onChange={(e) => updatePlacementField('sourceId', e.value as string)}
                placeholder={t('commandes.selectRollOption')}
                disabled={editingPlacementId !== null}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {!placementForm.sourceId || sourceWidthMm <= 0 || sourceLengthMm <= 0 ? (
            <Message severity="info" text="Select a source to preview placements." />
          ) : (
            <div
              style={{
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                padding: '0.5rem',
                background: 'var(--surface-card)',
              }}
            >
              <svg
                viewBox={`0 0 ${Math.max(1, sourceLengthMm)} ${Math.max(1, sourceWidthMm)}`}
                width="100%"
                height="240"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect
                  x={0}
                  y={0}
                  width={sourceLengthMm}
                  height={sourceWidthMm}
                  fill={placementSource?.colorHexCode || '#f5f5f5'}
                  stroke="#bdbdbd"
                  strokeWidth={2}
                />
                {placementsForSource.map((placement) => (
                  <rect
                    key={placement.id}
                    x={placement.yMm}
                    y={placement.xMm}
                    width={placement.heightMm}
                    height={placement.widthMm}
                    fill={placement.colorHexCode || 'rgba(25, 118, 210, 0.35)'}
                    stroke={placement.colorHexCode || '#1565c0'}
                    strokeWidth={1}
                  />
                ))}
              </svg>
              <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
                {(sourceLengthMm / 1000).toFixed(2)}m x {sourceWidthMm}mm (length on X, width on Y)
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>Existing placements</div>
            {groupedPlacements.length === 0 ? (
              <Message severity="info" text="No placements recorded for this item." />
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {groupedPlacements.map((group) => {
                  const source = getGroupSource(group);
                  const widthMm = Number(source?.widthMm) || 0;
                  const lengthMm = Math.round((Number(source?.lengthM) || 0) * 1000);
                  return (
                    <Card key={`${group.type}-${group.sourceId}`} style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{getGroupLabel(group)}</div>
                        <Button
                          label="Clear"
                          icon="pi pi-trash"
                          severity="danger"
                          outlined
                          onClick={() => handleClearSourcePlacements(group, item.id)}
                        />
                      </div>
                      {widthMm > 0 && lengthMm > 0 ? (
                        <div
                          style={{
                            border: '1px solid var(--surface-border)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            background: 'var(--surface-card)',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <svg
                            viewBox={`0 0 ${Math.max(1, lengthMm)} ${Math.max(1, widthMm)}`}
                            width="100%"
                            height="220"
                            preserveAspectRatio="xMidYMid meet"
                          >
                            <rect
                              x={0}
                              y={0}
                              width={lengthMm}
                              height={widthMm}
                              fill={source?.colorHexCode || '#f5f5f5'}
                              stroke="#bdbdbd"
                              strokeWidth={2}
                            />
                            {group.placements.map((placement) => (
                              <rect
                                key={placement.id}
                                x={placement.yMm}
                                y={placement.xMm}
                                width={placement.heightMm}
                                height={placement.widthMm}
                                fill={placement.colorHexCode || 'rgba(25, 118, 210, 0.35)'}
                                stroke={placement.colorHexCode || '#1565c0'}
                                strokeWidth={1}
                              />
                            ))}
                          </svg>
                          <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
                            {(lengthMm / 1000).toFixed(2)}m x {widthMm}mm (length on X, width on Y)
                          </div>
                        </div>
                      ) : (
                        <Message severity="info" text="Source dimensions are required for SVG preview." />
                      )}

                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {group.placements.map((placement) => (
                          <Card key={placement.id} style={{ padding: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span>
                                x:{placement.xMm} y:{placement.yMm}
                              </span>
                              <span>
                                {placement.widthMm} x {placement.heightMm} mm
                              </span>
                              {placement.colorHexCode && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: placement.colorHexCode,
                                      borderRadius: '3px',
                                      border: '1px solid var(--surface-border)',
                                    }}
                                  />
                                  {placement.colorName || placement.colorHexCode}
                                </span>
                              )}
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                  label="Edit"
                                  icon="pi pi-pencil"
                                  outlined
                                  onClick={() => startEditPlacement(placement)}
                                />
                                <Button
                                  label="Delete"
                                  icon="pi pi-trash"
                                  severity="danger"
                                  outlined
                                  onClick={() => handleDeletePlacement(placement.id, item.id)}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>{editingPlacementId ? 'Update placement' : 'Add placement'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>X (length mm)</label>
                <InputText
                  value={placementForm.xMm}
                  onChange={(e) => updatePlacementField('xMm', e.target.value)}
                  type="number"
                  min={0}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Y (width mm)</label>
                <InputText
                  value={placementForm.yMm}
                  onChange={(e) => updatePlacementField('yMm', e.target.value)}
                  type="number"
                  min={0}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Width (mm)</label>
                <InputText
                  value={placementForm.widthMm}
                  onChange={(e) => updatePlacementField('widthMm', e.target.value)}
                  type="number"
                  min={1}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Height (mm)</label>
                <InputText
                  value={placementForm.heightMm}
                  onChange={(e) => updatePlacementField('heightMm', e.target.value)}
                  type="number"
                  min={1}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  label={creatingPlacement ? 'Saving...' : (editingPlacementId ? 'Update placement' : 'Save placement')}
                  icon={editingPlacementId ? 'pi pi-check' : 'pi pi-plus'}
                  onClick={() => handleCreatePlacement(item)}
                  disabled={creatingPlacement || isBusy}
                  loading={creatingPlacement}
                />
                {editingPlacementId && (
                  <Button
                    label="Cancel"
                    severity="secondary"
                    outlined
                    onClick={resetPlacementForm}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const 
  getContrastTextColor = (hexColor?: string) => {
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

  const wasteTypeOptions = [
    { label: t('commandes.wasteTypeScrap'), value: 'DECHET' },
    { label: t('commandes.wasteTypeReusable'), value: 'CHUTE_EXPLOITABLE' },
  ];

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

      <Card style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{commande.numeroCommande}</span>
            <Tag value={commande.status} severity={getStatusSeverity(commande.status)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              icon="pi pi-pencil"
              label={t('commandes.editOrder')}
              onClick={handleEditOrder}
              disabled={isBusy}
            />
            <Button
              icon="pi pi-trash"
              label={t('commandes.deleteOrder')}
              severity="danger"
              onClick={handleDeleteOrder}
              disabled={isBusy}
              loading={deletingOrder}
            />
            <Button
              icon="pi pi-arrow-left"
              label={t('commandes.backButton')}
              severity="secondary"
              outlined
              onClick={() => navigate('/commandes')}
              disabled={isBusy}
            />
          </div>
        </div>
      </Card>

      {error && <Message severity="error" text={error} style={{ marginBottom: '1rem' }} />}

      <Card title={t('commandes.orderInformation')} style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.orderNumber')}</div>
            <div>{commande.numeroCommande}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.client')}</div>
            <div>{commande.clientName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdBy')}</div>
            <div>{commande.createdByName || t('commandes.notAvailable')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdDate')}</div>
            <div>{formatDateTime(commande.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.totalItems')}</div>
            <div>{commande.items?.length || 0}</div>
          </div>
        </div>

        {commande.description && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.description')}</div>
            <div>{commande.description}</div>
          </div>
        )}

        {commande.notes && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.notes')}</div>
            <div>{commande.notes}</div>
          </div>
        )}
      </Card>

      <Card title={t('commandes.updateOrderStatus')} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Dropdown
            value={selectedStatus}
            options={statusOptions}
            onChange={(e) => setSelectedStatus(e.value)}
            placeholder={t('commandes.updateStatus')}
            style={{ minWidth: '220px' }}
          />
          <Button
            label={updating ? t('commandes.updating') : t('commandes.updateStatus')}
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === commande.status}
            loading={updating}
          />
        </div>
      </Card>

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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{t('commandes.rollProcessing')}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                          label={t('commandes.processRoll')}
                          icon="pi pi-cog"
                          onClick={() => handleOpenProcessingModal(item)}
                          disabled={isBusy}
                        />
                        <Button
                          label={t('inventory.createChute')}
                          icon="pi pi-plus-circle"
                          severity="secondary"
                          onClick={() => handleOpenChuteModal(item)}
                          disabled={isBusy}
                        />
                        <Button
                          label={t('commandes.addProductionItem')}
                          icon="pi pi-plus"
                          severity="secondary"
                          onClick={() => handleOpenProductionModal(item)}
                          disabled={isBusy}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                        {t('commandes.wasteCreated')}
                      </div>
                      {wasteForItem.length === 0 ? (
                        <Message severity="info" text={t('commandes.noWasteRecorded')} />
                      ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {wasteForItem.map((waste: any) => (
                            <Card key={waste.id} style={{ padding: '0.5rem' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Tag
                                  value={waste.wasteType}
                                  severity={waste.wasteType === 'DECHET' ? 'warning' : 'success'}
                                />
                                <span>
                                  {waste.lengthM}m x {waste.widthMm}mm ({waste.areaM2?.toFixed(2)}m2)
                                </span>
                                {waste.weightKg ? <span>{waste.weightKg}kg</span> : null}
                                <span>{formatDate(waste.createdAt)}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                        {t('commandes.productionItems')}
                      </div>
                      {productionForItem.length === 0 ? (
                        <Message severity="info" text={t('commandes.noProductionItems')} />
                      ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {productionForItem.map((production) => (
                            <Card key={production.id} style={{ padding: '0.5rem' }}>
                              {production.goodProduction}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Tag
                                  value={production.rollId ? t('commandes.productionSourceRoll') : t('commandes.productionSourceWaste')}
                                  severity={production.rollId ? 'info' : 'success'}
                                />
                                {typeof production.goodProduction === 'boolean' && (
                                  <Tag
                                    value={
                                      production.goodProduction
                                        ? t('commandes.productionGood')
                                        : t('commandes.productionBad')
                                    }
                                    severity={production.goodProduction ? 'success' : 'danger'}
                                  />
                                )}
                                <span>
                                  {production.pieceLengthM}m x {production.pieceWidthMm}mm x {production.quantity}
                                  {' '}({production.totalAreaM2?.toFixed(2)}m2)
                                </span>
                                <span>{formatDate(production.createdAt)}</span>
                              </div>
                              {production.productionMiss && (
                                <div style={{ marginTop: '0.35rem', color: 'var(--text-color-secondary)', fontSize: '0.85rem' }}>
                                  {t('commandes.productionMissLabel')}: {production.productionMiss}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {renderPlacementSection(item)}
                  </div>
                )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog
        header={
          chuteTargetItem
            ? `${t('inventory.createChute')} - ${t('commandes.line')} ${chuteTargetItem.lineNumber}`
            : t('inventory.createChute')
        }
        visible={showChuteForm}
        onHide={handleCloseChuteModal}
        style={{ width: 'min(700px, 95vw)' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label={t('common.cancel')} severity="secondary" onClick={handleCloseChuteModal} />
            <Button label={t('inventory.createChute')} onClick={handleCreateChute} loading={creatingChute} />
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('inventory.sourceType')}
            </label>
            <Dropdown
              value={chuteSourceType}
              options={chuteSourceOptions}
              onChange={(e) => {
                setChuteSourceType(e.value);
                setChuteRollId('');
                setParentWastePieceId('');
                setChuteDimensions({ widthMm: 0, lengthM: 0, areaM2: 0 });
              }}
              style={{ width: '100%' }}
            />
          </div>

          {chuteSourceType === 'ROLL' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('inventory.selectRoll')}
              </label>
              <Dropdown
                value={chuteRollId}
                options={chuteRollOptions}
                itemTemplate={renderRollOption}
                valueTemplate={(option) => renderRollOption(option)}
                onChange={(e) => setChuteRollId(e.value as string)}
                placeholder={t('commandes.selectRollOption')}
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('inventory.selectWastePiece')}
              </label>
              <Dropdown
                value={parentWastePieceId}
                options={chuteParentOptions}
                onChange={(e) => setParentWastePieceId(e.value as string)}
                placeholder={
                  parentWastePiecesLoading
                    ? t('inventory.loadingWastePieces')
                    : t('inventory.selectWastePiece')
                }
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('inventory.material')}
              </label>
              <InputText value={chuteSource?.materialType || ''} disabled />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('rolls.plies')}
              </label>
              <InputText value={chuteSource?.nbPlis ?? ''} disabled />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('rolls.thickness')}
              </label>
              <InputText value={chuteSource?.thicknessMm ?? ''} disabled />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('rolls.width')}
              </label>
              <InputText
                value={chuteDimensions.widthMm ? String(chuteDimensions.widthMm) : ''}
                onChange={(e) => updateChuteDimension('widthMm', e.target.value)}
                type="number"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('rolls.length')}
              </label>
              <InputText
                value={chuteDimensions.lengthM ? String(chuteDimensions.lengthM) : ''}
                onChange={(e) => updateChuteDimension('lengthM', e.target.value)}
                type="number"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('rolls.area')}
              </label>
              <InputText value={chuteDimensions.areaM2.toFixed(4)} disabled />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={
          selectedItem
            ? `${t('commandes.processRollLine')} ${selectedItem.lineNumber}`
            : t('commandes.processRoll')
        }
        visible={showProcessingModal}
        onHide={handleCloseProcessingModal}
        style={{ width: 'min(600px, 95vw)' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label={t('commandes.cancel')} severity="secondary" onClick={handleCloseProcessingModal} />
            <Button label={t('commandes.recordWaste')} onClick={handleProcessRoll} loading={creatingWaste} />
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.rollRequired')}
            </label>
            <Dropdown
              value={processingForm.rollId}
              options={processingRollOptions}
              itemTemplate={renderRollOption}
              valueTemplate={(option) => renderRollOption(option)}
              onChange={(e) => updateProcessingField('rollId', e.value as string)}
              placeholder={t('commandes.selectRollOption')}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.lengthUsed')}
            </label>
            <InputText
              value={processingForm.lengthUsedM}
              onChange={(e) => updateProcessingField('lengthUsedM', e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: '100%' }}
            />
            <small>{t('commandes.lengthUsedHelp')}</small>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.remainingWidth')}
            </label>
            <InputText
              value={processingForm.widthRemainingMm}
              onChange={(e) => updateProcessingField('widthRemainingMm', e.target.value)}
              placeholder="0"
              type="number"
              style={{ width: '100%' }}
            />
            <small>{t('commandes.remainingWidthHelp')}</small>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.wasteTypeRequired')}
            </label>
            <Dropdown
              value={processingForm.wasteType}
              options={wasteTypeOptions}
              onChange={(e) => updateProcessingField('wasteType', e.value as string)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.weight')}
            </label>
            <InputText
              value={processingForm.weightKg}
              onChange={(e) => updateProcessingField('weightKg', e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.notes')}
            </label>
            <InputTextarea
              value={processingForm.notes}
              onChange={(e) => updateProcessingField('notes', e.target.value)}
              placeholder={t('commandes.notesPlaceholder')}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header={
          productionTargetItem
            ? `${t('commandes.addProductionItem')} - ${t('commandes.line')} ${productionTargetItem.lineNumber}`
            : t('commandes.addProductionItem')
        }
        visible={showProductionModal}
        onHide={handleCloseProductionModal}
        style={{ width: 'min(600px, 95vw)' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label={t('commandes.cancel')} severity="secondary" onClick={handleCloseProductionModal} />
            <Button
              label={t('commandes.saveProductionItem')}
              onClick={handleCreateProductionItem}
              loading={creatingProduction}
            />
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.productionSourceType')}
            </label>
            <Dropdown
              value={productionForm.sourceType}
              options={productionSourceOptions}
              onChange={(e) => updateProductionField('sourceType', e.value as string)}
              style={{ width: '100%' }}
            />
          </div>

          {productionForm.sourceType === 'ROLL' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('commandes.productionRoll')}
              </label>
              <Dropdown
                value={productionForm.rollId}
                options={productionRollOptions}
                itemTemplate={renderRollOption}
                valueTemplate={(option) => renderRollOption(option)}
                onChange={(e) => updateProductionField('rollId', e.value as string)}
                placeholder={t('commandes.selectRollOption')}
                style={{ width: '100%' }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('commandes.productionWastePiece')}
              </label>
              <Dropdown
                value={productionForm.wastePieceId}
                options={productionWasteOptions}
                onChange={(e) => updateProductionField('wastePieceId', e.value as string)}
                placeholder={t('commandes.productionWastePlaceholder')}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.productionPieceLength')}
            </label>
            <InputText
              value={productionForm.pieceLengthM}
              onChange={(e) => updateProductionField('pieceLengthM', e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.productionPieceWidth')}
            </label>
            <InputText
              value={productionForm.pieceWidthMm}
              onChange={(e) => updateProductionField('pieceWidthMm', e.target.value)}
              placeholder="0"
              type="number"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.productionQuantity')}
            </label>
            <InputText
              value={productionForm.quantity}
              onChange={(e) => updateProductionField('quantity', e.target.value)}
              placeholder="0"
              type="number"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.notes')}
            </label>
            <InputTextarea
              value={productionForm.notes}
              onChange={(e) => updateProductionField('notes', e.target.value)}
              placeholder={t('commandes.notesPlaceholder')}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default CommandeDetailPage;
