import { Tag } from 'primereact/tag';
import { PageHeader } from '../PageHeader';

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
  rollTotal,
  loadedRolls,
  wasteTotal,
  loadedWaste,
  selectedItemsCount,
  selectedRollsCount,
  selectedWasteCount,
  bonsCount,
  totalMovementCount,
}: TransferWorkbenchHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={description}
      tags={<span className="transfer-workbench__eyebrow">ERP Manufacturing Transfer</span>}
      actions={
        <div className="transfer-workbench__hero-badges" style={{ display: 'flex', gap: '0.5rem' }}>
          <Tag value={`Pending: ${pendingCount}`} severity="warning" />
          <Tag value={`Delivered: ${deliveredCount}`} severity="success" />
        </div>
      }
    >
      <section className="transfer-workbench__summary-grid">
        <article className="transfer-workbench__summary-card">
          <span className="transfer-workbench__summary-label">Rolls</span>
          <strong className="transfer-workbench__summary-value">{rollTotal}</strong>
          <small>{loadedRolls} loaded lazily</small>
        </article>

        <article className="transfer-workbench__summary-card transfer-workbench__summary-card--accent">
          <span className="transfer-workbench__summary-label">Chutes</span>
          <strong className="transfer-workbench__summary-value">{wasteTotal}</strong>
          <small>{loadedWaste} loaded lazily</small>
        </article>

        <article className="transfer-workbench__summary-card transfer-workbench__summary-card--cool">
          <span className="transfer-workbench__summary-label">Selected</span>
          <strong className="transfer-workbench__summary-value">{selectedItemsCount}</strong>
          <small>{selectedRollsCount} rolls and {selectedWasteCount} chutes</small>
        </article>

        <article className="transfer-workbench__summary-card transfer-workbench__summary-card--ink">
          <span className="transfer-workbench__summary-label">Transfer Bons</span>
          <strong className="transfer-workbench__summary-value">{bonsCount}</strong>
          <small>{totalMovementCount} total transferred items</small>
        </article>
      </section>
    </PageHeader>
  );
}
