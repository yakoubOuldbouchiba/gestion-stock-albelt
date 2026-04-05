import { Card } from 'primereact/card';
import { formatDateTime } from '../../utils/date';
import type { Commande } from '../../types';
import type { Translate } from './commandeTypes';

type OrderInfoCardProps = {
  commande: Commande;
  t: Translate;
};

export const OrderInfoCard = ({ commande, t }: OrderInfoCardProps) => (
  <Card title={t('commandes.orderInformation')} style={{ marginBottom: '1rem' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
      }}
    >
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.orderNumber')}</div>
        <div>{commande.numeroCommande}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.client')}</div>
        <div>{commande.clientName}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdBy')}</div>
        <div>{commande.createdByName || t('commandes.notAvailable')}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.createdDate')}</div>
        <div>{formatDateTime(commande.createdAt)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.totalItems')}</div>
        <div>{commande.items?.length || 0}</div>
      </div>
    </div>

    {commande.description && (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.description')}</div>
        <div>{commande.description}</div>
      </div>
    )}

    {commande.notes && (
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('commandes.notes')}</div>
        <div>{commande.notes}</div>
      </div>
    )}
  </Card>
);
