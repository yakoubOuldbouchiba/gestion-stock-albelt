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

        const isVeryLong = sourceLengthMm / sourceWidthMm > 5;
        const maxSliceRatio = 5;
        const sliceCount = isVeryLong ? Math.min(Math.ceil((sourceLengthMm / sourceWidthMm) / maxSliceRatio), 12) : 1;
        const sliceLengthMm = sourceLengthMm / sliceCount;

        const renderSvgSlice = (sliceIdx: number) => {
          const startX = sliceIdx * sliceLengthMm;
          const endX = (sliceIdx + 1) * sliceLengthMm;
          const viewBox = `${startX} 0 ${sliceLengthMm} ${sourceWidthMm}`;

          return (
            <div key={sliceIdx} className="albel-svg-slice-container" style={{ marginBottom: sliceCount > 1 ? '1.5rem' : 0 }}>
              {sliceCount > 1 && (
                <div className="albel-svg-slice-header">
                  <span>{t('commandes.slice')} {sliceIdx + 1}</span>
                  <span>{(startX / 1000).toFixed(1)}m — {(endX / 1000).toFixed(1)}m</span>
                </div>
              )}
              <div className="albel-svg-slice">
                <svg
                  viewBox={viewBox}
                  className="albel-generated-svg"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
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
                    
                    // Filter placements that are at least partially in this slice
                    const pStartX = placement.yMm;
                    const pEndX = placement.yMm + placement.heightMm;
                    if (pEndX < startX || pStartX > endX) return null;

                    const fontSize = Math.max(10, Math.round(sliceLengthMm / 80));
                    const strokeWidthText = Math.max(0.5, fontSize / 12);

                    return (
                      <g key={placement.id}>
                        <title>{`x:${placement.xMm} y:${placement.yMm} ${placement.widthMm}x${placement.heightMm}mm`}</title>
                        <rect
                          x={placement.yMm}
                          y={placement.xMm}
                          width={placement.heightMm}
                          height={placement.widthMm}
                          fill={fill}
                          fillOpacity={0.45}
                          stroke={stroke}
                          strokeWidth={1.5}
                          vectorEffect="non-scaling-stroke"
                        />
                        {placement.heightMm > sliceLengthMm / 15 && placement.widthMm > sourceWidthMm / 15 && (
                          <text
                            x={placement.yMm + placement.heightMm / 2}
                            y={placement.xMm + placement.widthMm / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: `${fontSize}px`,
                              fontWeight: 800,
                              fill: '#000',
                              paintOrder: 'stroke',
                              stroke: '#fff',
                              strokeWidth: `${strokeWidthText}px`,
                              pointerEvents: 'none'
                            }}
                          >
                            {placement.commandeItem?.reference || placement.id.slice(0, 4)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        };

        return (
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center justify-content-between">
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {isRoll ? t('rollDetail.roll') : t('rollDetail.waste')} {source ? formatRollChuteLabel(source) : previewPlacement.id.slice(0, 8)}
              </div>
              <div className="operator-meta-tag">
                {(sourceLengthMm / 1000).toFixed(2)}m × {sourceWidthMm}mm
              </div>
            </div>
            
            {itemLabel && (
              <div style={{ color: 'var(--commande-muted)', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                <i className="pi pi-tag mr-1" style={{ fontSize: '0.8rem' }}></i>
                {itemLabel}
              </div>
            )}

            <div className="albel-svg-viewer albel-svg-viewer--sliced">
              <div className="albel-svg-slices">
                {Array.from({ length: sliceCount }).map((_, i) => renderSvgSlice(i))}
              </div>
            </div>

            <div className="flex align-items-center gap-2 p-2 border-round surface-100 text-sm text-600">
              <i className="pi pi-info-circle"></i>
              <span>{t('rollDetail.lengthOnX')}, {t('rollDetail.widthOnY')}</span>
            </div>
          </div>
        );
      })() : null}
    </Dialog>
  );
};
