import React, { FC } from 'react';
import { UploadProgress } from '../../types';

export const ProgressBar: FC<{ progress: UploadProgress }> = ({ progress }) => {
    const { status, percentage, message } = progress;
    if (status === 'idle') return null;

    const barColor = status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-light-accent dark:bg-dark-accent';

    return (
        <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
                <p className="text-light-text dark:text-dark-text">{message}</p>
                {status === 'uploading' && <p className="text-light-text-secondary dark:text-dark-text-secondary">{Math.round(percentage)}%</p>}
                 {status === 'success' && <i className="fas fa-check-circle text-green-500"></i>}
                 {status === 'error' && <i className="fas fa-exclamation-circle text-red-500"></i>}
            </div>
            <div className="w-full bg-light-border dark:bg-dark-border rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};
