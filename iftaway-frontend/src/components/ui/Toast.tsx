import React, { FC, useEffect } from 'react';

export const Toast: FC<{ message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(), 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseStyle = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white shadow-lg z-[2000] transition-opacity duration-300 backdrop-blur-sm';
    const typeStyle = { 
        success: 'bg-green-500/80 border border-green-400', 
        error: 'bg-red-500/80 border border-red-400', 
        info: 'bg-slate-700/80 border border-slate-600'
    }[type];
    return <div className={`${baseStyle} ${typeStyle}`}>{message}</div>;
};
