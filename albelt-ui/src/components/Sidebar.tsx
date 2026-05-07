import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Package,
  ArrowRightLeft,
  FileText,
  FilePlus,
  ClipboardList,
  Settings,
  Users,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import '../styles/Sidebar.css';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { t } = useI18n();

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const handleNavigate = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">{t('sidebar.main')}</h3>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <BarChart3 size={20} className="nav-icon" />
            <span>{t('navigation.dashboard')}</span>
          </Link>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">{t('sidebar.operations')}</h3>
          <Link
            to="/inventory"
            className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <Package size={20} className="nav-icon" />
            <span>{t('navigation.inventory')}</span>
          </Link>
          <Link
            to="/commandes"
            className={`nav-link ${isActive('/commandes') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <ClipboardList size={20} className="nav-icon" />
            <span>{t('navigation.orders')}</span>
          </Link>
          <Link
            to="/movements"
            className={`nav-link ${isActive('/movements') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <ArrowRightLeft size={20} className="nav-icon" />
            <span>{t('navigation.movements')}</span>
          </Link>
          <Link
            to="/transfer-bons"
            className={`nav-link ${isActive('/transfer-bons') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <FileText size={20} className="nav-icon" />
            <span>{t('navigation.transferBons')}</span>
          </Link>
          <Link
            to="/purchase-bons"
            className={`nav-link ${isActive('/purchase-bons') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <FilePlus size={20} className="nav-icon" />
            <span>{t('navigation.purchaseBons')}</span>
          </Link>
        </div>

        {isAdmin && (
          <div className="nav-section">
            <h3 className="nav-title">{t('sidebar.configuration')}</h3>
            <Link
              to="/configuration"
              className={`nav-link ${isActive('/configuration') ? 'active' : ''}`}
              onClick={handleNavigate}
            >
              <Settings size={20} className="nav-icon" />
              <span>{t('sidebar.configuration')}</span>
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="nav-section">
            <h3 className="nav-title">{t('sidebar.admin') || 'Administration'}</h3>
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              onClick={handleNavigate}
            >
              <LayoutDashboard size={20} className="nav-icon" />
              <span>{t('navigation.adminDashboard') || 'Admin Dashboard'}</span>
            </Link>
            <Link
              to="/admin/users"
              className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
              onClick={handleNavigate}
            >
              <Users size={20} className="nav-icon" />
              <span>{t('navigation.userManagement') || 'User Management'}</span>
            </Link>
            <Link
              to="/admin/audit-logs"
              className={`nav-link ${isActive('/admin/audit-logs') ? 'active' : ''}`}
              onClick={handleNavigate}
            >
              <ShieldCheck size={20} className="nav-icon" />
              <span>{t('navigation.auditLogs') || 'Audit Logs'}</span>
            </Link>
          </div>
        )}

        <div className="nav-section">
          <h3 className="nav-title">{t('sidebar.reports')}</h3>
          <Link
            to="/reports"
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
            onClick={handleNavigate}
          >
            <BarChart3 size={20} className="nav-icon" />
            <span>{t('navigation.reports')}</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
