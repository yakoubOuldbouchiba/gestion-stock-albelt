import { useEffect, useState } from 'react';
import { Search, Palette } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import { ColorService } from '@services/colorService';
import type { Color } from '../types/index';
import { formatDate } from '../utils/date';
import '../styles/ColorsPage.css';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const filteredColors = colors.filter((color) =>
    (color.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (color.hexCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="page-loading">{t('messages.loading')}</div>;
  }

  return (
    <div className="colors-page">
      <div className="page-header">
        <div className="page-title">
          <Palette size={28} />
          <h1>{t('navigation.colors') || 'Colors'}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + {t('common.add') || 'Add Color'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="colors-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('common.search') || 'Search'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>
        <div className="results-count">
          {filteredColors.length} {t('common.list') || 'items'}
        </div>
      </div>

      <div className="colors-table">
        <div className="colors-header">
          <div>{t('common.name') || 'Name'}</div>
          <div>{t('common.color') || 'Color'}</div>
          <div>{t('common.status') || 'Status'}</div>
          <div>{t('common.updated') || 'Updated'}</div>
          <div>{t('common.actions') || 'Actions'}</div>
        </div>
        {filteredColors.length === 0 ? (
          <div className="empty-state">
            <p>{t('messages.noData') || 'No colors found'}</p>
          </div>
        ) : (
          filteredColors.map((color) => (
            <div className="colors-row" key={color.id}>
              <div className="color-name">{color.name}</div>
              <div className="color-chip">
                <span className="chip" style={{ backgroundColor: color.hexCode }} />
                <span>{color.hexCode}</span>
              </div>
              <div>
                <span className={`status-pill ${color.isActive ? 'active' : 'inactive'}`}>
                  {color.isActive ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                </span>
              </div>
              <div>{formatDate(color.updatedAt || color.createdAt)}</div>
              <div className="row-actions">
                <button className="btn btn-sm btn-edit" onClick={() => handleEdit(color)}>
                  {t('common.edit') || 'Edit'}
                </button>
                <button className="btn btn-sm btn-delete" onClick={() => handleDelete(color.id)}>
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? (t('common.edit') || 'Edit Color') : (t('common.add') || 'Add Color')}</h2>
            <form onSubmit={handleSubmit} className="color-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t('common.name') || 'Name'} *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., PU"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="hexCode">{t('common.color') || 'Color'} *</label>
                  <input
                    type="text"
                    id="hexCode"
                    name="hexCode"
                    value={formData.hexCode}
                    onChange={handleInputChange}
                    required
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>

              <div className="form-row single">
                <label className="toggle">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>{t('common.active') || 'Active'}</span>
                </label>
                <div className="preview">
                  <span className="chip" style={{ backgroundColor: formData.hexCode }} />
                  <span>{formData.hexCode}</span>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {t('common.save') || 'Save'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorsPage;
