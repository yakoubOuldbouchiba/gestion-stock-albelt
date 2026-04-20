import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { CommandeItem, PlacedRectangle } from '../../types';
import { useI18n } from '@hooks/useI18n';

interface PlacementsSectionProps {
  item: CommandeItem;
  placementsForItem: PlacedRectangle[];
  isBusy: boolean;
  isCommandeLocked: boolean;
  onOpenPlacementModal: (item: CommandeItem) => void;
  onOpenEditPlacementModal: (item: CommandeItem, placement: PlacedRectangle) => void;
  onOpenPlacementPreview: (placement: PlacedRectangle) => void;
  onDeletePlacement: (placementId: string, itemId: string) => void;
  onOpenProductionModal: (item: CommandeItem, placementId: string) => void;
  formatSourceLabel: (source: any, fallbackRef?: string) => string;
}

export function PlacementsSection({
  item,
  placementsForItem,
  isBusy,
  isCommandeLocked,
  onOpenPlacementModal,
  onOpenEditPlacementModal,
  onOpenPlacementPreview,
  onDeletePlacement,
  onOpenProductionModal,
  formatSourceLabel,
}: PlacementsSectionProps) {
  const { t } = useI18n();

  const getPlacementSource = (placement: PlacedRectangle) =>
    placement.roll ?? placement.wastePiece ?? null;

  const renderPlacementSource = (placement: PlacedRectangle) => {
    const source = getPlacementSource(placement);
    const isRollSource = Boolean(placement.rollId ?? placement.roll?.id);
    const isWasteSource = Boolean(placement.wastePieceId ?? placement.wastePiece?.id);
    const typeLabel = isRollSource ? 'Roll' : isWasteSource ? 'Waste' : t('commandes.notAvailable');
    const itemLabel = placement.commandeItem
      ? [
          placement.commandeItem.lineNumber ? `Line ${placement.commandeItem.lineNumber}` : null,
          placement.commandeItem.reference ?? null,
        ]
          .filter(Boolean)
          .join(' • ')
      : null;
    const sourceLabel = formatSourceLabel(source, placement.id.slice(0, 8));
    const label = itemLabel ?? sourceLabel;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ fontWeight: 600 }}>{typeLabel}</span>
        <span style={{ color: 'var(--text-color-secondary)' }}>{label}</span>
      </div>
    );
  };

  const renderPlacementColor = (placement: PlacedRectangle) => {
    const source = getPlacementSource(placement);
    const colorHex = placement.colorHexCode ?? source?.colorHexCode;
    const colorName = placement.colorName ?? source?.colorName ?? colorHex;
    if (!colorHex) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <span
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: colorHex,
            borderRadius: '3px',
            border: '1px solid var(--surface-border)',
          }}
        />
        <span>{colorName}</span>
      </span>
    );
  };

  const renderPlacementActions = (placement: PlacedRectangle) => (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      <Button
        label={t('commandes.addProductionItem')}
        icon="pi pi-plus"
        text
        onClick={() => onOpenProductionModal(item, placement.id)}
        disabled={isBusy || isCommandeLocked}
      />
      <Button
        label={t('common.edit')}
        icon="pi pi-pencil"
        text
        onClick={() => onOpenEditPlacementModal(item, placement)}
        disabled={isBusy || isCommandeLocked}
      />
      <Button
        label={t('common.delete')}
        icon="pi pi-trash"
        severity="danger"
        text
        onClick={() => onDeletePlacement(placement.id, item.id)}
        disabled={isBusy || isCommandeLocked}
      />
    </div>
  );

  const placementRows = placementsForItem
    .map((placement) => {
      const source = getPlacementSource(placement);
      const rollId = placement.rollId ?? placement.roll?.id;
      const wastePieceId = placement.wastePieceId ?? placement.wastePiece?.id;
      const type = rollId ? 'ROLL' : wastePieceId ? 'WASTE_PIECE' : 'UNKNOWN';
      const sourceId = rollId ?? wastePieceId ?? placement.id;
      const reference = source?.reference ?? source?.materialType ?? sourceId.slice(0, 8);
      const sourceLabel = formatSourceLabel(source, reference);
      const itemLabel = placement.commandeItem
        ? [
            placement.commandeItem.lineNumber ? `Line ${placement.commandeItem.lineNumber}` : null,
            placement.commandeItem.reference ?? null,
          ]
            .filter(Boolean)
            .join(' • ')
        : null;
      const groupLabel =
        type === 'ROLL'
          ? `Roll ${sourceLabel}`
          : type === 'WASTE_PIECE'
          ? `Waste ${sourceLabel}`
          : `Source ${sourceLabel}`;
      return {
        ...placement,
        groupKey: `${type}:${sourceId}`,
        groupLabel,
        groupItemLabel: itemLabel,
      };
    })
    .sort((a, b) => a.groupKey.localeCompare(b.groupKey));

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t('rollDetail.placements')}</div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontWeight: 600 }}>{t('rollDetail.existingPlacements')}</div>
            <Button
              label={t('rollDetail.addPlacement')}
              icon="pi pi-plus"
              severity="secondary"
              onClick={() => onOpenPlacementModal(item)}
              disabled={isBusy || isCommandeLocked}
            />
          </div>
          <DataTable
            value={placementRows}
            dataKey="id"
            emptyMessage={t('rollDetail.noPlacements') || 'No placements recorded for this item.'}
            size="small"
            className="p-datatable-sm"
            rowGroupMode="subheader"
            groupRowsBy="groupKey"
            sortField="groupKey"
            sortOrder={1}
            rowGroupHeaderTemplate={(row) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.25rem 0',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 600 }}>{row.groupLabel}</span>
                  {row.groupItemLabel ? (
                    <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.9rem' }}>
                      {row.groupItemLabel}
                    </span>
                  ) : null}
                </div>
                <Button
                  label="Preview"
                  icon="pi pi-eye"
                  text
                  onClick={() => onOpenPlacementPreview(row)}
                />
              </div>
            )}
          >
            <Column header={t('rollDetail.source')} body={renderPlacementSource} />
            <Column field="xMm" header={t('rollDetail.xMm')} />
            <Column field="yMm" header={t('rollDetail.yMm')} />
            <Column field="widthMm" header={t('rollDetail.widthMm')} />
            <Column field="heightMm" header={t('rollDetail.heightMm')} />
            <Column header={t('rollDetail.color')} body={renderPlacementColor} />
            <Column header={t('rollDetail.actions')} body={renderPlacementActions} />
          </DataTable>
        </div>
      </div>
    </div>
  );
}
