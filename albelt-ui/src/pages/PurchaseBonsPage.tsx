import { useEffect, useState } from 'react';
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
import '../styles/PurchaseBonsPage.css';

export function PurchaseBonsPage() {
  const { t } = useI18n();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [bons, setBons] = useState<PurchaseBon[]>([]);
  const [selectedBon, setSelectedBon] = useState<PurchaseBon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.content ?? [];
  };

  const [bonForm, setBonForm] = useState({
    reference: '',
    bonDate: new Date().toISOString().split('T')[0],
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

  const handleBonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBonForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setItemForm((prev) => {
      const normalizedValue = (name === 'colorId' || name === 'altierId') && value === ''
        ? undefined
        : value;

      const updated: PurchaseBonItemRequest = {
        ...prev,
        [name]: name === 'nbPlis' || name === 'widthMm' || name === 'quantity'
          ? parseInt(value) || 0
          : name === 'thicknessMm' || name === 'lengthM' || name === 'areaM2'
            ? parseFloat(value) || 0
            : normalizedValue
      } as PurchaseBonItemRequest;

      if (name === 'widthMm' || name === 'lengthM') {
        const widthM = updated.widthMm / 1000;
        updated.areaM2 = widthM * updated.lengthM;
      }

      return updated;
    });
  };

  const addItem = () => {
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
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateBon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      setSaving(true);
      const response = await PurchaseBonService.create(request);
      if (response.success && response.data) {
        await loadBaseData();
        setSelectedBon(response.data);
        setBonForm({
          reference: '',
          bonDate: new Date().toISOString().split('T')[0],
          supplierId: '',
          notes: ''
        });
        setItems([]);
      } else {
        setError(response.message || t('purchaseBons.failedToCreate'));
      }
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToCreate'));
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (bonId: string) => {
    try {
      setSaving(true);
      const response = await PurchaseBonService.validate(bonId);
      if (response.success) {
        await loadBaseData();
        await loadBonDetails(bonId);
      } else {
        setError(response.message || t('purchaseBons.failedToValidate'));
      }
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToValidate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bonId: string) => {
    try {
      setSaving(true);
      const response = await PurchaseBonService.delete(bonId);
      if (response.success) {
        await loadBaseData();
        if (selectedBon?.id === bonId) {
          setSelectedBon(null);
        }
      } else {
        setError(response.message || t('purchaseBons.failedToDelete'));
      }
    } catch (err) {
      console.error(err);
      setError(t('purchaseBons.failedToDelete'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="purchase-bons-page">
      <div className="page-header">
        <h1>{t('purchaseBons.title')}</h1>
        <p>{t('purchaseBons.subtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="grid">
        <section className="panel">
          <h2>{t('purchaseBons.createTitle')}</h2>
          <form className="bon-form" onSubmit={handleCreateBon}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reference">{t('purchaseBons.reference')}</label>
                <input
                  id="reference"
                  name="reference"
                  value={bonForm.reference}
                  onChange={handleBonChange}
                  placeholder="BA-2025-001"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="bonDate">{t('purchaseBons.bonDate')}</label>
                <input
                  id="bonDate"
                  name="bonDate"
                  type="date"
                  value={bonForm.bonDate}
                  onChange={handleBonChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="supplierId">{t('purchaseBons.supplier')}</label>
                <select
                  id="supplierId"
                  name="supplierId"
                  value={bonForm.supplierId}
                  onChange={handleBonChange}
                  required
                >
                  <option value="">{t('purchaseBons.selectSupplier')}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notes">{t('purchaseBons.notes')}</label>
                <input
                  id="notes"
                  name="notes"
                  value={bonForm.notes}
                  onChange={handleBonChange}
                  placeholder={t('purchaseBons.notesPlaceholder')}
                />
              </div>
            </div>

            <div className="items-panel">
              <div className="items-header">
                <h3>{t('purchaseBons.items')}</h3>
                <span className="items-count">{items.length} {t('purchaseBons.itemsCount')}</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('purchaseBons.material')}</label>
                  <select name="materialType" value={itemForm.materialType} onChange={handleItemChange}>
                    {materials.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('purchaseBons.quantity')}</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={itemForm.quantity}
                    onChange={handleItemChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('purchaseBons.plies')}</label>
                  <input
                    name="nbPlis"
                    type="number"
                    min="1"
                    value={itemForm.nbPlis}
                    onChange={handleItemChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t('purchaseBons.thickness')}</label>
                  <input
                    name="thicknessMm"
                    type="number"
                    min="0"
                    step="0.1"
                    value={itemForm.thicknessMm}
                    onChange={handleItemChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('purchaseBons.width')}</label>
                  <input
                    name="widthMm"
                    type="number"
                    min="0"
                    value={itemForm.widthMm}
                    onChange={handleItemChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t('purchaseBons.length')}</label>
                  <input
                    name="lengthM"
                    type="number"
                    min="0"
                    step="0.1"
                    value={itemForm.lengthM}
                    onChange={handleItemChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('purchaseBons.area')}</label>
                  <input
                    name="areaM2"
                    type="number"
                    min="0"
                    step="0.1"
                    value={itemForm.areaM2}
                    onChange={handleItemChange}
                  />
                </div>
                <div className="form-group">
                  <label>{t('purchaseBons.color')}</label>
                  <select name="colorId" value={itemForm.colorId || ''} onChange={handleItemChange}>
                    <option value="">{t('purchaseBons.selectColor')}</option>
                    {colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('purchaseBons.altier')}</label>
                  <select name="altierId" value={itemForm.altierId || ''} onChange={handleItemChange}>
                    <option value="">{t('purchaseBons.selectAltier')}</option>
                    {altiers.map((altier) => (
                      <option key={altier.id} value={altier.id}>
                        {altier.libelle}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('purchaseBons.qrCode')}</label>
                  <input
                    name="qrCode"
                    value={itemForm.qrCode || ''}
                    onChange={handleItemChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={addItem}>
                  {t('purchaseBons.addItem')}
                </button>
              </div>

              {items.length > 0 && (
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('purchaseBons.material')}</th>
                        <th>{t('purchaseBons.dimensions')}</th>
                        <th>{t('purchaseBons.quantity')}</th>
                        <th>{t('purchaseBons.color')}</th>
                        <th>{t('purchaseBons.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={`${item.materialType}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{item.materialType}</td>
                          <td>
                            {item.widthMm} x {item.lengthM} ({item.areaM2} m2)
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            {colors.find((c) => c.id === item.colorId)?.name || '-'}
                          </td>
                          <td>
                            <button type="button" className="btn-danger" onClick={() => removeItem(index)}>
                              {t('common.delete')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t('common.saving') : t('purchaseBons.create')}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>{t('purchaseBons.listTitle')}</h2>
          {loading ? (
            <div className="loading">{t('common.loading')}</div>
          ) : (
            <div className="bons-table-wrapper">
              <table className="bons-table">
                <thead>
                  <tr>
                    <th>{t('purchaseBons.reference')}</th>
                    <th>{t('purchaseBons.bonDate')}</th>
                    <th>{t('purchaseBons.supplier')}</th>
                    <th>{t('purchaseBons.status')}</th>
                    <th>{t('purchaseBons.items')}</th>
                    <th>{t('purchaseBons.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bons.map((bon) => (
                    <tr key={bon.id} className={selectedBon?.id === bon.id ? 'selected' : ''}>
                      <td>
                        <button type="button" className="link-button" onClick={() => loadBonDetails(bon.id)}>
                          {bon.reference}
                        </button>
                      </td>
                      <td>{formatDate(bon.bonDate)}</td>
                      <td>{bon.supplierName || '-'}</td>
                      <td>
                        <span className={`badge ${bon.status === 'VALIDATED' ? 'validated' : 'draft'}`}>
                          {bon.status === 'VALIDATED'
                            ? t('purchaseBons.validated')
                            : t('purchaseBons.draft')}
                        </span>
                      </td>
                      <td>{bon.itemCount ?? '-'}</td>
                      <td className="row-actions">
                        {bon.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleValidate(bon.id)}
                            disabled={saving}
                          >
                            {t('purchaseBons.validate')}
                          </button>
                        )}
                        {bon.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => handleDelete(bon.id)}
                            disabled={saving}
                          >
                            {t('common.delete')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedBon && (
                <div className="bon-details">
                  <h3>{t('purchaseBons.details')}</h3>
                  <div className="bon-meta">
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

                  {selectedBon.items && selectedBon.items.length > 0 ? (
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t('purchaseBons.material')}</th>
                          <th>{t('purchaseBons.dimensions')}</th>
                          <th>{t('purchaseBons.quantity')}</th>
                          <th>{t('purchaseBons.color')}</th>
                          <th>{t('purchaseBons.altier')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBon.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.lineNumber}</td>
                            <td>{item.materialType}</td>
                            <td>
                              {item.widthMm} x {item.lengthM} ({item.areaM2} m2)
                            </td>
                            <td>{item.quantity}</td>
                            <td>{item.colorName || '-'}</td>
                            <td>{item.altierLibelle || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">{t('purchaseBons.noItems')}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PurchaseBonsPage;
