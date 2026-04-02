import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Package,
  ArrowRightLeft,
  FileText,
  FilePlus,
  Factory,
  Briefcase,
  Users,
  AlertCircle,
  Contact,
  ClipboardList,
  Palette,
} from 'lucide-react';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import '../styles/Sidebar.css';

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { t } = useI18n();

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">{t('sidebar.main')}</h3>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
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
          >
            <Package size={20} className="nav-icon" />
            <span>{t('navigation.inventory')}</span>
          </Link>
          <Link
            to="/commandes"
            className={`nav-link ${isActive('/commandes') ? 'active' : ''}`}
          >
            <ClipboardList size={20} className="nav-icon" />
            <span>{t('navigation.orders')}</span>
          </Link>
          <Link
            to="/movements"
            className={`nav-link ${isActive('/movements') ? 'active' : ''}`}
          >
            <ArrowRightLeft size={20} className="nav-icon" />
            <span>{t('navigation.movements')}</span>
          </Link>
          <Link
            to="/transfer-bons"
            className={`nav-link ${isActive('/transfer-bons') ? 'active' : ''}`}
          >
            <FileText size={20} className="nav-icon" />
            <span>{t('navigation.transferBons')}</span>
          </Link>
          <Link
            to="/purchase-bons"
            className={`nav-link ${isActive('/purchase-bons') ? 'active' : ''}`}
          >
            <FilePlus size={20} className="nav-icon" />
            <span>{t('navigation.purchaseBons')}</span>
          </Link>

        </div>

        {isAdmin && (
          <div className="nav-section">
            <h3 className="nav-title">{t('sidebar.configuration')}</h3>
            <Link
              to="/suppliers"
              className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}
            >
              <Factory size={20} className="nav-icon" />
              <span>{t('navigation.suppliers')}</span>
            </Link>

            <Link
              to="/clients"
              className={`nav-link ${isActive('/clients') ? 'active' : ''}`}
            >
              <Contact size={20} className="nav-icon" />
              <span>{t('navigation.clients')}</span>
            </Link>

            <Link
              to="/altiers"
              className={`nav-link ${isActive('/altiers') ? 'active' : ''}`}
            >
              <Briefcase size={20} className="nav-icon" />
              <span>{t('sidebar.workshops')}</span>
            </Link>

            <Link
              to="/users"
              className={`nav-link ${isActive('/users') ? 'active' : ''}`}
            >
              <Users size={20} className="nav-icon" />
              <span>{t('navigation.users')}</span>
            </Link>

            <Link
              to="/material-thresholds"
              className={`nav-link ${isActive('/material-thresholds') ? 'active' : ''}`}
            >
              <AlertCircle size={20} className="nav-icon" />
              <span>{t('navigation.materialChute')}</span>
            </Link>

            <Link
              to="/colors"
              className={`nav-link ${isActive('/colors') ? 'active' : ''}`}
            >
              <Palette size={20} className="nav-icon" />
              <span>{t('navigation.colors') || 'Colors'}</span>
            </Link>
          </div>
        )}

        <div className="nav-section">
          <h3 className="nav-title">{t('sidebar.reports')}</h3>
          <Link
            to="/reports"
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
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
