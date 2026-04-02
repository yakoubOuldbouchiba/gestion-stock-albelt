import { useState, useEffect } from 'react';
import { Roll, Altier } from '../types/index';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { RollService } from '../services/rollService';
import { AltierService } from '../services/altierService';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

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
          setAltiers(response.data.items || []);
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
        const items = response.data.items || [];
        // Filter rolls that are at the selected fromAltier and available
        const filteredRolls = items.filter(
          (roll: Roll) =>
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

  const rollOptions = availableRolls.map((roll) => ({
    label: `Roll ${roll.id.substring(0, 8)}... • ${roll.materialType} • ${roll.widthMm}mm × ${(roll.lengthRemainingM || roll.lengthM).toFixed(2)}m`,
    value: roll.id,
  }));

  const altierOptions = userAvailableAltiers.map((altier) => ({
    label: `${altier.libelle} (${altier.adresse})`,
    value: altier.id,
  }));

  const destinationOptions = otherAltiers.map((altier) => ({
    label: `${altier.libelle} (${altier.adresse})`,
    value: altier.id,
  }));

  return (
    <Dialog
      visible
      header={mode === 'create' ? 'Create Movement' : 'Edit Movement'}
      onHide={onCancel}
      style={{ width: 'min(800px, 95vw)' }}
    >
      {error && <Message severity="error" text={error} />}

      {mode === 'create' && step === 'roll' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="fromAltierID">From Altier</label>
            <Dropdown
              id="fromAltierID"
              value={formData.fromAltierID}
              options={altierOptions}
              onChange={(e) => setFormData((prev) => ({ ...prev, fromAltierID: e.value }))}
              placeholder="-- Select Source --"
              filter
              required
            />
          </div>

          <div>
            <label htmlFor="rollId">Roll</label>
            <Dropdown
              id="rollId"
              value={formData.rollId}
              options={rollOptions}
              onChange={(e) => handleRollSelect(e.value)}
              placeholder={loadingRolls ? 'Loading rolls...' : '-- Select Roll --'}
              filter
              disabled={loadingRolls}
              required
            />
            {!loadingRolls && availableRolls.length === 0 && (
              <Message severity="info" text={`No available rolls at ${userAvailableAltiers.find(a => a.id === formData.fromAltierID)?.libelle || ''}`} />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button
              label="Next"
              onClick={() => setStep('details')}
              disabled={!formData.rollId}
            />
            <Button label="Cancel" severity="secondary" onClick={onCancel} />
          </div>
        </div>
      )}

      {(step === 'details' || mode === 'edit') && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {mode === 'create' && (
              <div>
                <label>Selected Roll</label>
                <div>
                  {selectedRoll ? (
                    <div>
                      <strong>Roll {selectedRoll.id.substring(0, 8)}...</strong>
                      <div>
                        Material: {selectedRoll.materialType} | Size: {selectedRoll.widthMm}mm × {(selectedRoll.lengthRemainingM || selectedRoll.lengthM).toFixed(2)}m | Area: {((selectedRoll.areaM2 || 0) - (selectedRoll.totalWasteAreaM2 || 0)).toFixed(2)}m²
                      </div>
                    </div>
                  ) : (
                    'No roll selected'
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="fromAltierDisplay">From Altier</label>
                <InputText
                  id="fromAltierDisplay"
                  value={altiers.find((a) => a.id === formData.fromAltierID)?.libelle || ''}
                  disabled
                />
              </div>
              <div>
                <label htmlFor="toAltierID">To Altier *</label>
                <Dropdown
                  id="toAltierID"
                  value={formData.toAltierID}
                  options={destinationOptions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, toAltierID: e.value }))}
                  placeholder="-- Select Destination --"
                  filter
                  required
                />
              </div>
              <div>
                <label htmlFor="dateSortie">Date Sortie (Exit Date) *</label>
                <InputText
                  type="datetime-local"
                  id="dateSortie"
                  name="dateSortie"
                  value={formData.dateSortie}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {mode === 'edit' && (
                <div>
                  <label htmlFor="dateEntree">Date Entree (Entry Date)</label>
                  <InputText
                    type="datetime-local"
                    id="dateEntree"
                    name="dateEntree"
                    value={formData.dateEntree}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reason">Movement Type / Reason</label>
              <InputText
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="e.g., INTERNAL_TRANSFER, DELIVERY..."
              />
            </div>

            <div>
              <label htmlFor="notes">Notes</label>
              <InputTextarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about this movement..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {mode === 'create' && step === 'details' && (
                <Button type="button" label="Back" severity="secondary" onClick={() => setStep('roll')} />
              )}
              <Button
                type="submit"
                label={loading ? 'Saving...' : mode === 'create' ? 'Create Movement' : 'Update Movement'}
                disabled={loading}
              />
              <Button type="button" label="Cancel" severity="secondary" onClick={onCancel} />
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
