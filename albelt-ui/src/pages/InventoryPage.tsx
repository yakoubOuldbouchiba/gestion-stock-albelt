import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import type { Roll, RollRequest, MaterialType, RollStatus, Supplier, Altier, WastePiece, Color } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
import { WastePieceService } from '../services/wastePieceService';
import { ColorService } from '../services/colorService';
import { getMaterialColor } from '../utils/materialColors';
import { formatDate } from '../utils/date';
import { Pagination } from '@components/Pagination';
import '../styles/InventoryPage.css';

export function InventoryPage() {
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
  const [rollTotalPages, setRollTotalPages] = useState(0);
  const [rollTotalElements, setRollTotalElements] = useState(0);
  const [wastePage, setWastePage] = useState(0);
  const [wasteTotalPages, setWasteTotalPages] = useState(0);
  const [wasteTotalElements, setWasteTotalElements] = useState(0);
  const pageSize = 20;

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
        setRollTotalPages(response.data.totalPages || 0);
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
        setWasteTotalPages(response.data.totalPages || 0);
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
    setFormData((prev: RollRequest) => ({
      ...prev,
      [name]: 
        name === 'nbPlis' ? parseInt(value) || 0 :
        name === 'thicknessMm' || name === 'lengthM' || name === 'areaM2' || name === 'widthMm' || name === 'lengthRemainingM' ? parseFloat(value) || 0 :
        value,
    }));
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

  if (isLoading) {
    return <div className="page-loading">{t('common.loading_data')}</div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>{t('inventory.title')}</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('inventory');
            setRollPage(0);
          }}
        >
          {t('inventory.title') || 'Inventory'}
        </button>
        <button
          className={`tab-button ${activeTab === 'reusable' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reusable');
            setWastePage(0);
          }}
        >
          {t('inventory.chuteReusable') || 'Chute Reusable'}
        </button>
        <button
          className={`tab-button ${activeTab === 'waste' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('waste');
            setWastePage(0);
          }}
        >
          {t('inventory.chuteDechet') || 'Chute Waste'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Statistics Cards - Show based on active tab */}
      {activeTab === 'inventory' && (
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.material} className="stat-card" style={{ borderLeftColor: getMaterialColor(stat.material) }}>
            <div className="stat-material" style={{ color: getMaterialColor(stat.material) }}>{stat.material}</div>
            <div className="stat-count">{stat.count}</div>
            <div className="stat-label">{t('inventory.availableRolls')}</div>
            <div className="stat-area">{stat.area.toFixed(2)} m²</div>
          </div>
        ))}
      </div>
      )}

      {activeTab === 'reusable' && (
      <div className="stats-grid">
        {statsReusable.map(stat => (
          <div key={stat.material} className="stat-card" style={{ borderLeftColor: getMaterialColor(stat.material) }}>
            <div className="stat-material" style={{ color: getMaterialColor(stat.material) }}>{stat.material}</div>
            <div className="stat-count">{stat.count}</div>
            <div className="stat-label">{t('inventory.chuteReusable')}</div>
            <div className="stat-area">{stat.area.toFixed(2)} m²</div>
          </div>
        ))}
      </div>
      )}

      {activeTab === 'waste' && (
      <div className="stats-grid">
        {statsWaste.map(stat => (
          <div key={stat.material} className="stat-card" style={{ borderLeftColor: getMaterialColor(stat.material) }}>
            <div className="stat-material" style={{ color: getMaterialColor(stat.material) }}>{stat.material}</div>
            <div className="stat-count">{stat.count}</div>
            <div className="stat-label">{t('inventory.chuteDechet')}</div>
            <div className="stat-area">{stat.area.toFixed(2)} m²</div>
          </div>
        ))}
      </div>
      )}

      {/* Add Roll Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('inventory.receiveNewRoll')}</h2>
            <form onSubmit={handleSubmit} className="roll-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
                  <input type="date" id="receivedDate" name="receivedDate" value={formData.receivedDate} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
                  <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleInputChange} required>
                    <option value="">{t('inventory.selectSupplier')}</option>
                    {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name || 'N/A'}</option>))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
                  <select id="altierId" name="altierId" value={formData.altierId || ''} onChange={handleInputChange} required>
                    <option value="">{t('inventory.selectWorkshop')}</option>
                    {altiers.map(altier => (<option key={altier.id} value={altier.id}>{altier.libelle}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="materialType">{t('inventory.material')} *</label>
                  <select id="materialType" name="materialType" value={formData.materialType} onChange={handleInputChange} required>
                    {materials.map(mat => (<option key={mat} value={mat}>{mat}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="colorId">{t('inventory.color') || 'Color'} *</label>
                  <select
                    id="colorId"
                    name="colorId"
                    value={formData.colorId || ''}
                    onChange={handleInputChange}
                    required={colors.length > 0}
                    disabled={colors.length === 0}
                  >
                    <option value="">
                      {colors.length === 0
                        ? (t('inventory.noColors') || 'No colors configured')
                        : (t('inventory.selectColor') || 'Select color')}
                    </option>
                    {colors.filter((color) => color.isActive).map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name} ({color.hexCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nbPlis">{t('rolls.plies')} *</label>
                  <input type="number" id="nbPlis" name="nbPlis" value={formData.nbPlis} onChange={handleInputChange} required min="1" />
                </div>
                <div className="form-group">
                  <label htmlFor="thicknessMm">{t('rolls.thickness')} *</label>
                  <input type="number" id="thicknessMm" name="thicknessMm" value={formData.thicknessMm} onChange={handleInputChange} required placeholder="e.g., 2.5" step="0.1" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="widthMm">{t('rolls.width')} (mm) *</label>
                  <input type="number" id="widthMm" name="widthMm" value={formData.widthMm} onChange={handleInputChange} required placeholder="e.g., 1000" />
                </div>
                <div className="form-group">
                  <label htmlFor="lengthM">{t('rolls.length')} (m) *</label>
                  <input type="number" id="lengthM" name="lengthM" value={formData.lengthM} onChange={handleInputChange} required placeholder="e.g., 50" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="areaM2">{t('rolls.area')} *</label>
                  <input type="number" id="areaM2" name="areaM2" value={formData.areaM2} onChange={handleInputChange} required placeholder="e.g., 50" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="qrCode">{t('inventory.qrCode')}</label>
                  <input type="text" id="qrCode" name="qrCode" value={formData.qrCode || ''} onChange={handleInputChange} placeholder="QR code identifier" />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{t('inventory.addRollToInventory')}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Chute Form Modal */}
      {showChuteForm && (
        <div className="modal-overlay" onClick={() => {
          setShowChuteForm(false);
          setChuteRollId('');
          setParentWastePieceId('');
          setChuteSourceType('ROLL');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {t('inventory.createChute') || 'Create Chute'}
            </h2>
            <form onSubmit={(e) => {
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
            }} className="roll-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="chuteSourceType">Source Type *</label>
                  <select
                    id="chuteSourceType"
                    value={chuteSourceType}
                    onChange={(e) => {
                      const nextType = e.target.value as 'ROLL' | 'WASTE_PIECE';
                      setChuteSourceType(nextType);
                      setChuteRollId('');
                      setParentWastePieceId('');
                    }}
                    required
                  >
                    <option value="ROLL">Roll</option>
                    <option value="WASTE_PIECE">Waste Piece</option>
                  </select>
                </div>
              </div>

              {chuteSourceType === 'ROLL' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
                  <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleInputChange} required>
                    <option value="">{t('inventory.selectSupplier')}</option>
                    {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name || 'N/A'}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="materialType">{t('inventory.material')} *</label>
                  <select id="materialType" name="materialType" value={formData.materialType} onChange={handleInputChange} required>
                    {materials.map(mat => (<option key={mat} value={mat}>{mat}</option>))}
                  </select>
                </div>
              </div>
              )}

              {chuteSourceType === 'ROLL' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rollId">Select Roll *</label>
                    <select 
                      id="rollId" 
                      value={chuteRollId} 
                      onChange={(e) => setChuteRollId(e.target.value)} 
                      required
                      disabled={!formData.supplierId || !formData.materialType || chuteRollsLoading}
                    >
                      <option value="">
                        {chuteRollsLoading
                          ? 'Loading rolls...'
                          : !formData.supplierId || !formData.materialType 
                          ? 'Select supplier and material first' 
                          : filteredChuteRolls.length === 0
                          ? 'No rolls available'
                          : 'Select a roll'}
                      </option>
                      {filteredChuteRolls.map(roll => (
                        <option key={roll.id} value={roll.id}>
                          Area: {roll.areaM2}m² | Width: {roll.widthMm}mm | Length: {roll.lengthM}m
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {chuteSourceType === 'WASTE_PIECE' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="parentWastePieceId">Select Parent Waste Piece *</label>
                    <select
                      id="parentWastePieceId"
                      value={parentWastePieceId}
                      onChange={(e) => setParentWastePieceId(e.target.value)}
                      required
                      disabled={parentWastePiecesLoading}
                    >
                      <option value="">
                        {parentWastePiecesLoading
                          ? 'Loading waste pieces...'
                          : parentWastePieces.length === 0
                          ? 'No waste pieces available'
                          : 'Select a waste piece'}
                      </option>
                      {parentWastePieces.map(piece => (
                        <option key={piece.id} value={piece.id}>
                          {piece.materialType} | Area: {piece.areaM2.toFixed(2)}m² | Width: {piece.widthMm}mm | Length: {piece.lengthM}m
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
                  <input type="date" id="receivedDate" name="receivedDate" value={formData.receivedDate} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
                  <select id="altierId" name="altierId" value={formData.altierId || ''} onChange={handleInputChange} required disabled={chuteSourceType === 'WASTE_PIECE'}>
                    <option value="">{t('inventory.selectWorkshop')}</option>
                    {altiers.map(altier => (<option key={altier.id} value={altier.id}>{altier.libelle}</option>))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nbPlis">{t('rolls.plies')} (from roll)</label>
                  <input type="number" id="nbPlis" name="nbPlis" value={formData.nbPlis} disabled readOnly />
                </div>
                <div className="form-group">
                  <label htmlFor="thicknessMm">{t('rolls.thickness')} (from roll)</label>
                  <input type="number" id="thicknessMm" name="thicknessMm" value={formData.thicknessMm} disabled readOnly placeholder="mm" step="0.1" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="widthMm">{t('rolls.width')} (mm) *</label>
                  <input type="number" id="widthMm" name="widthMm" value={formData.widthMm} onChange={handleDimensionChange} placeholder="mm" required />
                </div>
                <div className="form-group">
                  <label htmlFor="lengthM">{t('rolls.length')} (m) *</label>
                  <input type="number" id="lengthM" name="lengthM" value={formData.lengthM} onChange={handleDimensionChange} placeholder="m" step="0.01" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="areaM2">{t('rolls.area')} (m²) - Auto</label>
                  <input type="number" id="areaM2" name="areaM2" value={formData.areaM2.toFixed(4)} disabled readOnly placeholder="m²" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="qrCode">{t('inventory.qrCode')}</label>
                  <input type="text" id="qrCode" name="qrCode" value={formData.qrCode || ''} onChange={handleInputChange} placeholder="QR code identifier" />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {t('inventory.createChute') || 'Create Chute'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowChuteForm(false);
                  setChuteRollId('');
                  setParentWastePieceId('');
                  setChuteSourceType('ROLL');
                }}>{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Controls and Table - Show based on active tab */}
      {(activeTab === 'inventory' || activeTab === 'reusable' || activeTab === 'waste') && (
      <div>
      {/* Action Buttons - Above the list */}
      <div className="action-buttons-section">
        {activeTab === 'inventory' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + {t('inventory.receiveNewRoll') || 'Receive Roll'}
          </button>
        )}
        {activeTab === 'reusable' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowChuteForm(true);
            }}
          >
            + {t('inventory.createChute') || 'Create Chute'}
          </button>
        )}
        {activeTab === 'waste' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowChuteForm(true);
            }}
          >
            + {t('inventory.createChute') || 'Create Chute'}
          </button>
        )}
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('inventory.search')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setRollPage(0);
              setWastePage(0);
            }}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>{t('inventory.material')}:</label>
            <select
              value={materialFilter}
              onChange={(e) => {
                setMaterialFilter(e.target.value as MaterialType | 'ALL');
                setRollPage(0);
                setWastePage(0);
              }}
              className="filter-select"
              style={{ position: 'relative' }}
            >
              <option value="ALL">{t('inventory.allMaterials')}</option>
              {materials.map(mat => (
                <option key={mat} value={mat}>
                  ■ {mat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('sidebar.workshops')}:</label>
            <select
              value={altierFilter}
              onChange={(e) => {
                setAltierFilter(e.target.value);
                setRollPage(0);
                setWastePage(0);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('inventory.allWorkshops')}</option>
              {altiers.map(altier => (
                <option key={altier.id} value={altier.id}>
                  {altier.libelle}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'inventory' && (
            <div className="filter-group">
              <label>{t('inventory.status')}:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as RollStatus | 'ALL');
                  setRollPage(0);
                }}
                className="filter-select"
              >
                <option value="ALL">{t('inventory.allStatus')}</option>
                {statuses.map(status => (<option key={status} value={status}>{status}</option>))}
              </select>
            </div>
          )}

          <div className="results-count">
            {(activeTab === 'inventory' ? rollTotalElements : wasteTotalElements)} {t('common.list')}
          </div>
        </div>
      </div>

      {/* Inventory Table - Show only on Inventory tab */}
      {activeTab === 'inventory' && (
      <div className="inventory-table-container">
        {rolls.length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>{t('waste.tableMaterial')}</th>
                <th>{t('waste.tableParent')}</th>
                <th>{t('waste.tableSupplier') || 'Supplier'}</th>
                <th>{t('waste.tableWorkshop') || 'Workshop'}</th>
                <th>{t('waste.tableArea')}</th>
                <th>Waste (m²)</th>
                <th>Available (m²)</th>
                <th>Waste %</th>
                <th>{t('waste.tableStatus')}</th>
                <th>{t('waste.tableCreated')}</th>
                <th>{t('waste.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rolls.map((roll: Roll) => {
                const supplier = suppliers.find(s => s.id === roll.supplierId);
                const altierLabel = roll.altierLibelle || 'Unassigned';
                const materialDetails = `${roll.widthMm ?? 'N/A'}mm × ${roll.lengthM ?? 'N/A'}m • ${roll.nbPlis ?? 'N/A'} plis`;
                return (
                  <tr key={roll.id}>
                    <td>
                      <span 
                        className="badge-material" 
                        style={{ backgroundColor: getMaterialColor(roll.materialType, roll.colorHexCode) }}
                      >
                        {roll.materialType}
                      </span>
                      <div className="material-details">{materialDetails}</div>
                    </td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{(roll.areaM2 || 0).toFixed(2)}</td>
                    <td>{(roll.totalWasteAreaM2 || 0).toFixed(2)}</td>
                    <td>{((roll.areaM2 || 0) - (roll.totalWasteAreaM2 || 0)).toFixed(2)}</td>
                    <td><div className="percentage-cell"><span>{roll.totalWasteAreaM2 && roll.areaM2 ? ((roll.totalWasteAreaM2 / roll.areaM2) * 100).toFixed(1) : '0.0'}%</span></div></td>
                    <td><span className={`status-badge status-${roll.status.toLowerCase().replace('_', '-')}`}>{roll.status}</span></td>
                    <td>{formatDate(roll.receivedDate)}</td>
                    <td><button className="btn btn-sm btn-view" onClick={() => navigate(`/roll/${roll.id}`)} title="View details"><Eye size={18} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No rolls found</p>
            {searchTerm || materialFilter !== 'ALL' || statusFilter !== 'ALL' || altierFilter !== 'ALL' ? (
              <p className="empty-state-hint">Try adjusting your filters</p>
            ) : (
              <p className="empty-state-hint">Click "Receive Roll" to add inventory</p>
            )}
          </div>
        )}
      </div>
      )}
      {activeTab === 'inventory' && (
        <Pagination page={rollPage} totalPages={rollTotalPages} onPageChange={setRollPage} />
      )}

      {/* Chute Reusable Table - Show only on Reusable tab */}
      {activeTab === 'reusable' && (
      <div className="inventory-table-container">
        {reusablePieces.length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Supplier</th>
                <th>Workshop</th>
                <th>Area (m²)</th>
                <th>Waste (m²)</th>
                <th>Available (m²)</th>
                <th>Waste %</th>
                <th>Status</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reusablePieces.map((piece: WastePiece) => {
                const altierLabel = piece.altierLibelle || 'Unassigned';
                const rollForPiece = rolls.find(r => r.id === piece.rollId);
                const supplier = rollForPiece ? suppliers.find(s => s.id === rollForPiece.supplierId) : undefined;
                const receivedDate = rollForPiece?.receivedDate ? formatDate(rollForPiece.receivedDate) : formatDate(piece.createdAt);
                const wasteArea = piece.areaM2 || 0;
                const availableArea = 0;
                const wastePct = 100;
                const materialDetails = `${piece.widthMm ?? 'N/A'}mm × ${piece.lengthM ?? 'N/A'}m • ${piece.nbPlis ?? 'N/A'} plis`;
                return (
                  <tr key={piece.id}>
                    <td>
                      <span 
                        className="badge-material"
                        style={{ backgroundColor: getMaterialColor(piece.materialType, piece.colorHexCode) }}
                      >
                        {piece.materialType}
                      </span>
                      <div className="material-details">{materialDetails}</div>
                    </td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{wasteArea.toFixed(2)}</td>
                    <td>{wasteArea.toFixed(2)}</td>
                    <td>{availableArea.toFixed(2)}</td>
                    <td><div className="percentage-cell"><span>{wastePct.toFixed(1)}%</span></div></td>
                    <td><span className={`status-badge status-${piece.status.toLowerCase().replace('_', '-')}`}>{piece.status}</span></td>
                    <td>{receivedDate}</td>
                    <td>
                      {piece.rollId ? (
                        <button className="btn btn-sm btn-view" onClick={() => navigate(`/roll/${piece.rollId}`)} title="View roll details">
                          <Eye size={18} />
                        </button>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No reusable chute found</p>
          </div>
        )}
      </div>
      )}
      {activeTab === 'reusable' && (
        <Pagination page={wastePage} totalPages={wasteTotalPages} onPageChange={setWastePage} />
      )}

      {/* Chute Waste Table - Show only on Waste tab */}
      {activeTab === 'waste' && (
      <div className="inventory-table-container">
        {scrapPieces.length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Supplier</th>
                <th>Workshop</th>
                <th>Area (m²)</th>
                <th>Waste (m²)</th>
                <th>Available (m²)</th>
                <th>Waste %</th>
                <th>Status</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scrapPieces.map((piece: WastePiece) => {
                const altierLabel = piece.altierLibelle || 'Unassigned';
                const rollForPiece = rolls.find(r => r.id === piece.rollId);
                const supplier = rollForPiece ? suppliers.find(s => s.id === rollForPiece.supplierId) : undefined;
                const receivedDate = rollForPiece?.receivedDate ? formatDate(rollForPiece.receivedDate) : formatDate(piece.createdAt);
                const wasteArea = piece.areaM2 || 0;
                const availableArea = 0;
                const wastePct = 100;
                const materialDetails = `${piece.widthMm ?? 'N/A'}mm × ${piece.lengthM ?? 'N/A'}m • ${piece.nbPlis ?? 'N/A'} plis`;
                return (
                  <tr key={piece.id}>
                    <td>
                      <span className="badge-material" style={{ backgroundColor: getMaterialColor(piece.materialType, piece.colorHexCode) }}>{piece.materialType}</span>
                      <div className="material-details">{materialDetails}</div>
                    </td>
                    <td>{piece.parentWastePieceId ? piece.parentWastePieceId.substring(0, 8) : '-'}</td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{wasteArea.toFixed(2)}</td>
                    <td>{wasteArea.toFixed(2)}</td>
                    <td>{availableArea.toFixed(2)}</td>
                    <td><div className="percentage-cell"><span>{wastePct.toFixed(1)}%</span></div></td>
                    <td><span className={`status-badge status-${piece.status.toLowerCase().replace('_', '-')}`}>{piece.status}</span></td>
                    <td>{receivedDate}</td>
                    <td>
                      {piece.rollId ? (
                        <button className="btn btn-sm btn-view" onClick={() => navigate(`/roll/${piece.rollId}`)} title="View roll details">
                          <Eye size={18} />
                        </button>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No waste chute found</p>
          </div>
        )}
      </div>
      )}
      {activeTab === 'waste' && (
        <Pagination page={wastePage} totalPages={wasteTotalPages} onPageChange={setWastePage} />
      )}
      </div>
      )}
    </div>
  );
}

export default InventoryPage;
