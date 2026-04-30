import { useNavigate } from 'react-router-dom';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useI18n } from '@hooks/useI18n';
import { CommandesWorkbenchFilters } from '../components/commande/CommandesWorkbenchFilters';
import { CommandesWorkbenchHeader } from '../components/commande/CommandesWorkbenchHeader';
import { CommandesWorkbenchOrderCard } from '../components/commande/CommandesWorkbenchOrderCard';
// import { CommandesWorkbenchWorkspace } from '../components/commande/CommandesWorkbenchWorkspace';
import { useCommandesWorkbench } from './hooks/useCommandesWorkbench';
import './CommandesListPage.css';

function CommandesListPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const workbench = useCommandesWorkbench({ t });

  return (
    <div className="page-container orders-workbench">
      <CommandesWorkbenchHeader
        t={t}
        summaryMetrics={workbench.summaryMetrics}
        onCreateOrder={() => navigate('/commandes/create')}
      />

      <CommandesWorkbenchFilters
        t={t}
        search={workbench.search}
        onSearchChange={workbench.setSearch}
        status={workbench.status}
        onStatusChange={workbench.setStatus}
        clientId={workbench.clientId}
        onClientChange={workbench.setClientId}
        clientsLoading={workbench.clientsLoading}
        statusOptions={workbench.statusOptions}
        clientOptions={workbench.clientOptions}
      />

      <div className="orders-workbench__layout orders-workbench__layout--dual">
        <section className="orders-workbench__panel">
          <div className="orders-workbench__panel-header">
            <div>
              <h2>{t('ordersWorkbench.ordersQueue', 'Orders queue')}</h2>
              <p>
                {workbench.loading
                  ? t('ordersWorkbench.loadingOrders', 'Loading orders...')
                  : `${workbench.commandes.length} ${t('ordersWorkbench.ordersOnScreen', 'orders on screen')}`}
              </p>
            </div>
          </div>

          <div className="orders-workbench__panel-body">
            {workbench.loading ? (
              <div className="orders-workbench__loading-state">
                <ProgressSpinner style={{ width: '42px', height: '42px' }} />
              </div>
            ) : workbench.commandes.length === 0 ? (
              <Message severity="info" text={t('ordersWorkbench.noOrdersMatchFilters')} />
            ) : (
              <div className="orders-workbench__stack orders-workbench__stack--scroll">
                {workbench.commandes.map((order) => (
                  <CommandesWorkbenchOrderCard
                    key={order.id}
                    t={t}
                    order={order}
                    metrics={workbench.getOrderMetrics(order)}
                    isSelected={workbench.highlightedOrder?.id === order.id}
                    onSelect={() => workbench.setSelectedOrderId(order.id)}
                    onOpenOrder={(orderId) => navigate(`/commandes/${orderId}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
{/* 
        <section className="orders-workbench__panel orders-workbench__panel--workspace">
          <div className="orders-workbench__panel-header">
            <div>
              <h2>{t('ordersWorkbench.cutWorkspace', 'Cut workspace')}</h2>
              <p>{t('ordersWorkbench.pickItem', 'Choose the item to work on next')}</p>
            </div>
          </div>

          <div className="orders-workbench__panel-body orders-workbench__panel-body--workspace">
            <CommandesWorkbenchWorkspace
              t={t}
              highlightedOrder={workbench.highlightedOrder}
              onOpenOrder={(orderId) => navigate(`/commandes/${orderId}`)}
            />
          </div>
        </section> */}
      </div>
    </div>
  );
}

export default CommandesListPage;
