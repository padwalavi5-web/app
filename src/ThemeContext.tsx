import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

const resolveInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useMemo(resolveInitialTheme, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return children;
};
