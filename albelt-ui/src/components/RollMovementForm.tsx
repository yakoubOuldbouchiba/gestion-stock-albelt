import { useEffect, useMemo, useState } from 'react';
import { Roll, Altier, WastePiece } from '../types/index';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import { AltierService } from '../services/altierService';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { formatRollChuteLabel, getRollChuteSummary } from '@utils/rollChuteLabel';
import { useI18n } from '@hooks/useI18n';
import { dateTimeLocalToIso, isoToDateTimeLocal, nowDateTimeLocal } from '../pages/hooks/useMovementDateTime';
import { RadioButton } from 'primereact/radiobutton';
import './movement/MovementDialog.css';

interface RollMovementFormProps {
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
  existingMovement?: RollMovement;
  userAltierIds: string[];
  userId: string;
  fixedSource?:
    | {
        sourceType: 'ROLL';
        rollId: string;
        fromAltierID?: string;
      }
    | {
        sourceType: 'WASTE_PIECE';
        wastePieceId: string;
        fromAltierID?: string;
      };
}

export function RollMovementForm({
  mode,
  onSuccess,
  onCancel,
  existingMovement,
  userAltierIds,
  userId,
  fixedSource
}: RollMovementFormProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<'source' | 'details'>(mode === 'create' && !fixedSource ? 'source' : 'details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [availableWastePieces, setAvailableWastePieces] = useState<WastePiece[]>([]);
  const [loadingRolls, setLoadingRolls] = useState(false);
  const [fixedRoll, setFixedRoll] = useState<Roll | null>(null);
  const [fixedWastePiece, setFixedWastePiece] = useState<WastePiece | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    movementType: existingMovement?.reason || '',
    sourceType:
      fixedSource?.sourceType ??
      (existingMovement?.wastePieceId ? ('WASTE_PIECE' as 'ROLL' | 'WASTE_PIECE') : 'ROLL'),
    rollId: (fixedSource && fixedSource.sourceType === 'ROLL' ? fixedSource.rollId : existingMovement?.rollId) || '',
    wastePieceId:
      (fixedSource && fixedSource.sourceType === 'WASTE_PIECE' ? fixedSource.wastePieceId : existingMovement?.wastePieceId) ||
      '',
    fromAltierID: fixedSource?.fromAltierID || existingMovement?.fromAltier?.id || (userAltierIds?.[0] || ''),
    toAltierID: existingMovement?.toAltier?.id || '',
    dateSortie: existingMovement
      ? isoToDateTimeLocal(existingMovement.dateSortie)
      : nowDateTimeLocal(),
    dateEntree: existingMovement
      ? isoToDateTimeLocal(existingMovement.dateEntree)
      : '',
    reason: existingMovement?.reason || '',
    notes: existingMovement?.notes || ''
  });

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

  useEffect(() => {
    if (!fixedSource) return;

    const loadFixed = async () => {
      try {
        if (fixedSource.sourceType === 'ROLL') {
          const res = await RollService.getById(fixedSource.rollId);
          if (res.success && res.data) {
            setFixedRoll(res.data);
          }
        } else {
          const res = await WastePieceService.getById(fixedSource.wastePieceId);
          if (res.success && res.data) {
            setFixedWastePiece(res.data);
          }
        }
      } catch {
        // Ignore; keep minimal fallback.
      }
    };

    loadFixed();
  }, [fixedSource]);

  // Load rolls when fromAltier changes
  useEffect(() => {
    if (formData.fromAltierID) {
      loadRolls();
      loadWastePieces();
    }
  }, [formData.fromAltierID]);

  const loadRolls = async () => {
    try {
      setLoadingRolls(true);
      const response = await RollService.getTransferSources({
        fromAltierId: formData.fromAltierID,
        page: 0,
        size: 200
      });
      if (response.success && response.data) {
        setAvailableRolls(response.data.items || []);
      } else {
        setError(t('rollMovement.failedToLoadData'));
      }
    } catch (err) {
      console.error('Failed to load rolls:', err);
      setError(t('rollMovement.failedToLoadData'));
    } finally {
      setLoadingRolls(false);
    }
  };

  const loadWastePieces = async () => {
    try {
      const response = await WastePieceService.getTransferSources({
        fromAltierId: formData.fromAltierID,
        page: 0,
        size: 200
      });
      if (response.success && response.data) {
        setAvailableWastePieces(response.data.items || []);
      } else {
        setError(t('rollMovement.failedToLoadData'));
      }
    } catch (err) {
      console.error('Failed to load waste pieces:', err);
      setError(t('rollMovement.failedToLoadData'));
    } finally {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      if (formData.sourceType === 'ROLL' && !formData.rollId) {
        setError(t('rollMovement.noRollSelected'));
        return;
      }
      if (formData.sourceType === 'WASTE_PIECE' && !formData.wastePieceId) {
        setError(t('rollMovement.noWastePieceSelected'));
        return;
      }
    }
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
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        const response = await rollMovementService.recordMovement({
          rollId: formData.sourceType === 'ROLL' ? formData.rollId : undefined,
          wastePieceId: formData.sourceType === 'WASTE_PIECE' ? formData.wastePieceId : undefined,
          fromAltierID: formData.fromAltierID,
          toAltierID: formData.toAltierID,
          dateSortie: dateTimeLocalToIso(formData.dateSortie),
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
            dateSortie: dateTimeLocalToIso(formData.dateSortie),
            dateEntree: formData.dateEntree ? dateTimeLocalToIso(formData.dateEntree) : '',
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
  const selectedRoll = fixedRoll || availableRolls.find((r) => r.id === formData.rollId) || null;
  const selectedWastePiece = fixedWastePiece || availableWastePieces.find((w) => w.id === formData.wastePieceId) || null;

  const rollOptions = availableRolls.map((roll) => ({
    label: formatRollChuteLabel(roll),
    value: roll.id,
  }));

  const wastePieceOptions = availableWastePieces.map((piece) => ({
    label: formatRollChuteLabel(piece as any),
    value: piece.id,
  }));

  const altierOptions = userAvailableAltiers.map((altier) => ({
    label: `${altier.libelle} (${altier.adresse})`,
    value: altier.id,
  }));

  const destinationOptions = otherAltiers.map((altier) => ({
    label: `${altier.libelle} (${altier.adresse})`,
    value: altier.id,
  }));

  const sourceTypeOptions = useMemo(
    () => [
      { label: t('rollMovement.roll'), value: 'ROLL' },
      { label: t('rollMovement.chute'), value: 'WASTE_PIECE' },
    ],
    [t]
  );

  const isCreate = mode === 'create';
  const selectedSourceSummary = useMemo(() => {
    const item = formData.sourceType === 'ROLL' ? selectedRoll : selectedWastePiece;
    if (!item) return null;
    return getRollChuteSummary(item as any);
  }, [formData.sourceType, selectedRoll, selectedWastePiece]);

  const isSourceStep = isCreate && step === 'source' && !fixedSource;
  const isDetailsStep = step === 'details' || mode === 'edit';

  const footer = isSourceStep ? (
    <div className="movement-dialog__actions">
      <Button type="button" label={t('common.cancel')} severity="secondary" onClick={onCancel} />
      <Button
        type="button"
        label={t('common.next')}
        onClick={() => setStep('details')}
        disabled={formData.sourceType === 'ROLL' ? !formData.rollId : !formData.wastePieceId}
      />
    </div>
  ) : isDetailsStep ? (
    <div className="movement-dialog__actions">
      {isCreate && step === 'details' && !fixedSource && (
        <Button type="button" label={t('rollMovement.back')} severity="secondary" onClick={() => setStep('source')} />
      )}
      <Button type="button" label={t('common.cancel')} severity="secondary" onClick={onCancel} />
      <Button
        type="submit"
        form="movement-details-form"
        label={loading ? t('rollMovement.saving') : isCreate ? t('rollMovement.createMovement') : t('rollMovement.updateMovement')}
        disabled={loading}
      />
    </div>
  ) : null;

  return (
    <Dialog
      visible
      header={mode === 'create' ? t('rollMovement.createMovement') : t('rollMovement.editMovement')}
      onHide={onCancel}
      style={{ width: 'min(800px, 95vw)' }}
      className="movement-dialog"
      footer={footer}
    >
      {error && <Message severity="error" text={error} style={{ marginBottom: '0.75rem' }} />}

      {isSourceStep && (
        <div className="movement-dialog__stack">
          <div className="movement-dialog__section">
            <div className="movement-dialog__sectionHeader">
              <div className="movement-dialog__sectionTitle">{t('rollMovement.selectSource')}</div>
              <div className="movement-dialog__sectionHint">{t('common.required') || '*'}</div>
            </div>

            <div className="albel-grid albel-grid--min220" style={{ gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label className="movement-dialog__label">{t('rollMovement.selectSource')}</label>
                <div className="movement-dialog__radioRow" role="radiogroup" aria-label={t('rollMovement.selectSource')}>
                  {sourceTypeOptions.map((opt) => (
                    <label key={opt.value} className="movement-dialog__radioOption">
                      <RadioButton
                        inputId={`sourceType-${opt.value}`}
                        name="sourceType"
                        value={opt.value}
                        onChange={(e) => {
                          const nextType = e.value as 'ROLL' | 'WASTE_PIECE';
                          setFormData((prev) => ({
                            ...prev,
                            sourceType: nextType,
                            rollId: '',
                            wastePieceId: '',
                          }));
                        }}
                        checked={formData.sourceType === opt.value}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fromAltierID" className="movement-dialog__label">
                  {t('rollMovement.fromAltier')} *
                </label>
                <Dropdown
                  id="fromAltierID"
                  value={formData.fromAltierID}
                  options={altierOptions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fromAltierID: e.value,
                      rollId: '',
                      wastePieceId: '',
                    }))
                  }
                  placeholder={t('rollMovement.selectSource')}
                  filter
                  required
                />
              </div>

              <div>
                <label htmlFor="sourceItemId" className="movement-dialog__label">
                  {formData.sourceType === 'ROLL' ? t('rollMovement.roll') : t('rollMovement.chute')} *
                </label>
                <Dropdown
                  id="sourceItemId"
                  value={formData.sourceType === 'ROLL' ? formData.rollId : formData.wastePieceId}
                  options={formData.sourceType === 'ROLL' ? rollOptions : wastePieceOptions}
                  onChange={(e) => {
                    const value = e.value as string;
                    setFormData((prev) => ({
                      ...prev,
                      rollId: prev.sourceType === 'ROLL' ? value : '',
                      wastePieceId: prev.sourceType === 'WASTE_PIECE' ? value : '',
                    }));
                  }}
                  placeholder={
                    loadingRolls
                      ? t('rollMovement.loadingRolls')
                      : formData.sourceType === 'ROLL'
                        ? t('rollMovement.selectRoll')
                        : t('rollMovement.selectSource')
                  }
                  filter
                  disabled={loadingRolls}
                  required
                />

                {!loadingRolls && formData.sourceType === 'ROLL' && availableRolls.length === 0 && (
                  <Message
                    severity="info"
                    text={t('rollMovement.noAvailableRolls', {
                      altier: userAvailableAltiers.find((a) => a.id === formData.fromAltierID)?.libelle || '',
                    })}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>
            </div>

            {(formData.rollId || formData.wastePieceId) && (
              <div className="movement-dialog__preview">
                <div className="movement-dialog__previewTitle">
                  {formData.sourceType === 'ROLL' ? t('rollMovement.selectedRoll') : t('rollMovement.selectedWastePiece')}
                </div>
                {selectedSourceSummary ? (
                  <div className="movement-dialog__previewText">
                    {`Ref: ${selectedSourceSummary.reference} | Plis: ${selectedSourceSummary.nbPlis} | Thk: ${selectedSourceSummary.thickness} | Color: ${selectedSourceSummary.color}`}
                  </div>
                ) : (
                  <div className="movement-dialog__previewText">{t('common.dash')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isDetailsStep && (
        <form id="movement-details-form" onSubmit={handleSubmit}>
          <div className="movement-dialog__stack">
            {isCreate && (
              <div className="movement-dialog__section movement-dialog__section--compact">
                <div className="movement-dialog__sectionTitle" style={{ marginBottom: '0.35rem' }}>
                  {formData.sourceType === 'ROLL' ? t('rollMovement.selectedRoll') : t('rollMovement.selectedWastePiece')}
                </div>
                {selectedSourceSummary ? (
                  <div className="movement-dialog__muted">
                    {`Ref: ${selectedSourceSummary.reference} | Plis: ${selectedSourceSummary.nbPlis} | Thk: ${selectedSourceSummary.thickness} | Color: ${selectedSourceSummary.color}`}
                  </div>
                ) : (
                  <div className="movement-dialog__muted">
                    {formData.sourceType === 'ROLL' ? t('rollMovement.noRollSelected') : t('rollMovement.noWastePieceSelected')}
                  </div>
                )}
              </div>
            )}

            <div className="movement-dialog__section">
              <div className="movement-dialog__sectionTitle">{t('rollMovement.recordBtn')}</div>
              <div className="albel-grid albel-grid--min220" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
                <div>
                  <label htmlFor="fromAltierDisplay" className="movement-dialog__label">
                    {t('rollMovement.fromAltier')}
                  </label>
                  <InputText
                    id="fromAltierDisplay"
                    value={altiers.find((a) => a.id === formData.fromAltierID)?.libelle || ''}
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="toAltierID" className="movement-dialog__label">
                    {t('rollMovement.toAltier')} *
                  </label>
                  <Dropdown
                    id="toAltierID"
                    value={formData.toAltierID}
                    options={destinationOptions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, toAltierID: e.value }))}
                    placeholder={t('rollMovement.selectDestination')}
                    filter
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dateSortie" className="movement-dialog__label">
                    {t('rollMovement.dateSortie')} *
                  </label>
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
                    <label htmlFor="dateEntree" className="movement-dialog__label">
                      {t('rollMovement.dateEntree')}
                    </label>
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
            </div>

            <div className="movement-dialog__section">
              <div className="movement-dialog__sectionTitle">{t('rollMovement.reason')}</div>
              <div className="movement-dialog__twoCol" style={{ marginTop: '0.75rem' }}>
                <div>
                  <label htmlFor="reason" className="movement-dialog__label">
                    {t('rollMovement.reason')}
                  </label>
                  <InputText
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder={t('rollMovement.reasonPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="movement-dialog__label">
                    {t('rollMovement.notes')}
                  </label>
                  <InputTextarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={t('rollMovement.notesPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
