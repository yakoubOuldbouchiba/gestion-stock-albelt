import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

interface MovementConfirmDialogProps {
  t: (key: string, options?: any) => string;
  visible: boolean;
  busy?: boolean;
  title: string;
  description?: string;
  dateEntree: string;
  onDateEntreeChange: (value: string) => void;
  onHide: () => void;
  onConfirm: () => void;
}

export function MovementConfirmDialog({
  t,
  visible,
  busy,
  title,
  description,
  dateEntree,
  onDateEntreeChange,
  onHide,
  onConfirm,
}: MovementConfirmDialogProps) {
  return (
    <Dialog
      header={title}
      visible={visible}
      onHide={onHide}
      className="albel-dialog"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button type="button" label={t('common.cancel')} severity="secondary" onClick={onHide} disabled={busy} />
          <Button type="button" label={t('rollMovement.confirmReceiptBtn')} onClick={onConfirm} disabled={busy} />
        </div>
      }
    >
      {description && <p style={{ marginTop: 0 }}>{description}</p>}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <label htmlFor="confirmDateEntree">{t('rollMovement.dateEntree')} *</label>
        <InputText
          type="datetime-local"
          id="confirmDateEntree"
          value={dateEntree}
          onChange={(e) => onDateEntreeChange(e.target.value)}
          required
          disabled={busy}
        />
      </div>
    </Dialog>
  );
}

export default MovementConfirmDialog;

