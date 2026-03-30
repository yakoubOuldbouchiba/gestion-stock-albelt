import { useEffect, useState } from 'react';
import { Search, User as UserIcon, MapPin } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import type { User as UserType, UserRole, Altier } from '../types/index';
import { UserService } from '@services/userService';
import { AltierService } from '@services/altierService';
import userAltierService from '@services/userAltierService';
import { Pagination } from '@components/Pagination';
import '../styles/UsersPage.css';

export function UsersPage() {
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
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

    try {
      setError(null);
      const response = await UserService.deactivateUser(userId);
      if (response.success) {
        await loadUsers(page, searchTerm, roleFilter, statusFilter);
      }
    } catch (err) {
      setError(t('messages.failedToDeactivate'));
      console.error(err);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setError(null);
      const response = await UserService.activateUser(userId);
      if (response.success) {
        await loadUsers(page, searchTerm, roleFilter, statusFilter);
      }
    } catch (err) {
      setError(t('messages.failedToActivate'));
      console.error(err);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const response = await UserService.changeRole(selectedUser.id, newRole);
      if (response.success) {
        await loadUsers(page, searchTerm, roleFilter, statusFilter);
        setShowRoleModal(false);
        setSelectedUser(null);
      }
    } catch (err) {
      setError(t('messages.failedToChangeRole'));
      console.error(err);
    }
  };

  const openRoleModal = (user: UserType) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const openAltierModal = async (user: UserType) => {
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

    try {
      setError(null);
      
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

  if (isLoading) {
    return <div className="page-loading">{t('users.loading')}</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>{t('users.title')}</h1>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-value">{totalElements}</span>
            <span className="stat-label">{t('users.totalUsers')}</span>
          </div>
          <div className="stat-badge active">
            <span className="stat-value">{users.filter(u => u.isActive).length}</span>
            <span className="stat-label">{t('users.active')}</span>
          </div>
          <div className="stat-badge inactive">
            <span className="stat-value">{users.filter(u => !u.isActive).length}</span>
            <span className="stat-label">{t('users.inactive')}</span>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>{t('users.roleLabel')}</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'ALL');
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('users.allRoles')}</option>
              <option value="ADMIN">{t('users.roleAdmin')}</option>
              <option value="OPERATOR">{t('users.roleOperator')}</option>
              <option value="READONLY">{t('users.roleReadOnly')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label>{t('users.statusLabel')}</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                setPage(0);
              }}
              className="filter-select"
            >
              <option value="ALL">{t('users.allUsers')}</option>
              <option value="ACTIVE">{t('users.active')}</option>
              <option value="INACTIVE">{t('users.inactive')}</option>
            </select>
          </div>

          <div className="results-count">
            {totalElements} user{totalElements !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('users.changeRoleTitle')}</h2>
            <p>{t('users.updateRoleFor')} <strong>{selectedUser.username}</strong></p>

            <div className="role-selection">
              {roles.map(role => (
                <label key={role} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={newRole === role}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  />
                  <span className="role-label">
                    <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                    <span className="role-description">
                      {role === 'ADMIN' && t('users.adminDesc')}
                      {role === 'OPERATOR' && t('users.operatorDesc')}
                      {role === 'READONLY' && t('users.readonlyDesc')}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleChangeRole}>
                {t('users.updateBtn')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRoleModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAltierModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowAltierModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{t('users.manageAccessTitle')}</h2>
            <p className="modal-subtitle">{t('users.userLabel')} <strong>{selectedUser.username}</strong></p>
            
            <div className="altier-selection">
              <p className="altier-label">{t('users.selectWorkshops')}</p>
              <div className="altier-list">
                {altiers.map(altier => (
                  <label key={altier.id} className="altier-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAltiers.has(altier.id)}
                      onChange={() => toggleAltier(altier.id)}
                    />
                    <span className="altier-name">{altier.libelle}</span>
                    <span className="altier-address">{altier.adresse}</span>
                  </label>
                ))}
              </div>
              {altiers.length === 0 && (
                <p className="empty-state">{t('users.noWorkshops')}</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveAltiers}>
                {t('users.saveChangesBtn')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAltierModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="users-table-container">
        {users.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('users.username')}</th>
                <th>{t('users.email')}</th>
                <th>{t('users.role')}</th>
                <th>{t('common.status')}</th>
                <th>{t('users.lastLogin')}</th>
                <th>{t('users.created')}</th>
                <th>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={`user-row ${!user.isActive ? 'inactive' : ''}`}>
                  <td className="username">{user.username || t('users.notApplicable')}</td>
                  <td className="email">
                    <a href={`mailto:${user.email}`}>{user.email || t('users.notApplicable')}</a>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="timestamp">
                    {formatDate(user.lastLoginDate, t('users.never'))}
                  </td>
                  <td className="timestamp">
                    {formatDate(user.createdAt, t('users.notApplicable'))}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-role"
                        onClick={() => openRoleModal(user)}
                        title={t('users.changeRoleTitle')}
                      >
                        <UserIcon size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-location"
                        onClick={() => openAltierModal(user)}
                        title={t('users.manageAccessTitle')}
                      >
                        <MapPin size={16} />
                      </button>
                      {user.isActive ? (
                        <button
                          className="btn btn-sm btn-deactivate"
                          onClick={() => handleDeactivateUser(user.id)}
                          title={t('users.deactivateBtn')}
                        >
                          {t('users.deactivateBtn')}
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-activate"
                          onClick={() => handleActivateUser(user.id)}
                          title={t('users.activateBtn')}
                        >
                          {t('users.active')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{t('users.noUsersFound')}</p>
            {searchTerm && (
              <p className="empty-state-hint">{t('users.adjustSearchHint')}</p>
            )}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default UsersPage;
