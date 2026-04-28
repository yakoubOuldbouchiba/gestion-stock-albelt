import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import type { User as UserType, UserRole, Altier } from '../types/index';
import { UserService } from '@services/userService';
import { AltierService } from '@services/altierService';
import userAltierService from '@services/userAltierService';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox } from 'primereact/checkbox';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { PageHeader } from '../components/PageHeader';

export function UsersPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserType[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAltierModal, setShowAltierModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [selectedAltiers, setSelectedAltiers] = useState<Set<string>>(new Set());
  const { run, isLocked } = useAsyncLock();
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const pageSize = 20;

  const roles: UserRole[] = ['ADMIN', 'OPERATOR', 'READONLY'];

  useEffect(() => {
    loadUsers(page, searchTerm, roleFilter, statusFilter);
    loadAltiers();
  }, [page, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async (
    pageIndex: number,
    search: string,
    role: UserRole | 'ALL',
    status: 'ALL' | 'ACTIVE' | 'INACTIVE'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await UserService.getAll({
        page: pageIndex,
        size: pageSize,
        search: search || undefined,
        role: role === 'ALL' ? undefined : role,
        status: status === 'ALL' ? undefined : status,
      });
      if (response.success && response.data) {
        setUsers(response.data.items || []);
        setTotalElements(response.data.totalElements || 0);
      }

      const [activeRes, inactiveRes] = await Promise.all([
        UserService.count({
          search: search || undefined,
          role: role === 'ALL' ? undefined : role,
          status: 'ACTIVE',
        }),
        UserService.count({
          search: search || undefined,
          role: role === 'ALL' ? undefined : role,
          status: 'INACTIVE',
        }),
      ]);
      setActiveCount(activeRes.success && activeRes.data != null ? activeRes.data : 0);
      setInactiveCount(inactiveRes.success && inactiveRes.data != null ? inactiveRes.data : 0);
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAltiers = async () => {
    try {
      const response = await AltierService.getAll({ page: 0, size: 200 });
      if (response.success && response.data) {
        setAltiers(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load altiers:', err);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!window.confirm(t('messages.confirmDelete'))) {
      return;
    }
    if (isLocked()) {
      return;
    }

    try {
      setError(null);
      await run(async () => {
        const response = await UserService.deactivateUser(userId);
        if (response.success) {
          await loadUsers(page, searchTerm, roleFilter, statusFilter);
        }
      }, `user-status-${userId}`);
    } catch (err) {
      setError(t('messages.failedToDeactivate'));
      console.error(err);
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (isLocked()) {
      return;
    }
    try {
      setError(null);
      await run(async () => {
        const response = await UserService.activateUser(userId);
        if (response.success) {
          await loadUsers(page, searchTerm, roleFilter, statusFilter);
        }
      }, `user-status-${userId}`);
    } catch (err) {
      setError(t('messages.failedToActivate'));
      console.error(err);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    if (isLocked('user-role')) return;

    try {
      setError(null);
      await run(async () => {
        const response = await UserService.changeRole(selectedUser.id, newRole);
        if (response.success) {
          await loadUsers(page, searchTerm, roleFilter, statusFilter);
          setShowRoleModal(false);
          setSelectedUser(null);
        }
      }, 'user-role');
    } catch (err) {
      setError(t('messages.failedToChangeRole'));
      console.error(err);
    }
  };

  const openRoleModal = (user: UserType) => {
    if (isLocked()) {
      return;
    }
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const openAltierModal = async (user: UserType) => {
    if (isLocked()) {
      return;
    }
    setSelectedUser(user);
    try {
      const userAltiers = await userAltierService.getAltiersByUser(user.id);
      const selectedIds = new Set(userAltiers.map(ua => ua.altier.id));
      setSelectedAltiers(selectedIds);
    } catch (err) {
      console.error('Failed to load user altiers:', err);
      setSelectedAltiers(new Set());
    }
    setShowAltierModal(true);
  };

  const handleSaveAltiers = async () => {
    if (!selectedUser) return;
    if (isLocked('user-altier')) return;

    try {
      setError(null);
      await run(async () => {
        // Get current assignments
        const current = await userAltierService.getAltiersByUser(selectedUser.id);
        const currentIds = new Set(current.map(ua => ua.altier.id));

        // Find what to add and remove
        const toAdd = Array.from(selectedAltiers).filter(id => !currentIds.has(id));
        const toRemove = Array.from(currentIds).filter(id => !selectedAltiers.has(id));

        // Make API calls
        for (const altierId of toRemove) {
          await userAltierService.unassignAltier(selectedUser.id, altierId);
        }
        for (const altierId of toAdd) {
          await userAltierService.assignAltier(selectedUser.id, altierId);
        }

        setShowAltierModal(false);
        setSelectedUser(null);
      }, 'user-altier');
    } catch (err) {
      setError('Failed to update altier assignments');
      console.error(err);
    }
  };

  const toggleAltier = (altierId: string) => {
    const newSet = new Set(selectedAltiers);
    if (newSet.has(altierId)) {
      newSet.delete(altierId);
    } else {
      newSet.add(altierId);
    }
    setSelectedAltiers(newSet);
  };

  const roleOptions = useMemo(() => (
    [
      { label: t('users.allRoles'), value: 'ALL' as const },
      { label: t('users.roleAdmin'), value: 'ADMIN' as const },
      { label: t('users.roleOperator'), value: 'OPERATOR' as const },
      { label: t('users.roleReadOnly'), value: 'READONLY' as const },
    ]
  ), [t]);

  const statusOptions = useMemo(() => (
    [
      { label: t('users.allUsers'), value: 'ALL' as const },
      { label: t('users.active'), value: 'ACTIVE' as const },
      { label: t('users.inactive'), value: 'INACTIVE' as const },
    ]
  ), [t]);

  const isBusy = isLocked();

  const roleDialogFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button label={t('common.cancel')} severity="secondary" onClick={() => setShowRoleModal(false)} disabled={isLocked('user-role')} />
      <Button label={t('users.updateBtn')} onClick={handleChangeRole} loading={isLocked('user-role')} disabled={isLocked('user-role')} />
    </div>
  );

  const altierDialogFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button label={t('common.cancel')} severity="secondary" onClick={() => setShowAltierModal(false)} disabled={isLocked('user-altier')} />
      <Button label={t('users.saveChangesBtn')} onClick={handleSaveAltiers} loading={isLocked('user-altier')} disabled={isLocked('user-altier')} />
    </div>
  );

  const roleSeverity = (role: UserRole) => {
    if (role === 'ADMIN') return 'danger';
    if (role === 'OPERATOR') return 'info';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title={t('users.title')}
          tags={
            <>
              <Tag value={`${totalElements} ${t('users.totalUsers')}`} severity="info" />
              <Tag value={`${activeCount} ${t('users.active')}`} severity="success" />
              <Tag value={`${inactiveCount} ${t('users.inactive')}`} severity="secondary" />
            </>
          }
        />
      )}

      {hideHeader && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Tag value={`${totalElements} ${t('users.totalUsers')}`} severity="info" />
          <Tag value={`${activeCount} ${t('users.active')}`} severity="success" />
          <Tag value={`${inactiveCount} ${t('users.inactive')}`} severity="secondary" />
        </div>
      )}

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
        <span className="p-input-icon-left" style={{ width: '100%', maxWidth: '360px' }}>
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            placeholder={t('users.searchPlaceholder')}
            style={{ width: '100%' }}
          />
        </span>
        <Dropdown
          value={roleFilter}
          options={roleOptions}
          onChange={(e) => {
            setRoleFilter(e.value as UserRole | 'ALL');
            setPage(0);
          }}
          placeholder={t('users.roleLabel')}
          style={{ minWidth: '200px' }}
        />
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => {
            setStatusFilter(e.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
            setPage(0);
          }}
          placeholder={t('users.statusLabel')}
          style={{ minWidth: '200px' }}
        />
      </div>

      <DataTable
        value={users}
        dataKey="id"
        lazy
        paginator
        first={page * pageSize}
        rows={pageSize}
        totalRecords={totalElements}
        onPage={(e) => setPage(e.page ?? 0)}
        emptyMessage={t('users.noUsersFound')}
        size="small"
      >
        <Column header={t('users.username')} body={(row: UserType) => row.username || t('users.notApplicable')} />
        <Column
          header={t('users.email')}
          body={(row: UserType) => row.email ? <a href={`mailto:${row.email}`}>{row.email}</a> : t('users.notApplicable')}
        />
        <Column
          header={t('users.role')}
          body={(row: UserType) => (
            <Tag value={row.role} severity={roleSeverity(row.role)} />
          )}
        />
        <Column
          header={t('common.status')}
          body={(row: UserType) => (
            <Tag value={row.isActive ? t('users.active') : t('users.inactive')} severity={row.isActive ? 'success' : 'secondary'} />
          )}
        />
        <Column header={t('users.lastLogin')} body={(row: UserType) => formatDate(row.lastLoginDate, t('users.never'))} />
        <Column header={t('users.created')} body={(row: UserType) => formatDate(row.createdAt, t('users.notApplicable'))} />
        <Column
          header={t('common.action')}
          body={(row: UserType) => (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button icon="pi pi-user-edit" text onClick={() => openRoleModal(row)} aria-label={t('users.changeRoleTitle')} disabled={isBusy} />
              <Button icon="pi pi-map-marker" text onClick={() => openAltierModal(row)} aria-label={t('users.manageAccessTitle')} disabled={isBusy} />
              {row.isActive ? (
                <Button
                  label={t('users.deactivateBtn')}
                  severity="danger"
                  text
                  onClick={() => handleDeactivateUser(row.id)}
                  loading={isLocked(`user-status-${row.id}`)}
                  disabled={isBusy}
                />
              ) : (
                <Button
                  label={t('users.activateBtn')}
                  text
                  onClick={() => handleActivateUser(row.id)}
                  loading={isLocked(`user-status-${row.id}`)}
                  disabled={isBusy}
                />
              )}
            </div>
          )}
        />
      </DataTable>

      <Dialog
        header={t('users.changeRoleTitle')}
        visible={showRoleModal && !!selectedUser}
        onHide={() => setShowRoleModal(false)}
        footer={roleDialogFooter}
        style={{ width: 'min(520px, 95vw)' }}
      >
        {selectedUser && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>{t('users.updateRoleFor')} <strong>{selectedUser.username}</strong></div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {roles.map((role) => (
                <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <RadioButton
                    inputId={`role-${role}`}
                    value={role}
                    checked={newRole === role}
                    onChange={(e) => setNewRole(e.value as UserRole)}
                  />
                  <label htmlFor={`role-${role}`} style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>{role}</span>
                    <small style={{ color: 'var(--text-color-secondary)' }}>
                      {role === 'ADMIN' && t('users.adminDesc')}
                      {role === 'OPERATOR' && t('users.operatorDesc')}
                      {role === 'READONLY' && t('users.readonlyDesc')}
                    </small>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header={t('users.manageAccessTitle')}
        visible={showAltierModal && !!selectedUser}
        onHide={() => setShowAltierModal(false)}
        footer={altierDialogFooter}
        style={{ width: 'min(600px, 95vw)' }}
      >
        {selectedUser && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>{t('users.userLabel')} <strong>{selectedUser.username}</strong></div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div>{t('users.selectWorkshops')}</div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {altiers.map((altier) => (
                  <div key={altier.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Checkbox
                      inputId={`altier-${altier.id}`}
                      checked={selectedAltiers.has(altier.id)}
                      onChange={() => toggleAltier(altier.id)}
                      disabled={isLocked('user-altier')}
                    />
                    <label htmlFor={`altier-${altier.id}`}>
                      <strong>{altier.libelle}</strong> <span style={{ color: 'var(--text-color-secondary)' }}>{altier.adresse}</span>
                    </label>
                  </div>
                ))}
                {altiers.length === 0 && (
                  <Message severity="info" text={t('users.noWorkshops')} />
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default UsersPage;
