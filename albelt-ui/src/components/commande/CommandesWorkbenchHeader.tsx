import { Button } from 'primereact/button';
import type { TFunction } from 'i18next';
import type { WorkbenchSummaryMetric } from './CommandesWorkbench.types';

interface CommandesWorkbenchHeaderProps {
  t: TFunction;
  summaryMetrics: WorkbenchSummaryMetric[];
  onCreateOrder: () => void;
}

export function CommandesWorkbenchHeader({
  t,
  summaryMetrics,
  onCreateOrder,
}: CommandesWorkbenchHeaderProps) {
  return (
    <>
      <div className="orders-workbench__hero">
        <div className="orders-workbench__hero-copy">
          <span className="orders-workbench__eyebrow">
            {t('ordersWorkbench.operatorWorkbench', 'Operator workbench')}
          </span>
          <h1>{t('ordersWorkbench.manageOrders', 'Manage your orders')}</h1>
          <p>
            {t(
              'ordersWorkbench.description',
              'Choose the next order, see what is blocked, and move directly into production without hunting through tabs.'
            )}
          </p>
        </div>
        <div className="orders-workbench__hero-actions">
          <Button
            icon="pi pi-plus"
            label={t('ordersWorkbench.newOrder', 'New order')}
            severity="success"
            onClick={onCreateOrder}
          />
        </div>
      </div>

      <div className="orders-workbench__summary-grid">
        {summaryMetrics.map((metric) => (
          <div key={metric.key} className={`orders-workbench__summary-card ${metric.accentClass}`}>
            <span className="orders-workbench__summary-label">{metric.label}</span>
            <strong className="orders-workbench__summary-value">{metric.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
