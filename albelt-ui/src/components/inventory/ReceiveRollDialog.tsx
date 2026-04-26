import type { ChangeEvent, FormEvent } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { Article, MaterialType, RollRequest } from '../../types';
import type { ArticleOption } from '../../pages/hooks/useCommandeLookups';
import ArticleSelector from '../commande/form/ArticleSelector';
import type { Translate } from '../commande/commandeTypes';

type ReceiveRollDialogProps = {
  visible: boolean;
  onHide: () => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  formData: RollRequest;
  t: Translate;
  supplierOptions: { label: string; value: string }[];
  altierOptions: { label: string; value: string }[];
  materialOptions: { label: string; value: MaterialType }[];
  onSupplierChange: (value: string) => void;
  onAltierChange: (value: string) => void;
  onMaterialChange: (value: MaterialType) => void;
  articles: ArticleOption[];
  onArticleChange: (article: Article | null) => void;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export function ReceiveRollDialog({
  visible,
  onHide,
  onSubmit,
  onCancel,
  isSubmitting,
  formData,
  t,
  supplierOptions,
  altierOptions,
  materialOptions,
  onSupplierChange,
  onAltierChange,
  onMaterialChange,
  articles,
  onArticleChange,
  onFieldChange,
}: ReceiveRollDialogProps) {
  return (
    <Dialog
      header={t('inventory.receiveNewRoll')}
      visible={visible}
      onHide={onHide}
      style={{ width: 'min(900px, 95vw)' }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="receivedDate">{t('inventory.receivedDate')} *</label>
              <InputText
                type="date"
                id="receivedDate"
                name="receivedDate"
                value={formData.receivedDate}
                onChange={onFieldChange}
                required
              />
            </div>
            <div>
              <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
              <Dropdown
                id="supplierId"
                value={formData.supplierId}
                options={supplierOptions}
                onChange={(e) => onSupplierChange(e.value)}
                placeholder={t('inventory.selectSupplier')}
                filter
                required
              />
            </div>
          </div>

          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
              <Dropdown
                id="altierId"
                value={formData.altierId || ''}
                options={altierOptions}
                onChange={(e) => onAltierChange(e.value)}
                placeholder={t('inventory.selectWorkshop')}
                filter
                required
              />
            </div>
            <div>
              <label htmlFor="materialType">{t('inventory.material')} *</label>
              <Dropdown
                id="materialType"
                value={formData.materialType}
                options={materialOptions}
                onChange={(e) => onMaterialChange(e.value)}
                required
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="articleId">{t('inventory.selectArticle') || 'Select Article'} *</label>
              <ArticleSelector
                id="articleId"
                options={articles.filter(a => a.materialType === formData.materialType)}
                value={formData.article || formData.articleId}
                onChange={onArticleChange}
                placeholder={t('inventory.selectArticle') || 'Search article...'}
              />
            </div>
          </div>

          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="reference">{t('inventory.reference')}</label>
              <InputText
                id="reference"
                name="reference"
                value={formData.reference || ''}
                onChange={onFieldChange}
                readOnly
                disabled
                placeholder={t('inventory.autoFromArticle') || 'Auto from article'}
              />
            </div>
             <div>
              <label htmlFor="colorName">{t('inventory.color') || 'Color'}</label>
              <InputText
                id="colorName"
                value={formData.article?.colorName || ''}
                readOnly
                disabled
                placeholder={t('inventory.autoFromArticle') || 'Auto from article'}
              />
            </div>
          </div>

          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="nbPlis">{t('rolls.plies')}</label>
              <InputText
                type="number"
                id="nbPlis"
                name="nbPlis"
                value={String(formData.nbPlis ?? '')}
                readOnly
                disabled
                placeholder={t('inventory.autoFromArticle') || 'Auto from article'}
              />
            </div>
            <div>
              <label htmlFor="thicknessMm">{t('rolls.thickness')}</label>
              <InputText
                type="number"
                id="thicknessMm"
                name="thicknessMm"
                value={String(formData.thicknessMm ?? '')}
                readOnly
                disabled
                placeholder={t('inventory.autoFromArticle') || 'Auto from article'}
              />
            </div>
          </div>

          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="widthMm">{t('rolls.width')} *</label>
              <InputText
                type="number"
                id="widthMm"
                name="widthMm"
                value={String(formData.widthMm ?? '')}
                onChange={onFieldChange}
                required
              />
            </div>
            <div>
              <label htmlFor="lengthM">{t('rolls.length')} *</label>
              <InputText
                type="number"
                id="lengthM"
                name="lengthM"
                value={String(formData.lengthM ?? '')}
                onChange={onFieldChange}
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="areaM2">{t('rolls.area')} *</label>
              <InputText
                type="number"
                id="areaM2"
                name="areaM2"
                value={typeof formData.areaM2 === 'number' ? formData.areaM2.toFixed(4) : ''}
                readOnly
                disabled
              />
            </div>
          </div>

          <div>
            <label htmlFor="qrCode">{t('inventory.qrCode')}</label>
            <InputText
              id="qrCode"
              name="qrCode"
              value={formData.qrCode || ''}
              onChange={onFieldChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button
              type="submit"
              label={t('inventory.addRollToInventory')}
              loading={isSubmitting}
              disabled={isSubmitting || !formData.articleId}
            />
            <Button
              type="button"
              label={t('common.cancel')}
              severity="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
