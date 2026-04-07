import type { ReactNode } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import type { MaterialType, Roll } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type InventoryStat = {
  material: MaterialType;
  count: number;
  area: number;
};

type InventoryTabProps = {
  t: Translate;
  stats: InventoryStat[];
  getMaterialColor: (material: MaterialType, colorHex?: string | null) => string;
  showGrouped: boolean;
  onToggleGrouped: (value: boolean) => void;
  groupedStats: any[];
  groupedLoading: boolean;
  renderGroupedStatsTable: (rows: any[], loading: boolean) => JSX.Element;
  rolls: Roll[];
  rollTotalElements: number;
  rollPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onOpenReceiveRoll: () => void;
  rollMaterialBody: (roll: Roll) => JSX.Element;
  rollWastePercentBody: (roll: Roll) => string;
  rollStatusBody: (roll: Roll) => JSX.Element;
  rollActionsBody: (roll: Roll) => JSX.Element;
  filters: ReactNode;
  formatDate: (value: string) => string;
};

export function InventoryTab({
  t,
  stats,
  getMaterialColor,
  showGrouped,
  onToggleGrouped,
  groupedStats,
  groupedLoading,
  renderGroupedStatsTable,
  rolls,
  rollTotalElements,
  rollPage,
  pageSize,
  onPageChange,
  onOpenReceiveRoll,
  rollMaterialBody,
  rollWastePercentBody,
  rollStatusBody,
  rollActionsBody,
  filters,
  formatDate,
}: InventoryTabProps) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {stats.map((stat) => (
          <div key={stat.material} style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
            <div style={{ color: getMaterialColor(stat.material) }}>{stat.material}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stat.count}</div>
            <div>{t('inventory.availableRolls')}</div>
            <div>{stat.area.toFixed(2)} m²</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <Button
          label={t('inventory.receiveNewRoll') || 'Receive Roll'}
          icon="pi pi-plus"
          onClick={onOpenReceiveRoll}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            inputId="groupedInventory"
            checked={showGrouped}
            onChange={(e) => onToggleGrouped(!!e.checked)}
          />
          <label htmlFor="groupedInventory">{t('inventory.showGroupedStats') || 'Show Grouped Statistics'}</label>
        </div>
      </div>

      {filters}

      {showGrouped ? (
        renderGroupedStatsTable(groupedStats, groupedLoading)
      ) : (
        <DataTable
          value={rolls}
          dataKey="id"
          size="small"
          emptyMessage={t('inventory.noRollsFound')}
        >
          <Column header={t('waste.tableMaterial')} body={rollMaterialBody} />
          <Column header={t('waste.reference') || 'Reference'} body={(roll: Roll) => roll.reference || 'N/A'} />
          <Column header={t('waste.tableArea')} body={(roll: Roll) => (roll.areaM2 || 0).toFixed(2)} />
          <Column
            header={t('inventory.waste')}
            body={(roll: Roll) => (roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0).toFixed(2)}
          />
          <Column
            header={t('inventory.availableArea')}
            body={(roll: Roll) => {
              const used = roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0;
              const available = roll.availableAreaM2 ?? (roll.areaM2 || 0) - used;
              return available.toFixed(2);
            }}
          />
          <Column header={t('inventory.wastePercent')} body={rollWastePercentBody} />
          <Column header={t('waste.tableStatus')} body={rollStatusBody} />
          <Column header={t('waste.tableCreated')} body={(roll: Roll) => formatDate(roll.receivedDate)} />
          <Column header={t('waste.tableActions')} body={rollActionsBody} />
        </DataTable>
      )}

      <Paginator
        first={rollPage * pageSize}
        rows={pageSize}
        totalRecords={rollTotalElements}
        onPageChange={(e) => onPageChange(e.page ?? 0)}
      />
    </div>
  );
}
