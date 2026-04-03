import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import type {
  Altier,
  Color,
  MaterialType,
  PurchaseBon,
  PurchaseBonItemRequest,
  PurchaseBonRequest,
  Supplier
} from '../types/index';
import { SupplierService } from '../services/supplierService';
import { AltierService } from '../services/altierService';
import { ColorService } from '../services/colorService';
import { PurchaseBonService } from '../services/purchaseBonService';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { useAsyncLock } from '@hooks/useAsyncLock';

export function PurchaseBonsPage() {
  const { t } = useI18n();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [bons, setBons] = useState<PurchaseBon[]>([]);
  const [selectedBon, setSelectedBon] = useState<PurchaseBon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run, isLocked } = useAsyncLock();

  const toArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.content ?? [];
  };

  const formatDateInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateInput = (value: string) => (value ? new Date(`${value}T00:00:00`) : null);

  const [bonForm, setBonForm] = useState({
    reference: '',
    bonDate: formatDateInput(new Date()),
    supplierId: '',
    notes: ''
  });

  const [itemForm, setItemForm] = useState<PurchaseBonItemRequest>({
    materialType: 'PU',
    nbPlis: 1,
    thicknessMm: 2.5,
    widthMm: 1000,
    lengthM: 50,
    areaM2: 50,
    quantity: 1,
    colorId: undefined,
    altierId: undefined,
    qrCode: ''
  });

  const [items, setItems] = useState<PurchaseBonItemRequest[]>([]);

  const materials: MaterialType[] = ['PU', 'PVC', 'CAOUTCHOUC'];
  const materialOptions = useMemo(
    () => materials.map((material) => ({ label: material, value: material })),
    [materials]
  );

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppliersRes, altiersRes, colorsRes, bonsRes] = await Promise.all([
        SupplierService.getAll(),
        AltierService.getAll(),
        ColorService.getAll(),
        PurchaseBonService.list()
      ]);

      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(toArray<Supplier>(suppliersRes.data));
      }
      if (altiersRes.success && altiersRes.data) {
        setAltiers(toArray<Altier>(altiersRes.data));
      }
      if (colorsRes.success && colorsRes.data) {
        setColors(toArray<Color>(colorsRes.data));
      }
      if (bonsRes.success && bonsRes.data) {
        setBons(toArray<PurchaseBon>(bonsRes.data));
      }
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const loadBonDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await PurchaseBonService.getById(id);
      if (response.success && response.data) {
        setSelectedBon(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToLoadDetails'));
    } finally {
      setLoading(false);
    }
  };

  const updateBonField = (field: keyof typeof bonForm, value: string) => {
    setBonForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItemField = <K extends keyof PurchaseBonItemRequest>(
    field: K,
    value: PurchaseBonItemRequest[K]
  ) => {
    setItemForm((prev) => {
      const updated: PurchaseBonItemRequest = {
        ...prev,
        [field]: value
      };

      if (field === 'widthMm' || field === 'lengthM') {
        const widthM = (updated.widthMm || 0) / 1000;
        const lengthM = updated.lengthM || 0;
        updated.areaM2 = parseFloat((widthM * lengthM).toFixed(4));
      }

      return updated;
    });
  };

  const addItem = () => {
    if (isLocked('purchase-bon')) {
      return;
    }
    if (!itemForm.materialType || !itemForm.quantity || itemForm.quantity <= 0) {
      setError(t('purchaseBons.itemRequired'));
      return;
    }

    setItems((prev) => [...prev, itemForm]);
    setItemForm({
      materialType: itemForm.materialType,
      nbPlis: itemForm.nbPlis,
      thicknessMm: itemForm.thicknessMm,
      widthMm: itemForm.widthMm,
      lengthM: itemForm.lengthM,
      areaM2: itemForm.areaM2,
      quantity: 1,
      colorId: itemForm.colorId,
      altierId: itemForm.altierId,
      qrCode: ''
    });
  };

  const removeItem = (index: number) => {
    if (isLocked('purchase-bon')) {
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateBon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLocked('purchase-bon')) {
      return;
    }

    if (!bonForm.reference || !bonForm.supplierId || !bonForm.bonDate) {
      setError(t('purchaseBons.headerRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('purchaseBons.itemsRequired'));
      return;
    }

    const request: PurchaseBonRequest = {
      reference: bonForm.reference,
      bonDate: bonForm.bonDate,
      supplierId: bonForm.supplierId,
      notes: bonForm.notes || undefined,
      items
    };

    try {
      await run(async () => {
        const response = await PurchaseBonService.create(request);
        if (response.success && response.data) {
          await loadBaseData();
          setSelectedBon(response.data);
          setBonForm({
            reference: '',
            bonDate: formatDateInput(new Date()),
            supplierId: '',
            notes: ''
          });
          setItems([]);
        } else {
          setError(response.message || t('purchaseBons.failedToCreate'));
        }
      }, 'purchase-bon');
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToCreate'));
    }
  };

  const handleValidate = async (bonId: string) => {
    try {
      if (isLocked('purchase-bon')) {
        return;
      }
      await run(async () => {
        const response = await PurchaseBonService.validate(bonId);
        if (response.success) {
          await loadBaseData();
          await loadBonDetails(bonId);
        } else {
          setError(response.message || t('purchaseBons.failedToValidate'));
        }
      }, 'purchase-bon');
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToValidate'));
    }
  };

  const handleDelete = async (bonId: string) => {
    try {
      if (isLocked('purchase-bon')) {
        return;
      }
      await run(async () => {
        const response = await PurchaseBonService.delete(bonId);
        if (response.success) {
          await loadBaseData();
          if (selectedBon?.id === bonId) {
            setSelectedBon(null);
          }
        } else {
          setError(response.message || t('purchaseBons.failedToDelete'));
        }
      }, 'purchase-bon');
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToDelete'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1>{t('purchaseBons.title')}</h1>
        <p>{t('purchaseBons.subtitle')}</p>
      </div>

      {error && <Message severity="error" text={error} />}

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
        }}
      >
        <Card title={t('purchaseBons.createTitle')}>
          <form className="p-fluid" onSubmit={handleCreateBon}>
            <div
              style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
              }}
            >
              <div>
                <label htmlFor="reference">{t('purchaseBons.reference')}</label>
                <InputText
                  id="reference"
                  value={bonForm.reference}
                  onChange={(e) => updateBonField('reference', e.target.value)}
                  placeholder="BA-2025-001"
                />
              </div>
              <div>
                <label htmlFor="bonDate">{t('purchaseBons.bonDate')}</label>
                <Calendar
                  id="bonDate"
                  value={parseDateInput(bonForm.bonDate)}
                  onChange={(e) => updateBonField('bonDate', formatDateInput(e.value as Date | null))}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                marginTop: '1rem'
              }}
            >
              <div>
                <label htmlFor="supplierId">{t('purchaseBons.supplier')}</label>
                <Dropdown
                  id="supplierId"
                  value={bonForm.supplierId || null}
                  options={suppliers}
                  optionLabel="name"
                  optionValue="id"
                  placeholder={t('purchaseBons.selectSupplier')}
                  onChange={(e) => updateBonField('supplierId', e.value || '')}
                />
              </div>
              <div>
                <label htmlFor="notes">{t('purchaseBons.notes')}</label>
                <InputTextarea
                  id="notes"
                  value={bonForm.notes}
                  onChange={(e) => updateBonField('notes', e.target.value)}
                  placeholder={t('purchaseBons.notesPlaceholder')}
                  autoResize
                  rows={1}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{t('purchaseBons.items')}</h3>
                <Tag value={`${items.length} ${t('purchaseBons.itemsCount')}`} />
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  marginTop: '0.75rem'
                }}
              >
                <div>
                  <label>{t('purchaseBons.material')}</label>
                  <Dropdown
                    value={itemForm.materialType}
                    options={materialOptions}
                    onChange={(e) => updateItemField('materialType', e.value)}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.quantity')}</label>
                  <InputNumber
                    value={itemForm.quantity}
                    onValueChange={(e) => updateItemField('quantity', e.value ?? 0)}
                    min={1}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.plies')}</label>
                  <InputNumber
                    value={itemForm.nbPlis}
                    onValueChange={(e) => updateItemField('nbPlis', e.value ?? 0)}
                    min={1}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.thickness')}</label>
                  <InputNumber
                    value={itemForm.thicknessMm}
                    onValueChange={(e) => updateItemField('thicknessMm', e.value ?? 0)}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.width')}</label>
                  <InputNumber
                    value={itemForm.widthMm}
                    onValueChange={(e) => updateItemField('widthMm', e.value ?? 0)}
                    min={0}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.length')}</label>
                  <InputNumber
                    value={itemForm.lengthM}
                    onValueChange={(e) => updateItemField('lengthM', e.value ?? 0)}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.area')}</label>
                  <InputNumber
                    value={itemForm.areaM2}
                    onValueChange={(e) => updateItemField('areaM2', e.value ?? 0)}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.color')}</label>
                  <Dropdown
                    value={itemForm.colorId || null}
                    options={colors}
                    optionLabel="name"
                    optionValue="id"
                    placeholder={t('purchaseBons.selectColor')}
                    onChange={(e) => updateItemField('colorId', e.value || undefined)}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.altier')}</label>
                  <Dropdown
                    value={itemForm.altierId || null}
                    options={altiers}
                    optionLabel="libelle"
                    optionValue="id"
                    placeholder={t('purchaseBons.selectAltier')}
                    onChange={(e) => updateItemField('altierId', e.value || undefined)}
                  />
                </div>
                <div>
                  <label>{t('purchaseBons.qrCode')}</label>
                  <InputText
                    value={itemForm.qrCode || ''}
                    onChange={(e) => updateItemField('qrCode', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" label={t('purchaseBons.addItem')} icon="pi pi-plus" onClick={addItem} disabled={isLocked('purchase-bon')} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <DataTable value={items} emptyMessage={t('purchaseBons.noItems')} size="small">
                  <Column header="#" body={(_, options) => options.rowIndex + 1} />
                  <Column field="materialType" header={t('purchaseBons.material')} />
                  <Column
                    header={t('purchaseBons.dimensions')}
                    body={(item: PurchaseBonItemRequest) =>
                      `${item.widthMm} x ${item.lengthM} (${item.areaM2} m2)`
                    }
                  />
                  <Column field="quantity" header={t('purchaseBons.quantity')} />
                  <Column
                    header={t('purchaseBons.color')}
                    body={(item: PurchaseBonItemRequest) =>
                      colors.find((color) => color.id === item.colorId)?.name || '-'
                    }
                  />
                  <Column
                    header={t('purchaseBons.actions')}
                    body={(_, options) => (
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => removeItem(options.rowIndex)}
                        disabled={isLocked('purchase-bon')}
                      />
                    )}
                  />
                </DataTable>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button
                type="submit"
                label={isLocked('purchase-bon') ? t('common.saving') : t('purchaseBons.create')}
                icon="pi pi-check"
                loading={isLocked('purchase-bon')}
                disabled={isLocked('purchase-bon')}
              />
            </div>
          </form>
        </Card>

        <Card title={t('purchaseBons.listTitle')}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProgressSpinner />
            </div>
          ) : (
            <>
              <DataTable value={bons} dataKey="id" emptyMessage={t('common.noData')} size="small">
                <Column
                  header={t('purchaseBons.reference')}
                  body={(bon: PurchaseBon) => (
                    <Button label={bon.reference} text onClick={() => loadBonDetails(bon.id)} />
                  )}
                />
                <Column header={t('purchaseBons.bonDate')} body={(bon: PurchaseBon) => formatDate(bon.bonDate)} />
                <Column header={t('purchaseBons.supplier')} body={(bon: PurchaseBon) => bon.supplierName || '-'} />
                <Column
                  header={t('purchaseBons.status')}
                  body={(bon: PurchaseBon) => (
                    <Tag
                      value={bon.status === 'VALIDATED' ? t('purchaseBons.validated') : t('purchaseBons.draft')}
                      severity={bon.status === 'VALIDATED' ? 'success' : 'warning'}
                    />
                  )}
                />
                <Column header={t('purchaseBons.items')} body={(bon: PurchaseBon) => bon.itemCount ?? '-'} />
                <Column
                  header={t('purchaseBons.actions')}
                  body={(bon: PurchaseBon) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {bon.status === 'DRAFT' && (
                        <Button
                          label={t('purchaseBons.validate')}
                          onClick={() => handleValidate(bon.id)}
                          disabled={isLocked('purchase-bon')}
                          size="small"
                        />
                      )}
                      {bon.status === 'DRAFT' && (
                        <Button
                          label={t('common.delete')}
                          severity="danger"
                          onClick={() => handleDelete(bon.id)}
                          disabled={isLocked('purchase-bon')}
                          size="small"
                        />
                      )}
                    </div>
                  )}
                />
              </DataTable>

              {selectedBon && (
                <Card title={t('purchaseBons.details')} style={{ marginTop: '1rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gap: '0.5rem',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                    }}
                  >
                    <div>
                      <strong>{t('purchaseBons.reference')}:</strong> {selectedBon.reference}
                    </div>
                    <div>
                      <strong>{t('purchaseBons.bonDate')}:</strong> {formatDate(selectedBon.bonDate)}
                    </div>
                    <div>
                      <strong>{t('purchaseBons.supplier')}:</strong> {selectedBon.supplierName}
                    </div>
                    <div>
                      <strong>{t('purchaseBons.status')}:</strong> {selectedBon.status}
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <DataTable
                      value={selectedBon.items || []}
                      dataKey="id"
                      emptyMessage={t('purchaseBons.noItems')}
                      size="small"
                    >
                      <Column header="#" body={(item: any) => item.lineNumber} />
                      <Column field="materialType" header={t('purchaseBons.material')} />
                      <Column
                        header={t('purchaseBons.dimensions')}
                        body={(item: any) => `${item.widthMm} x ${item.lengthM} (${item.areaM2} m2)`}
                      />
                      <Column field="quantity" header={t('purchaseBons.quantity')} />
                      <Column header={t('purchaseBons.color')} body={(item: any) => item.colorName || '-'} />
                      <Column header={t('purchaseBons.altier')} body={(item: any) => item.altierLibelle || '-'} />
                    </DataTable>
                  </div>
                </Card>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default PurchaseBonsPage;
