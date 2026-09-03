import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { calculateDistance, isWithinGeofence } from '../utils/haversine';
import { CameraStream } from '../components/CameraStream';
import { 
  Camera, MapPin, CheckCircle2, AlertTriangle, 
  Clock, ShieldAlert, LogOut, CheckSquare, Sparkles, Building2, BookOpen 
} from 'lucide-react';

export function PresencePage({ setActiveTab }) {
  const { settings, getTodayPresence, getTodayLogbook, addCheckIn, addCheckOut } = useApp();

  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [inGeofence, setInGeofence] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [guardrailAlert, setGuardrailAlert] = useState(null);
  const [earlyCheckoutAlert, setEarlyCheckoutAlert] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const todayPresence = getTodayPresence();
  const todayLogbook = getTodayLogbook();

  const isCheckedIn = Boolean(todayPresence?.checkInTime);
  const isCheckedOut = Boolean(todayPresence?.checkOutTime);

  // Check if current time is before configured work end time
  const rawCheckOutStr = settings.workHours?.checkOutStart;
  const reqCheckOutTimeStr = (rawCheckOutStr && String(rawCheckOutStr).trim()) ? String(rawCheckOutStr).trim() : '16:00';
  const parts = reqCheckOutTimeStr.split(':');
  const reqHour = parseInt(parts[0], 10) || 16;
  const reqMin = parseInt(parts[1], 10) || 0;

  const now = new Date();
  const nowMinTotal = now.getHours() * 60 + now.getMinutes();
  const reqMinTotal = reqHour * 60 + reqMin;
  const isEarlyCheckoutTime = nowMinTotal < reqMinTotal;

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

  const useFallbackLocation = () => {
    const lat = settings.targetLat;
    const lon = settings.targetLon;
    setUserLocation({ lat, lon });
    const dist = calculateDistance(lat, lon, settings.targetLat, settings.targetLon);
    setDistance(dist);
    setInGeofence(true);
  };

  const handlePhotoCaptured = (dataUrl) => {
    setCapturedPhoto(dataUrl);
    setIsCameraOpen(false);
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
        // Presensi Masuk
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
        // Presensi Pulang (Validasi Jam Pulang & Daily Logbook)
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

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
          PORTAL PRESENSI VIRTUAL
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Verifikasi Kamera Live Selfie & Geofence GPS Kantor Instansi
        </p>
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
            ⏰ Jam Kerja Pulang yang Dikonfigurasi: <strong className="text-amber-900 font-mono">{reqCheckOutTimeStr} WIB</strong>
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

      {/* Layout Grid: Desktop 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Camera Selfie Viewfinder */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" />
              1. Verifikasi Wajah (Live Camera)
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Anti-Fraud Selfie
            </span>
          </div>

          {/* Photo Capture Preview or Camera Button */}
          {capturedPhoto ? (
            <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-400 shadow-md">
              <img
                src={capturedPhoto}
                alt="Selfie Presensi"
                className="w-full h-72 object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/80 backdrop-blur-sm text-emerald-200 text-xs px-3 py-2 rounded-2xl flex items-center justify-between border border-emerald-500/30">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Foto Selfie Siap Diunggah
                </span>
                <button
                  type="button"
                  onClick={() => setCapturedPhoto(null)}
                  className="text-xs text-amber-300 hover:text-white underline font-bold"
                >
                  Foto Ulang
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Buka Kamera Selfie</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ambil foto selfie langsung dari kamera perangkat untuk validasi kehadiran
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition transform active:scale-95 border border-amber-300"
              >
                BUKA KAMERA PRESENSI
              </button>
            </div>
          )}
        </div>

        {/* Right Card: GPS Geofence & Submission Status */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              2. Validasi Geofencing GPS
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                Instansi Magang:
              </span>
              <span className="font-bold text-blue-900">{settings.companyName || 'Belum Dikonfigurasi'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Jarak Fisik Saat Ini:</span>
              <span className="font-mono font-bold text-slate-800">
                {distance !== null ? `${distance} Meter` : 'Menghitung...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Radius Maksimal Diizinkan:</span>
              <span className="font-mono font-bold text-blue-600">{settings.geofenceRadius} Meter</span>
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

          {/* Submission Button & Action State */}
          <div className="pt-2">
            {isCheckedOut ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Presensi Hari Ini Telah Selesai Lengkap!
                </p>
                <p className="text-[11px] text-emerald-700">
                  Check-In: {todayPresence.checkInTime} WIB | Check-Out: {todayPresence.checkOutTime} WIB
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

      {/* Live Camera Viewfinder Overlay Modal */}
      {isCameraOpen && (
        <CameraStream
          onCapture={handlePhotoCaptured}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

    </div>
  );
}
