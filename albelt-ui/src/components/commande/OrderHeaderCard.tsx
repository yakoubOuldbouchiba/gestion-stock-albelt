import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import type { Commande } from '../../types';
import type { StatusSeverity, Translate } from './commandeTypes';

type OrderHeaderCardProps = {
  commande: Commande;
  isBusy: boolean;
  deletingOrder: boolean;
  getStatusSeverity: (status: string) => StatusSeverity;
  onEdit: () => void;
  onDelete: () => void;
  onReturn: () => void;
  onBack: () => void;
  t: Translate;
};

export const OrderHeaderCard = ({
  commande,
  isBusy,
  deletingOrder,
  getStatusSeverity,
  onEdit,
  onDelete,
  onReturn,
  onBack,
  t,
}: OrderHeaderCardProps) => {
  const normalizedStatus = (commande.status || '').trim().toUpperCase();
  const isCommandeLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';

  return (
  <Card style={{ marginBottom: '1rem' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{commande.numeroCommande}</span>
        <Tag value={t('commandes.statuses.' + commande.status)} severity={getStatusSeverity(commande.status)} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button
          icon="pi pi-pencil"
          label={t('commandes.editOrder')}
          onClick={onEdit}
          disabled={isBusy || isCommandeLocked}
        />
        <Button
          icon="pi pi-undo"
          label={t('returns.createReturn')}
          onClick={onReturn}
          disabled={isBusy || isCommandeLocked}
        />
        <Button
          icon="pi pi-trash"
          label={t('commandes.deleteOrder')}
          severity="danger"
          onClick={onDelete}
          disabled={isBusy || isCommandeLocked}
          loading={deletingOrder}
        />
        <Button
          icon="pi pi-arrow-left"
          label={t('commandes.backButton')}
          severity="secondary"
          outlined
          onClick={onBack}
          disabled={isBusy}
        />
      </div>
    </div>
  </Card>
  );
};
