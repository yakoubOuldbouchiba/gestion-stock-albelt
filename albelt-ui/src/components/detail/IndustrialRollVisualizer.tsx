import React, { useRef, useState } from 'react';
import type { PlacedRectangle, OptimizationPlacementReport } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import './IndustrialRollVisualizer.css';

interface IndustrialRollVisualizerProps {
  widthMm: number;
  lengthMm: number;
  placements: (PlacedRectangle | OptimizationPlacementReport)[];
  baseColor?: string;
  onPlacementClick?: (placement: any) => void;
  printSegment?: { startMm: number; endMm: number; };
  onEnlarge?: (title: string, svg: string) => void;
  svgString?: string;
  title?: string;
}

/**
 * IndustrialRollVisualizer (Continuous Scroll & Map UX)
 * A premium, user-friendly way to navigate 120m rolls.
 * Features a "Roll Map" sidebar and a continuous material flow.
 */
export const IndustrialRollVisualizer: React.FC<IndustrialRollVisualizerProps> = ({
  widthMm,
  lengthMm,
  placements,
  baseColor = '#f8fafc',
  onPlacementClick,
  printSegment,
  onEnlarge,
  svgString,
  title,
}) => {
  // Debug log for enlarge button props
  console.log('ENLARGE DEBUG', { onEnlarge, svgString, title });
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentM, setCurrentM] = useState(0);

  // Sync current meter based on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const pct = target.scrollTop / (target.scrollHeight - target.clientHeight);
    setCurrentM((pct * lengthMm) / 1000);
  };

  const jumpTo = (mm: number) => {
    if (!scrollRef.current) return;
    const totalHeight = scrollRef.current.scrollHeight;
    scrollRef.current.scrollTo({
      top: (mm / lengthMm) * totalHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="industrial-roll-ux">
      {/* Premium Header */}
      <div className="ux-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div className="ux-header-main">
            <h2>{t('inventory.roll')} {printSegment ? `(Segment ${printSegment.startMm/1000}m - ${printSegment.endMm/1000}m)` : `#${(lengthMm / 1000).toFixed(0)}m`}</h2>
            <div className="ux-stats">
              <span className="ux-badge"><i className="pi pi-arrows-h" /> {widthMm}mm</span>
              <span className="ux-badge primary"><i className="pi pi-tag" /> {placements.length} {t('rollDetail.placements')}</span>
            </div>
          </div>
          {!printSegment && (
            <div className="ux-current-meter">
              <span>{t('commandes.position') || 'Position'}:</span>
              <strong>{currentM.toFixed(1)}m</strong>
            </div>
          )}
        </div>
        {/* Enlarge button removed: now handled in parent header */}
      </div>

      <div className="ux-body" style={printSegment ? { overflow: 'hidden' } : {}}>
        {/* Continuous Material Strip */}
        <div className={printSegment ? "" : "ux-scroll-viewport"} ref={scrollRef} onScroll={printSegment ? undefined : handleScroll}>
          <div
            className="ux-material-strip"
            style={{
              height: `${((printSegment ? printSegment.endMm - printSegment.startMm : lengthMm) / 1000) * 150}px`, // Fixed scale: 150px per meter
              backgroundColor: baseColor,
              position: 'relative'
            }}
          >
            <div className="ux-grid-overlay" />

            {/* Rulers */}
            {[...Array(Math.ceil((printSegment ? printSegment.endMm - printSegment.startMm : lengthMm) / 1000))].map((_, i) => {
              const actualM = printSegment ? (printSegment.startMm / 1000) + i : i;
              return (
                <div key={i} className="ux-meter-line" style={{ top: `${i * 150}px` }}>
                  <span>{actualM}m</span>
                </div>
              );
            })}

            {/* Placements */}
            {placements
              .filter(p => printSegment ? (p.yMm < printSegment.endMm && (p.yMm + p.heightMm) > printSegment.startMm) : true)
              .map((p, idx) => {
              const adjustedY = printSegment ? p.yMm - printSegment.startMm : p.yMm;
              const top = (adjustedY / 1000) * 150;
              const height = (p.heightMm / 1000) * 150;
              const left = (p.xMm / widthMm) * 100;
              const width = (p.widthMm / widthMm) * 100;

              return (
                <div
                  key={(p as any).id || `opt-${idx}`}
                  className="ux-placement-card"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: ((p as any).colorHexCode || (p as any).placementColorHexCode) || '#3b82f6'
                  }}
                  onClick={() => onPlacementClick?.(p)}
                >
                  <div className="ux-placement-info">
                    <span className="dim">{p.heightMm}</span>
                    <span className="sep">×</span>
                    <span className="dim">{p.widthMm}</span>
                  </div>
                  <div className="ux-placement-tooltip">
                    {p.heightMm}x{p.widthMm}mm @ {p.yMm}mm
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* The Roll Map (Navigation Sidebar) - hidden in print mode */}
        {!printSegment && (
          <div className="ux-roll-map">
            <div className="map-track">
              {placements.map((p, idx) => (
                <div
                  key={`map-${(p as any).id || idx}`}
                  className="map-marker"
                  style={{
                    top: `${(p.yMm / lengthMm) * 100}%`,
                    height: `${Math.max(2, (p.heightMm / lengthMm) * 100)}%`
                  }}
                  onClick={() => jumpTo(p.yMm)}
                  title={`${p.heightMm}x${p.widthMm}`}
                />
              ))}
              {/* Current View Indicator */}
              <div
                className="map-indicator"
                style={{ top: `${(currentM * 1000 / lengthMm) * 100}%` }}
              />
            </div>
            <div className="map-label">{t('common.navigation') || 'Map'}</div>
          </div>
        )}
      </div>
    </div>
  );
};
