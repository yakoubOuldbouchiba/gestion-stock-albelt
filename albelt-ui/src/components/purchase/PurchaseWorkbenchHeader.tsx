import { Tag } from 'primereact/tag';
import { PageHeader } from '../PageHeader';
import { t } from 'i18next';

type PurchaseWorkbenchHeaderProps = {
  title: string;
  subtitle: string;
  draftCount: number;
  validatedCount: number;
  pendingLines: number;
  supplierCount: number;
  selectedLinesCount: number;
  totalBons: number;
};

export function PurchaseWorkbenchHeader({
  title,
  subtitle,
  draftCount,
  validatedCount,
  totalBons,
}: PurchaseWorkbenchHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={
        <div className="purchase-workbench__hero-badges" style={{ display: 'flex', gap: '0.5rem' }}>
          <Tag value={`Draft: ${draftCount}`} severity="warning" />
          <Tag value={`Validated: ${validatedCount}`} severity="success" />
        </div>
      }
    >
      <section className="purchase-workbench__summary-grid">
        <article className="purchase-workbench__summary-card">
          <span className="purchase-workbench__summary-label"> {t('purchaseBons.purchaseBons')}</span>
          <strong className="purchase-workbench__summary-value">{totalBons}</strong>
        </article>
      </section>
    </PageHeader>
  );
}
