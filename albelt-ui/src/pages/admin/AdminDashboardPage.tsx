import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { UserService } from '../../services/userService';
import { AuditLogService } from '../../services/auditLogService';
import type { AuditLog, AuditAction, User } from '../../types/index';
import { useI18n } from '@hooks/useI18n';
import '../../styles/AdminPages.css';

function actionSeverity(a: AuditAction): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
  if (a.includes('FAILURE') || a.includes('DENIED') || a.includes('DEACTIVATED')) return 'danger';
  if (a.includes('RESET') || a.includes('CHANGED')) return 'warning';
  if (a.includes('SUCCESS') || a.includes('CREATED') || a.includes('ACTIVATED')) return 'success';
  return 'info';
}

export default function AdminDashboardPage() {
  const navigate   = useNavigate();
  const toast      = useRef<Toast>(null);
  const { t }      = useI18n();

  const [totalUsers, setTotalUsers]       = useState(0);
  const [activeUsers, setActiveUsers]     = useState(0);
  const [recentLogs, setRecentLogs]       = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [usersRes, logsRes] = await Promise.all([
          UserService.getAll({ page: 0, size: 500 }),
          AuditLogService.getAll({ page: 0, size: 10 }),
        ]);
        if (!cancelled) {
          if (usersRes.success && usersRes.data) {
            const all: User[] = usersRes.data.items;
            setTotalUsers(usersRes.data.totalElements);
            setActiveUsers(all.filter(u => u.isActive).length);
          }
          if (logsRes.success && logsRes.data) {
            setRecentLogs(logsRes.data.items);
          }
        }
      } catch {
        if (!cancelled) toast.current?.show({ severity: 'error', summary: t('admin.dashboard.failedToLoad'), life: 3000 });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="admin-page">
      <Toast ref={toast} position="bottom-center" appendTo={document.body} />

      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{t('admin.dashboard.title')}</h1>
          <p className="admin-page__subtitle">{t('admin.dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">{t('admin.dashboard.statsTotal')}</span>
          <span className="admin-stat-card__value" style={{ color: '#0284c7' }}>{totalUsers}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">{t('admin.dashboard.statsActive')}</span>
          <span className="admin-stat-card__value" style={{ color: '#16a34a' }}>{activeUsers}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">{t('admin.dashboard.statsInactive')}</span>
          <span className="admin-stat-card__value" style={{ color: '#dc2626' }}>{totalUsers - activeUsers}</span>
        </div>
      </div>

      {/* Quick-links */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Card
          title={t('admin.dashboard.cardUsersTitle')}
          subTitle={t('admin.dashboard.cardUsersSubtitle')}
          style={{ flex: '1 1 260px' }}
          footer={
            <Button
              label={t('admin.dashboard.cardUsersBtn')}
              icon="pi pi-users"
              onClick={() => navigate('/admin/users')}
            />
          }
        />
        <Card
          title={t('admin.dashboard.cardLogsTitle')}
          subTitle={t('admin.dashboard.cardLogsSubtitle')}
          style={{ flex: '1 1 260px' }}
          footer={
            <Button
              label={t('admin.dashboard.cardLogsBtn')}
              icon="pi pi-list"
              severity="secondary"
              onClick={() => navigate('/admin/audit-logs')}
            />
          }
        />
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('admin.dashboard.recentActivity')}</h2>
        <DataTable
          value={recentLogs}
          loading={isLoading}
          emptyMessage={t('admin.dashboard.noRecentActivity')}
          stripedRows
        >
          <Column
            field="timestamp"
            header={t('admin.dashboard.colTime')}
            body={(l: AuditLog) => new Date(l.timestamp).toLocaleString()}
            style={{ minWidth: '160px' }}
          />
          <Column field="actorUsername" header={t('admin.dashboard.colActor')} style={{ minWidth: '120px' }} />
          <Column
            field="action"
            header={t('admin.dashboard.colAction')}
            body={(l: AuditLog) => (
              <Tag value={l.action.replace(/_/g, ' ')} severity={actionSeverity(l.action)} />
            )}
            style={{ minWidth: '170px' }}
          />
          <Column field="targetEntity" header={t('admin.dashboard.colEntity')} style={{ minWidth: '100px' }} />
        </DataTable>
      </div>
    </div>
  );
}
