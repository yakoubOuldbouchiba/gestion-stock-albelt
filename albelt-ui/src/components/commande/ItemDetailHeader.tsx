import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import type { CommandeItem, ItemStatus } from '../../types';
import { useI18n } from '@hooks/useI18n';

interface ItemDetailHeaderProps {
  selectedItem: CommandeItem;
  itemStatusOptions: { label: string; value: string }[];
  isBusy: boolean;
  isCommandeLocked: boolean;
  deletingItemId: string | null;
  selectedItemProgress: any;
  selectedActualSources: any;
  selectedSuggestedSources: any;
  handleItemStatusUpdate: (id: string, status: ItemStatus) => void;
  handleDeleteItem: (id: string) => void;
  getItemDisplayLabel: (item: CommandeItem) => string;
  getContrastTextColor: (hexColor?: string) => string;
  getStatusSeverity: (status: string) => any;
}

export function ItemDetailHeader({
  selectedItem,
  itemStatusOptions,
  isBusy,
  isCommandeLocked,
  deletingItemId,
  selectedItemProgress,
  selectedActualSources,
  selectedSuggestedSources,
  handleItemStatusUpdate,
  handleDeleteItem,
  getItemDisplayLabel,
  getContrastTextColor,
  getStatusSeverity,
}: ItemDetailHeaderProps) {
  const { t } = useI18n();

  return (
    <>
      <div className="commande-detail-main__hero">
        <div className="commande-detail-main__hero-copy">
          <span className="commande-detail-main__eyebrow">{t('commandes.selectedItem')}</span>
          <h2>{getItemDisplayLabel(selectedItem)}</h2>
          <p>{t('commandes.operatorsCanVerify')}</p>
        </div>

        <div className="commande-detail-main__hero-actions">
          <Dropdown
            value={selectedItem.status}
            options={itemStatusOptions}
            onChange={(e) => handleItemStatusUpdate(selectedItem.id, e.value as ItemStatus)}
            className="commande-detail-main__status-dropdown"
            disabled={isBusy || isCommandeLocked}
          />
          <Button
            icon="pi pi-trash"
            label={t('commandes.delete')}
            severity="danger"
            outlined
            onClick={() => handleDeleteItem(selectedItem.id)}
            disabled={isBusy || isCommandeLocked}
            loading={deletingItemId === selectedItem.id}
          />
        </div>
      </div>

      <div className="commande-detail-main__pills">
        <span
          className="commande-detail-main__material-pill"
          style={{
            backgroundColor: selectedItem.colorHexCode || '#f4efe5',
            color: getContrastTextColor(selectedItem.colorHexCode),
          }}
        >
          {selectedItem.materialType} • {selectedItem.nbPlis}P • {selectedItem.thicknessMm} {t('commandes.mm')}
        </span>
        <Tag value={selectedItem.typeMouvement} severity="info" />
        <Tag
          value={t(`statuses.${selectedItem.status}`)}
          severity={getStatusSeverity(selectedItem.status)}
        />
      </div>

      <div className="commande-detail-main__stats-grid">
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.piecesOrdered')}</span>
          <strong>{selectedItem.quantite}</strong>
        </div>
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.produced')}</span>
          <strong>{selectedItemProgress?.produced ?? 0}</strong>
        </div>
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.stillToCut')}</span>
          <strong>{selectedItemProgress?.remaining ?? 0}</strong>
        </div>
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.currentMaterialUsed')}</span>
          <strong>
            {selectedActualSources.rolls} {t('commandes.rolls')} / {selectedActualSources.chutes}{' '}
            {t('commandes.chutes')}
          </strong>
        </div>
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.suggestedMaterialUse')}</span>
          <strong>
            {selectedSuggestedSources.rolls} {t('commandes.rolls')} /{' '}
            {selectedSuggestedSources.chutes} {t('commandes.chutes')}
          </strong>
        </div>
        <div className="commande-detail-kpi-card">
          <span>{t('commandes.cutSize')}</span>
          <strong>
            {selectedItem.longueurM} {t('commandes.m')} x {selectedItem.largeurMm}{' '}
            {t('commandes.mm')}
          </strong>
        </div>
      </div>
    </>
  );
}
