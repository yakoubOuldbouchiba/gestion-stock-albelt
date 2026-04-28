import { useEffect, useState } from 'react';
import type { Altier, AltierRequest } from '../types/index';
import { AltierService } from '@services/altierService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { PageHeader } from '../components/PageHeader';

export function AltierPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useI18n();
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const { run, isLocked } = useAsyncLock();
  const [formData, setFormData] = useState<AltierRequest>({
    libelle: '',
    adresse: '',
  });

  useEffect(() => {
    loadAltiers();
  }, [page, pageSize, searchTerm]);

  const loadAltiers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AltierService.getAll({
        page,
        size: pageSize,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });
      const data = response.data;
      if (response.success && data) {
        setAltiers(data.items || []);
        setTotalRecords(data.totalElements || 0);
      } else {
        setAltiers([]);
        setTotalRecords(0);
      }
    } catch (err) {
      setError(t('altier.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (isLocked('altier-save')) {
      return;
    }

    try {
      await run(async () => {
        if (editingId) {
          const response = await AltierService.update(editingId, formData);
          if (response.success) {
            setEditingId(null);
            await loadAltiers();
          }
        } else {
          const response = await AltierService.create(formData);
          if (response.success) {
            setPage(0);
            await loadAltiers();
          }
        }
        resetForm();
        setShowForm(false);
      }, 'altier-save');
    } catch (err) {
      setError(t('altier.failedToSave'));
      console.error(err);
    }
  };

  const handleEdit = (altier: Altier) => {
    setFormData({
      libelle: altier.libelle,
      adresse: altier.adresse,
    });
    setEditingId(altier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('altier.confirmDelete'))) {
      return;
    }
    if (isLocked()) {
      return;
    }

    try {
      await run(async () => {
        const response = await AltierService.delete(id);
        if (response.success) {
          if (altiers.length === 1 && page > 0) {
            setPage(page - 1);
          } else {
            await loadAltiers();
          }
        }
      }, `altier-delete-${id}`);
    } catch (err) {
      setError(t('altier.failedToDelete'));
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      libelle: '',
      adresse: '',
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const isSaving = isLocked('altier-save');
  const isBusy = isLocked();

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button
        type="button"
        label={t('altier.cancel')}
        severity="secondary"
        onClick={handleCancel}
        disabled={isSaving}
      />
      <Button
        type="button"
        label={editingId ? t('altier.update') : t('altier.create')}
        onClick={() => handleSubmit()}
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
      {!hideHeader && (
        <PageHeader
          title={t('altier.title')}
          subtitle={`${t('altier.totalWorkshops')}: ${totalRecords}`}
          actions={<Button icon="pi pi-plus" label={t('altier.addNew')} onClick={() => setShowForm(true)} disabled={isBusy} />}
        />
      )}

      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button icon="pi pi-plus" label={t('altier.addNew')} onClick={() => setShowForm(true)} disabled={isBusy} />
        </div>
      )}

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
            placeholder={t('altier.searchPlaceholder')}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable
        value={altiers}
        dataKey="id"
        paginator
        lazy
        first={page * pageSize}
        rows={pageSize}
        rowsPerPageOptions={[10, 25, 50]}
        totalRecords={totalRecords}
        onPage={(e) => {
          setPage(e.page ?? 0);
          if (e.rows && e.rows !== pageSize) {
            setPageSize(e.rows);
          }
        }}
        emptyMessage={t('altier.notFound')}
        size="small"
      >
        <Column field="libelle" header={t('altier.tableName')} />
        <Column field="adresse" header={t('altier.tableAddress')} />
        <Column
          header={t('altier.tableCreated')}
          body={(row: Altier) => formatDate(row.createdAt)}
        />
        <Column
          header={t('altier.tableActions')}
          body={(row: Altier) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button icon="pi pi-pencil" text onClick={() => handleEdit(row)} aria-label={t('altier.edit')} disabled={isBusy} />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                onClick={() => handleDelete(row.id)}
                aria-label={t('altier.delete')}
                loading={isLocked(`altier-delete-${row.id}`)}
                disabled={isBusy}
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={editingId ? t('altier.editTitle') : t('altier.createTitle')}
        visible={showForm}
        onHide={handleCancel}
        footer={formFooter}
        style={{ width: 'min(600px, 95vw)' }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="libelle">{t('altier.workshopName')} *</label>
            <InputText
              id="libelle"
              name="libelle"
              value={formData.libelle}
              onChange={handleInputChange}
              placeholder={t('altier.namePlaceholder')}
              required
            />
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="adresse">{t('altier.address')} *</label>
            <InputText
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              placeholder={t('altier.addressPlaceholder')}
              required
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default AltierPage;
