import React, { FC } from 'react';
import apiService from '../services/apiService';
import { FuelEntry } from '../types';

interface User { id: string; email: string; }

interface ActionSheetProps { 
    entry: FuelEntry; 
    onClose: () => void; 
    onEdit: (entry: FuelEntry) => void; 
    showToast: (msg: string, type?: any) => void; 
    user: User; 
    onDataChange: () => void;
}

export const ActionSheet: FC<ActionSheetProps> = ({ entry, onClose, onEdit, showToast, onDataChange }) => {
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;
        try {
            await apiService.deleteEntry(entry.id);
            showToast("Entry deleted", "success");
            onDataChange();
            onClose();
        } catch (error: any) { showToast(error.message || "Failed to delete entry.", "error"); }
    };

    const handleToggleIgnore = async () => {
        try {
            await apiService.toggleIgnoreEntry(entry.id, !entry.isIgnored);
            showToast(`Entry marked as ${!entry.isIgnored ? 'ignored' : 'active'}.`, "success");
            onDataChange();
            onClose();
        } catch (error: any) { showToast(error.message || "Failed to update entry.", "error"); }
    };

    return (
         <div className="fixed inset-0 bg-black/70 z-[1001] flex justify-center items-end animate-fade-in-fast" onClick={onClose}>
            <div className="bg-light-bg/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-light-border dark:border-dark-border w-full max-w-lg rounded-t-2xl p-4 pt-2 animate-slide-up-fast" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-400 dark:bg-slate-600 rounded-full mx-auto mb-4"></div>
                <div className="space-y-2">
                    <button onClick={() => onEdit(entry)} className="w-full text-left p-4 bg-light-card/50 dark:bg-dark-bg/50 rounded-lg flex items-center gap-4 text-lg font-medium text-light-text dark:text-dark-text hover:bg-slate-200/50 dark:hover:bg-dark-border/50 active:bg-slate-300/50 dark:active:bg-dark-border/80 transition-colors">
                        <i className="fas fa-edit text-light-accent dark:text-dark-accent w-6 text-center"></i> Edit Entry
                    </button>
                    <button onClick={handleDelete} className="w-full text-left p-4 bg-light-card/50 dark:bg-dark-bg/50 rounded-lg flex items-center gap-4 text-lg font-medium text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 active:bg-red-500/20 dark:active:bg-red-500/30 transition-colors">
                        <i className="fas fa-trash w-6 text-center"></i> Delete Entry
                    </button>
                    <div className="w-full p-4 bg-light-card/50 dark:bg-dark-bg/50 rounded-lg flex items-center justify-between text-lg font-medium text-light-text dark:text-dark-text">
                        <div className="flex items-center gap-4"><i className="fas fa-eye-slash text-light-text-secondary dark:text-dark-text-secondary w-6 text-center"></i><span>Ignore Entry</span></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={entry.isIgnored} onChange={handleToggleIgnore} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-400 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-light-accent dark:peer-checked:bg-dark-accent"></div>
                        </label>
                    </div>
                </div>
                 <button onClick={onClose} className="w-full mt-4 p-4 bg-light-card/50 dark:bg-dark-bg/50 rounded-lg font-bold text-lg text-light-accent dark:text-dark-accent hover:bg-slate-200/50 dark:hover:bg-dark-border/50 active:bg-slate-300/50 dark:active:bg-dark-border/80 transition-colors">Cancel</button>
            </div>
        </div>
    );
};
