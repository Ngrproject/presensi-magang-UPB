import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { calculateDistance } from '../utils/haversine';
import { CameraStream } from '../components/CameraStream';
import { 
  Camera, MapPin, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, LogOut, CheckSquare, Building2, BookOpen, 
  FileText, Calendar, Upload, Stethoscope, Mail, Flag, ShieldCheck 
} from 'lucide-react';

const LEAVE_TYPES = [
  { id: 'SAKIT', label: 'Sakit', icon: Stethoscope, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', activeBg: 'bg-red-600 text-white' },
  { id: 'IZIN', label: 'Izin Kepentingan', icon: Mail, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', activeBg: 'bg-amber-600 text-white' },
  { id: 'LIBUR NASIONAL', label: 'Libur Nasional', icon: Flag, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', activeBg: 'bg-emerald-600 text-white' },
  { id: 'LIBUR INSTANSI', label: 'Libur Instansi', icon: Building2, color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100', activeBg: 'bg-sky-600 text-white' }
];

export function PresencePage({ setActiveTab }) {
  const { settings, getTodayPresence, getTodayLogbook, getTodayRequiredCheckOutStr, addCheckIn, addCheckOut, addLeaveRecord } = useApp();
  const proofInputRef = useRef(null);

  const [activeSubMode, setActiveSubMode] = useState('hadir'); // 'hadir' | 'izin'
  
  // Presence Hadir States
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [inGeofence, setInGeofence] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  
  // Leave Form States
  const [selectedLeaveType, setSelectedLeaveType] = useState('SAKIT');
  const [leaveReason, setLeaveReason] = useState('');
  const [proofPhoto, setProofPhoto] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [guardrailAlert, setGuardrailAlert] = useState(null);
  const [earlyCheckoutAlert, setEarlyCheckoutAlert] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const todayPresence = getTodayPresence();
  const todayLogbook = getTodayLogbook();

  const isCheckedIn = Boolean(todayPresence?.checkInTime);
  const isCheckedOut = Boolean(todayPresence?.checkOutTime);
  const isLeaveRecord = Boolean(todayPresence?.isLeave);

  // Dynamically resolve check-out time requirement
  const reqCheckOutTimeStr = getTodayRequiredCheckOutStr();
  const parts = reqCheckOutTimeStr.split(':');
  const reqHour = parseInt(parts[0], 10) || 16;
  const reqMin = parseInt(parts[1], 10) || 0;

  const now = new Date();
  const nowMinTotal = now.getHours() * 60 + now.getMinutes();
  const reqMinTotal = reqHour * 60 + reqMin;
  const isEarlyCheckoutTime = nowMinTotal < reqMinTotal;

  // Fallback Location Helper
  const useFallbackLocation = () => {
    const lat = settings.targetLat;
    const lon = settings.targetLon;
    setUserLocation({ lat, lon });
    const dist = calculateDistance(lat, lon, settings.targetLat, settings.targetLon);
    setDistance(dist);
    setInGeofence(true);
  };

  // Real-time Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung layanan Geolocation.');
      useFallbackLocation();
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        setLocationError(null);

        const dist = calculateDistance(
          lat,
          lon,
          settings.targetLat,
          settings.targetLon
        );
        setDistance(dist);
        setInGeofence(dist <= settings.geofenceRadius);
      },
      (error) => {
        let msg = 'Gagal mengambil lokasi GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi GPS ditolak oleh pengguna.';
        } else if (error.message && error.message.includes('Only secure origins are allowed')) {
          msg = 'Fitur GPS HP dibatasi pada HTTP IP lokal. Silakan buka via Vercel HTTPS resmi atau gunakan simulasi target.';
        }
        setLocationError(msg);
        useFallbackLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [settings.targetLat, settings.targetLon, settings.geofenceRadius]);

  const handlePhotoCaptured = (dataUrl) => {
    setCapturedPhoto(dataUrl);
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const rawDataUrl = event.target?.result;
        if (!rawDataUrl) return;

        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            let width = img.width || 400;
            let height = img.height || 400;

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

            setProofPhoto(canvas.toDataURL('image/jpeg', 0.8));
          } catch (canvasErr) {
            setProofPhoto(rawDataUrl);
          } finally {
            setIsUploadingProof(false);
            if (proofInputRef.current) proofInputRef.current.value = '';
          }
        };

        img.onerror = () => {
          setProofPhoto(rawDataUrl);
          setIsUploadingProof(false);
          if (proofInputRef.current) proofInputRef.current.value = '';
        };

        img.src = rawDataUrl;
      } catch (err) {
        setIsUploadingProof(false);
        if (proofInputRef.current) proofInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert('Gagal membaca berkas bukti.');
      setIsUploadingProof(false);
      if (proofInputRef.current) proofInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitPresence = async () => {
    if (!capturedPhoto) {
      alert('Foto selfie wajib diambil terlebih dahulu!');
      return;
    }

    setSubmitting(true);
    setGuardrailAlert(null);
    setEarlyCheckoutAlert(null);

    try {
      if (!isCheckedIn) {
        await addCheckIn({
          photoDataUrl: capturedPhoto,
          userLat: userLocation?.lat || settings.targetLat,
          userLon: userLocation?.lon || settings.targetLon,
          distance: distance ?? 0
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setSuccessMsg('Presensi MASUK Berhasil Dicatat!');
        setCapturedPhoto(null);
      } else {
        if (isEarlyCheckoutTime) {
          setEarlyCheckoutAlert(`BELUM WAKTU PULANG: Presensi Pulang hanya dapat dilakukan setelah jam kerja selesai (Pukul ${reqCheckOutTimeStr} WIB). Jam saat ini: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.`);
          setSubmitting(false);
          return;
        }

        await addCheckOut({
          photoDataUrl: capturedPhoto,
          userLat: userLocation?.lat || settings.targetLat,
          userLon: userLocation?.lon || settings.targetLon,
          distance: distance ?? 0
        });

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });

        setSuccessMsg('Presensi PULANG Berhasil Dicatat!');
        setCapturedPhoto(null);
      }
    } catch (err) {
      if (err.message === 'GUARDRAIL_LOGBOOK_REQUIRED') {
        setGuardrailAlert(
          'GUARDRAIL KEAMANAN: Anda WAJIB mengisi & menyimpan Daily Logbook hari ini terlebih dahulu sebelum melakukan Presensi Pulang!'
        );
      } else if (err.message && err.message.startsWith('GUARDRAIL_EARLY_CHECKOUT')) {
        const reqTime = err.message.split(':')[1] || reqCheckOutTimeStr;
        setEarlyCheckoutAlert(
          `BELUM WAKTU PULANG: Presensi Pulang hanya dapat dilakukan setelah jam kerja selesai (Pukul ${reqTime} WIB).`
        );
      } else {
        alert(err.message || 'Gagal mencatat presensi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();

    if (!leaveReason.trim()) {
      alert('Mohon isi alasan / keterangan ketidakhadiran Anda.');
      return;
    }

    setSubmitting(true);
    try {
      await addLeaveRecord({
        leaveType: selectedLeaveType,
        reason: leaveReason,
        proofDataUrl: proofPhoto
      });

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Status ${selectedLeaveType} Berhasil Diisi & Tersimpan!`);
      setLeaveReason('');
      setProofPhoto(null);
    } catch (err) {
      alert('Gagal mengirim pengajuan izin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden File Picker for Proof Attachment */}
      <input
        type="file"
        ref={proofInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleProofFileUpload}
      />

      {/* Header & Submode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
            {activeSubMode === 'izin' ? 'FORM PENGAJUAN IZIN / KETIDAKHADIRAN' : isCheckedIn && !isCheckedOut ? 'PRESENSI PULANG' : 'PRESENSI MASUK'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Portal Verifikasi Kehadiran, Selfie, Geofence GPS & Pengajuan Ketidakhadiran Mahasiswa UPB
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl border border-slate-300 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubMode('hadir')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubMode === 'hadir'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-300/60'
            }`}
          >
            📸 Presensi Hadir (Selfie)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubMode('izin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubMode === 'izin'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-300/60'
            }`}
          >
            📝 Form Izin / Libur
          </button>
        </div>
      </div>

      {/* Success Notice */}
      {successMsg && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs underline text-emerald-700 font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* RENDER FORM PENGAJUAN IZIN */}
      {activeSubMode === 'izin' ? (
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Formulir Ketidakhadiran (Sakit / Izin / Libur)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Catatan izin akan disimpan langsung ke portal data presensi mahasiswa
            </p>
          </div>

          <form onSubmit={handleSubmitLeave} className="space-y-6">
            {/* Category Select Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Kategori Ketidakhadiran *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedLeaveType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedLeaveType(type.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col items-center text-center gap-2 transition ${
                        isSelected ? type.activeBg + ' border-transparent shadow-md' : type.color
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leave Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan / Keterangan Lengkap *
              </label>
              <textarea
                required
                rows={3}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder={
                  selectedLeaveType === 'SAKIT'
                    ? 'Contoh: Demam & flu tinggi. Istirahat di rumah sesuai anjuran dokter.'
                    : selectedLeaveType === 'IZIN'
                    ? 'Contoh: Menghadiri kegiatan akademik / urusan keluarga mendesak.'
                    : selectedLeaveType === 'LIBUR NASIONAL'
                    ? 'Contoh: Hari Libur Nasional Resmi (Tanggal Merah Kalender).'
                    : 'Contoh: Kantor instansi magang sedang libur internal / maintenance.'
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            {/* Proof Photo Attachment */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Lampiran Foto / Surat Bukti (Opsional)
              </label>
              
              {proofPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-300 w-48 h-32 bg-slate-100">
                  <img src={proofPhoto} alt="Bukti Izin" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofPhoto(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold shadow-md"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploadingProof}
                  onClick={() => proofInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 rounded-2xl text-xs text-slate-600 font-bold flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>{isUploadingProof ? 'Memproses Berkas...' : 'Unggah Surat Dokter / Foto Bukti (HP)'}</span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !leaveReason.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-amber-500/20 border border-amber-300 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{submitting ? 'Memproses Pengajuan...' : `SUBMIT PENGAJUAN ${selectedLeaveType}`}</span>
            </button>
          </form>
        </div>
      ) : (
        /* RENDER FORM PRESENSI HADIR SELFIE */
        <>
          {/* EARLY CHECKOUT GUARDRAIL ALERT */}
          {earlyCheckoutAlert && (
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs space-y-2 shadow-md animate-bounce-short">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-bold text-sm">BELUM WAKTU PRESENSI PULANG</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {earlyCheckoutAlert}
              </p>
              <div className="text-[11px] text-amber-800 bg-amber-100 p-2.5 rounded-xl border border-amber-300 font-semibold">
                ⏰ Jam Kerja Pulang Hari Ini: <strong className="text-amber-900 font-mono">{reqCheckOutTimeStr} WIB</strong>
              </div>
            </div>
          )}

          {/* LOGBOOK GUARDRAIL ALERT */}
          {guardrailAlert && (
            <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-300 text-red-800 text-xs space-y-3 shadow-md animate-bounce-short">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold text-sm">AKSES PRESENSI PULANG TERKUNCI!</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {guardrailAlert}
              </p>
              <button
                onClick={() => setActiveTab && setActiveTab('logbook')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs border border-red-400 flex items-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Isi Daily Logbook Sekarang →</span>
              </button>
            </div>
          )}

          {/* Layout Grid: Desktop 2 Columns Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Direct Live Embedded Camera Stream */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Verifikasi Wajah (Live Camera)
                </h2>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Anti-Fraud Selfie
                </span>
              </div>

              {/* Direct Embedded Live Camera Stream */}
              <div className="w-full flex justify-center py-2">
                <CameraStream
                  onCapture={handlePhotoCaptured}
                  capturedPhoto={capturedPhoto}
                  onResetPhoto={() => setCapturedPhoto(null)}
                />
              </div>
            </div>

            {/* Right Card: GPS Geofence & Submission Status */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Validasi Geofencing GPS
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                      inGeofence
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {inGeofence ? 'DALAM RADIUS KANTOR' : 'DILUAR RADIUS KANTOR'}
                  </span>
                </div>

                {/* Instansi Target Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      Target Instansi Magang:
                    </span>
                    <span className="font-bold text-blue-900">{settings.companyName || 'Belum Dikonfigurasi'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Jarak Real-Time ke Kantor:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {distance !== null ? `${distance} Meter` : 'Menghitung...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Batas Geofence (Max Radius):</span>
                    <span className="font-mono font-bold text-blue-600">{settings.geofenceRadius} Meter</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                    <span className="text-slate-500 font-semibold">Jadwal / Shift Kerja:</span>
                    <span className="font-bold text-blue-800 font-mono">
                      {settings.scheduleMode === 'SHIFT' 
                        ? (settings.shifts?.[settings.selectedShift]?.name || 'Shift') 
                        : 'Reguler'}
                    </span>
                  </div>
                </div>

                {/* Location Warning / Info Notice */}
                {locationError && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{locationError}</span>
                  </div>
                )}

                {/* Early Checkout Warning Banner */}
                {isCheckedIn && !isCheckedOut && isEarlyCheckoutTime && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Belum Waktu Pulang:</strong> Presensi Pulang aktif setelah Pukul <strong>{reqCheckOutTimeStr} WIB</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Submission Button & Action State */}
              <div className="pt-4 border-t border-slate-100">
                {isCheckedOut ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Presensi Hari Ini Selesai!
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Masuk: {todayPresence.checkInTime} | Pulang: {todayPresence.checkOutTime}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={submitting || !capturedPhoto || !inGeofence || (isCheckedIn && isEarlyCheckoutTime)}
                    onClick={handleSubmitPresence}
                    className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition transform active:scale-98 border flex items-center justify-center gap-2 ${
                      !capturedPhoto || !inGeofence || (isCheckedIn && isEarlyCheckoutTime)
                        ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none'
                        : isCheckedIn
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-300 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 text-white border-amber-300 hover:from-blue-400 hover:to-sky-500 shadow-blue-500/20'
                    }`}
                  >
                    {isCheckedIn ? (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>
                          {submitting
                            ? 'Memproses Presensi Pulang...'
                            : isEarlyCheckoutTime
                            ? `BELUM WAKTU PULANG (AKTIF ${reqCheckOutTimeStr} WIB)`
                            : 'SUBMIT PRESENSI PULANG SEKARANG'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>{submitting ? 'Memproses Presensi Masuk...' : 'SUBMIT PRESENSI MASUK SEKARANG'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
