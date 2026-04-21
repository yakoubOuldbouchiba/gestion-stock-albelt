import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import type { MaterialType, RollStatus } from '../../types';
import type { Translate } from '../commande/commandeTypes';
import '../../styles/InventoryFilters.css';

type InventoryFiltersProps = {
  t: Translate;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  materialFilter: MaterialType;
  materialOptions: { label: string; value: MaterialType }[];
  onMaterialChange: (value: MaterialType) => void;
  altierFilter: string;
  altierOptions: { label: string; value: string }[];
  onAltierChange: (value: string) => void;
  statusFilter: RollStatus;
  statusOptions: { label: string; value: RollStatus }[];
  onStatusChange: (value: RollStatus) => void;
  colorFilter: string;
  colorOptions: { label: string; value: string }[];
  onColorChange: (value: string) => void;
  nbPlisFilter: string;
  onNbPlisChange: (value: string) => void;
  thicknessFilter: string;
  onThicknessChange: (value: string) => void;
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
}: InventoryFiltersProps) {
  return (
    <div className="inventory-filters-industrial">
      <div className="inventory-filters__field">
        <label className="inventory-filters__label" htmlFor="inventory-search">
          {t('inventory.search') || 'Search'}
        </label>
        <span className="p-input-icon-left inventory-filters__control">
          <i className="pi pi-search" />
          <InputText
            id="inventory-search"
            placeholder={t('inventory.search') || 'Search reference, ID...'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="p-inputtext-sm"
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
          className="p-inputtext-sm"
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
          className="p-inputtext-sm"
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
          className="p-inputtext-sm"
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
          className="p-inputtext-sm"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-plies">
            {t('rolls.plies') || 'Plies'}
          </label>
          <InputText
            id="inventory-plies"
            value={nbPlisFilter}
            onChange={(e) => onNbPlisChange(e.target.value)}
            type="number"
            min={0}
            placeholder="Qty"
            className="p-inputtext-sm"
          />
        </div>
        <div className="inventory-filters__field">
          <label className="inventory-filters__label" htmlFor="inventory-thickness">
            {t('rolls.thickness') || 'Thick.'}
          </label>
          <InputText
            id="inventory-thickness"
            value={thicknessFilter}
            onChange={(e) => onThicknessChange(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            placeholder="mm"
            className="p-inputtext-sm"
          />
        </div>
      </div>
    </div>
  );
}
