import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { PresencePage } from './pages/Presence';
import { LogbookPage } from './pages/Logbook';
import { SettingsPage } from './pages/Settings';
import { ProfilePage } from './pages/Profile';

function AppContent() {
  const { currentUser } = useAuth();
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Enforce mandatory settings setup on first login/registration
  useEffect(() => {
    if (currentUser && !settings.isConfigured) {
      setActiveTab('settings');
    }
  }, [currentUser, settings.isConfigured]);

  const handleTabChange = (tabId) => {
    if (currentUser && !settings.isConfigured && tabId !== 'settings') {
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
      {activeTab === 'dashboard' && <DashboardPage setActiveTab={handleTabChange} />}
      {activeTab === 'presence' && <PresencePage setActiveTab={handleTabChange} />}
      {activeTab === 'logbook' && <LogbookPage />}
      {activeTab === 'settings' && <SettingsPage setActiveTab={handleTabChange} />}
      {activeTab === 'profile' && <ProfilePage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
