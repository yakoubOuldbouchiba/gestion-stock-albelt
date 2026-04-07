import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { MaterialType, RollStatus } from '../../types';
import type { Translate } from '../commande/commandeTypes';
import '../../styles/InventoryFilters.css';

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
    <div className="inventory-filters">
      <div className="inventory-filters__header">
        <div className="inventory-filters__title">
          {t('inventory.filters') || 'Filters'}
        </div>
        {typeof totalCount === 'number' && (
          <div className="inventory-filters__count">
            <span className="inventory-filters__count-value">{totalCount}</span>
            <span className="inventory-filters__count-label">{t('common.list') || 'items'}</span>
          </div>
        )}
      </div>
      <div className="inventory-filters__grid">
        <div className="inventory-filters__field inventory-filters__field--search">
          <label className="inventory-filters__label" htmlFor="inventory-search">
            {t('inventory.search') || 'Search'}
          </label>
          <span className="p-input-icon-left inventory-filters__control">
            <i className="pi pi-search" />
            <InputText
              id="inventory-search"
              placeholder={t('inventory.search') || 'Search'}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="inventory-filters__input"
            />
          </span>
        </div>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-material">
            {t('inventory.material') || 'Material'}
          </label>
          <Dropdown
            inputId="inventory-material"
            value={materialFilter}
            options={materialOptions}
            onChange={(e) => onMaterialChange(e.value)}
            placeholder={t('inventory.material') || 'Material'}
            className="inventory-filters__control"
          />
        </div>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-workshop">
            {t('sidebar.workshops') || 'Workshop'}
          </label>
          <Dropdown
            inputId="inventory-workshop"
            value={altierFilter}
            options={altierOptions}
            onChange={(e) => onAltierChange(e.value)}
            placeholder={t('sidebar.workshops') || 'Workshop'}
            className="inventory-filters__control"
          />
        </div>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-status">
            {t('inventory.status') || 'Status'}
          </label>
          <Dropdown
            inputId="inventory-status"
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => onStatusChange(e.value)}
            placeholder={t('inventory.status') || 'Status'}
            className="inventory-filters__control"
          />
        </div>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-color">
            {t('inventory.color') || 'Color'}
          </label>
          <Dropdown
            inputId="inventory-color"
            value={colorFilter}
            options={colorOptions}
            onChange={(e) => onColorChange(e.value)}
            placeholder={t('inventory.color') || 'Color'}
            className="inventory-filters__control"
          />
        </div>
        <div className="inventory-filters__field inventory-filters__field--compact">
          <label className="inventory-filters__label" htmlFor="inventory-plies">
            {t('rolls.plies') || 'Plies'}
          </label>
          <InputText
            id="inventory-plies"
            value={nbPlisFilter}
            onChange={(e) => onNbPlisChange(e.target.value)}
            type="number"
            min={0}
            placeholder={t('rolls.plies') || 'Plies'}
            className="inventory-filters__input"
          />
        </div>
        <div className="inventory-filters__field inventory-filters__field--compact">
          <label className="inventory-filters__label" htmlFor="inventory-thickness">
            {t('rolls.thickness') || 'Thickness'}
          </label>
          <InputText
            id="inventory-thickness"
            value={thicknessFilter}
            onChange={(e) => onThicknessChange(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            placeholder={t('rolls.thickness') || 'Thickness'}
            className="inventory-filters__input"
          />
        </div>
      </div>
    </div>
  );
}
