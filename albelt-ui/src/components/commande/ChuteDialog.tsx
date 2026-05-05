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
  chuteDimensions: { widthMm: number; lengthMm: number; areaM2: number };
  onDimensionChange: (field: 'widthMm' | 'lengthMm', value: string) => void;
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

  const renderWasteOption = (option: any) => {
    if (!option) return null;
    return (
      <div className="flex align-items-center gap-2">
        <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: option.colorHexCode || 'transparent', border: '1px solid var(--surface-border)' }} />
        <span>{option.colorName || t('commandes.notAvailable')}</span>
        <span className="text-secondary">•</span>
        <span>{option.label}</span>
      </div>
    );
  };

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
          key={`chute-source-${showChuteForm}`}
          value={chuteSourceType}
          options={chuteSourceOptions}
          onChange={(e) => onSourceTypeChange(e.value)}
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingChute}
          optionLabel="label"
          optionValue="value"
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
            filter
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
            itemTemplate={renderWasteOption}
            valueTemplate={(option) => renderWasteOption(option)}
            onChange={(e) => onParentWasteChange(e.value as string)}
            placeholder={
              parentWastePiecesLoading
                ? t('inventory.loadingWastePieces')
                : t('inventory.selectWastePiece')
            }
            style={{ width: '100%' }}
            disabled={Boolean(disabled) || creatingChute || parentWastePiecesLoading}
            filter
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

      {chuteSource && (
        <div style={{ border: '1px solid var(--surface-border)', borderRadius: '6px', padding: '1rem', backgroundColor: 'var(--surface-50)' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('commandes.preview') || 'Preview'} - {chuteSourceType === 'ROLL' ? t('inventory.roll') : t('inventory.wastePiece')}
          </label>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
            <div style={{ fontWeight: 600 }}>
              {chuteSource.reference || chuteSource.id.slice(0, 8)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color-secondary)' }}>
              {(chuteSource.lengthMm / 1000).toFixed(2)}m × {chuteSource.widthMm}mm
            </div>
          </div>
          <div style={{ 
            width: '100%', 
            minHeight: '200px', 
            backgroundColor: 'white', 
            border: '1px solid var(--surface-border)', 
            borderRadius: '4px', 
            padding: '1rem',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'auto'
          }}>
            <svg
              viewBox={`0 0 ${Math.max(chuteSource.lengthMm || 100, 100)} ${Math.max(chuteSource.widthMm || 100, 100)}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              preserveAspectRatio="xMinYMid meet"
            >
              {/* Source item background rectangle */}
              <rect
                x="0"
                y="0"
                width={chuteSource.lengthMm || 100}
                height={chuteSource.widthMm || 100}
                fill={chuteSource.colorHexCode || '#f5f5f5'}
                stroke="#bdbdbd"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Length label (X axis) */}
              <text
                x={(chuteSource.lengthMm || 100) / 2}
                y={-10}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#333"
              >
                {(chuteSource.lengthMm / 1000).toFixed(2)}m
              </text>
              {/* Width label (Y axis) */}
              <text
                x={-15}
                y={(chuteSource.widthMm || 100) / 2}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#333"
                transform={`rotate(-90 -15 ${(chuteSource.widthMm || 100) / 2})`}
              >
                {chuteSource.widthMm}mm
              </text>
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
            <i className="pi pi-info-circle" style={{ fontSize: '0.8rem' }}></i>
            <span>{t('rollDetail.lengthOnX') || 'Length on X'}, {t('rollDetail.widthOnY') || 'Width on Y'}</span>
          </div>
        </div>
      )}

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
            value={chuteDimensions.lengthMm ? String(chuteDimensions.lengthMm) : ''}
            onChange={(e) => onDimensionChange('lengthMm', e.target.value)}
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
