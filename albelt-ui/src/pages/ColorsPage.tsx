import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import { ColorService } from '@services/colorService';
import type { Color } from '../types/index';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

interface ColorFormData {
  name: string;
  hexCode: string;
  isActive: boolean;
}

const defaultForm: ColorFormData = {
  name: '',
  hexCode: '#000000',
  isActive: true,
};

export function ColorsPage() {
  const { t } = useI18n();
  const [colors, setColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ColorFormData>(defaultForm);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ColorService.getAll();
      if (response.success && response.data) {
        setColors(response.data);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    try {
      if (editingId) {
        const response = await ColorService.update(editingId, formData);
        if (response.success && response.data) {
          setColors(colors.map((c) => (c.id === editingId ? response.data! : c)));
          setEditingId(null);
        }
      } else {
        const response = await ColorService.create(formData as any);
        if (response.success && response.data) {
          setColors([...colors, response.data!]);
        }
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(t('messages.operationFailed'));
      console.error(err);
    }
  };

  const handleEdit = (color: Color) => {
    setFormData({
      name: color.name || '',
      hexCode: color.hexCode || '#000000',
      isActive: color.isActive ?? true,
    });
    setEditingId(color.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }

    try {
      const response = await ColorService.delete(id);
      if (response.success) {
        setColors(colors.filter((c) => c.id !== id));
      }
    } catch (err) {
      setError(t('messages.failedToDelete'));
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredColors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return colors;
    return colors.filter((color) =>
      (color.name || '').toLowerCase().includes(query) ||
      (color.hexCode || '').toLowerCase().includes(query)
    );
  }, [colors, searchTerm]);

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button type="button" label={t('common.cancel') || 'Cancel'} severity="secondary" onClick={handleCancel} />
      <Button type="button" label={t('common.save') || 'Save'} onClick={() => handleSubmit()} />
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
          <h1 style={{ margin: 0 }}>{t('navigation.colors') || 'Colors'}</h1>
          <div style={{ color: 'var(--text-color-secondary)' }}>{filteredColors.length} {t('common.list') || 'items'}</div>
        </div>
        <Button icon="pi pi-plus" label={t('common.add') || 'Add Color'} onClick={() => setShowForm(true)} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '420px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search') || 'Search'}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable value={filteredColors} dataKey="id" paginator rows={10} rowsPerPageOptions={[10, 25, 50]} emptyMessage={t('messages.noData')} size="small">
        <Column field="name" header={t('common.name') || 'Name'} />
        <Column
          header={t('common.color') || 'Color'}
          body={(row: Color) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: row.hexCode, border: '1px solid var(--surface-border)' }} />
              <span>{row.hexCode}</span>
            </div>
          )}
        />
        <Column
          header={t('common.status') || 'Status'}
          body={(row: Color) => (
            <Tag value={row.isActive ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')} severity={row.isActive ? 'success' : 'secondary'} />
          )}
        />
        <Column header={t('common.updated') || 'Updated'} body={(row: Color) => formatDate(row.updatedAt || row.createdAt)} />
        <Column
          header={t('common.actions') || 'Actions'}
          body={(row: Color) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button icon="pi pi-pencil" text onClick={() => handleEdit(row)} aria-label={t('common.edit') || 'Edit'} />
              <Button icon="pi pi-trash" text severity="danger" onClick={() => handleDelete(row.id)} aria-label={t('common.delete') || 'Delete'} />
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={editingId ? (t('common.edit') || 'Edit Color') : (t('common.add') || 'Add Color')}
        visible={showForm}
        onHide={handleCancel}
        footer={formFooter}
        style={{ width: 'min(600px, 95vw)' }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="name">{t('common.name') || 'Name'} *</label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <label htmlFor="hexCode">{t('common.color') || 'Color'} *</label>
            <InputText
              id="hexCode"
              name="hexCode"
              value={formData.hexCode}
              onChange={handleInputChange}
              required
              pattern="^#[0-9A-Fa-f]{6}$"
              placeholder="#RRGGBB"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Checkbox
              inputId="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: !!e.checked }))}
            />
            <label htmlFor="isActive">{t('common.active') || 'Active'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: formData.hexCode, border: '1px solid var(--surface-border)' }} />
              <span>{formData.hexCode}</span>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default ColorsPage;
