import React, { FC, useState, useEffect, useCallback } from 'react';
import { View, Theme, FuelEntry, Truck } from '../types';
import apiService from '../services/apiService';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ActionSheet } from '../components/ActionSheet';

import DashboardView from './DashboardView';
import FuelEntryForm from './FuelEntryForm';
import EntriesView from './EntriesView';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';

interface User {
    id: string;
    email: string;
}

interface MainAppProps { 
    user: User; 
    currentView: View; 
    setCurrentView: (view: View) => void; 
    showToast: (msg: string, type?: any) => void; 
    theme: Theme; 
    setTheme: (theme: Theme) => void; 
    onSignOut: () => void;
}

const MainApp: FC<MainAppProps> = ({ user, currentView, setCurrentView, showToast, theme, setTheme, onSignOut }) => {
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [entryToEdit, setEntryToEdit] = useState<FuelEntry | null>(null);
    const [actionSheetEntry, setActionSheetEntry] = useState<FuelEntry | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(t => t + 1);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchTrucks = useCallback(async () => {
        try {
            const trucksList = await apiService.getTrucks();
            setTrucks(trucksList);
        } catch (err: any) {
             setIsOffline(true);
            showToast(err.message || "Failed to load trucks.", "error");
        }
    }, [showToast]);

    useEffect(() => {
        fetchTrucks();
    }, [fetchTrucks, refreshTrigger]);

    const handleEditRequest = (entry: FuelEntry) => {
        setEntryToEdit(entry);
        setActionSheetEntry(null);
        setCurrentView('add-entry');
    }
    
    const handleAddRequest = () => {
        setEntryToEdit(null);
        setCurrentView('add-entry');
    }

    const renderView = () => {
        const commonProps = { user, showToast, theme, onDataChange: triggerRefresh };

        switch (currentView) {
            case 'dashboard': return <DashboardView {...commonProps} onOpenActionSheet={setActionSheetEntry} />;
            case 'add-entry': return <FuelEntryForm trucks={trucks} {...commonProps} onSave={() => { triggerRefresh(); setCurrentView('entries'); }} entryToEdit={entryToEdit} setEntryToEdit={setEntryToEdit} />;
            case 'entries': return <EntriesView {...commonProps} onOpenActionSheet={setActionSheetEntry} />;
            case 'reports': return <ReportsView {...commonProps} trucks={trucks} />;
            case 'settings': return <SettingsView {...commonProps} trucks={trucks} onTrucksChange={fetchTrucks} onSignOut={onSignOut} setTheme={setTheme} />;
            default: return <DashboardView {...commonProps} onOpenActionSheet={setActionSheetEntry} />;
        }
    }
    
    return(
        <div>
            <Header isOffline={isOffline} theme={theme} setTheme={setTheme} />
            <main className="container mx-auto px-4 pb-24 pt-24">
                {renderView()}
            </main>
            <BottomNav activeView={currentView} setCurrentView={setCurrentView} onAdd={handleAddRequest} />
            {actionSheetEntry && <ActionSheet entry={actionSheetEntry} onClose={() => setActionSheetEntry(null)} onEdit={handleEditRequest} showToast={showToast} user={user} onDataChange={triggerRefresh} />}
        </div>
    );
};

export default MainApp;
