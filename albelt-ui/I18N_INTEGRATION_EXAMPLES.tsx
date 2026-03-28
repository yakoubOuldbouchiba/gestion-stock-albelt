// Example: How to integrate i18n into your Navbar component

import { useI18n } from '../hooks/useI18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export const NavbarWithI18nExample = () => {
  const { t, isArabic } = useI18n();

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      direction: isArabic() ? 'rtl' : 'ltr'
    }}>
      {/* Logo/Brand */}
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        {t('common.welcome')}
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href="/dashboard">{t('navigation.dashboard')}</a>
        <a href="/inventory">{t('navigation.inventory')}</a>
        <a href="/reports">{t('navigation.reports')}</a>
      </div>

      {/* Language Switcher */}
      <LanguageSwitcher />
    </nav>
  );
};

// Example Page Component
import { useI18n } from '../hooks/useI18n';

export const ExamplePage = () => {
  const { t, changeLanguage } = useI18n();

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <p>{t('messages.noDataAvailable')}</p>

      {/* Manual language buttons (alternative to LanguageSwitcher) */}
      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('fr')}>Français</button>
        <button onClick={() => changeLanguage('ar')}>العربية</button>
      </div>
    </div>
  );
};

// Example Form Component
import { useI18n } from '../hooks/useI18n';

export const FormExample = () => {
  const { t } = useI18n();

  return (
    <form>
      <label>{t('users.fullName')}</label>
      <input type="text" placeholder={t('users.fullName')} />

      <label>{t('users.email')}</label>
      <input type="email" placeholder={t('users.email')} />

      <button type="submit">{t('common.save')}</button>
      <button type="button">{t('common.cancel')}</button>
    </form>
  );
};

// Example with Conditionals
import { useI18n } from '../hooks/useI18n';

export const ConditionalExample = () => {
  const { t, isArabic, isFrench, isEnglish } = useI18n();

  return (
    <div>
      <h1>{t('rolls.title')}</h1>
      
      {isArabic() && (
        <div style={ { direction: 'rtl', textAlign: 'right' } }>
          <p>{t('navigation.rolls')}</p>
        </div>
      )}
      
      {isFrench() && (
        <div>
          <p>Liste des rouleaux</p>
        </div>
      )}
      
      {isEnglish() && (
        <div>
          <p>List of rolls</p>
        </div>
      )}
    </div>
  );
};
