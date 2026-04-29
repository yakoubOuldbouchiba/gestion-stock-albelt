import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import type { WastePiece } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type ReusableTabProps = {
  t: Translate;
  showGrouped: boolean;
  onToggleGrouped: (value: boolean) => void;
  groupedStats: any[];
  groupedLoading: boolean;
  renderGroupedStatsTable: (rows: any[], loading: boolean) => JSX.Element;
  pieces: WastePiece[];
  selection: WastePiece[];
  onSelectionChange: (e: any) => void;
  wasteMaterialBody: (piece: WastePiece) => JSX.Element;
  wasteStatusBody: (piece: WastePiece) => JSX.Element;
  wasteActionsBody: (piece: WastePiece) => JSX.Element | null;
  wastePage: number;
  wasteTotalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  formatDate: (value: string) => string;
};

export function ReusableTab({
  t,
  showGrouped,
  onToggleGrouped,
  groupedStats,
  groupedLoading,
  renderGroupedStatsTable,
  pieces,
  selection,
  onSelectionChange,
  wasteMaterialBody,
  wasteStatusBody,
  wasteActionsBody,
  wastePage,
  wasteTotalElements,
  pageSize,
  onPageChange,
  formatDate,
}: ReusableTabProps) {

  const stockProgressBody = (piece: WastePiece) => {
    const used = piece.usedAreaM2 ?? piece.totalWasteAreaM2 ?? 0;
    const available = piece.availableAreaM2 ?? (piece.areaM2 || 0) - used;
    const percent = piece.areaM2 ? (available / piece.areaM2) * 100 : 0;
    
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
            inputId="groupedReusable"
            checked={showGrouped}
            onChange={(e) => onToggleGrouped(!!e.checked)}
          />
          <label htmlFor="groupedReusable" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
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
          value={pieces}
          selection={selection}
          onSelectionChange={onSelectionChange}
          dataKey="id"
          selectionMode="multiple"
          size="small"
          className="industrial-table"
          emptyMessage={t('inventory.noReusableChuteFound')}
          removableSort
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column header={t('inventory.lotId') || 'Lot ID'} field="lotId" sortable style={{ width: '100px' }} />
          <Column header={t('inventory.material')} body={wasteMaterialBody} sortable field="materialType" />
          <Column 
            header={t('inventory.stockStatus') || 'Stock Level'} 
            body={stockProgressBody} 
            sortable
            field="availableAreaM2"
          />
          <Column header={t('inventory.status')} body={wasteStatusBody} sortable field="status" />
          <Column 
            header={t('inventory.received')} 
            body={(piece: WastePiece) => <span style={{ fontSize: '0.85rem' }}>{formatDate(piece.createdAt)}</span>} 
            sortable 
            field="createdAt" 
            className="hide-on-md"
            headerClassName="hide-on-md"
          />
          <Column header={t('waste.tableActions')} body={wasteActionsBody} style={{ width: '80px' }} />
        </DataTable>
      )}

      <Paginator
        first={wastePage * pageSize}
        rows={pageSize}
        totalRecords={wasteTotalElements}
        onPageChange={(e) => onPageChange(e.page ?? 0)}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="{first} to {last} of {totalRecords}"
      />
    </div>
  );
}
