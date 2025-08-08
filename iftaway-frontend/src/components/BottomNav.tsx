import React, { FC } from 'react';
import { View } from '../types';

interface BottomNavProps { activeView: View; setCurrentView: (view: View) => void; onAdd: () => void; }

export const BottomNav: FC<BottomNavProps> = ({ activeView, setCurrentView, onAdd }) => {
    const navItems = [
        { view: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
        { view: 'entries', icon: 'fa-list', label: 'Entries' },
        { view: 'add-entry', icon: 'fa-plus-circle', label: 'Add' },
        { view: 'reports', icon: 'fa-chart-pie', label: 'Reports' },
        { view: 'settings', icon: 'fa-cog', label: 'Settings' }
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-light-border dark:border-dark-border shadow-[0_-4px_16px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_16px_-1px_rgba(0,0,0,0.4)] z-50">
            <div className="flex justify-around">
                {navItems.map(item => {
                    const isAddButton = item.view === 'add-entry';
                    const isActive = activeView === item.view;
                    const buttonClasses = `flex flex-col items-center justify-center flex-1 py-2 px-1 text-center transition-colors duration-200 relative`;
                    const colorClasses = isActive ? 'text-light-accent dark:text-dark-accent' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-accent dark:hover:text-dark-accent';

                    if (isAddButton) {
                        return (
                             <button key={item.view} onClick={onAdd} className={`${buttonClasses} -translate-y-4`}>
                                <div className="h-16 w-16 rounded-full bg-light-accent dark:bg-dark-accent flex items-center justify-center text-white shadow-lg dark:shadow-cyan-500/20">
                                    <i className={`fas ${item.icon} text-3xl`}></i>
                                </div>
                            </button>
                        );
                    }
                    
                    return (
                        <button key={item.view} onClick={() => setCurrentView(item.view)} className={`${buttonClasses} ${colorClasses}`}>
                            <i className={`fas ${item.icon} text-xl`}></i>
                            <span className="text-xs mt-1 font-semibold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
