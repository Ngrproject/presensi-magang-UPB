import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, 
  MapPin, Camera, BookOpen, ArrowRight, 
  Stethoscope, Mail, Flag, Building2, UserX, ShieldCheck, FileText, Target
} from 'lucide-react';

export function DashboardPage({ setActiveTab }) {
  const { currentUser } = useAuth();
  const { settings, presenceLogs, logbooks, getTodayPresence, getTodayLogbook, getYesterdayLogbook } = useApp();

  const todayPresence = getTodayPresence();
  const todayLogbook = getTodayLogbook();
  const yesterdayLogbook = getYesterdayLogbook();
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Progress Days safely
  const startDateStr = settings?.startDate || new Date().toISOString().split('T')[0];
  const endDateStr = settings?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const parsedStart = new Date(startDateStr);
  const parsedEnd = new Date(endDateStr);
  const now = new Date();

  const start = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const end = isNaN(parsedEnd.getTime()) ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : parsedEnd;

  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  // Compute Statistics Breakdown safely
  const logs = Array.isArray(presenceLogs) ? presenceLogs : [];
  const hadirCount = logs.filter((p) => p && !p.isLeave && (p.checkInStatus === 'TEPAT WAKTU' || p.checkInStatus === 'TERLAMBAT')).length;
  const sakitCount = logs.filter((p) => p && p.isLeave && p.leaveType === 'SAKIT').length;
  const izinCount = logs.filter((p) => p && p.isLeave && p.leaveType === 'IZIN').length;
  const liburCount = logs.filter((p) => p && p.isLeave && (p.leaveType === 'LIBUR NASIONAL' || p.leaveType === 'LIBUR INSTANSI')).length;
  
  // Calculate Alpha Count safely
  let alphaCount = 0;
  const workDaysSet = new Set(settings?.workDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  try {
    let curr = new Date(start);
    let stepCount = 0;
    while (curr < now && stepCount < 365) {
      stepCount++;
      const currTime = curr.getTime();
      if (isNaN(currTime)) break;
      const currStr = curr.toISOString().split('T')[0];
      const dayName = dayNames[curr.getDay()];
      if (currStr !== todayStr && workDaysSet.has(dayName)) {
        const rec = logs.find((p) => p && p.dateStr === currStr);
        if (!rec) {
          alphaCount++;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
  } catch (err) {
    console.error("Alpha count calculation safely handled:", err);
  }

  const getStatusBadge = (log) => {
    if (!log) return null;
    if (log.isLeave) {
      switch (log.leaveType) {
        case 'SAKIT':
          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">SAKIT</span>;
        case 'IZIN':
          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">IZIN</span>;
        case 'LIBUR NASIONAL':
          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">LIBUR NASIONAL</span>;
        case 'LIBUR INSTANSI':
          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">LIBUR INSTANSI</span>;
        default:
          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">IZIN</span>;
      }
    }
    if (log.checkInStatus === 'TEPAT WAKTU') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">TEPAT WAKTU</span>;
    }
    if (log.checkInStatus === 'TERLAMBAT') {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">TERLAMBAT</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 3-Column Top Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Student Profile */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex items-center gap-4">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
            alt={currentUser?.name || 'Mahasiswa'}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-xs shrink-0"
          />
          <div className="overflow-hidden">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {currentUser?.name || 'Mahasiswa UPB'}
            </h2>
            <p className="text-xs font-mono font-bold text-blue-600">
              NIM: {currentUser?.studentId || '210101234'}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {settings?.companyName || 'Belum dikonfigurasi'}
            </p>
          </div>
        </div>

        {/* Card 2: Bright Blue Internship Progress */}
        <div className="bg-gradient-to-tr from-blue-600 via-sky-500 to-blue-500 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between border border-sky-300/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-300" />
              Progres Magang ({progressPercent}%)
            </span>
            <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow-xs">
              Sisa {daysLeft} Hari
            </span>
          </div>

          <div className="my-3">
            <div className="w-full bg-blue-950/40 rounded-full h-3 p-0.5 border border-white/20">
              <div
                className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-blue-100">
            <span>Mulai: {settings?.startDate || '-'}</span>
            <span>Target: {settings?.endDate || '-'}</span>
          </div>
        </div>

        {/* Card 3: Quick Action Navigation */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col justify-between space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Aksi Cepat Portal
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('presence')}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs rounded-2xl flex flex-col items-center gap-1.5 transition text-center"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Presensi Hadir</span>
            </button>
            <button
              onClick={() => setActiveTab('presence')}
              className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs rounded-2xl flex flex-col items-center gap-1.5 transition text-center"
            >
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Form Izin</span>
            </button>
          </div>
        </div>

      </div>

      {/* STATISTIK KEHADIRAN REKAP MAGANG */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Rekapitulasi Kehadiran Magang
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <span className="text-xs font-semibold text-emerald-700 block">Hadir</span>
            <span className="text-xl font-black text-emerald-800 font-mono">{hadirCount}</span>
            <span className="text-[10px] text-emerald-600 block">Hari</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-center space-y-1">
            <span className="text-xs font-semibold text-red-700 block">Sakit</span>
            <span className="text-xl font-black text-red-800 font-mono">{sakitCount}</span>
            <span className="text-[10px] text-red-600 block">Hari</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
            <span className="text-xs font-semibold text-amber-700 block">Izin</span>
            <span className="text-xl font-black text-amber-800 font-mono">{izinCount}</span>
            <span className="text-[10px] text-amber-600 block">Hari</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-1">
            <span className="text-xs font-semibold text-sky-700 block">Libur</span>
            <span className="text-xl font-black text-sky-800 font-mono">{liburCount}</span>
            <span className="text-[10px] text-sky-600 block">Hari</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-rose-800 block">Alpha</span>
            <span className="text-xl font-black text-rose-900 font-mono">{alphaCount}</span>
            <span className="text-[10px] text-rose-700 block">Hari (Tanpa Ket.)</span>
          </div>
        </div>
      </div>

      {/* TODAY'S STATUS & YESTERDAY/TODAY LOGBOOK SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Attendance Card */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Status Presensi Hari Ini
            </h3>
            {getStatusBadge(todayPresence)}
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Jam Masuk Hari Ini</span>
              <span className="text-lg font-mono font-bold text-blue-900 block">
                {todayPresence?.checkInTime || '-- : --'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Jam Pulang Hari Ini</span>
              <span className="text-lg font-mono font-bold text-blue-900 block">
                {todayPresence?.checkOutTime || '-- : --'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('presence')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 border border-amber-300"
          >
            <Camera className="w-4 h-4" />
            <span>Buka Kamera Presensi / Form Izin →</span>
          </button>
        </div>

        {/* Yesterday & Today Summary Card (READ-ONLY SUMMARY) */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Ringkasan Logbook (Kemarin & Target Hari Ini)
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">
              Ringkasan Info
            </span>
          </div>

          <div className="space-y-3 my-1">
            {/* Capaian Kemarin */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Capaian / Kegiatan Kemarin:
              </span>
              <p className="text-xs text-slate-800 font-medium line-clamp-2">
                {yesterdayLogbook?.achievements || (logbooks.length > 0 ? logbooks[0]?.achievements : 'Belum ada ringkasan kegiatan logbook kemarin.')}
              </p>
            </div>

            {/* Target / Tujuan Hari Ini (Diambil dari Rencana Tugas Besok Logbook Kemarin) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                Tujuan / Target Hari Ini (Dari Rencana Kemarin):
              </span>
              <p className="text-xs text-slate-900 font-medium line-clamp-2">
                {yesterdayLogbook?.tomorrowPlan || 'Belum ada rencana tugas besok yang ditulis pada logbook kemarin.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('logbook')}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Kelola Daily Logbook Lengkap →</span>
          </button>
        </div>

      </div>

      {/* RECENT ATTENDANCE HISTORY LIST */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-blue-900 border-b border-slate-100 pb-3">
          Riwayat Presensi & Izin Terakhir
        </h3>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Belum ada catatan presensi atau izin.</p>
        ) : (
          <div className="space-y-2.5">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log?.id || Math.random()}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-slate-900 block">{log?.dateStr}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {log?.isLeave
                      ? `Keterangan: ${log?.reason || log?.leaveType}`
                      : `Masuk: ${log?.checkInTime || '--:--'} | Pulang: ${log?.checkOutTime || '--:--'}`}
                  </span>
                </div>
                <div>{getStatusBadge(log)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
