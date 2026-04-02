import { useEffect, useMemo, useState } from 'react';
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

export function AltierPage() {
  const { t } = useI18n();
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<AltierRequest>({
    libelle: '',
    adresse: '',
  });

  useEffect(() => {
    loadAltiers();
  }, []);

  const toArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.content ?? [];
  };

  const loadAltiers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AltierService.getAll();
      if (response.success && response.data) {
        setAltiers(toArray<Altier>(response.data));
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

    try {
      if (editingId) {
        const response = await AltierService.update(editingId, formData);
        if (response.success) {
          setAltiers(altiers.map(a => a.id === editingId ? response.data! : a));
          setEditingId(null);
        }
      } else {
        const response = await AltierService.create(formData);
        if (response.success) {
          setAltiers([...altiers, response.data!]);
        }
      }
      resetForm();
      setShowForm(false);
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

    try {
      const response = await AltierService.delete(id);
      if (response.success) {
        setAltiers(altiers.filter(a => a.id !== id));
      }
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

  const safeAltiers = toArray<Altier>(altiers);
  const filteredAltiers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return safeAltiers;
    return safeAltiers.filter((altier) =>
      altier.libelle.toLowerCase().includes(query) ||
      altier.adresse.toLowerCase().includes(query)
    );
  }, [safeAltiers, searchTerm]);

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button
        type="button"
        label={t('altier.cancel')}
        severity="secondary"
        onClick={handleCancel}
      />
      <Button
        type="button"
        label={editingId ? t('altier.update') : t('altier.create')}
        onClick={() => handleSubmit()}
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
          <h1 style={{ margin: 0 }}>{t('altier.title')}</h1>
          <div style={{ color: 'var(--text-color-secondary)' }}>{t('altier.totalWorkshops')}: {altiers.length}</div>
        </div>
        <Button icon="pi pi-plus" label={t('altier.addNew')} onClick={() => setShowForm(true)} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '420px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('altier.searchPlaceholder')}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable
        value={filteredAltiers}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
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
              <Button icon="pi pi-pencil" text onClick={() => handleEdit(row)} aria-label={t('altier.edit')} />
              <Button icon="pi pi-trash" text severity="danger" onClick={() => handleDelete(row.id)} aria-label={t('altier.delete')} />
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
