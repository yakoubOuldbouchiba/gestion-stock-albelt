import { useEffect, useState } from 'react';
import type { Altier, AltierRequest } from '../types/index';
import { AltierService } from '@services/altierService';
import { useI18n } from '@hooks/useI18n';
import '../styles/AltierPage.css';

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

  const loadAltiers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AltierService.getAll();
      if (response.success && response.data) {
        setAltiers(response.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const filteredAltiers = altiers.filter(altier =>
    altier.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    altier.adresse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="altier-page">
        <div className="loading">{t('altier.loadingData')}</div>
      </div>
    );
  }

  return (
    <div className="altier-page">
      <div className="altier-container">
        <div className="altier-header">
          <h1>{t('altier.title')}</h1>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            + {t('altier.addNew')}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <div className="altier-form-card">
            <div className="form-header">
              <h2>{editingId ? t('altier.editTitle') : t('altier.createTitle')}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="libelle">{t('altier.workshopName')} *</label>
                <input
                  type="text"
                  id="libelle"
                  name="libelle"
                  value={formData.libelle}
                  onChange={handleInputChange}
                  placeholder={t('altier.namePlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="adresse">{t('altier.address')} *</label>
                <input
                  type="text"
                  id="adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder={t('altier.addressPlaceholder')}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingId ? t('altier.update') : t('altier.create')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                >
                  {t('altier.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="search-section">
          <input
            type="text"
            placeholder={t('altier.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="altier-table">
          {filteredAltiers.length === 0 ? (
            <div className="empty-state">
              <p>{t('altier.notFound')} {!searchTerm && t('altier.noWorkshops')}</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('altier.tableName')}</th>
                  <th>{t('altier.tableAddress')}</th>
                  <th>{t('altier.tableCreated')}</th>
                  <th>{t('altier.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAltiers.map(altier => (
                  <tr key={altier.id}>
                    <td className="libelle-cell">{altier.libelle}</td>
                    <td className="adresse-cell">{altier.adresse}</td>
                    <td className="date-cell">
                      {new Date(altier.createdAt).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleEdit(altier)}
                      >
                        {t('altier.edit')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(altier.id)}
                      >
                        {t('altier.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="altier-stats">
          <div className="stat-card">
            <p className="stat-label">{t('altier.totalWorkshops')}</p>
            <p className="stat-value">{altiers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
