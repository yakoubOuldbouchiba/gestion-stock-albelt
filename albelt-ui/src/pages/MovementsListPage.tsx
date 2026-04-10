import { useState, useEffect } from 'react';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { RollMovementForm } from '../components/RollMovementForm';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';

export function MovementsListPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  
  const [activeTab, setActiveTab] = useState<'created' | 'pending'>('created');
  const [createdMovements, setCreatedMovements] = useState<RollMovement[]>([]);
  const [pendingMovements, setPendingMovements] = useState<RollMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMovement, setSelectedMovement] = useState<RollMovement | undefined>(undefined);
  
  // Confirmation form state
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState({
    dateEntree: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    loadData();
  }, [user?.altierIds?.length]);

  const loadData = async () => {
    if (!user || !user.altierIds || user.altierIds.length === 0) {
      setLoading(false);
      setError(t('movementsList.userAltierNotAvailable'));
      console.warn('User or altierIds missing:', { user, altierIds: user?.altierIds });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading movements for altiers:', user.altierIds);
      
      // Fetch movements from all altiers the user has access to
      // (My Created Movements = all movements FROM any of user's altiers)
      let allCreatedMovements: RollMovement[] = [];
      for (const altierID of user.altierIds) {
        const response = await rollMovementService.getMovementsFromAltier(altierID, 0, 20, { excludeBon: true });
        console.log(`Created movements response for altier ${altierID}:`, response);
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items ?? (response.data as any).content ?? [];
          allCreatedMovements = [...allCreatedMovements, ...items];
          console.log(`Loaded ${items.length} created movements from altier ${altierID}`);
        } else {
          console.error(`Failed to fetch created movements for altier ${altierID}:`, response.message);
        }
      }
      setCreatedMovements(allCreatedMovements);
      console.log('Total created movements:', allCreatedMovements.length);
      
      // Fetch pending receipts for each altier (movements TO the altier that haven't been received)
      let allPendingMovements: RollMovement[] = [];
      for (const altierID of user.altierIds) {
        const response = await rollMovementService.getPendingReceiptsByAltier(altierID, 0, 20, { excludeBon: true });
        console.log(`Pending receipts response for altier ${altierID}:`, response);
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items ?? (response.data as any).content ?? [];
          allPendingMovements = [...allPendingMovements, ...items];
          console.log(`Loaded ${items.length} pending receipts for altier ${altierID}`);
        } else {
          console.error(`Failed to fetch pending receipts for altier ${altierID}:`, response.message);
        }
      }
      setPendingMovements(allPendingMovements);
      console.log('Total pending movements:', allPendingMovements.length);
    } catch (err) {
      setError(t('movementsList.failedToLoad'));
      setCreatedMovements([]);
      setPendingMovements([]);
      console.error('Error loading movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfirmData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    await loadData();
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
        await loadData();
        setError(null);
      } else {
        setError(t('movementsList.failedToDelete') + ': ' + response.message);
      }
    } catch (err) {
      setError(t('movementsList.failedToDelete'));
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmReceipt = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    if (!selectedMovementId || !user) return;
    
    if (!confirmData.dateEntree) {
      setError(t('movementsList.dateEntreeRequired'));
      return;
    }
    
    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const isoDateString = confirmData.dateEntree.endsWith('Z') 
        ? confirmData.dateEntree 
        : `${confirmData.dateEntree}:00.000Z`;
      
      // Call API to confirm receipt with dateEntree
      const response = await rollMovementService.confirmReceipt(
        selectedMovementId,
        isoDateString
      );
      
      if (response.success) {
        // Reload movements
        await loadData();
        
        setConfirmData({ dateEntree: new Date().toISOString().slice(0, 16) });
        setSelectedMovementId(null);
        setShowConfirmForm(false);
        setError(null);
      } else {
        setError(response.message || t('movementsList.failedToConfirm'));
      }
    } catch (err) {
      setError(t('movementsList.failedToConfirm'));
      console.error(err);
    }
  };

  const formatDate = (dateValue: string | null | undefined | any[]) => {
    if (!dateValue) return '-';
    
    // Handle array format from backend [year, month, day, hour, minute, second, nano]
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }
    
    // Handle ISO string format
    return formatDateTime(dateValue);
  };

  const tabIndex = activeTab === 'created' ? 0 : 1;

  const statusBody = (movement: RollMovement) => (
    <Tag
      value={movement.dateEntree ? t('movementsList.delivered') : t('movementsList.pending')}
      severity={movement.dateEntree ? 'success' : 'warning'}
    />
  );

  const movementItemBody = (movement: RollMovement) => {
    if (movement.rollId) {
      return `${t('inventory.roll')}: ${movement.rollId.substring(0, 8)}...`;
    }
    if (movement.wastePieceId) {
      return `${t('inventory.wastePiece')}: ${movement.wastePieceId.substring(0, 8)}...`;
    }
    return '-';
  };

  const fromAltierBody = (movement: RollMovement) => (
    <div>
      {movement.fromAltier ? (
        <>
          <strong>{movement.fromAltier.libelle}</strong>
          <div>{movement.fromAltier.adresse}</div>
        </>
      ) : (
        <em>Supplier</em>
      )}
    </div>
  );

  const toAltierBody = (movement: RollMovement) => (
    <div>
      <strong>{movement.toAltier.libelle}</strong>
      <div>{movement.toAltier.adresse}</div>
    </div>
  );

  const bonBody = (movement: RollMovement) => (
    movement.transferBonId ? `${movement.transferBonId.substring(0, 8)}...` : '-'
  );

  const createdActionsBody = (movement: RollMovement) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {!movement.dateEntree && (
        <>
          <Button
            icon="pi pi-pencil"
            text
            onClick={() => handleEditMovement(movement)}
            aria-label={t('common.edit')}
          />
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
        setShowConfirmForm(true);
        setSelectedMovementId(movement.id);
      }}
    />
  );

  const confirmFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button type="submit" label={t('movementsList.confirmBtn')} onClick={handleConfirmReceipt} />
      <Button
        type="button"
        label={t('common.cancel')}
        severity="secondary"
        onClick={() => {
          setShowConfirmForm(false);
          setSelectedMovementId(null);
        }}
      />
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h1>{t('movementsList.title')}</h1>
          <p>{t('movementsList.subtitle')}</p>
        </div>
        <Button icon="pi pi-plus" label={t('movementsList.createBtn')} onClick={handleCreateMovement} />
      </div>

      {error && <Message severity="error" text={error} />}

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

      <Dialog
        header={t('movementsList.confirmTitle')}
        visible={showConfirmForm && !!selectedMovementId}
        onHide={() => {
          setShowConfirmForm(false);
          setSelectedMovementId(null);
        }}
        footer={confirmFooter}
      >
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <label htmlFor="dateEntree">{t('movementsList.dateEntree')} *</label>
          <InputText
            type="datetime-local"
            id="dateEntree"
            name="dateEntree"
            value={confirmData.dateEntree}
            onChange={handleConfirmInputChange}
            required
          />
        </div>
      </Dialog>

      <TabView
        activeIndex={tabIndex}
        onTabChange={(e) => setActiveTab(e.index === 0 ? 'created' : 'pending')}
      >
        <TabPanel header={t('movementsList.createdTab', { count: createdMovements.length })}>
          {createdMovements.length === 0 ? (
            <Message severity="info" text={t('movementsList.noCreatedMovements')} />
          ) : (
            <DataTable value={createdMovements} dataKey="id" size="small">
              <Column header={t('movementsList.item')} body={movementItemBody} />
              <Column header={t('movementsList.bon')} body={bonBody} />
              <Column header={t('movementsList.from')} body={fromAltierBody} />
              <Column header={t('movementsList.to')} body={toAltierBody} />
              <Column header={t('movementsList.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
              <Column header={t('movementsList.entryDate')} body={(m: RollMovement) => formatDate(m.dateEntree)} />
              <Column header={t('common.status')} body={statusBody} />
              <Column header={t('common.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
              <Column header={t('common.action')} body={createdActionsBody} />
            </DataTable>
          )}
        </TabPanel>
        <TabPanel header={t('movementsList.pendingTab', { count: pendingMovements.length })}>
          {pendingMovements.length === 0 ? (
            <Message severity="info" text={t('movementsList.noPendingReceipts')} />
          ) : (
            <DataTable value={pendingMovements} dataKey="id" size="small">
              <Column header={t('movementsList.item')} body={movementItemBody} />
              <Column header={t('movementsList.bon')} body={bonBody} />
              <Column header={t('movementsList.from')} body={fromAltierBody} />
              <Column header={t('movementsList.toYourAltier')} body={toAltierBody} />
              <Column header={t('movementsList.exitDate')} body={(m: RollMovement) => formatDate(m.dateSortie)} />
              <Column header={t('movementsList.createdBy')} body={(m: RollMovement) => m.operator.username} />
              <Column header={t('common.reason')} body={(m: RollMovement) => m.reason || t('common.dash')} />
              <Column header={t('common.action')} body={pendingActionsBody} />
            </DataTable>
          )}
        </TabPanel>
      </TabView>
    </div>
  );
}

export default MovementsListPage;
