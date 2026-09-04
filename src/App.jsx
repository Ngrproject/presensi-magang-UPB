import React, { useState, useEffect, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { PresencePage } from './pages/Presence';
import { LogbookPage } from './pages/Logbook';
import { ReportPage } from './pages/Report';
import { SettingsPage } from './pages/Settings';
import { ProfilePage } from './pages/Profile';
import { AdminPage } from './pages/Admin';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white border border-red-200 shadow-xl rounded-3xl p-8 max-w-md w-full space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-red-50 text-red-600 border border-red-200">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-black text-red-900">TERJADI KENDALA APLIKASI</h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Aplikasi mengalami sedikit kendala sistem. Silakan muat ulang halaman untuk memulihkan sesi.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 text-white font-bold text-xs shadow-md border border-amber-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>MUAT ULANG HALAMAN (RELOAD)</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { currentUser } = useAuth();
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState(() => currentUser?.role === 'admin' ? 'admin' : 'dashboard');

  // Enforce mandatory settings setup on first login/registration for students
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && !settings.isConfigured) {
      setActiveTab('settings');
    }
  }, [currentUser, settings.isConfigured]);

  const handleTabChange = (tabId) => {
    if (currentUser && currentUser.role !== 'admin' && !settings.isConfigured && tabId !== 'settings') {
      alert('MANDATORY SETUP: Mohon isi dan simpan Konfigurasi Instansi Magang Anda terlebih dahulu!');
      return;
    }
    setActiveTab(tabId);
  };

  if (!currentUser) {
    return (
      <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
        <AuthPage />
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={handleTabChange}>
      {activeTab === 'admin' && <AdminPage />}
      {activeTab === 'dashboard' && <DashboardPage setActiveTab={handleTabChange} />}
      {activeTab === 'presence' && <PresencePage setActiveTab={handleTabChange} />}
      {activeTab === 'logbook' && <LogbookPage />}
      {activeTab === 'reports' && <ReportPage />}
      {activeTab === 'settings' && <SettingsPage setActiveTab={handleTabChange} />}
      {activeTab === 'profile' && <ProfilePage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
