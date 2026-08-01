import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isSystemAuto: boolean;
  systemTheme: ResolvedTheme;
  themeName: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nexorum_theme_preference') || localStorage.getItem('nexorum_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved as ThemeMode;
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Listen to OS system color scheme preference changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Initial check
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Subscribe to OS theme changes
    try {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } catch {
      // Fallback for older browser engines
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  // Compute active resolved theme
  const activeTheme: ResolvedTheme = mode === 'system' ? systemTheme : mode;

  // Apply root document element classes and save preference
  useEffect(() => {
    localStorage.setItem('nexorum_theme_preference', mode);
    localStorage.setItem('nexorum_theme', activeTheme);

    const root = document.documentElement;
    if (activeTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [mode, activeTheme]);

  // Cycle through modes: system -> dark -> light -> system
  const toggleTheme = () => {
    setModeState((prev) => {
      if (prev === 'system') return 'dark';
      if (prev === 'dark') return 'light';
      return 'system';
    });
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
  };

  const setTheme = (t: ThemeMode) => {
    setModeState(t);
  };

  const isSystemAuto = mode === 'system';
  const isDark = activeTheme === 'dark';

  const themeName =
    mode === 'system'
      ? `Auto System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`
      : activeTheme === 'dark'
      ? 'Cybernetic Dark'
      : 'Minimalist Light';

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: activeTheme,
        setMode,
        setTheme,
        toggleTheme,
        isDark,
        isSystemAuto,
        systemTheme,
        themeName,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

