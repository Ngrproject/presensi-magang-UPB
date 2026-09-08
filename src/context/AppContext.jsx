import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured, db } from '../utils/firebase';
import {
  collection, doc, setDoc, query, where,
  onSnapshot, getDocs, addDoc, deleteDoc
} from 'firebase/firestore';

const AppContext = createContext(null);

const DEFAULT_SETTINGS = {
  companyName: '',
  targetLat: -6.2088,
  targetLon: 106.8456,
  geofenceRadius: 50,
  scheduleMode: 'REGULER', // 'REGULER' | 'SHIFT'
  selectedShift: 'SHIFT_1',
  shifts: {
    SHIFT_1: { name: 'Shift 1 (Pagi)', start: '07:00', end: '15:00' },
    SHIFT_2: { name: 'Shift 2 (Siang)', start: '15:00', end: '23:00' },
    SHIFT_3: { name: 'Shift 3 (Malam)', start: '23:00', end: '07:00' }
  },
  workHours: {
    checkInStart: '08:00',
    checkOutStart: '16:00'
  },
  useCustomDailyHours: false,
  dailyHours: {
    Senin: { start: '08:00', end: '16:00' },
    Selasa: { start: '08:00', end: '16:00' },
    Rabu: { start: '08:00', end: '16:00' },
    Kamis: { start: '08:00', end: '16:00' },
    Jumat: { start: '08:00', end: '14:00' },
    Sabtu: { start: '08:00', end: '12:00' },
    Minggu: { start: '08:00', end: '12:00' }
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
      shifts: {
        ...DEFAULT_SETTINGS.shifts,
        ...(parsed?.shifts || {})
      },
      dailyHours: {
        ...DEFAULT_SETTINGS.dailyHours,
        ...(parsed?.dailyHours || {})
      },
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

  const [allPresenceLogs, setAllPresenceLogs] = useState(() => {
    const saved = localStorage.getItem('all_presence_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [allLogbooks, setAllLogbooks] = useState(() => {
    const saved = localStorage.getItem('all_logbooks');
    return saved ? JSON.parse(saved) : [];
  });

  const [mentorshipRequests, setMentorshipRequests] = useState(() => {
    const saved = localStorage.getItem('mentorship_requests_all');
    return saved ? JSON.parse(saved) : [];
  });

  const [bimbinganMessages, setBimbinganMessages] = useState(() => {
    const saved = localStorage.getItem('bimbingan_messages_all');
    return saved ? JSON.parse(saved) : [];
  });

  const [studentFriends, setStudentFriends] = useState(() => {
    const saved = localStorage.getItem(`student_friends_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [studentChats, setStudentChats] = useState(() => {
    const saved = localStorage.getItem('student_chats_all');
    const parsed = saved ? JSON.parse(saved) : [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    return parsed.filter(m => {
      if (!m || !m.timestamp) return false;
      const mDateStr = m.dateStr || m.timestamp.split('T')[0];
      if (mDateStr < todayStr) return false;
      if (hour >= 18) {
        const mHour = new Date(m.timestamp).getHours();
        if (mHour < 18) return false;
      }
      return true;
    });
  });

  const [groupMessages, setGroupMessages] = useState(() => {
    const saved = localStorage.getItem('group_messages_all');
    const parsed = saved ? JSON.parse(saved) : [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    return parsed.filter(m => {
      if (!m || !m.timestamp) return false;
      const mDateStr = m.dateStr || m.timestamp.split('T')[0];
      if (mDateStr < todayStr) return false;
      if (hour >= 18) {
        const mHour = new Date(m.timestamp).getHours();
        if (mHour < 18) return false;
      }
      return true;
    });
  });

  const [customGroups, setCustomGroups] = useState(() => {
    const saved = localStorage.getItem('custom_groups_all');
    return saved ? JSON.parse(saved) : [];
  });

  // Real-time Firestore sync listeners for individual user context
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
        shifts: {
          ...DEFAULT_SETTINGS.shifts,
          ...(parsed?.shifts || {})
        },
        dailyHours: {
          ...DEFAULT_SETTINGS.dailyHours,
          ...(parsed?.dailyHours || {})
        },
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
            shifts: {
              ...DEFAULT_SETTINGS.shifts,
              ...(data?.shifts || {})
            },
            dailyHours: {
              ...DEFAULT_SETTINGS.dailyHours,
              ...(data?.dailyHours || {})
            },
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

  // Real-time Firestore sync listeners for global collections (admin & lecturer views)
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const presencesRef = collection(db, 'presences');
      const unsubAllPres = onSnapshot(presencesRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
        setAllPresenceLogs(list);
        localStorage.setItem('all_presence_logs', JSON.stringify(list));
      }, (err) => console.log('Firestore all presences listener info:', err));

      const logbooksRef = collection(db, 'logbooks');
      const unsubAllLogs = onSnapshot(logbooksRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
        setAllLogbooks(list);
        localStorage.setItem('all_logbooks', JSON.stringify(list));
      }, (err) => console.log('Firestore all logbooks listener info:', err));

      const reqRef = collection(db, 'mentorship_requests');
      const unsubRequests = onSnapshot(reqRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMentorshipRequests(list);
        localStorage.setItem('mentorship_requests_all', JSON.stringify(list));
      }, (err) => console.log('Firestore mentorship requests info:', err));

      const msgRef = collection(db, 'bimbingan_messages');
      const unsubMessages = onSnapshot(msgRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        setBimbinganMessages(list);
        localStorage.setItem('bimbingan_messages_all', JSON.stringify(list));
      }, (err) => console.log('Firestore bimbingan messages info:', err));

      const studentChatRef = collection(db, 'student_chats');
      const unsubStudentChats = onSnapshot(studentChatRef, (snap) => {
        const list = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const mDateStr = data.dateStr || (data.timestamp ? data.timestamp.split('T')[0] : '');
          const mHour = data.timestamp ? new Date(data.timestamp).getHours() : 0;
          const isExpired = mDateStr < todayStr || (currentHour >= 18 && mHour < 18);
          if (isExpired) {
            deleteDoc(doc(db, 'student_chats', docSnap.id)).catch(() => {});
          } else {
            list.push({ id: docSnap.id, ...data });
          }
        });
        list.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        setStudentChats(list);
        localStorage.setItem('student_chats_all', JSON.stringify(list));
      }, (err) => console.log('Firestore student chats info:', err));

      const groupChatRef = collection(db, 'group_messages');
      const unsubGroupChats = onSnapshot(groupChatRef, (snap) => {
        const list = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const mDateStr = data.dateStr || (data.timestamp ? data.timestamp.split('T')[0] : '');
          const mHour = data.timestamp ? new Date(data.timestamp).getHours() : 0;
          const isExpired = mDateStr < todayStr || (currentHour >= 18 && mHour < 18);
          if (isExpired) {
            deleteDoc(doc(db, 'group_messages', docSnap.id)).catch(() => {});
          } else {
            list.push({ id: docSnap.id, ...data });
          }
        });
        list.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
        setGroupMessages(list);
        localStorage.setItem('group_messages_all', JSON.stringify(list));
      }, (err) => console.log('Firestore group messages info:', err));

      const customGroupRef = collection(db, 'custom_groups');
      const unsubCustomGroups = onSnapshot(customGroupRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCustomGroups(list);
        localStorage.setItem('custom_groups_all', JSON.stringify(list));
      }, (err) => console.log('Firestore custom groups info:', err));

      return () => {
        unsubAllPres();
        unsubAllLogs();
        unsubRequests();
        unsubMessages();
        unsubStudentChats();
        unsubGroupChats();
        unsubCustomGroups();
      };
    }
  }, []);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getTodayPresence = () => {
    const today = getTodayStr();
    return presenceLogs.find((p) => p.dateStr === today) || null;
  };

  const getTodayLogbook = () => {
    const today = getTodayStr();
    return logbooks.find((l) => l.dateStr === today) || null;
  };

  const getYesterdayLogbook = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];
    return logbooks.find((l) => l.dateStr === yesterdayStr) || null;
  };

  const getTodayRequiredCheckOutStr = () => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[new Date().getDay()];

    if (settings.scheduleMode === 'SHIFT') {
      const shiftObj = settings.shifts?.[settings.selectedShift];
      return shiftObj?.end || '16:00';
    }

    if (settings.useCustomDailyHours && settings.dailyHours?.[todayName]) {
      return settings.dailyHours[todayName].end || '16:00';
    }

    return settings.workHours?.checkOutStart || '16:00';
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

    let reqCheckInStr = settings.workHours?.checkInStart || '08:00';
    if (settings.scheduleMode === 'SHIFT') {
      reqCheckInStr = settings.shifts?.[settings.selectedShift]?.start || '07:00';
    } else if (settings.useCustomDailyHours) {
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = dayNames[new Date().getDay()];
      reqCheckInStr = settings.dailyHours?.[todayName]?.start || '08:00';
    }

    const [reqHour, reqMin] = reqCheckInStr.split(':').map(Number);
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
        setDoc(doc(db, 'settings', userId), lockUpdated, { merge: true }).catch(() => { });
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
    const todayLogbook = getTodayLogbook();
    if (!todayLogbook || (!todayLogbook.achievements && !todayLogbook.obstacles)) {
      throw new Error('GUARDRAIL_LOGBOOK_REQUIRED');
    }

    const reqTimeString = getTodayRequiredCheckOutStr();
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

  const addLeaveRecord = async ({ leaveType, reason, proofDataUrl, dateStr = getTodayStr() }) => {
    const recordId = `leave_${userId}_${dateStr}`;

    const leaveRecord = {
      id: recordId,
      userId,
      studentName: currentUser?.name || 'Mahasiswa',
      studentId: currentUser?.studentId || '',
      dateStr,
      isLeave: true,
      leaveType,
      checkInTime: `IZIN (${leaveType})`,
      checkOutTime: `IZIN (${leaveType})`,
      checkInStatus: leaveType,
      checkOutStatus: leaveType,
      reason,
      proofPhoto: proofDataUrl || null,
      submittedAt: new Date().toISOString()
    };

    setPresenceLogs((prev) => {
      const idx = prev.findIndex((p) => p.dateStr === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = leaveRecord;
        return copy;
      }
      return [leaveRecord, ...prev];
    });

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'presences', recordId), leaveRecord, { merge: true });
      } catch (err) {
        console.error("Firestore leave record save error:", err);
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

  const adminUnlockStudentSettings = async (targetUserId) => {
    if (!targetUserId) return;

    if (targetUserId === userId) {
      const updated = { ...settings, isLocked: false };
      setSettings(updated);
      localStorage.setItem(settingsKey, JSON.stringify(updated));
    }

    const targetSettingsKey = `settings_${targetUserId}`;
    const savedTarget = localStorage.getItem(targetSettingsKey);
    if (savedTarget) {
      const parsed = JSON.parse(savedTarget);
      localStorage.setItem(targetSettingsKey, JSON.stringify({ ...parsed, isLocked: false }));
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', targetUserId), { isLocked: false }, { merge: true });
      } catch (err) {
        console.error("Firestore adminUnlockStudentSettings error:", err);
      }
    }
  };

  const adminSavePresence = async (presenceData) => {
    const targetUserId = presenceData.userId;
    const dateStr = presenceData.dateStr || getTodayStr();
    const recordId = presenceData.id || `pres_${targetUserId}_${dateStr}`;

    let status = presenceData.checkInStatus || 'TEPAT WAKTU';
    if (status === 'HADIR TEPAT WAKTU' || status === 'HADIR') {
      status = 'TEPAT WAKTU';
    }

    const newRecord = {
      id: recordId,
      userId: targetUserId,
      studentName: presenceData.studentName || 'Mahasiswa',
      studentId: presenceData.studentId || '',
      dateStr,
      checkInTime: presenceData.checkInTime || '08:00',
      checkOutTime: presenceData.checkOutTime || '16:00',
      checkInStatus: status,
      checkOutStatus: presenceData.checkOutStatus || 'SELESAI',
      notes: presenceData.notes || '',
      isLeave: Boolean(presenceData.isLeave),
      leaveType: presenceData.leaveType || null,
      reason: presenceData.reason || null,
      adminOverride: true,
      updatedAt: new Date().toISOString()
    };

    const targetPresenceKey = `presence_${targetUserId}`;
    const savedTargetPresences = localStorage.getItem(targetPresenceKey);
    let targetList = savedTargetPresences ? JSON.parse(savedTargetPresences) : [];
    const tIdx = targetList.findIndex((p) => p.dateStr === dateStr);
    if (tIdx >= 0) {
      targetList[tIdx] = newRecord;
    } else {
      targetList.unshift(newRecord);
    }
    targetList.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));
    localStorage.setItem(targetPresenceKey, JSON.stringify(targetList));

    if (targetUserId === userId) {
      setPresenceLogs(targetList);
    }

    setAllPresenceLogs((prev) => {
      const idx = prev.findIndex((p) => p.id === recordId);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newRecord;
      } else {
        updated = [newRecord, ...prev];
      }
      localStorage.setItem('all_presence_logs', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'presences', recordId), newRecord, { merge: true });
      } catch (err) {
        console.error("Firestore adminSavePresence error:", err);
      }
    }
  };

  const adminDeletePresence = async (recordId) => {
    const targetRecord = allPresenceLogs.find(p => p.id === recordId) || presenceLogs.find(p => p.id === recordId);
    if (targetRecord?.userId) {
      const targetPresenceKey = `presence_${targetRecord.userId}`;
      const savedTargetPresences = localStorage.getItem(targetPresenceKey);
      if (savedTargetPresences) {
        const targetList = JSON.parse(savedTargetPresences).filter(p => p.id !== recordId);
        localStorage.setItem(targetPresenceKey, JSON.stringify(targetList));
        if (targetRecord.userId === userId) {
          setPresenceLogs(targetList);
        }
      }
    }

    setPresenceLogs((prev) => prev.filter((p) => p.id !== recordId));
    setAllPresenceLogs((prev) => {
      const updated = prev.filter((p) => p.id !== recordId);
      localStorage.setItem('all_presence_logs', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        const { deleteDoc: deleteFsDoc } = await import('firebase/firestore');
        await deleteFsDoc(doc(db, 'presences', recordId));
      } catch (err) {
        console.error("Firestore adminDeletePresence error:", err);
      }
    }
  };

  // Mentorship (Bimbingan) Methods
  const requestMentorship = async ({ lecturerId, lecturerName }) => {
    if (!currentUser) return;
    const reqId = `req_${currentUser.uid}_${Date.now()}`;
    const newReq = {
      id: reqId,
      studentId: currentUser.studentId || '',
      studentUid: currentUser.uid,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentUniversity: currentUser.university || 'Universitas Putra Bangsa (UPB)',
      lecturerId,
      lecturerName,
      status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
      createdAt: new Date().toISOString()
    };

    setMentorshipRequests(prev => {
      const isMatch = (r) =>
        r.studentUid === currentUser.uid ||
        r.studentId === currentUser.studentId ||
        r.studentUid === currentUser.studentId ||
        r.studentId === currentUser.uid;
      const filtered = prev.filter(r => !isMatch(r));
      const updated = lecturerId ? [newReq, ...filtered] : filtered;
      localStorage.setItem('mentorship_requests_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'mentorship_requests', reqId), newReq);
      } catch (err) {
        console.error("Firestore requestMentorship error:", err);
      }
    }
  };

  const respondMentorship = async (requestId, newStatus) => {
    setMentorshipRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? { ...r, status: newStatus, respondedAt: new Date().toISOString() } : r);
      localStorage.setItem('mentorship_requests_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'mentorship_requests', requestId), {
          status: newStatus,
          respondedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Firestore respondMentorship error:", err);
      }
    }
  };

  const adminAssignMentorship = async ({ studentUid, studentNim, studentName, studentEmail, studentUniversity, lecturerId, lecturerName }) => {
    if (!studentUid && !studentNim && !studentName) return;

    const isMatch = (r) => {
      const matchUid = studentUid && (r.studentUid === studentUid || r.studentId === studentUid);
      const matchNim = studentNim && (r.studentUid === studentNim || r.studentId === studentNim);
      const matchName = studentName && (r.studentName && r.studentName.toLowerCase() === studentName.toLowerCase());
      const matchEmail = studentEmail && (r.studentEmail && r.studentEmail.toLowerCase() === studentEmail.toLowerCase());
      return Boolean(matchUid || matchNim || matchName || matchEmail);
    };

    if (!lecturerId) {
      setMentorshipRequests(prev => {
        const updated = prev.filter(r => !isMatch(r));
        localStorage.setItem('mentorship_requests_all', JSON.stringify(updated));
        return updated;
      });
      return;
    }

    const reqId = `req_${studentUid || studentNim || Date.now()}_admin`;
    const newReq = {
      id: reqId,
      studentId: studentNim || '',
      studentUid: studentUid || studentNim || '',
      studentName: studentName || 'Mahasiswa',
      studentEmail: studentEmail || '',
      studentUniversity: studentUniversity || 'Universitas Putra Bangsa (UPB)',
      lecturerId,
      lecturerName,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      respondedAt: new Date().toISOString(),
      assignedByAdmin: true
    };

    setMentorshipRequests(prev => {
      const filtered = prev.filter(r => !isMatch(r));
      const updated = [newReq, ...filtered];
      localStorage.setItem('mentorship_requests_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'mentorship_requests', reqId), newReq);
      } catch (err) {
        console.error("Firestore adminAssignMentorship error:", err);
      }
    }
  };

  const sendBimbinganMessage = async ({ requestId, message, fileName = null, fileDataUrl = null, fileType = null }) => {
    if (!currentUser) return;
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMsg = {
      id: msgId,
      requestId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderRole: currentUser.role || 'student',
      message: message || '',
      fileName,
      fileDataUrl,
      fileType,
      timestamp: new Date().toISOString()
    };

    setBimbinganMessages(prev => {
      const updated = [...prev, newMsg];
      localStorage.setItem('bimbingan_messages_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'bimbingan_messages', msgId), newMsg);
      } catch (err) {
        console.error("Firestore sendBimbinganMessage error:", err);
      }
    }
  };

  const addStudentFriendByNim = async (nimInput, allUsersList = []) => {
    const nim = (nimInput || '').trim();
    if (!nim) throw new Error('Silakan masukkan NIM teman.');
    if (currentUser?.studentId === nim) throw new Error('Anda tidak dapat menambahkan NIM sendiri.');

    const targetUser = allUsersList.find(u => u.studentId === nim || u.email?.startsWith(nim));
    if (!targetUser) {
      throw new Error(`Mahasiswa dengan NIM "${nim}" tidak ditemukan. Pastikan NIM sudah benar.`);
    }

    const friendEntry = {
      uid: targetUser.uid,
      studentId: targetUser.studentId,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      addedAt: new Date().toISOString()
    };

    setStudentFriends(prev => {
      if (prev.some(f => f.studentId === targetUser.studentId || f.uid === targetUser.uid)) {
        return prev;
      }
      const updated = [friendEntry, ...prev];
      localStorage.setItem(`student_friends_${userId}`, JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db && userId && userId !== 'guest') {
      try {
        await setDoc(doc(db, 'student_friends', `${userId}_${targetUser.uid}`), {
          ownerUid: userId,
          friendUid: targetUser.uid,
          friendNim: targetUser.studentId,
          friendName: targetUser.name,
          addedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore addStudentFriend error:", err);
      }
    }

    return friendEntry;
  };

  const sendStudentChatMessage = async ({ recipientUid, recipientNim, message }) => {
    if (!currentUser || !message.trim()) return;
    const msgId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const todayStr = getTodayStr();

    const newMsg = {
      id: msgId,
      senderUid: currentUser.uid,
      senderNim: currentUser.studentId || '',
      senderName: currentUser.name,
      recipientUid,
      recipientNim,
      message: message.trim(),
      timestamp: nowIso,
      dateStr: todayStr
    };

    setStudentChats(prev => {
      const updated = [...prev, newMsg];
      localStorage.setItem('student_chats_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'student_chats', msgId), newMsg);
      } catch (err) {
        console.error("Firestore sendStudentChatMessage error:", err);
      }
    }
  };

  const createCustomGroup = async ({ groupName, memberUids = [], memberNims = [] }) => {
    if (!currentUser || !groupName.trim()) throw new Error('Nama grup tidak boleh kosong.');

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const allMemberUids = Array.from(new Set([currentUser.uid, ...memberUids]));
    const allMemberNims = Array.from(new Set([currentUser.studentId || '', ...memberNims]));

    const newGroup = {
      id: groupId,
      name: groupName.trim(),
      createdByUid: currentUser.uid,
      createdByName: currentUser.name,
      createdByNim: currentUser.studentId || '',
      memberUids: allMemberUids,
      memberNims: allMemberNims,
      createdAt: new Date().toISOString()
    };

    setCustomGroups(prev => {
      const updated = [newGroup, ...prev];
      localStorage.setItem('custom_groups_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'custom_groups', groupId), newGroup);
      } catch (err) {
        console.error("Firestore createCustomGroup error:", err);
      }
    }

    return newGroup;
  };

  const sendGroupChatMessage = async ({ groupId, companyName, message }) => {
    if (!currentUser || !message.trim()) return;
    const msgId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const todayStr = getTodayStr();

    const newMsg = {
      id: msgId,
      groupId: groupId || 'default_group',
      companyName: companyName || settings.companyName || 'Universitas Putra Bangsa (UPB)',
      senderUid: currentUser.uid,
      senderNim: currentUser.studentId || '',
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl || '',
      message: message.trim(),
      timestamp: nowIso,
      dateStr: todayStr
    };

    setGroupMessages(prev => {
      const updated = [...prev, newMsg];
      localStorage.setItem('group_messages_all', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'group_messages', msgId), newMsg);
      } catch (err) {
        console.error("Firestore sendGroupChatMessage error:", err);
      }
    }
  };

  const purgeOldStudentChats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    setStudentChats(prev => {
      const valid = prev.filter(msg => {
        if (!msg || !msg.timestamp) return false;
        const msgDate = new Date(msg.timestamp);
        const msgDateStr = msg.dateStr || msgDate.toISOString().split('T')[0];
        const msgHour = msgDate.getHours();

        if (msgDateStr < todayStr) return false;
        if (currentHour >= 18 && msgHour < 18) return false;
        return true;
      });

      if (valid.length !== prev.length) {
        localStorage.setItem('student_chats_all', JSON.stringify(valid));
      }
      return valid;
    });

    setGroupMessages(prev => {
      const valid = prev.filter(msg => {
        if (!msg || !msg.timestamp) return false;
        const msgDate = new Date(msg.timestamp);
        const msgDateStr = msg.dateStr || msgDate.toISOString().split('T')[0];
        const msgHour = msgDate.getHours();

        if (msgDateStr < todayStr) return false;
        if (currentHour >= 18 && msgHour < 18) return false;
        return true;
      });

      if (valid.length !== prev.length) {
        localStorage.setItem('group_messages_all', JSON.stringify(valid));
      }
      return valid;
    });
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        presenceLogs,
        allPresenceLogs,
        logbooks,
        allLogbooks,
        auditLogs,
        mentorshipRequests,
        bimbinganMessages,
        studentFriends,
        studentChats,
        groupMessages,
        customGroups,
        getTodayPresence,
        getTodayLogbook,
        getYesterdayLogbook,
        getTodayRequiredCheckOutStr,
        getTodayStr,
        addCheckIn,
        addCheckOut,
        addLeaveRecord,
        saveLogbook,
        adminUnlockStudentSettings,
        adminSavePresence,
        adminDeletePresence,
        requestMentorship,
        respondMentorship,
        adminAssignMentorship,
        sendBimbinganMessage,
        addStudentFriendByNim,
        sendStudentChatMessage,
        sendGroupChatMessage,
        createCustomGroup,
        purgeOldStudentChats
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
