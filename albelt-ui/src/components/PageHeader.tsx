import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="albel-page-header" style={{ marginBottom: '1rem' }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="albel-page-title">{title}</h1>
        {subtitle ? <p style={{ margin: 0 }}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

export default PageHeader;

