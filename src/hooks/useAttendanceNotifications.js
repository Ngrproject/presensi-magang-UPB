import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useAttendanceNotifications() {
  const {
    getTodayPresence,
    getTodayCheckInStartStr,
    getTodayRequiredCheckOutStr,
    getTodayStr
  } = useApp();

  const [permissionStatus, setPermissionStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('upb_pwa_notifications_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Request Notification Permission from Browser / OS
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser / Perangkat HP ini belum mendukung Web Notification API.');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);

      if (perm === 'granted') {
        localStorage.setItem('upb_pwa_notifications_enabled', JSON.stringify(true));
        setNotificationsEnabled(true);
        return true;
      } else if (perm === 'denied') {
        alert('Izin notifikasi ditolak oleh browser/sistem HP. Silakan aktifkan izin notifikasi situs di Pengaturan HP Anda.');
        return false;
      }
      return false;
    } catch (err) {
      console.error('[PWA Notification] Error requesting permission:', err);
      return false;
    }
  }, []);

  // Toggle Notifications On / Off
  const toggleNotifications = useCallback((enabled) => {
    setNotificationsEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_pwa_notifications_enabled', JSON.stringify(enabled));
    }
  }, []);

  // Dispatch OS-Level Notification via ServiceWorker or Notification API
  const dispatchNotification = useCallback((title, options = {}) => {
    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      data: { url: '/presensi' },
      tag: 'presensi-alert',
      ...options
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      }).catch(() => {
        new Notification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  }, []);

  // Send Manual Test Notification
  const sendTestNotification = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    dispatchNotification('📌 Uji Coba Notifikasi Presensi UPB', {
      body: 'Pengingat H-15 menit jam masuk dan jam pulang berhasil diaktifkan di HP Anda!',
      tag: 'test-notification'
    });
  }, [permissionStatus, requestPermission, dispatchNotification]);

  // Background Clock Monitoring Scheduler (Runs every 30 seconds)
  useEffect(() => {
    if (!notificationsEnabled || permissionStatus !== 'granted') return;

    const checkAndTriggerReminders = () => {
      const todayStr = getTodayStr();
      const todayPresence = getTodayPresence();

      const isCheckedIn = Boolean(todayPresence?.checkInTime);
      const isCheckedOut = Boolean(todayPresence?.checkOutTime);
      const isLeave = Boolean(todayPresence?.isLeave);

      const now = new Date();
      const currentMinTotal = now.getHours() * 60 + now.getMinutes();

      // 1. Check-In Reminder (H-15 Minutes before start time)
      if (!isCheckedIn && !isLeave) {
        const checkInStartStr = getTodayCheckInStartStr(); // e.g. "08:00"
        const [inHour, inMin] = checkInStartStr.split(':').map((v) => parseInt(v, 10) || 0);
        const checkInMinTotal = inHour * 60 + inMin;
        const reminderStartMin = checkInMinTotal - 15; // 15 minutes before

        const lastNotifiedCheckIn = localStorage.getItem('last_notified_checkin_date');

        // Trigger if current time is between (CheckIn - 15 min) and CheckIn time
        if (currentMinTotal >= reminderStartMin && currentMinTotal < checkInMinTotal) {
          if (lastNotifiedCheckIn !== todayStr) {
            dispatchNotification('📌 Pengingat Presensi Masuk (H-15 Menit)', {
              body: `Waktu presensi masuk H-15 menit (Pukul ${checkInStartStr} WIB). Buka PWA E-Presensi UPB dan lakukan selfie presensi tepat waktu!`,
              tag: `checkin-reminder-${todayStr}`
            });
            localStorage.setItem('last_notified_checkin_date', todayStr);
          }
        }
      }

      // 2. Check-Out Reminder (Right at knock-off time)
      if (isCheckedIn && !isCheckedOut && !isLeave) {
        const checkOutStartStr = getTodayRequiredCheckOutStr(); // e.g. "16:00"
        const [outHour, outMin] = checkOutStartStr.split(':').map((v) => parseInt(v, 10) || 0);
        const checkOutMinTotal = outHour * 60 + outMin;

        const lastNotifiedCheckOut = localStorage.getItem('last_notified_checkout_date');

        // Trigger if current time reaches or passes checkOut time (within 60 min window)
        if (currentMinTotal >= checkOutMinTotal && currentMinTotal < checkOutMinTotal + 60) {
          if (lastNotifiedCheckOut !== todayStr) {
            dispatchNotification(`🔔 Waktu Presensi Pulang Tiba (${checkOutStartStr} WIB)`, {
              body: 'Jam kerja magang hari ini telah selesai! Segera isi Daily Logbook & lakukan selfie Presensi Pulang.',
              tag: `checkout-reminder-${todayStr}`
            });
            localStorage.setItem('last_notified_checkout_date', todayStr);
          }
        }
      }
    };

    // Run initial check
    checkAndTriggerReminders();

    // Set interval check every 30 seconds
    const intervalId = setInterval(checkAndTriggerReminders, 30000);

    return () => clearInterval(intervalId);
  }, [
    notificationsEnabled,
    permissionStatus,
    getTodayStr,
    getTodayPresence,
    getTodayCheckInStartStr,
    getTodayRequiredCheckOutStr,
    dispatchNotification
  ]);

  return {
    permissionStatus,
    notificationsEnabled,
    requestPermission,
    toggleNotifications,
    sendTestNotification
  };
}
