import React from 'react';
import { Button } from 'primereact/button';
import type { PlacedRectangle } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface PlacementListProps {
  placements: PlacedRectangle[];
  onEdit: (placement: PlacedRectangle) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  isCommandePlacement: (placement: PlacedRectangle) => boolean;
}

export const PlacementList: React.FC<PlacementListProps> = ({
  placements,
  onEdit,
  onDelete,
  onClear,
  isCommandePlacement,
}) => {
  const { t } = useI18n();

  return (
    <div className="placements-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('rollDetail.existingPlacements') || 'Recorded Placements'}</h3>
        {placements.length > 0 && (
          <Button
            label={t('rollDetail.clearChute') || 'Clear all'}
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            onClick={onClear}
            disabled={placements.some(isCommandePlacement)}
          />
        )}
      </div>

      {placements.length === 0 ? (
        <div className="form-card" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc' }}>
          <i className="pi pi-map" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
          <p style={{ color: '#64748b', margin: 0 }}>{t('rollDetail.noPlacements') || 'No placements recorded.'}</p>
        </div>
      ) : (
        <div>
          {placements.map((placement) => (
            <div key={placement.id} className="placement-item-card">
              <div className="placement-info">
                <div className="placement-dims">
                  {placement.widthMm} x {placement.heightMm} <span className="metric-tile__unit">mm</span>
                </div>
                <div className="placement-coords">
                  Pos: ({placement.xMm}, {placement.yMm})
                  {placement.colorHexCode && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="placement-color-badge" style={{ backgroundColor: placement.colorHexCode }}></span>
                      {placement.colorName || placement.colorHexCode}
                    </>
                  )}
                </div>
                {placement.commandeItem?.reference && (
                  <div style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.85rem' }}>
                    Ref: {placement.commandeItem.reference}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  onClick={() => onEdit(placement)}
                  disabled={isCommandePlacement(placement)}
                  tooltip="Edit"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  onClick={() => onDelete(placement.id)}
                  disabled={isCommandePlacement(placement)}
                  tooltip="Delete"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
