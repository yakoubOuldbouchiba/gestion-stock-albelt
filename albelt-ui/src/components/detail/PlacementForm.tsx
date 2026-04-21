import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useI18n } from '../../hooks/useI18n';

interface PlacementFormProps {
  form: {
    xMm: string;
    yMm: string;
    widthMm: string;
    heightMm: string;
  };
  onChange: (name: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  isEditing: boolean;
}

export const PlacementForm: React.FC<PlacementFormProps> = ({
  form,
  onChange,
  onSave,
  onCancel,
  isProcessing,
  isEditing,
}) => {
  const { t } = useI18n();

  return (
    <div className="form-card mt-4">
      <h4 style={{ marginTop: 0, marginBottom: '1.25rem' }}>
        {isEditing ? t('rollDetail.updatePlacement') : t('rollDetail.addPlacement')}
      </h4>
      <div className="form-grid">
        <div className="form-field">
          <label>X ({t('rollDetail.lengthOnX') || 'Length on X'})</label>
          <InputText
            value={form.xMm}
            onChange={(e) => onChange('xMm', e.target.value)}
            type="number"
            min={0}
            placeholder="0"
          />
        </div>
        <div className="form-field">
          <label>Y ({t('rollDetail.widthOnY') || 'Width on Y'})</label>
          <InputText
            value={form.yMm}
            onChange={(e) => onChange('yMm', e.target.value)}
            type="number"
            min={0}
            placeholder="0"
          />
        </div>
        <div className="form-field">
          <label>{t('rollDetail.widthMm') || 'Width (mm)'}</label>
          <InputText
            value={form.widthMm}
            onChange={(e) => onChange('widthMm', e.target.value)}
            type="number"
            min={1}
            placeholder="300"
          />
        </div>
        <div className="form-field">
          <label>{t('rollDetail.heightMm') || 'Height (mm)'}</label>
          <InputText
            value={form.heightMm}
            onChange={(e) => onChange('heightMm', e.target.value)}
            type="number"
            min={1}
            placeholder="200"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Button
          label={isProcessing ? t('rollDetail.saving') : (isEditing ? t('rollDetail.updatePlacement') : t('rollDetail.savePlacement'))}
          icon={isEditing ? 'pi pi-check' : 'pi pi-plus'}
          onClick={onSave}
          loading={isProcessing}
          className="p-button-raised"
        />
        {isEditing && (
          <Button
            label={t('rollDetail.cancel')}
            severity="secondary"
            outlined
            onClick={onCancel}
          />
        )}
      </div>
    </div>
  );
};
