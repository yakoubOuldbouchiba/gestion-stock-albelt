import React from 'react';
import { Dialog } from 'primereact/dialog';
import type { PlacedRectangle, OptimizationPlacementReport } from '../../types';
import { useI18n } from '@hooks/useI18n';
import './PlacementDetailsDialog.css';

type NormalizedPlacement = (PlacedRectangle | OptimizationPlacementReport) & {
  xMm: number;
  yMm: number;
  referenceLabel?: string | null;
  metadataLabel?: string | null;
};

interface PlacementDetailsDialogProps {
  visible: boolean;
  placement: NormalizedPlacement | null;
  onHide: () => void;
  placementPercentage?: number;
}

/**
 * PlacementDetailsDialog
 * Displays detailed information about a placement with command reference or historical entry.
 * Replaces tooltip-based interactions with a proper dialog component.
 */
export const PlacementDetailsDialog: React.FC<PlacementDetailsDialogProps> = ({
  visible,
  placement,
  onHide,
  placementPercentage,
}) => {
  const { t } = useI18n();

  if (!placement) return null;

  // Determine dialog content based on command reference
  // PlacedRectangle has referenceCommande, OptimizationPlacementReport has commandeReference
  const commandeReference = (placement as any).referenceCommande || (placement as any).commandeReference || placement.referenceLabel;
  const displayReference = commandeReference || t('inventory.saisiHistorique') || 'saisie historique';
  
  // Badge type based on whether it's a command or historical entry
  const badgeType = commandeReference ? 'command' : 'historical';

  return (
    <Dialog
      header={t('commandes.placement') || 'Placement Details'}
      visible={visible}
      onHide={onHide}
      modal
      style={{ width: 'min(500px, 95vw)' }}
      className="placement-details-dialog"
    >
      <div className="placement-details-content">
        {/* Placement Percentage with Double Dashed Border */}
        {placementPercentage !== undefined && placementPercentage > 0 && (
          <div className="placement-percentage-section">
            <div className="placement-percentage-display">
              <span className="percentage-value">{placementPercentage.toFixed(1)}%</span>
              <span className="percentage-label">{t('inventory.placementCoverage') || 'Coverage'}</span>
            </div>
          </div>
        )}

        {/* Command Reference or Historical Entry */}
        <div className="placement-reference-section">
          <label className="section-label">{t('commandes.reference') || 'Reference'}</label>
          <div className="reference-value">
            <span className="reference-text">{displayReference}</span>
            <span className={`reference-badge ${badgeType}`}>
              {badgeType === 'command'
                ? (t('commandes.command') || 'Command')
                : (t('inventory.historical') || 'Historical')}
            </span>
          </div>
        </div>

        {/* Placement Dimensions */}
        <div className="placement-dimensions-section">
          <label className="section-label">{t('commandes.dimensions') || 'Dimensions'}</label>
          <div className="dimension-row">
            <div className="dimension-item">
              <span className="dimension-label">Width</span>
              <span className="dimension-value">{placement.widthMm} mm</span>
            </div>
            <div className="dimension-item">
              <span className="dimension-label">Height</span>
              <span className="dimension-value">{placement.heightMm} mm</span>
            </div>
          </div>
        </div>

        {/* Placement Position */}
        <div className="placement-position-section">
          <label className="section-label">{t('commandes.position') || 'Position'}</label>
          <div className="position-row">
            <div className="position-item">
              <span className="position-label">X</span>
              <span className="position-value">{Number(placement.xMm / 1000).toFixed(3)} m</span>
            </div>
            <div className="position-item">
              <span className="position-label">Y</span>
              <span className="position-value">{Number(placement.yMm / 1000).toFixed(3)} m</span>
            </div>
          </div>
        </div>

        {/* Placement ID */}
        {(placement as any).id && (
          <div className="placement-id-section">
            <label className="section-label">ID</label>
            <div className="id-value">{String((placement as any).id).slice(0, 24)}</div>
          </div>
        )}

        {/* Metadata Label */}
        {placement.metadataLabel && (
          <div className="placement-metadata-section">
            <label className="section-label">{t('common.details') || 'Details'}</label>
            <div className="metadata-value">{placement.metadataLabel}</div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
