'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { ThemeMode } from '@/lib/types';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY, cn } from '@/lib/utils';

function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;

  doc.classList.remove('dark', 'light');
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  if (theme === 'system') {
    if (window.matchMedia(THEME_MEDIA_QUERY).matches) {
      doc.classList.add('dark');
    } else {
      doc.classList.add('light');
    }
  } else {
    doc.classList.add(theme);
  }
}

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode | undefined>(undefined);

  useEffect(() => {
    const storedTheme: ThemeMode =
      (typeof localStorage !== 'undefined' &&
        (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode)) ||
      'system';
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  function handleThemeChange(theme: ThemeMode) {
    applyTheme(theme);
    setTheme(theme);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-2xl border border-gray-200 bg-white/80 p-1 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:bg-gray-800/90 dark:border-gray-600',
        className
      )}
    >
      <span className="sr-only">Color scheme toggle</span>

      {/* Dark Mode Button */}
      <button
        type="button"
        onClick={() => handleThemeChange('dark')}
        className={cn(
          'group relative rounded-xl p-2.5 transition-all duration-200',
          theme === 'dark'
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        )}
      >
        <span className="sr-only">Enable dark color scheme</span>
        <MoonIcon
          size={18}
          weight="bold"
          className="transform transition-transform duration-200 group-hover:scale-110"
        />
        {theme === 'dark' && (
          <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 opacity-20"></div>
        )}
      </button>

      {/* Light Mode Button */}
      <button
        type="button"
        onClick={() => handleThemeChange('light')}
        className={cn(
          'group relative rounded-xl p-2.5 transition-all duration-200',
          theme === 'light'
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        )}
      >
        <span className="sr-only">Enable light color scheme</span>
        <SunIcon
          size={18}
          weight="bold"
          className="transform transition-transform duration-200 group-hover:scale-110"
        />
        {theme === 'light' && (
          <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 opacity-20"></div>
        )}
      </button>

      {/* System Mode Button */}
      <button
        type="button"
        onClick={() => handleThemeChange('system')}
        className={cn(
          'group relative rounded-xl p-2.5 transition-all duration-200',
          theme === 'system'
            ? 'bg-gradient-to-br from-gray-600 to-gray-800 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
        )}
      >
        <span className="sr-only">Enable system color scheme</span>
        <MonitorIcon
          size={18}
          weight="bold"
          className="transform transition-transform duration-200 group-hover:scale-110"
        />
        {theme === 'system' && (
          <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-gray-500 to-gray-700 opacity-20"></div>
        )}
      </button>
    </div>
  );
}
