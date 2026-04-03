import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toolbar } from 'primereact/toolbar';
import { formatDate } from '../utils/date';
import { CommandeService } from '../services/commandeService';
import { ClientService } from '../services/clientService';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import type { Commande, Client, CommandeStatus } from '../types';

export function CommandesListPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useRef<Toast>(null);
  
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const { run, isLocked } = useAsyncLock();

  const statuses: CommandeStatus[] = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const statusOptions = statuses.map(s => ({ label: s, value: s }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [commandesRes, clientsRes] = await Promise.all([
          CommandeService.getAll(),
          ClientService.getAll(),
        ]);
        
        if (commandesRes.data) {
          const items = Array.isArray(commandesRes.data)
            ? commandesRes.data
            : commandesRes.data.items ?? (commandesRes.data as any).content ?? [];
          setCommandes(items);
        }
        if (clientsRes.data) {
          const items = Array.isArray(clientsRes.data)
            ? clientsRes.data
            : clientsRes.data.items ?? (clientsRes.data as any).content ?? [];
          setClients(items);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.current?.show({
          severity: 'error',
          summary: t('common.error'),
          detail: t('commandes.errorLoadingOrders'),
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const safeCommandes = Array.isArray(commandes)
    ? commandes
    : (commandes as any)?.items ?? (commandes as any)?.content ?? [];

  // Filter orders based on search and filters
  const filteredCommandes = safeCommandes.filter((commande: Commande) => {
    const matchesSearch =
      commande.numeroCommande.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commande.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || commande.status === selectedStatus;
    const matchesClient = !selectedClient || commande.clientId === selectedClient;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleCreateOrder = () => {
    navigate('/commandes/create');
  };

  const handleViewOrder = (id: string) => {
    navigate(`/commandes/${id}`);
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm(t('commandes.confirmDelete'))) {
      if (isLocked()) {
        return;
      }
      try {
        await run(async () => {
          await CommandeService.delete(id);
          setCommandes(safeCommandes.filter((c: Commande) => c.id !== id));
          toast.current?.show({
            severity: 'success',
            summary: t('common.success'),
            detail: t('commandes.orderDeleted'),
            life: 2000,
          });
        }, `commande-delete-${id}`);
      } catch (err) {
        toast.current?.show({
          severity: 'error',
          summary: t('common.error'),
          detail: t('commandes.errorDeletingOrder'),
          life: 3000,
        });
      }
    }
  };

  const statusBodyTemplate = (rowData: Commande) => {
    const statusColors: Record<CommandeStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      PENDING: 'warning',
      ENCOURS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      ON_HOLD: 'secondary',
    };
    return <Tag value={rowData.status} severity={statusColors[rowData.status] || 'secondary'} />;
  };

  const actionsBodyTemplate = (rowData: Commande) => {
    const isBusy = isLocked();
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          icon="pi pi-eye"
          rounded
          outlined
          severity="info"
          onClick={() => handleViewOrder(rowData.id)}
          tooltip={t('commandes.view')}
          disabled={isBusy}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => handleDeleteOrder(rowData.id)}
          tooltip={t('commandes.delete')}
          loading={isLocked(`commande-delete-${rowData.id}`)}
          disabled={isBusy}
        />
      </div>
    );
  };

  const toolbarStart = <span>{t('commandes.title')}</span>;
  const toolbarEnd = (
    <Button
      style={{ padding: '0.5rem 1rem' }}
      icon="pi pi-plus"
      label={t('commandes.newOrder')}
      onClick={handleCreateOrder}
      severity="success"
      disabled={isLocked()}
    />
  );

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Toast ref={toast} />
      
      <Card style={{ padding: '0.5rem 1rem' }}>
        <Toolbar start={toolbarStart} end={toolbarEnd} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
            marginBottom: '1rem',
          }}
        >
          <span className="p-input-icon-left" style={{ width: '100%' }}>
            <i className="pi pi-search" />
            <InputText
              type="text"
              placeholder={t('commandes.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' ,  padding: '0.5rem 1rem' }}
            />
          </span>

          <Dropdown
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.value)}
            options={[{ label: t('commandes.allStatuses'), value: '' }, ...statusOptions]}
            optionLabel="label"
            optionValue="value"
            placeholder={t('commandes.allStatuses')}
            style={{ width: '100%' }}
          />

          <Dropdown
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.value)}
            options={[
              { label: t('commandes.allClients'), value: '' },
              ...clients.map(c => ({ label: c.name, value: c.id }))
            ]}
            optionLabel="label"
            optionValue="value"
            placeholder={t('commandes.allClients')}
            style={{ width: '100%' }}
          />
        </div>

        {filteredCommandes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('commandes.noOrdersFound')}</p>
            <Button
              label={t('commandes.createFirstOrder')}
              icon="pi pi-plus"
              onClick={handleCreateOrder}
              severity="success"
            />
          </div>
        ) : (
          <DataTable
            value={filteredCommandes}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 20]}
            tableStyle={{ minWidth: '100%' }}
            stripedRows
            responsiveLayout="scroll"
          >
            <Column field="numeroCommande" header={t('commandes.orderNumber')} sortable />
            <Column field="clientName" header={t('commandes.client')} sortable />
            <Column
              field="status"
              header={t('commandes.status')}
              body={statusBodyTemplate}
              sortable
            />
            <Column
              field="items"
              header={t('commandes.items')}
              body={(rowData) => rowData.items?.length || 0}
              headerStyle={{ width: '10%' }}
              bodyStyle={{ textAlign: 'center' }}
            />
            <Column
              field="createdAt"
              header={t('commandes.createdDate')}
              body={(rowData) => formatDate(rowData.createdAt)}
              sortable
            />
            <Column
              body={actionsBodyTemplate}
              headerStyle={{ width: '15%' }}
              bodyStyle={{ textAlign: 'center' }}
            />
          </DataTable>
        )}
      </Card>
    </div>
  );
}

export default CommandesListPage;
