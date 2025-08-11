import React, { FC, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { FuelEntry } from '../types';
import { EntryCard } from '../components/EntryCard';
import { Spinner } from '../components/ui/Spinner';

const EntriesView: FC<{ onOpenActionSheet: (entry: FuelEntry) => void; showToast: (msg: string, type?: any) => void; onDataChange: () => void; }> = ({ onOpenActionSheet, showToast, onDataChange }) => {
    const [entries, setEntries] = useState<FuelEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchEntries = useCallback(async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const data = await apiService.getPaginatedEntries(pageNum);
            setEntries(prev => pageNum === 1 ? data.entries : [...prev, ...data.entries]);
            setTotalPages(data.totalPages);
        } catch (error: any) {
            showToast(error.message || "Failed to load entries.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);
    
    useEffect(() => {
        fetchEntries(1);
    }, [fetchEntries, onDataChange]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        if (nextPage <= totalPages) {
            setPage(nextPage);
            fetchEntries(nextPage);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">All Entries</h1>
            <div className="space-y-4">
                {entries.map(entry => <EntryCard key={entry.id} entry={entry} onOpenActionSheet={onOpenActionSheet} />)}
            </div>
            {isLoading && <div className="flex justify-center py-6"><Spinner className="w-8 h-8"/></div>}
            {!isLoading && entries.length === 0 && <p className="text-center py-10 text-light-text-secondary dark:text-dark-text-secondary">No entries found.</p>}
            {!isLoading && page < totalPages && (
                <div className="text-center">
                    <button onClick={handleLoadMore} className="bg-light-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-light-accent/90 dark:bg-dark-accent dark:hover:bg-dark-accent/90 transition-colors">
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
};

export default EntriesView;
