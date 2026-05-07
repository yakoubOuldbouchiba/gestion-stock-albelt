import { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Paginator } from 'primereact/paginator';
import { Tooltip } from 'primereact/tooltip';
import { AuditLogService } from '../../services/auditLogService';
import { useI18n } from '@hooks/useI18n';
import type { AuditLog, AuditAction } from '../../types/index';
import '../../styles/AdminPages.css';

function actionSeverity(action: AuditAction): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
  if (action.includes('FAILURE') || action.includes('DENIED') || action.includes('DEACTIVATED')) return 'danger';
  if (action.includes('RESET') || action.includes('CHANGED')) return 'warning';
  if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('ACTIVATED')) return 'success';
  return 'info';
}

function formatDate(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export default function AuditLogsPage() {
  const toast   = useRef<Toast>(null);
  const { t }   = useI18n();

  const ACTION_OPTIONS = [
    { label: t('admin.auditLogs.actions.all'),              value: '' },
    { label: t('admin.auditLogs.actions.loginSuccess'),     value: 'LOGIN_SUCCESS' },
    { label: t('admin.auditLogs.actions.loginFailure'),     value: 'LOGIN_FAILURE' },
    { label: t('admin.auditLogs.actions.userCreated'),      value: 'USER_CREATED' },
    { label: t('admin.auditLogs.actions.userUpdated'),      value: 'USER_UPDATED' },
    { label: t('admin.auditLogs.actions.userActivated'),    value: 'USER_ACTIVATED' },
    { label: t('admin.auditLogs.actions.userDeactivated'),  value: 'USER_DEACTIVATED' },
    { label: t('admin.auditLogs.actions.passwordChanged'),  value: 'USER_PASSWORD_CHANGED' },
    { label: t('admin.auditLogs.actions.passwordReset'),    value: 'USER_PASSWORD_RESET' },
    { label: t('admin.auditLogs.actions.roleChanged'),      value: 'USER_ROLE_CHANGED' },
    { label: t('admin.auditLogs.actions.accessDenied'),     value: 'ACCESS_DENIED' },
  ];

  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [actorFilter, setActorFilter]   = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom]         = useState<Date | null>(null);
  const [dateTo, setDateTo]             = useState<Date | null>(null);
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 20;

  const toIso = (d: Date | null) => d ? d.toISOString().split('T')[0] : undefined;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AuditLogService.getAll({
        page,
        size: PAGE_SIZE,
        targetEntity: entityFilter || undefined,
        action:       actionFilter as AuditAction || undefined,
        dateFrom:     toIso(dateFrom),
        dateTo:       toIso(dateTo),
      });
      if (res.success && res.data) {
        setLogs(res.data.items);
        setTotal(res.data.totalElements);
      }
    } catch {
      toast.current?.show({ severity: 'error', summary: t('admin.auditLogs.failedToLoad'), life: 3000 });
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const metadataBody = (log: AuditLog) => {
    if (!log.metadata) return null;
    return (
      <>
        <i
          className="pi pi-info-circle metadata-icon"
          data-pr-tooltip={log.metadata}
          data-pr-position="left"
          style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
        />
        <Tooltip target=".metadata-icon" />
      </>
    );
  };

  return (
    <div className="admin-page">
      <Toast ref={toast} position="bottom-center" appendTo={document.body} />

      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{t('admin.auditLogs.title')}</h1>
          <p className="admin-page__subtitle">{t('admin.auditLogs.subtitle', { count: total.toLocaleString() })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <Dropdown
          value={actionFilter}
          options={ACTION_OPTIONS}
          onChange={e => { setActionFilter(e.value); setPage(0); }}
          placeholder={t('admin.auditLogs.filterByAction')}
          className="audit-filter-dropdown"
        />
        <InputText
          placeholder={t('admin.auditLogs.filterEntity')}
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(0); }}
          className="audit-filter-text"
        />
        <div className="audit-date-range">
          <i className="pi pi-calendar audit-date-range__icon" />
          <Calendar
            value={dateFrom}
            onChange={e => { setDateFrom(e.value as Date | null); setPage(0); }}
            placeholder={t('admin.auditLogs.filterFrom')}
            dateFormat="yy-mm-dd"
            showButtonBar
            inputClassName="audit-date-input"
          />
          <span className="audit-date-range__sep">–</span>
          <Calendar
            value={dateTo}
            onChange={e => { setDateTo(e.value as Date | null); setPage(0); }}
            placeholder={t('admin.auditLogs.filterTo')}
            dateFormat="yy-mm-dd"
            showButtonBar
            inputClassName="audit-date-input"
          />
        </div>
        <div className="audit-filter-actions">
          <Button
            label={t('admin.auditLogs.btnClear')}
            icon="pi pi-filter-slash"
            severity="secondary"
            outlined
            onClick={() => {
              setActionFilter('');
              setEntityFilter('');
              setDateFrom(null);
              setDateTo(null);
              setActorFilter('');
              setPage(0);
            }}
          />
          <Button
            icon="pi pi-refresh"
            rounded
            outlined
            severity="secondary"
            tooltip={t('admin.auditLogs.btnRefresh')}
            tooltipOptions={{ position: 'top' }}
            onClick={loadLogs}
            loading={isLoading}
          />
        </div>
      </div>

      <DataTable
        value={logs}
        loading={isLoading}
        emptyMessage={t('admin.auditLogs.noEvents')}
        stripedRows
        scrollable
        scrollHeight="calc(100vh - 360px)"
      >
        <Column
          field="timestamp"
          header={t('admin.auditLogs.colTimestamp')}
          body={(l: AuditLog) => formatDate(l.timestamp)}
          style={{ minWidth: '170px', whiteSpace: 'nowrap' }}
          sortable
        />
        <Column field="actorUsername" header={t('admin.auditLogs.colActor')}  style={{ minWidth: '130px' }} />
        <Column
          field="action"
          header={t('admin.auditLogs.colAction')}
          body={(l: AuditLog) => (
            <Tag value={l.action.replace(/_/g, ' ')} severity={actionSeverity(l.action)} />
          )}
          style={{ minWidth: '170px' }}
        />
        <Column field="targetEntity" header={t('admin.auditLogs.colEntity')} style={{ minWidth: '100px' }} />
        <Column field="targetId"     header={t('admin.auditLogs.colTargetId')} style={{ minWidth: '140px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
        <Column field="ipAddress"    header={t('admin.auditLogs.colIp')}    style={{ minWidth: '120px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
        <Column header={t('admin.auditLogs.colMeta')} body={metadataBody} style={{ minWidth: '60px', textAlign: 'center' }} />
      </DataTable>

      {total > PAGE_SIZE && (
        <Paginator
          first={page * PAGE_SIZE}
          rows={PAGE_SIZE}
          totalRecords={total}
          onPageChange={e => setPage(e.page)}
        />
      )}
    </div>
  );
}
