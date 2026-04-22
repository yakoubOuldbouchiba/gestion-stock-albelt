import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import type { TFunction } from 'i18next';
import { PrimeReactDropdown } from '..';
import type { CommandeStatus } from '../../types';
import type { WorkbenchClientOption, WorkbenchStatusOption } from './CommandesWorkbench.types';

interface CommandesWorkbenchFiltersProps {
  t: TFunction;
  search: string;
  onSearchChange: (value: string) => void;
  status: CommandeStatus | '';
  onStatusChange: (value: CommandeStatus | '') => void;
  clientId: string | '';
  onClientChange: (value: string | '') => void;
  clientsLoading: boolean;
  statusOptions: WorkbenchStatusOption[];
  clientOptions: WorkbenchClientOption[];
}

export function CommandesWorkbenchFilters({
  t,
  search,
  onSearchChange,
  status,
  onStatusChange,
  clientId,
  onClientChange,
  clientsLoading,
  statusOptions,
  clientOptions,
}: CommandesWorkbenchFiltersProps) {
  return (
    <Card className="orders-workbench__filters-card">
      <div className="orders-workbench__filters">
        <span className="p-input-icon-left orders-workbench__search">
          <i className="pi pi-search" />
          <InputText
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('ordersWorkbench.searchOrderNumberOrClient')}
          />
        </span>

        <PrimeReactDropdown
          options={statusOptions}
          value={status}
          onChange={(e) => onStatusChange(e.value)}
          placeholder={t('ordersWorkbench.statusFilter', 'Status')}
          label={t('ordersWorkbench.statusFilter', 'Status')}
          className="orders-workbench__filter-dropdown"
        />

        <PrimeReactDropdown
          options={clientOptions}
          value={clientId}
          onChange={(e) => onClientChange(e.value)}
          placeholder={t('ordersWorkbench.clientFilter', 'Client')}
          label={t('ordersWorkbench.clientFilter', 'Client')}
          isLoading={clientsLoading}
          className="orders-workbench__filter-dropdown"
        />
      </div>

      <div className="orders-workbench__filter-pills">
        {statusOptions.slice(1).map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={`orders-workbench__filter-pill ${status === option.value ? 'is-active' : ''}`}
            onClick={() => onStatusChange(status === option.value ? '' : option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
