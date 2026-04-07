import type { ReactNode } from 'react';
import { Button } from 'primereact/button';
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
  wasteMaterialBody: (piece: WastePiece) => JSX.Element;
  wastePage: number;
  wasteTotalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onOpenCreateChute: () => void;
  filters: ReactNode;
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
  wasteMaterialBody,
  wastePage,
  wasteTotalElements,
  pageSize,
  onPageChange,
  onOpenCreateChute,
  filters,
  formatDate,
}: WasteTabProps) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <Button
          label={t('inventory.createChute') || 'Create Chute'}
          icon="pi pi-plus"
          onClick={onOpenCreateChute}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            inputId="groupedWaste"
            checked={showGrouped}
            onChange={(e) => onToggleGrouped(!!e.checked)}
          />
          <label htmlFor="groupedWaste">{t('inventory.showGroupedStats') || 'Show Grouped Statistics'}</label>
        </div>
      </div>

      {filters}

      {showGrouped ? (
        renderGroupedStatsTable(groupedStats, groupedLoading)
      ) : (
        <DataTable
          value={pieces}
          dataKey="id"
          size="small"
          emptyMessage={t('inventory.noWasteChuteFound')}
        >
          <Column header={t('inventory.material')} body={wasteMaterialBody} />
          <Column header={t('inventory.area')} body={(piece: WastePiece) => piece.areaM2.toFixed(2)} />
          <Column header={t('inventory.received')} body={(piece: WastePiece) => formatDate(piece.createdAt)} />
        </DataTable>
      )}

      <Paginator
        first={wastePage * pageSize}
        rows={pageSize}
        totalRecords={wasteTotalElements}
        onPageChange={(e) => onPageChange(e.page ?? 0)}
      />
    </div>
  );
}
