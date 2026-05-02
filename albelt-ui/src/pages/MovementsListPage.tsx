import { useState } from 'react';
import rollMovementService, { type RollMovement } from '../services/rollMovementService';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { RollMovementForm } from '../components/RollMovementForm';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { MovementConfirmDialog } from '../components/movement/MovementConfirmDialog';
import { nowDateTimeLocal, dateTimeLocalToIso } from './hooks/useMovementDateTime';
import { useMovementsListData } from './hooks/useMovementsListData';
import { PageHeader } from '../components/PageHeader';
import './MovementPages.css';

export function MovementsListPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const { run, isLocked } = useAsyncLock();

  const [activeIndex, setActiveIndex] = useState(0);
  const data = useMovementsListData({ altierIds: user?.altierIds || [], t });

  const [deleting, setDeleting] = useState<string | null>(null);

  const [showMovementForm, setShowMovementForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMovement, setSelectedMovement] = useState<RollMovement | undefined>(undefined);

  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [confirmDateEntree, setConfirmDateEntree] = useState(nowDateTimeLocal());

  const handleCreateMovement = () => {
    setFormMode('create');
    setSelectedMovement(undefined);
    setShowMovementForm(true);
  };

  const handleEditMovement = (movement: RollMovement) => {
    setFormMode('edit');
    setSelectedMovement(movement);
    setShowMovementForm(true);
  };

  const handleFormSuccess = async () => {
    setShowMovementForm(false);
    setSelectedMovement(undefined);
    await data.refresh();
  };

  const handleFormCancel = () => {
    setShowMovementForm(false);
    setSelectedMovement(undefined);
  };

  const handleDelete = async (movementId: string) => {
    if (!confirm(t('movementsList.confirmDelete'))) {
      return;
    }

    try {
      setDeleting(movementId);
      const response = await rollMovementService.deleteMovement(movementId);

      if (response.success) {
        await data.refresh();
        data.setError(null);
      } else {
        data.setError(`${t('movementsList.failedToDelete')}: ${response.message}`);
      }
    } catch (err) {
      console.error(err);
      data.setError(t('movementsList.failedToDelete'));
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!selectedMovementId || !user) return;
    if (!confirmDateEntree) {
      data.setError(t('movementsList.dateEntreeRequired'));
      return;
    }

    await run(async () => {
      const response = await rollMovementService.confirmReceipt(selectedMovementId, dateTimeLocalToIso(confirmDateEntree));
      if (response.success) {
        await data.refresh();
        setSelectedMovementId(null);
        data.setError(null);
      } else {
        data.setError(response.message || t('movementsList.failedToConfirm'));
      }
    }, 'movements-confirm');
  };

  const formatDate = (dateValue: string | null | undefined | any[]) => {
    if (!dateValue) return t('common.dash');
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }
    return formatDateTime(dateValue);
  };

  const statusBody = (movement: RollMovement) => (
    <Tag
      value={movement.dateEntree ? t('movementsList.delivered') : t('movementsList.pending')}
      severity={movement.dateEntree ? 'success' : 'warning'}
    />
  );

  const movementItemBody = (movement: RollMovement) => {
    if (movement.rollId) return `${t('inventory.roll')}: ${movement.rollId.substring(0, 8)}…`;
    if (movement.wastePieceId) return `${t('inventory.wastePiece')}: ${movement.wastePieceId.substring(0, 8)}…`;
    return t('common.dash');
  };

  const fromAltierBody = (movement: RollMovement) => (
    <div style={{ minWidth: 0 }}>
      {movement.fromAltier ? (
        <>
          <div style={{ fontWeight: 700 }}>{movement.fromAltier.libelle}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{movement.fromAltier.adresse}</div>
        </>
      ) : (
        <em>{t('rollMovement.supplier')}</em>
      )}
    </div>
  );

  const toAltierBody = (movement: RollMovement) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 700 }}>{movement.toAltier.libelle}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{movement.toAltier.adresse}</div>
    </div>
  );

  const bonBody = (movement: RollMovement) => (movement.transferBonId ? `${movement.transferBonId.substring(0, 8)}…` : t('common.dash'));

  const createdActionsBody = (movement: RollMovement) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {!movement.dateEntree && (
        <>
          <Button icon="pi pi-pencil" text onClick={() => handleEditMovement(movement)} aria-label={t('common.edit')} />
          <Button
            icon="pi pi-trash"
            text
            severity="danger"
            onClick={() => handleDelete(movement.id)}
            disabled={deleting === movement.id}
            aria-label={t('common.delete')}
          />
        </>
      )}
    </div>
  );

  const pendingActionsBody = (movement: RollMovement) => (
    <Button
      icon="pi pi-check"
      label={t('movementsList.confirmBtn')}
      text
      onClick={() => {
        setConfirmDateEntree(nowDateTimeLocal());
        setSelectedMovementId(movement.id);
      }}
      disabled={isLocked('movements-confirm')}
    />
  );

  if (data.loading) {
    return (
      <div className="page-container movement-page" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="page-container movement-page">
      <PageHeader
        title={t('movementsList.title')}
        subtitle={t('movementsList.subtitle')}
        actions={<Button icon="pi pi-plus" label={t('movementsList.createBtn')} onClick={handleCreateMovement} disabled={!user} />}
      />

      {data.error && <Message severity="error" text={data.error} style={{ marginBottom: '0.75rem' }} />}

      {showMovementForm && user && (
        <RollMovementForm
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          existingMovement={selectedMovement}
          userAltierIds={user.altierIds || []}
          userId={user.id}
        />
      )}

      <MovementConfirmDialog
        t={t}
        visible={!!selectedMovementId}
        busy={isLocked('movements-confirm')}
        title={t('movementsList.confirmTitle')}
        description={t('rollMovement.confirmReceiptDesc')}
        dateEntree={confirmDateEntree}
        onDateEntreeChange={setConfirmDateEntree}
        onHide={() => setSelectedMovementId(null)}
        onConfirm={handleConfirmReceipt}
      />

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header={t('movementsList.createdTab', { count: data.summary.createdCount })}>
          {data.createdMovements.length === 0 ? (
            <Message severity="info" text={t('movementsList.noCreatedMovements')} />
          ) : (
            <DataTable value={data.createdMovements} dataKey="id" size="small">
              <Column header={t('movementsList.item')} body={movementItemBody} />
              <Column header={t('movementsList.bon')} body={bonBody} />
              <Column header={t('movementsList.from')} body={fromAltierBody} />
              <Column header={t('movementsList.to')} body={toAltierBody} />
              <Column header={t('movementsList.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
              <Column header={t('movementsList.entryDate')} body={(m: RollMovement) => formatDate(m.dateEntree)} />
              <Column header={t('common.status')} body={statusBody} />
              <Column header={t('common.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
              <Column header={t('common.actions')} body={createdActionsBody} />
            </DataTable>
          )}
        </TabPanel>

        <TabPanel header={t('movementsList.pendingTab', { count: data.summary.pendingCount })}>
          {data.pendingMovements.length === 0 ? (
            <Message severity="info" text={t('movementsList.noPendingReceipts')} />
          ) : (
            <DataTable value={data.pendingMovements} dataKey="id" size="small">
              <Column header={t('movementsList.item')} body={movementItemBody} />
              <Column header={t('movementsList.bon')} body={bonBody} />
              <Column header={t('movementsList.from')} body={fromAltierBody} />
              <Column header={t('movementsList.toYourAltier')} body={toAltierBody} />
              <Column header={t('movementsList.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
              <Column header={t('movementsList.createdBy')} body={(m: RollMovement) => m.operator.username} />
              <Column header={t('common.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
              <Column header={t('common.actions')} body={pendingActionsBody} />
            </DataTable>
          )}
        </TabPanel>
      </TabView>
    </div>
  );
}

export default MovementsListPage;

