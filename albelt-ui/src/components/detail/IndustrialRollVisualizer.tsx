import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PlacedRectangle, OptimizationPlacementReport } from '../../types';
import { useI18n } from '../../hooks/useI18n';
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

type TooltipState = {
  placement: NormalizedPlacement;
  left: number;
  top: number;
  horizontal: 'left' | 'right';
  vertical: 'above' | 'below';
  pinned: boolean;
};

/**
 * IndustrialRollVisualizer (Continuous Scroll & Map UX)
 * Keeps placement geometry untouched and upgrades only the interaction layer.
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeAnchorRef = useRef<HTMLElement | null>(null);
  const [currentM, setCurrentM] = useState(0);
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const isPrintMode = printMode || Boolean(printSegment);

  const normalizedPlacements = useMemo<NormalizedPlacement[]>(
    () =>
      placements.map((placement) => ({
        ...placement,
        xMm: placement.xMm ?? placement.xmm,
        yMm: placement.yMm ?? placement.ymm,
        referenceLabel: 'commandeItem' in placement ? placement.commandeItem?.reference ?? null : null,
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

  const positionTooltip = (
    placement: NormalizedPlacement,
    anchor: HTMLElement,
    pinned: boolean
  ) => {
    if (isPrintMode || !bodyRef.current) return;

    activeAnchorRef.current = anchor;

    const bodyRect = bodyRef.current.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current?.offsetWidth ?? 220;
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 108;
    const gap = 14;

    const spaceRight = bodyRect.right - anchorRect.right;
    const spaceLeft = anchorRect.left - bodyRect.left;
    const spaceAbove = anchorRect.top - bodyRect.top;

    const horizontal: TooltipState['horizontal'] =
      spaceRight >= tooltipWidth + gap || spaceRight >= spaceLeft ? 'right' : 'left';
    const vertical: TooltipState['vertical'] =
      spaceAbove >= tooltipHeight + gap ? 'above' : 'below';

    const preferredLeft =
      horizontal === 'right'
        ? anchorRect.right - bodyRect.left + gap
        : anchorRect.left - bodyRect.left - tooltipWidth - gap;
    const preferredTop =
      vertical === 'above'
        ? anchorRect.top - bodyRect.top - tooltipHeight - gap
        : anchorRect.bottom - bodyRect.top + gap;

    const maxLeft = Math.max(8, bodyRect.width - tooltipWidth - 8);
    const maxTop = Math.max(8, bodyRect.height - tooltipHeight - 8);

    setTooltipState({
      placement,
      left: Math.min(Math.max(8, preferredLeft), maxLeft),
      top: Math.min(Math.max(8, preferredTop), maxTop),
      horizontal,
      vertical,
      pinned,
    });
  };

  const clearTooltip = () => {
    activeAnchorRef.current = null;
    setTooltipState(null);
  };

  const handlePlacementEnter =
    (placement: NormalizedPlacement) => (event: React.MouseEvent<HTMLDivElement>) => {
      if (isPrintMode || tooltipState?.pinned) return;
      positionTooltip(placement, event.currentTarget, false);
    };

  const handlePlacementLeave = () => {
    if (isPrintMode || tooltipState?.pinned) return;
    clearTooltip();
  };

  const handlePlacementClick =
    (placement: NormalizedPlacement) => (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isPrintMode) {
        const isSamePlacement = tooltipState?.placement === placement;
        if (tooltipState?.pinned && isSamePlacement) {
          clearTooltip();
        } else {
          positionTooltip(placement, event.currentTarget, true);
        }
      }
      onPlacementClick?.(placement);
    };

  useEffect(() => {
    if (!tooltipState || isPrintMode) return;

    const syncTooltip = () => {
      if (activeAnchorRef.current) {
        positionTooltip(tooltipState.placement, activeAnchorRef.current, tooltipState.pinned);
      }
    };

    syncTooltip();

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener('scroll', syncTooltip, { passive: true });
    window.addEventListener('resize', syncTooltip);

    return () => {
      scrollElement?.removeEventListener('scroll', syncTooltip);
      window.removeEventListener('resize', syncTooltip);
    };
  }, [isPrintMode, tooltipState]);

  useEffect(() => {
    if (isPrintMode) {
      clearTooltip();
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

                return (
                  <div
                    key={(placement as any).id || `opt-${index}`}
                    className={`ux-placement-card${tooltipState?.placement === placement ? ' is-active' : ''}`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: cardColor,
                    }}
                    onMouseEnter={handlePlacementEnter(placement)}
                    onMouseLeave={handlePlacementLeave}
                    onClick={handlePlacementClick(placement)}
                  >
                    <div className="ux-placement-info">
                      <span className="dim">{placement.heightMm}</span>
                      <span className="sep">x</span>
                      <span className="dim">{placement.widthMm}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {!isPrintMode && tooltipState && (
          <div
            ref={tooltipRef}
            className={`ux-placement-tooltip-overlay is-visible is-${tooltipState.horizontal} is-${tooltipState.vertical}${
              tooltipState.pinned ? ' is-pinned' : ''
            }`}
            style={{
              left: `${tooltipState.left}px`,
              top: `${tooltipState.top}px`,
            }}
          >
            <div className="ux-placement-tooltip-title">
              {tooltipState.placement.referenceLabel || t('commandes.placement') || 'Placement'}
            </div>
            <div className="ux-placement-tooltip-row">
              <span>{t('commandes.dimensions') || 'Size'}</span>
              <strong>
                {tooltipState.placement.widthMm} x {tooltipState.placement.heightMm} mm
              </strong>
            </div>
            <div className="ux-placement-tooltip-row">
              <span>{t('commandes.position') || 'Position'}</span>
              <strong>
                X {Number(tooltipState.placement.xMm / 1000).toFixed(3)} m | Y{' '}
                {Number(tooltipState.placement.yMm / 1000).toFixed(3)} m
              </strong>
            </div>
            {(tooltipState.placement as any).id && (
              <div className="ux-placement-tooltip-row">
                <span>ID</span>
                <strong>{String((tooltipState.placement as any).id).slice(0, 18)}</strong>
              </div>
            )}
            {tooltipState.placement.metadataLabel && (
              <div className="ux-placement-tooltip-row">
                <span>{t('common.details') || 'Details'}</span>
                <strong>{tooltipState.placement.metadataLabel}</strong>
              </div>
            )}
            {tooltipState.pinned && (
              <div className="ux-placement-tooltip-footnote">{t('common.click') || 'Click'} to unpin</div>
            )}
          </div>
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
