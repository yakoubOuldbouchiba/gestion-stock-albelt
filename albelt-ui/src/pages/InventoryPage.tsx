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
import { useAsyncLock } from '@hooks/useAsyncLock';
import { InventoryFilters } from '../components/inventory/InventoryFilters';
import { InventoryTab } from '../components/inventory/InventoryTab';
import { ReusableTab } from '../components/inventory/ReusableTab';
import { WasteTab } from '../components/inventory/WasteTab';
import { ReceiveRollDialog } from '../components/inventory/ReceiveRollDialog';
import { CreateChuteDialog } from '../components/inventory/CreateChuteDialog';

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

  const [filters, setFilters] = useState({
    searchTerm: '',
    materialFilter: 'ALL' as MaterialType | 'ALL',
    statusFilter: 'ALL' as RollStatus | 'ALL',
    altierFilter: 'ALL',
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
      const res = await RollService.getStatsByMaterial();
      const rows = res.success && res.data ? res.data : [];

      const byMaterial = new Map<MaterialType, { count: number; totalArea: number }>();
      for (const row of rows) {
        if (row?.material) {
          byMaterial.set(row.material, {
            count: Number(row.count) || 0,
            totalArea: Number(row.totalArea) || 0,
          });
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
  }, [materials]);

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

  // Load filtered rolls when supplier and material change for chute form
  useEffect(() => {
    if (chute.sourceType === 'ROLL' && formData.supplierId && formData.materialType) {
      loadFilteredChuteRolls();
    } else {
      setChute((prev) => ({ ...prev, filteredRolls: [] }));
    }
  }, [formData.supplierId, formData.materialType, chute.sourceType]);

  // Auto-populate form fields when a roll is selected for chute creation
  useEffect(() => {
    if (chute.sourceType !== 'ROLL') {
      return;
    }
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
    if (chute.sourceType !== 'WASTE_PIECE') {
      return;
    }
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

  // Handle width/length changes and auto-calculate area
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setFormData((prev) => {
      const updated = { ...prev, [name]: numValue };
      // Auto-calculate area: (width in mm / 1000) * length in m = area in m²
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

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data.items || []);
      }
      if (altiersResponse.success && altiersResponse.data) {
        setAltiers(altiersResponse.data.items || []);
      }
      if (colorsResponse.success && colorsResponse.data) {
        setColors(colorsResponse.data.items || []);
      }
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

      const response = await RollService.getBySupplierAndMaterial(
        formData.supplierId,
        formData.materialType
      );
      if (response.success) {
        setChute((prev) => ({ ...prev, filteredRolls: response.data || [] }));
      } else {
        setChute((prev) => ({ ...prev, filteredRolls: [] }));
      }
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
      const response = await WastePieceService.getAll({
        page: 0,
        size: 200,
        status: 'AVAILABLE',
      });
      const data = response.data;
      if (response.success && data) {
        setChute((prev) => ({ ...prev, parentWastePieces: data.items || [] }));
      } else {
        setChute((prev) => ({ ...prev, parentWastePieces: [] }));
      }
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
    material: MaterialType | 'ALL',
    status: RollStatus | 'ALL',
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
    material: MaterialType | 'ALL',
    status: RollStatus | 'ALL',
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
    // Step 1: update the changed field
    const updated = {
      ...prev,
      [name]:
        name === 'nbPlis'
          ? parseInt(value) || 0
          : name === 'thicknessMm' || name === 'lengthM' || name === 'widthMm' || name === 'lengthRemainingM'
          ? parseFloat(value) || 0
          : value,
    };

    // Step 2: compute area automatically
    const length = updated.lengthM || 0;
    const widthMm = updated.widthMm || 0;

    updated.areaM2 = length * (widthMm / 1000); //

    return updated;
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked('inventory-roll')) {
      return;
    }
    setError(null);

    try {
      await run(async () => {
        const response = await RollService.receive(formData);
        if (response.success) {
          setPagination((prev) => ({ ...prev, rollPage: 0 }));
          await loadRolls(
            0,
            filters.searchTerm,
            filters.materialFilter,
            filters.statusFilter,
            filters.altierFilter,
            filters.colorFilter,
            filters.nbPlisFilter,
            filters.thicknessFilter
          );
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
    });
  };


  const handleCancel = () => {
    resetForm();
    setDialogs((prev) => ({ ...prev, receiveRoll: false }));
  };

  const handleChuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked('inventory-chute')) {
      return;
    }

    let selectedRoll: Roll | undefined;
    let selectedParent: WastePiece | undefined;

    if (chute.sourceType === 'ROLL') {
      selectedRoll = chute.filteredRolls.find(r => r.id === chute.rollId);
      if (!selectedRoll) {
        alert('Please select a roll');
        return;
      }
    } else {
      selectedParent = chute.parentWastePieces.find(piece => piece.id === chute.parentWastePieceId);
      if (!selectedParent) {
        alert('Please select a parent waste piece');
        return;
      }
    }

    const selectedPlacement = chute.placements.find((placement) => placement.id === chute.placementId);
    if (!selectedPlacement) {
      alert('Please select a placement');
      return;
    }
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
      altierID: selectedRoll?.altierId || selectedParent?.altierId,
      colorId: selectedRoll?.colorId || selectedParent?.colorId,
    };

    try {
      await run(async () => {
        const response = await WastePieceService.create(wasteData);
        if (response.success) {
          setPagination((prev) => ({ ...prev, wastePage: 0 }));
          await loadWastePieces(
            0,
            filters.searchTerm,
            filters.materialFilter,
            filters.statusFilter,
            filters.altierFilter,
            filters.colorFilter,
            filters.nbPlisFilter,
            filters.thicknessFilter,
            activeTab === 'reusable' ? 'CHUTE_EXPLOITABLE' : activeTab === 'waste' ? 'DECHET' : undefined
          );
          setDialogs((prev) => ({ ...prev, createChute: false }));
          resetChute();
          resetForm();
          alert('Waste piece created successfully!');
        }
      }, 'inventory-chute');
    } catch (err) {
      console.error('Error creating waste piece:', err);
      alert('Failed to create waste piece');
    }
  };

  const reusablePieces = activeTab === 'reusable' ? wastePieces : [];
  const scrapPieces = activeTab === 'waste' ? wastePieces : [];

  const tabIndex = activeTab === 'inventory' ? 0 : activeTab === 'reusable' ? 1 : 2;

  const statusSeverity = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OPENED':
        return 'warning';
      case 'EXHAUSTED':
        return 'secondary';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return undefined;
    }
  };

  const rollMaterialBody = (roll: Roll) => {
    const supplier = suppliers.find(s => s.id === roll.supplierId);
    const altierLabel = roll.altierLibelle || 'Unassigned';
    const summary = getRollChuteSummary(roll);
    return (
      <div>
        <Tag
          value={roll.materialType}
          style={{ backgroundColor: getMaterialColor(roll.materialType, roll.colorHexCode) }}
        />
        <div>Ref: {summary.reference}</div>
        <div>Plis: {summary.nbPlis} | Thk: {summary.thickness} | Color: {summary.color}</div>
        <div>{supplier?.name || 'N/A'}</div>
        <div>{altierLabel}</div>
      </div>
    );
  };

  const rollWastePercentBody = (roll: Roll) => {
    const usedAreaM2 = roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0;
    const percent = roll.areaM2
      ? (usedAreaM2 / roll.areaM2) * 100
      : 0;
    return `${percent.toFixed(1)}%`;
  };

  const rollStatusBody = (roll: Roll) => (
    <Tag value={ t(`statuses.${roll.status}`) } severity={statusSeverity(roll.status)} />
  );

  const rollActionsBody = (roll: Roll) => (
    <Button
      icon="pi pi-eye"
      text
      onClick={() => navigate(`/roll/${roll.id}`)}
      aria-label={t('common.view')}
    />
  );

  const groupedMaterialBody = (row: any) => {
    const altierLabel = row.altierName || 'Unassigned';
    const materialDetails = `${row.thicknessMm ?? 'N/A'} mm • ${row.nbPlis ?? 'N/A'} plis`;
    return (
      <div>
        <Tag
          value={row.materialType}
          style={{ backgroundColor: getMaterialColor(row.materialType, row.colorHexCode) }}
        />
        <div>{materialDetails}</div>
        <div>{altierLabel}</div>
        <div>{row.status || 'N/A'}</div>
      </div>
    );
  };

  const wasteMaterialBody = (piece: WastePiece) => {
    const altierLabel = piece.altierLibelle || 'Unassigned';
    const summary = getRollChuteSummary(piece);
    return (
      <div>
        <Tag
          value={piece.materialType}
          style={{ backgroundColor: getMaterialColor(piece.materialType, piece.colorHexCode) }}
        />
        <div>Ref: {summary.reference}</div>
        <div>Plis: {summary.nbPlis} | Thk: {summary.thickness} | Color: {summary.color}</div>
        <div>{piece.supplierName || 'N/A'}</div>
        <div>{altierLabel}</div>
      </div>
    );
  };

  const wasteStatusBody = (piece: WastePiece) => (
    <Tag value={ t(`statuses.${piece.status}`) } severity={statusSeverity(piece.status)} />
  );

  const wasteActionsBody = (piece: WastePiece) => (
    piece.wasteType !== 'DECHET' ? (
      <Button
        icon="pi pi-eye"
        text
        onClick={() => navigate(`/chute/${piece.id}`)}
        aria-label={t('common.view')}
      />
    ) : null
  );

  const materialFilterOptions = useMemo<{ label: string; value: MaterialType | 'ALL' }[]>(
    () => [{ label: t('inventory.allMaterials'), value: 'ALL' }, ...materials.map((mat) => ({ label: mat, value: mat }))],
    [t, materials]
  );

  const statusFilterOptions = useMemo<{ label: string; value: RollStatus | 'ALL' }[]>(
    () => [{ label: t('inventory.allStatus'), value: 'ALL' }, ...statuses.map((status) => ({ label: t(`statuses.${status}`), value: status }))],
    [t, statuses]
  );

  const altierFilterOptions = useMemo(
    () => [{ label: t('inventory.allWorkshops'), value: 'ALL' }, ...altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))],
    [t, altiers]
  );

  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ label: supplier.name || 'N/A', value: supplier.id })),
    [suppliers]
  );

  const colorOptions = useMemo(
    () =>
      colors
        .map((color) => ({ label: `${color.name} (${color.hexCode})`, value: color.id })),
    [colors]
  );

  const colorFilterOptions = useMemo(
    () => [{ label: t('inventory.allColors') || 'All colors', value: 'ALL' }, ...colorOptions],
    [t, colorOptions]
  );

  const applyFilterChange = useCallback(
    (partial: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...partial }));
      setPagination({ rollPage: 0, wastePage: 0 });
    },
    []
  );

  const handleSearchChange = (value: string) => applyFilterChange({ searchTerm: value });
  const handleMaterialChange = (value: MaterialType | 'ALL') => applyFilterChange({ materialFilter: value });
  const handleAltierChange = (value: string) => applyFilterChange({ altierFilter: value });
  const handleStatusChange = (value: RollStatus | 'ALL') => applyFilterChange({ statusFilter: value });
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
      totalCount={totals.rollTotalElements}
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

  const chuteSourceOptions: { label: string; value: 'ROLL' | 'WASTE_PIECE' }[] = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const chuteRollOptions = chute.filteredRolls.map((roll) => ({
    label: formatRollChuteLabel(roll),
    value: roll.id,
  }));

  const parentWasteOptions = chute.parentWastePieces.map((piece) => ({
    label: formatRollChuteLabel(piece),
    value: piece.id,
  }));

  const chutePlacementOptions = chute.placements.map((placement) => ({
    label: `Placement ${placement.id.substring(0, 8)} • ${placement.widthMm}x${placement.heightMm}mm • x:${placement.xMm} y:${placement.yMm}`,
    value: placement.id,
  }));

  const renderGroupedStatsTable = (rows: any[], loading: boolean) => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <ProgressSpinner />
        </div>
      );
    }

    if (!rows.length) {
      return <Message severity="info" text={t('inventory.noGroupedStats') || 'No grouped statistics found.'} />;
    }

    return (
      <DataTable value={rows} dataKey="id" size="small">
        <Column header={t('inventory.material')} body={groupedMaterialBody} />
        <Column header={t('inventory.area')} body={(row) => (row.totalAreaM2 || 0).toFixed(2)} />
        <Column header={t('inventory.wasteArea')} body={(row) => (row.totalWasteAreaM2 || 0).toFixed(2)} />
        <Column
          header={t('inventory.availableArea')}
          body={(row) => ((row.totalAreaM2 || 0) - (row.totalWasteAreaM2 || 0)).toFixed(2)}
        />
        <Column header={t('inventory.rollCount')} field="rollCount" />
      </DataTable>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>{t('inventory.title')}</h1>
      </div>

      {error && <Message severity="error" text={error} />}

      <TabView
        activeIndex={tabIndex}
        onTabChange={(e) => {
          const nextTab = e.index === 0 ? 'inventory' : e.index === 1 ? 'reusable' : 'waste';
          setActiveTab(nextTab);
          if (nextTab === 'inventory') {
            setPagination((prev) => ({ ...prev, rollPage: 0 }));
          } else {
            setPagination((prev) => ({ ...prev, wastePage: 0 }));
          }
        }}
      >
        <TabPanel header={t('inventory.title') || 'Inventory'}>
          <InventoryTab
            t={t}
            stats={materialStats}
            getMaterialColor={getMaterialColor}
            showGrouped={grouped.inventory.show}
            onToggleGrouped={(value) => setGrouped((prev) => ({ ...prev, inventory: { ...prev.inventory, show: value } }))}
            groupedStats={grouped.inventory.rows}
            groupedLoading={grouped.inventory.loading}
            renderGroupedStatsTable={renderGroupedStatsTable}
            rolls={rolls}
            rollTotalElements={totals.rollTotalElements}
            rollPage={pagination.rollPage}
            pageSize={pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, rollPage: page }))}
            onOpenReceiveRoll={() => setDialogs((prev) => ({ ...prev, receiveRoll: true }))}
            rollMaterialBody={rollMaterialBody}
            rollWastePercentBody={rollWastePercentBody}
            rollStatusBody={rollStatusBody}
            rollActionsBody={rollActionsBody}
            filters={rollFilters}
            formatDate={formatDate}
          />
        </TabPanel>

        <TabPanel header={t('inventory.chuteReusable') || 'Chute Reusable'}>
          <ReusableTab
            t={t}
            showGrouped={grouped.reusable.show}
            onToggleGrouped={(value) => setGrouped((prev) => ({ ...prev, reusable: { ...prev.reusable, show: value } }))}
            groupedStats={grouped.reusable.rows}
            groupedLoading={grouped.reusable.loading}
            renderGroupedStatsTable={renderGroupedStatsTable}
            pieces={reusablePieces}
            wasteMaterialBody={wasteMaterialBody}
            wasteStatusBody={wasteStatusBody}
            wasteActionsBody={wasteActionsBody}
            wastePage={pagination.wastePage}
            wasteTotalElements={totals.wasteTotalElements}
            pageSize={pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, wastePage: page }))}
            onOpenCreateChute={() => setDialogs((prev) => ({ ...prev, createChute: true }))}
            filters={wasteFilters}
            formatDate={formatDate}
          />
        </TabPanel>

        <TabPanel header={t('inventory.chuteDechet') || 'Chute Waste'}>
          <WasteTab
            t={t}
            showGrouped={grouped.waste.show}
            onToggleGrouped={(value) => setGrouped((prev) => ({ ...prev, waste: { ...prev.waste, show: value } }))}
            groupedStats={grouped.waste.rows}
            groupedLoading={grouped.waste.loading}
            renderGroupedStatsTable={renderGroupedStatsTable}
            pieces={scrapPieces}
            wasteMaterialBody={wasteMaterialBody}
            wastePage={pagination.wastePage}
            wasteTotalElements={totals.wasteTotalElements}
            pageSize={pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, wastePage: page }))}
            onOpenCreateChute={() => setDialogs((prev) => ({ ...prev, createChute: true }))}
            filters={wasteFilters}
            formatDate={formatDate}
          />
        </TabPanel>
      </TabView>
      <ReceiveRollDialog
        visible={dialogs.receiveRoll}
        onHide={handleCancel}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isLocked('inventory-roll')}
        formData={formData}
        t={t}
        supplierOptions={supplierOptions}
        altierOptions={altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))}
        materialOptions={materials.map((mat) => ({ label: mat, value: mat }))}
        colorOptions={colorOptions}
        colorsAvailable={colors.length > 0}
        onSupplierChange={(value) => setFormData((prev) => ({ ...prev, supplierId: value }))}
        onAltierChange={(value) => setFormData((prev) => ({ ...prev, altierId: value }))}
        onMaterialChange={(value) => setFormData((prev) => ({ ...prev, materialType: value }))}
        onColorChange={(value) => setFormData((prev) => ({ ...prev, colorId: value }))}
        onFieldChange={handleInputChange}
      />

      <CreateChuteDialog
        visible={dialogs.createChute}
        onHide={() => {
          setDialogs((prev) => ({ ...prev, createChute: false }));
          resetChute();
        }}
        onSubmit={handleChuteSubmit}
        onCancel={() => {
          setDialogs((prev) => ({ ...prev, createChute: false }));
          resetChute();
        }}
        isSubmitting={isLocked('inventory-chute')}
        t={t}
        chuteSourceType={chute.sourceType}
        chuteSourceOptions={chuteSourceOptions}
        onSourceTypeChange={(value) => {
          setChute((prev) => ({
            ...prev,
            sourceType: value,
            rollId: '',
            parentWastePieceId: '',
            placementId: '',
            placements: [],
          }));
        }}
        chuteRollId={chute.rollId}
        onChuteRollChange={(value) => {
          setChute((prev) => ({ ...prev, rollId: value, placementId: '' }));
        }}
        chuteRollOptions={chuteRollOptions}
        chuteRollsLoading={chute.filteredRollsLoading}
        supplierOptions={supplierOptions}
        materialOptions={materials.map((mat) => ({ label: mat, value: mat }))}
        supplierId={formData.supplierId}
        materialType={formData.materialType}
        onSupplierChange={(value) => setFormData((prev) => ({ ...prev, supplierId: value }))}
        onMaterialChange={(value) => setFormData((prev) => ({ ...prev, materialType: value }))}
        parentWastePieceId={chute.parentWastePieceId}
        parentWasteOptions={parentWasteOptions}
        parentWastePiecesLoading={chute.parentWastePiecesLoading}
        onParentWasteChange={(value) => {
          setChute((prev) => ({ ...prev, parentWastePieceId: value, placementId: '' }));
        }}
        chutePlacementId={chute.placementId}
        chutePlacementOptions={chutePlacementOptions}
        chutePlacementsLoading={chute.placementsLoading}
        onPlacementChange={(value) => setChute((prev) => ({ ...prev, placementId: value }))}
        formData={formData}
        onFieldChange={handleInputChange}
        onDimensionChange={handleDimensionChange}
        altierOptions={altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))}
        onAltierChange={(value) => setFormData((prev) => ({ ...prev, altierId: value }))}
        disableAltier={chute.sourceType === 'WASTE_PIECE'}
      />
    </div>
  );
}

export default InventoryPage;
