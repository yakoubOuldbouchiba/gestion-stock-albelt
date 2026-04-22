import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { CommandeService } from '../services/commandeService';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { useCommandeItems, calculateSurfaceM2, createDefaultCommandeItem } from './hooks/useCommandeItems';
import { useCommandeLookups } from './hooks/useCommandeLookups';
import CommandeItemsEditor from '../components/commande/form/CommandeItemsEditor';
import CommandeItemsSummary from '../components/commande/form/CommandeItemsSummary';
import PageHeader from '../components/PageHeader';
import type { CommandeItemRequest, CommandeRequest, CommandeStatus, MaterialType, TypeMouvement } from '../types';
import './CommandeFormPage.css';

interface MaterialOption {
  label: string;
  value: MaterialType;
}

interface MouvementOption {
  label: string;
  value: TypeMouvement;
}

export function CommandeCreatePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);
  const { run, isLocked } = useAsyncLock();

  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form state
  const [numeroCommande, setNumeroCommande] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const selectedStatus: CommandeStatus = 'PENDING';

  const { clients, colors, clientsLoading } = useCommandeLookups({
    t,
    onClientsError: (message, err) => {
      setError(message);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: (err as any)?.message || message,
      });
    },
  });

  const { items, updateItem, addItem, removeItem, summary } = useCommandeItems<CommandeItemRequest>({
    initialItems: [createDefaultCommandeItem(1)],
  });

  const isSubmitting = isLocked('commande-create');

  const materials: MaterialOption[] = [
    { label: 'PU', value: 'PU' },
    { label: 'PVC', value: 'PVC' },
    { label: 'CAOUTCHOUC', value: 'CAOUTCHOUC' },
  ];

  const mouvements: MouvementOption[] = [
    { label: 'EN COURS', value: 'ENCOURS' },
    { label: 'COUPE', value: 'COUPE' },
    { label: 'SORTIE', value: 'SORTIE' },
    { label: 'RETOUR', value: 'RETOUR' },
  ];

  const generateOrderNumber = async () => {
    const uniqueNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setNumeroCommande(uniqueNumber);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!numeroCommande || numeroCommande.trim() === '') {
      errors.numeroCommande = t('commandes.orderNumberRequired');
    }

    if (!selectedClient) {
      errors.selectedClient = t('commandes.clientRequired');
    }

    if (items.length === 0) {
      errors.items = t('commandes.itemsRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toItemRequest = (item: CommandeItemRequest, index: number): CommandeItemRequest => ({
    ...item,
    longueurToleranceM: item.longueurToleranceM ?? 0,
    surfaceConsommeeM2: calculateSurfaceM2(item),
    lineNumber: item.lineNumber || index + 1,
  });

  const handleRemoveItem = (index: number) => {
    confirmDialog({
      message: t('commandes.confirmDeleteItem'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => removeItem(index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      setError(t('commandes.requiredFieldsError'));
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: t('commandes.requiredFieldsError'),
      });
      return;
    }

    try {
      await run(async () => {
        const payloadItems = items.map((item, index) => toItemRequest(item, index));
        const commandeRequest: CommandeRequest = {
          numeroCommande,
          clientId: selectedClient!,
          status: selectedStatus,
          description,
          notes,
          items: payloadItems,
        };

        const res = await CommandeService.create(commandeRequest);

        if (res.data) {
          toastRef.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('commandes.orderCreatedSuccessfully'),
            life: 3000,
          });

          setTimeout(() => {
            navigate('/commandes');
          }, 1500);
        }
      }, 'commande-create');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('commandes.createError');
      setError(errorMsg);
      toastRef.current?.show({
        severity: 'error',
        summary: t('common.error'),
        detail: errorMsg,
      });
    }
  };

  const handleCancel = () => {
    confirmDialog({
      message: t('commandes.confirmCancel'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => navigate('/commandes'),
    });
  };

  return (
    <div className="page-container commande-form-page">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Message severity="error" text={error} />
        </div>
      )}

      <PageHeader title={t('commandes.createOrder')} subtitle={t('commandes.fillDetailsBelow')} />

      <form onSubmit={handleSubmit} className="commande-form-content">
        <Card title={t('commandes.orderHeader')}>
          <div className="albel-grid albel-grid--min240" style={{ gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('commandes.orderNumber')} *</label>
              <div className="p-inputgroup">
                <InputText
                  value={numeroCommande}
                  onChange={(e) => {
                    setNumeroCommande(e.target.value);
                    if (formErrors.numeroCommande) {
                      setFormErrors({ ...formErrors, numeroCommande: '' });
                    }
                  }}
                  placeholder={t('commandes.orderNumberPlaceholder')}
                  className={formErrors.numeroCommande ? 'p-invalid' : ''}
                  disabled={isSubmitting}
                />
                <Button type="button" icon="pi pi-refresh" onClick={generateOrderNumber} severity="secondary" />
              </div>
              {formErrors.numeroCommande && <small className="p-error">{formErrors.numeroCommande}</small>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('commandes.client')} *</label>
              <Dropdown
                options={clients}
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.value);
                  if (formErrors.selectedClient) {
                    setFormErrors({ ...formErrors, selectedClient: '' });
                  }
                }}
                optionLabel="label"
                optionValue="value"
                placeholder={t('commandes.selectClient')}
                filter
                showClear
                disabled={clientsLoading || isSubmitting}
                className={formErrors.selectedClient ? 'p-invalid' : ''}
                style={{ width: '100%' }}
              />
              {formErrors.selectedClient && <small className="p-error">{formErrors.selectedClient}</small>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <label>{t('commandes.description')}</label>
            <InputTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('commandes.descriptionPlaceholder')}
              rows={3}
              style={{ width: '100%' }}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <label>{t('commandes.notes')}</label>
            <InputTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('commandes.notesPlaceholder')}
              rows={3}
              style={{ width: '100%' }}
              disabled={isSubmitting}
            />
          </div>
        </Card>

        <CommandeItemsSummary
          t={t}
          totalItems={summary.totalItems}
          totalQuantity={summary.totalQuantity}
          totalSurfaceM2={summary.totalSurfaceM2}
        />

        <CommandeItemsEditor
          t={t}
          items={items}
          materials={materials}
          mouvements={mouvements}
          colors={colors}
          disabled={isSubmitting}
          formError={formErrors.items}
          variant="wrapped"
          onItemChange={updateItem}
          onAddItem={addItem}
          onRemoveItem={handleRemoveItem}
        />

        <div className="commande-form-actions">
          <Button
            type="submit"
            label={t('commandes.createOrder')}
            icon="pi pi-check"
            loading={isSubmitting}
            disabled={isSubmitting}
            severity="success"
          />
          <Button
            type="button"
            label={t('commandes.cancel')}
            icon="pi pi-times"
            onClick={handleCancel}
            severity="secondary"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}

export default CommandeCreatePage;
