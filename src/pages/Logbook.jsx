import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CameraStream } from '../components/CameraStream';
import {
  BookOpen, CheckCircle2, AlertCircle, Save,
  Calendar, FileText, Target, HelpCircle, History,
  Camera, Image, Upload, Trash2, X, Eye
} from 'lucide-react';

export function LogbookPage() {
  const { getTodayLogbook, getTodayStr, saveLogbook, logbooks } = useApp();
  const fileInputRef = useRef(null);

  const todayStr = getTodayStr();
  const existingTodayLogbook = getTodayLogbook();

  const [achievements, setAchievements] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [progressPhoto, setProgressPhoto] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState(null);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeView, setActiveView] = useState('editor');

  useEffect(() => {
    if (existingTodayLogbook) {
      setAchievements(existingTodayLogbook.achievements || '');
      setObstacles(existingTodayLogbook.obstacles || '');
      setTomorrowPlan(existingTodayLogbook.tomorrowPlan || '');
      setProgressPhoto(existingTodayLogbook.progressPhoto || null);
    }
  }, [existingTodayLogbook]);

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const rawDataUrl = event.target?.result;
        if (!rawDataUrl) return;

        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width || 600;
            let height = img.height || 600;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = Math.floor(width);
            canvas.height = Math.floor(height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            setProgressPhoto(canvas.toDataURL('image/jpeg', 0.8));
          } catch (canvasErr) {
            setProgressPhoto(rawDataUrl);
          } finally {
            setIsUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        img.onerror = () => {
          setProgressPhoto(rawDataUrl);
          setIsUploadingPhoto(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };

        img.src = rawDataUrl;
      } catch (err) {
        setIsUploadingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert('Gagal membaca berkas foto.');
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

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
      progressPhoto,
      dateStr: todayStr
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-28">

      {/* Lightbox Photo Preview Modal */}
      {previewModalPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewModalPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 font-bold text-xs flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/20"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
            <img
              src={previewModalPhoto}
              alt="Foto Progress Logbook"
              className="max-h-[80vh] w-auto object-contain rounded-2xl border-2 border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Ambil Foto Progress Kegiatan
              </h3>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <CameraStream
                onCapture={(dataUrl) => {
                  setProgressPhoto(dataUrl);
                  setShowCameraModal(false);
                }}
                capturedPhoto={null}
                onResetPhoto={() => {}}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCameraModal(false)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </div>
      )}

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
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${activeView === 'editor'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Form Hari Ini
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${activeView === 'history'
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

            {/* Field 2: Optional Progress Photo / Documentation */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-2">
                  <Image className="w-4 h-4 text-sky-500" />
                  Foto Progress / Dokumentasi Kegiatan (Opsional)
                </label>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Tidak Wajib
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileUpload}
              />

              {progressPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-sky-300 bg-slate-900 group max-w-xs shadow-md">
                  <img
                    src={progressPhoto}
                    alt="Foto Progress Logbook"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewModalPhoto(progressPhoto)}
                      className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold flex items-center gap-1 shadow-md hover:bg-white"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgressPhoto(null)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1 shadow-md hover:bg-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-sky-300 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Foto Progress Terpasang</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Upload from HP File / Gallery */}
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 rounded-2xl text-xs text-slate-700 font-bold flex items-center justify-center gap-2.5 transition active:scale-98"
                  >
                    <Upload className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{isUploadingPhoto ? 'Memproses Berkas...' : 'Unggah Foto dari HP / File'}</span>
                  </button>

                  {/* Option B: Direct Live Camera Snapshot */}
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-2xl text-xs text-slate-700 font-bold flex items-center justify-center gap-2.5 transition active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Ambil Foto via Kamera Live</span>
                  </button>
                </div>
              )}
            </div>

            {/* Field 3: Obstacles */}
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

            {/* Field 4: Tomorrow's Plan */}
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

                  {log.progressPhoto && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-sky-700 font-bold uppercase mb-1 flex items-center gap-1">
                        <Image className="w-3 h-3 text-sky-500" />
                        Foto Progress:
                      </p>
                      <div
                        onClick={() => setPreviewModalPhoto(log.progressPhoto)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-xs bg-slate-900"
                      >
                        <img src={log.progressPhoto} alt="Progress" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
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

