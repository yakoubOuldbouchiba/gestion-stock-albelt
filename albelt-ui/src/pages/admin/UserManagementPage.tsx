import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Paginator } from 'primereact/paginator';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { PasswordResetModal } from '../../components/admin/PasswordResetModal';
import { UserService } from '../../services/userService';
import { useI18n } from '@hooks/useI18n';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from '../../types/index';
import '../../styles/AdminPages.css';

function roleSeverity(role: UserRole): 'info' | 'success' | 'warning' | 'secondary' | 'danger' {
  switch (role) {
    case 'SUPER_ADMIN': return 'danger';
    case 'ADMIN':       return 'info';
    case 'OPERATOR':    return 'success';
    case 'READONLY':    return 'secondary';
  }
}

export default function UserManagementPage() {
  const toast   = useRef<Toast>(null);
  const { t }   = useI18n();

  const ROLE_FILTER_OPTIONS = [
    { label: t('admin.users.roleOptions.all'),        value: '' },
    { label: t('admin.users.roleOptions.superAdmin'), value: 'SUPER_ADMIN' },
    { label: t('admin.users.roleOptions.admin'),      value: 'ADMIN' },
    { label: t('admin.users.roleOptions.operator'),   value: 'OPERATOR' },
    { label: t('admin.users.roleOptions.readonly'),   value: 'READONLY' },
  ];

  const STATUS_FILTER_OPTIONS = [
    { label: t('admin.users.statusOptions.all'),      value: '' },
    { label: t('admin.users.statusOptions.active'),   value: 'ACTIVE' },
    { label: t('admin.users.statusOptions.inactive'), value: 'INACTIVE' },
  ];

  // Data
  const [users, setUsers]         = useState<User[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 15;

  // Modals
  const [showUserModal, setShowUserModal]     = useState(false);
  const [selectedUser, setSelectedUser]       = useState<User | null>(null);
  const [isSavingUser, setIsSavingUser]       = useState(false);
  const [showPwModal, setShowPwModal]         = useState(false);
  const [isSavingPw, setIsSavingPw]           = useState(false);
  const [pwTargetUser, setPwTargetUser]       = useState<User | null>(null);

  const showToast = (severity: 'success' | 'error', summary: string, detail?: string) =>
    toast.current?.show({ severity, summary, detail, life: 4000 });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await UserService.getAll({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        role: role as UserRole || undefined,
        status: status || undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data.items);
        setTotal(res.data.totalElements);
      }
    } catch {
      showToast('error', t('admin.users.toastLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Create / edit user
  const handleSaveUser = async (data: CreateUserRequest | UpdateUserRequest) => {
    setIsSavingUser(true);
    try {
      if (selectedUser) {
        await UserService.updateUser(selectedUser.id, data as UpdateUserRequest);
        showToast('success', t('admin.users.toastUpdated'));
      } else {
        await UserService.createUser(data as CreateUserRequest);
        showToast('success', t('admin.users.toastCreated'));
      }
      setShowUserModal(false);
      loadUsers();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? t('admin.users.toastFailed'));
    } finally {
      setIsSavingUser(false);
    }
  };

  // Reset password
  const handleResetPassword = async (data: ChangePasswordRequest) => {
    if (!pwTargetUser) return;
    setIsSavingPw(true);
    try {
      await UserService.resetPassword(pwTargetUser.id, data);
      showToast('success', t('admin.users.toastPwdReset'));
      setShowPwModal(false);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? t('admin.users.toastPwdResetFailed'));
    } finally {
      setIsSavingPw(false);
    }
  };

  // Toggle status
  const handleToggleStatus = (user: User) => {
    confirmDialog({
      message: user.isActive
        ? t('admin.users.confirmDeactivate', { username: user.username })
        : t('admin.users.confirmActivate',   { username: user.username }),
      header:  t('admin.users.confirmHeader'),
      icon:    `pi pi-${user.isActive ? 'ban' : 'check-circle'}`,
      acceptClassName: user.isActive ? 'p-button-danger' : 'p-button-success',
      accept: async () => {
        try {
          await UserService.toggleStatus(user.id, !user.isActive);
          showToast('success', user.isActive ? t('admin.users.toastDeactivated') : t('admin.users.toastActivated'));
          loadUsers();
        } catch {
          showToast('error', t('admin.users.toastStatusFailed'));
        }
      },
    });
  };

  // ---- template columns ----

  const statusTemplate = (u: User) => (
    <Tag
      value={u.isActive ? t('admin.users.statusOptions.active') : t('admin.users.statusOptions.inactive')}
      severity={u.isActive ? 'success' : 'danger'}
    />
  );

  const roleTemplate = (u: User) => (
    <Tag value={u.role.replace('_', ' ')} severity={roleSeverity(u.role)} />
  );

  const actionsTemplate = (u: User) => (
    <div style={{ display: 'flex', gap: '0.3rem' }}>
      <Button
        icon="pi pi-pencil"
        size="small"
        text
        rounded
        tooltip={t('admin.users.tooltipEdit')}
        tooltipOptions={{ position: 'top' }}
        onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
      />
      <Button
        icon="pi pi-lock"
        size="small"
        text
        rounded
        severity="warning"
        tooltip={t('admin.users.tooltipResetPwd')}
        tooltipOptions={{ position: 'top' }}
        onClick={() => { setPwTargetUser(u); setShowPwModal(true); }}
      />
      <Button
        icon={u.isActive ? 'pi pi-ban' : 'pi pi-check-circle'}
        size="small"
        text
        rounded
        severity={u.isActive ? 'danger' : 'success'}
        tooltip={u.isActive ? t('admin.users.tooltipDeactivate') : t('admin.users.tooltipActivate')}
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleToggleStatus(u)}
      />
    </div>
  );

  return (
    <div className="admin-page">
      <Toast ref={toast} position="bottom-center" appendTo={document.body} />
      <ConfirmDialog />

      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{t('admin.users.title')}</h1>
          <p className="admin-page__subtitle">{t('admin.users.subtitle', { count: total })}</p>
        </div>
        <Button
          label={t('admin.users.newUser')}
          icon="pi pi-plus"
          onClick={() => { setSelectedUser(null); setShowUserModal(true); }}
        />
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ width: '260px' }}
          />
        </span>
        <Dropdown
          value={role}
          options={ROLE_FILTER_OPTIONS}
          onChange={e => { setRole(e.value); setPage(0); }}
          style={{ width: '160px' }}
        />
        <Dropdown
          value={status}
          options={STATUS_FILTER_OPTIONS}
          onChange={e => { setStatus(e.value); setPage(0); }}
          style={{ width: '140px' }}
        />
        <Button
          icon="pi pi-refresh"
          text
          rounded
          tooltip={t('admin.users.tooltipRefresh')}
          onClick={loadUsers}
          loading={isLoading}
        />
      </div>

      {/* Table */}
      <DataTable
        value={users}
        loading={isLoading}
        emptyMessage={t('admin.users.noUsersFound')}
        stripedRows
      >
        <Column field="username"  header={t('admin.users.colUsername')}  sortable style={{ minWidth: '140px' }} />
        <Column field="email"     header={t('admin.users.colEmail')}     sortable style={{ minWidth: '200px' }} />
        <Column field="fullName"  header={t('admin.users.colFullName')}           style={{ minWidth: '160px' }} />
        <Column header={t('admin.users.colRole')}   body={roleTemplate}   style={{ minWidth: '120px' }} />
        <Column header={t('admin.users.colStatus')} body={statusTemplate} style={{ minWidth: '90px' }} />
        <Column field="createdAt" header={t('admin.users.colCreated')} sortable
          body={(u: User) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
          style={{ minWidth: '110px' }} />
        <Column field="lastLogin" header={t('admin.users.colLastLogin')}
          body={(u: User) => (u.lastLogin || u.lastLoginDate) ? new Date((u.lastLogin || u.lastLoginDate)!).toLocaleString() : '—'}
          style={{ minWidth: '150px' }} />
        <Column header={t('admin.users.colActions')} body={actionsTemplate} style={{ minWidth: '120px' }} />
      </DataTable>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <Paginator
          first={page * PAGE_SIZE}
          rows={PAGE_SIZE}
          totalRecords={total}
          onPageChange={e => setPage(e.page)}
        />
      )}

      {/* Modals */}
      <UserFormModal
        visible={showUserModal}
        user={selectedUser}
        onHide={() => setShowUserModal(false)}
        onSave={handleSaveUser}
        isSaving={isSavingUser}
      />

      <PasswordResetModal
        visible={showPwModal}
        username={pwTargetUser?.username ?? ''}
        adminMode
        onHide={() => setShowPwModal(false)}
        onSave={handleResetPassword}
        isSaving={isSavingPw}
      />
    </div>
  );
}
