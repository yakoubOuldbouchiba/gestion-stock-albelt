import type { ChangeEvent, FormEvent } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { MaterialType, RollRequest } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type CreateChuteDialogProps = {
  visible: boolean;
  onHide: () => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  t: Translate;
  chuteSourceType: 'ROLL' | 'WASTE_PIECE';
  chuteSourceOptions: { label: string; value: 'ROLL' | 'WASTE_PIECE' }[];
  onSourceTypeChange: (value: 'ROLL' | 'WASTE_PIECE') => void;
  chuteRollId: string;
  onChuteRollChange: (value: string) => void;
  chuteRollOptions: { label: string; value: string }[];
  chuteRollsLoading: boolean;
  supplierOptions: { label: string; value: string }[];
  materialOptions: { label: string; value: MaterialType }[];
  supplierId: string;
  materialType: MaterialType;
  onSupplierChange: (value: string) => void;
  onMaterialChange: (value: MaterialType) => void;
  parentWastePieceId: string;
  parentWasteOptions: { label: string; value: string }[];
  parentWastePiecesLoading: boolean;
  onParentWasteChange: (value: string) => void;
  chutePlacementId: string;
  chutePlacementOptions: { label: string; value: string }[];
  chutePlacementsLoading: boolean;
  onPlacementChange: (value: string) => void;
  formData: RollRequest;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDimensionChange: (event: ChangeEvent<HTMLInputElement>) => void;
  altierOptions: { label: string; value: string }[];
  onAltierChange: (value: string) => void;
  disableAltier: boolean;
};

export function CreateChuteDialog({
  visible,
  onHide,
  onSubmit,
  onCancel,
  isSubmitting,
  t,
  chuteSourceType,
  chuteSourceOptions,
  onSourceTypeChange,
  chuteRollId,
  onChuteRollChange,
  chuteRollOptions,
  chuteRollsLoading,
  supplierOptions,
  materialOptions,
  supplierId,
  materialType,
  onSupplierChange,
  onMaterialChange,
  parentWastePieceId,
  parentWasteOptions,
  parentWastePiecesLoading,
  onParentWasteChange,
  chutePlacementId,
  chutePlacementOptions,
  chutePlacementsLoading,
  onPlacementChange,
  formData,
  onFieldChange,
  onDimensionChange,
  altierOptions,
  onAltierChange,
  disableAltier,
}: CreateChuteDialogProps) {
  return (
    <Dialog
      header={t('inventory.createChute') || 'Create Chute'}
      visible={visible}
      onHide={onHide}
      style={{ width: 'min(900px, 95vw)' }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="chuteSourceType">{t('inventory.sourceType')} *</label>
            <Dropdown
              id="chuteSourceType"
              value={chuteSourceType}
              options={chuteSourceOptions}
              onChange={(e) => onSourceTypeChange(e.value)}
              required
            />
          </div>

          {chuteSourceType === 'ROLL' && (
            <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
              <div>
                <label htmlFor="supplierId">{t('navigation.suppliers')} *</label>
                <Dropdown
                  id="supplierId"
                  value={supplierId}
                  options={supplierOptions}
                  onChange={(e) => onSupplierChange(e.value)}
                  placeholder={t('inventory.selectSupplier')}
                  filter
                  required
                />
              </div>
              <div>
                <label htmlFor="materialType">{t('inventory.material')} *</label>
                <Dropdown
                  id="materialType"
                  value={materialType}
                  options={materialOptions}
                  onChange={(e) => onMaterialChange(e.value)}
                  required
                />
              </div>
            </div>
          )}

          {chuteSourceType === 'ROLL' && (
            <div>
              <label htmlFor="rollId">{t('inventory.selectRoll')} *</label>
              <Dropdown
                id="rollId"
                value={chuteRollId}
                options={chuteRollOptions}
                onChange={(e) => onChuteRollChange(e.value)}
                placeholder={
                  chuteRollsLoading
                    ? t('inventory.loadingRolls')
                    : !supplierId || !materialType
                      ? t('inventory.selectSupplierMaterialFirst')
                      : chuteRollOptions.length === 0
                        ? t('inventory.noRollsAvailable')
                        : t('inventory.selectRoll')
                }
                disabled={!supplierId || !materialType || chuteRollsLoading}
                filter
                required
              />
            </div>
          )}

          {chuteSourceType === 'WASTE_PIECE' && (
            <div>
              <label htmlFor="parentWastePieceId">{t('inventory.selectParentWastePiece')} *</label>
              <Dropdown
                id="parentWastePieceId"
                value={parentWastePieceId}
                options={parentWasteOptions}
                onChange={(e) => onParentWasteChange(e.value)}
                placeholder={
                  parentWastePiecesLoading
                    ? t('inventory.loadingWastePieces')
                    : parentWasteOptions.length === 0
                      ? t('inventory.noWastePiecesAvailable')
                      : t('inventory.selectWastePiece')
                }
                disabled={parentWastePiecesLoading}
                filter
                required
              />
            </div>
          )}

          {(chuteSourceType === 'ROLL' ? chuteRollId : parentWastePieceId) && (
            <div>
              <label htmlFor="chutePlacementId">{t('inventory.placement')} *</label>
              <Dropdown
                id="chutePlacementId"
                value={chutePlacementId}
                options={chutePlacementOptions}
                onChange={(e) => onPlacementChange(e.value)}
                placeholder={
                  chutePlacementsLoading
                    ? t('inventory.loadingPlacements')
                    : chutePlacementOptions.length === 0
                      ? t('inventory.noPlacementsAvailable')
                      : 'Select placement'
                }
                disabled={chutePlacementsLoading || chutePlacementOptions.length === 0}
                filter
                required
              />
            </div>
          )}

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
              <label htmlFor="altierId">{t('inventory.selectWorkshopLabel')} *</label>
              <Dropdown
                id="altierId"
                value={formData.altierId || ''}
                options={altierOptions}
                onChange={(e) => onAltierChange(e.value)}
                placeholder={t('inventory.selectWorkshop')}
                filter
                required
                disabled={disableAltier}
              />
            </div>
          </div>

          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div>
              <label htmlFor="reference">{t('rolls.reference')}</label>
              <InputText id="reference" name="reference" value={formData.reference} disabled readOnly />
            </div>
            <div>
              <label htmlFor="nbPlis">{t('rolls.plies')}</label>
              <InputText type="number" id="nbPlis" name="nbPlis" value={String(formData.nbPlis ?? '')} disabled readOnly />
            </div>
            <div>
              <label htmlFor="thicknessMm">{t('rolls.thickness')}</label>
              <InputText type="number" id="thicknessMm" name="thicknessMm" value={String(formData.thicknessMm ?? '')} disabled readOnly />
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
                onChange={onDimensionChange}
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
                onChange={onDimensionChange}
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="areaM2">{t('rolls.area')}</label>
              <InputText
                type="number"
                id="areaM2"
                name="areaM2"
                value={formData.areaM2.toFixed(4)}
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
              label={t('inventory.createChute') || 'Create Chute'}
              loading={isSubmitting}
              disabled={isSubmitting}
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
