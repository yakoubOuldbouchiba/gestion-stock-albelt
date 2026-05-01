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
  canEdit: boolean;
  onDelete: () => void;
  canDelete: boolean;
  onReturn: () => void;
  canReturn: boolean;
  onBack: () => void;
  t: Translate;
};

export const OrderHeaderCard = ({
  commande,
  isBusy,
  deletingOrder,
  getStatusSeverity,
  onEdit,
  canEdit,
  onDelete,
  canDelete,
  onReturn,
  onBack,
  canReturn,
  t,
}: OrderHeaderCardProps) => {

  const normalizedStatus = (commande.status || '').trim().toUpperCase();
  const isCommandeLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';

  return (
    <Card className="commande-header-card">
      <div className="commande-header-card__top">
        <div className="commande-header-card__title">
          <span className="commande-header-card__eyebrow">{t('commandes.manageOrder')}</span>
          <span className="commande-header-card__number">{commande.numeroCommande}</span>
          <div>
            <Tag value={t('statuses.' + commande.status)} severity={getStatusSeverity(commande.status)} />
          </div>
        </div>

        <div className="commande-header-card__actions">
          <Button
            icon="pi pi-pencil"
            label={t('commandes.editOrder')}
            onClick={onEdit}
            disabled={isBusy || isCommandeLocked || !canEdit}
            visible={canEdit}
          />
          <Button
            icon="pi pi-undo"
            label={t('returns.createReturn')}
            onClick={onReturn}
            disabled={isBusy || !canReturn}
            visible={canReturn}
          />
          <Button
            icon="pi pi-trash"
            label={t('commandes.deleteOrder')}
            severity="danger"
            onClick={onDelete}
            disabled={isBusy || isCommandeLocked}
            loading={deletingOrder}
            visible={canDelete}
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
