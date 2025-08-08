import React, { FC } from 'react';
import { Theme } from '../../types';

export const ThemeToggle: FC<{ theme: Theme; setTheme: (theme: Theme) => void; }> = ({ theme, setTheme }) => {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDark}
      className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-dark-bg bg-slate-200 dark:bg-dark-border"
    >
      <i className={`fas fa-sun absolute left-2.5 text-yellow-500 transition-opacity duration-200 ${isDark ? 'opacity-50' : 'opacity-100'}`}></i>
      <i className={`fas fa-moon absolute right-2.5 text-slate-400 transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-50'}`}></i>
      <span
        className={`absolute top-1 left-1 flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 shadow-lg transform transition-transform duration-300 ease-in-out ${isDark ? 'translate-x-8' : 'translate-x-0'}`}
      >
        <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'} text-white text-xs`}></i>
      </span>
    </button>
  );
};
