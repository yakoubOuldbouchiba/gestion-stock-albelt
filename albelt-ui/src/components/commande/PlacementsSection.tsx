import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import type { CommandeItem, PlacedRectangle, ProductionItem } from '../../types';
import { useI18n } from '@hooks/useI18n';

interface PlacementsSectionProps {
  item: CommandeItem;
  placementsForItem: PlacedRectangle[];
  productionForItem: ProductionItem[];
  isBusy: boolean;
  isCommandeLocked: boolean;
  onOpenPlacementModal: (item: CommandeItem) => void;
  onOpenEditPlacementModal: (item: CommandeItem, placement: PlacedRectangle) => void;
  onOpenPlacementPreview: (placement: PlacedRectangle) => void;
  onDeletePlacement: (placementId: string, itemId: string) => void;
  onOpenProductionModal: (item: CommandeItem, placementId: string) => void;
  onDeleteProduction?: (productionId: string) => void;
  formatSourceLabel: (source: any, fallbackRef?: string) => string;
}

export function PlacementsSection({
  item,
  placementsForItem,
  productionForItem,
  isBusy,
  isCommandeLocked,
  onOpenPlacementModal,
  onOpenEditPlacementModal,
  onOpenPlacementPreview,
  onDeletePlacement,
  onOpenProductionModal,
  onDeleteProduction,
  formatSourceLabel,
}: PlacementsSectionProps) {
  const { t } = useI18n();

  const getPlacementSource = (placement: PlacedRectangle) =>
    placement.roll ?? placement.wastePiece ?? null;

  // Group placements by source
  const groupedPlacements = placementsForItem.reduce((acc, placement) => {
    const rollId = placement.rollId ?? placement.roll?.id;
    const wastePieceId = placement.wastePieceId ?? placement.wastePiece?.id;
    const sourceId = rollId ?? wastePieceId ?? 'unknown';
    const type = rollId ? 'ROLL' : wastePieceId ? 'WASTE_PIECE' : 'UNKNOWN';
    const key = `${type}:${sourceId}`;

    if (!acc[key]) {
      const source = getPlacementSource(placement);
      const reference = source?.reference ?? source?.materialType ?? sourceId.slice(0, 8);
      acc[key] = {
        type,
        source,
        label: formatSourceLabel(source, reference),
        placements: [],
      };
    }
    acc[key].placements.push(placement);
    return acc;
  }, {} as Record<string, { type: string; source: any; label: string; placements: PlacedRectangle[] }>);

  return (
    <div className="operator-section">
      <div className="operator-section__header">
        <h3>{t('rollDetail.existingPlacements')}</h3>
        <Button
          label={t('rollDetail.addPlacement')}
          icon="pi pi-plus"
          severity="primary"
          rounded
          onClick={() => onOpenPlacementModal(item)}
          disabled={isBusy || isCommandeLocked}
        />
      </div>

      {Object.entries(groupedPlacements).length === 0 ? (
        <div className="operator-empty-state">
          <i className="pi pi-map" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}></i>
          <p>{t('rollDetail.noPlacements') || 'No placements recorded for this item.'}</p>
        </div>
      ) : (
        <div className="operator-groups">
          {Object.entries(groupedPlacements).map(([key, group]) => (
            <div key={key} className="operator-group">
              <div className="operator-group__header">
                <div className="operator-group__title">
                  <Tag 
                    value={group.type === 'ROLL' ? 'ROLL' : 'WASTE'} 
                    severity={group.type === 'ROLL' ? 'info' : 'success'}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <strong>{group.label}</strong>
                </div>
                <Button
                  label="Preview Source"
                  icon="pi pi-eye"
                  text
                  size="small"
                  onClick={() => onOpenPlacementPreview(group.placements[0])}
                />
              </div>
              
              <div className="operator-grid">
                {group.placements.map((placement) => {
                  const production = productionForItem.filter(p => p.placedRectangleId === placement.id);
                  
                  return (
                    <div key={placement.id} className="operator-card">
                      <div className="operator-card__content">
                        <div className="operator-card__metrics">
                          <div className="operator-metric">
                            <span className="operator-metric__label">X</span>
                            <span className="operator-metric__value">{placement.xMm}</span>
                          </div>
                          <div className="operator-metric">
                            <span className="operator-metric__label">Y</span>
                            <span className="operator-metric__value">{placement.yMm}</span>
                          </div>
                          <Divider layout="vertical" />
                          <div className="operator-metric operator-metric--highlight">
                            <span className="operator-metric__label">W</span>
                            <span className="operator-metric__value">{placement.widthMm}</span>
                          </div>
                          <div className="operator-metric operator-metric--highlight">
                            <span className="operator-metric__label">H</span>
                            <span className="operator-metric__value">{placement.heightMm}</span>
                          </div>
                        </div>

                        <div className="operator-card__meta">
                          {placement.colorHexCode && (
                            <div className="operator-color-tag">
                              <span 
                                className="operator-color-tag__dot" 
                                style={{ backgroundColor: placement.colorHexCode }}
                              />
                              {placement.colorName || placement.colorHexCode}
                            </div>
                          )}
                          <span className="operator-id-tag">ID: {placement.id.slice(0, 6)}</span>
                        </div>

                        {production.length > 0 && (
                          <div className="operator-nested-list">
                            <div className="operator-nested-list__header">
                              {t('commandes.producedPieces')} ({production.length})
                            </div>
                            {production.map(p => (
                              <div key={p.id} className="operator-nested-item">
                                <div className="operator-nested-item__info">
                                  <Tag 
                                    severity={p.goodProduction ? 'success' : 'danger'} 
                                    style={{ width: '8px', height: '8px', borderRadius: '50%', padding: 0 }}
                                  />
                                  <span>{p.quantity} x {p.pieceLengthM}m x {p.pieceWidthMm}mm</span>
                                </div>
                                {onDeleteProduction && (
                                  <Button 
                                    icon="pi pi-times" 
                                    text 
                                    rounded 
                                    severity="danger" 
                                    className="operator-nested-item__delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteProduction(p.id);
                                    }}
                                    disabled={isBusy || isCommandeLocked}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="operator-card__actions">
                        <Button
                          label={t('commandes.addProductionItem')}
                          icon="pi pi-plus"
                          severity="success"
                          className="p-button-sm"
                          onClick={() => onOpenProductionModal(item, placement.id)}
                          disabled={isBusy || isCommandeLocked}
                        />
                        <div className="operator-card__sub-actions">
                          <Button
                            icon="pi pi-pencil"
                            text
                            rounded
                            tooltip={t('common.edit')}
                            onClick={() => onOpenEditPlacementModal(item, placement)}
                            disabled={isBusy || isCommandeLocked}
                          />
                          <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            tooltip={t('common.delete')}
                            onClick={() => onDeletePlacement(placement.id, item.id)}
                            disabled={isBusy || isCommandeLocked}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


