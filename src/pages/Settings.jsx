import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { 
  Building2, MapPin, Lock, Unlock, Clock, Calendar, 
  RotateCcw, ShieldCheck, History, Save, AlertTriangle, Check, Navigation, Info, 
  Layers, Sun, Moon, Sunrise, CalendarDays
} from 'lucide-react';

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function SettingsPage({ setActiveTab }) {
  const { settings, updateSettings, auditLogs } = useApp();

  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [targetLat, setTargetLat] = useState(settings.targetLat ?? -6.2088);
  const [targetLon, setTargetLon] = useState(settings.targetLon ?? 106.8456);
  const [geofenceRadius, setGeofenceRadius] = useState(settings.geofenceRadius || 50);
  
  // Work Mode & Shifts
  const [scheduleMode, setScheduleMode] = useState(settings.scheduleMode || 'REGULER');
  const [selectedShift, setSelectedShift] = useState(settings.selectedShift || 'SHIFT_1');
  const [shifts, setShifts] = useState(settings.shifts || {
    SHIFT_1: { name: 'Shift 1 (Pagi)', start: '07:00', end: '15:00' },
    SHIFT_2: { name: 'Shift 2 (Siang)', start: '15:00', end: '23:00' },
    SHIFT_3: { name: 'Shift 3 (Malam)', start: '23:00', end: '07:00' }
  });

  // Regular Hours
  const [checkInStart, setCheckInStart] = useState(settings.workHours?.checkInStart || '08:00');
  const [checkOutStart, setCheckOutStart] = useState(settings.workHours?.checkOutStart || '16:00');
  
  // Custom Work Days & Off-Days
  const [workDays, setWorkDays] = useState(settings.workDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  
  // Custom Per-Day Hours
  const [useCustomDailyHours, setUseCustomDailyHours] = useState(settings.useCustomDailyHours || false);
  const [dailyHours, setDailyHours] = useState(settings.dailyHours || {
    Senin: { start: '08:00', end: '16:00' },
    Selasa: { start: '08:00', end: '16:00' },
    Rabu: { start: '08:00', end: '16:00' },
    Kamis: { start: '08:00', end: '16:00' },
    Jumat: { start: '08:00', end: '14:00' },
    Sabtu: { start: '08:00', end: '12:00' },
    Minggu: { start: '08:00', end: '12:00' }
  });

  // Period & Duration
  const [startDate, setStartDate] = useState(settings.startDate || new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState(settings.durationMonths || 3);
  const [customEndDate, setCustomEndDate] = useState(settings.endDate || '2026-11-01');
  const [useCustomEndDate, setUseCustomEndDate] = useState(false);
  const [changeReason, setChangeReason] = useState('Konfigurasi Awal Pendaftaran Akun Magang UPB');

  const [isGrabbingGps, setIsGrabbingGps] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  const isFirstTimeOnboarding = !settings.isConfigured;

  const handleGrabGps = () => {
    if (settings.isLocked) {
      alert('LOKASI TERKUNCI: Koordinat kantor tidak dapat diubah setelah check-in pertama tercatat.');
      return;
    }

    setIsGrabbingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTargetLat(Number(pos.coords.latitude.toFixed(6)));
          setTargetLon(Number(pos.coords.longitude.toFixed(6)));
          setIsGrabbingGps(false);
        },
        (err) => {
          console.error("GPS Error:", err);
          if (err.message?.includes('Only secure origins') || (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
            alert(
              '🔒 AKSES GPS OTOMATIS DIBATASI (HTTP IP)\n\nBrowser HP membatasi Geolocation otomatis hanya pada koneksi HTTPS (Vercel / Ngrok) atau localhost.\n\nTips: Anda dapat langsung memasukkan angka Latitude & Longitude kantor Anda secara manual pada kolom input di bawah ini!'
            );
          } else {
            alert('Gagal mengambil koordinat lokasi: ' + err.message);
          }
          setIsGrabbingGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Browser tidak mendukung Geolocation.');
      setIsGrabbingGps(false);
    }
  };

  const handleToggleDay = (day) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleShiftTimeChange = (shiftKey, field, val) => {
    setShifts((prev) => ({
      ...prev,
      [shiftKey]: {
        ...prev[shiftKey],
        [field]: val
      }
    }));
  };

  const handleDailyHourChange = (day, field, val) => {
    setDailyHours((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { start: '08:00', end: '16:00' }),
        [field]: val
      }
    }));
  };

  const computeEndDate = (start, months) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + Number(months));
    return d.toISOString().split('T')[0];
  };

  const computedEnd = useCustomEndDate ? customEndDate : computeEndDate(startDate, durationMonths);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      alert('Mohon isi nama perusahaan / instansi magang Anda.');
      return;
    }

    if (workDays.length === 0) {
      alert('Mohon pilih setidaknya 1 hari kerja.');
      return;
    }

    updateSettings(
      {
        companyName,
        targetLat: Number(targetLat),
        targetLon: Number(targetLon),
        geofenceRadius: Number(geofenceRadius),
        scheduleMode,
        selectedShift,
        shifts,
        workHours: {
          checkInStart,
          checkOutStart
        },
        workDays,
        useCustomDailyHours,
        dailyHours,
        startDate,
        durationMonths: Number(durationMonths),
        endDate: computedEnd
      },
      changeReason
    );

    setSavedAlert(true);
    
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });

    setTimeout(() => {
      setSavedAlert(false);
      if (setActiveTab) {
        setActiveTab('dashboard');
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Onboarding Welcome Hero Banner */}
      {isFirstTimeOnboarding && (
        <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20 space-y-3 animate-fade-in border border-blue-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-bold shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Langkah Awal Pendaftaran
              </span>
              <h2 className="text-xl font-black">Selamat Datang di E-Presensi Magang UPB!</h2>
            </div>
          </div>
          <p className="text-xs text-blue-50 leading-relaxed font-medium">
            Akun Anda baru saja terdaftar. Mohon lengkapi **Konfigurasi Instansi Magang** Anda di bawah ini (Nama Perusahaan, Koordinat GPS Kantor, Schedule Mode & Hari Kerja) untuk mengaktifkan seluruh fitur Presensi Kamera & Daily Logbook.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
          KONFIGURASI INSTANSI
        </h1>
        <p className="text-xs text-slate-500 font-medium">Pengaturan Lokasi Kantor, Mode Shift, Custom Hari Libur & Jam Kerja</p>
      </div>

      {/* Lock Status Alert Banner */}
      {!isFirstTimeOnboarding && (
        <div
          className={`p-4 rounded-3xl border flex flex-wrap items-center justify-between shadow-xs gap-3 ${
            settings.isLocked
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-xs border border-slate-200">
              {settings.isLocked ? (
                <Lock className="w-5 h-5 text-amber-600" />
              ) : (
                <Unlock className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold block text-sm">
                {settings.isLocked ? 'STATUS: KOORDINAT & TANGGAL MULAI TERKUNCI' : 'STATUS: DAPAT DIEDIT'}
              </span>
              <p className="text-xs text-slate-600 leading-tight">
                {settings.isLocked
                  ? 'Check-in pertama telah tercatat. Koordinat instansi & tanggal mulai magang permanen terkunci demi keamanan data.'
                  : 'Belum ada check-in. Anda bebas mengatur koordinat dan tanggal mulai.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Saved Notification */}
      {savedAlert && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Konfigurasi Instansi Berhasil Disimpan! Mengalihkan ke Dashboard...</span>
        </div>
      )}

      {/* Grid Layout: Desktop 2-Column, Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          
          {/* Section 1: Perusahaan Profile */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-blue-500" />
              Profil Perusahaan / Instansi Magang
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Instansi / Perusahaan *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: PT Telkom Indonesia Tbk / BMKG / Instansi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
              />
            </div>
          </div>

          {/* Section 2: Mode Kerja & Shift Selection (NEW FEATURE) */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-amber-500" />
              Mode Kerja (Reguler vs Shift 1, 2, 3)
            </h2>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScheduleMode('REGULER')}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  scheduleMode === 'REGULER'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-black flex items-center gap-1.5">
                  💼 Jam Reguler (Non-Shift)
                </span>
                <span className={`text-[10px] ${scheduleMode === 'REGULER' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Jam masuk & pulang tetap harian
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode('SHIFT')}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  scheduleMode === 'SHIFT'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-black flex items-center gap-1.5">
                  🔄 Mode Shift (1, 2, 3)
                </span>
                <span className={`text-[10px] ${scheduleMode === 'SHIFT' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Sistem shift bergantian
                </span>
              </button>
            </div>

            {/* Shift Inputs & Active Shift Selection */}
            {scheduleMode === 'SHIFT' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                <label className="block text-xs font-bold text-amber-900">
                  Pilih Shift Aktif Mahasiswa & Input Jam Manual:
                </label>

                {/* Shift Selector Radio Pills */}
                <div className="grid grid-cols-3 gap-2">
                  {['SHIFT_1', 'SHIFT_2', 'SHIFT_3'].map((sKey) => {
                    const isSelected = selectedShift === sKey;
                    return (
                      <button
                        key={sKey}
                        type="button"
                        onClick={() => setSelectedShift(sKey)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                            : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {shifts[sKey]?.name || sKey}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Time Editors for Shift 1, Shift 2, Shift 3 */}
                <div className="space-y-3 pt-2 border-t border-amber-200/60 font-mono text-xs">
                  {['SHIFT_1', 'SHIFT_2', 'SHIFT_3'].map((sKey) => (
                    <div key={sKey} className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                      <span className="font-bold text-slate-900 block font-sans">
                        {shifts[sKey]?.name}:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Jam Masuk</label>
                          <input
                            type="time"
                            value={shifts[sKey]?.start || '08:00'}
                            onChange={(e) => handleShiftTimeChange(sKey, 'start', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Jam Pulang</label>
                          <input
                            type="time"
                            value={shifts[sKey]?.end || '16:00'}
                            onChange={(e) => handleShiftTimeChange(sKey, 'end', e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Custom Hari Kerja & Custom Hari Libur (NEW FEATURE) */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Custom Hari Kerja & Custom Hari Libur
            </h2>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Hari Kerja Magang (Centang = Hari Kerja, Tidak Dicentang = Hari Libur) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_DAYS.map((day) => {
                  const isWorkDay = workDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`p-3 rounded-2xl border text-center text-xs font-bold transition flex items-center justify-between ${
                        isWorkDay
                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                          : 'bg-red-50 text-red-800 border-red-200 opacity-70'
                      }`}
                    >
                      <span>{day}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isWorkDay ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {isWorkDay ? 'KERJA' : 'LIBUR'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Target Coords & Geofence Radius */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Koordinat Target & Radius Geofence
              </h2>
              <button
                type="button"
                onClick={handleGrabGps}
                disabled={settings.isLocked || isGrabbingGps}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                  settings.isLocked
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs border border-amber-300'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isGrabbingGps ? 'animate-spin' : ''}`} />
                <span>{isGrabbingGps ? 'Mengambil...' : 'Ambil GPS Saat Ini'}</span>
              </button>
            </div>

            {/* Notice for HTTP IP Testing */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Catatan Uji Coba IP (HTTP):</strong> Browser HP membatasi Geolocation otomatis pada koneksi IP HTTP (`192.168.x.x`). Anda bisa **langsung mengetikkan angka Latitude & Longitude** kantor Anda secara manual pada dua kolom di bawah.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Latitude Target (Contoh: -6.2088)</label>
                <input
                  type="number"
                  step="any"
                  required
                  disabled={settings.isLocked}
                  value={targetLat}
                  onChange={(e) => setTargetLat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Longitude Target (Contoh: 106.8456)</label>
                <input
                  type="number"
                  step="any"
                  required
                  disabled={settings.isLocked}
                  value={targetLon}
                  onChange={(e) => setTargetLon(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Radius Geofence Izin Presensi (Meter, Default: 50m)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={10}
                  max={500}
                  required
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <span className="text-xs text-slate-500 font-mono font-bold">Meter</span>
              </div>
            </div>
          </div>

          {/* Section 5: Jam Kerja & Custom Jam Per Hari (NEW FEATURE) */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-blue-500" />
              Konfigurasi Jam Kerja (Reguler & Custom Per Hari)
            </h2>

            {/* Standard Regular Hours */}
            {scheduleMode === 'REGULER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Jam Masuk (Batas Normal)</label>
                  <input
                    type="time"
                    required
                    value={checkInStart}
                    onChange={(e) => setCheckInStart(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Jam Minimal Pulang</label>
                  <input
                    type="time"
                    required
                    value={checkOutStart}
                    onChange={(e) => setCheckOutStart(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                  />
                </div>
              </div>
            )}

            {/* Custom Per-Day Hours Toggle & Input Table */}
            {scheduleMode === 'REGULER' && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="customDailyHours"
                    checked={useCustomDailyHours}
                    onChange={(e) => setUseCustomDailyHours(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <label htmlFor="customDailyHours" className="text-xs font-bold text-slate-800">
                    Gunakan Custom Jam Per Hari (Misal: Senin-Kamis 08:00-16:00, Jumat 08:00-14:00)
                  </label>
                </div>

                {useCustomDailyHours && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 font-mono text-xs">
                    <span className="font-bold text-blue-900 block font-sans">
                      Input Manual Jam Kerja Spesifik Per Hari:
                    </span>
                    <div className="space-y-2">
                      {workDays.map((day) => (
                        <div key={day} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-blue-200">
                          <span className="w-20 font-bold text-slate-900 font-sans">{day}:</span>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={dailyHours[day]?.start || '08:00'}
                              onChange={(e) => handleDailyHourChange(day, 'start', e.target.value)}
                              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                            />
                            <span>s.d.</span>
                            <input
                              type="time"
                              value={dailyHours[day]?.end || '16:00'}
                              onChange={(e) => handleDailyHourChange(day, 'end', e.target.value)}
                              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Flexible Duration Picker */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              Durasi & Tanggal Period Magang
            </h2>

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-mono">Tanggal Mulai Magang</label>
              <input
                type="date"
                required
                disabled={settings.isLocked}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Durasi Magang</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDurationMonths(m);
                      setUseCustomEndDate(false);
                    }}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition ${
                      !useCustomEndDate && durationMonths === m
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m} Bulan
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="customEndDate"
                  checked={useCustomEndDate}
                  onChange={(e) => setUseCustomEndDate(e.target.checked)}
                  className="rounded accent-blue-500"
                />
                <label htmlFor="customEndDate" className="text-xs text-slate-700 font-medium">
                  Gunakan Custom Tanggal Selesai
                </label>
              </div>

              {useCustomEndDate && (
                <div className="mt-2 font-mono">
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-bold"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Target Tanggal Selesai:</span>
              <span className="font-bold text-blue-900 font-mono text-sm">{computedEnd}</span>
            </div>

            {!isFirstTimeOnboarding && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Alasan Perubahan (Untuk Duration Audit Log)
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Contoh: Perpanjangan masa magang 1 bulan..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-black text-sm shadow-lg shadow-blue-500/20 border border-amber-300 flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            <Save className="w-5 h-5 text-amber-300" />
            <span>
              {isFirstTimeOnboarding ? 'SIMPAN KONFIGURASI & AKTIFKAN PORTAL' : 'SIMPAN KONFIGURASI INSTANSI'}
            </span>
          </button>
        </form>

        {/* Sidebar: Duration Audit Logs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <History className="w-4 h-4 text-blue-500" />
              Duration Audit Logs (`duration_audit_logs`)
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Belum ada log riwayat perubahan durasi magang.
              </p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Waktu: {new Date(log.timestamp).toLocaleString('id-ID')}</span>
                      <span className="text-blue-600 font-bold">Oleh: {log.changedBy}</span>
                    </div>
                    <p className="text-slate-800 font-mono text-xs">
                      Tgl Lama: <span className="line-through text-slate-400">{log.oldDate}</span> → Tgl Baru: <span className="font-bold text-blue-600">{log.newDate}</span>
                    </p>
                    {log.reason && (
                      <p className="text-xs text-slate-600">Alasan: {log.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
