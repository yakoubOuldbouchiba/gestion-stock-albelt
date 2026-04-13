import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import type { CommandeItem } from '../../types';
import type { Translate } from './commandeTypes';

type ProductionDialogProps = {
  productionTargetItem: CommandeItem | null;
  showProductionModal: boolean;
  onHide: () => void;
  t: Translate;
  selectedProductionColorHex: string;
  selectedProductionColorName: string;
  selectedProductionLabel: string;
  disabled?: boolean;
  productionForm: {
    pieceLengthM: string;
    pieceWidthMm: string;
    quantity: string;
    notes: string;
  };
  onFieldChange: (name: 'pieceLengthM' | 'pieceWidthMm' | 'quantity' | 'notes', value: string) => void;
  onSave: () => void;
  creatingProduction: boolean;
};

export const ProductionDialog = ({
  productionTargetItem,
  showProductionModal,
  onHide,
  t,
  selectedProductionColorHex,
  selectedProductionColorName,
  selectedProductionLabel,
  disabled,
  productionForm,
  onFieldChange,
  onSave,
  creatingProduction,
}: ProductionDialogProps) => (
  <Dialog
    header={
      productionTargetItem
        ? `${t('commandes.addProductionItem')} - ${t('commandes.line')} ${productionTargetItem.lineNumber}`
        : t('commandes.addProductionItem')
    }
    visible={showProductionModal}
    onHide={onHide}
    position="right"
    style={{ width: 'min(600px, 95vw)', height: '100vh' }}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button label={t('commandes.cancel')} severity="secondary" onClick={onHide} />
        <Button
          label={t('commandes.saveProductionItem')}
          onClick={onSave}
          loading={creatingProduction}
          disabled={Boolean(disabled) || creatingProduction}
        />
      </div>
    }
  >
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          Placement
        </label>
        <div
          style={{
            border: '1px solid var(--surface-border)',
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {selectedProductionColorHex ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: selectedProductionColorHex,
                  borderRadius: '3px',
                  border: '1px solid var(--surface-border)',
                }}
              />
              <span>{selectedProductionColorName || selectedProductionColorHex}</span>
            </span>
          ) : null}
          <span>{selectedProductionLabel}</span>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('commandes.productionPieceLength')}
        </label>
        <InputText
          value={productionForm.pieceLengthM}
          onChange={(e) => onFieldChange('pieceLengthM', e.target.value)}
          placeholder="0.00"
          type="number"
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingProduction}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('commandes.productionPieceWidth')}
        </label>
        <InputText
          value={productionForm.pieceWidthMm}
          onChange={(e) => onFieldChange('pieceWidthMm', e.target.value)}
          placeholder="0"
          type="number"
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingProduction}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('commandes.productionQuantity')}
        </label>
        <InputText
          value={productionForm.quantity}
          onChange={(e) => onFieldChange('quantity', e.target.value)}
          placeholder="0"
          type="number"
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingProduction}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('commandes.notes')}
        </label>
        <InputTextarea
          value={productionForm.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder={t('commandes.notesPlaceholder')}
          rows={3}
          style={{ width: '100%' }}
          disabled={Boolean(disabled) || creatingProduction}
        />
      </div>
    </div>
  </Dialog>
);
