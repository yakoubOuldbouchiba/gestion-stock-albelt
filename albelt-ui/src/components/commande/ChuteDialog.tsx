import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { CommandeItem } from '../../types';
import { getRollChuteSummary } from '@utils/rollChuteLabel';
import type { Translate } from './commandeTypes';

type ChuteDialogProps = {
  chuteTargetItem: CommandeItem | null;
  showChuteForm: boolean;
  onHide: () => void;
  t: Translate;
  disabled?: boolean;
  chuteSourceType: 'ROLL' | 'WASTE_PIECE';
  chuteSourceOptions: { label: string; value: string }[];
  onSourceTypeChange: (value: string) => void;
  chuteRollId: string;
  chuteRollOptions: any[];
  onRollChange: (value: string) => void;
  parentWastePieceId: string;
  chuteParentOptions: any[];
  onParentWasteChange: (value: string) => void;
  parentWastePiecesLoading: boolean;
  renderRollOption: (option: any) => JSX.Element | null;
  chuteSource: any;
  chuteDimensions: { widthMm: number; lengthM: number; areaM2: number };
  onDimensionChange: (field: 'widthMm' | 'lengthM', value: string) => void;
  xMm: number;
  yMm: number;
  onPositionChange: (field: 'xMm' | 'yMm', value: string) => void;
  onCreate: () => void;
  creatingChute: boolean;
};

export const ChuteDialog = ({
  chuteTargetItem,
  showChuteForm,
  onHide,
  t,
  disabled,
  chuteSourceType,
  chuteSourceOptions,
  onSourceTypeChange,
  chuteRollId,
  chuteRollOptions,
  onRollChange,
  parentWastePieceId,
  chuteParentOptions,
  onParentWasteChange,
  parentWastePiecesLoading,
  renderRollOption,
  chuteSource,
  chuteDimensions,
  onDimensionChange,
  xMm,
  yMm,
  onPositionChange,
  onCreate,
  creatingChute,
}: ChuteDialogProps) => {
  const chuteSummary = chuteSource ? getRollChuteSummary(chuteSource) : null;

  return (
  <Dialog
    header={
      chuteTargetItem
        ? `${t('inventory.createChute')} - ${t('commandes.line')} ${chuteTargetItem.lineNumber}`
        : t('inventory.createChute')
    }
    visible={showChuteForm}
    onHide={onHide}
    position="right"
    style={{ width: 'min(700px, 95vw)', height: '100vh' }}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button label={t('common.cancel')} severity="secondary" onClick={onHide} />
        <Button
          label={t('inventory.createChute')}
          onClick={onCreate}
          loading={creatingChute}
          disabled={Boolean(disabled) || creatingChute}
        />
      </div>
    }
  >
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('inventory.sourceType')}
        </label>
        <Dropdown
          value={chuteSourceType}
          options={chuteSourceOptions}
          onChange={(e) => onSourceTypeChange(e.value)}
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingChute}
        />
      </div>

      {chuteSourceType === 'ROLL' ? (
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.selectRoll')}
          </label>
          <Dropdown
            value={chuteRollId}
            options={chuteRollOptions}
            itemTemplate={renderRollOption}
            valueTemplate={(option) => renderRollOption(option)}
            onChange={(e) => onRollChange(e.value as string)}
            placeholder={t('commandes.selectRollOption')}
            style={{ width: '100%' }}
            disabled={Boolean(disabled) || creatingChute}
          />
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.selectWastePiece')}
          </label>
          <Dropdown
            value={parentWastePieceId}
            options={chuteParentOptions}
            onChange={(e) => onParentWasteChange(e.value as string)}
            placeholder={
              parentWastePiecesLoading
                ? t('inventory.loadingWastePieces')
                : t('inventory.selectWastePiece')
            }
            style={{ width: '100%' }}
            disabled={Boolean(disabled) || creatingChute || parentWastePiecesLoading}
          />
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('inventory.reference') || 'Reference'} / {t('inventory.color') || 'Color'}
        </label>
        <div className="albel-article-meta-block">
          <div className="albel-article-meta-chip">
            <span className="albel-article-meta-chip__icon pi pi-tag" />
            <div>
              <div className="albel-article-meta-chip__label">{t('inventory.reference') || 'Reference'}</div>
              <div className="albel-article-meta-chip__value">{chuteSummary?.reference || 'N/A'}</div>
            </div>
          </div>

          <div className="albel-article-meta-chip">
            <span className="albel-article-meta-chip__icon pi pi-th-large" />
            <div>
              <div className="albel-article-meta-chip__label">{t('rolls.plies')}</div>
              <div className="albel-article-meta-chip__value">{chuteSummary?.nbPlis ?? 'N/A'}</div>
            </div>
          </div>

          <div className="albel-article-meta-chip">
            <span className="albel-article-meta-chip__icon pi pi-arrows-v" />
            <div>
              <div className="albel-article-meta-chip__label">{t('rolls.thickness')}</div>
              <div className="albel-article-meta-chip__value">{chuteSummary?.thickness ?? 'N/A'}</div>
            </div>
          </div>

          <div className="albel-article-meta-chip">
            <span
              className="albel-article-meta-chip__color-dot"
              style={{ backgroundColor: chuteSource?.colorHexCode || 'var(--surface-border)' }}
            />
            <div>
              <div className="albel-article-meta-chip__label">{t('inventory.color') || 'Color'}</div>
              <div className="albel-article-meta-chip__value">{chuteSummary?.color || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="albel-grid albel-grid--min180" style={{ gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.positionX') || 'Position X (mm)'}
          </label>
          <InputText
            value={String(xMm)}
            onChange={(e) => onPositionChange('xMm', e.target.value)}
            type="number"
            min="0"
            disabled={Boolean(disabled) || creatingChute}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.positionY') || 'Position Y (mm)'}
          </label>
          <InputText
            value={String(yMm)}
            onChange={(e) => onPositionChange('yMm', e.target.value)}
            type="number"
            min="0"
            disabled={Boolean(disabled) || creatingChute}
          />
        </div>
      </div>

      <div className="albel-grid albel-grid--min180" style={{ gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.width')}
          </label>
          <InputText
            value={chuteDimensions.widthMm ? String(chuteDimensions.widthMm) : ''}
            onChange={(e) => onDimensionChange('widthMm', e.target.value)}
            type="number"
            disabled={Boolean(disabled) || creatingChute}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.length')}
          </label>
          <InputText
            value={chuteDimensions.lengthM ? String(chuteDimensions.lengthM) : ''}
            onChange={(e) => onDimensionChange('lengthM', e.target.value)}
            type="number"
            disabled={Boolean(disabled) || creatingChute}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.area')}
          </label>
          <InputText value={chuteDimensions.areaM2.toFixed(4)} disabled />
        </div>
      </div>
    </div>
  </Dialog>
  );
};
