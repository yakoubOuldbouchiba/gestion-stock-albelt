# i18n Quick Reference

## Quick Start

### 1. Import and Use Translations
```tsx
import { useI18n } from '../hooks/useI18n';

export const MyComponent = () => {
  const { t, isArabic, isFrench } = useI18n();
  
  return <h1>{t('common.welcome')}</h1>;
};
```

### 2. Add Language Switcher
```tsx
import { LanguageSwitcher } from './LanguageSwitcher';

// Add to your Navbar or Header
<LanguageSwitcher />
```

### 3. Add New Translation Keys
1. Edit `src/i18n/locales/en.json`
2. Edit `src/i18n/locales/fr.json`  
3. Edit `src/i18n/locales/ar.json`
4. Use in component: `t('section.key')`

## Available Helpers

### useI18n Hook
```tsx
const {
  t,                      // Translation function: t('key')
  changeLanguage,         // changeLanguage('en'|'fr'|'ar')
  getCurrentLanguage,     // Returns current language code
  isArabic,              // boolean() check
  isFrench,              // boolean() check
  isEnglish,             // boolean() check
  i18n                   // Full i18n instance
} = useI18n();
```

## Supported Languages
- `en` - English (default)
- `fr` - French
- `ar` - Arabic (RTL)

## Translation Files Path
```
src/i18n/locales/
├── en.json
├── fr.json
└── ar.json
```

## Key Naming Convention
```
common.save
navigation.dashboard
auth.login
rolls.title
messages.confirmDelete
```

## RTL Support for Arabic
Add to your main App component:
```tsx
useEffect(() => {
  const html = document.documentElement;
  html.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  html.lang = i18n.language;
}, [i18n.language]);
```

## Language Persistence
- Automatically saved to localStorage
- Restores on page reload
- Key: `language`

## Components Created

| File | Purpose |
|------|---------|
| `src/i18n/config.ts` | i18n configuration |
| `src/components/LanguageSwitcher.tsx` | Language switcher UI |
| `src/components/LanguageSwitcher.css` | Language switcher styles |
| `src/hooks/useI18n.ts` | Custom React hook |
| `src/i18n/locales/en.json` | English translations |
| `src/i18n/locales/fr.json` | French translations |
| `src/i18n/locales/ar.json` | Arabic translations |

## Updated Files

| File | Changes |
|------|---------|
| `package.json` | Added i18next and react-i18next |
| `src/main.tsx` | Imported i18n config |
| `src/components/index.ts` | Exported LanguageSwitcher |

## Next Steps

1. Add the LanguageSwitcher component to your Navbar
2. Replace hardcoded strings with translation keys
3. Test different languages
4. Add more translation keys as needed

## Documentation
See `I18N_SETUP.md` for detailed documentation and examples.
