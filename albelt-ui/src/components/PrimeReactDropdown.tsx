import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import '../styles/PrimeReactDropdown.css';

interface DropdownOption {
  label: string;
  value: any;
}

interface PrimeReactDropdownProps {
  options: DropdownOption[];
  value: any;
  onChange: (event: DropdownChangeEvent) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  emptyMessage?: string;
  showFilter?: boolean;
  filterPlaceholder?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  required?: boolean;
  className?: string;
}

export function PrimeReactDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error = false,
  errorMessage,
  disabled = false,
  emptyMessage = 'No options found',
  showFilter = true,
  filterPlaceholder = 'Search...',
  isLoading = false,
  loadingMessage = 'Loading...',
  required = false,
  className = '',
}: PrimeReactDropdownProps) {
  return (
    <div className={`primereact-dropdown-wrapper ${className}`}>
      {label && (
        <label className={`dropdown-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}

      <Dropdown
        value={value}
        onChange={onChange}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder={placeholder}
        disabled={disabled || isLoading}
        emptyMessage={isLoading ? loadingMessage : emptyMessage}
        filter={showFilter}
        filterPlaceholder={filterPlaceholder}
        showClear={false}
        filterInputAutoFocus={false}
        className={`w-100 ${error ? 'p-invalid' : ''}`}
        panelClassName="primereact-dropdown-panel"
      />

      {error && errorMessage && (
        <small className="p-error">{errorMessage}</small>
      )}
    </div>
  );
}
