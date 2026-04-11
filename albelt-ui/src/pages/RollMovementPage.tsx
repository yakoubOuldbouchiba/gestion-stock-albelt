import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { AltierService } from '../services/altierService';
import { RollService } from '../services/rollService';
import { Altier } from '../types/index';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { formatDateTime } from '../utils/date';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';

export function RollMovementPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const { user } = useAuthStore();
  const { t } = useI18n();
  
  const [movements, setMovements] = useState<RollMovement[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { run, isLocked } = useAsyncLock();
  
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
          setMovements(movResponse.data.items);
        }
        
        // Fetch altiers for dropdown
        const altResponse = await AltierService.getAll();
        if (altResponse.success && altResponse.data) {
          setAltiers(altResponse.data.items);
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
    if (isLocked()) return;
    
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

      await run(async () => {
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
            setMovements(histResponse.data.items);
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
      }, 'roll-move-create');
    } catch (err) {
      setError(t('rollMovement.failedToRecord'));
      console.error(err);
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMovementId || !user) return;
    if (isLocked()) return;
    
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
      await run(async () => {
        const response = await rollMovementService.confirmReceipt(
          selectedMovementId,
          isoDateString
        );
        
        if (response.success) {
          // Refresh movement history
          const histResponse = await rollMovementService.getRollMovementHistory(rollId || '');
          if (histResponse.success && histResponse.data) {
            setMovements(histResponse.data.items);
          }
          
          setConfirmData({ dateEntree: getCurrentDateTimeLocal() });
          setSelectedMovementId(null);
          setShowConfirmForm(false);
          setError(null);
        } else {
          setError(response.message || t('rollMovement.failedToConfirm'));
        }
      }, 'roll-move-confirm');
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

  const altierOptions = altiers.map((altier) => ({
    label: `${altier.libelle} (${altier.adresse})`,
    value: altier.id,
  }));

  const movementsFromBody = (movement: RollMovement) => (
    <div>
      {movement.fromAltier ? (
        <>
          <strong>{movement.fromAltier.libelle}</strong>
          <div>{movement.fromAltier.adresse}</div>
        </>
      ) : (
        <em>{t('rollMovement.supplier')}</em>
      )}
    </div>
  );

  const movementsToBody = (movement: RollMovement) => (
    <div>
      <strong>{movement.toAltier.libelle}</strong>
      <div>{movement.toAltier.adresse}</div>
    </div>
  );

  const isBusy = isLocked();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1>{t('rollMovement.title')}</h1>
          <p>{t('rollMovement.description', { itemId: rollId?.substring(0, 8) })}</p>
        </div>
        <Button
          label={showForm ? t('common.cancel') : t('rollMovement.recordBtn')}
          icon={showForm ? 'pi pi-times' : 'pi pi-plus'}
          onClick={() => setShowForm(!showForm)}
          disabled={isBusy}
        />
      </div>

      {error && <Message severity="error" text={error} />}

      <Dialog
        header={t('rollMovement.recordBtn')}
        visible={showForm}
        onHide={() => setShowForm(false)}
        style={{ width: 'min(800px, 95vw)' }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
              <div>
                <label htmlFor="fromAltierID">{t('rollMovement.fromAltier')} *</label>
                <Dropdown
                  id="fromAltierID"
                  value={formData.fromAltierID}
                  options={altierOptions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fromAltierID: e.value }))}
                  placeholder={t('rollMovement.selectSource')}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="toAltierID">{t('rollMovement.toAltier')} *</label>
                <Dropdown
                  id="toAltierID"
                  value={formData.toAltierID}
                  options={altierOptions.filter((option) => option.value !== formData.fromAltierID)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, toAltierID: e.value }))}
                  placeholder={t('rollMovement.selectDestination')}
                  filter
                  required
                />
              </div>
            </div>

            <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
              <div>
                <label htmlFor="dateSortie">{t('rollMovement.dateSortie')} *</label>
                <InputText
                  type="datetime-local"
                  id="dateSortie"
                  name="dateSortie"
                  value={formData.dateSortie}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="dateEntree">{t('rollMovement.dateEntree')}</label>
                <InputText
                  type="datetime-local"
                  id="dateEntree"
                  name="dateEntree"
                  value={formData.dateEntree.slice(0, 16)}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>

            <div>
              <label htmlFor="reason">{t('rollMovement.reason')}</label>
              <InputText
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder={t('rollMovement.reasonPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="notes">{t('rollMovement.notes')}</label>
              <InputTextarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder={t('rollMovement.notesPlaceholder')}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="submit" label={t('rollMovement.recordBtn')} loading={isLocked('roll-move-create')} disabled={isBusy} />
              <Button type="button" label={t('common.cancel')} severity="secondary" onClick={() => setShowForm(false)} disabled={isBusy} />
            </div>
          </div>
        </form>
      </Dialog>

      <Dialog
        header={t('rollMovement.confirmReceiptTitle')}
        visible={showConfirmForm && !!selectedMovementId}
        onHide={() => {
          setShowConfirmForm(false);
          setSelectedMovementId(null);
        }}
      >
        <form onSubmit={handleConfirmReceipt}>
          <p>{t('rollMovement.confirmReceiptDesc')}</p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="confirmDateEntree">{t('rollMovement.dateEntree')} *</label>
            <InputText
              type="datetime-local"
              id="confirmDateEntree"
              name="dateEntree"
              value={confirmData.dateEntree.slice(0, 16)}
              onChange={handleConfirmInputChange}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="submit" label={t('rollMovement.confirmReceiptBtn')} loading={isLocked('roll-move-confirm')} disabled={isBusy} />
            <Button
              type="button"
              label={t('common.cancel')}
              severity="secondary"
              onClick={() => {
                setShowConfirmForm(false);
                setSelectedMovementId(null);
              }}
              disabled={isBusy}
            />
          </div>
        </form>
      </Dialog>

      {movements.length === 0 ? (
        <Message severity="info" text={t('rollMovement.noMovements')} />
      ) : (
        <DataTable value={movements} dataKey="id" size="small">
          <Column header={t('rollMovement.from')} body={movementsFromBody} />
          <Column header={t('rollMovement.to')} body={movementsToBody} />
          <Column header={t('rollMovement.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
          <Column header={t('rollMovement.entryDate')} body={(m: RollMovement) => formatDate(m.dateEntree)} />
          <Column header={t('rollMovement.duration')} body={(m: RollMovement) => `${m.durationHours} ${t('rollMovement.hours')}`} />
          <Column header={t('rollMovement.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
          <Column header={t('rollMovement.operator')} body={(m: RollMovement) => m.operator.username} />
          <Column header={t('rollMovement.notes')} body={(m: RollMovement) => m.notes || t('common.dash')} />
          <Column
            header={t('common.action')}
            body={(m: RollMovement) => (
              !m.dateEntree ? (
                <Button
                  label={t('rollMovement.confirmReceiptBtn')}
                  icon="pi pi-check"
                  text
                  onClick={() => {
                    setShowConfirmForm(true);
                    setSelectedMovementId(m.id);
                  }}
                  disabled={isBusy}
                />
              ) : null
            )}
          />
        </DataTable>
      )}
    </div>
  );
}

export default RollMovementPage;
