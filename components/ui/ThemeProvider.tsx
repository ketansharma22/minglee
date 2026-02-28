// components/ui/ThemeProvider.tsx
'use client';

import { useEffect } from 'react';
import { useChatStore } from '../../lib/store/chatStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useChatStore();

  useEffect(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem('novu-theme') as 'dark' | 'light' | null;
    if (stored) setTheme(stored);
  }, [setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('novu-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
