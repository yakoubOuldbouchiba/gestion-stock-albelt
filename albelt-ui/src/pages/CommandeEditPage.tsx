import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { CommandeService } from '../services/commandeService';
import { ColorService } from '../services/colorService';
import { ClientService } from '../services/clientService';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import type {
  Client,
  Color,
  CommandeItem,
  CommandeItemRequest,
  CommandeRequest,
  CommandeStatus,
  MaterialType,
  TypeMouvement,
  AltierScore,
} from '../types';

interface ClientOption {
  label: string;
  value: string;
}

interface MaterialOption {
  label: string;
  value: MaterialType;
}

interface MouvementOption {
  label: string;
  value: TypeMouvement;
}

interface ColorOption {
  label: string;
  value: string;
  hexCode?: string;
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

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const useWrappedItems = true;
  const [originalItems, setOriginalItems] = useState<EditableCommandeItem[]>([]);

  // Form state
  const [numeroCommande, setNumeroCommande] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CommandeStatus>('PENDING');
  const [originalStatus, setOriginalStatus] = useState<CommandeStatus>('PENDING');
  const [selectedAltierId, setSelectedAltierId] = useState<string | null>(null);
  const [altierScores, setAltierScores] = useState<AltierScore[]>([]);
  const [altierScoresLoading, setAltierScoresLoading] = useState(false);

  // Items state
  const [items, setItems] = useState<EditableCommandeItem[]>([]);

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

  const statuses: CommandeStatus[] = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];

  useEffect(() => {
    if (!id) {
      setError(t('commandes.loadError'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [commandeRes, clientsRes, colorsRes] = await Promise.all([
          CommandeService.getById(id),
          ClientService.getAll(),
          ColorService.getAll(),
        ]);

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

          setNumeroCommande(commandeData.numeroCommande);
          setSelectedClient(commandeData.clientId);
          setDescription(commandeData.description || '');
          setNotes(commandeData.notes || '');
          setSelectedStatus(commandeData.status || 'PENDING');
          setOriginalStatus(commandeData.status || 'PENDING');
          setSelectedAltierId(commandeData.altierId || null);

          const mappedItems = (commandeData.items || []).map((item: CommandeItem) => ({
            id: item.id,
            materialType: item.materialType,
            nbPlis: item.nbPlis,
            thicknessMm: item.thicknessMm,
            longueurM: item.longueurM,
            longueurToleranceM: item.longueurToleranceM ?? 0,
            largeurMm: item.largeurMm,
            quantite: item.quantite,
            surfaceConsommeeM2: item.surfaceConsommeeM2 ?? calculateSurface(item),
            typeMouvement: item.typeMouvement,
            status: item.status,
            observations: item.observations,
            reference: item.reference,
            colorId: item.colorId,
            lineNumber: item.lineNumber,
          }));

          setItems(mappedItems);
          setOriginalItems(mappedItems);
        }

        const clientData = clientsRes?.data;
        const clientArray = Array.isArray(clientData)
          ? clientData
          : clientData?.items || [];
        const clientOptions: ClientOption[] = clientArray.map((client: Client) => ({
          label: client.name,
          value: client.id,
        }));
        setClients(clientOptions);
        if (clientOptions.length === 0) {
          setError(t('commandes.noClientsAvailable'));
        }

        const colorData = colorsRes?.data;
        const colorArray = Array.isArray(colorData) ? colorData : [];
        const colorOptions: ColorOption[] = colorArray.map((color: Color) => ({
          label: color.name,
          value: color.id,
          hexCode: color.hexCode,
        }));
        setColors(colorOptions);

        setError(null);
      } catch (err) {
        console.error('Error loading order data:', err);
        setError(t('commandes.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  useEffect(() => {
    if (!id) return;

    const fetchScores = async () => {
      setAltierScoresLoading(true);
      try {
        const res = await CommandeService.getAltierScores(id);
        setAltierScores(res.data || []);
      } catch (err) {
        console.error('Error fetching altier scores:', err);
        setAltierScores([]);
      } finally {
        setAltierScoresLoading(false);
      }
    };

    fetchScores();
  }, [id]);

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

  const calculateSurface = (item: { longueurM: number; largeurMm: number }): number => {
    return (item.longueurM * item.largeurMm) / 1000;
  };

  const calculateTotalSurface = (item: { longueurM: number; largeurMm: number; quantite: number }): number => {
    return ((item.longueurM * item.largeurMm) / 1000) * item.quantite;
  };

  const calculateSummary = () => {
    const totalItems = items.length;
    const totalSurface = items.reduce((sum, item) => sum + calculateSurface(item), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantite, 0);

    return {
      totalItems,
      totalSurface: totalSurface.toFixed(2),
      totalQuantity,
    };
  };

  const getNextLineNumber = (currentItems: EditableCommandeItem[]) => {
    const maxLine = currentItems.reduce((max, item) => Math.max(max, item.lineNumber || 0), 0);
    return maxLine + 1;
  };

  const handleItemChange = (index: number, field: keyof EditableCommandeItem, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const lineNumber = getNextLineNumber(items);
    const newItem: EditableCommandeItem = {
      materialType: 'PU',
      nbPlis: 1,
      thicknessMm: 2.5,
      longueurM: 5,
      longueurToleranceM: 0,
      largeurMm: 1000,
      quantite: 1,
      surfaceConsommeeM2: calculateSurface({ longueurM: 5, largeurMm: 1000 }),
      typeMouvement: 'COUPE',
      reference: '',
      colorId: undefined,
      lineNumber,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    confirmDialog({
      message: t('commandes.confirmDeleteItem'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setItems(items.filter((_, i) => i !== index));
      },
    });
  };

  const toItemRequest = (item: EditableCommandeItem, index: number): CommandeItemRequest => ({
    materialType: item.materialType,
    nbPlis: item.nbPlis,
    thicknessMm: item.thicknessMm,
    longueurM: item.longueurM,
    longueurToleranceM: item.longueurToleranceM ?? 0,
    largeurMm: item.largeurMm,
    quantite: item.quantite,
    surfaceConsommeeM2: calculateSurface(item),
    typeMouvement: item.typeMouvement,
    status: item.status,
    observations: item.observations,
    reference: item.reference,
    colorId: item.colorId,
    lineNumber: item.lineNumber || index + 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitUpdate = async () => {
      if (isLocked('commande-update')) {
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

  const summary = calculateSummary();
  const isBusy = isLocked('commande-update');

  const materialBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <Dropdown
      value={rowData.materialType}
      onChange={(e) => handleItemChange(rowIndex.rowIndex, 'materialType', e.value)}
      options={materials}
      optionLabel="label"
      optionValue="value"
      placeholder={t('commandes.selectMaterial')}
      filter
      showClear={false}
      style={{ width: '100%' }}
    />
  );

  const quantiteBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputNumber
      value={rowData.quantite}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'quantite', e.value || 0)}
      min={1}
      max={1000}
      style={{ width: '100%' }}
    />
  );

  const nbPlisBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputNumber
      value={rowData.nbPlis}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'nbPlis', e.value || 0)}
      min={0}
      style={{ width: '100%' }}
    />
  );

  const thicknessBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputNumber
      value={rowData.thicknessMm}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'thicknessMm', e.value || 0)}
      min={0.0}
      max={100}
      step={0.1}
      mode="decimal"
      minFractionDigits={1}
      maxFractionDigits={3}
      style={{ width: '100%' }}
    />
  );

  const longueurBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputNumber
      value={rowData.longueurM}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'longueurM', e.value || 0)}
      mode="decimal"
      minFractionDigits={1}
      maxFractionDigits={2}
      style={{ width: '100%' }}
    />
  );

  const largeurBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputNumber
      value={rowData.largeurMm}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'largeurMm', e.value || 0)}
      min={0}
      style={{ width: '100%' }}
    />
  );

  const referenceBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <InputText
      value={rowData.reference || ''}
      onChange={(e) => handleItemChange(rowIndex.rowIndex, 'reference', e.target.value)}
      placeholder={t('inventory.reference')}
      style={{ width: '100%' }}
    />
  );

  const colorBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <Dropdown
      value={rowData.colorId}
      onChange={(e) => handleItemChange(rowIndex.rowIndex, 'colorId', e.value)}
      options={colors}
      optionLabel="label"
      optionValue="value"
      placeholder={t('inventory.selectColor')}
      showClear
      style={{ width: '100%' }}
      itemTemplate={(option) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: option.hexCode || 'transparent',
              border: '1px solid var(--surface-border)',
            }}
          />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {option.label}
          </span>
        </div>
      )}
      valueTemplate={(option) => {
        if (!option) return <span>{t('inventory.selectColor')}</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: option.hexCode || 'transparent',
                border: '1px solid var(--surface-border)',
              }}
            />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {option.label}
            </span>
          </div>
        );
      }}
    />
  );

  const mouvementBodyTemplate = (rowData: EditableCommandeItem, rowIndex: any) => (
    <Dropdown
      value={rowData.typeMouvement}
      onChange={(e) => handleItemChange(rowIndex.rowIndex, 'typeMouvement', e.value)}
      options={mouvements}
      optionLabel="label"
      optionValue="value"
      placeholder={t('commandes.selectMouvement')}
      filter
      showClear={false}
      style={{ width: '100%' }}
    />
  );

  const surfaceBodyTemplate = (rowData: EditableCommandeItem) => (
    <span>{calculateSurface(rowData).toFixed(2)} m2</span>
  );

  const surfaceTotalBodyTemplate = (rowData: EditableCommandeItem) => (
    <span>{calculateTotalSurface(rowData).toFixed(2)} m2</span>
  );

  const actionsBodyTemplate = (_: any, rowIndex: any) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      rounded
      text
      className="p-button-sm"
      onClick={() => handleRemoveItem(rowIndex.rowIndex)}
      disabled={items.length === 1 || isBusy}
    />
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      <Toast ref={toastRef} />
      <ConfirmDialog />

      {error && (
        <div style={{ marginBottom: '1rem' }}>
          <Message severity="error" text={error} />
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('commandes.editOrderTitle')}</h1>
        <p style={{ margin: 0 }}>{t('commandes.editDetailsBelow')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <Card title={t('commandes.orderHeader')}>
          <div
            className="albel-grid albel-grid--min240"
            style={{
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('commandes.orderNumber')} *</label>
              <InputText
                value={numeroCommande}
                onChange={(e) => setNumeroCommande(e.target.value)}
                placeholder={t('commandes.orderNumberPlaceholder')}
                disabled
              />
              {formErrors.numeroCommande && (
                <small className="p-error">{formErrors.numeroCommande}</small>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('commandes.client')} *</label>
              <Dropdown
                options={clients}
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder={t('commandes.selectClient')}
                filter
                showClear
                disabled
                style={{ width: '100%' }}
              />
              {formErrors.selectedClient && (
                <small className="p-error">{formErrors.selectedClient}</small>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('common.status')}</label>
              <Dropdown
                options={statuses}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.value)}
                placeholder={t('common.status')}
                style={{ width: '100%' }}
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
            />
          </div>
        </Card>

        <Card>
          <div
            className="albel-grid albel-grid--min160"
            style={{
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '0.875rem' }}>{t('commandes.totalItems')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{summary.totalItems}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem' }}>{t('commandes.totalQuantity')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{summary.totalQuantity}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem' }}>{t('commandes.totalSurface')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{summary.totalSurface} m2</div>
            </div>
          </div>
        </Card>

        <Card title={t('commandes.orderItems')}>
          {formErrors.items && (
            <div className="p-error" style={{ marginBottom: '0.75rem' }}>
              {formErrors.items}
            </div>
          )}

          {useWrappedItems ? (
            <div className="order-items-grid">
              {items.map((item, index) => (
                <div key={`${item.lineNumber}-${index}`} className="albel-compact-item" style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                    {t('commandes.line')} {item.lineNumber}
                  </div>
                  <div className="order-item-fields">
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.material')}
                      </label>
                      <Dropdown
                        value={item.materialType}
                        onChange={(e) => handleItemChange(index, 'materialType', e.value)}
                        options={materials}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={t('commandes.selectMaterial')}
                        filter
                        showClear={false}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.plies')}
                      </label>
                      <InputNumber
                        value={item.nbPlis}
                        onValueChange={(e) => handleItemChange(index, 'nbPlis', e.value || 0)}
                        min={1}
                        max={50}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.thickness')}
                      </label>
                      <InputNumber
                        value={item.thicknessMm}
                        onValueChange={(e) => handleItemChange(index, 'thicknessMm', e.value || 0)}
                        min={0.1}
                        max={100}
                        step={0.1}
                        mode="decimal"
                        minFractionDigits={1}
                        maxFractionDigits={3}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.length')}
                      </label>
                      <InputNumber
                        value={item.longueurM}
                        onValueChange={(e) => handleItemChange(index, 'longueurM', e.value || 0)}
                        min={0.1}
                        max={1000}
                        step={0.1}
                        mode="decimal"
                        minFractionDigits={1}
                        maxFractionDigits={2}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.width')}
                      </label>
                      <InputNumber
                        value={item.largeurMm}
                        onValueChange={(e) => handleItemChange(index, 'largeurMm', e.value || 0)}
                        min={1}
                        max={10000}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('inventory.reference')}
                      </label>
                      <InputText
                        value={item.reference || ''}
                        onChange={(e) => handleItemChange(index, 'reference', e.target.value)}
                        placeholder={t('inventory.reference')}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('inventory.color')}
                      </label>
                      <Dropdown
                        value={item.colorId}
                        onChange={(e) => handleItemChange(index, 'colorId', e.value)}
                        options={colors}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={t('inventory.selectColor')}
                        showClear
                        style={{ width: '100%' }}
                        itemTemplate={(option) => (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                backgroundColor: option.hexCode || 'transparent',
                                border: '1px solid var(--surface-border)',
                              }}
                            />
                            <span>{option.label}</span>
                          </div>
                        )}
                        valueTemplate={(option) => {
                          if (!option) return <span>{t('inventory.selectColor')}</span>;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '3px',
                                  backgroundColor: option.hexCode || 'transparent',
                                  border: '1px solid var(--surface-border)',
                                }}
                              />
                              <span>{option.label}</span>
                            </div>
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.quantity')}
                      </label>
                      <InputNumber
                        value={item.quantite}
                        onValueChange={(e) => handleItemChange(index, 'quantite', e.value || 0)}
                        min={1}
                        max={1000}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.movement')}
                      </label>
                      <Dropdown
                        value={item.typeMouvement}
                        onChange={(e) => handleItemChange(index, 'typeMouvement', e.value)}
                        options={mouvements}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={t('commandes.selectMouvement')}
                        filter
                        showClear={false}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {t('commandes.surface')}
                      </label>
                      <div>{calculateSurface(item).toFixed(2)} m2</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1 || isBusy}
                        label={t('commandes.delete')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable value={items} className="p-datatable-sm">
              <Column field="lineNumber" header={t('commandes.lineNumber')} />
              <Column field="materialType" header={t('commandes.material')} body={materialBodyTemplate} />
              <Column field="nbPlis" header={t('commandes.plies')} body={nbPlisBodyTemplate} />
              <Column field="thicknessMm" header={t('commandes.thickness')} body={thicknessBodyTemplate} />
              <Column field="longueurM" header={t('commandes.length')} body={longueurBodyTemplate} />
              <Column field="largeurMm" header={t('commandes.width')} body={largeurBodyTemplate} />
              <Column field="reference" header={t('inventory.reference')} body={referenceBodyTemplate} />
              <Column field="colorId" header={t('inventory.color')} body={colorBodyTemplate} />
              <Column field="quantite" header={t('commandes.quantity')} body={quantiteBodyTemplate} />
              <Column field="typeMouvement" header={t('commandes.movement')} body={mouvementBodyTemplate} />
              <Column body={surfaceBodyTemplate} header={t('commandes.surface')} />
              <Column body={surfaceTotalBodyTemplate} header={t('inventory.totalSurface')} />
              <Column body={actionsBodyTemplate} />
            </DataTable>
          )}

          <div style={{ marginTop: '1rem' }}>
            <Button
              type="button"
              label={`+ ${t('commandes.addItem')}`}
              icon="pi pi-plus"
              onClick={handleAddItem}
              severity="success"
              disabled={isBusy}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>{t('rollDetail.workshop')}</label>
              <Dropdown
                options={altierScores.map((s) => ({
                  label: `${s.altierLibelle} (${Number(s.coveragePct).toFixed(1)}%)`,
                  value: s.altierId,
                }))}
                value={selectedAltierId}
                onChange={(e) => setSelectedAltierId(e.value)}
                placeholder={t('inventory.selectWorkshop')}
                showClear
                disabled={altierScoresLoading}
                style={{ width: '100%' }}
              />
            </div>

            {altierScores.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {t('commandes.workshopsByScore')}
                </div>
                <div className="albel-compact-list">
                  {altierScores.map((score) => (
                    <div key={score.altierId} className="albel-compact-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div
                          style={{
                            minWidth: 0,
                            fontWeight: score.altierId === selectedAltierId ? 700 : 500,
                          }}
                        >
                          {score.altierLibelle}
                        </div>
                        <div style={{ whiteSpace: 'nowrap' }}>
                          {Number(score.coveragePct).toFixed(1)}% ({score.placedPieces}/{score.totalPieces})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
