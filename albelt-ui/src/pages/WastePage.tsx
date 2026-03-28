import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { WastePiece, CuttingOperation, Roll, MaterialType, WasteStatus } from '../types/index';
import { WastePieceService } from '@services/wastePieceService';
import { CuttingOperationService } from '@services/cuttingOperationService';
import { RollService } from '@services/rollService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import '../styles/WastePage.css';

export function WastePage() {
  const { t } = useI18n();
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [cuttingOperations, setCuttingOperations] = useState<CuttingOperation[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WasteStatus>('ALL');
  const [materialFilter, setMaterialFilter] = useState<'ALL' | MaterialType>('ALL');
  const [selectedWaste, setSelectedWaste] = useState<WastePiece | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReuseModal, setShowReuseModal] = useState(false);
  const [selectedForReuse, setSelectedForReuse] = useState<WastePiece | null>(null);
  const [reuseInOperation, setReuseInOperation] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalUsed: 0,
    totalScrap: 0,
    totalWasteArea: 0,
    reuseEfficiency: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wasteResponse, operationsResponse, rollsResponse] = await Promise.all([
        WastePieceService.getLargeAvailable(0, 100),
        CuttingOperationService.getAll(),
        RollService.getAll(),
      ]);

      if (wasteResponse.success && wasteResponse.data) {
        setWastePieces(wasteResponse.data);
      }
      if (operationsResponse.success && operationsResponse.data) {
        setCuttingOperations(operationsResponse.data);
      }
      if (rollsResponse.success && rollsResponse.data) {
        setRolls(rollsResponse.data);
      }

      // Calculate statistics
      if (wasteResponse.data) {
        const available = wasteResponse.data.filter(w => w.status === 'AVAILABLE').length;
        const used = wasteResponse.data.filter(w => w.status === 'USED_IN_ORDER').length;
        const scrap = wasteResponse.data.filter(w => w.status === 'SCRAP').length;
        const totalArea = wasteResponse.data.reduce((sum, w) => sum + (w.areaM2 || 0), 0);

        setStats({
          totalAvailable: available,
          totalUsed: used,
          totalScrap: scrap,
          totalWasteArea: totalArea,
          reuseEfficiency: available > 0 ? ((used / (available + used + scrap)) * 100) : 0,
        });
      }
    } catch (err) {
      setError(t('waste.failedToLoadData'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsScrap = async (wasteId: string) => {
    if (!window.confirm(t('waste.confirmMarkScrap'))) return;

    try {
      const response = await WastePieceService.markAsScrap(wasteId);
      if (response.success && response.data) {
        setWastePieces(wastePieces.map(w => (w.id === wasteId ? response.data! : w)));
        setShowDetail(false);
      }
    } catch (err) {
      setError(t('waste.failedToMarkScrap'));
      console.error(err);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!selectedForReuse || !reuseInOperation) {
      setError(t('waste.selectCuttingOp'));
      return;
    }

    try {
      const response = await WastePieceService.markAsUsed(selectedForReuse.id);
      if (response.success && response.data) {
        setWastePieces(wastePieces.map(w => (w.id === selectedForReuse.id ? response.data! : w)));
        setShowReuseModal(false);
        setSelectedForReuse(null);
        setReuseInOperation('');
      }
    } catch (err) {
      setError(t('waste.failedToMarkUsed'));
      console.error(err);
    }
  };

  const filteredWastePieces = wastePieces.filter(waste => {
    const matchesSearch =
      (waste.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (waste.materialType || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || waste.status === statusFilter;
    const matchesMaterial = materialFilter === 'ALL' || waste.materialType === materialFilter;

    return matchesSearch && matchesStatus && matchesMaterial;
  });

  const getStatusColor = (status: WasteStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'USED_IN_ORDER':
        return 'status-used';
      case 'SCRAP':
        return 'status-scrap';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: WasteStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return t('waste.statusAvailable');
      case 'USED_IN_ORDER':
        return t('waste.statusUsed');
      case 'SCRAP':
        return t('waste.statusScrap');
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div className="page-loading">{t('waste.loadingData')}</div>;
  }

  return (
    <div className="waste-page">
      <div className="page-header">
        <h1>{t('waste.title')}</h1>
        <button className="btn btn-primary" onClick={loadData}>
          ↻ {t('waste.refreshData')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-count" style={{ color: '#2ecc71' }}>
            {stats.totalAvailable}
          </div>
          <div className="stat-label">{t('waste.availableForReuse')}</div>
          <div className="stat-percentage">{stats.totalWasteArea.toFixed(2)} m²</div>
        </div>
        <div className="stat-card">
          <div className="stat-count" style={{ color: '#3498db' }}>
            {stats.totalUsed}
          </div>
          <div className="stat-label">{t('waste.successfullyReused')}</div>
          <div className="stat-percentage">
            {stats.totalAvailable + stats.totalUsed > 0
              ? ((stats.totalUsed / (stats.totalAvailable + stats.totalUsed)) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-count" style={{ color: '#e74c3c' }}>
            {stats.totalScrap}
          </div>
          <div className="stat-label">{t('waste.scrapDiscarded')}</div>
          <div className="stat-percentage">
            {stats.totalAvailable + stats.totalScrap > 0
              ? ((stats.totalScrap / (stats.totalAvailable + stats.totalScrap)) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
        <div className="stat-card waste-efficiency">
          <div className="stat-count">{stats.reuseEfficiency.toFixed(1)}</div>
          <div className="stat-label">{t('waste.reuseEfficiency')}</div>
          <div className="stat-percentage">%</div>
        </div>
      </div>

      {/* Waste Detail Modal */}
      {showDetail && selectedWaste && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('waste.wasteDetailsTitle')}</h2>
            <div className="detail-view">
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailWasteId')}:</span>
                <span className="detail-value">{selectedWaste.id.substring(0, 8)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailMaterial')}:</span>
                <span className={`badge badge-${selectedWaste.materialType.toLowerCase()}`}>
                  {selectedWaste.materialType}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailDimensions')}:</span>
                <span className="detail-value">
                  {selectedWaste.widthMm}mm × {selectedWaste.lengthM}m
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailArea')}:</span>
                <span className="detail-value">{(selectedWaste.areaM2 || 0).toFixed(2)} m²</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailStatus')}:</span>
                <span className={`status-badge ${getStatusColor(selectedWaste.status)}`}>
                  {getStatusLabel(selectedWaste.status)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailLargeWaste')}:</span>
                <span className="detail-value">{((selectedWaste.areaM2 || 0) > 3.0) ? t('waste.yes') : t('waste.no')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailReuseCandidate')}:</span>
                <span className="detail-value">{((selectedWaste.status === 'AVAILABLE' || selectedWaste.status === 'RESERVED') && ((selectedWaste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('waste.detailCreated')}:</span>
                <span className="detail-value">
                  {formatDate(selectedWaste.createdAt)}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              {selectedWaste.status === 'AVAILABLE' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setSelectedForReuse(selectedWaste);
                      setShowReuseModal(true);
                      setShowDetail(false);
                    }}
                  >
                    ♻ {t('waste.markAsUsed')}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleMarkAsScrap(selectedWaste.id)}
                  >
                    {t('waste.markAsScrap')}
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                {t('waste.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reuse Modal */}
      {showReuseModal && selectedForReuse && (
        <div className="modal-overlay" onClick={() => setShowReuseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('waste.markAsReuseTitle')}</h2>
            <p className="modal-description">
              {t('waste.reuseModalDesc')}
            </p>
            <div className="form-group">
              <label htmlFor="reuse-operation">{t('waste.cuttingOperation')} *</label>
              <select
                id="reuse-operation"
                value={reuseInOperation}
                onChange={(e) => setReuseInOperation(e.target.value)}
              >
                <option value="">{t('waste.selectOperation')}</option>
                {cuttingOperations.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.id.substring(0, 8)} - Roll:{' '}
                    {rolls.find(r => r.id === op.rollId)?.materialType} - Operator: {op.operatorId}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleMarkAsUsed}>
                {t('waste.confirmReuse')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowReuseModal(false);
                  setSelectedForReuse(null);
                  setReuseInOperation('');
                }}
              >
                {t('waste.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="waste-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('waste.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label htmlFor="status-filter">{t('waste.filterStatus')}:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | WasteStatus)}
              className="filter-select"
            >
              <option value="ALL">{t('waste.all')}</option>
              <option value="AVAILABLE">{t('waste.statusAvailable')}</option>
              <option value="USED_IN_ORDER">{t('waste.statusUsed')}</option>
              <option value="SCRAP">{t('waste.statusScrap')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="material-filter">{t('waste.filterMaterial')}:</label>
            <select
              id="material-filter"
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value as 'ALL' | MaterialType)}
              className="filter-select"
            >
              <option value="ALL">{t('waste.allMaterials')}</option>
              <option value="PU">PU</option>
              <option value="PVC">PVC</option>
              <option value="CAOUTCHOUC">Caoutchouc</option>
            </select>
          </div>

          <span className="results-count">{filteredWastePieces.length} {t('waste.pieces')}</span>
        </div>
      </div>

      {/* Waste Pieces Table */}
      <div className="waste-table-container">
        {filteredWastePieces.length > 0 ? (
          <table className="waste-table">
            <thead>
              <tr>
                <th>{t('waste.tableWasteId')}</th>
                <th>{t('waste.tableMaterial')}</th>
                <th>{t('waste.tableDimensions')}</th>
                <th>{t('waste.tableArea')}</th>
                <th>{t('waste.tableStatus')}</th>
                <th>{t('waste.tableSize')}</th>
                <th>{t('waste.tableReuse')}</th>
                <th>{t('waste.tableCreated')}</th>
                <th>{t('waste.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWastePieces.map(waste => (
                <tr key={waste.id} className={`waste-row waste-${waste.status.toLowerCase()}`}>
                  <td className="waste-id">{waste.id.substring(0, 8)}</td>
                  <td>
                    <span className={`badge badge-${waste.materialType.toLowerCase()}`}>
                      {waste.materialType}
                    </span>
                  </td>
                  <td>
                    {waste.widthMm}mm × {waste.lengthM}m
                  </td>
                  <td className="waste-area">{(waste.areaM2 || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(waste.status)}`}>
                      {getStatusLabel(waste.status)}
                    </span>
                  </td>
                  <td>{((waste.areaM2 || 0) > 3.0) ? t('waste.large') : t('waste.small')}</td>
                  <td>{((waste.status === 'AVAILABLE' || waste.status === 'RESERVED') && ((waste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}</td>
                  <td>{formatDate(waste.createdAt)}</td>
                  <td className="waste-actions">
                    <button
                      className="btn btn-sm btn-view"
                      onClick={() => {
                        setSelectedWaste(waste);
                        setShowDetail(true);
                      }}
                    >
                      {t('waste.view')}
                    </button>
                    {waste.status === 'AVAILABLE' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          setSelectedForReuse(waste);
                          setShowReuseModal(true);
                        }}
                        title={t('waste.reuseTooltip')}
                      >
                        ♻ {t('waste.reuse')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{t('waste.noPiecesFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
