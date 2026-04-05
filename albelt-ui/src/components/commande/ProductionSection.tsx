import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { formatDate } from '../../utils/date';
import type { PlacedRectangle, ProductionItem, Roll } from '../../types';
import type { Translate } from './commandeTypes';

type ProductionSectionProps = {
  productionForItem: ProductionItem[];
  placementsForItem: PlacedRectangle[];
  rolls: Roll[];
  wasteForItem: any[];
  t: Translate;
};

export const ProductionSection = ({
  productionForItem,
  placementsForItem,
  rolls,
  wasteForItem,
  t,
}: ProductionSectionProps) => (
  <div style={{ marginTop: '0.75rem' }}>
    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('commandes.productionItems')}</div>
    {productionForItem.length === 0 ? (
      <Message severity="info" text={t('commandes.noProductionItems')} />
    ) : (
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {productionForItem.map((production) => {
          const placement = placementsForItem.find((item) => item.id === production.placedRectangleId);
          const source = placement?.rollId
            ? rolls.find((roll) => roll.id === placement.rollId)
            : placement?.wastePieceId
            ? wasteForItem.find((waste: any) => waste.id === placement.wastePieceId)
            : null;
          const sourceLabel = source?.reference ?? source?.materialType ?? 'Placement';
          return (
            <Card key={production.id} style={{ padding: '0.5rem' }}>
              {production.goodProduction}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <Tag value={sourceLabel} severity={placement?.rollId ? 'info' : 'success'} />
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
            </Card>
          );
        })}
      </div>
    )}
  </div>
);
