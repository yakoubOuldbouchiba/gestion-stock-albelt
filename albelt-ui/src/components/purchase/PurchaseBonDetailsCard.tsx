import type { PurchaseBon } from '../../types/index';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { formatPurchaseDate, getDimensionsLabel } from '../../pages/purchaseBons.utils';

type PurchaseBonDetailsCardProps = {
  t: (key: string) => string;
  bon: PurchaseBon;
  onDownloadPdf: (bon: PurchaseBon) => void;
};

export function PurchaseBonDetailsCard({ t, bon, onDownloadPdf }: PurchaseBonDetailsCardProps) {
  return (
    <div className="purchase-workbench__details-panel">
      <div className="purchase-workbench__header-actions">
        <h3>{t('purchaseBons.details')}</h3>
        <Button
          label={t('purchaseBons.downloadPdf')}
          icon="pi pi-download"
          onClick={() => onDownloadPdf(bon)}
        />
      </div>

      <div className="purchase-workbench__detail-grid" style={{ marginTop: '1rem' }}>
        <div>
          <span className="purchase-workbench__detail-label">{t('purchaseBons.reference')}</span>
          <strong>{bon.reference}</strong>
        </div>
        <div>
          <span className="purchase-workbench__detail-label">{t('purchaseBons.bonDate')}</span>
          <strong>{formatPurchaseDate(bon.bonDate)}</strong>
        </div>
        <div>
          <span className="purchase-workbench__detail-label">{t('purchaseBons.supplier')}</span>
          <strong>{bon.supplierName}</strong>
        </div>
        <div>
          <span className="purchase-workbench__detail-label">{t('purchaseBons.status')}</span>
          <strong>{bon.status}</strong>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div className="purchase-workbench__section-head">
          <div>
            <span className="purchase-workbench__section-label">{t('purchaseBons.items')}</span>
            <h3>{t('purchaseBons.items')}</h3>
          </div>
          <Tag value={`${bon.items?.length || 0} ${t('purchaseBons.itemsCount')}`} severity="info" />
        </div>

        <div className="purchase-workbench__line-grid">
          {(bon.items || []).length === 0 ? (
            <div className="purchase-workbench__empty-state">{t('purchaseBons.noItems')}</div>
          ) : (
            (bon.items || []).map((item: any) => (
              <article key={item.id} className="purchase-workbench__line-card">
                <div className="purchase-workbench__item-preview-topline">
                  <div>
                    <strong>{item.lineNumber}. {item.materialType}</strong>
                    <small>{getDimensionsLabel(item)}</small>
                  </div>
                  <Tag value={`${t('purchaseBons.quantity')}: ${item.quantity}`} severity="success" />
                </div>

                <div className="purchase-workbench__line-meta">
                  <span>{t('purchaseBons.color')}: {item.colorName || '-'}</span>
                  <span>{t('purchaseBons.altier')}: {item.altierLibelle || '-'}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
