import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'englishskill-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme;
      if (stored && ['light', 'dark', 'blue', 'green', 'purple'].includes(stored)) {
        return stored;
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.body;
    
    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple', 'dark');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Add 'dark' class for dark theme (Tailwind dark mode)
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    
    // Store in localStorage
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Add transition class on mount
  useEffect(() => {
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
