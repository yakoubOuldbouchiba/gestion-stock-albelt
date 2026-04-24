import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@hooks/useI18n';

import type { Roll, RollRequest, MaterialType, RollStatus, Supplier, Altier, WastePiece, Color, WasteType, PlacedRectangle } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
import { WastePieceService } from '../services/wastePieceService';
import { ColorService } from '../services/colorService';
import { PlacedRectangleService } from '../services/placedRectangleService';
import { getMaterialColor } from '../utils/materialColors';
import { formatDate } from '../utils/date';
import { formatRollChuteLabel, getRollChuteSummary } from '@utils/rollChuteLabel';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { InventoryFilters } from '../components/inventory/InventoryFilters';
import { InventoryTab } from '../components/inventory/InventoryTab';
import { ReusableTab } from '../components/inventory/ReusableTab';
import { WasteTab } from '../components/inventory/WasteTab';
import { ReceiveRollDialog } from '../components/inventory/ReceiveRollDialog';
import { CreateChuteDialog } from '../components/inventory/CreateChuteDialog';
import { QrCodeCard } from '../components/QrCodeCard';
import { PageHeader } from '../components/PageHeader';
import './InventoryPage.css';

export function InventoryPage() {
  type TabKey = 'inventory' | 'reusable' | 'waste';
  type GroupedKey = TabKey;
  type GroupedState = { show: boolean; rows: any[]; loading: boolean };

  const [grouped, setGrouped] = useState<Record<GroupedKey, GroupedState>>({
    inventory: { show: false, rows: [], loading: false },
    reusable: { show: false, rows: [], loading: false },
    waste: { show: false, rows: [], loading: false },
  });

  const loadGroupedStats = useCallback(async (key: GroupedKey) => {
    setGrouped((prev) => ({ ...prev, [key]: { ...prev[key], loading: true } }));
    try {
      const res =
        key === 'inventory'
          ? await RollService.getGroupedByAllFields()
          : await WastePieceService.getGroupedByAllFields(key === 'reusable' ? ('CHUTE_EXPLOITABLE' as WasteType) : ('DECHET' as WasteType));

      setGrouped((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          rows: res.success && res.data ? res.data : [],
          loading: false,
        },
      }));
    } catch {
      setGrouped((prev) => ({
        ...prev,
        [key]: { ...prev[key], rows: [], loading: false },
      }));
    }
  }, []);

  useEffect(() => {
    if (grouped.inventory.show) loadGroupedStats('inventory');
  }, [grouped.inventory.show, loadGroupedStats]);

  useEffect(() => {
    if (grouped.reusable.show) loadGroupedStats('reusable');
  }, [grouped.reusable.show, loadGroupedStats]);

  useEffect(() => {
    if (grouped.waste.show) loadGroupedStats('waste');
  }, [grouped.waste.show, loadGroupedStats]);

  const navigate = useNavigate();
  const { t } = useI18n();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('inventory');
  const [dialogs, setDialogs] = useState({ receiveRoll: false, createChute: false });
  const [selectedPreview, setSelectedPreview] = useState<
    | { type: 'roll'; item: Roll }
    | { type: 'waste'; item: WastePiece }
    | null
  >(null);
  const [isRegeneratingPreviewQr, setIsRegeneratingPreviewQr] = useState(false);
  const [selectedRolls, setSelectedRolls] = useState<Roll[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<WastePiece[]>([]);

  const [filters, setFilters] = useState({
    searchTerm: '',
    materialFilter: 'ALL' as MaterialType,
    altierFilter: 'ALL',
    statusFilter: 'ALL' as RollStatus,
    colorFilter: 'ALL',
    nbPlisFilter: '',
    thicknessFilter: '',
  });

  const [pagination, setPagination] = useState({ rollPage: 0, wastePage: 0 });
  const [totals, setTotals] = useState({ rollTotalElements: 0, wasteTotalElements: 0 });

  const { run, isLocked } = useAsyncLock();
  const pageSize = 10;

  const materials = useMemo<MaterialType[]>(() => ['PU', 'PVC', 'CAOUTCHOUC'], []);
  const statuses = useMemo<RollStatus[]>(() => ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'], []);

  const [materialStats, setMaterialStats] = useState<Array<{ material: MaterialType; count: number; area: number }>>(
    () => materials.map((material) => ({ material, count: 0, area: 0 }))
  );

  const [formData, setFormData] = useState<RollRequest>({
    materialType: 'PU',
    nbPlis: 1,
    thicknessMm: 2.5,
    widthMm: 1000,
    lengthM: 50,
    areaM2: 50,
    status: 'AVAILABLE',
    supplierId: '',
    altierId: undefined,
    receivedDate: new Date().toISOString().split('T')[0],
    colorId: undefined,
    reference: '',
  });

  const [chute, setChute] = useState({
    sourceType: 'ROLL' as 'ROLL' | 'WASTE_PIECE',
    rollId: '',
    filteredRolls: [] as Roll[],
    filteredRollsLoading: false,
    parentWastePieceId: '',
    parentWastePieces: [] as WastePiece[],
    parentWastePiecesLoading: false,
    placementId: '',
    placements: [] as PlacedRectangle[],
    placementsLoading: false,
  });

  const resetChute = useCallback(() => {
    setChute({
      sourceType: 'ROLL',
      rollId: '',
      filteredRolls: [],
      filteredRollsLoading: false,
      parentWastePieceId: '',
      parentWastePieces: [],
      parentWastePiecesLoading: false,
      placementId: '',
      placements: [],
      placementsLoading: false,
    });
  }, []);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadMaterialStats = useCallback(async () => {
    try {
      let res;
      if (activeTab === 'inventory') {
       res = await RollService.getStatsByMaterial();
      }else if (activeTab === 'reusable') {
        res = await WastePieceService.getStatsByMaterial('CHUTE_EXPLOITABLE');
      } else if (activeTab === 'waste') {  
        res = await WastePieceService.getStatsByMaterial('DECHET');
      }
      const byMaterial = new Map<MaterialType, { count: number; totalArea: number }>();
      if (res && res.data) {
        for (const row of res.data) {
          if (row?.material) {
            byMaterial.set(row.material, {
              count: Number(row.count) || 0,
              totalArea: Number(row.totalArea) || 0,
            });
          }
        }
      }

      setMaterialStats(
        materials.map((material) => {
          const stat = byMaterial.get(material);
          return {
            material,
            count: stat?.count ?? 0,
            area: stat?.totalArea ?? 0,
          };
        })
      );
    } catch (err) {
      console.error('Failed to load inventory material stats:', err);
      setMaterialStats(materials.map((material) => ({ material, count: 0, area: 0 })));
    }
  }, [materials, activeTab]);

  useEffect(() => {
    loadMaterialStats();
  }, [loadMaterialStats]);

  useEffect(() => {
    loadRolls(
      pagination.rollPage,
      filters.searchTerm,
      filters.materialFilter,
      filters.statusFilter,
      filters.altierFilter,
      filters.colorFilter,
      filters.nbPlisFilter,
      filters.thicknessFilter
    );
  }, [
    pagination.rollPage,
    filters.searchTerm,
    filters.materialFilter,
    filters.statusFilter,
    filters.altierFilter,
    filters.colorFilter,
    filters.nbPlisFilter,
    filters.thicknessFilter,
  ]);

  useEffect(() => {
    if (activeTab !== 'inventory') {
      const wasteType: WasteType | undefined =
        activeTab === 'reusable' ? 'CHUTE_EXPLOITABLE' : activeTab === 'waste' ? 'DECHET' : undefined;
      loadWastePieces(
        pagination.wastePage,
        filters.searchTerm,
        filters.materialFilter,
        filters.statusFilter,
        filters.altierFilter,
        filters.colorFilter,
        filters.nbPlisFilter,
        filters.thicknessFilter,
        wasteType
      );
    }
  }, [
    pagination.wastePage,
    filters.searchTerm,
    filters.materialFilter,
    filters.statusFilter,
    filters.altierFilter,
    filters.colorFilter,
    filters.nbPlisFilter,
    filters.thicknessFilter,
    activeTab,
  ]);

  useEffect(() => {
    if (chute.sourceType === 'ROLL' && formData.supplierId && formData.materialType) {
      loadFilteredChuteRolls();
    } else {
      setChute((prev) => ({ ...prev, filteredRolls: [] }));
    }
  }, [formData.supplierId, formData.materialType, chute.sourceType]);

  useEffect(() => {
    if (chute.sourceType !== 'ROLL') return;
    if (chute.rollId) {
      const selectedChute = chute.filteredRolls.find(r => r.id === chute.rollId);
      if (selectedChute) {
        setFormData((prev) => ({
          ...prev,
          nbPlis: selectedChute.nbPlis,
          thicknessMm: selectedChute.thicknessMm,
          widthMm: selectedChute.widthMm,
          lengthM: selectedChute.lengthM,
          areaM2: selectedChute.areaM2,
          altierId: selectedChute.altierId,
          colorId: selectedChute.colorId,
          reference: selectedChute.reference,
          receivedDate: new Date().toISOString().split('T')[0],
        }));
      }
    }
  }, [chute.rollId, chute.filteredRolls, chute.sourceType]);

  useEffect(() => {
    if (chute.sourceType !== 'WASTE_PIECE') return;
    if (chute.parentWastePieceId) {
      const selectedParent = chute.parentWastePieces.find(piece => piece.id === chute.parentWastePieceId);
      if (selectedParent) {
        setFormData((prev) => ({
          ...prev,
          materialType: selectedParent.materialType,
          nbPlis: selectedParent.nbPlis,
          thicknessMm: selectedParent.thicknessMm,
          widthMm: selectedParent.widthMm,
          lengthM: selectedParent.lengthM,
          areaM2: (selectedParent.widthMm / 1000) * selectedParent.lengthM,
          altierId: selectedParent.altierId,
          colorId: selectedParent.colorId,
          reference: selectedParent.reference,
          receivedDate: new Date().toISOString().split('T')[0],
        }));
      }
    }
  }, [chute.parentWastePieceId, chute.parentWastePieces, chute.sourceType]);

  useEffect(() => {
    if (dialogs.createChute && chute.sourceType === 'WASTE_PIECE') {
      loadParentWastePieces();
    }
  }, [dialogs.createChute, chute.sourceType]);

  useEffect(() => {
    if (!dialogs.createChute) {
      setChute((prev) => ({ ...prev, placements: [], placementId: '' }));
      return;
    }
    const sourceId = chute.sourceType === 'ROLL' ? chute.rollId : chute.parentWastePieceId;
    if (!sourceId) {
      setChute((prev) => ({ ...prev, placements: [], placementId: '' }));
      return;
    }

    const loadPlacements = async () => {
      setChute((prev) => ({ ...prev, placementsLoading: true }));
      try {
        const response = chute.sourceType === 'ROLL'
          ? await PlacedRectangleService.getByRoll(sourceId)
          : await PlacedRectangleService.getByWastePiece(sourceId);
        if (response.success && response.data) {
          setChute((prev) => ({ ...prev, placements: Array.isArray(response.data) ? response.data : [] }));
        } else {
          setChute((prev) => ({ ...prev, placements: [] }));
        }
      } catch (err) {
        console.error('Failed to load placements:', err);
        setChute((prev) => ({ ...prev, placements: [] }));
      } finally {
        setChute((prev) => ({ ...prev, placementsLoading: false }));
      }
    };
    loadPlacements();
  }, [dialogs.createChute, chute.sourceType, chute.rollId, chute.parentWastePieceId]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => {
      const updated = { ...prev, [name]: numValue } as RollRequest;
      if (name === 'widthMm' || name === 'lengthM') {
        const widthInMeters = updated.widthMm / 1000;
        updated.areaM2 = widthInMeters * updated.lengthM;
      }
      return updated;
    });
  };

  const loadLookups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [suppliersResponse, altiersResponse, colorsResponse] = await Promise.all([
        SupplierService.getAll({ page: 0, size: 200 }),
        AltierService.getAll({ page: 0, size: 200 }),
        ColorService.getPaged({ page: 0, size: 500, isActive: true }),
      ]);

      if (suppliersResponse.success && suppliersResponse.data) setSuppliers(suppliersResponse.data.items || []);
      if (altiersResponse.success && altiersResponse.data) setAltiers(altiersResponse.data.items || []);
      if (colorsResponse.success && colorsResponse.data) setColors(colorsResponse.data.items || []);
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilteredChuteRolls = async () => {
    setChute((prev) => ({ ...prev, filteredRollsLoading: true }));
    try {
      if (!formData.supplierId || !formData.materialType) {
        setChute((prev) => ({ ...prev, filteredRolls: [] }));
        return;
      }
      const response = await RollService.getBySupplierAndMaterial(formData.supplierId, formData.materialType);
      if (response.success) setChute((prev) => ({ ...prev, filteredRolls: response.data || [] }));
      else setChute((prev) => ({ ...prev, filteredRolls: [] }));
    } catch (err) {
      console.error('Failed to load filtered chute rolls:', err);
      setChute((prev) => ({ ...prev, filteredRolls: [] }));
    } finally {
      setChute((prev) => ({ ...prev, filteredRollsLoading: false }));
    }
  };

  const loadParentWastePieces = async () => {
    setChute((prev) => ({ ...prev, parentWastePiecesLoading: true }));
    try {
      const response = await WastePieceService.getAll({ page: 0, size: 200, status: 'AVAILABLE' });
      const data = response.data;
      if (response.success && data) setChute((prev) => ({ ...prev, parentWastePieces: data.items || [] }));
      else setChute((prev) => ({ ...prev, parentWastePieces: [] }));
    } catch (err) {
      console.error('Failed to load parent waste pieces:', err);
      setChute((prev) => ({ ...prev, parentWastePieces: [] }));
    } finally {
      setChute((prev) => ({ ...prev, parentWastePiecesLoading: false }));
    }
  };

  const loadRolls = async (
    pageIndex: number,
    search: string,
    material: MaterialType,
    status: RollStatus,
    altierId: string,
    colorId: string,
    nbPlis: string,
    thickness: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedNbPlis = nbPlis.trim() ? Number(nbPlis) : undefined;
      const parsedThickness = thickness.trim() ? Number(thickness) : undefined;
      const response = await RollService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
        materialType: material === 'ALL' ? undefined : material,
        status: status === 'ALL' ? undefined : status,
        altierId: altierId === 'ALL' ? undefined : altierId,
        colorId: colorId === 'ALL' ? undefined : colorId,
        nbPlis: Number.isFinite(parsedNbPlis) ? parsedNbPlis : undefined,
        thicknessMm: Number.isFinite(parsedThickness) ? parsedThickness : undefined,
      });
      const data = response.data;
      if (response.success && data) {
        setRolls(data.items || []);
        setTotals((prev) => ({ ...prev, rollTotalElements: data.totalElements || 0 }));
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWastePieces = async (
    pageIndex: number,
    search: string,
    material: MaterialType,
    status: RollStatus,
    altierId: string,
    colorId: string,
    nbPlis: string,
    thickness: string,
    wasteType?: WasteType
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedNbPlis = nbPlis.trim() ? Number(nbPlis) : undefined;
      const parsedThickness = thickness.trim() ? Number(thickness) : undefined;
      const response = await WastePieceService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
        materialType: material === 'ALL' ? undefined : material,
        status: status === 'ALL' ? undefined : status,
        wasteType,
        altierId: altierId === 'ALL' ? undefined : altierId,
        colorId: colorId === 'ALL' ? undefined : colorId,
        nbPlis: Number.isFinite(parsedNbPlis) ? parsedNbPlis : undefined,
        thicknessMm: Number.isFinite(parsedThickness) ? parsedThickness : undefined,
      });
      const data = response.data;
      if (response.success && data) {
        setWastePieces(data.items || []);
        setTotals((prev) => ({ ...prev, wasteTotalElements: data.totalElements || 0 }));
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RollRequest) => {
      const updated = {
        ...prev,
        [name]: name === 'nbPlis' ? parseInt(value) || 0
          : ['thicknessMm', 'lengthM', 'widthMm', 'lengthRemainingM'].includes(name) ? parseFloat(value) || 0
          : value,
      } as RollRequest;
      updated.areaM2 = (updated.lengthM || 0) * ((updated.widthMm || 0) / 1000);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked('inventory-roll')) return;
    setError(null);
    try {
      await run(async () => {
        const response = await RollService.receive(formData);
        if (response.success) {
          setPagination((prev) => ({ ...prev, rollPage: 0 }));
          await loadRolls(0, filters.searchTerm, filters.materialFilter, filters.statusFilter, filters.altierFilter, filters.colorFilter, filters.nbPlisFilter, filters.thicknessFilter);
          await loadMaterialStats();
          resetForm();
          setDialogs((prev) => ({ ...prev, receiveRoll: false }));
        }
      }, 'inventory-roll');
    } catch (err) {
      setError(t('messages.operationFailed'));
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      materialType: 'PU',
      nbPlis: 1,
      thicknessMm: 2.5,
      widthMm: 1000,
      lengthM: 50,
      areaM2: 50,
      status: 'AVAILABLE',
      supplierId: '',
      altierId: undefined,
      receivedDate: new Date().toISOString().split('T')[0],
      colorId: undefined,
      reference: '',
    });
  };

  const handleCancel = () => {
    resetForm();
    setDialogs((prev) => ({ ...prev, receiveRoll: false }));
  };

  const handleChuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked('inventory-chute')) return;

    let selectedRoll: Roll | undefined;
    let selectedParent: WastePiece | undefined;

    if (chute.sourceType === 'ROLL') {
      selectedRoll = chute.filteredRolls.find(r => r.id === chute.rollId);
      if (!selectedRoll) { alert('Please select a roll'); return; }
    } else {
      selectedParent = chute.parentWastePieces.find(piece => piece.id === chute.parentWastePieceId);
      if (!selectedParent) { alert('Please select a parent waste piece'); return; }
    }

    const selectedPlacement = chute.placements.find((placement) => placement.id === chute.placementId);
    if (!selectedPlacement) { alert('Please select a placement'); return; }

    const chuteLengthMm = (formData.lengthM || 0) * 1000;
    if (formData.widthMm > selectedPlacement.widthMm || chuteLengthMm > selectedPlacement.heightMm) {
      alert('Chute dimensions exceed the selected placement.');
      return;
    }

    const wasteData = {
      rollId: selectedRoll?.id || selectedParent?.rollId,
      parentWastePieceId: selectedParent?.id,
      materialType: selectedRoll?.materialType || selectedParent?.materialType,
      nbPlis: formData.nbPlis,
      thicknessMm: formData.thicknessMm,
      widthMm: formData.widthMm,
      lengthM: formData.lengthM,
      areaM2: formData.areaM2,
      status: 'AVAILABLE',
      altierId: selectedRoll?.altierId || selectedParent?.altierId,
      colorId: selectedRoll?.colorId || selectedParent?.colorId,
    };

    try {
      await run(async () => {
        const response = await WastePieceService.create(wasteData);
        if (response.success) {
          setPagination((prev) => ({ ...prev, wastePage: 0 }));
          await loadWastePieces(0, filters.searchTerm, filters.materialFilter, filters.statusFilter, filters.altierFilter, filters.colorFilter, filters.nbPlisFilter, filters.thicknessFilter,
            activeTab === 'reusable' ? 'CHUTE_EXPLOITABLE' : activeTab === 'waste' ? 'DECHET' : undefined);
          setDialogs((prev) => ({ ...prev, createChute: false }));
          resetChute();
          resetForm();
          alert(t('inventory.wastePieceCreatedSuccessfully'));
        }
      }, 'inventory-chute');
    } catch (err) {
      console.error('Error creating waste piece:', err);
      alert(t('inventory.failedToCreateWastePiece'));
    }
  };

  const reusablePieces = activeTab === 'reusable' ? wastePieces : [];
  const scrapPieces = activeTab === 'waste' ? wastePieces : [];
  const tabIndex = activeTab === 'inventory' ? 0 : activeTab === 'reusable' ? 1 : 2;

  const statusSeverity = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'OPENED': return 'warning';
      case 'EXHAUSTED':
      case 'ARCHIVED': return 'secondary';
      default: return undefined;
    }
  };

  const rollMaterialBody = (roll: Roll) => {
    const altierLabel = roll.altierLibelle || 'Unassigned';
    const summary = getRollChuteSummary(roll);
    return (
      <div className="material-merged-cell">
        <Tag
          value={roll.materialType}
          style={{ backgroundColor: getMaterialColor(roll.materialType, roll.colorHexCode) }}
        />
        <div className="merged-reference">{summary.reference}</div>
        <div className="merged-details">
          {summary.nbPlis}P • {summary.thickness}mm • {summary.color}
        </div>
        <div className="merged-meta">{altierLabel}</div>
      </div>
    );
  };

  const wasteMaterialBody = (piece: WastePiece) => {
    const altierLabel = piece.altierLibelle || 'Unassigned';
    const summary = getRollChuteSummary(piece);
    return (
      <div className="material-merged-cell">
        <Tag
          value={piece.materialType}
          style={{ backgroundColor: getMaterialColor(piece.materialType, piece.colorHexCode) }}
        />
        <div className="merged-reference">{summary.reference}</div>
        <div className="merged-details">
          {summary.nbPlis}P • {summary.thickness}mm • {summary.color}
        </div>
        <div className="merged-meta">{altierLabel}</div>
      </div>
    );
  };

  const rollStatusBody = (roll: Roll) => <Tag value={t(`statuses.${roll.status}`)} severity={statusSeverity(roll.status)} />;

  const rollActionsBody = (roll: Roll) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button icon="pi pi-eye" text onClick={() => setSelectedPreview({ type: 'roll', item: roll })} aria-label={t('common.view')} tooltip={t('common.view')} />
      <Button icon="pi pi-external-link" text onClick={() => navigate(`/roll/${roll.id}`)} aria-label={t('rollDetail.title')} tooltip={t('rollDetail.title')} />
    </div>
  );

  const groupedMaterialBody = (row: any) => {
    const altierLabel = row.altierName || 'Unassigned';
    const materialDetails = `${row.thicknessMm ?? 'N/A'} mm • ${row.nbPlis ?? 'N/A'}  ${t('inventory.plis')}`;
    return (
      <div>
        <Tag value={row.materialType} style={{ backgroundColor: getMaterialColor(row.materialType, row.colorHexCode) }} />
        <div>{materialDetails}</div>
        <div>{altierLabel}</div>
        <div>{t(`statuses.${row.status}`) || 'N/A'}</div>
      </div>
    );
  };

  const wasteStatusBody = (piece: WastePiece) => <Tag value={t(`statuses.${piece.status}`)} severity={statusSeverity(piece.status)} />;

  const wasteActionsBody = (piece: WastePiece) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button icon="pi pi-eye" text onClick={() => setSelectedPreview({ type: 'waste', item: piece })} aria-label={t('common.view')} tooltip={t('common.view')} />
      {piece.wasteType !== 'DECHET' ? (
        <Button icon="pi pi-external-link" text onClick={() => navigate(`/chute/${piece.id}`)} aria-label={t('waste.wasteDetailsTitle') || 'Chute Details'} tooltip={t('waste.wasteDetailsTitle') || 'Chute Details'} />
      ) : null}
    </div>
  );

  const previewFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
      {selectedPreview ? (
        <Button
          label={selectedPreview.type === 'roll' ? (t('rollDetail.title') || 'Open Roll') : (t('waste.wasteDetailsTitle') || 'Open Chute')}
          icon="pi pi-external-link"
          onClick={() => {
            if (selectedPreview.type === 'roll') navigate(`/roll/${selectedPreview.item.id}`);
            else if (selectedPreview.item.wasteType !== 'DECHET') navigate(`/chute/${selectedPreview.item.id}`);
            setSelectedPreview(null);
          }}
        />
      ) : <span />}
      <Button label={t('common.close') || 'Close'} severity="secondary" onClick={() => setSelectedPreview(null)} />
    </div>
  );

  const renderRollPreview = (roll: Roll) => {
    const summary = getRollChuteSummary(roll);
    const used = roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0;
    const available = roll.availableAreaM2 ?? (roll.areaM2 || 0) - used;
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div><strong>{t('rollDetail.rollId')}:</strong> {roll.id}</div>
          <div><strong>{t('inventory.reference') || 'Reference'}:</strong> {summary.reference}</div>
          <div><strong>{t('rollDetail.material')}:</strong> {roll.materialType}</div>
          <div><strong>{t('inventory.color') || 'Color'}:</strong> {summary.color}</div>
          <div><strong>{t('rollDetail.supplier')}:</strong> {roll.supplierName || 'N/A'}</div>
          <div><strong>{t('rollDetail.workshop')}:</strong> {roll.altierLibelle || t('rollDetail.unassigned')}</div>
          <div><strong>{t('rollDetail.receivedDate')}:</strong> {formatDate(roll.receivedDate)}</div>
          <div><strong>{t('rollDetail.status')}:</strong> {t(`statuses.${roll.status}`)}</div>
          <div><strong>{t('rollDetail.dimensions')}:</strong> {roll.widthMm} mm x {roll.lengthM} m</div>
          <div><strong>{t('rollDetail.area')}:</strong> {roll.areaM2.toFixed(2)} m2</div>
          <div><strong>{t('inventory.availableArea')}:</strong> {available.toFixed(2)} m2</div>
        </div>
        <QrCodeCard
          label={t('rollDetail.qrCode') || 'QR Code'}
          qrCode={roll.qrCode}
          onRegenerate={async () => {
            if (isRegeneratingPreviewQr) return;
            try {
              setIsRegeneratingPreviewQr(true);
              const response = await RollService.regenerateQrCode(roll.id);
              if (response.success && response.data) {
                setRolls((prev) => prev.map((item) => (item.id === roll.id ? response.data! : item)));
                setSelectedPreview({ type: 'roll', item: response.data });
              }
            } finally { setIsRegeneratingPreviewQr(false); }
          }}
          regenerating={isRegeneratingPreviewQr}
          regenerateLabel={t('commandes.regenerateSuggestion') || 'Regenerate QR'}
        />
      </div>
    );
  };

  const renderWastePreview = (piece: WastePiece) => {
    const summary = getRollChuteSummary(piece);
    const used = piece.usedAreaM2 ?? piece.totalWasteAreaM2 ?? 0;
    const available = piece.availableAreaM2 ?? (piece.areaM2 || 0) - used;
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div><strong>{t('waste.detailWasteId') || 'Waste ID'}:</strong> {piece.id}</div>
          <div><strong>{t('inventory.reference') || 'Reference'}:</strong> {summary.reference}</div>
          <div><strong>{t('rollDetail.material')}:</strong> {piece.materialType}</div>
          <div><strong>{t('inventory.color') || 'Color'}:</strong> {summary.color}</div>
          <div><strong>{t('rollDetail.supplier')}:</strong> {piece.supplierName || 'N/A'}</div>
          <div><strong>{t('rollDetail.workshop')}:</strong> {piece.altierLibelle || t('rollDetail.unassigned')}</div>
          <div><strong>{t('waste.tableType') || 'Type'}:</strong> {piece.wasteType || 'N/A'}</div>
          <div><strong>{t('rollDetail.status')}:</strong> {t(`statuses.${piece.status}`)}</div>
          <div><strong>{t('rollDetail.dimensions')}:</strong> {piece.widthMm} mm x {piece.lengthM} m</div>
          <div><strong>{t('rollDetail.area')}:</strong> {piece.areaM2.toFixed(2)} m2</div>
          <div><strong>{t('inventory.availableArea')}:</strong> {available.toFixed(2)} m2</div>
          <div><strong>{t('waste.detailCreated') || 'Created'}:</strong> {formatDate(piece.createdAt)}</div>
        </div>
        <QrCodeCard
          label={t('rollDetail.qrCode') || 'QR Code'}
          qrCode={piece.qrCode}
          onRegenerate={async () => {
            if (isRegeneratingPreviewQr) return;
            try {
              setIsRegeneratingPreviewQr(true);
              const response = await WastePieceService.regenerateQrCode(piece.id);
              if (response.success && response.data) {
                setWastePieces((prev) => prev.map((item) => (item.id === piece.id ? response.data! : item)));
                setSelectedPreview({ type: 'waste', item: response.data });
              }
            } finally { setIsRegeneratingPreviewQr(false); }
          }}
          regenerating={isRegeneratingPreviewQr}
          regenerateLabel={t('commandes.regenerateSuggestion') || 'Regenerate QR'}
        />
      </div>
    );
  };

  const materialFilterOptions = useMemo((): { label: string; value: MaterialType }[] => [
    { label: t('inventory.allMaterials'), value: 'ALL' },
    ...materials.map((mat) => ({ label: mat, value: mat }))
  ], [t, materials]);

  const statusFilterOptions = useMemo((): { label: string; value: RollStatus }[] => [
    { label: t('inventory.allStatus'), value: 'ALL' },
    ...statuses.map((status) => ({ label: t(`statuses.${status}`), value: status }))
  ], [t, statuses]);
  const altierFilterOptions = useMemo(() => [{ label: t('inventory.allWorkshops'), value: 'ALL' }, ...altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))], [t, altiers]);
  const supplierOptions = useMemo(() => suppliers.map((s) => ({ label: s.name || 'N/A', value: s.id })), [suppliers]);
  const colorOptions = useMemo(() => colors.map((c) => ({ label: `${c.name} (${c.hexCode})`, value: c.id })), [colors]);
  const colorFilterOptions = useMemo(() => [{ label: t('inventory.allColors') || t('inventory.allColorsFallback'), value: 'ALL' }, ...colorOptions], [t, colorOptions]);

  const applyFilterChange = useCallback((partial: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPagination({ rollPage: 0, wastePage: 0 });
  }, []);

  const handleSearchChange = (value: string) => applyFilterChange({ searchTerm: value });
  const handleMaterialChange = (value: MaterialType) => applyFilterChange({ materialFilter: value });
  const handleAltierChange = (value: string) => applyFilterChange({ altierFilter: value });
  const handleStatusChange = (value: RollStatus) => applyFilterChange({ statusFilter: value });
  const handleColorChange = (value: string) => applyFilterChange({ colorFilter: value });
  const handleNbPlisChange = (value: string) => applyFilterChange({ nbPlisFilter: value });
  const handleThicknessChange = (value: string) => applyFilterChange({ thicknessFilter: value });

  const rollFilters = (
    <InventoryFilters
      t={t}
      searchTerm={filters.searchTerm}
      onSearchChange={handleSearchChange}
      materialFilter={filters.materialFilter}
      materialOptions={materialFilterOptions}
      onMaterialChange={handleMaterialChange}
      altierFilter={filters.altierFilter}
      altierOptions={altierFilterOptions}
      onAltierChange={handleAltierChange}
      statusFilter={filters.statusFilter}
      statusOptions={statusFilterOptions}
      onStatusChange={handleStatusChange}
      colorFilter={filters.colorFilter}
      colorOptions={colorFilterOptions}
      onColorChange={handleColorChange}
      nbPlisFilter={filters.nbPlisFilter}
      onNbPlisChange={handleNbPlisChange}
      thicknessFilter={filters.thicknessFilter}
      onThicknessChange={handleThicknessChange}
    />
  );

  const wasteFilters = (
    <InventoryFilters
      t={t}
      searchTerm={filters.searchTerm}
      onSearchChange={handleSearchChange}
      materialFilter={filters.materialFilter}
      materialOptions={materialFilterOptions}
      onMaterialChange={handleMaterialChange}
      altierFilter={filters.altierFilter}
      altierOptions={altierFilterOptions}
      onAltierChange={handleAltierChange}
      statusFilter={filters.statusFilter}
      statusOptions={statusFilterOptions}
      onStatusChange={handleStatusChange}
      colorFilter={filters.colorFilter}
      colorOptions={colorFilterOptions}
      onColorChange={handleColorChange}
      nbPlisFilter={filters.nbPlisFilter}
      onNbPlisChange={handleNbPlisChange}
      thicknessFilter={filters.thicknessFilter}
      onThicknessChange={handleThicknessChange}
    />
  );

  const renderGroupedStatsTable = (rows: any[], loading: boolean) => {
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><ProgressSpinner /></div>;
    if (!rows.length) return <Message severity="info" text={t('inventory.noGroupedStats') || 'No grouped statistics found.'} />;
    return (
      <DataTable value={rows} dataKey="id" size="small" className="industrial-table" removableSort>
        <Column header={t('inventory.material')} body={groupedMaterialBody} sortable field="material" />
        <Column header={t('inventory.area')} body={(row) => (row.totalAreaM2 || 0).toFixed(2)} sortable field="totalAreaM2" />
        <Column header={t('inventory.wasteArea')} body={(row) => (row.totalWasteAreaM2 || 0).toFixed(2)} sortable field="totalWasteAreaM2" />
        <Column header={t('inventory.availableArea')} body={(row) => ((row.totalAreaM2 || 0) - (row.totalWasteAreaM2 || 0)).toFixed(2)} sortable field="totalAreaM2" />
        <Column header={t('inventory.rollCount')} field="rollCount" sortable />
      </DataTable>
    );
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><ProgressSpinner /></div>;

  return (
    <div className="inventory-page">
      <PageHeader
        title={t('inventory.title')}
        actions={
          <>
            <Button label={t('inventory.receiveNewRoll') || 'Receive Roll'} icon="pi pi-plus" severity="danger" onClick={() => setDialogs((prev) => ({ ...prev, receiveRoll: true }))} />
            <Button label={t('inventory.createChute') || 'Create Chute'} icon="pi pi-scissors" outlined onClick={() => setDialogs((prev) => ({ ...prev, createChute: true }))} />
          </>
        }
      >
        <div className="stock-kpi-grid">
          {materialStats.map((stat) => (
            <div key={stat.material} className="stock-kpi-card" style={{ '--stat-color': getMaterialColor(stat.material) } as any}>
              <div className="stock-kpi-label">{stat.material}</div>
              <div className="stock-kpi-value">{stat.area.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>m²</span></div>
              <div className="stock-kpi-footer"><span>{stat.count} {t('inventory.availableRolls')}</span></div>
            </div>
          ))}
          <div className="stock-kpi-card" style={{ '--stat-color': 'var(--color-ink)' } as any}>
            <div className="stock-kpi-label">{t('inventory.totalStock') || 'Total Stock'}</div>
            <div className="stock-kpi-value">{materialStats.reduce((acc, s) => acc + s.area, 0).toFixed(1)} <span style={{ fontSize: '0.9rem' }}>m²</span></div>
            <div className="stock-kpi-footer"><span>{materialStats.reduce((acc, s) => acc + s.count, 0)} {t('inventory.totalItems') || 'Total Items'}</span></div>
          </div>
        </div>
      </PageHeader>

      {error && <Message severity="error" text={error} />}

      <div className="inventory-main-layout">
        <aside className="inventory-sidebar">
          <div className="filter-panel">
            <div className="filter-panel-header">
              <h3>{t('inventory.filters') || 'Filters'}</h3>
              <Button icon="pi pi-refresh" text size="small" onClick={() => setFilters({ searchTerm: '', materialFilter: 'ALL', statusFilter: 'ALL', altierFilter: 'ALL', colorFilter: 'ALL', nbPlisFilter: '', thicknessFilter: '' })} />
            </div>
            {activeTab === 'inventory' ? rollFilters : wasteFilters}
          </div>
        </aside>

        <main className="inventory-content">
          <TabView 
            className="inventory-tabs" 
            activeIndex={tabIndex} 
            onTabChange={(e) => {
              const nextTab = e.index === 0 ? 'inventory' : e.index === 1 ? 'reusable' : 'waste';
              setActiveTab(nextTab);
              setPagination((prev) => ({ 
                ...prev, 
                [nextTab === 'inventory' ? 'rollPage' : 'wastePage']: 0 
              } as typeof pagination));
            }}
          >
            <TabPanel header={t('inventory.title') || 'Inventory'}>
              <InventoryTab 
                t={t} 
                showGrouped={grouped.inventory.show} 
                onToggleGrouped={(v) => setGrouped(p => ({ ...p, inventory: { ...p.inventory, show: v } }))} 
                groupedStats={grouped.inventory.rows} 
                groupedLoading={grouped.inventory.loading} 
                renderGroupedStatsTable={renderGroupedStatsTable} 
                rolls={rolls} 
                selection={selectedRolls} 
                onSelectionChange={(e: any) => setSelectedRolls(e.value)} 
                rollTotalElements={totals.rollTotalElements} 
                rollPage={pagination.rollPage} 
                pageSize={pageSize} 
                onPageChange={(p) => setPagination(prev => ({ ...prev, rollPage: p }))} 
                rollMaterialBody={rollMaterialBody} 
                rollStatusBody={rollStatusBody} 
                rollActionsBody={rollActionsBody} 
                formatDate={formatDate} 
              />
            </TabPanel>
            <TabPanel header={t('inventory.chuteReusable') || 'Chute Reusable'}>
              <ReusableTab 
                t={t} 
                showGrouped={grouped.reusable.show} 
                onToggleGrouped={(v) => setGrouped(p => ({ ...p, reusable: { ...p.reusable, show: v } }))} 
                groupedStats={grouped.reusable.rows} 
                groupedLoading={grouped.reusable.loading} 
                renderGroupedStatsTable={renderGroupedStatsTable} 
                pieces={reusablePieces} 
                selection={selectedPieces} 
                onSelectionChange={(e: any) => setSelectedPieces(e.value)} 
                wasteMaterialBody={wasteMaterialBody} 
                wasteStatusBody={wasteStatusBody} 
                wasteActionsBody={wasteActionsBody} 
                wastePage={pagination.wastePage} 
                wasteTotalElements={totals.wasteTotalElements} 
                pageSize={pageSize} 
                onPageChange={(p) => setPagination(prev => ({ ...prev, wastePage: p }))} 
                formatDate={formatDate} 
              />
            </TabPanel>
            <TabPanel header={t('inventory.chuteDechet') || 'Chute Waste'}>
              <WasteTab 
                t={t} 
                showGrouped={grouped.waste.show} 
                onToggleGrouped={(v) => setGrouped(p => ({ ...p, waste: { ...p.waste, show: v } }))} 
                groupedStats={grouped.waste.rows} 
                groupedLoading={grouped.waste.loading} 
                renderGroupedStatsTable={renderGroupedStatsTable} 
                pieces={scrapPieces} 
                selection={selectedPieces} 
                onSelectionChange={(e: any) => setSelectedPieces(e.value)} 
                wasteMaterialBody={wasteMaterialBody} 
                wasteStatusBody={wasteStatusBody} 
                wasteActionsBody={wasteActionsBody} 
                wastePage={pagination.wastePage} 
                wasteTotalElements={totals.wasteTotalElements} 
                pageSize={pageSize} 
                onPageChange={(p) => setPagination(prev => ({ ...prev, wastePage: p }))} 
                formatDate={formatDate} 
              />
            </TabPanel>
          </TabView>
        </main>
      </div>

      <ReceiveRollDialog visible={dialogs.receiveRoll} onHide={handleCancel} onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isLocked('inventory-roll')} formData={formData} t={t} supplierOptions={supplierOptions} altierOptions={altiers.map(a => ({ label: a.libelle, value: a.id }))} materialOptions={materials.map(m => ({ label: m, value: m }))} colorOptions={colorOptions} colorsAvailable={colors.length > 0} onSupplierChange={v => setFormData(p => ({ ...p, supplierId: v }))} onAltierChange={v => setFormData(p => ({ ...p, altierId: v }))} onMaterialChange={v => setFormData(p => ({ ...p, materialType: v }))} onColorChange={v => setFormData(p => ({ ...p, colorId: v }))} onFieldChange={handleInputChange} />
      <CreateChuteDialog visible={dialogs.createChute} onHide={() => { setDialogs(p => ({ ...p, createChute: false })); resetChute(); }} onSubmit={handleChuteSubmit} onCancel={() => { setDialogs(p => ({ ...p, createChute: false })); resetChute(); }} isSubmitting={isLocked('inventory-chute')} t={t} chuteSourceType={chute.sourceType} chuteSourceOptions={[{ label: t('inventory.roll'), value: 'ROLL' }, { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' }]} onSourceTypeChange={v => setChute(p => ({ ...p, sourceType: v as any, rollId: '', parentWastePieceId: '', placementId: '', placements: [] }))} chuteRollId={chute.rollId} onChuteRollChange={v => setChute(p => ({ ...p, rollId: v, placementId: '' }))} chuteRollOptions={chute.filteredRolls.map(r => ({ label: formatRollChuteLabel(r), value: r.id }))} chuteRollsLoading={chute.filteredRollsLoading} supplierOptions={supplierOptions} materialOptions={materials.map(m => ({ label: m, value: m }))} supplierId={formData.supplierId} materialType={formData.materialType} onSupplierChange={v => setFormData(p => ({ ...p, supplierId: v }))} onMaterialChange={v => setFormData(p => ({ ...p, materialType: v }))} parentWastePieceId={chute.parentWastePieceId} parentWasteOptions={chute.parentWastePieces.map(p => ({ label: formatRollChuteLabel(p), value: p.id }))} parentWastePiecesLoading={chute.parentWastePiecesLoading} onParentWasteChange={v => setChute(p => ({ ...p, parentWastePieceId: v, placementId: '' }))} chutePlacementId={chute.placementId} chutePlacementOptions={chute.placements.map(p => ({ label: `Placement ${p.id.substring(0, 8)} • ${p.widthMm}x${p.heightMm}mm`, value: p.id }))} chutePlacementsLoading={chute.placementsLoading} onPlacementChange={v => setChute(p => ({ ...p, placementId: v }))} formData={formData} onFieldChange={handleInputChange} onDimensionChange={handleDimensionChange} altierOptions={altiers.map(a => ({ label: a.libelle, value: a.id }))} onAltierChange={v => setFormData(p => ({ ...p, altierId: v }))} disableAltier={chute.sourceType === 'WASTE_PIECE'} />
      <Dialog header={selectedPreview?.type === 'roll' ? (t('rollDetail.title') || 'Roll Details') : (t('waste.wasteDetailsTitle') || 'Chute Details')} visible={!!selectedPreview} onHide={() => setSelectedPreview(null)} footer={previewFooter} style={{ width: 'min(720px, 95vw)' }}>
        {selectedPreview?.type === 'roll' ? renderRollPreview(selectedPreview.item) : null}
        {selectedPreview?.type === 'waste' ? renderWastePreview(selectedPreview.item) : null}
      </Dialog>
    </div>
  );
}

export default InventoryPage;
