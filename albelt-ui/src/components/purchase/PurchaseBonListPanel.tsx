import type { PurchaseBon } from '../../types/index';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { formatPurchaseDate } from '../../pages/purchaseBons.utils';
import { PurchaseBonDetailsCard } from './PurchaseBonDetailsCard';

type PurchaseBonListPanelProps = {
  t: (key: string) => string;
  loading: boolean;
  isSaving: boolean;
  bons: PurchaseBon[];
  selectedBon: PurchaseBon | null;
  onLoadBonDetails: (id: string) => void;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownloadPdf: (bon: PurchaseBon) => void;
};

export function PurchaseBonListPanel({
  t,
  loading,
  isSaving,
  bons,
  selectedBon,
  onLoadBonDetails,
  onValidate,
  onDelete,
  onDownloadPdf,
}: PurchaseBonListPanelProps) {
  return (
    <section className="purchase-workbench__panel">
      <div className="purchase-workbench__panel-header">
        <div>
          <h2>{t('purchaseBons.listTitle')}</h2>
          <p>{t('purchaseBons.listDescription')}</p>
        </div>
      </div>

      {loading ? (
        <div className="purchase-workbench__loading-state purchase-workbench__loading-state--compact">
          <ProgressSpinner />
        </div>
      ) : (
        <div className="purchase-workbench__bons-list" style={{ padding: '1rem 1.2rem 1.2rem' }}>
          {bons.length === 0 ? (
            <div className="purchase-workbench__empty-state">{t('common.noData')}</div>
          ) : (
            bons.map((bon) => (
              <article
                key={bon.id}
                className={`purchase-workbench__bon-card${selectedBon?.id === bon.id ? ' is-selected' : ''}`}
              >
                <div className="purchase-workbench__bon-topline">
                  <div>
                    <strong>{bon.reference}</strong>
                    <small>{bon.supplierName || '-'}</small>
                  </div>
                  <Tag
                    value={bon.status === 'VALIDATED' ? t('purchaseBons.validated') : t('purchaseBons.draft')}
                    severity={bon.status === 'VALIDATED' ? 'success' : 'warning'}
                  />
                </div>

                <div className="purchase-workbench__bon-metrics">
                  <span>{t('purchaseBons.bonDate')}: {formatPurchaseDate(bon.bonDate)}</span>
                  <span>{t('purchaseBons.items')}: {bon.itemCount ?? '-'}</span>
                </div>

                <div className="purchase-workbench__actions" style={{ marginTop: '0.9rem' }}>
                  <Button
                    label={t('transferBons.view') || 'View'}
                    size="small"
                    onClick={() => onLoadBonDetails(bon.id)}
                  />
                  {bon.status === 'DRAFT' && (
                    <Button
                      label={t('purchaseBons.validate')}
                      onClick={() => onValidate(bon.id)}
                      disabled={isSaving}
                      size="small"
                    />
                  )}
                  {bon.status === 'DRAFT' && (
                    <Button
                      label={t('common.delete')}
                      severity="danger"
                      onClick={() => onDelete(bon.id)}
                      disabled={isSaving}
                      size="small"
                    />
                  )}
                </div>
              </article>
            ))
          )}

          {selectedBon && (
            <PurchaseBonDetailsCard t={t} bon={selectedBon} onDownloadPdf={onDownloadPdf} />
          )}
        </div>
      )}
    </section>
  );
}
