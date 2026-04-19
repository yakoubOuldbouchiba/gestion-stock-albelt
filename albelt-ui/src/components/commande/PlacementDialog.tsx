import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import type { CommandeItem, PlacedRectangle, Roll } from '../../types';
import type { Translate } from './commandeTypes';

const MAX_DISPLAY_LENGTH = 2000;

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

const getPlacementPreviewColors = (placementColor?: string | null, sourceColor?: string | null) => {
  const hasSameColor = Boolean(
    placementColor && sourceColor && placementColor.toLowerCase() === sourceColor.toLowerCase()
  );

  if (placementColor && !hasSameColor) {
    return {
      fill: placementColor,
      stroke: placementColor,
    };
  }

  return {
    fill: '#f59e0b',
    stroke: '#c2410c',
  };
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
}: PlacementDialogProps) => {
  const previewLabel = editingPlacementId ? t('rollDetail.updatePlacement') : t('rollDetail.addPlacement');
  const source = placementForm.sourceId
    ? placementForm.sourceType === 'ROLL'
      ? rolls.find((roll) => roll.id === placementForm.sourceId)
      : wasteForItem.find((waste: any) => waste.id === placementForm.sourceId)
    : null;
  const sourceWidthMm = Number(source?.widthMm) || 0;
  const sourceLengthMm = Math.round((Number(source?.lengthM) || 0) * 1000);
  const sourcePlacements = placementForm.sourceId
    ? placementsForItem.filter((placement) => (
        placementForm.sourceType === 'ROLL'
          ? placement.rollId === placementForm.sourceId
          : placement.wastePieceId === placementForm.sourceId
      ))
    : [];
  const scale = sourceLengthMm > MAX_DISPLAY_LENGTH ? MAX_DISPLAY_LENGTH / sourceLengthMm : 1;
  const displayLength = sourceLengthMm * scale;
  const displayWidth = sourceWidthMm * scale;
  const sourceColor = source?.colorHexCode || null;

  const draftX = Number(placementForm.xMm);
  const draftY = Number(placementForm.yMm);
  const draftWidth = Number(placementForm.widthMm);
  const draftHeight = Number(placementForm.heightMm);
  const hasDraftPlacement =
    [draftX, draftY, draftWidth, draftHeight].every((value) => Number.isFinite(value))
    && draftX >= 0
    && draftY >= 0
    && draftWidth > 0
    && draftHeight > 0;
  const draftWithinBounds =
    hasDraftPlacement
    && draftX < sourceWidthMm
    && draftY < sourceLengthMm
    && draftX + draftWidth <= sourceWidthMm
    && draftY + draftHeight <= sourceLengthMm;
  const draftOverlapsExisting =
    hasDraftPlacement
    && sourcePlacements.some((placement) => {
      if (editingPlacementId && placement.id === editingPlacementId) {
        return false;
      }

      return (
        draftX < placement.xMm + placement.widthMm
        && draftX + draftWidth > placement.xMm
        && draftY < placement.yMm + placement.heightMm
        && draftY + draftHeight > placement.yMm
      );
    });
  const draftPreviewTone = !hasDraftPlacement ? null : !draftWithinBounds || draftOverlapsExisting ? 'danger' : 'accent';
  const draftFill = draftPreviewTone === 'danger' ? '#f87171' : '#60a5fa';
  const draftStroke = draftPreviewTone === 'danger' ? '#b91c1c' : '#1d4ed8';
  const gridStepMm = Math.max(100, Math.ceil(Math.max(sourceLengthMm, sourceWidthMm) / 6 / 100) * 100);
  const horizontalGuides = sourceLengthMm > 0
    ? Array.from(
        { length: Math.floor(sourceLengthMm / gridStepMm) },
        (_, index) => (index + 1) * gridStepMm
      ).filter((value) => value < sourceLengthMm)
    : [];
  const verticalGuides = sourceWidthMm > 0
    ? Array.from(
        { length: Math.floor(sourceWidthMm / gridStepMm) },
        (_, index) => (index + 1) * gridStepMm
      ).filter((value) => value < sourceWidthMm)
    : [];

  const legendItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: 'var(--text-color-secondary)',
  } as const;

  return (
    <Dialog
      header={previewLabel}
      visible={showPlacementModal}
      onHide={onHide}
      position="right"
      style={{ width: 'min(560px, 95vw)', height: '100vh' }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button label={t('commandes.cancel')} severity="secondary" onClick={onHide} />
          <Button
            label={previewLabel}
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
        ) : !sourceWidthMm || !sourceLengthMm ? (
          <Message severity="info" text={t('rollDetail.sourceDimensionsRequired')} />
        ) : (
          <div
            style={{
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              padding: '0.75rem',
              background: 'var(--surface-card)',
              display: 'grid',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={legendItemStyle}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '999px',
                      background: sourceColor || '#e5e7eb',
                      border: '1px solid #94a3b8',
                      opacity: 0.45,
                    }}
                  />
                  {t('rollDetail.source')}
                </span>
                <span style={legendItemStyle}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: '#f59e0b',
                      border: '1px solid #c2410c',
                      opacity: 0.35,
                    }}
                  />
                  {t('rollDetail.existingPlacements')}
                </span>
                {hasDraftPlacement ? (
                  <span style={legendItemStyle}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: draftFill,
                        border: `2px dashed ${draftStroke}`,
                        opacity: 0.4,
                      }}
                    />
                    {previewLabel}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  fontSize: '0.8rem',
                  color: 'var(--text-color-secondary)',
                }}
              >
                <span>{t('rollDetail.lengthOnX')}</span>
                <span>{t('rollDetail.widthOnY')}</span>
              </div>
            </div>
            <div
              style={{
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
                border: '1px solid var(--surface-border)',
                borderRadius: '6px',
                padding: '8px',
                background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.95))',
              }}
            >
              <svg
                viewBox={`0 0 ${Math.max(1, displayLength)} ${Math.max(1, displayWidth)}`}
                style={{
                  height: 260,
                  width: '100%',
                  minWidth: 400,
                  maxWidth: displayLength,
                  display: 'block',
                }}
                preserveAspectRatio="xMinYMid meet"
              >
                <rect
                  x={0}
                  y={0}
                  width={displayLength}
                  height={displayWidth}
                  fill={sourceColor || '#e5e7eb'}
                  fillOpacity={sourceColor ? 0.18 : 0.75}
                  stroke={sourceColor || '#94a3b8'}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  rx={6}
                  ry={6}
                />
                {horizontalGuides.map((value) => (
                  <line
                    key={`length-guide-${value}`}
                    x1={value * scale}
                    y1={0}
                    x2={value * scale}
                    y2={displayWidth}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="6 6"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {verticalGuides.map((value) => (
                  <line
                    key={`width-guide-${value}`}
                    x1={0}
                    y1={value * scale}
                    x2={displayLength}
                    y2={value * scale}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="6 6"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {sourcePlacements.map((placement) => {
                  const placementColors = getPlacementPreviewColors(placement.colorHexCode, sourceColor);

                  return (
                    <g key={placement.id}>
                      <title>{`x:${placement.xMm} y:${placement.yMm} ${placement.widthMm}x${placement.heightMm}mm`}</title>
                      <rect
                        x={placement.yMm * scale}
                        y={placement.xMm * scale}
                        width={placement.heightMm * scale}
                        height={placement.widthMm * scale}
                        fill={placementColors.fill}
                        fillOpacity={0.28}
                        stroke={placementColors.stroke}
                        strokeWidth={1.25}
                        vectorEffect="non-scaling-stroke"
                        rx={4}
                        ry={4}
                      />
                    </g>
                  );
                })}
                {hasDraftPlacement ? (
                  <g>
                    <line
                      x1={draftY * scale}
                      y1={0}
                      x2={draftY * scale}
                      y2={draftX * scale}
                      stroke={draftStroke}
                      strokeWidth={1.5}
                      strokeDasharray="7 5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={0}
                      y1={draftX * scale}
                      x2={draftY * scale}
                      y2={draftX * scale}
                      stroke={draftStroke}
                      strokeWidth={1.5}
                      strokeDasharray="7 5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={draftY * scale}
                      y={draftX * scale}
                      width={draftHeight * scale}
                      height={draftWidth * scale}
                      fill={draftFill}
                      fillOpacity={0.24}
                      stroke={draftStroke}
                      strokeWidth={2}
                      strokeDasharray="10 6"
                      vectorEffect="non-scaling-stroke"
                      rx={4}
                      ry={4}
                    />
                    <circle
                      cx={draftY * scale}
                      cy={draftX * scale}
                      r={4}
                      fill={draftStroke}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ) : null}
              </svg>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: 'var(--text-color-secondary)',
              }}
            >
              <span>
                {(sourceLengthMm / 1000).toFixed(2)}m x {sourceWidthMm}mm
              </span>
              {hasDraftPlacement ? (
                <span>
                  x:{draftX} y:{draftY} {draftWidth}x{draftHeight}mm
                </span>
              ) : null}
            </div>
            {hasDraftPlacement && !draftWithinBounds ? (
              <Message severity="warn" text={t('inventory.placementOutsideSourceBounds')} />
            ) : null}
            {hasDraftPlacement && draftWithinBounds && draftOverlapsExisting ? (
              <Message severity="warn" text={t('inventory.placementOverlapsExistingRectangle')} />
            ) : null}
          </div>
        )}
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
};
