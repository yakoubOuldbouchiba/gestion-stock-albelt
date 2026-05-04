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
  const { t, isArabic } = useI18n();

  const handleNumericChange = (name: string, value: string) => {
    // Only allow numbers (0-9)
    const numericValue = value.replace(/[^0-9]/g, '');
    onChange(name, numericValue);
  };

  return (
    <div className="form-card mt-4" dir={isArabic() ? 'rtl' : 'ltr'} lang={isArabic() ? 'ar' : 'en'}>
      <h4 style={{ marginTop: 0, marginBottom: '1.25rem' }}>
        {isEditing ? t('rollDetail.updatePlacement') : t('rollDetail.addPlacement')}
      </h4>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="placement-x-mm">X ({t('rollDetail.lengthOnX') || 'Length on X'})</label>
          <InputText
            id="placement-x-mm"
            name="xMm"
            value={form.xMm}
            onChange={(e) => handleNumericChange('xMm', e.target.value)}
            type="text"
            placeholder="0"
            dir={isArabic() ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="form-field">
          <label htmlFor="placement-y-mm">Y ({t('rollDetail.widthOnY') || 'Width on Y'})</label>
          <InputText
            id="placement-y-mm"
            name="yMm"
            value={form.yMm}
            onChange={(e) => handleNumericChange('yMm', e.target.value)}
            type="text"
            placeholder="0"
            dir={isArabic() ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="form-field">
          <label htmlFor="placement-width-mm">{t('rollDetail.widthMm') || 'Width (mm)'}</label>
          <InputText
            id="placement-width-mm"
            name="widthMm"
            value={form.widthMm}
            onChange={(e) => handleNumericChange('widthMm', e.target.value)}
            type="text"
            placeholder="300"
            dir={isArabic() ? 'rtl' : 'ltr'}
          />
        </div>
        <div className="form-field">
          <label htmlFor="placement-height-mm">{t('rollDetail.heightMm') || 'Height (mm)'}</label>
          <InputText
            id="placement-height-mm"
            name="heightMm"
            value={form.heightMm}
            onChange={(e) => handleNumericChange('heightMm', e.target.value)}
            type="text"
            placeholder="200"
            dir={isArabic() ? 'rtl' : 'ltr'}
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
