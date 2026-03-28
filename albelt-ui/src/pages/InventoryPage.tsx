import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import type { Roll, RollRequest, MaterialType, RollStatus, WasteType, Supplier, Altier } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
import { WastePieceService } from '../services/wastePieceService';
import { getMaterialColor } from '../utils/materialColors';
import { formatDate } from '../utils/date';
import '../styles/InventoryPage.css';

export function InventoryPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RollStatus | 'ALL'>('ALL');
  const [altierFilter, setAltierFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'inventory' | 'reusable' | 'waste'>('inventory');
  const [showChuteForm, setShowChuteForm] = useState(false);
  const [chuteWasteType, setChuteWasteType] = useState<WasteType | undefined>(undefined);

  const materials: MaterialType[] = ['PU', 'PVC', 'CAOUTCHOUC'];
  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];
  const wasteTypes: WasteType[] = ['CHUTE_EXPLOITABLE', 'DECHET', 'NORMAL'];

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
    wasteType: undefined,
  });

  const [chuteRollId, setChuteRollId] = useState<string>('');
  const [filteredChuteRolls, setFilteredChuteRolls] = useState<Roll[]>([]);
  const [chuteRollsLoading, setChuteRollsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Load filtered rolls when supplier and material change for chute form
  useEffect(() => {
    if (formData.supplierId && formData.materialType && chuteWasteType) {
      loadFilteredChuteRolls();
    } else {
      setFilteredChuteRolls([]);
    }
  }, [formData.supplierId, formData.materialType, chuteWasteType]);

  // Auto-populate form fields when a roll is selected for chute creation
  useEffect(() => {
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
          receivedDate: new Date().toISOString().split('T')[0],
        }));
      }
    }
  }, [chuteRollId, filteredChuteRolls]);

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

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rollsResponse, suppliersResponse, altiersResponse] = await Promise.all([
        RollService.getAll(),
        SupplierService.getAll(),
        AltierService.getAll(),
      ]);

      if (rollsResponse.success && rollsResponse.data) {
        console.log('[DEBUG] Loaded rolls:', rollsResponse.data);
        console.log('[DEBUG] Rolls wasteType distribution:', 
          rollsResponse.data.reduce((acc: any, r: Roll) => {
            acc[r.wasteType || 'null'] = (acc[r.wasteType || 'null'] || 0) + 1;
            return acc;
          }, {})
        );
        setRolls(rollsResponse.data);
      }
      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data);
      }
      if (altiersResponse.success && altiersResponse.data) {
        setAltiers(altiersResponse.data);
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
      if (!formData.supplierId || !formData.materialType || !chuteWasteType) {
        setFilteredChuteRolls([]);
        return;
      }

      console.log('[DEBUG] Loading filtered chute rolls with params:', {
        supplierId: formData.supplierId,
        materialType: formData.materialType,
        chuteWasteType: chuteWasteType,
      });

      const response = await RollService.getBySupplierAndMaterialAndWasteType(
        formData.supplierId,
        formData.materialType,
        'NORMAL' // Always filter for NORMAL rolls to convert to chutes
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
        setRolls([...rolls, response.data!]);
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
      wasteType: undefined,
    });
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredRolls = rolls.filter((roll: Roll) => {
    const supplier = suppliers.find(s => s.id === roll.supplierId);
    const rollAltier = roll.altierLibelle || '';
    
    const matchesSearch =
      (roll.materialType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      rollAltier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMaterial = materialFilter === 'ALL' || roll.materialType === materialFilter;
    const matchesStatus = statusFilter === 'ALL' || roll.status === statusFilter;
    const matchesAltier = altierFilter === 'ALL' || rollAltier === altierFilter;

    return matchesSearch && matchesMaterial && matchesStatus && matchesAltier;
  });

  const stats = materials.map(material => ({
    material,
    count: rolls.filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'NORMAL').length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'NORMAL')
      .reduce((sum: number, r: Roll) => sum + (r.areaM2 || 0), 0),
  }));

  const statsReusable = materials.map(material => ({
    material,
    count: rolls.filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'CHUTE_EXPLOITABLE').length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'CHUTE_EXPLOITABLE')
      .reduce((sum: number, r: Roll) => sum + (r.areaM2 || 0), 0),
  }));

  const statsWaste = materials.map(material => ({
    material,
    count: rolls.filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'DECHET').length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED' && r.wasteType === 'DECHET')
      .reduce((sum: number, r: Roll) => sum + (r.areaM2 || 0), 0),
  }));

  // Debug stats calculation
  console.log('[DEBUG Stats] Total rolls:', rolls.length);
  console.log('[DEBUG Stats] Rolls by status:', 
    rolls.reduce((acc: any, r: Roll) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {})
  );
  console.log('[DEBUG Stats] Normal rolls with AVAILABLE/OPENED status:', 
    rolls.filter(r => r.wasteType === 'NORMAL' && r.status !== 'EXHAUSTED').length
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
          onClick={() => setActiveTab('inventory')}
        >
          {t('inventory.title') || 'Inventory'}
        </button>
        <button
          className={`tab-button ${activeTab === 'reusable' ? 'active' : ''}`}
          onClick={() => setActiveTab('reusable')}
        >
          {t('inventory.chuteReusable') || 'Chute Reusable'}
        </button>
        <button
          className={`tab-button ${activeTab === 'waste' ? 'active' : ''}`}
          onClick={() => setActiveTab('waste')}
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
                <div className="form-group">
                  <label htmlFor="wasteType">{t('inventory.wasteType')}</label>
                  <select id="wasteType" name="wasteType" value={formData.wasteType || 'NORMAL'} onChange={handleInputChange}>
                    {wasteTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                  </select>
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
          setChuteWasteType(undefined);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {chuteWasteType === 'CHUTE_EXPLOITABLE' 
                ? t('inventory.createChuteReusable') || 'Create Chute Reusable'
                : t('inventory.createChuteWaste') || 'Create Chute Waste'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const selectedChute = filteredChuteRolls.find(r => r.id === chuteRollId);
              if (!selectedChute) {
                alert('Please select a roll');
                return;
              }
              
              const wasteData = {
                rollId: chuteRollId,
                materialType: selectedChute.materialType,
                nbPlis: formData.nbPlis,
                thicknessMm: formData.thicknessMm,
                widthMm: formData.widthMm,
                lengthM: formData.lengthM,
                areaM2: formData.areaM2,
                status: 'AVAILABLE',
                wasteType: chuteWasteType,
                altierID: formData.altierId,
              };
              
              WastePieceService.create(wasteData).then(response => {
                if (response.success) {
                  loadData();
                  setShowChuteForm(false);
                  setChuteRollId('');
                  setChuteWasteType(undefined);
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
                  <input type="date" id="receivedDate" name="receivedDate" value={formData.receivedDate} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
                  <select id="altierId" name="altierId" value={formData.altierId || ''} onChange={handleInputChange} required>
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
                  {chuteWasteType === 'CHUTE_EXPLOITABLE' 
                    ? t('inventory.createChuteReusable') || 'Create Chute'
                    : t('inventory.createChuteWaste') || 'Create Waste Chute'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowChuteForm(false);
                  setChuteRollId('');
                  setChuteWasteType(undefined);
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
              setChuteWasteType('CHUTE_EXPLOITABLE');
              setShowChuteForm(true);
            }}
          >
            + {t('inventory.createChuteReusable') || 'Create Chute'}
          </button>
        )}
        {activeTab === 'waste' && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setChuteWasteType('DECHET');
              setShowChuteForm(true);
            }}
          >
            + {t('inventory.createChuteWaste') || 'Create Waste Chute'}
          </button>
        )}
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <input type="text" placeholder={t('inventory.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <Search size={18} className="search-icon" />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>{t('inventory.material')}:</label>
            <select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value as MaterialType | 'ALL')} className="filter-select" style={{ position: 'relative' }}>
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
            <select value={altierFilter} onChange={(e) => setAltierFilter(e.target.value)} className="filter-select">
              <option value="ALL">{t('inventory.allWorkshops')}</option>
              {altiers.map(altier => (<option key={altier.id} value={altier.libelle}>{altier.libelle}</option>))}
            </select>
          </div>

          <div className="filter-group">
            <label>{t('inventory.status')}:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RollStatus | 'ALL')} className="filter-select">
              <option value="ALL">{t('inventory.allStatus')}</option>
              {statuses.map(status => (<option key={status} value={status}>{status}</option>))}
            </select>
          </div>

          <div className="results-count">{filteredRolls.length} {t('common.list')}</div>
        </div>
      </div>

      {/* Inventory Table - Show only on Inventory tab */}
      {activeTab === 'inventory' && (
      <div className="inventory-table-container">
        {filteredRolls.length > 0 ? (
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
              {filteredRolls.map((roll: Roll) => {
                const supplier = suppliers.find(s => s.id === roll.supplierId);
                const altierLabel = roll.altierLibelle || 'Unassigned';
                return (
                  <tr key={roll.id}>
                    <td>
                      <span 
                        className="badge-material" 
                        style={{ backgroundColor: getMaterialColor(roll.materialType) }}
                      >
                        {roll.materialType}
                      </span>
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

      {/* Chute Reusable Table - Show only on Reusable tab */}
      {activeTab === 'reusable' && (
      <div className="inventory-table-container">
        {filteredRolls.filter(r => r.wasteType === 'CHUTE_EXPLOITABLE').length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Supplier</th>
                <th>Workshop</th>
                <th>Area (m²)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRolls.filter(r => r.wasteType === 'CHUTE_EXPLOITABLE').map((roll: Roll) => {
                const supplier = suppliers.find(s => s.id === roll.supplierId);
                const altierLabel = roll.altierLibelle || 'Unassigned';
                return (
                  <tr key={roll.id}>
                    <td>
                      <span 
                        className="badge-material" 
                        style={{ backgroundColor: getMaterialColor(roll.materialType) }}
                      >
                        {roll.materialType}
                      </span>
                    </td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{(roll.areaM2 || 0).toFixed(2)}</td>
                    <td><span className={`status-badge status-${roll.status.toLowerCase().replace('_', '-')}`}>{roll.status}</span></td>
                    <td><button className="btn btn-sm btn-view" onClick={() => navigate(`/roll/${roll.id}`)} title="View details"><Eye size={18} /></button></td>
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

      {/* Chute Waste Table - Show only on Waste tab */}
      {activeTab === 'waste' && (
      <div className="inventory-table-container">
        {filteredRolls.filter(r => r.wasteType === 'DECHET').length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Supplier</th>
                <th>Workshop</th>
                <th>Area (m²)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRolls.filter(r => r.wasteType === 'DECHET').map((roll: Roll) => {
                const supplier = suppliers.find(s => s.id === roll.supplierId);
                const altierLabel = roll.altierLibelle || 'Unassigned';
                return (
                  <tr key={roll.id}>
                    <td>
                      <span 
                        className="badge-material" 
                        style={{ backgroundColor: getMaterialColor(roll.materialType) }}
                      >
                        {roll.materialType}
                      </span>
                    </td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{(roll.areaM2 || 0).toFixed(2)}</td>
                    <td><span className={`status-badge status-${roll.status.toLowerCase().replace('_', '-')}`}>{roll.status}</span></td>
                    <td><button className="btn btn-sm btn-view" onClick={() => navigate(`/roll/${roll.id}`)} title="View details"><Eye size={18} /></button></td>
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
      </div>
      )}
    </div>
  );
}

export default InventoryPage;
