import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { calculateDistance, isWithinGeofence } from '../utils/haversine';
import { 
  Building2, Calendar, Clock, MapPin, CheckCircle, 
  XCircle, LogOut, ArrowRight, BookOpen, ShieldCheck 
} from 'lucide-react';

export function DashboardPage({ setActiveTab }) {
  const { currentUser, logout } = useAuth();
  const { settings, getTodayPresence, getTodayLogbook, presenceLogs } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentGps, setCurrentGps] = useState(null);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current GPS to show live geofence status card
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        (err) => console.log('Geolocation fetch info:', err.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const todayPresence = getTodayPresence();
  const todayLogbook = getTodayLogbook();

  // Progress Bar calculations
  const startDate = new Date(settings.startDate || '2026-08-01');
  const endDate = new Date(settings.endDate || '2026-11-01');
  const today = new Date();

  const totalTime = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsedTime = Math.max(0, Math.min(totalTime, today.getTime() - startDate.getTime()));
  
  const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Geofence status calculation
  let distanceToOffice = null;
  let inGeofence = false;
  if (currentGps && settings.targetLat && settings.targetLon) {
    distanceToOffice = calculateDistance(
      currentGps.lat,
      currentGps.lon,
      settings.targetLat,
      settings.targetLon
    );
    inGeofence = isWithinGeofence(distanceToOffice, settings.geofenceRadius || 50);
  }

  return (
    <div className="space-y-6">
      
      {/* Desktop & Mobile Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student Info & Progress */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Student Profile Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-xs"
              />
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  {currentUser?.name || 'Mahasiswa Magang'}
                </h2>
                <p className="text-xs text-blue-600 font-mono font-bold">
                  NIM: {currentUser?.studentId || '210101234'}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  {settings.companyName || 'BMKG Stasiun Meteorologi'}
                </p>
              </div>
            </div>
          </div>

          {/* Internship Progress Card */}
          <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 border border-blue-400/30 shadow-lg shadow-blue-500/20 rounded-3xl p-5 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-300" />
                Progres Magang ({progressPercent}%)
              </span>
              <span className="text-xs font-mono font-bold text-slate-950 bg-amber-400 px-3 py-1 rounded-full shadow-xs border border-amber-300">
                Sisa {remainingDays} Hari
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full bg-blue-950/40 rounded-full h-3.5 p-0.5 border border-white/30 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-blue-50 font-mono font-medium pt-1">
              <span>Mulai: {settings.startDate}</span>
              <span>Target: {settings.endDate}</span>
            </div>
          </div>

          {/* Quick Actions (Desktop Sidebar) */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Aksi Cepat Portal</h3>
            <button
              onClick={() => setActiveTab('presence')}
              className="w-full py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-blue-500/20 transition"
            >
              <span>Presensi Masuk / Pulang</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
            <button
              onClick={() => setActiveTab('logbook')}
              className="w-full py-3 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-between border border-blue-200 transition"
            >
              <span>Isi Daily Logbook</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </button>
          </div>

        </div>

        {/* Right Column: Presence Card, Logbook Banner, Recent Presences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Presence Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                  STATUS PRESENSI HARI INI
                </span>
                <div className="text-lg font-mono font-black text-blue-900 flex items-center gap-2 mt-0.5">
                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  {currentTime.toLocaleTimeString('id-ID')}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('presence')}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition transform active:scale-95 border border-amber-300"
              >
                <span>Buka Kamera Presensi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status Indicators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Check-In Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between space-y-2">
                <span className="text-xs text-slate-600 font-semibold">Jam Masuk Hari Ini</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-blue-900">
                    {todayPresence?.checkInTime || '--:--'}
                  </span>
                  {todayPresence?.checkInTime ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {todayPresence.checkInStatus}
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full border border-amber-300">
                      Belum Presensi
                    </span>
                  )}
                </div>
              </div>

              {/* Check-Out Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between space-y-2">
                <span className="text-xs text-slate-600 font-semibold">Jam Pulang Hari Ini</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-blue-900">
                    {todayPresence?.checkOutTime || '--:--'}
                  </span>
                  {todayPresence?.checkOutTime ? (
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full border border-blue-300 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                      Selesai
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2.5 py-1 rounded-full border border-slate-200">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live Geofence Distance Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Status Geofence Radius Kantor</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {distanceToOffice !== null
                      ? `Jarak GPS: ${distanceToOffice}m (Radius Maksimal: ${settings.geofenceRadius}m)`
                      : 'Mendeteksi Koordinat GPS...'}
                  </p>
                </div>
              </div>
              {distanceToOffice !== null && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    inGeofence
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}
                >
                  {inGeofence ? 'DALAM RADIUS' : 'LUAR RADIUS'}
                </span>
              )}
            </div>
          </div>

          {/* Daily Logbook Status Banner */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200 text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Logbook Hari Ini</h3>
                <p className="text-xs text-slate-500">
                  {todayLogbook ? 'Sudah Diisi & Tersimpan' : 'Wajib diisi sebelum Presensi Pulang'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('logbook')}
              className="px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 border border-blue-200 transition"
            >
              {todayLogbook ? 'Edit Logbook' : 'Isi Logbook Sekarang'}
            </button>
          </div>

          {/* Recent Presences */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Riwayat Presensi Terakhir
            </h3>
            {presenceLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Belum ada catatan presensi.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presenceLogs.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-blue-900 font-mono">{item.dateStr}</p>
                      <p className="text-[11px] text-slate-500">
                        Masuk: {item.checkInTime || '--'} | Pulang: {item.checkOutTime || '--'}
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 font-mono">
                      {item.checkInStatus}
                    </span>
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
