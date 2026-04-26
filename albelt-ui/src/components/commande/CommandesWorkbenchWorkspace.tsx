import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import type { TFunction } from 'i18next';
import type { Commande } from '../../types';
import { getItemCounts, getStatusSeverity } from './commandesWorkbench.utils';
import { getArticleDisplayLabel, getArticleMaterialType, getArticleNbPlis } from '../../utils/article';

interface CommandesWorkbenchWorkspaceProps {
  t: TFunction;
  highlightedOrder?: Commande;
  onOpenOrder: (orderId: string) => void;
}

export function CommandesWorkbenchWorkspace({
  t,
  highlightedOrder,
  onOpenOrder,
}: CommandesWorkbenchWorkspaceProps) {
  if (!highlightedOrder) {
    return <Message severity="info" text={t('ordersWorkbench.noOrdersMatchFilters')} />;
  }

  const counts = getItemCounts(highlightedOrder.items);

  return (
    <>
      <div className="orders-workbench__selected-order">
        <div className="orders-workbench__workspace-heading">
          <div>
            <strong>{highlightedOrder.numeroCommande}</strong>
            <p>{highlightedOrder.clientName}</p>
          </div>
          <Tag
            value={t(`statuses.${highlightedOrder.status}`, highlightedOrder.status)}
            severity={getStatusSeverity(highlightedOrder.status)}
          />
        </div>

        <div className="orders-workbench__detail-grid">
          <div>
            <span className="orders-workbench__detail-label">{t('commandes.itemCount', 'Items')}</span>
            <strong>{highlightedOrder.items.length}</strong>
          </div>
          <div>
            <span className="orders-workbench__detail-label">{t('ordersWorkbench.itemsWaiting', 'Waiting')}</span>
            <strong>{counts.pending}</strong>
          </div>
          <div>
            <span className="orders-workbench__detail-label">{t('ordersWorkbench.cuttingNow', 'Cutting')}</span>
            <strong>{counts.inProgress}</strong>
          </div>
          <div>
            <span className="orders-workbench__detail-label">{t('ordersWorkbench.itemsDone', 'Done')}</span>
            <strong>{counts.completed}</strong>
          </div>
        </div>

        <div className="orders-workbench__workspace-actions orders-workbench__workspace-actions--header">
          <Button
            label={t('ordersWorkbench.openFullOrder', 'Open full order')}
            icon="pi pi-external-link"
            severity="secondary"
            outlined
            onClick={() => onOpenOrder(highlightedOrder.id)}
          />
        </div>
      </div>

      <div className="orders-workbench__workspace-grid">
        {highlightedOrder.items.map((item) => {
          const isPriority = item.status === 'IN_PROGRESS' || item.status === 'PENDING';
          const remaining = Math.max((item.quantite ?? 0) - (item.actualPiecesCut ?? 0), 0);

          return (
            <div
              key={item.id}
              className={`orders-workbench__workspace-card orders-workbench__workspace-card--item ${isPriority ? 'orders-workbench__workspace-card--highlight' : ''}`}
            >
              <div className="orders-workbench__card-topline">
                <strong>
                  {t('ordersWorkbench.line', 'Line')} {item.lineNumber}
                </strong>
                <Tag
                  value={t(`statuses.${item.status}`, item.status)}
                  severity={getStatusSeverity(item.status)}
                />
              </div>

              <div className="orders-workbench__item-specs">
                <span>{getArticleMaterialType(item)}</span>
                <span>{getArticleNbPlis(item)} {t('ordersWorkbench.plies', 'plies')}</span>
                <span>{item.largeurMm} {t('ordersWorkbench.mm', 'mm')}</span>
                <span>{item.longueurM} {t('ordersWorkbench.m', 'm')}</span>
              </div>

              <div className="orders-workbench__stats-grid">
                <div className="orders-workbench__stat-chip">
                  <span>{t('ordersWorkbench.needed', 'Needed')}</span>
                  <strong>{item.quantite}</strong>
                </div>
                <div className="orders-workbench__stat-chip">
                  <span>{t('ordersWorkbench.produced', 'Produced')}</span>
                  <strong>{item.actualPiecesCut ?? 0}</strong>
                </div>
                <div className="orders-workbench__stat-chip">
                  <span>{t('ordersWorkbench.stillToCut', 'Still to cut')}</span>
                  <strong>{remaining}</strong>
                </div>
              </div>

              {(getArticleDisplayLabel(item) || item.colorName || item.observations) ? (
                <div className="orders-workbench__note">
                  {getArticleDisplayLabel(item) ? <div><strong>{t('ordersWorkbench.reference', 'Reference')}:</strong> {getArticleDisplayLabel(item)}</div> : null}
                  {item.colorName ? <div><strong>{t('common.color', 'Color')}:</strong> {item.colorName}</div> : null}
                  {item.observations ? <div>{item.observations}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
