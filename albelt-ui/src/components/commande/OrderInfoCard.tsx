import { Card } from 'primereact/card';
import { formatDateTime } from '../../utils/date';
import type { Commande } from '../../types';
import type { Translate } from './commandeTypes';

type OrderInfoCardProps = {
  commande: Commande;
  t: Translate;
};

export const OrderInfoCard = ({ commande, t }: OrderInfoCardProps) => (
  <Card className="commande-info-card" title={t('commandes.orderInformation')}>
    <div
      className="albel-grid albel-grid--min220"
      style={{ gap: '1rem' }}
    >
      <div>
        <div className="commande-info-card__label">{t('commandes.orderNumber')}</div>
        <div>{commande.numeroCommande}</div>
      </div>
      <div>
        <div className="commande-info-card__label">{t('commandes.client')}</div>
        <div>{commande.clientName}</div>
      </div>
      <div>
        <div className="commande-info-card__label">{t('commandes.createdBy')}</div>
        <div>{commande.createdByName || t('commandes.notAvailable')}</div>
      </div>
      <div>
        <div className="commande-info-card__label">{t('commandes.createdDate')}</div>
        <div>{formatDateTime(commande.createdAt)}</div>
      </div>
      <div>
        <div className="commande-info-card__label">{t('commandes.totalItems')}</div>
        <div>{commande.items?.length || 0}</div>
      </div>
      <div>
        <div className="commande-info-card__label">{t('rollDetail.workshop')}</div>
        <div>{commande.altierLibelle || t('rollDetail.unassigned')}</div>
      </div>
    </div>

    {commande.description && (
      <div className="commande-info-card__description">
        <div className="commande-info-card__label">{t('commandes.description')}</div>
        <div>{commande.description}</div>
      </div>
    )}

    {commande.notes && (
      <div className="commande-info-card__description">
        <div className="commande-info-card__label">{t('commandes.notes')}</div>
        <div>{commande.notes}</div>
      </div>
    )}
  </Card>
);
