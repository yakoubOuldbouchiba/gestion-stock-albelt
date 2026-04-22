import { Tag } from 'primereact/tag';
import { PageHeader } from '../PageHeader';

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
  pendingLines,
  supplierCount,
  selectedLinesCount,
  totalBons,
}: PurchaseWorkbenchHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      tags={<span className="purchase-workbench__eyebrow">ERP Purchasing Workbench</span>}
      actions={
        <div className="purchase-workbench__hero-badges" style={{ display: 'flex', gap: '0.5rem' }}>
          <Tag value={`Draft: ${draftCount}`} severity="warning" />
          <Tag value={`Validated: ${validatedCount}`} severity="success" />
        </div>
      }
    >
      <section className="purchase-workbench__summary-grid">
        <article className="purchase-workbench__summary-card">
          <span className="purchase-workbench__summary-label">Purchase Bons</span>
          <strong className="purchase-workbench__summary-value">{totalBons}</strong>
          <small>Centralized supplier receipts</small>
        </article>

        <article className="purchase-workbench__summary-card purchase-workbench__summary-card--accent">
          <span className="purchase-workbench__summary-label">Selected Lines</span>
          <strong className="purchase-workbench__summary-value">{selectedLinesCount}</strong>
          <small>Prepared before creating the bon</small>
        </article>

        <article className="purchase-workbench__summary-card purchase-workbench__summary-card--cool">
          <span className="purchase-workbench__summary-label">Draft Line Items</span>
          <strong className="purchase-workbench__summary-value">{pendingLines}</strong>
          <small>Ready for validation workflow</small>
        </article>

        <article className="purchase-workbench__summary-card purchase-workbench__summary-card--ink">
          <span className="purchase-workbench__summary-label">Suppliers</span>
          <strong className="purchase-workbench__summary-value">{supplierCount}</strong>
          <small>Available partners for sourcing</small>
        </article>
      </section>
    </PageHeader>
  );
}
