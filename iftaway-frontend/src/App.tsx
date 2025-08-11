import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Theme } from "./types";
import apiService from "./services/apiService";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { onAuthChange } from "./services/authService";

import MainApp from "./views/MainApp";
import AuthScreen from "./views/AuthScreen";
import { Spinner } from "./components/ui/Spinner";
import { Toast } from "./components/ui/Toast";

interface User {
  id: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "dark"
  );

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    // Auto-dismiss after 5 seconds
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      if (u) {
        setUser({ id: u.uid, email: u.email || "" });
      } else {
        setUser(null);
        localStorage.removeItem("iftaway_token");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (data: { user: any; token: string }) => {
    localStorage.setItem("iftaway_token", data.token);
    setUser({ id: String(data.user.id), email: data.user.email });
  };

  const handleSignOut = async () => {
    try {
      await apiService.logout();
      setUser(null);
      showToast("Signed out successfully", "success");
    } catch (error) {
      console.error("Sign out error:", error);
      showToast("Error signing out", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="mb-6">
            <i className="fas fa-gas-pump text-6xl text-cyan-400 animate-pulse"></i>
          </div>
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">IFTA WAY</h2>
          <p className="text-slate-300">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="text-light-text dark:text-dark-text min-h-screen bg-light-bg dark:bg-dark-bg">
        <Router>
          <Routes>
            {user ? (
              <Route
                path="/*"
                element={
                  <MainApp
                    user={user}
                    showToast={showToast}
                    theme={theme}
                    setTheme={setTheme}
                    onSignOut={handleSignOut}
                  />
                }
              />
            ) : (
              <Route
                path="/*"
                element={
                  <AuthScreen
                    onLoginSuccess={handleLoginSuccess}
                    showToast={showToast}
                    theme={theme}
                    setTheme={setTheme}
                  />
                }
              />
            )}
          </Routes>
        </Router>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;