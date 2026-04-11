import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { formatDate } from '../../utils/date';
import { getRollChuteSummary } from '@utils/rollChuteLabel';
import type { PlacedRectangle, ProductionItem } from '../../types';
import type { Translate } from './commandeTypes';

type ProductionSectionProps = {
  productionForItem: ProductionItem[];
  placementsForItem: PlacedRectangle[];
  t: Translate;
};

export const ProductionSection = ({
  productionForItem,
  placementsForItem,
  t,
}: ProductionSectionProps) => (
  <div style={{ marginTop: '0.75rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('commandes.productionItems')}</div>
    {productionForItem.length === 0 ? (
      <Message severity="info" text={t('commandes.noProductionItems')} />
    ) : (
      <div className="albel-compact-list">
        {productionForItem.map((production) => {
          const placement = production.placedRectangle
            ?? placementsForItem.find((item) => item.id === production.placedRectangleId);
          const source = placement?.roll ?? placement?.wastePiece ?? null;
          const isRollSource = Boolean(placement?.rollId ?? placement?.roll?.id);
          const sourceSummary = source ? getRollChuteSummary(source) : null;
          const sourceLabel = sourceSummary ? `Ref: ${sourceSummary.reference}` : 'Placement';
          return (
            <div key={production.id} className="albel-compact-item">
              {production.goodProduction}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <Tag value={sourceLabel} severity={isRollSource ? 'info' : 'success'} />
                {sourceSummary && (
                  <span>
                    Plis: {sourceSummary.nbPlis} | Thk: {sourceSummary.thickness} | Color: {sourceSummary.color}
                  </span>
                )}
                {placement && (
                  <span>
                    x:{placement.xMm} y:{placement.yMm} {placement.widthMm}x{placement.heightMm}mm
                  </span>
                )}
                {typeof production.goodProduction === 'boolean' && (
                  <Tag
                    value={production.goodProduction ? t('commandes.productionGood') : t('commandes.productionBad')}
                    severity={production.goodProduction ? 'success' : 'danger'}
                  />
                )}
                <span>
                  {production.pieceLengthM}m x {production.pieceWidthMm}mm x {production.quantity}
                  {' '}({production.totalAreaM2?.toFixed(2)}m2)
                </span>
                <span>{formatDate(production.createdAt)}</span>
              </div>
              {production.productionMiss && (
                <div style={{ marginTop: '0.35rem', color: 'var(--text-color-secondary)', fontSize: '0.85rem' }}>
                  {t('commandes.productionMissLabel')}: {production.productionMiss}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);
