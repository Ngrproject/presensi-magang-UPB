import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured, db } from '../utils/firebase';
import { 
  collection, doc, getDoc, setDoc, query, where, 
  onSnapshot, getDocs, addDoc 
} from 'firebase/firestore';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
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
  isConfigured: false
};

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || 'guest';

  const settingsKey = `settings_${userId}`;
  const presenceKey = `presence_${userId}`;
  const logbooksKey = `logbooks_${userId}`;
  const auditLogsKey = `audit_logs_${userId}`;

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      workHours: {
        checkInStart: parsed?.workHours?.checkInStart || '08:00',
        checkOutStart: parsed?.workHours?.checkOutStart || '16:00'
      }
    };
  });

  const [presenceLogs, setPresenceLogs] = useState(() => {
    const saved = localStorage.getItem(presenceKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [logbooks, setLogbooks] = useState(() => {
    const saved = localStorage.getItem(logbooksKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem(auditLogsKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Real-time Firestore sync listeners
  useEffect(() => {
    if (!userId || userId === 'guest') {
      setSettings(DEFAULT_SETTINGS);
      setPresenceLogs([]);
      setLogbooks([]);
      setAuditLogs([]);
      return;
    }

    const savedSet = localStorage.getItem(settingsKey);
    if (savedSet) {
      const parsed = JSON.parse(savedSet);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed,
        workHours: {
          checkInStart: parsed?.workHours?.checkInStart || '08:00',
          checkOutStart: parsed?.workHours?.checkOutStart || '16:00'
        }
      });
    }

    const savedPres = localStorage.getItem(presenceKey);
    if (savedPres) setPresenceLogs(JSON.parse(savedPres));

    const savedLog = localStorage.getItem(logbooksKey);
    if (savedLog) setLogbooks(JSON.parse(savedLog));

    const savedAudit = localStorage.getItem(auditLogsKey);
    if (savedAudit) setAuditLogs(JSON.parse(savedAudit));

    if (isFirebaseConfigured && db) {
      const settingsRef = doc(db, 'settings', userId);
      const unsubSettings = onSnapshot(settingsRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const merged = {
            ...DEFAULT_SETTINGS,
            ...data,
            workHours: {
              checkInStart: data?.workHours?.checkInStart || '08:00',
              checkOutStart: data?.workHours?.checkOutStart || '16:00'
            }
          };
          setSettings(merged);
          localStorage.setItem(settingsKey, JSON.stringify(merged));
        }
      }, (err) => console.log('Firestore settings listener info:', err));

      const presencesRef = collection(db, 'presences');
      const qPres = query(presencesRef, where('userId', '==', userId));
      const unsubPresences = onSnapshot(qPres, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
        setPresenceLogs(list);
        localStorage.setItem(presenceKey, JSON.stringify(list));
      }, (err) => console.log('Firestore presences listener info:', err));

      const logbooksRef = collection(db, 'logbooks');
      const qLog = query(logbooksRef, where('userId', '==', userId));
      const unsubLogbooks = onSnapshot(qLog, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
        setLogbooks(list);
        localStorage.setItem(logbooksKey, JSON.stringify(list));
      }, (err) => console.log('Firestore logbooks listener info:', err));

      const auditRef = collection(db, 'audit_logs');
      const qAudit = query(auditRef, where('userId', '==', userId));
      const unsubAudit = onSnapshot(qAudit, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(list);
        localStorage.setItem(auditLogsKey, JSON.stringify(list));
      }, (err) => console.log('Firestore audit listener info:', err));

      return () => {
        unsubSettings();
        unsubPresences();
        unsubLogbooks();
        unsubAudit();
      };
    }
  }, [userId]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getTodayPresence = () => {
    const today = getTodayStr();
    return presenceLogs.find((p) => p.dateStr === today) || null;
  };

  const getTodayLogbook = () => {
    const today = getTodayStr();
    return logbooks.find((l) => l.dateStr === today) || null;
  };

  const updateSettings = async (newSettings, changeReason = 'Pembaruan durasi magang') => {
    const oldEndDate = settings.endDate;
    const isEndDateChanged = newSettings.endDate && newSettings.endDate !== oldEndDate;

    const updated = {
      ...settings,
      ...newSettings,
      workHours: {
        checkInStart: newSettings.workHours?.checkInStart || settings.workHours?.checkInStart || '08:00',
        checkOutStart: newSettings.workHours?.checkOutStart || settings.workHours?.checkOutStart || '16:00'
      },
      userId,
      isConfigured: true,
      targetLat: settings.isLocked ? settings.targetLat : (newSettings.targetLat ?? settings.targetLat),
      targetLon: settings.isLocked ? settings.targetLon : (newSettings.targetLon ?? settings.targetLon),
      startDate: settings.isLocked ? settings.startDate : (newSettings.startDate ?? settings.startDate)
    };

    setSettings(updated);
    if (userId && userId !== 'guest') {
      localStorage.setItem(settingsKey, JSON.stringify(updated));
    }

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'settings', userId), updated, { merge: true });

        if (isEndDateChanged && settings.isConfigured) {
          const auditId = `audit_${Date.now()}`;
          const newAuditEntry = {
            id: auditId,
            userId,
            oldDate: oldEndDate,
            newDate: newSettings.endDate,
            timestamp: new Date().toISOString(),
            reason: changeReason,
            changedBy: currentUser?.name || 'Mahasiswa'
          };
          await setDoc(doc(db, 'audit_logs', auditId), newAuditEntry);
        }
      } catch (err) {
        console.error("Firestore settings update error:", err);
      }
    }
  };

  const addCheckIn = async ({ photoDataUrl, userLat, userLon, distance }) => {
    const todayStr = getTodayStr();
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    
    const [reqHour, reqMin] = (settings.workHours?.checkInStart || '08:00').split(':').map(Number);
    const now = new Date();
    const isLate = now.getHours() > reqHour || (now.getHours() === reqHour && now.getMinutes() > reqMin);
    const status = isLate ? 'TERLAMBAT' : 'TEPAT WAKTU';

    const existingToday = getTodayPresence();
    const recordId = existingToday?.id || `pres_${userId}_${todayStr}`;

    const newRecord = {
      id: recordId,
      userId,
      studentName: currentUser?.name || 'Mahasiswa',
      studentId: currentUser?.studentId || '',
      dateStr: todayStr,
      checkInTime: nowTimeStr,
      checkOutTime: existingToday?.checkOutTime || null,
      checkInPhoto: photoDataUrl,
      checkOutPhoto: existingToday?.checkOutPhoto || null,
      checkInLocation: { lat: userLat, lon: userLon, distance },
      checkOutLocation: existingToday?.checkOutLocation || null,
      checkInStatus: status,
      checkOutStatus: existingToday?.checkOutStatus || null
    };

    setPresenceLogs((prev) => {
      const idx = prev.findIndex((p) => p.dateStr === todayStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });

    if (!settings.isLocked) {
      const lockUpdated = { ...settings, isLocked: true };
      setSettings(lockUpdated);
      if (isFirebaseConfigured && db && userId) {
        setDoc(doc(db, 'settings', userId), lockUpdated, { merge: true }).catch(() => {});
      }
    }

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'presences', recordId), newRecord, { merge: true });
      } catch (err) {
        console.error("Firestore presences checkin error:", err);
      }
    }
  };

  const addCheckOut = async ({ photoDataUrl, userLat, userLon, distance }) => {
    // 1. Guardrail: Daily Logbook required
    const todayLogbook = getTodayLogbook();
    if (!todayLogbook || (!todayLogbook.achievements && !todayLogbook.obstacles)) {
      throw new Error('GUARDRAIL_LOGBOOK_REQUIRED');
    }

    // 2. Guardrail: Must be AFTER configured checkOutStart work hour (Default: 16:00)
    const rawCheckOutStr = settings.workHours?.checkOutStart;
    const reqTimeString = (rawCheckOutStr && String(rawCheckOutStr).trim()) ? String(rawCheckOutStr).trim() : '16:00';
    const parts = reqTimeString.split(':');
    const reqHour = parseInt(parts[0], 10) || 16;
    const reqMin = parseInt(parts[1], 10) || 0;

    const now = new Date();
    const nowMinTotal = now.getHours() * 60 + now.getMinutes();
    const reqMinTotal = reqHour * 60 + reqMin;

    if (nowMinTotal < reqMinTotal) {
      throw new Error(`GUARDRAIL_EARLY_CHECKOUT:${reqTimeString}`);
    }

    const todayStr = getTodayStr();
    const nowTimeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const existingToday = getTodayPresence();
    const recordId = existingToday?.id || `pres_${userId}_${todayStr}`;

    const updatedRecord = {
      ...existingToday,
      id: recordId,
      userId,
      studentName: currentUser?.name || 'Mahasiswa',
      studentId: currentUser?.studentId || '',
      dateStr: todayStr,
      checkOutTime: nowTimeStr,
      checkOutPhoto: photoDataUrl,
      checkOutLocation: { lat: userLat, lon: userLon, distance },
      checkOutStatus: 'SELESAI'
    };

    setPresenceLogs((prev) =>
      prev.map((item) => (item.dateStr === todayStr ? updatedRecord : item))
    );

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'presences', recordId), updatedRecord, { merge: true });
      } catch (err) {
        console.error("Firestore presences checkout error:", err);
      }
    }
  };

  const saveLogbook = async ({ achievements, obstacles, tomorrowPlan, dateStr = getTodayStr() }) => {
    const existing = logbooks.find((l) => l.dateStr === dateStr);
    const logId = existing?.id || `log_${userId}_${dateStr}`;
    const nowIso = new Date().toISOString();

    const logEntry = {
      id: logId,
      userId,
      studentName: currentUser?.name || 'Mahasiswa',
      studentId: currentUser?.studentId || '',
      dateStr,
      achievements,
      obstacles,
      tomorrowPlan,
      updatedAt: nowIso,
      createdAt: existing?.createdAt || nowIso
    };

    setLogbooks((prev) => {
      const idx = prev.findIndex((l) => l.dateStr === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = logEntry;
        return copy;
      }
      return [logEntry, ...prev];
    });

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'logbooks', logId), logEntry, { merge: true });
      } catch (err) {
        console.error("Firestore save logbook error:", err);
      }
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
