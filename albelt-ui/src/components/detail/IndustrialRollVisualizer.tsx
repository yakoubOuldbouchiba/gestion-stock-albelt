import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PlacedRectangle, OptimizationPlacementReport } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { PlacementDetailsDialog } from './PlacementDetailsDialog';
import './IndustrialRollVisualizer.css';

interface IndustrialRollVisualizerProps {
  widthMm: number;
  lengthMm: number;
  placements: (PlacedRectangle | OptimizationPlacementReport)[];
  baseColor?: string;
  onPlacementClick?: (placement: any) => void;
  printSegment?: { startMm: number; endMm: number };
  printMode?: boolean;
  onEnlarge?: (title: string, svg: string) => void;
  svgString?: string;
  title?: string;
}

type NormalizedPlacement = (PlacedRectangle | OptimizationPlacementReport) & {
  xMm: number;
  yMm: number;
  referenceLabel?: string | null;
  metadataLabel?: string | null;
};

/**
 * IndustrialRollVisualizer (Continuous Scroll & Map UX)
 * Keeps placement geometry untouched and upgrades only the interaction layer.
 * Now uses PlacementDetailsDialog instead of tooltip for better UX.
 */
export const IndustrialRollVisualizer: React.FC<IndustrialRollVisualizerProps> = ({
  widthMm,
  lengthMm,
  placements,
  baseColor = '#f8fafc',
  onPlacementClick,
  printSegment,
  printMode = false,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [currentM, setCurrentM] = useState(0);
  const [selectedPlacement, setSelectedPlacement] = useState<NormalizedPlacement | null>(null);
  const [showPlacementDialog, setShowPlacementDialog] = useState(false);
  const isPrintMode = printMode || Boolean(printSegment);

  const normalizedPlacements = useMemo<NormalizedPlacement[]>(
    () =>
      placements.map((placement) => ({
        ...placement,
        xMm: placement.xMm ?? placement.xmm,
        yMm: placement.yMm ?? placement.ymm,
        referenceLabel: 
          'referenceCommande' in placement ? (placement as any).referenceCommande ?? null :
          'commandeItem' in placement ? placement.commandeItem?.reference ?? null : null,
        metadataLabel:
          'rotated' in placement && placement.rotated != null
            ? placement.rotated
              ? 'Rotated'
              : 'Standard'
            : null,
      })),
    [placements]
  );

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollableHeight = target.scrollHeight - target.clientHeight;
    const pct = scrollableHeight > 0 ? target.scrollTop / scrollableHeight : 0;
    setCurrentM((pct * lengthMm) / 1000);
  };

  const jumpTo = (mm: number) => {
    if (!scrollRef.current) return;
    const totalHeight = scrollRef.current.scrollHeight;
    scrollRef.current.scrollTo({
      top: (mm / lengthMm) * totalHeight,
      behavior: 'smooth',
    });
  };

  const calculatePlacementPercentage = (
    placementWidth: number,
    placementHeight: number,
    sourceWidth: number,
    sourceHeight: number
  ): number => {
    if (sourceWidth <= 0 || sourceHeight <= 0) return 0;
    const placementArea = placementWidth * placementHeight;
    const sourceArea = sourceWidth * sourceHeight;
    return (placementArea * 100) / sourceArea;
  };

  const handlePlacementClick = (placement: NormalizedPlacement) => {
    if (isPrintMode) return;
    setSelectedPlacement(placement);
    setShowPlacementDialog(true);
    onPlacementClick?.(placement);
  };

  const handleHidePlacementDialog = () => {
    setShowPlacementDialog(false);
    setSelectedPlacement(null);
  };

  useEffect(() => {
    if (isPrintMode) {
      handleHidePlacementDialog();
    }
  }, [isPrintMode]);

  return (
    <div className={`industrial-roll-ux${isPrintMode ? ' industrial-roll-ux--print' : ''}`}>
      <div className="ux-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div className="ux-header-main">
            <h2>
              {t('inventory.roll')}{' '}
              {printSegment
                ? `(Segment ${printSegment.startMm / 1000}m - ${printSegment.endMm / 1000}m)`
                : `#${(lengthMm / 1000).toFixed(0)}m`}
            </h2>
            <div className="ux-stats">
              <span className="ux-badge">
                <i className="pi pi-arrows-h" /> {widthMm}mm
              </span>
              <span className="ux-badge primary">
                <i className="pi pi-tag" /> {placements.length} {t('rollDetail.placements')}
              </span>
            </div>
          </div>
          {!printSegment && (
            <div className="ux-current-meter">
              <span>{t('commandes.position') || 'Position'}:</span>
              <strong>{currentM.toFixed(1)}m</strong>
            </div>
          )}
        </div>
      </div>

      <div className="ux-body" ref={bodyRef} style={printSegment ? { overflow: 'hidden' } : {}}>
        <div
          className={printSegment ? '' : 'ux-scroll-viewport'}
          ref={scrollRef}
          onScroll={printSegment ? undefined : handleScroll}
        >
          <div
            className="ux-material-strip"
            style={{
              height: `${((printSegment ? printSegment.endMm - printSegment.startMm : lengthMm) / 1000) * 150}px`,
              backgroundColor: baseColor,
              position: 'relative',
            }}
          >
            <div className="ux-grid-overlay" />

            {[...Array(Math.ceil((printSegment ? printSegment.endMm - printSegment.startMm : lengthMm) / 1000))].map(
              (_, index) => {
                const actualM = printSegment ? printSegment.startMm / 1000 + index : index;
                return (
                  <div key={index} className="ux-meter-line" style={{ top: `${index * 150}px` }}>
                    <span>{actualM}m</span>
                  </div>
                );
              }
            )}

            {normalizedPlacements
              .filter((placement) =>
                printSegment
                  ? placement.yMm < printSegment.endMm &&
                    placement.yMm + placement.heightMm > printSegment.startMm
                  : true
              )
              .map((placement, index) => {
                const adjustedY = printSegment ? placement.yMm - printSegment.startMm : placement.yMm;
                const top = (adjustedY / 1000) * 150;
                const height = (placement.heightMm / 1000) * 150;
                const left = (placement.xMm / widthMm) * 100;
                const width = (placement.widthMm / widthMm) * 100;
                const cardColor =
                  ((placement as any).colorHexCode || (placement as any).placementColorHexCode) || '#3b82f6';
                const placementPercentage = calculatePlacementPercentage(
                  placement.widthMm,
                  placement.heightMm,
                  lengthMm,
                  widthMm
                );

                return (
                  <div
                    key={(placement as any).id || `opt-${index}`}
                    className="ux-placement-card"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: cardColor,
                      borderColor: 'white',
                      borderWidth: 4,
                      borderStyle: 'dashed double',
                      cursor: 'pointer',
                    }}
                    onClick={() => handlePlacementClick(placement)}
                  >
                    <div className="ux-placement-info">
                      <span className="dim">{placement.heightMm}</span>
                      <span className="sep">x</span>
                      <span className="dim">{placement.widthMm}</span>
                    </div>
                    {placementPercentage > 0 && (
                      <div className="ux-placement-percentage">
                        <span className="percentage-text">{placementPercentage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {!isPrintMode && selectedPlacement && (
          <PlacementDetailsDialog
            visible={showPlacementDialog}
            placement={selectedPlacement}
            onHide={handleHidePlacementDialog}
            placementPercentage={calculatePlacementPercentage(
              selectedPlacement.widthMm,
              selectedPlacement.heightMm,
              lengthMm,
              widthMm
            )}
          />
        )}

        {!printSegment && (
          <div className="ux-roll-map">
            <div className="map-track">
              {normalizedPlacements.map((placement, index) => (
                <div
                  key={`map-${(placement as any).id || index}`}
                  className="map-marker"
                  style={{
                    top: `${(placement.yMm / lengthMm) * 100}%`,
                    height: `${Math.max(2, (placement.heightMm / lengthMm) * 100)}%`,
                  }}
                  onClick={() => jumpTo(placement.yMm)}
                  title={`${placement.heightMm}x${placement.widthMm}`}
                />
              ))}
              <div className="map-indicator" style={{ top: `${((currentM * 1000) / lengthMm) * 100}%` }} />
            </div>
            <div className="map-label">{t('common.navigation') || 'Map'}</div>
          </div>
        )}
      </div>
    </div>
  );
};
