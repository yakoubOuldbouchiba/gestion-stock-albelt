import { useEffect, useState } from 'react';
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
  // Per-tab grouped statistics state
  const [showGroupedInventory, setShowGroupedInventory] = useState(false);
  const [groupedStatsInventory, setGroupedStatsInventory] = useState<any[]>([]);
  const [groupedLoadingInventory, setGroupedLoadingInventory] = useState(false);

  const [showGroupedReusable, setShowGroupedReusable] = useState(false);
  const [groupedStatsReusable, setGroupedStatsReusable] = useState<any[]>([]);
  const [groupedLoadingReusable, setGroupedLoadingReusable] = useState(false);

  const [showGroupedWaste, setShowGroupedWaste] = useState(false);
  const [groupedStatsWaste, setGroupedStatsWaste] = useState<any[]>([]);
  const [groupedLoadingWaste, setGroupedLoadingWaste] = useState(false);

  // Fetch grouped stats for each tab
  useEffect(() => {
    if (showGroupedInventory) {
      setGroupedLoadingInventory(true);
      RollService.getGroupedByAllFields().then(res => {
        if (res.success && res.data) {
          setGroupedStatsInventory(res.data);
        } else {
          setGroupedStatsInventory([]);
        }
        setGroupedLoadingInventory(false);
      }).catch(() => {
        setGroupedStatsInventory([]);
        setGroupedLoadingInventory(false);
      });
    }
  }, [showGroupedInventory]);

  useEffect(() => {
    if (showGroupedReusable) {
      setGroupedLoadingReusable(true);
      // For reusable, use WastePieceService and filter by CHUTE_EXPLOITABLE
      const type: WasteType = "CHUTE_EXPLOITABLE";
      WastePieceService.getGroupedByAllFields(type).then(res => {
        if (res.success && res.data) {
          setGroupedStatsReusable(res.data);
        } else {
          setGroupedStatsReusable([]);
        }
        setGroupedLoadingReusable(false);
      }).catch(() => {
        setGroupedStatsReusable([]);
        setGroupedLoadingReusable(false);
      });
    }
  }, [showGroupedReusable]);

  useEffect(() => {
    if (showGroupedWaste) {
      setGroupedLoadingWaste(true);
      // For waste, use WastePieceService and filter by DECHET
      const type: WasteType = "DECHET";
      WastePieceService.getGroupedByAllFields(type).then(res => {
        if (res.success && res.data) {
          setGroupedStatsWaste(res.data);
        } else {
          setGroupedStatsWaste([]);
        }
        setGroupedLoadingWaste(false);
      }).catch(() => {
        setGroupedStatsWaste([]);
        setGroupedLoadingWaste(false);
      });
    }
  }, [showGroupedWaste]);
  const navigate = useNavigate();
  const { t } = useI18n();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RollStatus | 'ALL'>('ALL');
  const [altierFilter, setAltierFilter] = useState<string>('ALL');
  const [colorFilter, setColorFilter] = useState<string>('ALL');
  const [nbPlisFilter, setNbPlisFilter] = useState<string>('');
  const [thicknessFilter, setThicknessFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'reusable' | 'waste'>('inventory');
  const [showChuteForm, setShowChuteForm] = useState(false);
  const [rollPage, setRollPage] = useState(0);
  const [rollTotalElements, setRollTotalElements] = useState(0);
  const [wastePage, setWastePage] = useState(0);
  const [wasteTotalElements, setWasteTotalElements] = useState(0);
  const { run, isLocked } = useAsyncLock();
  const pageSize = 10;

  const materials: MaterialType[] = ['PU', 'PVC', 'CAOUTCHOUC'];
  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];

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

  const [chuteRollId, setChuteRollId] = useState<string>('');
  const [filteredChuteRolls, setFilteredChuteRolls] = useState<Roll[]>([]);
  const [chuteRollsLoading, setChuteRollsLoading] = useState(false);
  const [chuteSourceType, setChuteSourceType] = useState<'ROLL' | 'WASTE_PIECE'>('ROLL');
  const [parentWastePieceId, setParentWastePieceId] = useState<string>('');
  const [parentWastePieces, setParentWastePieces] = useState<WastePiece[]>([]);
  const [parentWastePiecesLoading, setParentWastePiecesLoading] = useState(false);
  const [chutePlacementId, setChutePlacementId] = useState<string>('');
  const [chutePlacements, setChutePlacements] = useState<PlacedRectangle[]>([]);
  const [chutePlacementsLoading, setChutePlacementsLoading] = useState(false);

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadRolls(rollPage, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter);
  }, [rollPage, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter]);

  useEffect(() => {
    if (activeTab !== 'inventory') {
      loadWastePieces(wastePage, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter);
    }
  }, [wastePage, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter, activeTab]);

  // Load filtered rolls when supplier and material change for chute form
  useEffect(() => {
    if (chuteSourceType === 'ROLL' && formData.supplierId && formData.materialType) {
      loadFilteredChuteRolls();
    } else {
      setFilteredChuteRolls([]);
    }
  }, [formData.supplierId, formData.materialType, chuteSourceType]);

  // Auto-populate form fields when a roll is selected for chute creation
  useEffect(() => {
    if (chuteSourceType !== 'ROLL') {
      return;
    }
    if (chuteRollId) {
      const selectedChute = filteredChuteRolls.find(r => r.id === chuteRollId);
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
  }, [chuteRollId, filteredChuteRolls, chuteSourceType]);

  useEffect(() => {
    if (chuteSourceType !== 'WASTE_PIECE') {
      return;
    }
    if (parentWastePieceId) {
      const selectedParent = parentWastePieces.find(piece => piece.id === parentWastePieceId);
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
  }, [parentWastePieceId, parentWastePieces, chuteSourceType]);

  useEffect(() => {
    if (showChuteForm && chuteSourceType === 'WASTE_PIECE') {
      loadParentWastePieces();
    }
  }, [showChuteForm, chuteSourceType]);

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
        console.error('Failed to load placements:', err);
        setChutePlacements([]);
      } finally {
        setChutePlacementsLoading(false);
      }
    };

    loadPlacements();
  }, [showChuteForm, chuteSourceType, chuteRollId, parentWastePieceId]);

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
        ColorService.getAll(),
      ]);

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data.items || []);
      }
      if (altiersResponse.success && altiersResponse.data) {
        setAltiers(altiersResponse.data.items || []);
      }
      if (colorsResponse.success && colorsResponse.data) {
        setColors(colorsResponse.data);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilteredChuteRolls = async () => {
    setChuteRollsLoading(true);
    try {
      if (!formData.supplierId || !formData.materialType) {
        setFilteredChuteRolls([]);
        return;
      }

      const response = await RollService.getBySupplierAndMaterial(
        formData.supplierId,
        formData.materialType
      );
      if (response.success && response.data) {
        setFilteredChuteRolls(response.data);
      } else {
        setFilteredChuteRolls([]);
      }
    } catch (err) {
      console.error('Failed to load filtered chute rolls:', err);
      setFilteredChuteRolls([]);
    } finally {
      setChuteRollsLoading(false);
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
      if (response.success && response.data) {
        setParentWastePieces(response.data.items || []);
      } else {
        setParentWastePieces([]);
      }
    } catch (err) {
      console.error('Failed to load parent waste pieces:', err);
      setParentWastePieces([]);
    } finally {
      setParentWastePiecesLoading(false);
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
      if (response.success && response.data) {
        setRolls(response.data.items || []);
        setRollTotalElements(response.data.totalElements || 0);
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
    thickness: string
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
        altierId: altierId === 'ALL' ? undefined : altierId,
        colorId: colorId === 'ALL' ? undefined : colorId,
        nbPlis: Number.isFinite(parsedNbPlis) ? parsedNbPlis : undefined,
        thicknessMm: Number.isFinite(parsedThickness) ? parsedThickness : undefined,
      });
      if (response.success && response.data) {
        setWastePieces(response.data.items || []);
        setWasteTotalElements(response.data.totalElements || 0);
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
          setRollPage(0);
          await loadRolls(0, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter);
          resetForm();
          setShowForm(false);
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
    setShowForm(false);
  };

  const handleChuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked('inventory-chute')) {
      return;
    }

    let selectedRoll: Roll | undefined;
    let selectedParent: WastePiece | undefined;

    if (chuteSourceType === 'ROLL') {
      selectedRoll = filteredChuteRolls.find(r => r.id === chuteRollId);
      if (!selectedRoll) {
        alert('Please select a roll');
        return;
      }
    } else {
      selectedParent = parentWastePieces.find(piece => piece.id === parentWastePieceId);
      if (!selectedParent) {
        alert('Please select a parent waste piece');
        return;
      }
    }

    const selectedPlacement = chutePlacements.find((placement) => placement.id === chutePlacementId);
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
          setWastePage(0);
          await loadWastePieces(0, searchTerm, materialFilter, statusFilter, altierFilter, colorFilter, nbPlisFilter, thicknessFilter);
          setShowChuteForm(false);
          setChuteRollId('');
          setParentWastePieceId('');
          setChutePlacementId('');
          setChuteSourceType('ROLL');
          resetForm();
          alert('Waste piece created successfully!');
        }
      }, 'inventory-chute');
    } catch (err) {
      console.error('Error creating waste piece:', err);
      alert('Failed to create waste piece');
    }
  };

  const reusablePieces = wastePieces.filter(
    (piece: WastePiece) => piece.wasteType === 'CHUTE_EXPLOITABLE'
  );
  const scrapPieces = wastePieces.filter(
    (piece: WastePiece) => piece.wasteType === 'DECHET'
  );

  const stats = materials.map(material => ({
    material,
    count: rolls.filter((r: Roll) => r.materialType === material && (r.status === 'AVAILABLE' || r.status === 'OPENED')).length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && (r.status === 'AVAILABLE' || r.status === 'OPENED'))
      .reduce((sum: number, r: Roll) => sum + (r.availableAreaM2 ?? r.areaM2 ?? 0), 0),
  }));

  const statsReusable = materials.map(material => ({
    material,
    count: wastePieces.filter((p: WastePiece) => p.materialType === material && p.wasteType === 'CHUTE_EXPLOITABLE').length,
    area: wastePieces
      .filter((p: WastePiece) => p.materialType === material && p.wasteType === 'CHUTE_EXPLOITABLE')
      .reduce((sum: number, p: WastePiece) => sum + (p.availableAreaM2 ?? p.areaM2 ?? 0), 0),
  }));

  const statsWaste = materials.map(material => ({
    material,
    count: wastePieces.filter((p: WastePiece) => p.materialType === material && p.wasteType === 'DECHET').length,
    area: wastePieces
      .filter((p: WastePiece) => p.materialType === material && p.wasteType === 'DECHET')
      .reduce((sum: number, p: WastePiece) => sum + (p.availableAreaM2 ?? p.areaM2 ?? 0), 0),
  }));


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
    <Tag value={roll.status} severity={statusSeverity(roll.status)} />
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
    <Tag value={piece.status} severity={statusSeverity(piece.status)} />
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

  const materialFilterOptions = [
    { label: t('inventory.allMaterials'), value: 'ALL' },
    ...materials.map((mat) => ({ label: mat, value: mat }))
  ];

  const statusFilterOptions = [
    { label: t('inventory.allStatus'), value: 'ALL' },
    ...statuses.map((status) => ({ label: status, value: status }))
  ];

  const altierFilterOptions = [
    { label: t('inventory.allWorkshops'), value: 'ALL' },
    ...altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))
  ];

  const supplierOptions = suppliers.map((supplier) => ({
    label: supplier.name || 'N/A',
    value: supplier.id,
  }));

  const colorOptions = colors
    .filter((color) => color.isActive)
    .map((color) => ({
      label: `${color.name} (${color.hexCode})`,
      value: color.id,
    }));

  const colorFilterOptions = [
    { label: t('inventory.allColors') || 'All colors', value: 'ALL' },
    ...colorOptions,
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleMaterialChange = (value: MaterialType | 'ALL') => {
    setMaterialFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleAltierChange = (value: string) => {
    setAltierFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleStatusChange = (value: RollStatus | 'ALL') => {
    setStatusFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleColorChange = (value: string) => {
    setColorFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleNbPlisChange = (value: string) => {
    setNbPlisFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const handleThicknessChange = (value: string) => {
    setThicknessFilter(value);
    setRollPage(0);
    setWastePage(0);
  };

  const rollFilters = (
    <InventoryFilters
      t={t}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      materialFilter={materialFilter}
      materialOptions={materialFilterOptions}
      onMaterialChange={handleMaterialChange}
      altierFilter={altierFilter}
      altierOptions={altierFilterOptions}
      onAltierChange={handleAltierChange}
      statusFilter={statusFilter}
      statusOptions={statusFilterOptions}
      onStatusChange={handleStatusChange}
      colorFilter={colorFilter}
      colorOptions={colorFilterOptions}
      onColorChange={handleColorChange}
      nbPlisFilter={nbPlisFilter}
      onNbPlisChange={handleNbPlisChange}
      thicknessFilter={thicknessFilter}
      onThicknessChange={handleThicknessChange}
      totalCount={rollTotalElements}
    />
  );

  const wasteFilters = (
    <InventoryFilters
      t={t}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      materialFilter={materialFilter}
      materialOptions={materialFilterOptions}
      onMaterialChange={handleMaterialChange}
      altierFilter={altierFilter}
      altierOptions={altierFilterOptions}
      onAltierChange={handleAltierChange}
      statusFilter={statusFilter}
      statusOptions={statusFilterOptions}
      onStatusChange={handleStatusChange}
      colorFilter={colorFilter}
      colorOptions={colorFilterOptions}
      onColorChange={handleColorChange}
      nbPlisFilter={nbPlisFilter}
      onNbPlisChange={handleNbPlisChange}
      thicknessFilter={thicknessFilter}
      onThicknessChange={handleThicknessChange}
    />
  );

  const chuteSourceOptions: { label: string; value: 'ROLL' | 'WASTE_PIECE' }[] = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const chuteRollOptions = filteredChuteRolls.map((roll) => ({
    label: formatRollChuteLabel(roll),
    value: roll.id,
  }));

  const parentWasteOptions = parentWastePieces.map((piece) => ({
    label: formatRollChuteLabel(piece),
    value: piece.id,
  }));

  const chutePlacementOptions = chutePlacements.map((placement) => ({
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
            setRollPage(0);
          } else {
            setWastePage(0);
          }
        }}
      >
        <TabPanel header={t('inventory.title') || 'Inventory'}>
          <InventoryTab
            t={t}
            stats={stats}
            getMaterialColor={getMaterialColor}
            showGrouped={showGroupedInventory}
            onToggleGrouped={setShowGroupedInventory}
            groupedStats={groupedStatsInventory}
            groupedLoading={groupedLoadingInventory}
            renderGroupedStatsTable={renderGroupedStatsTable}
            rolls={rolls}
            rollTotalElements={rollTotalElements}
            rollPage={rollPage}
            pageSize={pageSize}
            onPageChange={setRollPage}
            onOpenReceiveRoll={() => setShowForm(true)}
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
            showGrouped={showGroupedReusable}
            onToggleGrouped={setShowGroupedReusable}
            groupedStats={groupedStatsReusable}
            groupedLoading={groupedLoadingReusable}
            renderGroupedStatsTable={renderGroupedStatsTable}
            pieces={reusablePieces}
            wasteMaterialBody={wasteMaterialBody}
            wasteStatusBody={wasteStatusBody}
            wasteActionsBody={wasteActionsBody}
            wastePage={wastePage}
            wasteTotalElements={wasteTotalElements}
            pageSize={pageSize}
            onPageChange={setWastePage}
            onOpenCreateChute={() => setShowChuteForm(true)}
            filters={wasteFilters}
            formatDate={formatDate}
          />
        </TabPanel>

        <TabPanel header={t('inventory.chuteDechet') || 'Chute Waste'}>
          <WasteTab
            t={t}
            showGrouped={showGroupedWaste}
            onToggleGrouped={setShowGroupedWaste}
            groupedStats={groupedStatsWaste}
            groupedLoading={groupedLoadingWaste}
            renderGroupedStatsTable={renderGroupedStatsTable}
            pieces={scrapPieces}
            wasteMaterialBody={wasteMaterialBody}
            wastePage={wastePage}
            wasteTotalElements={wasteTotalElements}
            pageSize={pageSize}
            onPageChange={setWastePage}
            onOpenCreateChute={() => setShowChuteForm(true)}
            filters={wasteFilters}
            formatDate={formatDate}
          />
        </TabPanel>
      </TabView>
      <ReceiveRollDialog
        visible={showForm}
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
        visible={showChuteForm}
        onHide={() => {
          setShowChuteForm(false);
          setChuteRollId('');
          setParentWastePieceId('');
          setChutePlacementId('');
          setChutePlacements([]);
          setChuteSourceType('ROLL');
        }}
        onSubmit={handleChuteSubmit}
        onCancel={() => {
          setShowChuteForm(false);
          setChuteRollId('');
          setParentWastePieceId('');
          setChutePlacementId('');
          setChutePlacements([]);
          setChuteSourceType('ROLL');
        }}
        isSubmitting={isLocked('inventory-chute')}
        t={t}
        chuteSourceType={chuteSourceType}
        chuteSourceOptions={chuteSourceOptions}
        onSourceTypeChange={(value) => {
          setChuteSourceType(value);
          setChuteRollId('');
          setParentWastePieceId('');
          setChutePlacementId('');
          setChutePlacements([]);
        }}
        chuteRollId={chuteRollId}
        onChuteRollChange={(value) => {
          setChuteRollId(value);
          setChutePlacementId('');
        }}
        chuteRollOptions={chuteRollOptions}
        chuteRollsLoading={chuteRollsLoading}
        supplierOptions={supplierOptions}
        materialOptions={materials.map((mat) => ({ label: mat, value: mat }))}
        supplierId={formData.supplierId}
        materialType={formData.materialType}
        onSupplierChange={(value) => setFormData((prev) => ({ ...prev, supplierId: value }))}
        onMaterialChange={(value) => setFormData((prev) => ({ ...prev, materialType: value }))}
        parentWastePieceId={parentWastePieceId}
        parentWasteOptions={parentWasteOptions}
        parentWastePiecesLoading={parentWastePiecesLoading}
        onParentWasteChange={(value) => {
          setParentWastePieceId(value);
          setChutePlacementId('');
        }}
        chutePlacementId={chutePlacementId}
        chutePlacementOptions={chutePlacementOptions}
        chutePlacementsLoading={chutePlacementsLoading}
        onPlacementChange={setChutePlacementId}
        formData={formData}
        onFieldChange={handleInputChange}
        onDimensionChange={handleDimensionChange}
        altierOptions={altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))}
        onAltierChange={(value) => setFormData((prev) => ({ ...prev, altierId: value }))}
        disableAltier={chuteSourceType === 'WASTE_PIECE'}
      />
    </div>
  );
}

export default InventoryPage;
