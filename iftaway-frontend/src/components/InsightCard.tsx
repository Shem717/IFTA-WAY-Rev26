import React, { FC, ReactNode } from 'react';

export const InsightCard: FC<{ title: string; icon: string; children: ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-light-card/80 dark:bg-dark-card/80 backdrop-blur-sm p-6 rounded-lg shadow-md border border-light-border/50 dark:border-dark-border/50 flex flex-col">
        <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4 flex items-center gap-3">
            <i className={`fas ${icon} text-light-accent dark:text-dark-accent w-6 text-center`}></i>
            {title}
        </h3>
        <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-3 flex-grow">
            {children}
        </div>
    </div>
);
