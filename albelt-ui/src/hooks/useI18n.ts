import { useTranslation } from 'react-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: 'en' | 'fr' | 'ar') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const getCurrentLanguage = () => i18n.language;

  const isArabic = () => i18n.language === 'ar';
  const isFrench = () => i18n.language === 'fr';
  const isEnglish = () => i18n.language === 'en';

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    isArabic,
    isFrench,
    isEnglish,
    i18n
  };
};
