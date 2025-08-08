import React, { FC, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { FuelEntry } from '../types';
import { EntryCard } from '../components/EntryCard';
import { Spinner } from '../components/ui/Spinner';

const EntriesView: FC<{ onOpenActionSheet: (entry: FuelEntry) => void; showToast: (msg: string, type?: any) => void; onDataChange: () => void; }> = ({ onOpenActionSheet, showToast, onDataChange }) => {
    const [entries, setEntries] = useState<FuelEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const allEntries = await apiService.getEntries();
            setEntries(allEntries);
        } catch (error: any) {
            showToast(error.message || "Failed to load entries.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);
    
    useEffect(() => {
        fetchEntries();
    }, [fetchEntries, onDataChange]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">All Entries</h1>
            <div className="space-y-4">
                {entries.map(entry => <EntryCard key={entry.id} entry={entry} onOpenActionSheet={onOpenActionSheet} />)}
            </div>
            {isLoading && <div className="flex justify-center py-6"><Spinner className="w-8 h-8"/></div>}
            {!isLoading && entries.length === 0 && <p className="text-center py-10 text-light-text-secondary dark:text-dark-text-secondary">No entries found.</p>}
        </div>
    );
};

export default EntriesView;
