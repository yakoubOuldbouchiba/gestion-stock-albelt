import { useCallback } from 'react';
import type { TransferBon } from '../../types/index';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { formatTransferDate } from '../../pages/transferBons.utils';
import type { TransferBonDetails } from '../../pages/transferBons.utils';
import { TransferDetailsPanel } from './TransferDetailsPanel';
import { t } from 'i18next';

type TransferHistoryPanelProps = {
  bons: TransferBon[];
  bonDetails: TransferBonDetails | null;
  bonMovementsCount: number;
  selectedBonId: string | null;
  detailsVisible: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  isActionLocked: boolean;
  viewLoadingBonId: string | null;
  deleteLoadingBonId: string | null;
  removeMovementLoadingId: string | null;
  confirming: boolean;
  confirmDateEntree: string;
  rollDetailsById: Record<string, any>;
  wasteDetailsById: Record<string, any>;
  activeTab: 'sent' | 'received';
  statusFilter: 'all' | 'pending' | 'delivered';
  search: string;
  onSelectBon: (id: string) => void;
  onLoadMoreBons: () => void;
  onDeleteBon: (id: string) => void;
  onToggleDetails: () => void;
  onDownloadPdf: () => void;
  onConfirmDateChange: (value: string) => void;
  onConfirmReceipt: (event: React.FormEvent) => void;
  onRemoveMovement: (bonId: string, movementId: string) => void;
  onTabChange: (tab: 'sent' | 'received') => void;
  onStatusFilterChange: (value: 'all' | 'pending' | 'delivered') => void;
  onSearchChange: (value: string) => void;
};

export function TransferHistoryPanel({
  bons,
  bonDetails,
  selectedBonId,
  detailsVisible,
  loading,
  loadingMore,
  hasMore,
  isActionLocked,
  viewLoadingBonId,
  deleteLoadingBonId,
  removeMovementLoadingId,
  confirming,
  confirmDateEntree,
  rollDetailsById,
  wasteDetailsById,
  activeTab,
  statusFilter,
  search,
  onSelectBon,
  onLoadMoreBons,
  onDeleteBon,
  onToggleDetails,
  onDownloadPdf,
  onConfirmDateChange,
  onConfirmReceipt,
  onRemoveMovement,
  onTabChange,
  onStatusFilterChange,
  onSearchChange,
}: TransferHistoryPanelProps) {

  const handleListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (loading || loadingMore || !hasMore) return;

      const target = event.currentTarget;
      const thresholdPx = 40;
      const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceFromBottom <= thresholdPx) {
        onLoadMoreBons();
      }
    },
    [hasMore, loading, loadingMore, onLoadMoreBons]
  );

  return (
    <section className="transfer-workbench__panel">
      <div className="transfer-workbench__panel-header">
        <div>
          <h2>{t('transferWorkbench.transferBons')}</h2>
        </div>
        <div className="transfer-workbench__history-filters">
          <div className="transfer-workbench__history-tabs">
            <Button
              type="button"
              label={t('transferWorkbench.tabs.sent')}
              size="small"
              severity={activeTab === 'sent' ? undefined : 'secondary'}
              outlined={activeTab !== 'sent'}
              onClick={() => onTabChange('sent')}
            />
            <Button
              type="button"
              label={t('transferWorkbench.tabs.received')}
              size="small"
              severity={activeTab === 'received' ? undefined : 'secondary'}
              outlined={activeTab !== 'received'}
              onClick={() => onTabChange('received')}
            />
          </div>
          <div className="transfer-workbench__history-filter-row">
            <Dropdown
              value={statusFilter}
              options={[
                { label: t('transferWorkbench.filters.allStatuses'), value: 'all' },
                { label: t('statuses.PENDING'), value: 'pending' },
                { label: t('statuses.DELIVERED'), value: 'delivered' },
              ]}
              onChange={(event) => onStatusFilterChange(event.value)}
              className="transfer-workbench__history-status-filter"
            />
            <span className="p-input-icon-left transfer-workbench__history-search">
              <i className="pi pi-search" />
              <InputText
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t('transferWorkbench.filters.searchPlaceholder')}
              />
            </span>
          </div>
        </div>
      </div>

      <div className="transfer-workbench__bons-list" onScroll={handleListScroll}>
        {loading ? (
          <div className="transfer-workbench__loading-state transfer-workbench__loading-state--compact">
            <ProgressSpinner />
          </div>
        ) : bons.length === 0 ? (
          <div className="transfer-workbench__empty-state"> {t('transferWorkbench.noTransferBons')}</div>
        ) : (
          bons.map((bon) => {
            const isSelected = selectedBonId === bon.id;

            return (
              <article key={bon.id} className={`transfer-workbench__bon-card${isSelected ? ' is-selected' : ''}`}>
                <div className="transfer-workbench__bon-topline">
                  <div>
                    <strong>
                      {bon.fromAltier?.libelle || '-'} {'->'} {bon.toAltier?.libelle || '-'}
                    </strong>
                    <p>{formatTransferDate(bon.dateSortie)}</p>
                  </div>
                  <Tag value={bon.dateEntree ? t('statuses.DELIVERED') : t('statuses.PENDING')} severity={bon.dateEntree ? 'success' : 'warning'} />
                </div>

                <div className="transfer-workbench__bon-metrics">
                  <span>
                    <strong>{t('transferWorkbench.totalTransferredItems')}:</strong> {bon.movementCount ?? '-'}
                  </span>
                  <span>
                    <strong>{t('transferWorkbench.entry')}:</strong> {formatTransferDate(bon.dateEntree)}
                  </span>
                </div>

                <div className="transfer-workbench__card-actions">
                  <Button
                    label={t('common.view')}
                    size="small"
                    onClick={() => onSelectBon(bon.id)}
                    loading={viewLoadingBonId === bon.id}
                    disabled={isActionLocked}
                  />
                  {isSelected && bonDetails && (
                    <Button
                      type="button"
                      label={detailsVisible ? t('common.hideDetails') : t('common.showDetails')}
                      icon={detailsVisible ? 'pi pi-eye-slash' : 'pi pi-eye'}
                      severity="secondary"
                      outlined
                      size="small"
                      onClick={onToggleDetails}
                    />
                  )}
                  {!bon.dateEntree && (
                    <Button
                      label={t('common.delete')}
                      severity="danger"
                      outlined
                      size="small"
                      onClick={() => onDeleteBon(bon.id)}
                      loading={deleteLoadingBonId === bon.id}
                      disabled={isActionLocked}
                    />
                  )}
                </div>
              </article>
            );
          })
        )}
        {!loading && loadingMore && (
          <div className="transfer-workbench__loading-state transfer-workbench__loading-state--compact">
            <ProgressSpinner />
          </div>
        )}
      </div>

      {bonDetails && detailsVisible && (
        <TransferDetailsPanel
          bonDetails={bonDetails}
          bonMovements={bonDetails.movements || []}
          confirmDateEntree={confirmDateEntree}
          isActionLocked={isActionLocked}
          confirming={confirming}
          removeMovementLoadingId={removeMovementLoadingId}
          rollDetailsById={rollDetailsById}
          wasteDetailsById={wasteDetailsById}
          onConfirmDateChange={onConfirmDateChange}
          onConfirmReceipt={onConfirmReceipt}
          onDownloadPdf={onDownloadPdf}
          onRemoveMovement={onRemoveMovement}
        />
      )}
    </section>
  );
}
