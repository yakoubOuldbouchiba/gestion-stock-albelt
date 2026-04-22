import { useEffect, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import type {
  Client,
  ClientRequest,
  ClientPhoneRequest,
  ClientEmailRequest,
  ClientAddressRequest,
  ClientRepresentativeRequest,
} from '../types/index';
import { ClientService } from '@services/clientService';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { PageHeader } from '../components/PageHeader';

export function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { run, isLocked } = useAsyncLock();
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
    setLoading(true);
    try {
      const response = await ClientService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined
      });
      if (response.success && response.data) {
        setClients(response.data.items || []);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (err) {
      setError(t('clients.failedToLoadClients'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    setError(null);
    if (isLocked('client-save')) {
      return;
    }

    if (!clientForm.name.trim()) {
      setError(t('clients.clientNameRequired'));
      return;
    }

    try {
      await run(async () => {
        const response = await ClientService.create(clientForm);
        if (response.success && response.data) {
          setPage(0);
          await loadClients(0, searchTerm);
          resetForms();
          setShowForm(false);
        }
      }, 'client-save');
    } catch (err) {
      setError(t('clients.failedToCreateClient'));
      console.error(err);
    }
  };

  const handleUpdateClient = async (id: string) => {
    setError(null);
    if (isLocked('client-save')) {
      return;
    }

    if (!clientForm.name.trim()) {
      setError(t('clients.clientNameRequired'));
      return;
    }

    try {
      await run(async () => {
        const response = await ClientService.update(id, clientForm);
        if (response.success && response.data) {
          await loadClients(page, searchTerm);
          setEditingClientId(null);
          resetForms();
          setShowForm(false);
        }
      }, 'client-save');
    } catch (err) {
      setError(t('clients.failedToUpdateClient'));
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm(t('clients.deletionConfirm'))) {
      return;
    }
    if (isLocked()) {
      return;
    }
    try {
      await run(async () => {
        const response = await ClientService.deactivate(id);
        if (response.success) {
          await loadClients(page, searchTerm);
        }
      }, `client-delete-${id}`);
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
    setShowForm(true);
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

  const statusOptions = [
    { label: t('clients.active'), value: true },
    { label: t('clients.inactive'), value: false },
  ];

  const isSaving = isLocked('client-save');
  const isBusy = isLocked();

  const phoneTypeOptions = [
    { label: t('clients.phoneTypeMobile'), value: 'MOBILE' },
    { label: t('clients.phoneTypeWork'), value: 'LANDLINE' },
    { label: t('clients.phoneTypeOther'), value: 'OTHER' },
  ];

  const emailTypeOptions = [
    { label: t('clients.emailTypeWork'), value: 'BUSINESS' },
    { label: t('clients.emailTypePersonal'), value: 'PERSONAL' },
    { label: t('clients.emailTypeOther'), value: 'OTHER' },
  ];

  const addressTypeOptions = [
    { label: t('clients.addressTypeOffice'), value: 'BUSINESS' },
    { label: t('clients.addressTypeWarehouse'), value: 'BILLING' },
    { label: t('clients.addressTypeHeadquarters'), value: 'SHIPPING' },
    { label: t('clients.addressTypeOther'), value: 'OTHER' },
  ];

  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button
        type="button"
        label={t('common.cancel')}
        severity="secondary"
        onClick={() => {
          resetForms();
          setShowForm(false);
        }}
        disabled={isSaving}
      />
      <Button
        type="button"
        label={editingClientId ? t('clients.editClient') : t('clients.addClient')}
        onClick={() => {
          if (editingClientId) {
            handleUpdateClient(editingClientId);
          } else {
            handleAddClient();
          }
        }}
        loading={isSaving}
        disabled={isSaving}
      />
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        actions={<Button icon="pi pi-plus" label={t('clients.addClient')} onClick={() => setShowForm(true)} disabled={isBusy} />}
      />

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '420px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={handleSearch}
            placeholder={t('clients.searchClients')}
            style={{ width: '100%' }}
          />
        </span>
      </div>

      <DataTable
        value={clients}
        dataKey="id"
        lazy
        paginator
        first={page * pageSize}
        rows={pageSize}
        totalRecords={totalElements}
        onPage={(e) => setPage(e.page ?? 0)}
        emptyMessage={t('clients.noClients')}
        size="small"
      >
        <Column field="name" header={t('clients.clientName')} />
        <Column field="description" header={t('clients.description')} body={(row: Client) => row.description || t('common.dash')} />
        <Column
          header={t('clients.phoneNumber')}
          body={(row: Client) => row.phones?.find((p) => p.isMain)?.phoneNumber || t('common.dash')}
        />
        <Column
          header={t('clients.emailAddress')}
          body={(row: Client) => row.emails?.find((e) => e.isMain)?.emailAddress || t('common.dash')}
        />
        <Column
          header={t('clients.status')}
          body={(row: Client) => (
            <Tag value={row.isActive ? t('clients.active') : t('clients.inactive')} severity={row.isActive ? 'success' : 'secondary'} />
          )}
        />
        <Column
          header={t('common.action')}
          body={(row: Client) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button icon="pi pi-eye" text onClick={() => setDetailClient(row)} aria-label={t('common.view')} disabled={isBusy} />
              <Button icon="pi pi-pencil" text onClick={() => handleEditClient(row)} aria-label={t('clients.editClient')} disabled={isBusy} />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                onClick={() => handleDeleteClient(row.id)}
                aria-label={t('clients.deleteClient')}
                loading={isLocked(`client-delete-${row.id}`)}
                disabled={isBusy}
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={editingClientId ? t('clients.editClient') : t('clients.addClient')}
        visible={showForm}
        onHide={() => {
          resetForms();
          setShowForm(false);
        }}
        footer={formFooter}
        style={{ width: 'min(900px, 95vw)' }}
      >
        <form style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('clients.clientDetails')}</h3>
            <div className="albel-grid albel-grid--min220" style={{ gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.clientName')} *</label>
                <InputText
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.status')}</label>
                <Dropdown
                  value={clientForm.isActive}
                  options={statusOptions}
                  onChange={(e) => setClientForm({ ...clientForm, isActive: !!e.value })}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label>{t('clients.description')}</label>
              <InputTextarea
                value={clientForm.description || ''}
                onChange={(e) => setClientForm({ ...clientForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('clients.phones')}</h3>
            <div className="albel-grid albel-grid--min180" style={{ gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.phoneNumber')}</label>
                <InputText value={tempPhone.phoneNumber} onChange={(e) => setTempPhone({ ...tempPhone, phoneNumber: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.phoneType')}</label>
                <Dropdown value={tempPhone.phoneType} options={phoneTypeOptions} onChange={(e) => setTempPhone({ ...tempPhone, phoneType: e.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox checked={!!tempPhone.isMain} onChange={(e) => setTempPhone({ ...tempPhone, isMain: !!e.checked })} />
                <label>{t('clients.isMainPhone')}</label>
              </div>
              <Button icon="pi pi-plus" label={t('common.add')} onClick={handleAddPhone} disabled={isSaving} />
            </div>
            {clientForm.phones && clientForm.phones.length > 0 && (
              <DataTable value={clientForm.phones} size="small">
                <Column field="phoneNumber" header={t('clients.phoneNumber')} />
                <Column header={t('clients.phoneType')} body={(row: ClientPhoneRequest) => <Tag value={row.phoneType} />} />
                <Column header={t('clients.isMainPhone')} body={(row: ClientPhoneRequest) => (row.isMain ? <Tag value={t('clients.isMainPhone')} severity="success" /> : t('common.dash'))} />
                <Column body={(_, { rowIndex }) => (
                  <Button icon="pi pi-trash" text severity="danger" onClick={() => handleRemovePhone(rowIndex)} disabled={isSaving} />
                )} />
              </DataTable>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('clients.emails')}</h3>
            <div className="albel-grid albel-grid--min180" style={{ gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.emailAddress')}</label>
                <InputText value={tempEmail.emailAddress} onChange={(e) => setTempEmail({ ...tempEmail, emailAddress: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.emailType')}</label>
                <Dropdown value={tempEmail.emailType} options={emailTypeOptions} onChange={(e) => setTempEmail({ ...tempEmail, emailType: e.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox checked={!!tempEmail.isMain} onChange={(e) => setTempEmail({ ...tempEmail, isMain: !!e.checked })} />
                <label>{t('clients.isMainEmail')}</label>
              </div>
              <Button icon="pi pi-plus" label={t('common.add')} onClick={handleAddEmail} disabled={isSaving} />
            </div>
            {clientForm.emails && clientForm.emails.length > 0 && (
              <DataTable value={clientForm.emails} size="small">
                <Column field="emailAddress" header={t('clients.emailAddress')} />
                <Column header={t('clients.emailType')} body={(row: ClientEmailRequest) => <Tag value={row.emailType} />} />
                <Column header={t('clients.isMainEmail')} body={(row: ClientEmailRequest) => (row.isMain ? <Tag value={t('clients.isMainEmail')} severity="success" /> : t('common.dash'))} />
                <Column body={(_, { rowIndex }) => (
                  <Button icon="pi pi-trash" text severity="danger" onClick={() => handleRemoveEmail(rowIndex)} disabled={isSaving} />
                )} />
              </DataTable>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('clients.addresses')}</h3>
            <div className="albel-grid albel-grid--min180" style={{ gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.streetAddress')}</label>
                <InputText value={tempAddress.streetAddress} onChange={(e) => setTempAddress({ ...tempAddress, streetAddress: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.city')}</label>
                <InputText value={tempAddress.city} onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.postalCode')}</label>
                <InputText value={tempAddress.postalCode} onChange={(e) => setTempAddress({ ...tempAddress, postalCode: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.country')}</label>
                <InputText value={tempAddress.country} onChange={(e) => setTempAddress({ ...tempAddress, country: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.addressType')}</label>
                <Dropdown value={tempAddress.addressType} options={addressTypeOptions} onChange={(e) => setTempAddress({ ...tempAddress, addressType: e.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox checked={!!tempAddress.isMain} onChange={(e) => setTempAddress({ ...tempAddress, isMain: !!e.checked })} />
                <label>{t('clients.isMainAddress')}</label>
              </div>
              <Button icon="pi pi-plus" label={t('common.add')} onClick={handleAddAddress} disabled={isSaving} />
            </div>
            {clientForm.addresses && clientForm.addresses.length > 0 && (
              <DataTable value={clientForm.addresses} size="small">
                <Column field="streetAddress" header={t('clients.streetAddress')} />
                <Column field="city" header={t('clients.city')} />
                <Column field="postalCode" header={t('clients.postalCode')} />
                <Column field="country" header={t('clients.country')} />
                <Column header={t('clients.addressType')} body={(row: ClientAddressRequest) => <Tag value={row.addressType} />} />
                <Column header={t('clients.isMainAddress')} body={(row: ClientAddressRequest) => (row.isMain ? <Tag value={t('clients.isMainAddress')} severity="success" /> : t('common.dash'))} />
                <Column body={(_, { rowIndex }) => (
                  <Button icon="pi pi-trash" text severity="danger" onClick={() => handleRemoveAddress(rowIndex)} disabled={isSaving} />
                )} />
              </DataTable>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>{t('clients.representatives')}</h3>
            <div className="albel-grid albel-grid--min180" style={{ gap: '1rem', alignItems: 'end' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.representativeName')}</label>
                <InputText value={tempRep.name} onChange={(e) => setTempRep({ ...tempRep, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.position')}</label>
                <InputText value={tempRep.position} onChange={(e) => setTempRep({ ...tempRep, position: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.representativePhone')}</label>
                <InputText value={tempRep.phone} onChange={(e) => setTempRep({ ...tempRep, phone: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <label>{t('clients.representativeEmail')}</label>
                <InputText value={tempRep.email} onChange={(e) => setTempRep({ ...tempRep, email: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkbox checked={!!tempRep.isPrimary} onChange={(e) => setTempRep({ ...tempRep, isPrimary: !!e.checked })} />
                <label>{t('clients.isPrimaryContact')}</label>
              </div>
              <Button icon="pi pi-plus" label={t('common.add')} onClick={handleAddRep} disabled={isSaving} />
            </div>
            {clientForm.representatives && clientForm.representatives.length > 0 && (
              <DataTable value={clientForm.representatives} size="small">
                <Column field="name" header={t('clients.representativeName')} />
                <Column field="position" header={t('clients.position')} />
                <Column field="phone" header={t('clients.representativePhone')} />
                <Column field="email" header={t('clients.representativeEmail')} />
                <Column header={t('clients.isPrimaryContact')} body={(row: ClientRepresentativeRequest) => (row.isPrimary ? <Tag value={t('clients.isPrimaryContact')} severity="success" /> : t('common.dash'))} />
                <Column body={(_, { rowIndex }) => (
                  <Button icon="pi pi-trash" text severity="danger" onClick={() => handleRemoveRep(rowIndex)} disabled={isSaving} />
                )} />
              </DataTable>
            )}
          </div>
        </form>
      </Dialog>

      <Dialog
        header={detailClient?.name || ''}
        visible={!!detailClient}
        onHide={() => setDetailClient(null)}
        style={{ width: 'min(800px, 95vw)' }}
      >
        {detailClient && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {detailClient.description && <div>{detailClient.description}</div>}
            {detailClient.phones?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('clients.phones')}</h4>
                <DataTable value={detailClient.phones} size="small">
                  <Column field="phoneNumber" header={t('clients.phoneNumber')} />
                  <Column header={t('clients.phoneType')} body={(row) => <Tag value={row.phoneType} />} />
                  <Column header={t('clients.isMainPhone')} body={(row) => (row.isMain ? <Tag value={t('clients.isMainPhone')} severity="success" /> : t('common.dash'))} />
                </DataTable>
              </div>
            )}
            {detailClient.emails?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('clients.emails')}</h4>
                <DataTable value={detailClient.emails} size="small">
                  <Column field="emailAddress" header={t('clients.emailAddress')} />
                  <Column header={t('clients.emailType')} body={(row) => <Tag value={row.emailType} />} />
                  <Column header={t('clients.isMainEmail')} body={(row) => (row.isMain ? <Tag value={t('clients.isMainEmail')} severity="success" /> : t('common.dash'))} />
                </DataTable>
              </div>
            )}
            {detailClient.addresses?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('clients.addresses')}</h4>
                <DataTable value={detailClient.addresses} size="small">
                  <Column field="streetAddress" header={t('clients.streetAddress')} />
                  <Column field="city" header={t('clients.city')} />
                  <Column field="postalCode" header={t('clients.postalCode')} />
                  <Column field="country" header={t('clients.country')} />
                  <Column header={t('clients.addressType')} body={(row) => <Tag value={row.addressType} />} />
                  <Column header={t('clients.isMainAddress')} body={(row) => (row.isMain ? <Tag value={t('clients.isMainAddress')} severity="success" /> : t('common.dash'))} />
                </DataTable>
              </div>
            )}
            {detailClient.representatives?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('clients.representatives')}</h4>
                <DataTable value={detailClient.representatives} size="small">
                  <Column field="name" header={t('clients.representativeName')} />
                  <Column field="position" header={t('clients.position')} />
                  <Column field="phone" header={t('clients.representativePhone')} />
                  <Column field="email" header={t('clients.representativeEmail')} />
                  <Column header={t('clients.isPrimaryContact')} body={(row) => (row.isPrimary ? <Tag value={t('clients.isPrimaryContact')} severity="success" /> : t('common.dash'))} />
                </DataTable>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default ClientsPage;
