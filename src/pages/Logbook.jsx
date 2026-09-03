import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, CheckCircle2, AlertCircle, Save, 
  Calendar, FileText, Target, HelpCircle, History 
} from 'lucide-react';

export function LogbookPage() {
  const { getTodayLogbook, getTodayStr, saveLogbook, logbooks } = useApp();

  const todayStr = getTodayStr();
  const existingTodayLogbook = getTodayLogbook();

  const [achievements, setAchievements] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeView, setActiveView] = useState('editor');

  useEffect(() => {
    if (existingTodayLogbook) {
      setAchievements(existingTodayLogbook.achievements || '');
      setObstacles(existingTodayLogbook.obstacles || '');
      setTomorrowPlan(existingTodayLogbook.tomorrowPlan || '');
    }
  }, [existingTodayLogbook]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!achievements.trim()) {
      alert('Mohon isi kegiatan dan pencapaian hari ini terlebih dahulu.');
      return;
    }

    saveLogbook({
      achievements,
      obstacles,
      tomorrowPlan,
      dateStr: todayStr
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
            DAILY LOGBOOK
          </h1>
          <p className="text-xs text-slate-500 font-medium">Catatan Kegiatan & Pencapaian Harian Magang</p>
        </div>

        {/* Mobile View Switcher (Hidden on Desktop) */}
        <div className="md:hidden flex bg-slate-200 p-1 rounded-2xl border border-slate-300">
          <button
            onClick={() => setActiveView('editor')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              activeView === 'editor'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form Hari Ini
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              activeView === 'history'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat ({logbooks.length})
          </button>
        </div>
      </div>

      {/* Grid Layout: Desktop Side-by-Side, Mobile Tab Switching */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Form Editor Column */}
        <div className={`md:col-span-2 space-y-4 ${activeView === 'editor' ? 'block' : 'hidden md:block'}`}>
          
          {/* Status Badge */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">TANGGAL LOGBOOK HARI INI</span>
                <p className="text-sm font-bold text-blue-900 font-mono">{todayStr}</p>
              </div>
            </div>
            {existingTodayLogbook ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tersimpan
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Draft Belum Disimpan
              </span>
            )}
          </div>

          {/* Save Success Alert */}
          {saveSuccess && (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Logbook Hari Ini Berhasil Disimpan! Anda sekarang dapat melakukan Presensi Pulang.</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Field 1: Achievements */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Pencapaian & Kegiatan Utama Hari Ini *
              </label>
              <textarea
                required
                rows={4}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Jelaskan secara spesifik tugas, fitur, modul, atau analisis yang Anda selesaikan hari ini..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition"
              />
            </div>

            {/* Field 2: Obstacles */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                Kendala / Masalah yang Dihadapi (Opsional)
              </label>
              <textarea
                rows={2}
                value={obstacles}
                onChange={(e) => setObstacles(e.target.value)}
                placeholder="Tuliskan jika ada kendala teknis, koordinasi, atau bug yang ditemui..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition"
              />
            </div>

            {/* Field 3: Tomorrow's Plan */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Rencana Tugas Besok (Opsional)
              </label>
              <textarea
                rows={2}
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="Target atau prioritas kerja yang akan dikerjakan esok hari..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none leading-relaxed transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-black text-sm shadow-lg shadow-blue-500/20 border border-amber-300 flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <Save className="w-5 h-5 text-amber-300" />
              <span>SIMPAN DAILY LOGBOOK</span>
            </button>
          </form>

        </div>

        {/* History Column */}
        <div className={`md:col-span-1 space-y-4 ${activeView === 'history' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <History className="w-4 h-4 text-blue-500" />
            <span>Arsip Logbook ({logbooks.length})</span>
          </div>

          {logbooks.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl text-slate-500 text-xs">
              Belum ada riwayat logbook tersimpan.
            </div>
          ) : (
            <div className="space-y-3">
              {logbooks.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 shadow-xs rounded-3xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {log.dateStr}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Pencapaian:</p>
                    <p className="text-xs text-slate-900 leading-relaxed font-medium">{log.achievements}</p>
                  </div>

                  {log.obstacles && (
                    <div>
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Kendala:</p>
                      <p className="text-xs text-slate-700">{log.obstacles}</p>
                    </div>
                  )}

                  {log.tomorrowPlan && (
                    <div>
                      <p className="text-[10px] text-blue-700 font-bold uppercase">Rencana Besok:</p>
                      <p className="text-xs text-slate-700">{log.tomorrowPlan}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
