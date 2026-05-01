import { Tag } from 'primereact/tag';
import type { TFunction } from 'i18next';
import { formatDate } from '../../utils/date';
import type { Commande } from '../../types';
import type { WorkbenchOrderMetrics } from './CommandesWorkbench.types';
import { getStatusSeverity } from './commandesWorkbench.utils';
import { getArticleDisplayLabel } from '../../utils/article';
import { Button } from 'primereact/button';

interface CommandesWorkbenchOrderCardProps {
  t: TFunction;
  order: Commande;
  metrics: WorkbenchOrderMetrics;
  isSelected: boolean;
  //onSelect: () => void;
  onOpenOrder: (orderId: string) => void;
}

export function CommandesWorkbenchOrderCard({
  t,
  order,
  metrics,
  isSelected,
  //onSelect,
  onOpenOrder
}: CommandesWorkbenchOrderCardProps) {
  return (
    <div
      className={`orders-workbench__order-card ${isSelected ? 'is-selected' : ''}`}
    // onClick={onSelect}
    >
      <div className="orders-workbench__card-topline">
        <strong>{order.numeroCommande}</strong>
        <Tag
          value={t(`statuses.${order.status}`, order.status)}
          severity={getStatusSeverity(order.status)}
        />
      </div>

      <div className="orders-workbench__card-subline">
        <span>{order.clientName}</span>
        <span>{formatDate(order.createdAt)}</span>
      </div>

      <div className="orders-workbench__mini-metrics">
        <span>
          <strong>{metrics.counts.pending}</strong>
          {t('ordersWorkbench.itemsWaiting', 'Waiting')}
        </span>
        <span>
          <strong>{metrics.counts.inProgress}</strong>
          {t('ordersWorkbench.cuttingNow', 'Cutting')}
        </span>
        <span>
          <strong>{metrics.counts.completed}</strong>
          {t('ordersWorkbench.itemsDone', 'Done')}
        </span>
        <span>
          <strong>{metrics.counts.quantity}</strong>
          {t('commandes.totalQuantity', 'Total quantity')}
        </span>
      </div>

      <div className="orders-workbench__item-specs">
        {metrics.primaryMaterial ? <span>{metrics.primaryMaterial}</span> : null}
        {order.altierLibelle ? <span>{order.altierLibelle}</span> : null}
        {metrics.nextItem ? <span>{getArticleDisplayLabel(metrics.nextItem)}</span> : null}
      </div>

      <div className="orders-workbench__progress-track">
        <div className="orders-workbench__progress-fill" style={{ width: `${metrics.progress}%` }} />
      </div>

      <div className="orders-workbench__footer-actions">
        <div className="orders-workbench__next-step">
          <Button
            label={t('ordersWorkbench.openFullOrder', 'Open full order')}
            icon="pi pi-external-link"
            severity="secondary"
            outlined
            onClick={() => onOpenOrder(order.id)}
          />
          {/* <span className="orders-workbench__detail-label">
            {t('ordersWorkbench.nextStep', 'Next step')}
          </span> */}
          {/* <strong>
            {metrics.nextItem
              ? `${t('ordersWorkbench.line', 'Line')} ${metrics.nextItem.lineNumber}`
              : t('ordersWorkbench.noItems', 'No items')}
          </strong> */}
        </div>
        <span className="orders-workbench__progress-text">{metrics.progress}%</span>
      </div>
    </div>
  );
}
