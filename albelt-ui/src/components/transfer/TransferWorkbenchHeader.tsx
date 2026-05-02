import { Tag } from 'primereact/tag';
import { PageHeader } from '../PageHeader';
import { t } from 'i18next';

type TransferWorkbenchHeaderProps = {
  title: string;
  description: string;
  pendingCount: number;
  deliveredCount: number;
  rollTotal: number;
  loadedRolls: number;
  wasteTotal: number;
  loadedWaste: number;
  selectedItemsCount: number;
  selectedRollsCount: number;
  selectedWasteCount: number;
  bonsCount: number;
  totalMovementCount: number;
};

export function TransferWorkbenchHeader({
  title,
  description,
  pendingCount,
  deliveredCount,
  bonsCount,
}: TransferWorkbenchHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={description}
      actions={
        <div className="transfer-workbench__hero-badges" style={{ display: 'flex', gap: '0.5rem' }}>
          <Tag value={`${t('statuses.PENDING')}: ${pendingCount}`} severity="warning" />
          <Tag value={`${t('statuses.DELIVERED')}: ${deliveredCount}`} severity="success" />
        </div>
      }
    >
      <section className="transfer-workbench__summary-grid">
        <article className="transfer-workbench__summary-card transfer-workbench__summary-card--ink">
          <strong className="transfer-workbench__summary-value">{bonsCount}</strong>
          <small>{t('transferWorkbench.totalTransferredItems')}</small>
        </article>
      </section>
    </PageHeader>
  );
}
