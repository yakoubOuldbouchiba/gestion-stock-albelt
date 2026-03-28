import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import type { Supplier, SupplierRequest } from '../types/index';
import { SupplierService } from '@services/supplierService';
import '../styles/SuppliersPage.css';

export function SuppliersPage() {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SupplierRequest>({
    name: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await SupplierService.getAll();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
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
        const response = await SupplierService.update(editingId, formData);
        if (response.success) {
          setSuppliers(suppliers.map(s => s.id === editingId ? response.data! : s));
          setEditingId(null);
        }
      } else {
        const response = await SupplierService.create(formData);
        if (response.success) {
          setSuppliers([...suppliers, response.data!]);
        }
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(t('messages.operationFailed'));
      console.error(err);
    }
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

    try {
      const response = await SupplierService.delete(id);
      if (response.success) {
        setSuppliers(suppliers.filter(s => s.id !== id));
      }
    } catch (err) {
      setError(t('messages.failedToDelete'));
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      contactPerson: '',
      email: '',
      phone: '',
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="page-loading">{t('messages.loading')}</div>;
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>{t('suppliers.management')}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + {t('suppliers.addNew')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="suppliers-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('suppliers.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>
        <div className="results-count">
          {filteredSuppliers.length} {filteredSuppliers.length !== 1 ? t('suppliers.plural') : t('suppliers.singular')}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? t('suppliers.editTitle') : t('suppliers.addTitle')}</h2>
            <form onSubmit={handleSubmit} className="supplier-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">{t('suppliers.companyName')} *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Supplier Inc."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactPerson">{t('suppliers.contactPerson')} *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">{t('suppliers.email')} *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., contact@supplier.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">{t('suppliers.phone')} *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., +1234567890"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address">{t('suppliers.address')} *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 123 Business Street"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">{t('suppliers.city')} *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., New York"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="country">{t('suppliers.country')} *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., USA"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? t('suppliers.updateSupplier') : t('suppliers.createSupplier')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="suppliers-grid">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="supplier-card">
              <div className="supplier-header">
                <h3>{supplier.name}</h3>
                <div className="card-actions">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(supplier)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(supplier.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div className="supplier-details">
                <div className="detail-row">
                  <span className="detail-label">{t('suppliers.contactLabel')}:</span>
                  <span className="detail-value">{supplier.contactPerson || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('suppliers.emailLabel')}:</span>
                  <a href={`mailto:${supplier.email || ''}`} className="detail-value email-link">
                    {supplier.email || 'N/A'}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('suppliers.phoneLabel')}:</span>
                  <a href={`tel:${supplier.phone || ''}`} className="detail-value phone-link">
                    {supplier.phone || 'N/A'}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('suppliers.addressLabel')}:</span>
                  <span className="detail-value">{supplier.address || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('suppliers.locationLabel')}:</span>
                  <span className="detail-value">
                    {supplier.city || 'N/A'}, {supplier.country || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="supplier-timestamps">
                <small>{t('common.created')}: {formatDate(supplier.createdAt, 'N/A')}</small>
                <small>{t('common.updated')}: {formatDate(supplier.updatedAt, 'N/A')}</small>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>{t('messages.noSuppliersFound')}</p>
            {searchTerm && (
              <p className="empty-state-hint">{t('suppliers.adjustSearch')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuppliersPage;
