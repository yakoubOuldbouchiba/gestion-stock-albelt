import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { formatDate } from '../../utils/date';
import { getRollChuteSummary } from '@utils/rollChuteLabel';
import type { PlacedRectangle, ProductionItem } from '../../types';
import type { Translate } from './commandeTypes';

type ProductionSectionProps = {
  productionForItem: ProductionItem[];
  placementsForItem: PlacedRectangle[];
  t: Translate;
  isBusy?: boolean;
  onDeleteProduction?: (productionId: string) => void;
};

export const ProductionSection = ({
  productionForItem,
  placementsForItem,
  t,
  isBusy,
  onDeleteProduction,
}: ProductionSectionProps) => (
  <div className="operator-section">
    <div className="operator-section__header">
      <h3>{t('commandes.productionItems')}</h3>
    </div>

    {productionForItem.length === 0 ? (
      <div className="operator-empty-state">
        <i className="pi pi-box" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}></i>
        <p>{t('commandes.noProductionItems')}</p>
      </div>
    ) : (
      <div className="operator-grid">
        {productionForItem.map((production) => {
          const placement = production.placedRectangle
            ?? placementsForItem.find((item) => item.id === production.placedRectangleId);
          const source = placement?.roll ?? placement?.wastePiece ?? null;
          const isRollSource = Boolean(placement?.rollId ?? placement?.roll?.id);
          const sourceSummary = source ? getRollChuteSummary(source) : null;
          const sourceLabel = sourceSummary ? sourceSummary.reference : 'Placement';
          
          return (
            <div key={production.id} className="operator-card operator-card--production operator-card--large">
              <div className="operator-card__content">
                <div className="operator-card__top">
                  <div className="operator-card__title">
                    <Tag 
                      value={isRollSource ? 'ROLL' : 'WASTE'} 
                      severity={isRollSource ? 'info' : 'success'}
                    />
                    <span className="operator-card__source-ref">{sourceLabel}</span>
                  </div>
                  {typeof production.goodProduction === 'boolean' && (
                    <Tag
                      icon={production.goodProduction ? 'pi pi-check' : 'pi pi-times'}
                      value={production.goodProduction ? t('commandes.productionGood') : t('commandes.productionBad')}
                      severity={production.goodProduction ? 'success' : 'danger'}
                      className="operator-status-pill"
                    />
                  )}
                </div>

                <div className="operator-metrics-hero">
                  <div className="operator-hero-metric">
                    <span className="operator-hero-metric__label">{t('rollDetail.lengthM') || 'Length'}</span>
                    <span className="operator-hero-metric__value">{production.pieceLengthM}m</span>
                  </div>
                  <div className="operator-hero-metric">
                    <span className="operator-hero-metric__label">{t('rollDetail.widthMm') || 'Width'}</span>
                    <span className="operator-hero-metric__value">{production.pieceWidthMm}mm</span>
                  </div>
                  <div className="operator-hero-metric operator-hero-metric--qty">
                    <span className="operator-hero-metric__label">{t('commandes.quantity') || 'Qty'}</span>
                    <span className="operator-hero-metric__value">x{production.quantity}</span>
                  </div>
                </div>

                <div className="operator-card__footer-meta">
                  <span className="operator-meta-tag">{production.totalAreaM2?.toFixed(2)} m²</span>
                  <span className="operator-meta-tag">{formatDate(production.createdAt)}</span>
                </div>

                {production.productionMiss && (
                  <div className="operator-production-miss">
                    <i className="pi pi-info-circle" style={{ marginRight: '0.5rem' }}></i>
                    <strong>{t('commandes.productionMissLabel')}:</strong> {production.productionMiss}
                  </div>
                )}
              </div>

              {onDeleteProduction && (
                <div className="operator-card__actions">
                  <span className="operator-id-tag">ID: {production.id.slice(0, 8)}</span>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    onClick={() => onDeleteProduction(production.id)}
                    disabled={isBusy}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

