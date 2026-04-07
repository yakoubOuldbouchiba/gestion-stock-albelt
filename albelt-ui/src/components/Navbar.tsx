import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Package, User, X } from 'lucide-react';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import '../styles/Navbar.css';

type NavbarProps = {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
};

export function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="navbar-brand">
          <div className="brand-icon">
            <Package size={28} />
          </div>
          <h2>ALBELT</h2>
        </div>
        <div className="navbar-title">
          {t('common.systemTitle') || 'Stock Management System'}
        </div>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <span className="username">{user?.username}</span>
          <span className={`role-badge role-${user?.role.toLowerCase()}`}>
            {user?.role}
          </span>
        </div>
        <LanguageSwitcher />
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={18} />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
