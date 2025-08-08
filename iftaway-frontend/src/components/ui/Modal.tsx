import React, { FC, ReactNode } from 'react';

export const Modal: FC<{ title: string; children: ReactNode; onClose: () => void; onConfirm: () => void; confirmText?: string; cancelText?: string }> = ({ title, children, onClose, onConfirm, confirmText = "Confirm", cancelText = "Cancel" }) => (
    <div className="fixed inset-0 bg-black/70 z-[1001] flex justify-center items-center animate-fade-in-fast p-4" onClick={onClose}>
        <div className="bg-light-bg dark:bg-dark-card w-full max-w-lg rounded-xl shadow-2xl animate-slide-up-fast m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">{title}</h2>
                <div className="text-light-text-secondary dark:text-dark-text-secondary mb-6 space-y-2">
                    {children}
                </div>
            </div>
            <div className="bg-light-bg/50 dark:bg-dark-bg/50 px-6 py-4 flex justify-end gap-4 rounded-b-xl">
                <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-200/50 dark:hover:bg-dark-border/50 transition-colors">{cancelText}</button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-lg font-semibold text-white bg-light-accent dark:bg-dark-accent hover:opacity-90 transition">{confirmText}</button>
            </div>
        </div>
    </div>
);
