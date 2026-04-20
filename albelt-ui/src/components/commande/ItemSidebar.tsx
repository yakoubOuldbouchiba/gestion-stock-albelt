import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import type { CommandeItem } from '../../types';
import { useI18n } from '@hooks/useI18n';

interface ItemSidebarProps {
  items: CommandeItem[];
  filteredItems: CommandeItem[];
  selectedItemId: string | null;
  itemSearchQuery: string;
  setItemSearchQuery: (query: string) => void;
  onSelectItem: (id: string) => void;
  getItemDisplayLabel: (item: CommandeItem) => string;
  getStatusSeverity: (status: string) => any;
  getContrastTextColor: (hexColor?: string) => string;
  getItemProgress: (item: CommandeItem) => any;
}

export function ItemSidebar({
  items,
  filteredItems,
  selectedItemId,
  itemSearchQuery,
  setItemSearchQuery,
  onSelectItem,
  getItemDisplayLabel,
  getStatusSeverity,
  getContrastTextColor,
  getItemProgress,
}: ItemSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="commande-detail-sidebar">
      <div className="commande-detail-sidebar__header">
        <div>
          <h2 className="commande-detail-sidebar__title">{t('commandes.itemsToProcess')}</h2>
          <p className="commande-detail-sidebar__subtitle">
            {t('commandes.itemsToProcessSubtitle')}
          </p>
        </div>
        <span className="commande-detail-sidebar__count">
          {filteredItems.length}/{items.length}
        </span>
      </div>

      <span className="p-input-icon-left commande-detail-search">
        <i className="pi pi-search" />
        <InputText
          value={itemSearchQuery}
          onChange={(e) => setItemSearchQuery(e.target.value)}
          placeholder={t('commandes.searchPlaceholder')}
        />
      </span>

      <div className="commande-detail-item-list">
        {filteredItems.length === 0 ? (
          <Message severity="info" text={t('commandes.noItemsMatchSearch')} />
        ) : (
          filteredItems.map((item) => {
            const progress = getItemProgress(item);
            const isSelected = item.id === selectedItemId;

            return (
              <button
                key={item.id}
                type="button"
                className={`commande-detail-item-card${isSelected ? ' is-selected' : ''}`}
                onClick={() => onSelectItem(item.id)}
              >
                <div className="commande-detail-item-card__topline">
                  <span className="commande-detail-item-card__eyebrow">{getItemDisplayLabel(item)}</span>
                  <Tag
                    value={t(`statuses.${item.status}`)}
                    severity={getStatusSeverity(item.status)}
                  />
                </div>

                <div
                  className="commande-detail-item-card__material"
                  style={{
                    backgroundColor: item.colorHexCode || '#f4efe5',
                    color: getContrastTextColor(item.colorHexCode),
                  }}
                >
                  <strong>{item.materialType}</strong>
                  <span>
                    {item.nbPlis}P • {item.thicknessMm} {t('commandes.mm')} • {item.longueurM} {t('commandes.m')} x {item.largeurMm} {t('commandes.mm')}
                  </span>
                </div>

                <div className="commande-detail-item-card__stats">
                  <div>
                    <span>{t('commandes.quantity')}</span>
                    <strong>{item.quantite}</strong>
                  </div>
                  <div>
                    <span>{t('commandes.done')}</span>
                    <strong>{progress.produced}</strong>
                  </div>
                  <div>
                    <span>{t('commandes.left')}</span>
                    <strong>{progress.remaining}</strong>
                  </div>
                </div>

                <div className="commande-detail-item-card__footer">
                  <Tag value={item.typeMouvement} severity="info" />
                  {progress.over > 0 ? <Tag value={`Over ${progress.over}`} severity="danger" /> : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
