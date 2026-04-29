import React from 'react';
import { IndustrialRollVisualizer } from './IndustrialRollVisualizer';
import type { PlacedRectangle } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface TiledPrintViewProps {
  widthMm: number;
  lengthMm: number;
  placements: PlacedRectangle[];
  segmentLengthMm?: number; // Default 3000mm (3 meters)
  baseColor?: string;
}

/**
 * TiledPrintView
 * Renders multiple SVG segments intended for printing.
 * Each segment corresponds to a physical page.
 */
export const TiledPrintView: React.FC<TiledPrintViewProps> = ({
  widthMm,
  lengthMm,
  placements,
  segmentLengthMm = 3000,
  baseColor = '#ffffff'
}) => {
  const { t } = useI18n();
  const totalSegments = Math.ceil(lengthMm / segmentLengthMm);
  
  const segments = Array.from({ length: totalSegments }, (_, i) => ({
    start: i * segmentLengthMm,
    end: Math.min((i + 1) * segmentLengthMm, lengthMm)
  }));

  return (
    <div className="tiled-print-container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .tiled-print-container, .tiled-print-container * { visibility: visible; }
          .tiled-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-segment-page {
            page-break-after: always;
            height: 280mm; /* Adjusted for A4 */
            margin-bottom: 20px;
          }
        }
        .print-segment-header {
          padding: 12px;
          background: #334155;
          color: white;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .print-segment-page {
          border: 2px solid #334155;
          margin-bottom: 60px;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
      `}</style>

      {segments.map((seg, idx) => (
        <div key={`seg-${idx}`} className="print-segment-page">
          <div className="print-segment-header">
            <span>{t('commandes.slice')} {idx + 1} / {totalSegments}</span>
            <span>{seg.start}mm — {seg.end}mm ({(seg.start/1000).toFixed(1)}m - {(seg.end/1000).toFixed(1)}m)</span>
          </div>
          <div style={{ height: '450px' }}>
            <IndustrialRollVisualizer
              widthMm={widthMm}
              lengthMm={lengthMm}
              placements={placements}
              baseColor={baseColor}
              printSegment={{ startMm: seg.start, endMm: seg.end }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
