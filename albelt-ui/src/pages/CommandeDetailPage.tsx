import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { CommandeService } from '../services/commandeService';
import { WastePieceService } from '../services/wastePieceService';
import { formatDate, formatDateTime } from '../utils/date';
import { RollService } from '../services/rollService';
import { useI18n } from '@hooks/useI18n';
import type { Commande, CommandeItem, ItemStatus, Roll, WasteType } from '../types';

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommandeItem | null>(null);
  const [wasteForItem, setWasteForItem] = useState<any[]>([]);
  
  // Roll processing form
  const [processingForm, setProcessingForm] = useState({
    rollId: '',
    lengthUsedM: '',
    widthRemainingMm: '',
    wasteType: 'DECHET' as WasteType,
    weightKg: '',
    notes: '',
  });

  const statuses = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const itemStatuses: ItemStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    if (!id) {
      setError(t('commandes.loadError'));
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CommandeService.getById(id);
        if (res.data) {
          setCommande(res.data);
          setSelectedStatus(res.data.status);
        }
        
        // Fetch available rolls
        const rollsRes = await RollService.getAll();
        if (rollsRes.data) {
          const rollItems = Array.isArray(rollsRes.data)
            ? rollsRes.data
            : (rollsRes.data as any).items ?? (rollsRes.data as any).content ?? [];
          setRolls(rollItems);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('commandes.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  const showError = (detail: string) => {
    toastRef.current?.show({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  };

  const showSuccess = (detail: string) => {
    toastRef.current?.show({
      severity: 'success',
      summary: t('common.success'),
      detail,
      life: 2500,
    });
  };

  const handleStatusUpdate = async () => {
    if (!commande || !id) return;

    try {
      setUpdating(true);
      const res = await CommandeService.updateStatus(id, selectedStatus);
      if (res.data) {
        setCommande(res.data);
        setError(null);
        showSuccess(t('commandes.updateStatus'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(t('commandes.errorLoadingOrders'));
      showError(t('commandes.errorLoadingOrders'));
    } finally {
      setUpdating(false);
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    if (!commande) return;

    try {
      const res = await CommandeService.updateItemStatus(itemId, newStatus);
      if (res.data) {
        // Refetch the order to get updated data
        const commandeRes = await CommandeService.getById(commande.id);
        if (commandeRes.data) {
          setCommande(commandeRes.data);
        }
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      setError(t('commandes.deleteItemError'));
      showError(t('commandes.deleteItemError'));
    }
  };

  const handleDeleteItem = (itemId: string) => {
    confirmDialog({
      message: t('commandes.confirmDeleteItem'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await CommandeService.deleteItem(itemId);
          if (commande) {
            setCommande({
              ...commande,
              items: commande.items.filter((item) => item.id !== itemId),
            });
          }
          showSuccess(t('commandes.delete'));
        } catch (err) {
          console.error('Error deleting item:', err);
          setError(t('commandes.deleteItemError'));
          showError(t('commandes.deleteItemError'));
        }
      },
    });
  };

  const handleDeleteOrder = () => {
    confirmDialog({
      message: t('commandes.confirmDeleteOrder'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          if (commande?.id) {
            await CommandeService.delete(commande.id);
            navigate('/commandes');
          }
        } catch (err) {
          console.error('Error deleting order:', err);
          setError(t('commandes.confirmDeleteError'));
          showError(t('commandes.confirmDeleteError'));
        }
      },
    });
  };

  const handleEditOrder = () => {
    if (commande?.id) {
      navigate(`/commandes/${commande.id}/edit`);
    }
  };

  const getStatusSeverity = (status: string) => {
    const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      PENDING: 'warning',
      ENCOURS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      ON_HOLD: 'secondary',
      IN_PROGRESS: 'info',
    };
    return severities[status] || 'secondary';
  };

  const handleOpenProcessingModal = (item: CommandeItem) => {
    setSelectedItem(item);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
    // Load waste already created for this item
    loadWasteForItem(item.id);
    setShowProcessingModal(true);
  };

  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    setSelectedItem(null);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
  };

  const loadWasteForItem = async (itemId: string) => {
    try {
      // Fetch waste for this specific commande item
      const response = await WastePieceService.getAll();
      if (response.data) {
        const wastes = Array.isArray(response.data) ? response.data : [];
        const itemWaste = wastes.filter((w: any) => w.commandeItemId === itemId);
        setWasteForItem(itemWaste);
      }
    } catch (err) {
      console.error('Error loading waste:', err);
    }
  };

  const updateProcessingField = (name: keyof typeof processingForm, value: string) => {
    setProcessingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProcessRoll = async () => {
    if (!selectedItem || !processingForm.rollId) {
      showError(t('commandes.selectRollError'));
      return;
    }

    try {
      const selectedRoll = rolls.find(r => r.id === processingForm.rollId);
      if (!selectedRoll) {
        showError(t('commandes.rollNotFoundError'));
        return;
      }

      const lengthUsed = parseFloat(processingForm.lengthUsedM) || 0;
      const widthRemaining = parseInt(processingForm.widthRemainingMm) || selectedRoll.widthMm;
      
      // Calculate waste dimensions
      const wasteLength = lengthUsed;
      const wasteWidth = selectedRoll.widthMm - widthRemaining;

      if (wasteWidth > 0 && wasteLength > 0) {
        // Calculate waste area (m²)
        const wasteAreaM2 = (wasteWidth / 1000) * wasteLength;

        // Create waste record with all required fields
        const wasteData = {
          rollId: processingForm.rollId,
          materialType: selectedRoll.materialType,
          nbPlis: selectedRoll.nbPlis,
          thicknessMm: selectedRoll.thicknessMm,
          widthMm: wasteWidth,
          lengthM: wasteLength,
          areaM2: wasteAreaM2,
          status: 'AVAILABLE',
          wasteType: processingForm.wasteType,
          altierID: selectedRoll.altierId,
        };

        await WastePieceService.create(wasteData);

        // Mark roll as opened (being used)
        await RollService.updateStatus(processingForm.rollId, 'OPENED');

        // Reload data
        await loadWasteForItem(selectedItem.id);
        const res = await CommandeService.getById(id!);
        if (res.data) {
          setCommande(res.data);
        }

        setError(null);
        // Don't close modal - let operator add more waste if needed
        showSuccess(t('commandes.wasteRecordedSuccess'));
      } else {
        showError(t('commandes.invalidDimensionsError'));
      }
    } catch (err) {
      console.error('Error processing roll:', err);
      setError(t('commandes.wasteRecordError'));
      showError(t('commandes.wasteRecordError'));
    }
  };

  const toggleItemDetails = (item: CommandeItem) => {
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      return;
    }
    setExpandedItemId(item.id);
    loadWasteForItem(item.id);
  };

  const statusOptions = statuses.map((status) => ({ label: status, value: status }));
  const itemStatusOptions = itemStatuses.map((status) => ({ label: status, value: status }));

  const rollOptions = rolls.map((roll) => ({
    label: `${roll.reference ?? (roll as any).referenceRouleau ?? roll.id} - ${roll.lengthRemainingM ?? roll.lengthM}m × ${roll.widthMm}mm`,
    value: roll.id,
  }));

  const wasteTypeOptions = [
    { label: t('commandes.wasteTypeScrap'), value: 'DECHET' },
    { label: t('commandes.wasteTypeReusable'), value: 'CHUTE_EXPLOITABLE' },
  ];

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!commande) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Message severity="warn" text={t('commandes.notFound')} style={{ marginBottom: '1rem' }} />
        <Button label={t('commandes.backToOrders')} onClick={() => navigate('/commandes')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Toast ref={toastRef} />
      <ConfirmDialog />

      <Card style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{commande.numeroCommande}</span>
            <Tag value={commande.status} severity={getStatusSeverity(commande.status)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button icon="pi pi-pencil" label={t('commandes.editOrder')} onClick={handleEditOrder} />
            <Button
              icon="pi pi-trash"
              label={t('commandes.deleteOrder')}
              severity="danger"
              onClick={handleDeleteOrder}
            />
            <Button
              icon="pi pi-arrow-left"
              label={t('commandes.backButton')}
              severity="secondary"
              outlined
              onClick={() => navigate('/commandes')}
            />
          </div>
        </div>
      </Card>

      {error && <Message severity="error" text={error} style={{ marginBottom: '1rem' }} />}

      <Card title={t('commandes.orderInformation')} style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.orderNumber')}</div>
            <div>{commande.numeroCommande}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.client')}</div>
            <div>{commande.clientName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdBy')}</div>
            <div>{commande.createdByName || t('commandes.notAvailable')}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdDate')}</div>
            <div>{formatDateTime(commande.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.totalItems')}</div>
            <div>{commande.items?.length || 0}</div>
          </div>
        </div>

        {commande.description && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.description')}</div>
            <div>{commande.description}</div>
          </div>
        )}

        {commande.notes && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.notes')}</div>
            <div>{commande.notes}</div>
          </div>
        )}
      </Card>

      <Card title={t('commandes.updateOrderStatus')} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Dropdown
            value={selectedStatus}
            options={statusOptions}
            onChange={(e) => setSelectedStatus(e.value)}
            placeholder={t('commandes.updateStatus')}
            style={{ minWidth: '220px' }}
          />
          <Button
            label={updating ? t('commandes.updating') : t('commandes.updateStatus')}
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === commande.status}
          />
        </div>
      </Card>

      <Card title={`${t('commandes.orderItems')} (${commande.items?.length || 0})`}>
        {!commande.items || commande.items.length === 0 ? (
          <Message severity="info" text={t('commandes.noItems')} />
        ) : (
          <div>
            {commande.items.map((item: CommandeItem) => (
              <Card key={item.id} style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Tag value={`${t('commandes.line')} ${item.lineNumber}`} />
                  <div style={{ flex: '1 1 240px' }}>
                    <div style={{ fontWeight: 600 }}>{item.materialType}</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {item.nbPlis}P | {item.thicknessMm}mm | {item.longueurM}m x {item.largeurMm}mm
                    </div>
                  </div>
                  <div style={{ minWidth: '90px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.qty')}</div>
                    <div>{item.quantite}</div>
                  </div>
                  <Dropdown
                    value={item.status}
                    options={itemStatusOptions}
                    onChange={(e) => handleItemStatusUpdate(item.id, e.value as ItemStatus)}
                    style={{ minWidth: '180px' }}
                  />
                  <Tag value={item.typeMouvement} severity="info" />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button
                      label={expandedItemId === item.id ? t('commandes.hide') : t('commandes.show')}
                      icon={expandedItemId === item.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
                      outlined
                      onClick={() => toggleItemDetails(item)}
                    />
                    <Button
                      icon="pi pi-trash"
                      label={t('commandes.delete')}
                      severity="danger"
                      outlined
                      onClick={() => handleDeleteItem(item.id)}
                    />
                  </div>
                </div>

                {expandedItemId === item.id && (
                  <div style={{ marginTop: '1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{t('commandes.rollProcessing')}</span>
                      <Button
                        label={t('commandes.processRoll')}
                        icon="pi pi-cog"
                        onClick={() => handleOpenProcessingModal(item)}
                      />
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                        {t('commandes.wasteCreated')}
                      </div>
                      {wasteForItem.length === 0 ? (
                        <Message severity="info" text={t('commandes.noWasteRecorded')} />
                      ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {wasteForItem.map((waste: any) => (
                            <Card key={waste.id} style={{ padding: '0.5rem' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Tag
                                  value={waste.wasteType}
                                  severity={waste.wasteType === 'DECHET' ? 'warning' : 'success'}
                                />
                                <span>
                                  {waste.lengthM}m x {waste.widthMm}mm ({waste.areaM2?.toFixed(2)}m2)
                                </span>
                                {waste.weightKg ? <span>{waste.weightKg}kg</span> : null}
                                <span>{formatDate(waste.createdAt)}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog
        header={
          selectedItem
            ? `${t('commandes.processRollLine')} ${selectedItem.lineNumber}`
            : t('commandes.processRoll')
        }
        visible={showProcessingModal}
        onHide={handleCloseProcessingModal}
        style={{ width: 'min(600px, 95vw)' }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label={t('commandes.cancel')} severity="secondary" onClick={handleCloseProcessingModal} />
            <Button label={t('commandes.recordWaste')} onClick={handleProcessRoll} />
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.rollRequired')}
            </label>
            <Dropdown
              value={processingForm.rollId}
              options={rollOptions}
              onChange={(e) => updateProcessingField('rollId', e.value as string)}
              placeholder={t('commandes.selectRollOption')}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.lengthUsed')}
            </label>
            <InputText
              value={processingForm.lengthUsedM}
              onChange={(e) => updateProcessingField('lengthUsedM', e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: '100%' }}
            />
            <small>{t('commandes.lengthUsedHelp')}</small>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.remainingWidth')}
            </label>
            <InputText
              value={processingForm.widthRemainingMm}
              onChange={(e) => updateProcessingField('widthRemainingMm', e.target.value)}
              placeholder="0"
              type="number"
              style={{ width: '100%' }}
            />
            <small>{t('commandes.remainingWidthHelp')}</small>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.wasteTypeRequired')}
            </label>
            <Dropdown
              value={processingForm.wasteType}
              options={wasteTypeOptions}
              onChange={(e) => updateProcessingField('wasteType', e.value as string)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.weight')}
            </label>
            <InputText
              value={processingForm.weightKg}
              onChange={(e) => updateProcessingField('weightKg', e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('commandes.notes')}
            </label>
            <InputTextarea
              value={processingForm.notes}
              onChange={(e) => updateProcessingField('notes', e.target.value)}
              placeholder={t('commandes.notesPlaceholder')}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default CommandeDetailPage;
