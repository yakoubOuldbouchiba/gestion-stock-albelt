import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import type { PlacedRectangle } from '../../types';
import { useI18n } from '@hooks/useI18n';

type PlacementPreviewDialogProps = {
  showPlacementPreview: boolean;
  onHide: () => void;
  previewPlacement: PlacedRectangle | null;
  placementsForItem: PlacedRectangle[];
};

export const PlacementPreviewDialog = ({
  showPlacementPreview,
  onHide,
  previewPlacement,
  placementsForItem,
}: PlacementPreviewDialogProps) => {
  const { t } = useI18n();
  
  return (
    <Dialog
      header={t('rollDetail.selectSourceToPreview')}
      visible={showPlacementPreview}
      onHide={onHide}
      position="right"
      style={{ width: 'min(700px, 95vw)', height: '100vh' }}
    >
      {previewPlacement ? (() => {
        const rollId = previewPlacement.rollId ?? previewPlacement.roll?.id;
        const wastePieceId = previewPlacement.wastePieceId ?? previewPlacement.wastePiece?.id;
        const isRoll = Boolean(rollId);
        const source = previewPlacement.roll ?? previewPlacement.wastePiece ?? null;
        const itemLabel = previewPlacement.commandeItem
          ? [
              previewPlacement.commandeItem.lineNumber
                ? `Line ${previewPlacement.commandeItem.lineNumber}`
                : null,
              previewPlacement.commandeItem.reference ?? null,
            ]
              .filter(Boolean)
              .join(' • ')
          : null;
        const sourceWidthMm = Number(source?.widthMm) || 0;
        const sourceLengthMm = Math.round((Number(source?.lengthM) || 0) * 1000);
        const sourcePlacements = placementsForItem.filter((placement) => (
          isRoll
            ? placement.rollId === rollId
            : placement.wastePieceId === wastePieceId
        ));

        if (!sourceWidthMm || !sourceLengthMm) {
          return <Message severity="info" text={t('rollDetail.sourceDimensionsRequired')} />;
        }

        return (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>
              {isRoll ? t('rollDetail.roll') : t('rollDetail.waste')} {source ? formatRollChuteLabel(source) : previewPlacement.id.slice(0, 8)}
            </div>
            {itemLabel ? (
              <div style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>{itemLabel}</div>
            ) : null}
            <div
              style={{
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                padding: '0.5rem',
                background: 'var(--surface-card)',
              }}
            >
              <div style={{ overflow: 'auto' }}>
                <svg
                  viewBox={`0 0 ${Math.max(1, sourceLengthMm)} ${Math.max(1, sourceWidthMm)}`}
                  style={{ height: 360, width: 'auto', display: 'block' }}
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
          </div>
        );
      })() : null}
    </Dialog>
  );
};
