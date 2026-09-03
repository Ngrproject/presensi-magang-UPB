import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { 
  Building2, MapPin, Lock, Unlock, Clock, Calendar, 
  RotateCcw, ShieldCheck, History, Save, AlertTriangle, Check, Navigation, Info 
} from 'lucide-react';

export function SettingsPage({ setActiveTab }) {
  const { settings, updateSettings, auditLogs } = useApp();

  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [targetLat, setTargetLat] = useState(settings.targetLat ?? -6.2088);
  const [targetLon, setTargetLon] = useState(settings.targetLon ?? 106.8456);
  const [geofenceRadius, setGeofenceRadius] = useState(settings.geofenceRadius || 50);
  const [checkInStart, setCheckInStart] = useState(settings.workHours?.checkInStart || '08:00');
  const [checkOutStart, setCheckOutStart] = useState(settings.workHours?.checkOutStart || '16:00');
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
              '🔒 AKSES GPS OTOMATIS DIBATASI (HTTP IP)\n\nBrowser HP membatasi tombol GPS otomatis hanya pada koneksi HTTPS (Vercel / Ngrok) atau localhost.\n\nTips: Anda dapat langsung memasukkan angka Latitude & Longitude kantor Anda secara manual pada kolom input di bawah ini!'
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

    updateSettings(
      {
        companyName,
        targetLat: Number(targetLat),
        targetLon: Number(targetLon),
        geofenceRadius: Number(geofenceRadius),
        workHours: {
          checkInStart,
          checkOutStart
        },
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
            Akun Anda baru saja terdaftar. Mohon lengkapi **Konfigurasi Instansi Magang** Anda di bawah ini (Nama Perusahaan, Koordinat GPS Kantor, Radius Geofence, & Tanggal Period) untuk mengaktifkan seluruh fitur Presensi Kamera & Daily Logbook.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
          KONFIGURASI INSTANSI
        </h1>
        <p className="text-xs text-slate-500 font-medium">Pengaturan Lokasi Kantor, Radius Geofence & Period Magang</p>
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
          
          {/* Section 1: Company Profile */}
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

          {/* Section 2: Target Coords & Geofence Radius */}
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

          {/* Section 3: Work Hours */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-blue-500" />
              Jam Kerja Magang
            </h2>

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
          </div>

          {/* Section 4: Flexible Duration Picker */}
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
