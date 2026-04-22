interface CommandeItemsSummaryProps {
  t: (key: string) => string;
  totalItems: number;
  totalQuantity: number;
  totalSurfaceM2: number;
}

export function CommandeItemsSummary({ t, totalItems, totalQuantity, totalSurfaceM2 }: CommandeItemsSummaryProps) {
  const surfacePerLine = totalItems > 0 ? totalSurfaceM2 / totalItems : 0;
  return (
    <div className="commande-summary-card">
      <div className="commande-summary-grid">
        <div className="commande-summary-stat">
          <div className="commande-summary-stat__icon" aria-hidden="true">
            <i className="pi pi-list" />
          </div>
          <div className="commande-summary-stat__meta">
            <div className="commande-summary-stat__label">{t('commandes.totalItems')}</div>
            <div className="commande-summary-stat__value">{totalItems}</div>
          </div>
        </div>

        <div className="commande-summary-stat">
          <div className="commande-summary-stat__icon" aria-hidden="true">
            <i className="pi pi-box" />
          </div>
          <div className="commande-summary-stat__meta">
            <div className="commande-summary-stat__label">{t('commandes.totalQuantity')}</div>
            <div className="commande-summary-stat__value">{totalQuantity}</div>
          </div>
        </div>

        <div className="commande-summary-stat">
          <div className="commande-summary-stat__icon" aria-hidden="true">
            <i className="pi pi-chart-line" />
          </div>
          <div className="commande-summary-stat__meta">
            <div className="commande-summary-stat__label">{t('inventory.totalSurface')}</div>
            <div className="commande-summary-stat__value">{totalSurfaceM2.toFixed(2)} m²</div>
          </div>
        </div>

        <div className="commande-summary-stat">
          <div className="commande-summary-stat__icon" aria-hidden="true">
            <i className="pi pi-sliders-h" />
          </div>
          <div className="commande-summary-stat__meta">
            <div className="commande-summary-stat__label">m²/ligne</div>
            <div className="commande-summary-stat__value">{surfacePerLine.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandeItemsSummary;
