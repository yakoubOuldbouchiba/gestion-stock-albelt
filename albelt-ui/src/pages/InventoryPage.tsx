import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import type { Roll, RollRequest, MaterialType, RollStatus, WasteType, Supplier, Altier } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
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
    altierLabel: '',
    receivedDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

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
    count: rolls.filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED').length,
    area: rolls
      .filter((r: Roll) => r.materialType === material && r.status !== 'EXHAUSTED')
      .reduce((sum: number, r: Roll) => sum + (r.areaM2 || 0), 0),
  }));

  if (isLoading) {
    return <div className="page-loading">{t('common.loading_data')}</div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>{t('inventory.title')}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + {t('rolls.addRoll')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.material} className="stat-card">
            <div className="stat-material">{stat.material}</div>
            <div className="stat-count">{stat.count}</div>
            <div className="stat-label">{t('inventory.availableRolls')}</div>
            <div className="stat-area">{stat.area.toFixed(2)} m²</div>
          </div>
        ))}
      </div>

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
                  <label htmlFor="altierLabel">{t('inventory.selectWorkshopLabel')} *</label>
                  <select id="altierLabel" name="altierLabel" value={formData.altierLabel || ''} onChange={handleInputChange} required>
                    <option value="">{t('inventory.selectWorkshop')}</option>
                    {altiers.map(altier => (<option key={altier.id} value={altier.libelle}>{altier.libelle}</option>))}
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

      {/* Controls */}
      <div className="inventory-controls">
        <div className="search-box">
          <input type="text" placeholder={t('inventory.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          <Search size={18} className="search-icon" />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>{t('inventory.material')}:</label>
            <select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value as MaterialType | 'ALL')} className="filter-select">
              <option value="ALL">{t('inventory.allMaterials')}</option>
              {materials.map(mat => (<option key={mat} value={mat}>{mat}</option>))}
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

      {/* Inventory Table */}
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
                    <td><span className={`badge badge-${roll.materialType.toLowerCase()}`}>{roll.materialType}</span></td>
                    <td>{supplier?.name || 'N/A'}</td>
                    <td><span className="workshop-badge">{altierLabel}</span></td>
                    <td>{(roll.areaM2 || 0).toFixed(2)}</td>
                    <td>{(roll.totalWasteAreaM2 || 0).toFixed(2)}</td>
                    <td>{((roll.areaM2 || 0) - (roll.totalWasteAreaM2 || 0)).toFixed(2)}</td>
                    <td><div className="percentage-cell"><span>{roll.totalWasteAreaM2 && roll.areaM2 ? ((roll.totalWasteAreaM2 / roll.areaM2) * 100).toFixed(1) : '0.0'}%</span></div></td>
                    <td><span className={`status-badge status-${roll.status.toLowerCase().replace('_', '-')}`}>{roll.status}</span></td>
                    <td>{new Date(roll.receivedDate).toLocaleDateString()}</td>
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
    </div>
  );
}

export default InventoryPage;
