import { ProgressSpinner } from 'primereact/progressspinner';
import { useI18n } from '@hooks/useI18n';
import './LazyLoadingFallback.css';

export function LazyLoadingFallback() {
  const { t } = useI18n();

  return (
    <div className="lazy-loading-container">
      <ProgressSpinner
        style={{ width: '50px', height: '50px' }}
        strokeWidth="4"
        fill="var(--surface-ground)"
        animationDuration="1s"
      />
      <p>{t('common.loading')}</p>
    </div>
  );
}

export default LazyLoadingFallback;
