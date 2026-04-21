import type { Roll, RollMovement, WastePiece } from '../../types/index';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import {
  formatDateTimeLocalValue,
  formatTransferDate,
  getMovementDisplay,
  parseDateTimeLocalValue,
  shrinkId,
} from '../../pages/transferBons.utils';
import type { TransferBonDetails } from '../../pages/transferBons.utils';

type TransferDetailsPanelProps = {
  bonDetails: TransferBonDetails;
  bonMovements: RollMovement[];
  confirmDateEntree: string;
  isActionLocked: boolean;
  confirming: boolean;
  removeMovementLoadingId: string | null;
  rollDetailsById: Record<string, Roll>;
  wasteDetailsById: Record<string, WastePiece>;
  onConfirmDateChange: (value: string) => void;
  onConfirmReceipt: (event: React.FormEvent) => void;
  onDownloadPdf: () => void;
  onRemoveMovement: (bonId: string, movementId: string) => void;
};

export function TransferDetailsPanel({
  bonDetails,
  bonMovements,
  confirmDateEntree,
  isActionLocked,
  confirming,
  removeMovementLoadingId,
  rollDetailsById,
  wasteDetailsById,
  onConfirmDateChange,
  onConfirmReceipt,
  onDownloadPdf,
  onRemoveMovement,
}: TransferDetailsPanelProps) {
  return (
    <div className="transfer-workbench__details-panel">
      <div className="transfer-workbench__card-actions transfer-workbench__card-actions--between">
        <h3>Transfer Details</h3>
        <Button label="Download PDF" icon="pi pi-download" onClick={onDownloadPdf} />
      </div>

      <div className="transfer-workbench__detail-grid">
        <div>
          <span className="transfer-workbench__detail-label">From</span>
          <strong>{bonDetails.fromAltier?.libelle || '-'}</strong>
        </div>
        <div>
          <span className="transfer-workbench__detail-label">To</span>
          <strong>{bonDetails.toAltier?.libelle || '-'}</strong>
        </div>
        <div>
          <span className="transfer-workbench__detail-label">Exit</span>
          <strong>{formatTransferDate(bonDetails.dateSortie)}</strong>
        </div>
        <div>
          <span className="transfer-workbench__detail-label">Entry</span>
          <strong>{formatTransferDate(bonDetails.dateEntree)}</strong>
        </div>
      </div>

      {!bonDetails.dateEntree && (
        <form className="transfer-workbench__confirm-form" onSubmit={onConfirmReceipt}>
          <div className="transfer-workbench__field">
            <label htmlFor="confirmDateEntree">Confirm Entry Date *</label>
            <div className="transfer-workbench__date-field">
              <Calendar
                id="confirmDateEntree"
                value={parseDateTimeLocalValue(confirmDateEntree)}
                onChange={(event) => onConfirmDateChange(formatDateTimeLocalValue(event.value as Date | null))}
                showIcon
                showTime
                hourFormat="24"
                inputClassName="transfer-workbench__date-input"
                panelClassName="transfer-workbench__date-panel"
              />
            </div>
          </div>

          <Button
            type="submit"
            label="Confirm Receipt"
            icon="pi pi-check"
            loading={confirming}
            disabled={isActionLocked}
          />
        </form>
      )}

      <div className="transfer-workbench__movements">
        <div className="transfer-workbench__card-actions transfer-workbench__card-actions--between">
          <h3>Movements</h3>
          <Tag value={`${bonMovements.length} items`} severity="info" />
        </div>

        {bonMovements.length === 0 ? (
          <div className="transfer-workbench__empty-state">No movements</div>
        ) : (
          bonMovements.map((movement) => {
            const roll = movement.rollId ? rollDetailsById[movement.rollId] : undefined;
            const wastePiece = movement.wastePieceId ? wasteDetailsById[movement.wastePieceId] : undefined;
            const display = getMovementDisplay(movement, roll, wastePiece);
            const typeLabel =
              display.type === 'roll' ? 'Roll' : display.type === 'wastePiece' ? 'Waste Piece' : '-';

            return (
              <article key={movement.id} className="transfer-workbench__movement-card">
                <div className="transfer-workbench__movement-main">
                  <div className="transfer-workbench__movement-item">
                    <strong>{typeLabel}</strong>
                    <span>{display.label || shrinkId(display.fallbackId)}</span>
                  </div>
                  <Tag
                    value={movement.dateEntree ? 'Delivered' : 'Pending'}
                    severity={movement.dateEntree ? 'success' : 'warning'}
                  />
                </div>

                <div className="transfer-workbench__movement-metrics">
                  <span>
                    <strong>Exit:</strong> {formatTransferDate(movement.dateSortie)}
                  </span>
                  <span>
                    <strong>Entry:</strong> {formatTransferDate(movement.dateEntree)}
                  </span>
                </div>

                {!bonDetails.dateEntree && (
                  <div className="transfer-workbench__card-actions">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Delete"
                      severity="danger"
                      text
                      onClick={() => onRemoveMovement(bonDetails.id, movement.id)}
                      loading={removeMovementLoadingId === movement.id}
                      disabled={isActionLocked}
                    />
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
