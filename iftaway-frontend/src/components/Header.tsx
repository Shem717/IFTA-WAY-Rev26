import React, { FC } from 'react';
import { Theme } from '../types';
import { ThemeToggle } from './ui/ThemeToggle';

export const Header: FC<{ isOffline: boolean; theme: Theme; setTheme: (theme: Theme) => void; }> = ({ isOffline, theme, setTheme }) => (
    <header className="bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-md shadow-lg fixed top-0 left-0 right-0 z-50 border-b border-light-border/50 dark:border-dark-border/50">
        <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-light-accent dark:text-dark-accent flex items-center gap-3">
                    <i className="fas fa-gas-pump"></i>
                    <span>IFTA WAY</span>
                </div>
                <div className="flex items-center gap-4">
                    {isOffline && (
                        <div className="text-sm font-semibold bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full flex items-center gap-2 border border-yellow-400/30">
                            <i className="fas fa-wifi"></i>
                            <span>Offline Mode</span>
                        </div>
                    )}
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
            </div>
        </div>
    </header>
);
