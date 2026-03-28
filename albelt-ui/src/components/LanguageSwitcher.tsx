import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'ar', label: 'AR', name: 'العربية' },
  ];

  return (
    <div className="language-switcher">
      <Globe size={18} className="lang-icon" />
      <div className="lang-buttons">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
            title={lang.name}
            aria-label={`Switch to ${lang.name}`}
          >
            <span className="lang-label">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
