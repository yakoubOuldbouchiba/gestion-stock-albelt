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
      <div className="placements-section__header">
        <h3 className="placements-section__title">{t('rollDetail.existingPlacements') || 'Recorded Placements'}</h3>
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
        <div className="placement-empty" role="status">
          <i className="pi pi-map placement-empty__icon" aria-hidden="true"></i>
          <p className="placement-empty__text">{t('rollDetail.noPlacements') || 'No placements recorded.'}</p>
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
                      <span aria-hidden="true"> • </span>
                      <span
                        className="placement-color-badge"
                        aria-hidden="true"
                        style={{ backgroundColor: placement.colorHexCode }}
                      ></span>
                      {placement.colorName || placement.colorHexCode}
                    </>
                  )}
                </div>
                {placement.commandeItem?.reference && (
                  <div className="placement-ref">
                    Ref: {placement.commandeItem.reference}
                  </div>
                )}
              </div>
              <div className="placement-actions">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  onClick={() => onEdit(placement)}
                  disabled={isCommandePlacement(placement)}
                  aria-label={`${t('common.edit') || 'Edit'} ${placement.widthMm}×${placement.heightMm}mm`}
                  tooltip={t('common.edit') || 'Edit'}
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  onClick={() => onDelete(placement.id)}
                  disabled={isCommandePlacement(placement)}
                  aria-label={`${t('common.delete') || 'Delete'} ${placement.widthMm}×${placement.heightMm}mm`}
                  tooltip={t('common.delete') || 'Delete'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
