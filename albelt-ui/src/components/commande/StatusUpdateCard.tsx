
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import type { Translate } from './commandeTypes';

type StatusUpdateCardProps = {
  updating: boolean;
  disabled?: boolean;
  selectedStatus: string;
  onStart: () => void;
  onUndoStart: () => void;
  onCancel: () => void;
  onCompleted: () => void;
  canStart?: boolean;
  canUndoStart?: boolean;
  canCancel?: boolean;
  canCompleted?: boolean;
  t: Translate;
};

export const StatusUpdateCard = ({
  updating,
  disabled,
  selectedStatus,
  onStart,
  onUndoStart,
  onCancel,
  onCompleted,
  canStart,
  canUndoStart,
  canCancel,
  canCompleted,
  t,
}: StatusUpdateCardProps) => {
  // Normalize status for comparison
  const status = (selectedStatus || '').trim().toUpperCase();
  return (
    <Card title={t('commandes.updateOrderStatus')} style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Show Start if status is PENDING */}
        {canStart && status === 'PENDING' && (
          <Button
            label={t('commandes.start') || 'Start'}
            onClick={onStart}
            disabled={Boolean(disabled) || updating}
          />
        )}
        {/* Show Undo Start if status is ENCOURS */}
        {canUndoStart && status === 'ENCOURS' && (
          <Button
            label={t('commandes.undoStart') || 'Undo Start'}
            onClick={onUndoStart}
            disabled={Boolean(disabled) || updating}
            severity="secondary"
          />
        )}
        {/* Cancel always visible */}
        {canCancel && (
          <Button
            label={t('commandes.cancel') || 'Cancel'}
            onClick={onCancel}
            disabled={Boolean(disabled) || updating}
            severity="danger"
          />
        )}
        {/* Completed only if ENCOURS */}
        {canCompleted && status === 'ENCOURS' && (
          <Button
            label={t('commandes.completed') || 'Completed'}
            onClick={onCompleted}
            disabled={Boolean(disabled) || updating}
            severity="success"
          />
        )}
      </div>
    </Card>
  );
};
