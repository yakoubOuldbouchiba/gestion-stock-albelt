import type {
  Altier,
  Color,
  PurchaseBonItemRequest,
  Supplier,
} from '../../types/index';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { getDimensionsLabel, formatDateInput, parseDateInput } from '../../pages/purchaseBons.utils';

type PurchaseBonFormPanelProps = {
  t: (key: string) => string;
  suppliers: Supplier[];
  altiers: Altier[];
  colors: Color[];
  materialOptions: Array<{ label: string; value: string }>;
  bonForm: {
    reference: string;
    bonDate: string;
    supplierId: string;
    notes: string;
  };
  itemForm: PurchaseBonItemRequest;
  items: PurchaseBonItemRequest[];
  isSaving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onUpdateBonField: (field: 'reference' | 'bonDate' | 'supplierId' | 'notes', value: string) => void;
  onUpdateItemField: <K extends keyof PurchaseBonItemRequest>(field: K, value: PurchaseBonItemRequest[K]) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
};

export function PurchaseBonFormPanel({
  t,
  suppliers,
  altiers,
  colors,
  materialOptions,
  bonForm,
  itemForm,
  items,
  isSaving,
  onSubmit,
  onUpdateBonField,
  onUpdateItemField,
  onAddItem,
  onRemoveItem,
}: PurchaseBonFormPanelProps) {
  return (
    <section className="purchase-workbench__panel purchase-workbench__panel--form">
      <div className="purchase-workbench__panel-header">
        <div>
          <h2>{t('purchaseBons.createTitle')}</h2>
        </div>
        <Tag value={`${items.length} ${t('purchaseBons.itemsCount')}`} severity={items.length > 0 ? 'info' : 'warning'} />
      </div>

      <form className="purchase-workbench__form p-fluid" onSubmit={onSubmit}>
        <div className="purchase-workbench__field-grid">
          <div className="purchase-workbench__field">
            <label htmlFor="reference">{t('purchaseBons.reference')}</label>
            <InputText
              id="reference"
              value={bonForm.reference}
              onChange={(event) => onUpdateBonField('reference', event.target.value)}
              placeholder="BA-2025-001"
            />
          </div>
          <div className="purchase-workbench__field">
            <label htmlFor="bonDate">{t('purchaseBons.bonDate')}</label>
            <div className="purchase-workbench__date-field">
              <Calendar
                id="bonDate"
                value={parseDateInput(bonForm.bonDate)}
                onChange={(event) => onUpdateBonField('bonDate', formatDateInput(event.value as Date | null))}
                dateFormat="yy-mm-dd"
                showIcon
              />
            </div>
          </div>
        </div>

        <div className="purchase-workbench__field-grid" style={{ marginTop: '1rem' }}>
          <div className="purchase-workbench__field">
            <label htmlFor="supplierId">{t('purchaseBons.supplier')}</label>
            <Dropdown
              id="supplierId"
              value={bonForm.supplierId || null}
              options={suppliers}
              optionLabel="name"
              optionValue="id"
              placeholder={t('purchaseBons.selectSupplier')}
              onChange={(event) => onUpdateBonField('supplierId', event.value || '')}
            />
          </div>
          <div className="purchase-workbench__field">
            <label htmlFor="notes">{t('purchaseBons.notes')}</label>
            <InputTextarea
              id="notes"
              value={bonForm.notes}
              onChange={(event) => onUpdateBonField('notes', event.target.value)}
              placeholder={t('purchaseBons.notesPlaceholder')}
              autoResize
              rows={1}
            />
          </div>
        </div>

        <section className="purchase-workbench__section">
          <div className="purchase-workbench__section-head">
            <div>
              <span className="purchase-workbench__section-label">{t('purchaseBons.items')}</span>
              <h3>{t('purchaseBons.addItem')}</h3>
            </div>
            <Tag value={`${items.length} ${t('purchaseBons.itemsCount')}`} />
          </div>

          <div className="purchase-workbench__item-grid">
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.material')}</label>
              <Dropdown
                value={itemForm.materialType}
                options={materialOptions}
                onChange={(event) => onUpdateItemField('materialType', event.value)}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.quantity')}</label>
              <InputNumber
                value={itemForm.quantity}
                onValueChange={(event) => onUpdateItemField('quantity', event.value ?? 0)}
                min={1}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.plies')}</label>
              <InputNumber
                value={itemForm.nbPlis}
                onValueChange={(event) => onUpdateItemField('nbPlis', event.value ?? 0)}
                min={1}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.thickness')}</label>
              <InputNumber
                value={itemForm.thicknessMm}
                onValueChange={(event) => onUpdateItemField('thicknessMm', event.value ?? 0)}
                min={0}
                step={0.1}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.width')}</label>
              <InputNumber
                value={itemForm.widthMm}
                onValueChange={(event) => onUpdateItemField('widthMm', event.value ?? 0)}
                min={0}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.length')}</label>
              <InputNumber
                value={itemForm.lengthM}
                onValueChange={(event) => onUpdateItemField('lengthM', event.value ?? 0)}
                min={0}
                step={0.1}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.area')}</label>
              <InputNumber
                value={itemForm.areaM2}
                onValueChange={(event) => onUpdateItemField('areaM2', event.value ?? 0)}
                min={0}
                step={0.1}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.color')}</label>
              <Dropdown
                value={itemForm.colorId || null}
                options={colors}
                optionLabel="name"
                optionValue="id"
                placeholder={t('purchaseBons.selectColor')}
                onChange={(event) => onUpdateItemField('colorId', event.value || undefined)}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.altier')}</label>
              <Dropdown
                value={itemForm.altierId || null}
                options={altiers}
                optionLabel="libelle"
                optionValue="id"
                placeholder={t('purchaseBons.selectAltier')}
                onChange={(event) => onUpdateItemField('altierId', event.value || undefined)}
              />
            </div>
            <div className="purchase-workbench__field">
              <label>{t('purchaseBons.qrCode')}</label>
              <InputText
                value={itemForm.qrCode || ''}
                onChange={(event) => onUpdateItemField('qrCode', event.target.value)}
              />
            </div>
          </div>

          <div className="purchase-workbench__actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button
              type="button"
              label={t('purchaseBons.addItem')}
              icon="pi pi-plus"
              onClick={onAddItem}
              disabled={isSaving}
            />
          </div>

          <div className="purchase-workbench__item-preview-list" style={{ marginTop: '1rem' }}>
            {items.length === 0 ? (
              <div className="purchase-workbench__empty-state">{t('purchaseBons.noItems')}</div>
            ) : (
              items.map((item, index) => (
                <article key={`${item.materialType}-${index}`} className="purchase-workbench__item-preview-card">
                  <div className="purchase-workbench__item-preview-topline">
                    <div>
                      <strong>{item.materialType}</strong>
                      <small>{getDimensionsLabel(item)}</small>
                    </div>
                    <Tag value={`${t('purchaseBons.quantity')}: ${item.quantity}`} severity="info" />
                  </div>

                  <div className="purchase-workbench__chip-row">
                    <span>{t('purchaseBons.plies')}: {item.nbPlis}</span>
                    <span>{t('purchaseBons.thickness')}: {item.thicknessMm}</span>
                    <span>{t('purchaseBons.color')}: {colors.find((color) => color.id === item.colorId)?.name || '-'}</span>
                    <span>{t('purchaseBons.altier')}: {altiers.find((altier) => altier.id === item.altierId)?.libelle || '-'}</span>
                  </div>

                  <div className="purchase-workbench__actions" style={{ justifyContent: 'flex-end', marginTop: '0.9rem' }}>
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label={t('common.delete')}
                      severity="danger"
                      text
                      onClick={() => onRemoveItem(index)}
                      disabled={isSaving}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="purchase-workbench__actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button
            type="submit"
            label={isSaving ? t('common.saving') : t('purchaseBons.create')}
            icon="pi pi-check"
            loading={isSaving}
            disabled={isSaving}
          />
        </div>
      </form>
    </section>
  );
}
