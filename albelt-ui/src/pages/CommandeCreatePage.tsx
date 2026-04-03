import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CommandeService } from '../services/commandeService';
import { ColorService } from '../services/colorService';
import { ClientService } from '../services/clientService';
import { useI18n } from '@hooks/useI18n';
import type { Client, Color, CommandeRequest, CommandeItemRequest, MaterialType, TypeMouvement } from '../types';

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

export function CommandeCreatePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toastRef = useRef<Toast>(null);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [numeroCommande, setNumeroCommande] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Items state
  const [items, setItems] = useState<CommandeItemRequest[]>([
    {
      materialType: 'PU',
      nbPlis: 1,
      thicknessMm: 2.5,
      longueurM: 5,
      longueurToleranceM: 0,
      largeurMm: 1000,
      quantite: 1,
      surfaceConsommeeM2: 5,
      typeMouvement: 'COUPE',
      reference: '',
      colorId: undefined,
      lineNumber: 1,
    },
  ]);

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

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await ClientService.getAll();
        console.log('Clients response:', res);
        
        if (res && res.data) {
          const dataArray = Array.isArray(res.data) ? res.data : (res.data.items || []);
          const clientOptions: ClientOption[] = dataArray.map((client: Client) => ({
            label: client.name,
            value: client.id,
          }));
          setClients(clientOptions);
          if (clientOptions.length === 0) {
            setError(t('commandes.noClientsAvailable'));
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError(t('commandes.errorLoadingClients'));
        toastRef.current?.show({
          severity: 'error',
          summary: t('commandes.error'),
          detail: err?.message || t('commandes.errorLoadingClients'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [t]);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await ColorService.getAll();
        if (res && res.data) {
          const dataArray = Array.isArray(res.data) ? res.data : [];
          const colorOptions: ColorOption[] = dataArray.map((color: Color) => ({
            label: color.name,
            value: color.id,
            hexCode: color.hexCode,
          }));
          setColors(colorOptions);
        }
      } catch (err) {
        console.error('Error fetching colors:', err);
      }
    };

    fetchColors();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  // Generate order number
  const generateOrderNumber = async () => {
    try {
      const uniqueNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setNumeroCommande(uniqueNumber);
    } catch (err) {
      console.error('Error generating order number:', err);
    }
  };

  // Validation
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


   const calculateSurface = (item: CommandeItemRequest): number => {
    return ((item.longueurM * item.largeurMm) / 1000);
  };
  const calculateTotalSurface = (item: CommandeItemRequest): number => {
    return ((item.longueurM * item.largeurMm) / 1000) * item.quantite;
  };

  const handleItemChange = (index: number, field: keyof CommandeItemRequest, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const newItem: CommandeItemRequest = {
      materialType: 'PU',
      nbPlis: 1,
      thicknessMm: 2.5,
      longueurM: 5,
      longueurToleranceM: 0,
      largeurMm: 1000,
      quantite: 1,
      surfaceConsommeeM2: 5,
      typeMouvement: 'COUPE',
      reference: '',
      colorId: undefined,
      lineNumber: items.length + 1,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    confirmDialog({
      message: t('commandes.confirmDelete'),
      header: t('commandes.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setItems(items.filter((_, i) => i !== index));
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError(t('commandes.requiredFieldsError'));
      toastRef.current?.show({
        severity: 'error',
        summary: t('commandes.error'),
        detail: t('commandes.requiredFieldsError'),
      });
      return;
    }

    try {
      setLoading(true);

      const commandeRequest: CommandeRequest = {
        numeroCommande,
        clientId: selectedClient!,
        description,
        notes,
        items,
      };

      const res = await CommandeService.create(commandeRequest);

      if (res.data) {
        toastRef.current?.show({
          severity: 'success',
          summary: t('commandes.success'),
          detail: t('commandes.orderCreatedSuccessfully'),
          life: 3000,
        });

        setTimeout(() => {
          navigate('/commandes');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      const errorMsg = err.response?.data?.message || t('commandes.createError');
      setError(errorMsg);
      toastRef.current?.show({
        severity: 'error',
        summary: t('commandes.error'),
        detail: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    confirmDialog({
      message: t('commandes.confirmCancel'),
      header: t('commandes.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        navigate('/commandes');
      },
    });
  };

  const summary = calculateSummary();

  const materialBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
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

  const quantiteBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
    <InputNumber
      value={rowData.quantite}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'quantite', e.value || 0)}
      min={1}
      max={1000}
      style={{ width: '100%' }}
    />
  );

  const nbPlisBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
    <InputNumber
      value={rowData.nbPlis}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'nbPlis', e.value || 0)}
      min={0}
      style={{ width: '100%' }}
    />
  );

  const thicknessBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
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

  const longueurBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
    <InputNumber
      value={rowData.longueurM}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'longueurM', e.value || 0)}
      mode="decimal"
      minFractionDigits={1}
      maxFractionDigits={2}
      style={{ width: '100%' }}
    />
  );

  const largeurBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
    <InputNumber
      value={rowData.largeurMm}
      onValueChange={(e) => handleItemChange(rowIndex.rowIndex, 'largeurMm', e.value || 0)}
      min={0}
      style={{ width: '100%' }}
    />
  );

  const referenceBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
    <InputText
      value={rowData.reference || ''}
      onChange={(e) => handleItemChange(rowIndex.rowIndex, 'reference', e.target.value)}
      placeholder={t('inventory.reference')}
      style={{ width: '100%' }}
    />
  );

  const colorBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
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
  );

  


  const mouvementBodyTemplate = (rowData: CommandeItemRequest, rowIndex: any) => (
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

  const surfaceBodyTemplate = (rowData: CommandeItemRequest) => (
    <span>{calculateSurface(rowData).toFixed(2)} m²</span>
  );

  const surfaceTotalBodyTemplate = (rowData: CommandeItemRequest) => (
    <span>{calculateTotalSurface(rowData).toFixed(2)} m²</span>
  );

  const actionsBodyTemplate = (_: any, rowIndex: any) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      rounded
      text
      className="p-button-sm"
      onClick={() => handleRemoveItem(rowIndex.rowIndex)}
      disabled={items.length === 1}
    />
  );

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
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('commandes.createOrder')}</h1>
        <p style={{ margin: 0 }}>{t('commandes.fillDetailsBelow')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Order Header Card */}
        <Card title={t('commandes.orderHeader')}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
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
                />
                <Button
                  type="button"
                  label={t('commandes.autoGenerate')}
                  icon="pi pi-refresh"
                  onClick={generateOrderNumber}
                  severity="secondary"
                />
              </div>
              {formErrors.numeroCommande && (
                <small className="p-error">{formErrors.numeroCommande}</small>
              )}
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
                disabled={loading}
                className={formErrors.selectedClient ? 'p-invalid' : ''}
                style={{ width: '100%' }}
              />
              {formErrors.selectedClient && (
                <small className="p-error">{formErrors.selectedClient}</small>
              )}
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

        {/* Items Summary Card */}
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{summary.totalSurface} m²</div>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        <Card title={t('commandes.orderItems')}>
          {formErrors.items && (
            <div className="p-error" style={{ marginBottom: '0.75rem' }}>
              {formErrors.items}
            </div>
          )}

          {isMobile ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {items.map((item, index) => (
                <Card key={`${item.lineNumber}-${index}`}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                    {t('commandes.line')} {item.lineNumber}
                  </div>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
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
                      <div>{calculateSurface(item).toFixed(2)} m²</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        label={t('commandes.delete')}
                      />
                    </div>
                  </div>
                </Card>
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
            />
          </div>
        </Card>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            type="submit"
            label={t('commandes.createOrder')}
            icon="pi pi-check"
            loading={loading}
            severity="success"
          />
          <Button
            type="button"
            label={t('commandes.cancel')}
            icon="pi pi-times"
            onClick={handleCancel}
            severity="secondary"
          />
        </div>
      </form>
    </div>
  );
}

export default CommandeCreatePage;
