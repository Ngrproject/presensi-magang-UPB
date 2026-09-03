import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured, db, serverTimestamp } from '../utils/firebase';
import { calculateDistance, isWithinGeofence } from '../utils/haversine';

const AppContext = createContext(null);

// Default initial settings for demo/configured users
const DEFAULT_SETTINGS = {
  companyName: 'BMKG Stasiun Meteorologi Class I',
  targetLat: -6.2088,
  targetLon: 106.8456,
  geofenceRadius: 50,
  workHours: {
    checkInStart: '08:00',
    checkOutStart: '16:00'
  },
  workDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  durationMonths: 3,
  endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isLocked: false,
  isConfigured: true // Demo accounts are pre-configured
};

// Initial settings for newly registered users (Requires mandatory initial setup!)
const NEW_USER_SETTINGS = {
  companyName: '',
  targetLat: -6.2088,
  targetLon: 106.8456,
  geofenceRadius: 50,
  workHours: {
    checkInStart: '08:00',
    checkOutStart: '16:00'
  },
  workDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  startDate: new Date().toISOString().split('T')[0],
  durationMonths: 3,
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isLocked: false,
  isConfigured: false // MANDATORY SETUP REQUIRED FOR NEW USERS!
};

// Sample logbooks for pre-configured demo
const SAMPLE_LOGBOOKS = [
  {
    id: 'lb_sample_1',
    dateStr: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    achievements: 'Mengimplementasikan komponen UI Glassmorphic dan pengujian modul Haversine GPS.',
    obstacles: 'Sinyal GPS lemah di dalam ruangan laboratorium.',
    tomorrowPlan: 'Melakukan deployment awal dan pengujian responsif pada perangkat seluler.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Sample presence log
const SAMPLE_PRESENCE = [
  {
    id: 'pr_sample_1',
    dateStr: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkInTime: '07:54:12',
    checkOutTime: '16:05:44',
    checkInPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    checkOutPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    checkInLocation: { lat: -6.20885, lon: 106.84562, distance: 8 },
    checkOutLocation: { lat: -6.20882, lon: 106.84561, distance: 5 },
    checkInStatus: 'TEPAT WAKTU',
    checkOutStatus: 'SELESAI'
  }
];

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || 'guest';
  const isNewUserSession = currentUser?.isNewUser || false;

  const settingsKey = `settings_${userId}`;
  const presenceKey = `presence_${userId}`;
  const logbooksKey = `logbooks_${userId}`;
  const auditLogsKey = `audit_logs_${userId}`;

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    if (saved) return JSON.parse(saved);
    return isNewUserSession ? NEW_USER_SETTINGS : DEFAULT_SETTINGS;
  });

  const [presenceLogs, setPresenceLogs] = useState(() => {
    const saved = localStorage.getItem(presenceKey);
    if (saved) return JSON.parse(saved);
    return isNewUserSession ? [] : SAMPLE_PRESENCE;
  });

  const [logbooks, setLogbooks] = useState(() => {
    const saved = localStorage.getItem(logbooksKey);
    if (saved) return JSON.parse(saved);
    return isNewUserSession ? [] : SAMPLE_LOGBOOKS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem(auditLogsKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Reload user-isolated state whenever current user changes
  useEffect(() => {
    if (userId) {
      const savedSet = localStorage.getItem(settingsKey);
      if (savedSet) {
        setSettings(JSON.parse(savedSet));
      } else {
        setSettings(currentUser?.isNewUser ? NEW_USER_SETTINGS : DEFAULT_SETTINGS);
      }

      const savedPres = localStorage.getItem(presenceKey);
      if (savedPres) {
        setPresenceLogs(JSON.parse(savedPres));
      } else {
        setPresenceLogs(currentUser?.isNewUser ? [] : SAMPLE_PRESENCE);
      }

      const savedLog = localStorage.getItem(logbooksKey);
      if (savedLog) {
        setLogbooks(JSON.parse(savedLog));
      } else {
        setLogbooks(currentUser?.isNewUser ? [] : SAMPLE_LOGBOOKS);
      }

      const savedAudit = localStorage.getItem(auditLogsKey);
      setAuditLogs(savedAudit ? JSON.parse(savedAudit) : []);
    }
  }, [userId, currentUser?.isNewUser]);

  // Sync to local storage
  useEffect(() => {
    if (userId) {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }
  }, [settings, settingsKey, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(presenceKey, JSON.stringify(presenceLogs));
    }
  }, [presenceLogs, presenceKey, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(logbooksKey, JSON.stringify(logbooks));
    }
  }, [logbooks, logbooksKey, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(auditLogsKey, JSON.stringify(auditLogs));
    }
  }, [auditLogs, auditLogsKey, userId]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getTodayPresence = () => {
    const today = getTodayStr();
    return presenceLogs.find((p) => p.dateStr === today) || null;
  };

  const getTodayLogbook = () => {
    const today = getTodayStr();
    return logbooks.find((l) => l.dateStr === today) || null;
  };

  // Method to update Internship Settings (Sets isConfigured: true)
  const updateSettings = (newSettings, changeReason = 'Pembaruan durasi magang') => {
    const oldEndDate = settings.endDate;
    const isEndDateChanged = newSettings.endDate && newSettings.endDate !== oldEndDate;

    if (isEndDateChanged && settings.isConfigured) {
      const newAuditEntry = {
        id: `audit_${Date.now()}`,
        oldDate: oldEndDate,
        newDate: newSettings.endDate,
        timestamp: new Date().toISOString(),
        reason: changeReason,
        changedBy: currentUser?.name || 'Mahasiswa'
      };
      setAuditLogs((prev) => [newAuditEntry, ...prev]);
    }

    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      isConfigured: true, // Complete onboarding setup!
      targetLat: prev.isLocked ? prev.targetLat : (newSettings.targetLat ?? prev.targetLat),
      targetLon: prev.isLocked ? prev.targetLon : (newSettings.targetLon ?? prev.targetLon),
      startDate: prev.isLocked ? prev.startDate : (newSettings.startDate ?? prev.startDate)
    }));
  };

  const addCheckIn = ({ photoDataUrl, userLat, userLon, distance }) => {
    const todayStr = getTodayStr();
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    
    const [reqHour, reqMin] = (settings.workHours?.checkInStart || '08:00').split(':').map(Number);
    const now = new Date();
    const isLate = now.getHours() > reqHour || (now.getHours() === reqHour && now.getMinutes() > reqMin);
    const status = isLate ? 'TERLAMBAT' : 'TEPAT WAKTU';

    const existingToday = getTodayPresence();

    if (existingToday) {
      setPresenceLogs((prev) =>
        prev.map((item) =>
          item.dateStr === todayStr
            ? {
                ...item,
                checkInTime: nowTimeStr,
                checkInPhoto: photoDataUrl,
                checkInLocation: { lat: userLat, lon: userLon, distance },
                checkInStatus: status
              }
            : item
        )
      );
    } else {
      const newRecord = {
        id: `pres_${Date.now()}`,
        dateStr: todayStr,
        checkInTime: nowTimeStr,
        checkOutTime: null,
        checkInPhoto: photoDataUrl,
        checkOutPhoto: null,
        checkInLocation: { lat: userLat, lon: userLon, distance },
        checkOutLocation: null,
        checkInStatus: status,
        checkOutStatus: null
      };
      setPresenceLogs((prev) => [newRecord, ...prev]);
    }

    if (!settings.isLocked) {
      setSettings((prev) => ({ ...prev, isLocked: true }));
    }
  };

  const addCheckOut = ({ photoDataUrl, userLat, userLon, distance }) => {
    const todayLogbook = getTodayLogbook();
    
    if (!todayLogbook || (!todayLogbook.achievements && !todayLogbook.obstacles)) {
      throw new Error('GUARDRAIL_LOGBOOK_REQUIRED');
    }

    const todayStr = getTodayStr();
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });

    setPresenceLogs((prev) =>
      prev.map((item) =>
        item.dateStr === todayStr
          ? {
              ...item,
              checkOutTime: nowTimeStr,
              checkOutPhoto: photoDataUrl,
              checkOutLocation: { lat: userLat, lon: userLon, distance },
              checkOutStatus: 'SELESAI'
            }
          : item
        )
      );
  };

  const saveLogbook = ({ achievements, obstacles, tomorrowPlan, dateStr = getTodayStr() }) => {
    const existing = logbooks.find((l) => l.dateStr === dateStr);
    const nowIso = new Date().toISOString();

    if (existing) {
      setLogbooks((prev) =>
        prev.map((item) =>
          item.dateStr === dateStr
            ? {
                ...item,
                achievements,
                obstacles,
                tomorrowPlan,
                updatedAt: nowIso
              }
            : item
        )
      );
    } else {
      const newEntry = {
        id: `log_${Date.now()}`,
        dateStr,
        achievements,
        obstacles,
        tomorrowPlan,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      setLogbooks((prev) => [newEntry, ...prev]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        presenceLogs,
        logbooks,
        auditLogs,
        getTodayPresence,
        getTodayLogbook,
        getTodayStr,
        addCheckIn,
        addCheckOut,
        saveLogbook
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
