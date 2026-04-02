import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { LanguageSwitcher } from '@components/LanguageSwitcher';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--surface-ground)',
      }}
    >
      <div style={{ width: 'min(440px, 100%)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <LanguageSwitcher />
        </div>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0 }}>ALBELT</h1>
              <p style={{ margin: '0.25rem 0 0' }}>{t('common.systemTitle') || 'Stock Management System'}</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-fluid"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  {t('auth.username')}
                </label>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  placeholder={t('auth.username') || ''}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  {t('auth.password')}
                </label>
                <InputText
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder={t('auth.password') || ''}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && <Message severity="error" text={error} />}

              <Button
                type="submit"
                label={isLoading ? t('common.loading') : t('auth.login')}
                disabled={isLoading}
              />
            </form>

            <div>
              <p style={{ margin: '0 0 0.5rem' }}>{t('auth.demoUsers') || 'Demo Users'}:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                <li>
                  <strong>admin</strong> / <strong>admin123</strong>
                </li>
                <li>
                  <strong>ahmed.operator</strong> / <strong>operator123</strong>
                </li>
                <li>
                  <strong>fatima.operator</strong> / <strong>operator123</strong>
                </li>
                <li>
                  <strong>manager.report</strong> / <strong>test123</strong>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
