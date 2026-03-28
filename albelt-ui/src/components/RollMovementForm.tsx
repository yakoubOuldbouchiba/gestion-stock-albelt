import { useState, useEffect } from 'react';
import { Roll, Altier } from '../types/index';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { RollService } from '../services/rollService';
import { AltierService } from '../services/altierService';
import '../styles/RollMovementForm.css';

interface RollMovementFormProps {
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
  existingMovement?: RollMovement;
  userAltierIds: string[];
  userId: string;
}

export function RollMovementForm({
  mode,
  onSuccess,
  onCancel,
  existingMovement,
  userAltierIds,
  userId
}: RollMovementFormProps) {
  const [step, setStep] = useState<'roll' | 'details'>(mode === 'create' ? 'roll' : 'details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [loadingRolls, setLoadingRolls] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    movementType: existingMovement?.reason || '',
    rollId: existingMovement?.rollId || '',
    fromAltierID: existingMovement?.fromAltier?.id || (userAltierIds?.[0] || ''),
    toAltierID: existingMovement?.toAltier?.id || '',
    dateSortie: existingMovement
      ? formatDateTimeForInput(existingMovement.dateSortie)
      : new Date().toISOString().slice(0, 16),
    dateEntree: existingMovement
      ? formatDateTimeForInput(existingMovement.dateEntree)
      : '',
    reason: existingMovement?.reason || '',
    notes: existingMovement?.notes || ''
  });

  function formatDateTimeForInput(dateValue: string | string[] | null | undefined): string {
    if (!dateValue) return '';
    
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );
      return date.toISOString().slice(0, 16);
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return date.toISOString().slice(0, 16);
    }
    
    return '';
  }

  // Load altiers on mount
  useEffect(() => {
    const loadAltiers = async () => {
      try {
        const response = await AltierService.getAll();
        if (response.success && response.data) {
          setAltiers(response.data);
        }
      } catch (err) {
        console.error('Failed to load altiers:', err);
      }
    };

    loadAltiers();
  }, []);

  // Load rolls when fromAltier changes
  useEffect(() => {
    if (formData.fromAltierID) {
      loadRolls();
    }
  }, [formData.fromAltierID]);

  const loadRolls = async () => {
    try {
      setLoadingRolls(true);
      const response = await RollService.getAll();
      if (response.success && response.data) {
        // Filter rolls that are at the selected fromAltier and available
        const filteredRolls = response.data.filter(
          (roll) =>
            roll.altierId === formData.fromAltierID &&
            (roll.status === 'AVAILABLE' || roll.status === 'OPENED')
        );
        setAvailableRolls(filteredRolls);
      } else {
        setError('Failed to load rolls');
      }
    } catch (err) {
      console.error('Failed to load rolls:', err);
      setError('Failed to load rolls');
    } finally {
      setLoadingRolls(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRollSelect = (rollId: string) => {
    setFormData((prev) => ({
      ...prev,
      rollId
    }));
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rollId) {
      setError('Roll is required');
      return;
    }
    if (!formData.fromAltierID) {
      setError('From Altier is required');
      return;
    }
    if (!formData.toAltierID) {
      setError('To Altier is required');
      return;
    }
    if (!formData.dateSortie) {
      setError('Date Sortie is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formatDateToISO = (dateStr: string) => {
        if (!dateStr) return '';
        return `${dateStr}:00.000Z`;
      };

      if (mode === 'create') {
        const response = await rollMovementService.recordMovement({
          rollId: formData.rollId,
          fromAltierID: formData.fromAltierID,
          toAltierID: formData.toAltierID,
          dateSortie: formatDateToISO(formData.dateSortie),
          dateEntree: '',
          reason: formData.reason || formData.movementType,
          notes: formData.notes,
          operatorId: userId
        });

        if (response.success) {
          onSuccess();
        } else {
          setError(response.message || 'Failed to create movement');
        }
      } else {
        // Edit mode
        if (!existingMovement?.id) {
          setError('Movement ID not found');
          return;
        }

        const response = await rollMovementService.updateMovement(
          existingMovement.id,
          {
            toAltierID: formData.toAltierID,
            dateSortie: formatDateToISO(formData.dateSortie),
            dateEntree: formData.dateEntree ? formatDateToISO(formData.dateEntree) : '',
            reason: formData.reason || formData.movementType,
            notes: formData.notes
          } as Partial<RollMovement>
        );

        if (response.success) {
          onSuccess();
        } else {
          setError(response.message || 'Failed to update movement');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const userAvailableAltiers = altiers.filter((a) => userAltierIds.includes(a.id));
  const otherAltiers = altiers.filter((a) => a.id !== formData.fromAltierID);

  const selectedRoll = availableRolls.find((r) => r.id === formData.rollId);

  return (
    <div className="roll-movement-form-overlay">
      <div className="roll-movement-form-container">
        <h2>{mode === 'create' ? 'Create New Movement' : 'Edit Movement'}</h2>

        {error && <div className="form-error-message">{error}</div>}

        {/* Step 1: Select Roll */}
        {mode === 'create' && step === 'roll' && (
          <div className="form-step">
            <h3>Step 1: Select Roll</h3>
            
            <div className="form-group">
              <label htmlFor="fromAltierID">From Altier</label>
              <select
                id="fromAltierID"
                name="fromAltierID"
                value={formData.fromAltierID}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Source --</option>
                {userAvailableAltiers.map((altier) => (
                  <option key={altier.id} value={altier.id}>
                    {altier.libelle} ({altier.adresse})
                  </option>
                ))}
              </select>
            </div>

            {loadingRolls ? (
              <div className="loading">Loading rolls...</div>
            ) : availableRolls.length === 0 ? (
              <div className="empty-state">
                <p>No available rolls at {userAvailableAltiers.find(a => a.id === formData.fromAltierID)?.libelle}</p>
              </div>
            ) : (
              <div className="rolls-grid">
                {availableRolls.map((roll) => (
                  <button
                    key={roll.id}
                    type="button"
                    className={`roll-card ${formData.rollId === roll.id ? 'selected' : ''}`}
                    onClick={() => handleRollSelect(roll.id)}
                  >
                    <div className="roll-info">
                      <div className="roll-id">Roll {roll.id.substring(0, 8)}...</div>
                      <div className="roll-details">
                        <span className="material">{roll.materialType}</span>
                        <span className="size">{roll.widthMm}mm × {(roll.lengthRemainingM || roll.lengthM).toFixed(2)}m</span>
                      </div>
                      <div className="roll-area">Area: {(roll.areaM2 || 0).toFixed(2)}m²</div>
                      <div className="roll-status">{roll.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details (Create/Edit) */}
        {(step === 'details' || mode === 'edit') && (
          <form onSubmit={handleSubmit} className="form-step">
            <h3>{mode === 'create' ? 'Step 2: Details' : 'Edit Movement'}</h3>
            <div className="form-grid">
              {mode === 'create' && (
                <div className="form-group full-width">
                  <label>Selected Roll</label>
                  <div className="selected-roll-info">
                    {selectedRoll ? (
                      <>
                        <strong>Roll {selectedRoll.id.substring(0, 8)}...</strong>
                        <div>
                          Material: {selectedRoll.materialType} | Size:{' '}
                          {selectedRoll.widthMm}mm × {(selectedRoll.lengthRemainingM || selectedRoll.lengthM).toFixed(2)}m | Area:{' '}
                          {((selectedRoll.areaM2 || 0) - (selectedRoll.totalWasteAreaM2 || 0)).toFixed(2)}m²
                        </div>
                      </>
                    ) : (
                      'No roll selected'
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="fromAltierID">From Altier</label>
                <input
                  type="text"
                  id="fromAltierDisplay"
                  value={altiers.find((a) => a.id === formData.fromAltierID)?.libelle || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="toAltierID">To Altier *</label>
                <select
                  id="toAltierID"
                  name="toAltierID"
                  value={formData.toAltierID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select Destination --</option>
                  {otherAltiers.map((altier) => (
                    <option key={altier.id} value={altier.id}>
                      {altier.libelle} ({altier.adresse})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateSortie">Date Sortie (Exit Date) *</label>
                <input
                  type="datetime-local"
                  id="dateSortie"
                  name="dateSortie"
                  value={formData.dateSortie}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {mode === 'edit' && (
                <div className="form-group">
                  <label htmlFor="dateEntree">Date Entree (Entry Date)</label>
                  <input
                    type="datetime-local"
                    id="dateEntree"
                    name="dateEntree"
                    value={formData.dateEntree}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="form-group full-width">
                <label htmlFor="reason">Movement Type / Reason</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="e.g., INTERNAL_TRANSFER, DELIVERY..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Additional notes about this movement..."
                />
              </div>
            </div>

            <div className="form-actions">
              {mode === 'create' && step === 'details' && (
                <button type="button" className="btn-secondary" onClick={() => setStep('roll')}>
                  Back
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Movement' : 'Update Movement'}
              </button>
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
