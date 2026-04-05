import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import type { PlacedRectangle, Roll } from '../../types';

type PlacementPreviewDialogProps = {
  showPlacementPreview: boolean;
  onHide: () => void;
  previewPlacement: PlacedRectangle | null;
  rolls: Roll[];
  wasteForItem: any[];
  placementsForItem: PlacedRectangle[];
};

export const PlacementPreviewDialog = ({
  showPlacementPreview,
  onHide,
  previewPlacement,
  rolls,
  wasteForItem,
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
      const isRoll = Boolean(previewPlacement.rollId);
      const source = isRoll
        ? rolls.find((roll) => roll.id === previewPlacement.rollId)
        : wasteForItem.find((waste: any) => waste.id === previewPlacement.wastePieceId);
      const sourceWidthMm = Number(source?.widthMm) || 0;
      const sourceLengthMm = Math.round((Number(source?.lengthM) || 0) * 1000);
      const sourcePlacements = placementsForItem.filter((placement) => (
        isRoll
          ? placement.rollId === previewPlacement.rollId
          : placement.wastePieceId === previewPlacement.wastePieceId
      ));

      if (!sourceWidthMm || !sourceLengthMm) {
        return <Message severity="info" text="Source dimensions are required for SVG preview." />;
      }

      return (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ fontWeight: 600 }}>
            {isRoll ? 'Roll' : 'Waste'} {source?.reference ?? previewPlacement.id.slice(0, 8)}
          </div>
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
              {sourcePlacements.map((placement) => (
                <rect
                  key={placement.id}
                  x={placement.yMm}
                  y={placement.xMm}
                  width={placement.heightMm}
                  height={placement.widthMm}
                  fill={placement.colorHexCode || 'rgba(25, 118, 210, 0.35)'}
                  stroke={placement.colorHexCode || '#1565c0'}
                  strokeWidth={1}
                />
              ))}
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
