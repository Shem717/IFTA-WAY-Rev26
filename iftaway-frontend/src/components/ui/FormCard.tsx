import React, { FC, ReactNode } from 'react';

export const FormCard: FC<{ title: ReactNode; children: ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md dark:shadow-none border border-light-border dark:border-dark-border border-t-2 border-t-light-accent dark:border-t-dark-accent ${className}`}>
        <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-6 flex items-center gap-3">{title}</h2>
        {children}
    </div>
);
