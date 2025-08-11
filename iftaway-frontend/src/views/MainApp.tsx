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

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

interface User {
  id: string;
  email: string;
}

interface MainAppProps {
  user: User;
  showToast: (msg: string, type?: any) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onSignOut: () => void;
}

const MainApp: FC<MainAppProps> = ({ user, showToast, theme, setTheme, onSignOut }) => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<FuelEntry | null>(null);
  const [actionSheetEntry, setActionSheetEntry] = useState<FuelEntry | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const triggerRefresh = () => setRefreshTrigger((t) => t + 1);

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
    navigate('/add-entry');
  };

  const handleAddRequest = () => {
    setEntryToEdit(null);
    navigate('/add-entry');
  };

  const renderView = () => {
    const commonProps = { user, showToast, theme, onDataChange: triggerRefresh };
    return (
      <Routes>
        <Route
          path="/dashboard"
          element={<DashboardView {...commonProps} onOpenActionSheet={setActionSheetEntry} />}
        />
        <Route
          path="/add-entry"
          element={
            <FuelEntryForm
              trucks={trucks}
              {...commonProps}
              onSave={() => {
                triggerRefresh();
                navigate('/entries');
              }}
              entryToEdit={entryToEdit}
              setEntryToEdit={setEntryToEdit}
            />
          }
        />
        <Route
          path="/entries"
          element={<EntriesView {...commonProps} onOpenActionSheet={setActionSheetEntry} />}
        />
        <Route path="/reports" element={<ReportsView {...commonProps} trucks={trucks} />} />
        <Route
          path="/settings"
          element={
            <SettingsView
              {...commonProps}
              trucks={trucks}
              onTrucksChange={fetchTrucks}
              onSignOut={onSignOut}
              setTheme={setTheme}
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    );
  };

  return (
    <div>
      <Header isOffline={isOffline} theme={theme} setTheme={setTheme} />
      <main className="container mx-auto px-4 pb-24 pt-24">{renderView()}</main>
      <BottomNav onAdd={handleAddRequest} />
      {actionSheetEntry && (
        <ActionSheet
          entry={actionSheetEntry}
          onClose={() => setActionSheetEntry(null)}
          onEdit={handleEditRequest}
          showToast={showToast}
          user={user}
          onDataChange={triggerRefresh}
        />
      )}
    </div>
  );
};

export default MainApp;
