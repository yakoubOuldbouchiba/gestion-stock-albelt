import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import type { Article, CommandeItemRequest, TypeMouvement } from '../../../types';
import { calculateSurfaceM2, calculateTotalSurfaceM2 } from '../../../pages/hooks/useCommandeItems';
import type { ArticleOption, ColorOption } from '../../../pages/hooks/useCommandeLookups';
import { applyArticleToPayload, getArticleId, getArticleMaterialType, getArticleNbPlis, getArticleReference, getArticleThicknessMm } from '../../../utils/article';
import ArticleSelector from './ArticleSelector';

interface MouvementOption {
  label: string;
  value: TypeMouvement;
}

type EditableItem = CommandeItemRequest & { id?: string };

interface CommandeItemsEditorProps<TItem extends EditableItem> {
  t: (key: string) => string;
  items: TItem[];
  articles: ArticleOption[];
  mouvements: MouvementOption[];
  colors: ColorOption[];
  disabled?: boolean;
  formError?: string;
  variant?: 'wrapped' | 'table';
  onItemChange: (index: number, field: keyof TItem, value: unknown) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export function CommandeItemsEditor<TItem extends EditableItem>({
  t,
  items,
  articles,
  mouvements,
  colors,
  disabled,
  formError,
  variant = 'wrapped',
  onItemChange,
  onAddItem,
  onRemoveItem,
}: CommandeItemsEditorProps<TItem>) {
  const handleArticleChange = (rowIndex: number, article: Article | null) => {
    const nextItem = applyArticleToPayload(items[rowIndex], article);
    onItemChange(rowIndex, 'articleId', nextItem.articleId);
    onItemChange(rowIndex, 'article', nextItem.article);
    onItemChange(rowIndex, 'materialType', nextItem.materialType);
    onItemChange(rowIndex, 'nbPlis', nextItem.nbPlis);
    onItemChange(rowIndex, 'thicknessMm', nextItem.thicknessMm);
    onItemChange(rowIndex, 'reference', nextItem.reference);
  };

  const articleBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <ArticleSelector
      options={articles}
      value={rowData.article ?? getArticleId(rowData)}
      placeholder={t('inventory.reference')}
      disabled={disabled}
      onChange={(article) => handleArticleChange(rowIndex.rowIndex, article)}
    />
  );

  const quantiteBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <InputNumber
      value={rowData.quantite}
      onValueChange={(e) => onItemChange(rowIndex.rowIndex, 'quantite', e.value || 0)}
      min={1}
      max={1000}
      style={{ width: '100%' }}
      disabled={disabled}
    />
  );

  const nbPlisBodyTemplate = (rowData: TItem) => (
    <InputNumber
      value={getArticleNbPlis(rowData)}
      onValueChange={() => undefined}
      min={1}
      max={50}
      style={{ width: '100%' }}
      disabled
    />
  );

  const thicknessBodyTemplate = (rowData: TItem) => (
    <InputNumber
      value={getArticleThicknessMm(rowData)}
      onValueChange={() => undefined}
      min={0.1}
      max={100}
      step={0.1}
      mode="decimal"
      minFractionDigits={1}
      maxFractionDigits={3}
      style={{ width: '100%' }}
      disabled
    />
  );

  const longueurBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <InputNumber
      value={rowData.longueurM}
      onValueChange={(e) => onItemChange(rowIndex.rowIndex, 'longueurM', e.value || 0)}
      min={0.1}
      max={1000}
      step={0.1}
      mode="decimal"
      minFractionDigits={1}
      maxFractionDigits={2}
      style={{ width: '100%' }}
      disabled={disabled}
    />
  );

  const largeurBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <InputNumber
      value={rowData.largeurMm}
      onValueChange={(e) => onItemChange(rowIndex.rowIndex, 'largeurMm', e.value || 0)}
      min={1}
      max={10000}
      style={{ width: '100%' }}
      disabled={disabled}
    />
  );

  const colorBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <Dropdown
      value={rowData.colorId}
      onChange={(e) => onItemChange(rowIndex.rowIndex, 'colorId', e.value)}
      options={colors}
      optionLabel="label"
      optionValue="value"
      placeholder={t('inventory.selectColor')}
      showClear
      style={{ width: '100%' }}
      disabled={disabled}
      itemTemplate={(option: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: option.hexCode || 'transparent',
              border: '1px solid var(--surface-border)',
            }}
          />
          <span>{option.label}</span>
        </div>
      )}
      valueTemplate={(option: any, props) => {
        if (!option) return <span>{props.placeholder}</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: option.hexCode || 'transparent',
                border: '1px solid var(--surface-border)',
              }}
            />
            <span>{option.label}</span>
          </div>
        );
      }}
    />
  );

  const mouvementBodyTemplate = (rowData: TItem, rowIndex: any) => (
    <Dropdown
      value={rowData.typeMouvement}
      onChange={(e) => onItemChange(rowIndex.rowIndex, 'typeMouvement', e.value)}
      options={mouvements}
      optionLabel="label"
      optionValue="value"
      placeholder={t('commandes.selectMouvement')}
      filter
      showClear={false}
      style={{ width: '100%' }}
      disabled={disabled}
    />
  );

  const surfaceBodyTemplate = (rowData: TItem) => <span>{calculateSurfaceM2(rowData).toFixed(2)} m²</span>;

  const surfaceTotalBodyTemplate = (rowData: TItem) => <span>{calculateTotalSurfaceM2(rowData).toFixed(2)} m²</span>;

  const actionsBodyTemplate = (_: any, rowIndex: any) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      rounded
      text
      className="p-button-sm"
      onClick={() => onRemoveItem(rowIndex.rowIndex)}
      disabled={disabled || items.length === 1}
    />
  );

  return (
    <Card title={t('commandes.orderItems')}>
      {formError && (
        <div className="p-error" style={{ marginBottom: '0.75rem' }}>
          {formError}
        </div>
      )}

      {variant === 'wrapped' ? (
        <div className="order-items-grid">
          {items.map((item, index) => (
            <div key={`${item.lineNumber}-${index}`} className="albel-compact-item commande-item-card">
              <div className="commande-item-card__header">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750 }}>
                    {t('commandes.line')} {item.lineNumber}
                  </div>
                  {!!getArticleReference(item) && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {t('inventory.reference')}: {getArticleReference(item)}
                    </div>
                  )}
                </div>
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  onClick={() => onRemoveItem(index)}
                  disabled={disabled || items.length === 1}
                  label={t('commandes.delete')}
                />
              </div>

              <div className="commande-item-metrics" aria-label={t('commandes.orderItems')}>
                <div className="commande-item-metric">
                  <div className="commande-item-metric__label">{t('commandes.quantity')}</div>
                  <div className="commande-item-metric__value">{item.quantite}</div>
                </div>
                <div className="commande-item-metric">
                  <div className="commande-item-metric__label">{t('commandes.surface')}</div>
                  <div className="commande-item-metric__value">{calculateSurfaceM2(item).toFixed(2)} m²</div>
                </div>
                <div className="commande-item-metric">
                  <div className="commande-item-metric__label">{t('inventory.totalSurface')}</div>
                  <div className="commande-item-metric__value">{calculateTotalSurfaceM2(item).toFixed(2)} m²</div>
                </div>
              </div>

              <div className="order-item-fields">
                <div>
                  <ArticleSelector
                    id={`article-${item.lineNumber}-${index}`}
                    label={t('inventory.reference')}
                    options={articles}
                    value={item.article ?? getArticleId(item)}
                    placeholder={t('commandes.selectArticle') || t('inventory.reference')}
                    disabled={disabled}
                    onChange={(article) => handleArticleChange(index, article)}
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.plies')}</label>
                  <InputNumber
                    value={getArticleNbPlis(item)}
                    onValueChange={() => undefined}
                    min={1}
                    max={50}
                    disabled
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.thickness')}</label>
                  <InputNumber
                    value={getArticleThicknessMm(item)}
                    onValueChange={() => undefined}
                    min={0.1}
                    max={100}
                    step={0.1}
                    mode="decimal"
                    minFractionDigits={1}
                    maxFractionDigits={3}
                    disabled
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.length')}</label>
                  <InputNumber
                    value={item.longueurM}
                    onValueChange={(e) => onItemChange(index, 'longueurM', e.value || 0)}
                    min={0.1}
                    max={1000}
                    step={0.1}
                    mode="decimal"
                    minFractionDigits={1}
                    maxFractionDigits={2}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.width')}</label>
                  <InputNumber
                    value={item.largeurMm}
                    onValueChange={(e) => onItemChange(index, 'largeurMm', e.value || 0)}
                    min={1}
                    max={10000}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.material')}</label>
                  <InputText
                    value={getArticleMaterialType(item) ?? ''}
                    disabled
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('inventory.color')}</label>
                  <Dropdown
                    value={item.colorId}
                    onChange={(e) => onItemChange(index, 'colorId', e.value)}
                    options={colors}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={t('inventory.selectColor')}
                    showClear
                    disabled={disabled}
                    itemTemplate={(option: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: option.hexCode || 'transparent',
                            border: '1px solid var(--surface-border)',
                          }}
                        />
                        <span>{option.label}</span>
                      </div>
                    )}
                    valueTemplate={(option: any, props) => {
                      if (!option) return <span>{props.placeholder}</span>;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: option.hexCode || 'transparent',
                              border: '1px solid var(--surface-border)',
                            }}
                          />
                          <span>{option.label}</span>
                        </div>
                      );
                    }}
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.quantity')}</label>
                  <InputNumber
                    value={item.quantite}
                    onValueChange={(e) => onItemChange(index, 'quantite', e.value || 0)}
                    min={1}
                    max={1000}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="commande-field-label">{t('commandes.movement')}</label>
                  <Dropdown
                    value={item.typeMouvement}
                    onChange={(e) => onItemChange(index, 'typeMouvement', e.value)}
                    options={mouvements}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={t('commandes.selectMouvement')}
                    filter
                    showClear={false}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable value={items} className="p-datatable-sm">
          <Column field="lineNumber" header={t('commandes.lineNumber')} />
          <Column field="articleId" header={t('inventory.reference')} body={articleBodyTemplate} />
          <Column field="nbPlis" header={t('commandes.plies')} body={nbPlisBodyTemplate} />
          <Column field="thicknessMm" header={t('commandes.thickness')} body={thicknessBodyTemplate} />
          <Column field="longueurM" header={t('commandes.length')} body={longueurBodyTemplate} />
          <Column field="largeurMm" header={t('commandes.width')} body={largeurBodyTemplate} />
          <Column field="colorId" header={t('inventory.color')} body={colorBodyTemplate} />
          <Column field="quantite" header={t('commandes.quantity')} body={quantiteBodyTemplate} />
          <Column field="typeMouvement" header={t('commandes.movement')} body={mouvementBodyTemplate} />
          <Column body={surfaceBodyTemplate} header={t('commandes.surface')} />
          <Column body={surfaceTotalBodyTemplate} header={t('inventory.totalSurface')} />
          <Column body={actionsBodyTemplate} />
        </DataTable>
      )}

      <div style={{ marginTop: '1rem' }}>
        <Button
          type="button"
          label={t('commandes.addItem')}
          icon="pi pi-plus"
          onClick={onAddItem}
          severity="success"
          disabled={disabled}
        />
      </div>
    </Card>
  );
}

export default CommandeItemsEditor;
