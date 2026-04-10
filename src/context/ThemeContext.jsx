import { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { i18n } = useTranslation();

  // Initialize theme from localStorage or default to system preference (or dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Initialize language from localStorage or default 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('i18nextLng') || 'en';
  });

  // Effect to apply theme class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Effect to apply language and RTL/LTR layout
  useEffect(() => {
    const root = window.document.documentElement;
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);

    if (language === 'ar') {
      root.dir = 'rtl';
    } else {
      root.dir = 'ltr';
    }
  }, [language, i18n]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, changeLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}
