# i18n (Internationalization) Setup Guide

This project uses **react-i18next** for multi-language support with English (EN), French (FR), and Arabic (AR).

## Installation

The required packages have been installed:
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next

## File Structure

```
src/
├── i18n/
│   ├── config.ts                    # i18n configuration
│   └── locales/
│       ├── en.json                  # English translations
│       ├── fr.json                  # French translations
│       └── ar.json                  # Arabic translations
├── hooks/
│   └── useI18n.ts                   # Custom hook for i18n
├── components/
│   ├── LanguageSwitcher.tsx         # Language switcher component
│   └── LanguageSwitcher.css         # Language switcher styles
└── main.tsx                         # Updated to import i18n config
```

## Usage

### 1. Using Translations in Components

#### Option A: Using `useTranslation` hook (from react-i18next)
```tsx
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <p>{t('common.welcome')}</p>
    </div>
  );
};
```

#### Option B: Using Custom `useI18n` Hook (Recommended)
```tsx
import { useI18n } from '../hooks/useI18n';

export const MyComponent = () => {
  const { t, changeLanguage, isArabic, isFrench, isEnglish } = useI18n();

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      {isArabic() && <p>النص العربي</p>}
      {isFrench() && <p>Le texte français</p>}
    </div>
  );
};
```

### 2. Adding Language Switcher to Navbar

```tsx
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  return (
    <nav>
      {/* Your navbar content */}
      <LanguageSwitcher />
    </nav>
  );
};
```

### 3. Changing Language Programmatically

```tsx
import { useI18n } from '../hooks/useI18n';

export const MyComponent = () => {
  const { changeLanguage } = useI18n();

  return (
    <button onClick={() => changeLanguage('ar')}>
      Switch to Arabic
    </button>
  );
};
```

## Adding New Translations

### Step 1: Add English Translation
Edit `src/i18n/locales/en.json`:
```json
{
  "myFeature": {
    "title": "My Feature Title",
    "description": "Feature description"
  }
}
```

### Step 2: Add French Translation
Edit `src/i18n/locales/fr.json`:
```json
{
  "myFeature": {
    "title": "Titre de ma fonctionnalité",
    "description": "Description de la fonctionnalité"
  }
}
```

### Step 3: Add Arabic Translation
Edit `src/i18n/locales/ar.json`:
```json
{
  "myFeature": {
    "title": "عنوان ميزتي",
    "description": "وصف الميزة"
  }
}
```

### Step 4: Use in Component
```tsx
import { useI18n } from '../hooks/useI18n';

export const MyFeature = () => {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.description')}</p>
    </div>
  );
};
```

## Current Supported Languages

- **EN** (English) - Default language
- **FR** (Français)
- **AR** (العربية - Arabic)

## RTL Support (Arabic)

For proper Arabic (RTL) support, update your `index.html`:

```html
<html lang="en" dir="ltr" id="root-html">
```

Then use a hook to update the direction:

```tsx
import { useI18n } from '../hooks/useI18n';
import { useEffect } from 'react';

export const App = () => {
  const { isArabic } = useI18n();

  useEffect(() => {
    const htmlElement = document.getElementById('root-html');
    if (htmlElement) {
      htmlElement.dir = isArabic() ? 'rtl' : 'ltr';
      htmlElement.lang = isArabic() ? 'ar' : 'en';
    }
  }, [isArabic()]);

  return <>{/* Your app */}</>;
};
```

## Language Persistence

The selected language is automatically saved to localStorage under the key `language`. 
When the app loads, it will restore the user's previously selected language.

## Translation Key Naming Convention

Use dot notation for hierarchical organization:
```
common.save
common.cancel
navigation.dashboard
navigation.inventory
rolls.title
users.email
messages.confirmDelete
```

## Browser DevTools

Install the i18next DevTools extension for easier translation management:
- [i18next DevTools - Chrome](https://chrome.google.com/webstore)
- [i18next DevTools - Firefox](https://addons.mozilla.org/firefox/)

## Troubleshooting

1. **Translations not updating?**
   - Make sure `i18n/config.ts` is imported in `main.tsx`
   - Check that all translation keys exist in all language files

2. **Language not persisting?**
   - Check browser's localStorage is enabled
   - Verify that `localStorage.setItem('language', lang)` is called

3. **Missing translations?**
   - Check `console.warn` for i18n warnings
   - Ensure translation keys follow the correct path (e.g., `common.welcome`)

## Example Components

See the following files for complete examples:
- `src/components/LanguageSwitcher.tsx` - Language switcher component
- `src/hooks/useI18n.ts` - Custom i18n hook
- `src/i18n/config.ts` - i18n configuration

## Exporting Translations for Translation Services

To export translations for external translation services:
```tsx
// In a utility file
export const exportTranslations = () => {
  const translations = {
    en: enTranslations,
    fr: frTranslations,
    ar: arTranslations
  };
  console.log(JSON.stringify(translations, null, 2));
};
```
