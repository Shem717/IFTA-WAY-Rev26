import React, { FC } from 'react';
import { FuelEntry } from '../types';

export const EntryCard: FC<{ entry: FuelEntry, onOpenActionSheet: (entry: FuelEntry) => void }> = ({ entry, onOpenActionSheet }) => {
    const fuelDisplay = entry.fuelType === 'custom' ? entry.customFuelType : entry.fuelType;
    const fuelBadgeClass = { 
        diesel: 'bg-yellow-400/10 text-yellow-500 dark:text-yellow-300 border border-yellow-400/20', 
        def: 'bg-blue-400/10 text-blue-500 dark:text-blue-300 border border-blue-400/20', 
        custom: 'bg-slate-400/10 text-slate-500 dark:text-slate-300 border border-slate-400/20'
    }[entry.fuelType];

    return (
        <div className={`bg-light-card dark:bg-dark-card p-4 rounded-lg border border-light-border dark:border-dark-border shadow-sm transition-all duration-200 hover:border-light-accent/50 dark:hover:border-dark-accent/50 hover:shadow-md cursor-pointer ${entry.isIgnored ? 'opacity-50' : ''}`} onClick={() => onOpenActionSheet(entry)}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-semibold text-lg text-light-text dark:text-dark-text">{entry.city}, {entry.state}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{new Date(entry.dateTime).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${fuelBadgeClass}`}>{fuelDisplay}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mt-4 border-t border-light-border dark:border-dark-border pt-3">
                <div><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Truck</p><p className="font-semibold text-light-text dark:text-dark-text">{entry.truckNumber || 'N/A'}</p></div>
                <div><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Cost</p><p className="font-semibold text-light-text dark:text-dark-text">${typeof entry.cost === 'number' ? entry.cost.toFixed(2) : (entry.cost ? parseFloat(entry.cost).toFixed(2) : '0.00')}</p></div>
                <div><p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Odometer</p><p className="font-semibold text-light-text dark:text-dark-text">{typeof entry.odometer === 'number' ? entry.odometer.toLocaleString() : (entry.odometer ? parseFloat(entry.odometer).toLocaleString() : '0')}</p></div>
            </div>
        </div>
    );
};
