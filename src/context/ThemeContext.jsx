import { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { i18n } = useTranslation();

  // Force Light theme and French language
  const [theme] = useState('light');
  const [language] = useState('fr');

  // Effect to apply light theme class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('theme', 'light');
  }, []);

  // Effect to apply French language and LTR layout
  useEffect(() => {
    const root = window.document.documentElement;
    i18n.changeLanguage('fr');
    localStorage.setItem('i18nextLng', 'fr');
    root.dir = 'ltr';
  }, [i18n]);

  return (
    <ThemeContext.Provider value={{ theme, language }}>
      {children}
    </ThemeContext.Provider>
  );
}
