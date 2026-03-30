import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search, Phone, Mail, MapPin, Users, X } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import type {
  Client,
  ClientRequest,
} from '../types/index';
import { ClientService } from '@services/clientService';
import { Pagination } from '@components/Pagination';
import '../styles/ClientsPage.css';

export function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Form states
  const [clientForm, setClientForm] = useState<ClientRequest>({
    name: '',
    description: '',
    isActive: true,
    phones: [],
    emails: [],
    addresses: [],
    representatives: [],
  });

  const [tempPhone, setTempPhone] = useState<ClientPhoneRequest>({
    phoneNumber: '',
    isMain: false,
    phoneType: 'MOBILE',
  });

  const [tempEmail, setTempEmail] = useState<ClientEmailRequest>({
    emailAddress: '',
    isMain: false,
    emailType: 'BUSINESS',
  });

  const [tempAddress, setTempAddress] = useState<ClientAddressRequest>({
    streetAddress: '',
    city: '',
    postalCode: '',
    country: 'DZ',
    isMain: false,
    addressType: 'BUSINESS',
  });

  const [tempRep, setTempRep] = useState<ClientRepresentativeRequest>({
    name: '',
    position: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  useEffect(() => {
    loadClients(page, searchTerm);
  }, [page, searchTerm]);

  const loadClients = async (pageIndex: number, search: string) => {
    setError(null);
    try {
      const response = await ClientService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined
      });
      if (response.success && response.data) {
        setClients(response.data.items || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (err) {
      setError(t('clients.failedToLoadClients'));
      console.error(err);
    }
  };

  const handleAddClient = async () => {
    setError(null);

    if (!clientForm.name.trim()) {
      setError(t('clients.clientNameRequired'));
      return;
    }

    try {
      const response = await ClientService.create(clientForm);
      if (response.success && response.data) {
        setPage(0);
        await loadClients(0, searchTerm);
        resetForms();
        setShowAddForm(false);
      }
    } catch (err) {
      setError(t('clients.failedToCreateClient'));
      console.error(err);
    }
  };

  const handleUpdateClient = async (id: string) => {
    setError(null);

    if (!clientForm.name.trim()) {
      setError(t('clients.clientNameRequired'));
      return;
    }

    try {
      const response = await ClientService.update(id, clientForm);
      if (response.success && response.data) {
        await loadClients(page, searchTerm);
        setEditingClientId(null);
        resetForms();
      }
    } catch (err) {
      setError(t('clients.failedToUpdateClient'));
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(t('clients.deletionConfirm'))) {
      return;
    }

    try {
      const response = await ClientService.deactivate(id);
      if (response.success) {
        await loadClients(page, searchTerm);
      }
    } catch (err) {
      setError(t('clients.failedToDeleteClient'));
      console.error(err);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleAddPhone = () => {
    if (!tempPhone.phoneNumber.trim()) {
      setError(t('clients.phoneNumberRequired'));
      return;
    }

    const newPhone = { ...tempPhone };
    setClientForm(prev => ({
      ...prev,
      phones: [...(prev.phones || []), newPhone],
    }));
    setTempPhone({ phoneNumber: '', isMain: false, phoneType: 'MOBILE' });
  };

  const handleAddEmail = () => {
    if (!tempEmail.emailAddress.trim()) {
      setError(t('clients.emailAddressRequired'));
      return;
    }

    const newEmail = { ...tempEmail };
    setClientForm(prev => ({
      ...prev,
      emails: [...(prev.emails || []), newEmail],
    }));
    setTempEmail({ emailAddress: '', isMain: false, emailType: 'BUSINESS' });
  };

  const handleAddAddress = () => {
    if (!tempAddress.streetAddress.trim()) {
      setError(t('clients.streetAddressRequired'));
      return;
    }

    const newAddress = { ...tempAddress };
    setClientForm(prev => ({
      ...prev,
      addresses: [...(prev.addresses || []), newAddress],
    }));
    setTempAddress({
      streetAddress: '',
      city: '',
      postalCode: '',
      country: 'DZ',
      isMain: false,
      addressType: 'BUSINESS',
    });
  };

  const handleAddRep = () => {
    if (!tempRep.name.trim()) {
      setError(t('clients.representativeNameRequired'));
      return;
    }

    const newRep = { ...tempRep };
    setClientForm(prev => ({
      ...prev,
      representatives: [...(prev.representatives || []), newRep],
    }));
    setTempRep({ name: '', position: '', phone: '', email: '', isPrimary: false });
  };

  const handleRemovePhone = (index: number) => {
    setClientForm(prev => ({
      ...prev,
      phones: prev.phones?.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveEmail = (index: number) => {
    setClientForm(prev => ({
      ...prev,
      emails: prev.emails?.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveAddress = (index: number) => {
    setClientForm(prev => ({
      ...prev,
      addresses: prev.addresses?.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveRep = (index: number) => {
    setClientForm(prev => ({
      ...prev,
      representatives: prev.representatives?.filter((_, i) => i !== index),
    }));
  };

  const handleEditClient = (client: Client) => {
    setClientForm({
      name: client.name,
      description: client.description,
      isActive: client.isActive,
      phones: client.phones.map(p => ({
        phoneNumber: p.phoneNumber,
        isMain: p.isMain,
        phoneType: p.phoneType,
        notes: p.notes,
      })),
      emails: client.emails.map(e => ({
        emailAddress: e.emailAddress,
        isMain: e.isMain,
        emailType: e.emailType,
        notes: e.notes,
      })),
      addresses: client.addresses.map(a => ({
        streetAddress: a.streetAddress,
        city: a.city,
        postalCode: a.postalCode,
        country: a.country,
        isMain: a.isMain,
        addressType: a.addressType,
        notes: a.notes,
      })),
      representatives: client.representatives.map(r => ({
        name: r.name,
        position: r.position,
        phone: r.phone,
        email: r.email,
        isPrimary: r.isPrimary,
        notes: r.notes,
      })),
    });
    setEditingClientId(client.id);
    setExpandedClientId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForms = () => {
    setClientForm({
      name: '',
      description: '',
      isActive: true,
      phones: [],
      emails: [],
      addresses: [],
      representatives: [],
    });
    setTempPhone({ phoneNumber: '', isMain: false, phoneType: 'MOBILE' });
    setTempEmail({ emailAddress: '', isMain: false, emailType: 'BUSINESS' });
    setTempAddress({
      streetAddress: '',
      city: '',
      postalCode: '',
      country: 'DZ',
      isMain: false,
      addressType: 'BUSINESS',
    });
    setTempRep({ name: '', position: '', phone: '', email: '', isPrimary: false });
    setEditingClientId(null);
  };

  const filteredClients = clients.filter(c => c.isActive);

  return (
    <div className="clients-page">
      <div className="page-header">
        <div className="header-section">
          <h1>{t('clients.title')}</h1>
          <p className="subtitle">{t('clients.subtitle')}</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-section">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder={t('clients.searchClients')}
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Add/Edit Client Form */}
      {(showAddForm || editingClientId) && (
        <div className="form-container">
          <div className="form-header">
            <h2>{editingClientId ? t('clients.editClient') : t('clients.addClient')}</h2>
            <button
              className="btn-close"
              onClick={() => {
                resetForms();
                setShowAddForm(false);
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form className="client-form">
            {/* Basic Info */}
            <div className="form-section">
              <h3>{t('clients.clientDetails')}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.clientName')} *</label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder={t('clients.clientName')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.status')}</label>
                  <select
                    value={clientForm.isActive ? 'true' : 'false'}
                    onChange={e => setClientForm({ ...clientForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">{t('clients.active')}</option>
                    <option value="false">{t('clients.inactive')}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{t('clients.description')}</label>
                <textarea
                  value={clientForm.description || ''}
                  onChange={e => setClientForm({ ...clientForm, description: e.target.value })}
                  placeholder={t('clients.descriptionPlaceholder')}
                />
              </div>
            </div>

            {/* Phones Section */}
            <div className="form-section">
              <h3><Phone size={18} /> {t('clients.phones')}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.phoneNumber')}</label>
                  <input
                    type="tel"
                    value={tempPhone.phoneNumber}
                    onChange={e => setTempPhone({ ...tempPhone, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.phoneType')}</label>
                  <select
                    value={tempPhone.phoneType}
                    onChange={e => setTempPhone({ ...tempPhone, phoneType: e.target.value })}
                  >
                    <option value="MOBILE">{t('clients.phoneTypeMobile')}</option>
                    <option value="LANDLINE">{t('clients.phoneTypeWork')}</option>
                    <option value="OTHER">{t('clients.phoneTypeOther')}</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={tempPhone.isMain}
                      onChange={e => setTempPhone({ ...tempPhone, isMain: e.target.checked })}
                    />
                    {t('clients.isMainPhone')}
                  </label>
                </div>
                <button type="button" onClick={handleAddPhone} className="btn-add">
                  <Plus size={18} /> {t('common.add')}
                </button>
              </div>

              {clientForm.phones && clientForm.phones.length > 0 && (
                <div className="items-list">
                  {clientForm.phones.map((phone, idx) => (
                    <div key={idx} className="item">
                      <div className="item-content">
                        <strong>{phone.phoneNumber}</strong>
                        {phone.isMain && <span className="badge">{t('clients.isMainPhone')}</span>}
                        <span className="type-badge">{phone.phoneType}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(idx)}
                        className="btn-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emails Section */}
            <div className="form-section">
              <h3><Mail size={18} /> {t('clients.emails')}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.emailAddress')}</label>
                  <input
                    type="email"
                    value={tempEmail.emailAddress}
                    onChange={e => setTempEmail({ ...tempEmail, emailAddress: e.target.value })}
                    placeholder={t('clients.emailAddress')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.emailType')}</label>
                  <select
                    value={tempEmail.emailType}
                    onChange={e => setTempEmail({ ...tempEmail, emailType: e.target.value })}
                  >
                    <option value="BUSINESS">{t('clients.emailTypeWork')}</option>
                    <option value="PERSONAL">{t('clients.emailTypePersonal')}</option>
                    <option value="OTHER">{t('clients.emailTypeOther')}</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={tempEmail.isMain}
                      onChange={e => setTempEmail({ ...tempEmail, isMain: e.target.checked })}
                    />
                    {t('clients.isMainEmail')}
                  </label>
                </div>
                <button type="button" onClick={handleAddEmail} className="btn-add">
                  <Plus size={18} /> {t('common.add')}
                </button>
              </div>

              {clientForm.emails && clientForm.emails.length > 0 && (
                <div className="items-list">
                  {clientForm.emails.map((email, idx) => (
                    <div key={idx} className="item">
                      <div className="item-content">
                        <strong>{email.emailAddress}</strong>
                        {email.isMain && <span className="badge">{t('clients.isMainEmail')}</span>}
                        <span className="type-badge">{email.emailType}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(idx)}
                        className="btn-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addresses Section */}
            <div className="form-section">
              <h3><MapPin size={18} /> {t('clients.addresses')}</h3>
              <div className="form-group">
                <label>{t('clients.streetAddress')}</label>
                <input
                  type="text"
                  value={tempAddress.streetAddress}
                  onChange={e => setTempAddress({ ...tempAddress, streetAddress: e.target.value })}
                  placeholder={t('clients.streetAddressPlaceholder')}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.city')}</label>
                  <input
                    type="text"
                    value={tempAddress.city}
                    onChange={e => setTempAddress({ ...tempAddress, city: e.target.value })}
                    placeholder={t('clients.city')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.postalCode')}</label>
                  <input
                    type="text"
                    value={tempAddress.postalCode}
                    onChange={e => setTempAddress({ ...tempAddress, postalCode: e.target.value })}
                    placeholder={t('clients.postalCode')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.country')}</label>
                  <input
                    type="text"
                    value={tempAddress.country}
                    onChange={e => setTempAddress({ ...tempAddress, country: e.target.value })}
                    placeholder={t('clients.country')}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.addressType')}</label>
                  <select
                    value={tempAddress.addressType}
                    onChange={e => setTempAddress({ ...tempAddress, addressType: e.target.value })}
                  >
                    <option value="BUSINESS">{t('clients.addressTypeOffice')}</option>
                    <option value="BILLING">{t('clients.addressTypeWarehouse')}</option>
                    <option value="SHIPPING">{t('clients.addressTypeHeadquarters')}</option>
                    <option value="OTHER">{t('clients.addressTypeOther')}</option>
                  </select>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={tempAddress.isMain}
                      onChange={e => setTempAddress({ ...tempAddress, isMain: e.target.checked })}
                    />
                    {t('clients.isMainAddress')}
                  </label>
                </div>
                <button type="button" onClick={handleAddAddress} className="btn-add">
                  <Plus size={18} /> {t('common.add')}
                </button>
              </div>

              {clientForm.addresses && clientForm.addresses.length > 0 && (
                <div className="items-list">
                  {clientForm.addresses.map((addr, idx) => (
                    <div key={idx} className="item">
                      <div className="item-content">
                        <strong>{addr.streetAddress}</strong>
                        {addr.city && <span>, {addr.city}</span>}
                        {addr.isMain && <span className="badge">{t('clients.isMainAddress')}</span>}
                        <span className="type-badge">{addr.addressType}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="btn-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Representatives Section */}
            <div className="form-section">
              <h3><Users size={18} /> {t('clients.representatives')}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.representativeName')}</label>
                  <input
                    type="text"
                    value={tempRep.name}
                    onChange={e => setTempRep({ ...tempRep, name: e.target.value })}
                    placeholder={t('clients.representativeName')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.position')}</label>
                  <input
                    type="text"
                    value={tempRep.position}
                    onChange={e => setTempRep({ ...tempRep, position: e.target.value })}
                    placeholder={t('clients.position')}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('clients.representativePhone')}</label>
                  <input
                    type="tel"
                    value={tempRep.phone}
                    onChange={e => setTempRep({ ...tempRep, phone: e.target.value })}
                    placeholder={t('clients.representativePhone')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('clients.representativeEmail')}</label>
                  <input
                    type="email"
                    value={tempRep.email}
                    onChange={e => setTempRep({ ...tempRep, email: e.target.value })}
                    placeholder={t('clients.representativeEmail')}
                  />
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={tempRep.isPrimary}
                      onChange={e => setTempRep({ ...tempRep, isPrimary: e.target.checked })}
                    />
                    {t('clients.isPrimaryContact')}
                  </label>
                </div>
                <button type="button" onClick={handleAddRep} className="btn-add">
                  <Plus size={18} /> {t('common.add')}
                </button>
              </div>

              {clientForm.representatives && clientForm.representatives.length > 0 && (
                <div className="items-list">
                  {clientForm.representatives.map((rep, idx) => (
                    <div key={idx} className="item">
                      <div className="item-content">
                        <strong>{rep.name}</strong>
                        {rep.position && <span> - {rep.position}</span>}
                        {rep.isPrimary && <span className="badge">{t('clients.isPrimaryContact')}</span>}
                        {rep.phone && <span> | {rep.phone}</span>}
                        {rep.email && <span> | {rep.email}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRep(idx)}
                        className="btn-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  if (editingClientId) {
                    handleUpdateClient(editingClientId);
                  } else {
                    handleAddClient();
                  }
                }}
                className="btn-primary"
              >
                {editingClientId ? t('clients.editClient') : t('clients.addClient')}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForms();
                  setShowAddForm(false);
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients List */}
      <div className="clients-list">
        <div className="list-header">
          <h2>{t('clients.title')} ({filteredClients.length})</h2>
          <button onClick={() => setShowAddForm(true)} className="btn-primary">
            <Plus size={20} /> {t('clients.addClient')}
          </button>
        </div>

        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <p>{t('clients.noClients')}</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div className="client-info">
                  <h3>{client.name}</h3>
                  {client.description && <p className="description">{client.description}</p>}
                  <div className="contact-summary">
                    {client.phones.filter(p => p.isMain).length > 0 && (
                      <span className="summary-item">📞 {client.phones.find(p => p.isMain)?.phoneNumber}</span>
                    )}
                    {client.emails.filter(e => e.isMain).length > 0 && (
                      <span className="summary-item">📧 {client.emails.find(e => e.isMain)?.emailAddress}</span>
                    )}
                  </div>
                </div>
                <div className="client-actions">
                  <button
                    onClick={() => handleEditClient(client)}
                    className="btn-edit"
                    title={t('clients.editClient')}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="btn-delete"
                    title={t('clients.deleteClient')}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                    className="btn-toggle"
                  >
                    {expandedClientId === client.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {expandedClientId === client.id && (
                <div className="client-details">
                  {client.phones.length > 0 && (
                    <div className="details-section">
                      <h4><Phone size={16} /> {t('clients.phones')} ({client.phones.length})</h4>
                      <ul>
                        {client.phones.map(phone => (
                          <li key={phone.id}>
                            <strong>{phone.phoneNumber}</strong>
                            {phone.isMain && <span className="badge">{t('clients.isMainPhone')}</span>}
                            <span className="type-badge">{phone.phoneType}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {client.emails.length > 0 && (
                    <div className="details-section">
                      <h4><Mail size={16} /> {t('clients.emails')} ({client.emails.length})</h4>
                      <ul>
                        {client.emails.map(email => (
                          <li key={email.id}>
                            <strong>{email.emailAddress}</strong>
                            {email.isMain && <span className="badge">{t('clients.isMainEmail')}</span>}
                            <span className="type-badge">{email.emailType}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {client.addresses.length > 0 && (
                    <div className="details-section">
                      <h4><MapPin size={16} /> {t('clients.addresses')} ({client.addresses.length})</h4>
                      <ul>
                        {client.addresses.map(address => (
                          <li key={address.id}>
                            <strong>{address.streetAddress}</strong>
                            {address.city && <span>, {address.city}</span>}
                            {address.postalCode && <span> {address.postalCode}</span>}
                            {address.isMain && <span className="badge">{t('clients.isMainAddress')}</span>}
                            <span className="type-badge">{address.addressType}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {client.representatives.length > 0 && (
                    <div className="details-section">
                      <h4><Users size={16} /> {t('clients.representatives')} ({client.representatives.length})</h4>
                      <ul>
                        {client.representatives.map(rep => (
                          <li key={rep.id}>
                            <div>
                              <strong>{rep.name}</strong>
                              {rep.position && <span> - {rep.position}</span>}
                              {rep.isPrimary && <span className="badge">{t('clients.isPrimaryContact')}</span>}
                            </div>
                            <div className="rep-contact">
                              {rep.phone && <span>📞 {rep.phone}</span>}
                              {rep.email && <span>📧 {rep.email}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
