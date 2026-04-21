import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import type { WastePiece } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type WasteTabProps = {
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

export function WasteTab({
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
}: WasteTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            inputId="groupedWaste"
            checked={showGrouped}
            onChange={(e) => onToggleGrouped(!!e.checked)}
          />
          <label htmlFor="groupedWaste" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
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
          emptyMessage={t('inventory.noWasteChuteFound')}
          stickyHeader
          removableSort
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column header={t('inventory.material')} body={wasteMaterialBody} sortable field="materialType" />
          <Column 
            header={t('inventory.area')} 
            body={(piece: WastePiece) => <span>{piece.areaM2.toFixed(2)} m²</span>} 
            sortable
            field="areaM2"
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
