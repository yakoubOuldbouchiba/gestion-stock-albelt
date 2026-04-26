
import { Dropdown } from 'primereact/dropdown';
import type { Article } from '../../../types';
import { getArticleDisplayLabel } from '../../../utils/article';
import type { ArticleOption } from '../../../pages/hooks/useCommandeLookups';

interface ArticleSelectorProps {
  id?: string;
  label?: string;
  placeholder?: string;
  options: ArticleOption[];
  value?: Article | string | null;
  disabled?: boolean;
  invalid?: boolean;
  readOnly?: boolean;
  className?: string;
  onChange: (article: Article | null) => void;
}

export function ArticleSelector({
  readOnly,
  id,
  label,
  placeholder,
  options,
  value,
  disabled,
  invalid,
  className,
  onChange,
}: ArticleSelectorProps) {

  return (
    <div className={className} style={{ display: 'grid', gap: '0.5rem' }}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <Dropdown
        readOnly={readOnly}
        inputId={id}
        value={typeof value === 'string' ? value : value?.id}
        options={options}
        optionLabel="label"
        optionValue="value"
        filter
        filterBy="label,reference"
        placeholder={placeholder}
        disabled={disabled}
        showClear
        className={invalid ? 'p-invalid' : undefined}
        onChange={(e) => {
          const selected = options.find((opt) => opt.value === e.value);
          onChange(selected?.article ?? null);
        }}
        itemTemplate={(option: ArticleOption) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gap: '0.15rem' }}>
              <strong>{option.reference || getArticleDisplayLabel(option.article)}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                {option.materialType} - {option.thicknessMm}mm - {option.nbPlis} plis
              </span>
            </div>
            {option.article.colorHexCode && (
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: option.article.colorHexCode,
                  border: '1px solid var(--surface-border)',
                }}
                title={option.article.colorName}
              />
            )}
          </div>
        )}
      />
    </div>
  );
}

export default ArticleSelector;
