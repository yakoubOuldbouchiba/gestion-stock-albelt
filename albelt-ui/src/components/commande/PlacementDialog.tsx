import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import type { CommandeItem, PlacedRectangle, Roll } from '../../types';
import type { Translate } from './commandeTypes';

type PlacementDialogProps = {
  showPlacementModal: boolean;
  editingPlacementId: string | null;
  placementTargetItem: CommandeItem | null;
  onHide: () => void;
  t: Translate;
  disabled?: boolean;
  placementForm: {
    sourceType: 'ROLL' | 'WASTE_PIECE';
    sourceId: string;
    xMm: string;
    yMm: string;
    widthMm: string;
    heightMm: string;
  };
  placementSourceOptionsDialog: { label: string; value: string }[];
  onSourceTypeChange: (value: string) => void;
  placementRollOptionsDialog: any[];
  placementWasteOptionsDialog: any[];
  renderRollOption: (option: any) => JSX.Element | null;
  onSourceIdChange: (value: string) => void;
  rolls: Roll[];
  wasteForItem: any[];
  placementsForItem: PlacedRectangle[];
  onFieldChange: (name: 'xMm' | 'yMm' | 'widthMm' | 'heightMm', value: string) => void;
  onSave: () => void;
  creatingPlacement: boolean;
};

export const PlacementDialog = ({
  showPlacementModal,
  editingPlacementId,
  placementTargetItem,
  onHide,
  t,
  disabled,
  placementForm,
  placementSourceOptionsDialog,
  onSourceTypeChange,
  placementRollOptionsDialog,
  placementWasteOptionsDialog,
  renderRollOption,
  onSourceIdChange,
  rolls,
  wasteForItem,
  placementsForItem,
  onFieldChange,
  onSave,
  creatingPlacement,
}: PlacementDialogProps) => (
  <Dialog
    header={editingPlacementId ? t('rollDetail.updatePlacement') : t('rollDetail.addPlacement')}
    visible={showPlacementModal}
    onHide={onHide}
    position="right"
    style={{ width: 'min(560px, 95vw)', height: '100vh' }}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button label={t('commandes.cancel')} severity="secondary" onClick={onHide} />
        <Button
          label={editingPlacementId ? t('rollDetail.updatePlacement') : t('rollDetail.addPlacement')}
          onClick={onSave}
          loading={creatingPlacement}
          disabled={Boolean(disabled) || creatingPlacement || !placementTargetItem}
        />
      </div>
    }
  >
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div className="albel-grid albel-grid--min200" style={{ gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.source')}</label>
          <Dropdown
            value={placementForm.sourceType}
            options={placementSourceOptionsDialog}
            onChange={(e) => onSourceTypeChange(e.value)}
            disabled={Boolean(disabled) || editingPlacementId !== null}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.rollOrWaste')}</label>
          <Dropdown
            value={placementForm.sourceId}
            options={placementForm.sourceType === 'ROLL' ? placementRollOptionsDialog : placementWasteOptionsDialog}
            itemTemplate={placementForm.sourceType === 'ROLL' ? renderRollOption : undefined}
            valueTemplate={placementForm.sourceType === 'ROLL' ? (option) => renderRollOption(option) : undefined}
            onChange={(e) => onSourceIdChange(e.value as string)}
            placeholder={t('commandes.selectRollOption')}
            disabled={Boolean(disabled) || editingPlacementId !== null}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      {!placementForm.sourceId ? (
        <Message severity="info" text={t('rollDetail.selectSourceToPreview')} />
      ) : (() => {
        const source = placementForm.sourceType === 'ROLL'
          ? rolls.find((roll) => roll.id === placementForm.sourceId)
          : wasteForItem.find((waste: any) => waste.id === placementForm.sourceId);
        const sourceWidthMm = Number(source?.widthMm) || 0;
        const sourceLengthMm = Math.round((Number(source?.lengthM) || 0) * 1000);
        if (!sourceWidthMm || !sourceLengthMm) {
          return <Message severity="info" text={t('rollDetail.sourceDimensionsRequired')} />;
        }
        const sourcePlacements = placementsForItem.filter((placement) => (
          placementForm.sourceType === 'ROLL'
            ? placement.rollId === placementForm.sourceId
            : placement.wastePieceId === placementForm.sourceId
        ));

        return (
          <div
            style={{
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              padding: '0.5rem',
              background: 'var(--surface-card)',
            }}
          >
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <svg
                viewBox={`0 0 ${Math.max(1, sourceLengthMm)} ${Math.max(1, sourceWidthMm)}`}
                style={{ height: 260, width: 'auto', display: 'block' }}
                preserveAspectRatio="xMinYMid meet"
              >
                <rect
                  x={0}
                  y={0}
                  width={sourceLengthMm}
                  height={sourceWidthMm}
                  fill={source?.colorHexCode || '#f5f5f5'}
                  stroke="#bdbdbd"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
                {sourcePlacements.map((placement) => {
                  const placementColor = placement.colorHexCode || null;
                  const sourceColor = source?.colorHexCode || null;
                  const isSameColor = Boolean(
                    placementColor && sourceColor && placementColor.toLowerCase() === sourceColor.toLowerCase()
                  );
                  const fill = placementColor && !isSameColor ? placementColor : '#ff6f00';
                  const stroke = placementColor && !isSameColor ? placementColor : '#e65100';
                  return (
                    <g key={placement.id}>
                      <title>{`x:${placement.xMm} y:${placement.yMm} ${placement.widthMm}x${placement.heightMm}mm`}</title>
                      <rect
                        x={placement.yMm}
                        y={placement.xMm}
                        width={placement.heightMm}
                        height={placement.widthMm}
                        fill={fill}
                        fillOpacity={0.35}
                        stroke={stroke}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
              {(sourceLengthMm / 1000).toFixed(2)}m x {sourceWidthMm}mm ({t('rollDetail.lengthOnX')}, {t('rollDetail.widthOnY')})
            </div>
          </div>
        );
      })()}
      <div className="albel-grid albel-grid--min140" style={{ gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.xLengthMm')}</label>
          <InputText
            value={placementForm.xMm}
            onChange={(e) => onFieldChange('xMm', e.target.value)}
            type="number"
            min={0}
            disabled={Boolean(disabled) || creatingPlacement}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.yWidthMm')}</label>
          <InputText
            value={placementForm.yMm}
            onChange={(e) => onFieldChange('yMm', e.target.value)}
            type="number"
            min={0}
            disabled={Boolean(disabled) || creatingPlacement}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.widthMm')}</label>
          <InputText
            value={placementForm.widthMm}
            onChange={(e) => onFieldChange('widthMm', e.target.value)}
            type="number"
            min={1}
            disabled={Boolean(disabled) || creatingPlacement}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.heightMm')}</label>
          <InputText
            value={placementForm.heightMm}
            onChange={(e) => onFieldChange('heightMm', e.target.value)}
            type="number"
            min={1}
            disabled={Boolean(disabled) || creatingPlacement}
          />
        </div>
      </div>
    </div>
  </Dialog>
);
