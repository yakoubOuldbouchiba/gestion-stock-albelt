import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { CommandeItem } from '../../types';
import type { Translate } from './commandeTypes';

type ChuteDialogProps = {
  chuteTargetItem: CommandeItem | null;
  showChuteForm: boolean;
  onHide: () => void;
  t: Translate;
  chuteSourceType: 'ROLL' | 'WASTE_PIECE';
  chuteSourceOptions: { label: string; value: string }[];
  onSourceTypeChange: (value: string) => void;
  chuteRollId: string;
  chuteRollOptions: any[];
  onRollChange: (value: string) => void;
  parentWastePieceId: string;
  chuteParentOptions: any[];
  onParentWasteChange: (value: string) => void;
  parentWastePiecesLoading: boolean;
  renderRollOption: (option: any) => JSX.Element | null;
  chuteSource: any;
  chuteDimensions: { widthMm: number; lengthM: number; areaM2: number };
  onDimensionChange: (field: 'widthMm' | 'lengthM', value: string) => void;
  onCreate: () => void;
  creatingChute: boolean;
};

export const ChuteDialog = ({
  chuteTargetItem,
  showChuteForm,
  onHide,
  t,
  chuteSourceType,
  chuteSourceOptions,
  onSourceTypeChange,
  chuteRollId,
  chuteRollOptions,
  onRollChange,
  parentWastePieceId,
  chuteParentOptions,
  onParentWasteChange,
  parentWastePiecesLoading,
  renderRollOption,
  chuteSource,
  chuteDimensions,
  onDimensionChange,
  onCreate,
  creatingChute,
}: ChuteDialogProps) => (
  <Dialog
    header={
      chuteTargetItem
        ? `${t('inventory.createChute')} - ${t('commandes.line')} ${chuteTargetItem.lineNumber}`
        : t('inventory.createChute')
    }
    visible={showChuteForm}
    onHide={onHide}
    position="right"
    style={{ width: 'min(700px, 95vw)', height: '100vh' }}
    footer={
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button label={t('common.cancel')} severity="secondary" onClick={onHide} />
        <Button label={t('inventory.createChute')} onClick={onCreate} loading={creatingChute} />
      </div>
    }
  >
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('inventory.sourceType')}
        </label>
        <Dropdown
          value={chuteSourceType}
          options={chuteSourceOptions}
          onChange={(e) => onSourceTypeChange(e.value)}
          style={{ width: '100%' }}
        />
      </div>

      {chuteSourceType === 'ROLL' ? (
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.selectRoll')}
          </label>
          <Dropdown
            value={chuteRollId}
            options={chuteRollOptions}
            itemTemplate={renderRollOption}
            valueTemplate={(option) => renderRollOption(option)}
            onChange={(e) => onRollChange(e.value as string)}
            placeholder={t('commandes.selectRollOption')}
            style={{ width: '100%' }}
          />
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.selectWastePiece')}
          </label>
          <Dropdown
            value={parentWastePieceId}
            options={chuteParentOptions}
            onChange={(e) => onParentWasteChange(e.value as string)}
            placeholder={
              parentWastePiecesLoading
                ? t('inventory.loadingWastePieces')
                : t('inventory.selectWastePiece')
            }
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('inventory.material')}
          </label>
          <InputText value={chuteSource?.materialType || ''} disabled />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.plies')}
          </label>
          <InputText value={chuteSource?.nbPlis ?? ''} disabled />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.thickness')}
          </label>
          <InputText value={chuteSource?.thicknessMm ?? ''} disabled />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.width')}
          </label>
          <InputText
            value={chuteDimensions.widthMm ? String(chuteDimensions.widthMm) : ''}
            onChange={(e) => onDimensionChange('widthMm', e.target.value)}
            type="number"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.length')}
          </label>
          <InputText
            value={chuteDimensions.lengthM ? String(chuteDimensions.lengthM) : ''}
            onChange={(e) => onDimensionChange('lengthM', e.target.value)}
            type="number"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('rolls.area')}
          </label>
          <InputText value={chuteDimensions.areaM2.toFixed(4)} disabled />
        </div>
      </div>
    </div>
  </Dialog>
);
