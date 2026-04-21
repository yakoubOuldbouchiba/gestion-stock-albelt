import React from 'react';
import type { PlacedRectangle } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface PlacementSVGProps {
  widthMm: number;
  lengthMm: number;
  placements: PlacedRectangle[];
  baseColor?: string;
  onPlacementClick?: (placement: PlacedRectangle) => void;
}

export const PlacementSVG: React.FC<PlacementSVGProps> = ({
  widthMm,
  lengthMm,
  placements,
  baseColor = '#f8fafc',
  onPlacementClick
}) => {
  const { t } = useI18n();

  const isSameColor = (first?: string | null, second?: string | null) =>
    Boolean(first && second && first.toLowerCase() === second.toLowerCase());

  const getPlacementFill = (placement: PlacedRectangle) => {
    const fallback = '#ff6f00';
    if (!placement.colorHexCode || isSameColor(placement.colorHexCode, baseColor)) return fallback;
    return placement.colorHexCode;
  };

  const getPlacementStroke = (placement: PlacedRectangle) => {
    const fallback = '#e65100';
    if (!placement.colorHexCode || isSameColor(placement.colorHexCode, baseColor)) return fallback;
    return placement.colorHexCode;
  };

  return (
    <div className="svg-preview-card">
      <div className="svg-preview-header">
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('rollDetail.placements') || 'Placements Preview'}</h3>
        <div className="placement-coords">
          {(lengthMm / 1000).toFixed(2)}m x {widthMm}mm
        </div>
      </div>
      <div className="svg-preview-body">
        {widthMm > 0 && lengthMm > 0 ? (
          <div className="svg-container">
            <svg
              viewBox={`0 0 ${Math.max(1, lengthMm)} ${Math.max(1, widthMm)}`}
              style={{ width: '100%', height: 'auto', maxHeight: '400px', display: 'block' }}
              preserveAspectRatio="xMinYMid meet"
            >
              {/* Base rectangle */}
              <rect
                x={0}
                y={0}
                width={lengthMm}
                height={widthMm}
                fill={baseColor}
                stroke="#cbd5e1"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Placements */}
              {placements.map((placement) => (
                <g 
                  key={placement.id} 
                  style={{ cursor: onPlacementClick ? 'pointer' : 'default' }}
                  onClick={() => onPlacementClick?.(placement)}
                >
                  <title>{`x:${placement.xMm} y:${placement.yMm} ${placement.widthMm}x${placement.heightMm}mm`}</title>
                  <rect
                    x={placement.yMm}
                    y={placement.xMm}
                    width={placement.heightMm}
                    height={placement.widthMm}
                    fill={getPlacementFill(placement)}
                    fillOpacity={0.4}
                    stroke={getPlacementStroke(placement)}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={placement.yMm + 5}
                    y={placement.xMm + 16}
                    fontSize={12}
                    fontWeight={700}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={2}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {`${placement.widthMm}x${placement.heightMm}`}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="p-4 text-center text-muted">
            {t('rollDetail.sourceDimensionsRequired')}
          </div>
        )}
      </div>
    </div>
  );
};
