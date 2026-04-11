import { useEffect, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import type { Supplier, SupplierRequest } from '../types/index';
import { SupplierService } from '@services/supplierService';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';

const emptyForm: SupplierRequest = {
  name: '',
  address: '',
  city: '',
  country: '',
  contactPerson: '',
  email: '',
  phone: '',
};

export function SuppliersPage() {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [formData, setFormData] = useState<SupplierRequest>(emptyForm);
  const { run, isLocked } = useAsyncLock();
  const pageSize = 20;

  useEffect(() => {
    loadSuppliers(page, searchTerm);
  }, [page, searchTerm]);

  const loadSuppliers = async (pageIndex: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await SupplierService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
      });
      if (response.success && response.data) {
        setSuppliers(response.data.items || []);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      setSuppliers([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (isLocked('supplier-save')) {
      return;
    }
    try {
      await run(async () => {
        const response = editingId
          ? await SupplierService.update(editingId, formData)
          : await SupplierService.create(formData);

        if (response.success) {
          const nextPage = editingId ? page : 0;
          setPage(nextPage);
          await loadSuppliers(nextPage, searchTerm);
          setShowForm(false);
          setEditingId(null);
          resetForm();
        } else {
          setError(response.message || t('messages.operationFailed'));
        }
      }, 'supplier-save');
    } catch (err) {
      setError(t('messages.operationFailed'));
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }
    if (isLocked()) {
      return;
    }

    try {
      setError(null);
      await run(async () => {
        const response = await SupplierService.delete(id);
        if (response.success) {
          await loadSuppliers(page, searchTerm);
        } else {
          setError(response.message || t('messages.failedToDelete'));
        }
      }, `supplier-delete-${id}`);
    } catch (err) {
      setError(t('messages.failedToDelete'));
      console.error(err);
    }
  };

  const isSaving = isLocked('supplier-save');
  const isBusy = isLocked();

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button type="button" label={t('common.cancel')} severity="secondary" onClick={handleCancel} disabled={isSaving} />
      <Button
        type="button"
        label={editingId ? t('suppliers.updateSupplier') : t('suppliers.createSupplier')}
        onClick={handleSubmit}
        loading={isSaving}
        disabled={isSaving}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('suppliers.management')}</h1>
          <div style={{ color: 'var(--text-color-secondary)' }}>
            {totalElements} {totalElements !== 1 ? t('suppliers.plural') : t('suppliers.singular')}
          </div>
        </div>
        <Button icon="pi pi-plus" label={t('suppliers.addNew')} onClick={() => setShowForm(true)} disabled={isBusy} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '420px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder={t('suppliers.searchPlaceholder')}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable
        value={suppliers}
        dataKey="id"
        lazy
        paginator
        first={page * pageSize}
        rows={pageSize}
        totalRecords={totalElements}
        onPage={(e) => setPage(e.page ?? 0)}
        emptyMessage={t('messages.noSuppliersFound')}
        size="small"
      >
        <Column field="name" header={t('suppliers.companyName')} />
        <Column field="contactPerson" header={t('suppliers.contactPerson')} />
        <Column field="email" header={t('suppliers.email')} />
        <Column field="phone" header={t('suppliers.phone')} />
        <Column field="city" header={t('suppliers.city')} />
        <Column field="country" header={t('suppliers.country')} />
        <Column header={t('suppliers.created')} body={(row: Supplier) => formatDate(row.createdAt)} />
        <Column
          header={t('common.action')}
          body={(row: Supplier) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button icon="pi pi-pencil" text onClick={() => handleEdit(row)} aria-label={t('common.edit')} disabled={isBusy} />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                onClick={() => handleDelete(row.id)}
                aria-label={t('common.delete')}
                loading={isLocked(`supplier-delete-${row.id}`)}
                disabled={isBusy}
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={editingId ? t('suppliers.editTitle') : t('suppliers.addTitle')}
        visible={showForm}
        onHide={handleCancel}
        footer={formFooter}
        style={{ width: 'min(700px, 95vw)' }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="name">{t('suppliers.companyName')} *</label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="contactPerson">{t('suppliers.contactPerson')} *</label>
            <InputText
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="email">{t('suppliers.email')} *</label>
              <InputText
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="phone">{t('suppliers.phone')} *</label>
              <InputText
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="address">{t('suppliers.address')} *</label>
            <InputText
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="city">{t('suppliers.city')} *</label>
              <InputText
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="country">{t('suppliers.country')} *</label>
              <InputText
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default SuppliersPage;