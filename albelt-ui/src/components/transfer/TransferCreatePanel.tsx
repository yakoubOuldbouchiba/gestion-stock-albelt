import type { Altier, Roll, WastePiece } from '../../types/index';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { TransferSourcePanel } from './TransferSourcePanel';
import { t } from 'i18next';
import {
  formatDateTimeLocalValue,
  parseDateTimeLocalValue,
} from '../../pages/transferBons.utils';

type TransferCreatePanelProps = {
  title: string;
  formData: {
    fromAltierID: string;
    toAltierID: string;
    dateSortie: string;
    dateEntree: string;
  };
  userAvailableAltiers: Altier[];
  otherAltiers: Altier[];
  selectedItemsCount: number;
  selectedRollsCount: number;
  selectedWasteCount: number;
  filteredRolls: Roll[];
  filteredWastePieces: WastePiece[];
  availableRollsCount: number;
  availableWastePiecesCount: number;
  rollTotal: number;
  wasteTotal: number;
  rollHasMore: boolean;
  wasteHasMore: boolean;
  rollsLoading: boolean;
  wasteLoading: boolean;
  selectedRollIds: string[];
  selectedWastePieceIds: string[];
  rollSearch: string;
  wasteSearch: string;
  isActionLocked: boolean;
  creating: boolean;
  onUpdateFormField: (field: 'fromAltierID' | 'toAltierID' | 'dateSortie' | 'dateEntree', value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onRefreshSources: () => void;
  onLoadMoreRolls: () => void;
  onLoadMoreWaste: () => void;
  onToggleRollSelection: (id: string) => void;
  onToggleWasteSelection: (id: string) => void;
  onRollSearchChange: (value: string) => void;
  onWasteSearchChange: (value: string) => void;
  renderRollLabel: (roll: Roll) => string;
  renderWasteLabel: (piece: WastePiece) => string;
  renderRollMeta: (roll: Roll) => React.ReactNode;
  renderWasteMeta: (piece: WastePiece) => React.ReactNode;
};

export function TransferCreatePanel({
  title,
  formData,
  userAvailableAltiers,
  otherAltiers,
  selectedItemsCount,
  selectedRollsCount,
  selectedWasteCount,
  filteredRolls,
  filteredWastePieces,
  availableRollsCount,
  availableWastePiecesCount,
  rollTotal,
  wasteTotal,
  rollHasMore,
  wasteHasMore,
  rollsLoading,
  wasteLoading,
  selectedRollIds,
  selectedWastePieceIds,
  rollSearch,
  wasteSearch,
  isActionLocked,
  creating,
  onUpdateFormField,
  onSubmit,
  onRefreshSources,
  onLoadMoreRolls,
  onLoadMoreWaste,
  onToggleRollSelection,
  onToggleWasteSelection,
  onRollSearchChange,
  onWasteSearchChange,
  renderRollLabel,
  renderWasteLabel,
  renderRollMeta,
  renderWasteMeta,
}: TransferCreatePanelProps) {
  return (
    <section className="transfer-workbench__panel transfer-workbench__panel--form">
      <div className="transfer-workbench__panel-header">
        <div>
          <h2>{title}</h2>
          <p>{t('transferWorkbench.createFormDescription')}</p>
        </div>
        <Tag value={t('transferWorkbench.itemsReady', { count: selectedItemsCount })} severity={selectedItemsCount > 0 ? 'success' : 'info'} />
      </div>

      <form className="transfer-workbench__form" onSubmit={onSubmit}>
        <div className="transfer-workbench__field-grid">
          <div className="transfer-workbench__field">
            <label htmlFor="fromAltierID">{t('transferBons.fromAltier')} *</label>
            <Dropdown
              id="fromAltierID"
              value={formData.fromAltierID || null}
              options={userAvailableAltiers}
              optionLabel="libelle"
              optionValue="id"
              placeholder={t('transferBons.selectSource')}
              onChange={(event) => onUpdateFormField('fromAltierID', event.value || '')}
            />
          </div>

          <div className="transfer-workbench__field">
            <label htmlFor="toAltierID">{t('transferBons.toAltier')} *</label>
            <Dropdown
              id="toAltierID"
              value={formData.toAltierID || null}
              options={otherAltiers}
              optionLabel="libelle"
              optionValue="id"
              placeholder={t('transferBons.selectDestination')}
              onChange={(event) => onUpdateFormField('toAltierID', event.value || '')}
            />
          </div>

          <div className="transfer-workbench__field">
            <label htmlFor="dateSortie">{t('transferBons.dateSortie')} *</label>
            <div className="transfer-workbench__date-field">
              <Calendar
                id="dateSortie"
                value={parseDateTimeLocalValue(formData.dateSortie)}
                onChange={(event) =>
                  onUpdateFormField('dateSortie', formatDateTimeLocalValue(event.value as Date | null))
                }
                showIcon
                showTime
                hourFormat="24"
                inputClassName="transfer-workbench__date-input"
                panelClassName="transfer-workbench__date-panel"
              />
            </div>
          </div>

          <div className="transfer-workbench__field">
            <label htmlFor="dateEntree">{t('transferBons.dateEntree')}</label>
            <div className="transfer-workbench__date-field">
              <Calendar
                id="dateEntree"
                value={parseDateTimeLocalValue(formData.dateEntree)}
                onChange={(event) =>
                  onUpdateFormField('dateEntree', formatDateTimeLocalValue(event.value as Date | null))
                }
                showIcon
                showTime
                hourFormat="24"
                inputClassName="transfer-workbench__date-input"
                panelClassName="transfer-workbench__date-panel"
              />
            </div>
          </div>
        </div>

        <div className="transfer-workbench__source-columns">
          <TransferSourcePanel
            title={t('transferWorkbench.rolls')}
            subtitle={t('transferWorkbench.sourceSubtitle', { selected: selectedRollsCount, filtered: filteredRolls.length, loaded: availableRollsCount, total: rollTotal || 0 })}
            items={filteredRolls}
            selectedIds={selectedRollIds}
            loading={rollsLoading}
            emptyMessage={t('transferBons.noAvailableRolls')}
            hasMore={rollHasMore}
            searchValue={rollSearch}
            onSearchChange={onRollSearchChange}
            onLoadMore={onLoadMoreRolls}
            onToggle={onToggleRollSelection}
            renderMeta={renderRollMeta}
            renderLabel={renderRollLabel}
          />

          <TransferSourcePanel
            title={t('transferWorkbench.chutes')}
            subtitle={t('transferWorkbench.sourceSubtitle', { selected: selectedWasteCount, filtered: filteredWastePieces.length, loaded: availableWastePiecesCount, total: wasteTotal || 0 })}
            items={filteredWastePieces}
            selectedIds={selectedWastePieceIds}
            loading={wasteLoading}
            emptyMessage={t('transferBons.noAvailableChutes')}
            hasMore={wasteHasMore}
            searchValue={wasteSearch}
            onSearchChange={onWasteSearchChange}
            onLoadMore={onLoadMoreWaste}
            onToggle={onToggleWasteSelection}
            renderMeta={renderWasteMeta}
            renderLabel={renderWasteLabel}
          />
        </div>

        <div className="transfer-workbench__footer-actions">
          <Button
            type="button"
            label={t('transferWorkbench.refreshSources')}
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            onClick={onRefreshSources}
            disabled={!formData.fromAltierID || rollsLoading || wasteLoading || isActionLocked}
          />
          <Button
            type="submit"
            label={t('transferWorkbench.createTransferBon')}
            icon="pi pi-check"
            loading={creating}
            disabled={isActionLocked}
          />
        </div>
      </form>
    </section>
  );
}
