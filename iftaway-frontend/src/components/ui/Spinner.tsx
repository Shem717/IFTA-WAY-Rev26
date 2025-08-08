import React, { FC } from 'react';

export const Spinner: FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`animate-spin rounded-full border-t-2 border-r-2 border-light-accent dark:border-dark-accent/50 dark:border-t-dark-accent ${className}`}></div>
);
