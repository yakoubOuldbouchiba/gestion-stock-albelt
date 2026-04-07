import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import type { PlacedRectangle } from '../../types';

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
}: PlacementPreviewDialogProps) => (
  <Dialog
    header="Placement preview"
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
        return <Message severity="info" text="Source dimensions are required for SVG preview." />;
      }

      return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>
            {isRoll ? 'Roll' : 'Waste'} {source ? formatRollChuteLabel(source) : previewPlacement.id.slice(0, 8)}
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
            <svg
              viewBox={`0 0 ${Math.max(1, sourceLengthMm)} ${Math.max(1, sourceWidthMm)}`}
              width="100%"
              height="360"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect
                x={0}
                y={0}
                width={sourceLengthMm}
                height={sourceWidthMm}
                fill={source?.colorHexCode || '#f5f5f5'}
                stroke="#bdbdbd"
                strokeWidth={2}
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
                  <rect
                    key={placement.id}
                    x={placement.yMm}
                    y={placement.xMm}
                    width={placement.heightMm}
                    height={placement.widthMm}
                    fill={fill}
                    fillOpacity={0.35}
                    stroke={stroke}
                    strokeWidth={1}
                  />
                );
              })}
            </svg>
            <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
              {(sourceLengthMm / 1000).toFixed(2)}m x {sourceWidthMm}mm (length on X, width on Y)
            </div>
          </div>
        </div>
      );
    })() : null}
  </Dialog>
);
