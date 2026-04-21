import type { TransferBon } from '../../types/index';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { formatTransferDate } from '../../pages/transferBons.utils';
import type { TransferBonDetails } from '../../pages/transferBons.utils';
import { TransferDetailsPanel } from './TransferDetailsPanel';

type TransferHistoryPanelProps = {
  bons: TransferBon[];
  bonDetails: TransferBonDetails | null;
  bonMovementsCount: number;
  selectedBonId: string | null;
  detailsVisible: boolean;
  loading: boolean;
  isActionLocked: boolean;
  viewLoadingBonId: string | null;
  deleteLoadingBonId: string | null;
  removeMovementLoadingId: string | null;
  confirming: boolean;
  confirmDateEntree: string;
  rollDetailsById: Record<string, any>;
  wasteDetailsById: Record<string, any>;
  onSelectBon: (id: string) => void;
  onDeleteBon: (id: string) => void;
  onToggleDetails: () => void;
  onDownloadPdf: () => void;
  onConfirmDateChange: (value: string) => void;
  onConfirmReceipt: (event: React.FormEvent) => void;
  onRemoveMovement: (bonId: string, movementId: string) => void;
};

export function TransferHistoryPanel({
  bons,
  bonDetails,
  selectedBonId,
  detailsVisible,
  loading,
  isActionLocked,
  viewLoadingBonId,
  deleteLoadingBonId,
  removeMovementLoadingId,
  confirming,
  confirmDateEntree,
  rollDetailsById,
  wasteDetailsById,
  onSelectBon,
  onDeleteBon,
  onToggleDetails,
  onDownloadPdf,
  onConfirmDateChange,
  onConfirmReceipt,
  onRemoveMovement,
}: TransferHistoryPanelProps) {
  return (
    <section className="transfer-workbench__panel">
      <div className="transfer-workbench__panel-header">
        <div>
          <h2>Existing Transfer Bons</h2>
          <p>Track open transfers, confirm reception, and review movement history.</p>
        </div>
      </div>

      <div className="transfer-workbench__bons-list">
        {loading ? (
          <div className="transfer-workbench__loading-state transfer-workbench__loading-state--compact">
            <ProgressSpinner />
          </div>
        ) : bons.length === 0 ? (
          <div className="transfer-workbench__empty-state">No transfer bons yet</div>
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
                  <Tag value={bon.dateEntree ? 'Delivered' : 'Pending'} severity={bon.dateEntree ? 'success' : 'warning'} />
                </div>

                <div className="transfer-workbench__bon-metrics">
                  <span>
                    <strong>Items:</strong> {bon.movementCount ?? '-'}
                  </span>
                  <span>
                    <strong>Entry:</strong> {formatTransferDate(bon.dateEntree)}
                  </span>
                </div>

                <div className="transfer-workbench__card-actions">
                  <Button
                    label="View"
                    size="small"
                    onClick={() => onSelectBon(bon.id)}
                    loading={viewLoadingBonId === bon.id}
                    disabled={isActionLocked}
                  />
                  {isSelected && bonDetails && (
                    <Button
                      type="button"
                      label={detailsVisible ? 'Hide details' : 'Show details'}
                      icon={detailsVisible ? 'pi pi-eye-slash' : 'pi pi-eye'}
                      severity="secondary"
                      outlined
                      size="small"
                      onClick={onToggleDetails}
                    />
                  )}
                  {!bon.dateEntree && (
                    <Button
                      label="Delete"
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
