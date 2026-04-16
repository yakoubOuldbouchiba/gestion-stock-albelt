import { t } from 'i18next';
import '../styles/Pagination.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => onPageChange(Math.max(page - 1, 0));
  const handleNext = () => onPageChange(Math.min(page + 1, totalPages - 1));

  return (
    <div className="pagination">
      <button type="button" className="pagination-button" onClick={handlePrev} disabled={page <= 0}>
        {t('pagination.previous')}
      </button>
      <span className="pagination-info">
        {t('pagination.page')} {page + 1} {t('pagination.of')} {totalPages}
      </span>
      <button
        type="button"
        className="pagination-button"
        onClick={handleNext}
        disabled={page >= totalPages - 1}
      >
        {t('pagination.next')}
      </button>
    </div>
  );
}

export default Pagination;
