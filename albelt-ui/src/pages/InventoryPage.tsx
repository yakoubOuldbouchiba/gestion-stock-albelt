import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@hooks/useI18n';

import type { Roll, RollRequest, MaterialType, RollStatus, Supplier, Altier, WastePiece, Color, WasteType } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
import { WastePieceService } from '../services/wastePieceService';
import { ColorService } from '../services/colorService';
import { getMaterialColor } from '../utils/materialColors';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

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
  const [activeTab, setActiveTab] = useState<'inventory' | 'reusable' | 'waste'>('inventory');
  const [showChuteForm, setShowChuteForm] = useState(false);
  const [rollPage, setRollPage] = useState(0);
  const [rollTotalElements, setRollTotalElements] = useState(0);
  const [wastePage, setWastePage] = useState(0);
  const [wasteTotalElements, setWasteTotalElements] = useState(0);
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

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadRolls(rollPage, searchTerm, materialFilter, statusFilter, altierFilter);
  }, [rollPage, searchTerm, materialFilter, statusFilter, altierFilter]);

  useEffect(() => {
    if (activeTab !== 'inventory') {
      loadWastePieces(wastePage, searchTerm, materialFilter, altierFilter);
    }
  }, [wastePage, searchTerm, materialFilter, altierFilter, activeTab]);

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

      console.log('[DEBUG] Loading filtered chute rolls with params:', {
        supplierId: formData.supplierId,
        materialType: formData.materialType,
      });

      const response = await RollService.getBySupplierAndMaterial(
        formData.supplierId,
        formData.materialType
      );

      console.log('[DEBUG] Filtered chute rolls response:', response);

      if (response.success && response.data) {
        console.log('[DEBUG] Found', response.data.length, 'rolls');
        setFilteredChuteRolls(response.data);
      } else {
        console.log('[DEBUG] No rolls found or response error');
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
    altierId: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await RollService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
        materialType: material === 'ALL' ? undefined : material,
        status: status === 'ALL' ? undefined : status,
        altierId: altierId === 'ALL' ? undefined : altierId,
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
    altierId: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await WastePieceService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
        materialType: material === 'ALL' ? undefined : material,
        altierId: altierId === 'ALL' ? undefined : altierId,
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
    setError(null);

    try {
      const response = await RollService.receive(formData);
      if (response.success) {
        setRollPage(0);
        await loadRolls(0, searchTerm, materialFilter, statusFilter, altierFilter);
        resetForm();
        setShowForm(false);
      }
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

  const reusablePieces = wastePieces.filter(
    (piece: WastePiece) => piece.wasteType === 'CHUTE_EXPLOITABLE'
  );
  const scrapPieces = wastePieces.filter(
    (piece: WastePiece) => piece.wasteType === 'DECHET'
  );

  const stats = materials.map(material => ({
    material,
    count: rolls.filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED').length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED')
      .reduce((sum: number, r: Roll) => sum + (r.areaM2 || 0), 0),
  }));

  const statsReusable = materials.map(material => ({
    material,
    count: wastePieces.filter((p: WastePiece) => p.materialType === material && p.wasteType === 'CHUTE_EXPLOITABLE').length,
    area: wastePieces
      .filter((p: WastePiece) => p.materialType === material && p.wasteType === 'CHUTE_EXPLOITABLE')
      .reduce((sum: number, p: WastePiece) => sum + (p.areaM2 || 0), 0),
  }));

  const statsWaste = materials.map(material => ({
    material,
    count: wastePieces.filter((p: WastePiece) => p.materialType === material && p.wasteType === 'DECHET').length,
    area: wastePieces
      .filter((p: WastePiece) => p.materialType === material && p.wasteType === 'DECHET')
      .reduce((sum: number, p: WastePiece) => sum + (p.areaM2 || 0), 0),
  }));

  // Debug stats calculation
  console.log('[DEBUG Stats] Total rolls:', rolls.length);
  console.log('[DEBUG Stats] Rolls by status:',
    rolls.reduce((acc: any, r: Roll) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {})
  );
  console.log('[DEBUG Stats] Stats object:', stats);
  console.log('[DEBUG Stats] StatsReusable object:', statsReusable);
  console.log('[DEBUG Stats] StatsWaste object:', statsWaste);

  const tabIndex = activeTab === 'inventory' ? 0 : activeTab === 'reusable' ? 1 : 2;

  const statusSeverity = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OPENED':
        return 'info';
      case 'EXHAUSTED':
        return 'warning';
      case 'ARCHIVED':
        return 'secondary';
      case 'SCRAP':
        return 'danger';
      case 'USED_IN_ORDER':
        return 'info';
      default:
        return undefined;
    }
  };

  const rollMaterialBody = (roll: Roll) => {
    const supplier = suppliers.find(s => s.id === roll.supplierId);
    const altierLabel = roll.altierLibelle || 'Unassigned';
    const materialDetails = `${roll.widthMm ?? 'N/A'}mm × ${roll.lengthM ?? 'N/A'}m • ${roll.nbPlis ?? 'N/A'} plis`;
    return (
      <div>
        <Tag
          value={roll.materialType}
          style={{ backgroundColor: getMaterialColor(roll.materialType, roll.colorHexCode) }}
        />
        <div>{materialDetails}</div>
        <div>{supplier?.name || 'N/A'}</div>
        <div>{altierLabel}</div>
      </div>
    );
  };

  const rollWastePercentBody = (roll: Roll) => {
    const percent = roll.totalWasteAreaM2 && roll.areaM2
      ? (roll.totalWasteAreaM2 / roll.areaM2) * 100
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
    const materialDetails = `${piece.widthMm ?? 'N/A'}mm × ${piece.lengthM ?? 'N/A'}m • ${piece.nbPlis ?? 'N/A'} plis`;
    return (
      <div>
        <Tag
          value={piece.materialType}
          style={{ backgroundColor: getMaterialColor(piece.materialType, piece.colorHexCode) }}
        />
        <div>{materialDetails}</div>
        <div>{piece.supplierName || 'N/A'}</div>
        <div>{altierLabel}</div>
      </div>
    );
  };

  const wasteStatusBody = (piece: WastePiece) => (
    <Tag value={piece.status} severity={statusSeverity(piece.status)} />
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

  const chuteSourceOptions = [
    { label: t('inventory.roll'), value: 'ROLL' },
    { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' },
  ];

  const chuteRollOptions = filteredChuteRolls.map((roll) => ({
    label: `Area: ${roll.areaM2}m² | Width: ${roll.widthMm}mm | Length: ${roll.lengthM}m`,
    value: roll.id,
  }));

  const parentWasteOptions = parentWastePieces.map((piece) => ({
    label: `${piece.materialType} | Area: ${piece.areaM2.toFixed(2)}m² | Width: ${piece.widthMm}mm | Length: ${piece.lengthM}m`,
    value: piece.id,
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
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {stats.map((stat) => (
                <div key={stat.material} style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
                  <div style={{ color: getMaterialColor(stat.material) }}>{stat.material}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stat.count}</div>
                  <div>{t('inventory.availableRolls')}</div>
                  <div>{stat.area.toFixed(2)} m²</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <Button
                label={t('inventory.receiveNewRoll') || 'Receive Roll'}
                icon="pi pi-plus"
                onClick={() => setShowForm(true)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox
                  inputId="groupedInventory"
                  checked={showGroupedInventory}
                  onChange={(e) => setShowGroupedInventory(!!e.checked)}
                />
                <label htmlFor="groupedInventory">{t('inventory.showGroupedStats') || 'Show Grouped Statistics'}</label>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                  placeholder={t('inventory.search')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setRollPage(0);
                    setWastePage(0);
                  }}
                />
              </span>
              <Dropdown
                value={materialFilter}
                options={materialFilterOptions}
                onChange={(e) => {
                  setMaterialFilter(e.value);
                  setRollPage(0);
                  setWastePage(0);
                }}
                placeholder={t('inventory.material')}
              />
              <Dropdown
                value={altierFilter}
                options={altierFilterOptions}
                onChange={(e) => {
                  setAltierFilter(e.value);
                  setRollPage(0);
                  setWastePage(0);
                }}
                placeholder={t('sidebar.workshops')}
              />
              <Dropdown
                value={statusFilter}
                options={statusFilterOptions}
                onChange={(e) => {
                  setStatusFilter(e.value);
                  setRollPage(0);
                }}
                placeholder={t('inventory.status')}
              />
              <span>{rollTotalElements} {t('common.list')}</span>
            </div>

            {showGroupedInventory ? (
              renderGroupedStatsTable(groupedStatsInventory, groupedLoadingInventory)
            ) : (
              <DataTable
                value={rolls}
                dataKey="id"
                size="small"
                emptyMessage={t('inventory.noRollsFound')}
              >
                <Column header={t('waste.tableMaterial')} body={rollMaterialBody} />
                <Column header={t('waste.reference') || 'Reference'} body={(roll: Roll) => roll.reference || 'N/A'} />
                <Column header={t('waste.tableArea')} body={(roll: Roll) => (roll.areaM2 || 0).toFixed(2)} />
                <Column header={t('inventory.waste')} body={(roll: Roll) => (roll.totalWasteAreaM2 || 0).toFixed(2)} />
                <Column
                  header={t('inventory.availableArea')}
                  body={(roll: Roll) => ((roll.areaM2 || 0) - (roll.totalWasteAreaM2 || 0)).toFixed(2)}
                />
                <Column header={t('inventory.wastePercent')} body={rollWastePercentBody} />
                <Column header={t('waste.tableStatus')} body={rollStatusBody} />
                <Column header={t('waste.tableCreated')} body={(roll: Roll) => formatDate(roll.receivedDate)} />
                <Column header={t('waste.tableActions')} body={rollActionsBody} />
              </DataTable>
            )}

            <Paginator
              first={rollPage * pageSize}
              rows={pageSize}
              totalRecords={rollTotalElements}
              onPageChange={(e) => setRollPage(e.page ?? 0)}
            />
          </div>
        </TabPanel>

        <TabPanel header={t('inventory.chuteReusable') || 'Chute Reusable'}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <Button
                label={t('inventory.createChute') || 'Create Chute'}
                icon="pi pi-plus"
                onClick={() => setShowChuteForm(true)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox
                  inputId="groupedReusable"
                  checked={showGroupedReusable}
                  onChange={(e) => setShowGroupedReusable(!!e.checked)}
                />
                <label htmlFor="groupedReusable">{t('inventory.showGroupedStats') || 'Show Grouped Statistics'}</label>
              </div>
            </div>

            {showGroupedReusable ? (
              renderGroupedStatsTable(groupedStatsReusable, groupedLoadingReusable)
            ) : (
              <DataTable
                value={reusablePieces}
                dataKey="id"
                size="small"
                emptyMessage={t('inventory.noReusableChuteFound')}
              >
                <Column header={t('inventory.material')} body={wasteMaterialBody} />
                <Column header={t('inventory.area')} body={(piece: WastePiece) => piece.areaM2.toFixed(2)} />
                <Column header={t('inventory.waste')} body={(piece: WastePiece) => piece.totalWasteAreaM2.toFixed(2)} />
                <Column
                  header={t('inventory.availableArea')}
                  body={(piece: WastePiece) => ((piece.areaM2 || 0) - (piece.totalWasteAreaM2 || 0)).toFixed(2)}
                />
                <Column
                  header={t('inventory.wastePercent')}
                  body={(piece: WastePiece) => {
                    const percent = piece.totalWasteAreaM2 && piece.areaM2
                      ? (piece.totalWasteAreaM2 / piece.areaM2) * 100
                      : 0;
                    return `${percent.toFixed(1)}%`;
                  }}
                />
                <Column header={t('inventory.status')} body={wasteStatusBody} />
                <Column header={t('inventory.received')} body={(piece: WastePiece) => formatDate(piece.createdAt)} />
              </DataTable>
            )}

            <Paginator
              first={wastePage * pageSize}
              rows={pageSize}
              totalRecords={wasteTotalElements}
              onPageChange={(e) => setWastePage(e.page ?? 0)}
            />
          </div>
        </TabPanel>

        <TabPanel header={t('inventory.chuteDechet') || 'Chute Waste'}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <Button
                label={t('inventory.createChute') || 'Create Chute'}
                icon="pi pi-plus"
                onClick={() => setShowChuteForm(true)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox
                  inputId="groupedWaste"
                  checked={showGroupedWaste}
                  onChange={(e) => setShowGroupedWaste(!!e.checked)}
                />
                <label htmlFor="groupedWaste">{t('inventory.showGroupedStats') || 'Show Grouped Statistics'}</label>
              </div>
            </div>

            {showGroupedWaste ? (
              renderGroupedStatsTable(groupedStatsWaste, groupedLoadingWaste)
            ) : (
              <DataTable
                value={scrapPieces}
                dataKey="id"
                size="small"
                emptyMessage={t('inventory.noWasteChuteFound')}
              >
                <Column header={t('inventory.material')} body={wasteMaterialBody} />
                <Column header={t('inventory.area')} body={(piece: WastePiece) => piece.areaM2.toFixed(2)} />
                <Column header={t('inventory.received')} body={(piece: WastePiece) => formatDate(piece.createdAt)} />
              </DataTable>
            )}

            <Paginator
              first={wastePage * pageSize}
              rows={pageSize}
              totalRecords={wasteTotalElements}
              onPageChange={(e) => setWastePage(e.page ?? 0)}
            />
          </div>
        </TabPanel>
      </TabView>

      <Dialog
        header={t('inventory.receiveNewRoll')}
        visible={showForm}
        onHide={handleCancel}
        style={{ width: 'min(900px, 95vw)' }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
                <InputText
                  type="date"
                  id="receivedDate"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
                <Dropdown
                  id="supplierId"
                  value={formData.supplierId}
                  options={supplierOptions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplierId: e.value }))}
                  placeholder={t('inventory.selectSupplier')}
                  filter
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
                <Dropdown
                  id="altierId"
                  value={formData.altierId || ''}
                  options={altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))}
                  onChange={(e) => setFormData((prev) => ({ ...prev, altierId: e.value }))}
                  placeholder={t('inventory.selectWorkshop')}
                  filter
                  required
                />
              </div>
              <div>
                <label htmlFor="materialType">{t('inventory.material')} *</label>
                <Dropdown
                  id="materialType"
                  value={formData.materialType}
                  options={materials.map((mat) => ({ label: mat, value: mat }))}
                  onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="reference">{t('inventory.reference')}</label>
                <InputText
                  id="reference"
                  name="reference"
                  value={formData.reference || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="colorId">{t('inventory.color') || 'Color'} *</label>
                <Dropdown
                  id="colorId"
                  value={formData.colorId || ''}
                  options={colorOptions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, colorId: e.value }))}
                  placeholder={colors.length === 0
                    ? (t('inventory.noColors') || 'No colors configured')
                    : (t('inventory.selectColor') || 'Select color')}
                  filter
                  disabled={colors.length === 0}
                  required={colors.length > 0}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="nbPlis">{t('rolls.plies')} *</label>
                <InputText
                  type="number"
                  id="nbPlis"
                  name="nbPlis"
                  value={String(formData.nbPlis ?? '')}
                  onChange={handleInputChange}
                  min={1}
                  required
                />
              </div>
              <div>
                <label htmlFor="thicknessMm">{t('rolls.thickness')} *</label>
                <InputText
                  type="number"
                  id="thicknessMm"
                  name="thicknessMm"
                  value={String(formData.thicknessMm ?? '')}
                  onChange={handleInputChange}
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="widthMm">{t('rolls.width')}</label>
                <InputText
                  type="number"
                  id="widthMm"
                  name="widthMm"
                  value={String(formData.widthMm ?? '')}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="lengthM">{t('rolls.length')}</label>
                <InputText
                  type="number"
                  id="lengthM"
                  name="lengthM"
                  value={String(formData.lengthM ?? '')}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="areaM2">{t('rolls.area')} *</label>
                <InputText
                  type="number"
                  id="areaM2"
                  name="areaM2"
                  value={String(formData.areaM2 ?? '')}
                  onChange={handleInputChange}
                  step="0.01"
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
              <label htmlFor="qrCode">{t('inventory.qrCode')}</label>
              <InputText
                id="qrCode"
                name="qrCode"
                value={formData.qrCode || ''}
                onChange={handleInputChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="submit" label={t('inventory.addRollToInventory')} />
              <Button type="button" label={t('common.cancel')} severity="secondary" onClick={handleCancel} />
            </div>
          </div>
        </form>
      </Dialog>

      <Dialog
        header={t('inventory.createChute') || 'Create Chute'}
        visible={showChuteForm}
        onHide={() => {
          setShowChuteForm(false);
          setChuteRollId('');
          setParentWastePieceId('');
          setChuteSourceType('ROLL');
        }}
        style={{ width: 'min(900px, 95vw)' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
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

            WastePieceService.create(wasteData).then(response => {
              if (response.success) {
                setWastePage(0);
                loadWastePieces(0, searchTerm, materialFilter, altierFilter);
                setShowChuteForm(false);
                setChuteRollId('');
                setParentWastePieceId('');
                setChuteSourceType('ROLL');
                resetForm();
                alert('Waste piece created successfully!');
              }
            }).catch(err => {
              console.error('Error creating waste piece:', err);
              alert('Failed to create waste piece');
            });
          }}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label htmlFor="chuteSourceType">{t('inventory.sourceType')} *</label>
              <Dropdown
                id="chuteSourceType"
                value={chuteSourceType}
                options={chuteSourceOptions}
                onChange={(e) => {
                  const nextType = e.value as 'ROLL' | 'WASTE_PIECE';
                  setChuteSourceType(nextType);
                  setChuteRollId('');
                  setParentWastePieceId('');
                }}
                required
              />
            </div>

            {chuteSourceType === 'ROLL' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
                  <Dropdown
                    id="supplierId"
                    value={formData.supplierId}
                    options={supplierOptions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplierId: e.value }))}
                    placeholder={t('inventory.selectSupplier')}
                    filter
                    required
                  />
                </div>
                <div>
                  <label htmlFor="materialType">{t('inventory.material')} *</label>
                  <Dropdown
                    id="materialType"
                    value={formData.materialType}
                    options={materials.map((mat) => ({ label: mat, value: mat }))}
                    onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.value }))}
                    required
                  />
                </div>
              </div>
            )}

            {chuteSourceType === 'ROLL' && (
              <div>
                <label htmlFor="rollId">{t('inventory.selectRoll')} *</label>
                <Dropdown
                  id="rollId"
                  value={chuteRollId}
                  options={chuteRollOptions}
                  onChange={(e) => setChuteRollId(e.value)}
                  placeholder={
                    chuteRollsLoading
                      ? t('inventory.loadingRolls')
                      : !formData.supplierId || !formData.materialType
                        ? t('inventory.selectSupplierMaterialFirst')
                        : filteredChuteRolls.length === 0
                          ? t('inventory.noRollsAvailable')
                          : t('inventory.selectRoll')
                  }
                  disabled={!formData.supplierId || !formData.materialType || chuteRollsLoading}
                  filter
                  required
                />
              </div>
            )}

            {chuteSourceType === 'WASTE_PIECE' && (
              <div>
                <label htmlFor="parentWastePieceId">{t('inventory.selectParentWastePiece')} *</label>
                <Dropdown
                  id="parentWastePieceId"
                  value={parentWastePieceId}
                  options={parentWasteOptions}
                  onChange={(e) => setParentWastePieceId(e.value)}
                  placeholder={
                    parentWastePiecesLoading
                      ? t('inventory.loadingWastePieces')
                      : parentWastePieces.length === 0
                        ? t('inventory.noWastePiecesAvailable')
                        : t('inventory.selectWastePiece')
                  }
                  disabled={parentWastePiecesLoading}
                  filter
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
                <InputText
                  type="date"
                  id="receivedDate"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
                <Dropdown
                  id="altierId"
                  value={formData.altierId || ''}
                  options={altiers.map((altier) => ({ label: altier.libelle, value: altier.id }))}
                  onChange={(e) => setFormData((prev) => ({ ...prev, altierId: e.value }))}
                  placeholder={t('inventory.selectWorkshop')}
                  filter
                  required
                  disabled={chuteSourceType === 'WASTE_PIECE'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="reference">{t('rolls.reference')}</label>
                <InputText id="reference" name="reference" value={formData.reference} disabled readOnly />
              </div>
              <div>
                <label htmlFor="nbPlis">{t('rolls.plies')}</label>
                <InputText type="number" id="nbPlis" name="nbPlis" value={String(formData.nbPlis ?? '')} disabled readOnly />
              </div>
              <div>
                <label htmlFor="thicknessMm">{t('rolls.thickness')}</label>
                <InputText type="number" id="thicknessMm" name="thicknessMm" value={String(formData.thicknessMm ?? '')} disabled readOnly />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="widthMm">{t('rolls.width')} *</label>
                <InputText
                  type="number"
                  id="widthMm"
                  name="widthMm"
                  value={String(formData.widthMm ?? '')}
                  onChange={handleDimensionChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="lengthM">{t('rolls.length')} *</label>
                <InputText
                  type="number"
                  id="lengthM"
                  name="lengthM"
                  value={String(formData.lengthM ?? '')}
                  onChange={handleDimensionChange}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label htmlFor="areaM2">{t('rolls.area')}</label>
                <InputText
                  type="number"
                  id="areaM2"
                  name="areaM2"
                  value={formData.areaM2.toFixed(4)}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
              <label htmlFor="qrCode">{t('inventory.qrCode')}</label>
              <InputText
                id="qrCode"
                name="qrCode"
                value={formData.qrCode || ''}
                onChange={handleInputChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="submit" label={t('inventory.createChute') || 'Create Chute'} />
              <Button
                type="button"
                label={t('common.cancel')}
                severity="secondary"
                onClick={() => {
                  setShowChuteForm(false);
                  setChuteRollId('');
                  setParentWastePieceId('');
                  setChuteSourceType('ROLL');
                }}
              />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default InventoryPage;
