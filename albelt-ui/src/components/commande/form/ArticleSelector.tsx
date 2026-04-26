import { useMemo, useState } from 'react';
import { AutoComplete, type AutoCompleteCompleteEvent } from 'primereact/autocomplete';
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
  onChange: (article: Article | null) => void;
}

export function ArticleSelector({
  id,
  label,
  placeholder,
  options,
  value,
  disabled,
  invalid,
  onChange,
}: ArticleSelectorProps) {
  const [filteredOptions, setFilteredOptions] = useState<ArticleOption[]>(options);

  const selectedOption = useMemo(
    () => options.find((option) => option.article.id === (typeof value === 'string' ? value : value?.id)) ?? null,
    [options, value]
  );

  const search = (event: AutoCompleteCompleteEvent) => {
    const query = event.query.trim().toLowerCase();
    if (!query) {
      setFilteredOptions(options);
      return;
    }

    setFilteredOptions(
      options.filter((option) =>
        [
          option.reference,
          option.materialType,
          String(option.thicknessMm),
          String(option.nbPlis),
          option.label,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      )
    );
  };

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <AutoComplete
        inputId={id}
        value={selectedOption ?? undefined}
        suggestions={filteredOptions}
        completeMethod={search}
        field="label"
        dropdown
        forceSelection
        placeholder={placeholder}
        disabled={disabled}
        className={invalid ? 'p-invalid' : undefined}
        onChange={(e) => onChange(e.value?.article ?? null)}
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
