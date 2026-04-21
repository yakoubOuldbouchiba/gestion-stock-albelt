import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MetricTile: React.FC<MetricTileProps> = ({ 
  label, 
  value, 
  unit, 
  subValue, 
  className = '',
  children 
}) => {
  return (
    <div className={`metric-tile ${className}`}>
      <div className="metric-tile__label">{label}</div>
      <div className="metric-tile__value">
        {value}
        {unit && <span className="metric-tile__unit">{unit}</span>}
      </div>
      {subValue && <div className="metric-tile__unit" style={{ marginTop: '0.25rem' }}>{subValue}</div>}
      {children}
    </div>
  );
};
