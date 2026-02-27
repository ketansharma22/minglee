'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/lib/store/chatStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useChatStore();

  useEffect(() => {
    const stored = localStorage.getItem('mingle-theme') as 'dark' | 'light' | null;
    if (stored) setTheme(stored);
  }, [setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('mingle-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
