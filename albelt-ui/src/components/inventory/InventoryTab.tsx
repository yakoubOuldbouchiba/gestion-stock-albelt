
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import type { Roll } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type InventoryTabProps = {
  t: Translate;
  showGrouped: boolean;
  onToggleGrouped: (value: boolean) => void;
  groupedStats: any[];
  groupedLoading: boolean;
  renderGroupedStatsTable: (rows: any[], loading: boolean) => JSX.Element;
  rolls: Roll[];
  selection: Roll[];
  onSelectionChange: (e: any) => void;
  rollTotalElements: number;
  rollPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  rollMaterialBody: (roll: Roll) => JSX.Element;
  rollStatusBody: (roll: Roll) => JSX.Element;
  rollActionsBody: (roll: Roll) => JSX.Element;
  formatDate: (value: string) => string;
};

export function InventoryTab({
  t,
  showGrouped,
  onToggleGrouped,
  groupedStats,
  groupedLoading,
  renderGroupedStatsTable,
  rolls,
  selection,
  onSelectionChange,
  rollTotalElements,
  rollPage,
  pageSize,
  onPageChange,
  rollMaterialBody,
  rollStatusBody,
  rollActionsBody,
  formatDate,
}: InventoryTabProps) {

  const stockProgressBody = (roll: Roll) => {
    const used = roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0;
    const available = roll.availableAreaM2 ?? (roll.areaM2 || 0) - used;
    const percent = roll.areaM2 ? (available / roll.areaM2) * 100 : 0;

    let color = 'var(--color-accent)';
    if (percent > 50) color = 'var(--color-accent-cool)';
    else if (percent > 20) color = '#f59e0b';

    return (
      <div className="progress-cell">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          <span>{percent.toFixed(0)}%</span>
          <span style={{ color: 'var(--color-muted)' }}>{available.toFixed(1)} m²</span>
        </div>
        <div className="stock-progress">
          <div className="stock-progress-fill" style={{ width: `${percent}%`, backgroundColor: color } as any}></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            inputId="groupedInventory"
            checked={showGrouped}
            onChange={(e) => onToggleGrouped(!!e.checked)}
          />
          <label htmlFor="groupedInventory" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {t('inventory.showGroupedStats') || 'Show Grouped Statistics'}
          </label>
        </div>
        {selection.length > 0 && (
          <div className="bulk-actions-hint">
            <strong>{selection.length}</strong> {t('inventory.itemsSelected') || 'Items Selected'}
          </div>
        )}
      </div>

      {showGrouped ? (
        renderGroupedStatsTable(groupedStats, groupedLoading)
      ) : (
        <DataTable
          value={rolls}
          selection={selection}
          onSelectionChange={onSelectionChange}
          dataKey="id"
          selectionMode="multiple"
          size="small"
          className="industrial-table"
          emptyMessage={t('inventory.noRollsFound')}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column header={t('waste.tableMaterial')} body={rollMaterialBody} sortable field="materialType" />
          <Column
            header={t('inventory.stockStatus') || 'Stock Level'}
            body={stockProgressBody}
            sortable
            field="availableAreaM2"
          />
          <Column header={t('waste.tableStatus')} body={rollStatusBody} sortable field="status" />
          <Column
            header={t('waste.tableCreated')}
            body={(roll: Roll) => <span style={{ fontSize: '0.85rem' }}>{formatDate(roll.receivedDate)}</span>}
            sortable
            field="receivedDate"
            className="hide-on-md"
            headerClassName="hide-on-md"
          />
          <Column header={t('waste.tableActions')} body={rollActionsBody} style={{ width: '80px' }} />
        </DataTable>
      )}

      <Paginator
        first={rollPage * pageSize}
        rows={pageSize}
        totalRecords={rollTotalElements}
        onPageChange={(e) => onPageChange(e.page ?? 0)}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first} to {last} of {totalRecords}"
      />
    </div>
  );
}
