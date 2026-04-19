import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { CommandeService } from '../services/commandeService';
import { ClientService } from '../services/clientService';
import { formatDate } from '../utils/date';
import { useI18n } from '@hooks/useI18n';
import type { Commande, CommandeStatus, Client } from '../types';
import { PrimeReactDropdown } from '../components';
import './CommandesListPage.css';



function CommandesListPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CommandeStatus | ''>('');
  const [clientId, setClientId] = useState<string | ''>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  // Fetch clients for dropdown
  useEffect(() => {
    setClientsLoading(true);
    ClientService.getAllActive()
      .then((res) => setClients(res.data || []))
      .finally(() => setClientsLoading(false));
  }, []);

  // Fetch commandes with filters
  useEffect(() => {
    setLoading(true);
    CommandeService.getAll({
      search: search || undefined,
      status: status || undefined,
      clientId: clientId || undefined,
    })
      .then((response) => setCommandes(response.data?.items ?? []))
      .finally(() => setLoading(false));
  }, [search, status, clientId]);

  // Status options
  const statusOptions = [
    { label: t('orders.status.all', 'All'), value: '' },
    { label: t('orders.status.PENDING', 'Pending'), value: 'PENDING' },
    { label: t('orders.status.ENCOURS', 'In Progress'), value: 'ENCOURS' },
    { label: t('orders.status.COMPLETED', 'Completed'), value: 'COMPLETED' },
    { label: t('orders.status.CANCELLED', 'Cancelled'), value: 'CANCELLED' },
    { label: t('orders.status.ON_HOLD', 'On Hold'), value: 'ON_HOLD' },
  ];

  // Client options
  const clientOptions = [
    { label: t('orders.client.all', 'All Clients'), value: '' },
    ...clients.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div className="page-container orders-workbench">
      <div className="orders-workbench__hero">
        <Button
          icon="pi pi-plus"
          label={t('ordersWorkbench.newOrder')}
          severity="success"
          onClick={() => navigate('/commandes/create')}
        />
      </div>
      <Card className="orders-workbench__filters-card">
        <div className="orders-workbench__filters" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span className="p-input-icon-left orders-workbench__search">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('ordersWorkbench.searchOrderNumberOrClient')}
            />
          </span>
          <PrimeReactDropdown
            options={statusOptions}
            value={status}
            onChange={e => setStatus(e.value)}
            placeholder={t('ordersWorkbench.statusFilter', 'Status')}
            label={t('ordersWorkbench.statusFilter', 'Status')}
            className="orders-workbench__filter-dropdown"
          />
          <PrimeReactDropdown
            options={clientOptions}
            value={clientId}
            onChange={e => setClientId(e.value)}
            placeholder={t('ordersWorkbench.clientFilter', 'Client')}
            label={t('ordersWorkbench.clientFilter', 'Client')}
            isLoading={clientsLoading}
            className="orders-workbench__filter-dropdown"
          />
        </div>
      </Card>
      <div className="orders-workbench__layout">
        <section className="orders-workbench__panel">
          <div className="orders-workbench__panel-header">
            <h2>{t('ordersWorkbench.ordersQueue')}</h2>
            <p>{loading ? t('ordersWorkbench.loadingOrders') : `${commandes.length} ${t('ordersWorkbench.ordersOnScreen')}`}</p>
          </div>
          <div className="orders-workbench__panel-body">
            {loading ? (
              <div className="orders-workbench__loading-state">
                <ProgressSpinner style={{ width: '42px', height: '42px' }} />
              </div>
            ) : commandes.length === 0 ? (
              <Message severity="info" text={t('ordersWorkbench.noOrdersMatchFilters')} />
            ) : (
              <div className="orders-workbench__stack orders-workbench__stack--scroll" style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
                {commandes.map(order => {
                  // Status color mapping
                  const statusSeverity: Record<string, string> = {
                    PENDING: 'warning',
                    ENCOURS: 'info',
                    COMPLETED: 'success',
                    CANCELLED: 'danger',
                    ON_HOLD: 'secondary',
                  };
                  return (
                    <Card key={order.id} className="orders-workbench__order-card">
                      <div className="orders-workbench__card-topline">
                        <strong>{order.numeroCommande}</strong>
                        <Tag value={order.status} severity={statusSeverity[order.status] || undefined} />
                      </div>
                      <div className="orders-workbench__card-subline">
                        <span>{order.clientName}</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <Button
                        icon="pi pi-external-link"
                        label={t('ordersWorkbench.openFullOrder')}
                        severity="secondary"
                        outlined
                        onClick={() => navigate(`/commandes/${order.id}`)}
                      />
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CommandesListPage;
