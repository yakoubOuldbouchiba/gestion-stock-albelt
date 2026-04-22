import type { ReactNode } from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  tags?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, tags, children }: PageHeaderProps) {
  return (
    <header className="albel-page-header">
      <div className="albel-page-title-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>{title}</h1>
            {tags && <div style={{ display: 'flex', gap: '0.5rem' }}>{tags}</div>}
          </div>
          {subtitle && <p className="albel-page-subtitle">{subtitle}</p>}
        </div>
        
        {actions && (
          <div className="albel-page-action-bar">
            {actions}
          </div>
        )}
      </div>
      
      {children && (
        <div className="albel-page-header-children">
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;

