import type { ReactNode } from 'react';
import type { Roll, WastePiece } from '../../types/index';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { t } from 'i18next';

type TransferSourcePanelProps<T extends Roll | WastePiece> = {
  title: string;
  subtitle: string;
  items: T[];
  selectedIds: string[];
  loading: boolean;
  emptyMessage: string;
  hasMore: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
  onToggle: (id: string) => void;
  renderMeta: (item: T) => ReactNode;
  renderLabel: (item: T) => string;
};

export function TransferSourcePanel<T extends Roll | WastePiece>({
  title,
  subtitle,
  items,
  selectedIds,
  loading,
  emptyMessage,
  hasMore,
  searchValue,
  onSearchChange,
  onLoadMore,
  onToggle,
  renderMeta,
  renderLabel,
}: TransferSourcePanelProps<T>) {
  return (
    <section className="transfer-workbench__source-panel">
      <div className="transfer-workbench__source-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {loading && <ProgressSpinner style={{ width: '1.8rem', height: '1.8rem' }} strokeWidth="6" />}
      </div>

      <div className="transfer-workbench__search">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('common.search')}
          />
        </span>
      </div>

      <div className="transfer-workbench__source-list">
        {items.length === 0 && !loading ? (
          <div className="transfer-workbench__empty-state">{emptyMessage}</div>
        ) : (
          items.map((item) => {
            const checked = selectedIds.includes(item.id);

            return (
              <label
                key={item.id}
                className={`transfer-workbench__source-card${checked ? ' is-selected' : ''}`}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(item.id)} />

                <div className="transfer-workbench__source-content">
                  <strong>{renderLabel(item)}</strong>
                  <div className="transfer-workbench__source-meta">{renderMeta(item)}</div>
                  <small>{item.id.slice(0, 8)}...</small>
                </div>
              </label>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="transfer-workbench__load-more">
          <Button
            type="button"
            label={t('common.loadMore')}
            icon="pi pi-angle-down"
            outlined
            onClick={onLoadMore}
            loading={loading}
          />
        </div>
      )}
    </section>
  );
}
