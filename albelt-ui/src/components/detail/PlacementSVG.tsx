import React from 'react';
import type { PlacedRectangle } from '../../types';
import { IndustrialRollVisualizer } from './IndustrialRollVisualizer';

interface PlacementSVGProps {
  widthMm: number;
  lengthMm: number;
  placements: PlacedRectangle[];
  baseColor?: string;
  onPlacementClick?: (placement: PlacedRectangle) => void;
}

/**
 * PlacementSVG (Legacy Wrapper)
 * Now delegates to the high-performance IndustrialRollVisualizer.
 */
export const PlacementSVG: React.FC<PlacementSVGProps> = ({
  widthMm,
  lengthMm,
  placements,
  baseColor = '#f8fafc',
  onPlacementClick
}) => {
  return (
    <div className="svg-preview-card" style={{ height: '700px' }}>
      <IndustrialRollVisualizer
        widthMm={widthMm}
        lengthMm={lengthMm}
        placements={placements}
        baseColor={baseColor}
        onPlacementClick={onPlacementClick}
      />
    </div>
  );
};
