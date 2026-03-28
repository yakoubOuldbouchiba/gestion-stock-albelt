import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { AltierService } from '../services/altierService';
import { RollService } from '../services/rollService';
import { Altier } from '../types/index';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { formatDateTime } from '../utils/date';
import '../styles/RollMovementPage.css';

export function RollMovementPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const { user } = useAuthStore();
  const { t } = useI18n();
  
  const [movements, setMovements] = useState<RollMovement[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  
  // Helper function to get current datetime in datetime-local format (YYYY-MM-DDTHH:MM)
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);  // Format: YYYY-MM-DDTHH:MM
  };

  const [confirmData, setConfirmData] = useState({
    dateEntree: getCurrentDateTimeLocal()
  });
  const [formData, setFormData] = useState({
    fromAltierID: '',
    toAltierID: '',
    dateSortie: getCurrentDateTimeLocal(),  // datetime-local format: YYYY-MM-DDTHH:MM
    dateEntree: '',  // Disabled in create mode
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (!rollId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch roll details to get current altier
        const rollResponse = await RollService.getById(rollId);
        if (rollResponse.success && rollResponse.data) {
          const rollData = rollResponse.data;
          // Pre-populate fromAltierID with roll's current altier
          if (rollData.altierId) {
            setFormData(prev => ({
              ...prev,
              fromAltierID: rollData.altierId || ''
            }));
          }
        }
        
        // Fetch movement history
        const movResponse = await rollMovementService.getRollMovementHistory(rollId);
        if (movResponse.success && movResponse.data) {
          setMovements(movResponse.data);
        }
        
        // Fetch altiers for dropdown
        const altResponse = await AltierService.getAll();
        if (altResponse.success && altResponse.data) {
          setAltiers(altResponse.data);
        }
        
        setError(null);
      } catch (err) {
        setError(t('rollMovement.failedToLoadData'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [rollId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfirmData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rollId || !user) return;
    
    // Validate required fields
    if (!formData.fromAltierID) {
      setError(t('rollMovement.fromRequired'));
      return;
    }
    if (!formData.toAltierID) {
      setError(t('rollMovement.toRequired'));
      return;
    }
    if (!formData.dateSortie) {
      setError(t('rollMovement.dateSortieRequired'));
      return;
    }
    
    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const formatDateTimeToISO = (dateStr: string) => {
        if (!dateStr) return '';
        // dateStr is in format YYYY-MM-DDTHH:MM from datetime-local input
        return `${dateStr}:00.000Z`;
      };

      const response = await rollMovementService.recordMovement({
        rollId,
        fromAltierID: formData.fromAltierID,
        toAltierID: formData.toAltierID,
        dateSortie: formatDateTimeToISO(formData.dateSortie),
        dateEntree: '',  // Not set in creation - only when received
        reason: formData.reason,
        notes: formData.notes,
        operatorId: user.id
      });
      
      if (response.success) {
        // Refresh movement history
        const histResponse = await rollMovementService.getRollMovementHistory(rollId);
        if (histResponse.success && histResponse.data) {
          setMovements(histResponse.data);
        }
        
        // Reset form with new altier as the from location
        setFormData({
          fromAltierID: formData.toAltierID,  // New location becomes the starting point
          toAltierID: '',
          dateSortie: getCurrentDateTimeLocal(),
          dateEntree: '',  // Empty in create mode
          reason: '',
          notes: ''
        });
        setShowForm(false);
        setError(null);
      } else {
        setError(response.message || t('rollMovement.failedToRecord'));
      }
    } catch (err) {
      setError(t('rollMovement.failedToRecord'));
      console.error(err);
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMovementId || !user) return;
    
    if (!confirmData.dateEntree) {
      setError(t('rollMovement.dateEntreeRequired'));
      return;
    }
    
    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const isoDateString = confirmData.dateEntree.endsWith('Z') 
        ? confirmData.dateEntree 
        : `${confirmData.dateEntree}:00.000Z`;
      
      // Call API to confirm receipt with dateEntree
      const response = await rollMovementService.confirmReceipt(
        selectedMovementId,
        isoDateString
      );
      
      if (response.success) {
        // Refresh movement history
        const histResponse = await rollMovementService.getRollMovementHistory(rollId || '');
        if (histResponse.success && histResponse.data) {
          setMovements(histResponse.data);
        }
        
        setConfirmData({ dateEntree: getCurrentDateTimeLocal() });
        setSelectedMovementId(null);
        setShowConfirmForm(false);
        setError(null);
      } else {
        setError(response.message || t('rollMovement.failedToConfirm'));
      }
    } catch (err) {
      setError(t('rollMovement.failedToConfirm'));
      console.error(err);
    }
  };

  const formatDate = (dateValue: string | null | undefined | any[]) => {
    if (!dateValue) return '-';

    // Handle array format from backend [year, month, day, hour, minute, second, nano]
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }

    // Handle ISO string format
    return formatDateTime(dateValue);
  };

  return (
    <div className="roll-movement-page">
      <div className="page-header">
        <h1>{t('rollMovement.title')}</h1>
        <p>{t('rollMovement.description', { rollId: rollId?.substring(0, 8) })}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <button 
          className="record-movement-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t('common.cancel') : t('rollMovement.recordBtn')}
        </button>
      </div>

      {showForm && (
        <div className="movement-form-container">
          <form onSubmit={handleSubmit} className="movement-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fromAltierID">{t('rollMovement.fromAltier')} <span className="required">*</span></label>
                <select 
                  id="fromAltierID"
                  name="fromAltierID"
                  value={formData.fromAltierID}
                  onChange={handleInputChange}
                  required
                  disabled
                  title={t('rollMovement.fromAltierHint')}
                >
                  <option value="">{t('rollMovement.selectSource')}</option>
                  {altiers.map(altier => (
                    <option key={altier.id} value={altier.id}>
                      {altier.libelle} ({altier.adresse})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="toAltierID">{t('rollMovement.toAltier')} *</label>
                <select 
                  id="toAltierID"
                  name="toAltierID"
                  value={formData.toAltierID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('rollMovement.selectDestination')}</option>
                  {altiers
                    .filter(altier => altier.id !== formData.fromAltierID)  // Exclude current altier
                    .map(altier => (
                      <option key={altier.id} value={altier.id}>
                        {altier.libelle} ({altier.adresse})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateSortie">{t('rollMovement.dateSortie')} *</label>
                <input 
                  type="datetime-local"
                  id="dateSortie"
                  name="dateSortie"
                  value={formData.dateSortie}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateEntree">{t('rollMovement.dateEntree')} <span className="hint">{t('rollMovement.dateEntreeHint')}</span></label>
                <input 
                  type="datetime-local"
                  id="dateEntree"
                  name="dateEntree"
                  value={formData.dateEntree.slice(0, 16)}
                  onChange={handleInputChange}
                  disabled
                  title={t('rollMovement.dateEntreeDisabledHint')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">{t('rollMovement.reason')}</label>
                <input 
                  type="text"
                  id="reason"
                  name="reason"
                  placeholder={t('rollMovement.reasonPlaceholder')}
                  value={formData.reason}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">

                <label htmlFor="notes">{t('rollMovement.notes')}</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder={t('rollMovement.notesPlaceholder')}
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">{t('rollMovement.recordBtn')}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {showConfirmForm && selectedMovementId && (
        <div className="movement-form-container confirm-form">
          <form onSubmit={handleConfirmReceipt} className="movement-form">
            <h3>{t('rollMovement.confirmReceiptTitle')}</h3>
            <p>{t('rollMovement.confirmReceiptDesc')}</p>
            
            <div className="form-group">
              <label htmlFor="confirmDateEntree">{t('rollMovement.dateEntree')} <span className="required">*</span></label>
              <input 
                type="datetime-local"
                id="confirmDateEntree"
                name="dateEntree"
                value={confirmData.dateEntree.slice(0, 16)}
                onChange={handleConfirmInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">{t('rollMovement.confirmReceiptBtn')}</button>
              <button type="button" className="btn-cancel" onClick={() => {
                setShowConfirmForm(false);
                setSelectedMovementId(null);
              }}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">{t('rollMovement.loading')}</div>
      ) : movements.length === 0 ? (
        <div className="empty-state">
          <p>{t('rollMovement.noMovements')}</p>
        </div>
      ) : (
        <div className="movements-list">
          <table className="movements-table">
            <thead>
              <tr>
                <th>{t('rollMovement.from')}</th>
                <th>{t('rollMovement.to')}</th>
                <th>{t('rollMovement.exitDate')}</th>
                <th>{t('rollMovement.entryDate')}</th>
                <th>{t('rollMovement.duration')}</th>
                <th>{t('rollMovement.reason')}</th>
                <th>{t('rollMovement.operator')}</th>
                <th>{t('rollMovement.notes')}</th>
                <th>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(movement => (
                <tr key={movement.id} className="movement-row">
                  <td>
                    {movement.fromAltier ? (
                      <>
                        <strong>{movement.fromAltier.libelle}</strong>
                        <br />
                        <small>{movement.fromAltier.adresse}</small>
                      </>
                    ) : (
                      <em>{t('rollMovement.supplier')}</em>
                    )}
                  </td>
                  <td>
                    <strong>{movement.toAltier.libelle}</strong>
                    <br />
                    <small>{movement.toAltier.adresse}</small>
                  </td>
                  <td>{formatDate(movement.dateSortie)}</td>
                  <td>{formatDate(movement.dateEntree)}</td>
                  <td>{movement.durationHours} {t('rollMovement.hours')}</td>
                  <td>{movement.reason || t('common.dash')}</td>
                  <td>{movement.operator.username}</td>
                  <td>{movement.notes || t('common.dash')}</td>
                  <td>
                    {!movement.dateEntree && (
                      <button 
                        type="button" 
                        className="btn-confirm"
                        onClick={() => {
                          setShowConfirmForm(true);
                          setSelectedMovementId(movement.id);
                        }}
                      >
                        {t('rollMovement.confirmReceiptBtn')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RollMovementPage;
