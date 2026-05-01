import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { CommandeService } from '../services/commandeService';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { useCommandeLookups } from './hooks/useCommandeLookups';
import {
  calculateSurfaceM2,
  createDefaultCommandeItem,
  useCommandeItems,
} from './hooks/useCommandeItems';
import CommandeItemsEditor from '../components/commande/form/CommandeItemsEditor';
import CommandeItemsSummary from '../components/commande/form/CommandeItemsSummary';
import PageHeader from '../components/PageHeader';
import type {
  CommandeItem,
  CommandeItemRequest,
  CommandeRequest,
  CommandeStatus,
  TypeMouvement,
} from '../types';
import { applyArticleToPayload, getArticleId, getArticleMaterialType, getArticleNbPlis, getArticleReference, getArticleThicknessMm } from '../utils/article';
import './CommandeFormPage.css';

interface MouvementOption {
  label: string;
  value: TypeMouvement;
}

interface EditableCommandeItem extends CommandeItemRequest {
  id?: string;
}

export function CommandeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);
  const { run, isLocked } = useAsyncLock();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [originalItems, setOriginalItems] = useState<EditableCommandeItem[]>([]);

  // Form state
  const [numeroCommande, setNumeroCommande] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CommandeStatus>('PENDING');
  const [originalStatus, setOriginalStatus] = useState<CommandeStatus>('PENDING');
  const [selectedAltierId, setSelectedAltierId] = useState<string | null>(null);

  const { clients, colors, articles } = useCommandeLookups({
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

  const { items, setItems, updateItem, addItem, removeItem, summary } = useCommandeItems<EditableCommandeItem>({
    preserveLineNumbers: true,
    createItem: (lineNumber) => ({ ...createDefaultCommandeItem(lineNumber) }),
  });

  const isBusy = isLocked('commande-update');
  const selectedClientLabel =
    clients.find((c) => c.value === selectedClient)?.label || selectedClient || t('commandes.notAvailable');

  const mouvements: MouvementOption[] = [
    { label: 'EN COURS', value: 'ENCOURS' },
    { label: 'COUPE', value: 'COUPE' },
    { label: 'SORTIE', value: 'SORTIE' },
    { label: 'RETOUR', value: 'RETOUR' },
  ];

  const statuses: CommandeStatus[] = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];

  useEffect(() => {
    if (!id) {
      setError(t('commandes.loadError'));
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const commandeRes = await CommandeService.getById(id);
        const commandeData = commandeRes?.data;

        if (commandeData) {
          const normalizedStatus = String(commandeData.status || '').trim().toUpperCase();
          const isCommandeLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';
          if (isCommandeLocked) {
            toastRef.current?.show({
              severity: 'warn',
              summary: t('common.warning'),
              detail: t('commandes.editLocked'),
              life: 3000,
            });
            setTimeout(() => navigate(`/commandes/${id}`), 300);
            return;
          }

          const mappedItems: EditableCommandeItem[] = (commandeData.items || []).map((item: CommandeItem, index) => ({
            id: item.id,
            articleId: getArticleId(item) ?? undefined,
            article: item.article ?? null,
            materialType: (getArticleMaterialType(item) || item.materialType) as CommandeItemRequest['materialType'],
            nbPlis: getArticleNbPlis(item) ?? item.nbPlis,
            thicknessMm: getArticleThicknessMm(item) ?? item.thicknessMm,
            longueurM: item.longueurM,
            longueurToleranceM: item.longueurToleranceM ?? 0,
            largeurMm: item.largeurMm,
            quantite: item.quantite,
            surfaceConsommeeM2: item.surfaceConsommeeM2 ?? calculateSurfaceM2(item),
            typeMouvement: item.typeMouvement,
            status: item.status,
            observations: item.observations,
            reference: getArticleReference(item) ?? item.reference,
            colorId: item.colorId,
            lineNumber: item.lineNumber ?? index + 1,
          }));

          if (!cancelled) {
            setNumeroCommande(commandeData.numeroCommande);
            setSelectedClient(commandeData.clientId);
            setDescription(commandeData.description || '');
            setNotes(commandeData.notes || '');
            setSelectedStatus(commandeData.status || 'PENDING');
            setOriginalStatus(commandeData.status || 'PENDING');
            setSelectedAltierId(commandeData.altierId || null);
            setItems(mappedItems);
            setOriginalItems(mappedItems);
            setError(null);
          }
        } else if (!cancelled) {
          setError(t('commandes.notFound'));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading order data:', err);
          setError(t('commandes.loadError'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, setItems, t]);


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
    if (items.some((item) => !getArticleId(item))) {
      errors.items = t('commandes.articleRequired') || t('commandes.itemsRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRemoveItem = (index: number) => {
    confirmDialog({
      message: t('commandes.confirmDeleteItem'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => removeItem(index),
    });
  };

  const toItemRequest = (item: EditableCommandeItem, index: number): CommandeItemRequest => {
    const normalized = applyArticleToPayload(item, item.article);
    return {
      articleId: normalized.articleId,
      materialType: normalized.materialType,
      nbPlis: normalized.nbPlis,
      thicknessMm: normalized.thicknessMm,
      longueurM: item.longueurM,
      longueurToleranceM: item.longueurToleranceM ?? 0,
      largeurMm: item.largeurMm,
      quantite: item.quantite,
      surfaceConsommeeM2: calculateSurfaceM2(item),
      typeMouvement: item.typeMouvement,
      status: item.status,
      observations: item.observations,
      reference: normalized.reference,
      colorId: item.colorId,
      lineNumber: item.lineNumber || index + 1,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitUpdate = async () => {
      if (isBusy) {
        return;
      }

      if (!id) {
        setError(t('commandes.loadError'));
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
          const commandeRequest: CommandeRequest = {
            numeroCommande,
            clientId: selectedClient!,
            altierId: selectedAltierId || undefined,
            status: selectedStatus,
            description,
            notes,
          };

          await CommandeService.update(id, commandeRequest);

          const currentIds = new Set(items.map((item) => item.id).filter(Boolean) as string[]);
          const removedIds = originalItems
            .filter((item) => item.id && !currentIds.has(item.id))
            .map((item) => item.id as string);

          const itemRequests = items.map((item, index) => {
            const payload = toItemRequest(item, index);
            if (item.id) {
              return CommandeService.updateItem(item.id, payload);
            }
            return CommandeService.createItem(id, payload);
          });

          const deleteRequests = removedIds.map((itemId) => CommandeService.deleteItem(itemId));

          await Promise.all([...itemRequests, ...deleteRequests]);

          toastRef.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('commandes.orderUpdatedSuccessfully'),
            life: 3000,
          });

          setTimeout(() => {
            navigate(`/commandes/${id}`);
          }, 1200);
        }, 'commande-update');
      } catch (err: any) {
        console.error('Error updating order:', err);
        const errorMsg = err.response?.data?.message || t('commandes.updateError');
        setError(errorMsg);
        toastRef.current?.show({
          severity: 'error',
          summary: t('common.error'),
          detail: errorMsg,
        });
      }
    };

    if (selectedStatus === 'CANCELLED' && originalStatus !== 'CANCELLED') {
      confirmDialog({
        message: t('commandes.cancelCreatesChuteWarning'),
        header: t('common.confirm'),
        icon: 'pi pi-exclamation-triangle',
        accept: submitUpdate,
      });
      return;
    }

    await submitUpdate();
  };

  const handleCancel = () => {
    confirmDialog({
      message: t('commandes.confirmCancel'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (id) {
          navigate(`/commandes/${id}`);
        } else {
          navigate('/commandes');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="page-container commande-form-page" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="page-container commande-form-page">
      <Toast ref={toastRef} />
      <ConfirmDialog />

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Message severity="error" text={error} />
        </div>
      )}

      <PageHeader title={t('commandes.editOrderTitle')} subtitle={t('commandes.editDetailsBelow')} />

      <form onSubmit={handleSubmit} className="commande-form-content">
        <Card title={t('commandes.orderHeader')}>
          <div className="commande-static-grid">
            <div className="commande-static-field">
              <div className="commande-static-label">{t('commandes.orderNumber')}</div>
              <div className="commande-static-value">{numeroCommande}</div>
              {formErrors.numeroCommande && <small className="p-error">{formErrors.numeroCommande}</small>}
            </div>

            <div className="commande-static-field">
              <div className="commande-static-label">{t('commandes.client')}</div>
              <div className="commande-static-value">{selectedClientLabel}</div>
              {formErrors.selectedClient && <small className="p-error">{formErrors.selectedClient}</small>}
            </div>

            <div className="commande-static-field">
              <div className="commande-static-label">{t('common.status')}</div>
              <Dropdown
                options={statuses}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.value)}
                placeholder={t('common.status')}
                style={{ width: '100%' }}
                disabled={isBusy}
              />
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
              disabled={isBusy}
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
              disabled={isBusy}
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
          articles={articles}
          mouvements={mouvements}
          colors={colors}
          disabled={isBusy}
          formError={formErrors.items}
          variant="wrapped"
          onItemChange={updateItem}
          onAddItem={addItem}
          onRemoveItem={handleRemoveItem}
        />


        <div className="commande-form-actions">
          <Button
            type="submit"
            label={t('commandes.updateOrder')}
            icon="pi pi-check"
            loading={isBusy}
            disabled={isBusy}
            severity="success"
          />
          <Button
            type="button"
            label={t('commandes.cancel')}
            icon="pi pi-times"
            onClick={handleCancel}
            severity="secondary"
            disabled={isBusy}
          />
        </div>
      </form>
    </div>
  );
}

export default CommandeEditPage;
