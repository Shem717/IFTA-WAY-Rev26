import React, { useState, useEffect, useCallback } from 'react';
import { View, Theme } from './types';
import apiService from './services/apiService';
import { onAuthChange } from './services/authService';

import MainApp from './views/MainApp';
import AuthScreen from './views/AuthScreen';
import { Spinner } from './components/ui/Spinner';
import { Toast } from './components/ui/Toast';

interface User {
  id: number;
  email: string;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    useEffect(() => {
        const unsubscribe = onAuthChange((u) => {
            if (u) {
                setUser({ id: (u.uid as unknown) as number, email: u.email || '' });
            } else {
                const token = localStorage.getItem('iftaway_token');
                if (token) {
                    apiService.getMe().then((data) => setUser(data.user)).catch(() => setUser(null));
                } else {
                    setUser(null);
                }
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const handleLoginSuccess = (data: { user: User, token: string }) => {
        localStorage.setItem('iftaway_token', data.token);
        setUser(data.user);
    };
    
    const handleSignOut = async () => {
        await apiService.logout();
        setUser(null);
        setCurrentView('dashboard');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-light-bg dark:bg-dark-bg">
                <div className="text-center">
                    <Spinner className="w-12 h-12 mx-auto" />
                    <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Loading IFTA WAY Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-light-text dark:text-dark-text min-h-screen">
            {user ? (
                <MainApp user={user} currentView={currentView} setCurrentView={setCurrentView} showToast={showToast} theme={theme} setTheme={setTheme} onSignOut={handleSignOut}/>
            ) : (
                <AuthScreen onLoginSuccess={handleLoginSuccess} showToast={showToast} theme={theme} setTheme={setTheme} />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        </div>
    );
}

export default App;
