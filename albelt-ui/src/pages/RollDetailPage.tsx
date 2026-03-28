import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Roll, RollStatus, Supplier, WastePiece } from '../types/index';
import { RollService } from '../services/rollService';
import { SupplierService } from '../services/supplierService';
import { WastePieceService } from '../services/wastePieceService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import '../styles/RollDetailPage.css';

export function RollDetailPage() {
  const { t } = useI18n();
  const { rollId } = useParams<{ rollId: string }>();
  const navigate = useNavigate();
  
  const [roll, setRoll] = useState<Roll | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];

  useEffect(() => {
    loadRollDetails();
  }, [rollId]);

  const loadRollDetails = async () => {
    if (!rollId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [rollResponse, suppliersResponse, wasteResponse] = await Promise.all([
        RollService.getById(rollId),
        SupplierService.getAll(),
        WastePieceService.getByRoll(rollId),
      ]);

      if (rollResponse.success && rollResponse.data) {
        setRoll(rollResponse.data);
        
        if (suppliersResponse.success && suppliersResponse.data) {
          const sup = suppliersResponse.data.find(s => s.id === rollResponse.data!.supplierId);
          setSupplier(sup || null);
        }
      } else {
        setError(t('rollDetail.failedToLoad'));
      }

      if (wasteResponse.success && wasteResponse.data) {
        setWastePieces(wasteResponse.data);
      } else {
        setWastePieces([]);
      }
    } catch (err) {
      setError(t('rollDetail.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RollStatus) => {
    if (!roll) return;
    
    try {
      const response = await RollService.updateStatus(roll.id, newStatus);
      if (response.success && response.data) {
        setRoll(response.data);
      }
    } catch (err) {
      setError(t('rollDetail.failedToUpdate'));
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="page-loading">{t('rollDetail.loading')}</div>;
  }

  if (!roll) {
    return (
      <div className="roll-detail-page">
        <div className="error-container">
          <p className="error-message">{error || t('rollDetail.notFound')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/inventory')}>
            ← {t('rollDetail.backToInventory')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="roll-detail-page">
      <div className="detail-header">
        <button className="btn btn-back" onClick={() => navigate('/inventory')} title={t('rollDetail.backTooltip')}>
          ← {t('rollDetail.back')}
        </button>
        <h1>{t('rollDetail.title')}</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(`/roll/${roll.id}/movements`)} title={t('rollDetail.movementsTooltip')}>
            📍 {t('rollDetail.movements')}
          </button>
          <span className={`badge badge-${roll.materialType.toLowerCase()}`}>{roll.materialType}</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-content">
        <div className="detail-card">
          <h2>{t('rollDetail.basicInfo')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">{t('rollDetail.rollId')}:</span>
              <span className="value">{roll.id}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.material')}:</span>
              <span className="badge" style={{ marginTop: '0.25rem' }}>{roll.materialType}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.supplier')}:</span>
              <span className="value">{supplier?.name || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.workshop')}:</span>
              <span className="value workshop-info">{roll.altierLibelle || t('rollDetail.unassigned')}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.receivedDate')}:</span>
              <span className="value">{formatDate(roll.receivedDate)}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>{t('rollDetail.materialSpecs')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">{t('rollDetail.plies')}:</span>
              <span className="value">{roll.nbPlis}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.thickness')}:</span>
              <span className="value">{roll.thicknessMm} mm</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>{t('rollDetail.dimensions')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">{t('rollDetail.width')}:</span>
              <span className="value">{roll.widthMm} mm</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.length')}:</span>
              <span className="value">{roll.lengthM} m</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.area')}:</span>
              <span className="value">{roll.areaM2.toFixed(2)} m²</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>{t('rollDetail.processing')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">{t('rollDetail.totalArea')}:</span>
              <span className="value">{roll.areaM2.toFixed(2)} m²</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.totalWaste')}:</span>
              <span className="value">{roll.totalWasteAreaM2.toFixed(2)} m²</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.totalCuts')}:</span>
              <span className="value">{roll.totalCuts}</span>
            </div>
            <div className="detail-item">
              <span className="label">{t('rollDetail.lengthRemaining')}:</span>
              <span className="value">{roll.lengthRemainingM ? roll.lengthRemainingM.toFixed(2) : roll.lengthM.toFixed(2)} m</span>
            </div>
          </div>
          <div className="consumption-visual">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(roll.totalWasteAreaM2 / roll.areaM2 * 100).toFixed(2)}%` }}
              >
                {(100 - (roll.totalWasteAreaM2 / roll.areaM2 * 100)).toFixed(1)}% Available
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Status & Tracking</h2>
          <div className="detail-grid">
            <div className="detail-item full-width">
              <span className="label">Status:</span>
              <select 
                value={roll.status} 
                onChange={(e) => handleStatusChange(e.target.value as RollStatus)}
                className="status-select"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="detail-item full-width">
              <span className="label">QR Code:</span>
              <span className="value qr-code">{roll.qrCode || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>{t('rollDetail.chutesTitle')}</h2>
          {wastePieces.length === 0 ? (
            <div className="empty-state">{t('rollDetail.chutesEmpty')}</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('waste.tableWasteId')}</th>
                    <th>{t('waste.tableDimensions')}</th>
                    <th>{t('waste.tableArea')}</th>
                    <th>{t('waste.tableStatus')}</th>
                    <th>Type</th>
                    <th>{t('waste.tableCreated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wastePieces.map(piece => (
                    <tr key={piece.id}>
                      <td>{piece.id}</td>
                      <td>{piece.widthMm} mm × {piece.lengthM.toFixed(2)} m</td>
                      <td>{piece.areaM2.toFixed(2)} m²</td>
                      <td>{piece.status}</td>
                      <td>{piece.wasteType || 'N/A'}</td>
                      <td>{formatDate(piece.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RollDetailPage;
