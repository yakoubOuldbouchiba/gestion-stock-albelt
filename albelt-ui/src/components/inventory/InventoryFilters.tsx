import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { MaterialType, RollStatus } from '../../types';
import type { Translate } from '../commande/commandeTypes';

type InventoryFiltersProps = {
  t: Translate;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  materialFilter: MaterialType | 'ALL';
  materialOptions: { label: string; value: MaterialType | 'ALL' }[];
  onMaterialChange: (value: MaterialType | 'ALL') => void;
  altierFilter: string;
  altierOptions: { label: string; value: string }[];
  onAltierChange: (value: string) => void;
  statusFilter: RollStatus | 'ALL';
  statusOptions: { label: string; value: RollStatus | 'ALL' }[];
  onStatusChange: (value: RollStatus | 'ALL') => void;
  colorFilter: string;
  colorOptions: { label: string; value: string }[];
  onColorChange: (value: string) => void;
  nbPlisFilter: string;
  onNbPlisChange: (value: string) => void;
  thicknessFilter: string;
  onThicknessChange: (value: string) => void;
  totalCount?: number;
};

export function InventoryFilters({
  t,
  searchTerm,
  onSearchChange,
  materialFilter,
  materialOptions,
  onMaterialChange,
  altierFilter,
  altierOptions,
  onAltierChange,
  statusFilter,
  statusOptions,
  onStatusChange,
  colorFilter,
  colorOptions,
  onColorChange,
  nbPlisFilter,
  onNbPlisChange,
  thicknessFilter,
  onThicknessChange,
  totalCount,
}: InventoryFiltersProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder={t('inventory.search')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </span>
      <Dropdown
        value={materialFilter}
        options={materialOptions}
        onChange={(e) => onMaterialChange(e.value)}
        placeholder={t('inventory.material')}
      />
      <Dropdown
        value={altierFilter}
        options={altierOptions}
        onChange={(e) => onAltierChange(e.value)}
        placeholder={t('sidebar.workshops')}
      />
      <Dropdown
        value={statusFilter}
        options={statusOptions}
        onChange={(e) => onStatusChange(e.value)}
        placeholder={t('inventory.status')}
      />
      <Dropdown
        value={colorFilter}
        options={colorOptions}
        onChange={(e) => onColorChange(e.value)}
        placeholder={t('inventory.color') || 'Color'}
      />
      <InputText
        value={nbPlisFilter}
        onChange={(e) => onNbPlisChange(e.target.value)}
        type="number"
        min={0}
        placeholder={t('rolls.plies') || 'Plies'}
      />
      <InputText
        value={thicknessFilter}
        onChange={(e) => onThicknessChange(e.target.value)}
        type="number"
        min={0}
        step="0.01"
        placeholder={t('rolls.thickness') || 'Thickness'}
      />
      {typeof totalCount === 'number' && (
        <span>{totalCount} {t('common.list')}</span>
      )}
    </div>
  );
}
