import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { calculateDistance, isWithinGeofence } from '../utils/haversine';
import { CameraStream } from '../components/CameraStream';
import { 
  MapPin, ShieldAlert, CheckCircle2, Lock, AlertTriangle, 
  RotateCcw, Navigation, Clock, Info 
} from 'lucide-react';

export function PresencePage({ setActiveTab }) {
  const { settings, getTodayPresence, getTodayLogbook, addCheckIn, addCheckOut } = useApp();

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [mode, setMode] = useState('checkin');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const todayPresence = getTodayPresence();
  const todayLogbook = getTodayLogbook();

  useEffect(() => {
    if (todayPresence?.checkInTime && !todayPresence?.checkOutTime) {
      setMode('checkout');
    } else {
      setMode('checkin');
    }
  }, [todayPresence]);

  const fetchLocation = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation tidak didukung pada browser ini.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation Error:', err);
        const isInsecureHttp = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        if (err.message?.includes('Only secure origins') || isInsecureHttp) {
          setGpsError(
            '🔒 AKSES GPS DIBATASI BROWSER (HTTP IP): Geolocation otomatis di HP memerlukan koneksi HTTPS (Vercel / Ngrok) atau localhost. Untuk uji coba lokal HTTP IP, lokasi disimulasikan sesuai koordinat instansi.'
          );
          // Fallback location for HTTP IP testing so testing presensi on HTTP IP works!
          setGpsData({
            lat: settings.targetLat ?? -6.2088,
            lon: settings.targetLon ?? 106.8456,
            accuracy: 10
          });
        } else {
          setGpsError(
            'Gagal mendapatkan lokasi GPS. Pastikan Izin Lokasi aktif dan GPS Perangkat dalam mode Akurasi Tinggi.'
          );
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  let distanceMeters = null;
  let withinGeofence = false;

  if (gpsData && settings.targetLat && settings.targetLon) {
    distanceMeters = calculateDistance(
      gpsData.lat,
      gpsData.lon,
      settings.targetLat,
      settings.targetLon
    );
    withinGeofence = isWithinGeofence(distanceMeters, settings.geofenceRadius || 50);
  }

  const handleCapture = (photoUrl) => {
    setCapturedPhoto(photoUrl);
    setErrorMessage('');
  };

  const handleResetPhoto = () => {
    setCapturedPhoto(null);
  };

  const handleSubmitPresensi = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!capturedPhoto) {
      setErrorMessage('Wajib mengambil foto selfie langsung dari kamera terlebih dahulu.');
      return;
    }

    if (!gpsData || distanceMeters === null) {
      setErrorMessage('Lokasi GPS belum terdeteksi. Silakan muat ulang lokasi.');
      return;
    }

    if (!withinGeofence) {
      setErrorMessage(
        `Gagal Submit: Anda berada di luar radius lokasi kantor! (Jarak: ${distanceMeters}m / Max: ${settings.geofenceRadius}m)`
      );
      return;
    }

    try {
      if (mode === 'checkin') {
        addCheckIn({
          photoDataUrl: capturedPhoto,
          userLat: gpsData.lat,
          userLon: gpsData.lon,
          distance: distanceMeters
        });
        setSuccessMessage('Presensi MASUK Berhasil Dicatat!');
      } else {
        if (!todayLogbook || (!todayLogbook.achievements && !todayLogbook.obstacles)) {
          setErrorMessage('GUARDRAIL: Anda WAJIB mengisi Daily Logbook hari ini sebelum melakukan Presensi Pulang!');
          return;
        }

        addCheckOut({
          photoDataUrl: capturedPhoto,
          userLat: gpsData.lat,
          userLon: gpsData.lon,
          distance: distanceMeters
        });
        setSuccessMessage('Presensi PULANG Berhasil Dicatat!');
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      if (err.message === 'GUARDRAIL_LOGBOOK_REQUIRED') {
        setErrorMessage('GUARDRAIL: Anda WAJIB mengisi Daily Logbook hari ini sebelum melakukan Presensi Pulang!');
      } else {
        setErrorMessage('Terjadi kesalahan saat menyimpan presensi.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
            PRESENSI {mode === 'checkin' ? 'MASUK' : 'PULANG'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">Verifikasi Kamera Langsung & Geofencing GPS</p>
        </div>
        
        {/* Toggle Mode Switcher */}
        <div className="flex bg-slate-200 p-1.5 rounded-2xl border border-slate-300">
          <button
            onClick={() => setMode('checkin')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              mode === 'checkin'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presensi Masuk
          </button>
          <button
            onClick={() => setMode('checkout')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              mode === 'checkout'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presensi Pulang
          </button>
        </div>
      </div>

      {/* Grid Layout for Camera & Geofence Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Camera Stream Viewfinder */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col items-center justify-center space-y-4">
          <CameraStream
            onCapture={handleCapture}
            capturedPhoto={capturedPhoto}
            onResetPhoto={handleResetPhoto}
          />

          {/* Submit Button on Desktop */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={handleSubmitPresensi}
              disabled={!withinGeofence || !capturedPhoto || (mode === 'checkout' && !todayLogbook)}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all transform active:scale-98 border ${
                withinGeofence && capturedPhoto && !(mode === 'checkout' && !todayLogbook)
                  ? 'bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white border-amber-300 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
              }`}
            >
              <Navigation className="w-5 h-5 text-amber-300" />
              <span>
                {!withinGeofence && distanceMeters !== null
                  ? `PRESENSI TERKUNCI (Jarak ${distanceMeters}m / Max ${settings.geofenceRadius}m)`
                  : mode === 'checkout' && !todayLogbook
                  ? 'WAJIB ISI LOGBOOK UNTUK PULANG'
                  : !capturedPhoto
                  ? 'AMBIL FOTO SELFIE DAHULU'
                  : `SUBMIT PRESENSI ${mode === 'checkin' ? 'MASUK' : 'PULANG'}`}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: GPS Geolocation Verification & Alerts */}
        <div className="space-y-6">
          
          {/* Already Checked Out Notice */}
          {todayPresence?.checkInTime && todayPresence?.checkOutTime && (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Presensi Hari Ini Selesai!</p>
                  <p className="text-xs text-emerald-700">
                    Masuk: {todayPresence.checkInTime} | Pulang: {todayPresence.checkOutTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logbook Guardrail Warning */}
          {mode === 'checkout' && !todayLogbook && (
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Guardrail Presensi Pulang Terkunci!</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Anda belum mengisi Daily Logbook hari ini. Presensi Pulang hanya dapat disubmit setelah Anda menyimpan logbook kegiatan hari ini.
              </p>
              <button
                onClick={() => setActiveTab('logbook')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-2xl text-xs shadow transition border border-amber-300"
              >
                Buka & Isi Daily Logbook Sekarang
              </button>
            </div>
          )}

          {/* GPS Location Details Card */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Verifikasi Lokasi GPS (Formula Haversine)
              </span>
              <button
                onClick={fetchLocation}
                disabled={isLocating}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 transition"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Mndeteksi...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {gpsError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Target Instansi Magang:</span>
                <span className="font-bold text-blue-900 truncate max-w-[200px]">
                  {settings.companyName}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono">
                <span className="text-slate-600 font-medium">Jarak Real-time ke Kantor:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {distanceMeters !== null ? `${distanceMeters} meter` : 'Menghitung...'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Batas Geofence (Max {settings.geofenceRadius}m):</span>
                {distanceMeters !== null && (
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-xs border ${
                      withinGeofence
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {withinGeofence ? '✓ DALAM RADIUS' : '✕ DI LUAR RADIUS'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Error & Success Alerts */}
          {errorMessage && (
            <div className="p-4 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
