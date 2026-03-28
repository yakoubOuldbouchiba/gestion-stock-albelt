import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { LanguageSwitcher } from '@components/LanguageSwitcher';
import '../styles/LoginPage.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="language-switcher-container">
        <LanguageSwitcher />
      </div>
      <div className="login-box">
        <div className="login-header">
          <h1>ALBELT</h1>
          <p>{t('common.systemTitle') || 'Stock Management System'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError();
              }}
              placeholder={t('auth.username')}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder={t('auth.password')}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('auth.demoUsers') || 'Demo Users'}:</p>
          <ul>
            <li><strong>admin</strong> / <strong>admin123</strong></li>
            <li><strong>ahmed.operator</strong> / <strong>operator123</strong></li>
            <li><strong>fatima.operator</strong> / <strong>operator123</strong></li>
            <li><strong>manager.report</strong> / <strong>test123</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
