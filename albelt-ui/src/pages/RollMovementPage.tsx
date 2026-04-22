import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import rollMovementService, { type RollMovement } from '../services/rollMovementService';
import { RollService } from '../services/rollService';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { formatDateTime } from '../utils/date';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { RollMovementForm } from '../components/RollMovementForm';
import { MovementConfirmDialog } from '../components/movement/MovementConfirmDialog';
import { nowDateTimeLocal, dateTimeLocalToIso } from './hooks/useMovementDateTime';
import { useMovementHistory } from './hooks/useMovementHistory';
import './MovementPages.css';

export function RollMovementPage() {
  const { rollId } = useParams<{ rollId: string }>();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const { run, isLocked } = useAsyncLock();

  const [fromAltierID, setFromAltierID] = useState<string>('');
  const [showMovementForm, setShowMovementForm] = useState(false);

  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [confirmDateEntree, setConfirmDateEntree] = useState(nowDateTimeLocal());

  const source = useMemo(() => (rollId ? ({ type: 'ROLL' as const, id: rollId }) : null), [rollId]);
  const history = useMovementHistory({ source, t });
  const isBusy = isLocked('roll-move-confirm') || isLocked('roll-move-create');

  useEffect(() => {
    if (!rollId) return;

    const loadRoll = async () => {
      const res = await RollService.getById(rollId);
      if (res.success && res.data?.altierId) {
        setFromAltierID(res.data.altierId);
      }
    };

    loadRoll();
  }, [rollId]);

  const handleConfirmReceipt = async () => {
    if (!selectedMovementId) return;
    await run(async () => {
      const res = await rollMovementService.confirmReceipt(selectedMovementId, dateTimeLocalToIso(confirmDateEntree));
      if (!res.success) {
        history.setError(res.message || t('rollMovement.failedToConfirm'));
        return;
      }
      await history.refresh();
      setSelectedMovementId(null);
    }, 'roll-move-confirm');
  };

  const formatDate = (date: string) => (date ? formatDateTime(date) : t('common.dash'));

  const movementsFromBody = (movement: RollMovement) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 700 }}>{movement.fromAltier?.libelle || t('common.dash')}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{movement.fromAltier?.adresse || ''}</div>
    </div>
  );

  const movementsToBody = (movement: RollMovement) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 700 }}>{movement.toAltier?.libelle || t('common.dash')}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{movement.toAltier?.adresse || ''}</div>
    </div>
  );

  if (history.loading) {
    return (
      <div className="page-container movement-page" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="page-container movement-page">
      <div className="movement-page__header">
        <div>
          <h1 className="albel-page-title">{t('rollMovement.title')}</h1>
          <p style={{ margin: 0 }}>{t('rollMovement.description', { itemId: rollId?.substring(0, 8) })}</p>
        </div>
        <div className="movement-page__headerActions">
          <Button
            icon="pi pi-plus"
            label={t('rollMovement.recordBtn')}
            onClick={() => setShowMovementForm(true)}
            disabled={!user || isBusy || !rollId}
          />
        </div>
      </div>

      {history.error && <Message severity="error" text={history.error} style={{ marginBottom: '0.75rem' }} />}

      {showMovementForm && user && rollId && (
        <RollMovementForm
          mode="create"
          onSuccess={async () => {
            setShowMovementForm(false);
            await history.refresh();
          }}
          onCancel={() => setShowMovementForm(false)}
          userAltierIds={user.altierIds || []}
          userId={user.id}
          fixedSource={{ sourceType: 'ROLL', rollId, fromAltierID: fromAltierID || undefined }}
        />
      )}

      <MovementConfirmDialog
        t={t}
        visible={!!selectedMovementId}
        busy={isBusy}
        title={t('rollMovement.confirmReceiptTitle')}
        description={t('rollMovement.confirmReceiptDesc')}
        dateEntree={confirmDateEntree}
        onDateEntreeChange={setConfirmDateEntree}
        onHide={() => setSelectedMovementId(null)}
        onConfirm={handleConfirmReceipt}
      />

      {history.movements.length === 0 ? (
        <Message severity="info" text={t('rollMovement.noMovements')} />
      ) : (
        <DataTable value={history.movements} dataKey="id" size="small">
          <Column header={t('rollMovement.from')} body={movementsFromBody} />
          <Column header={t('rollMovement.to')} body={movementsToBody} />
          <Column header={t('rollMovement.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
          <Column header={t('rollMovement.entryDate')} body={(m: RollMovement) => formatDate(m.dateEntree)} />
          <Column header={t('rollMovement.duration')} body={(m: RollMovement) => `${m.durationHours} ${t('rollMovement.hours')}`} />
          <Column header={t('rollMovement.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
          <Column header={t('rollMovement.operator')} body={(m: RollMovement) => m.operator.username} />
          <Column header={t('rollMovement.notes')} body={(m: RollMovement) => m.notes || t('common.dash')} />
          <Column
            header={t('common.action')}
            body={(m: RollMovement) =>
              !m.dateEntree ? (
                <Button
                  label={t('rollMovement.confirmReceiptBtn')}
                  icon="pi pi-check"
                  text
                  onClick={() => {
                    setConfirmDateEntree(nowDateTimeLocal());
                    setSelectedMovementId(m.id);
                  }}
                  disabled={isBusy}
                />
              ) : null
            }
          />
        </DataTable>
      )}
    </div>
  );
}

export default RollMovementPage;

