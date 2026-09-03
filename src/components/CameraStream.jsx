import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CameraStream({ onCapture, capturedPhoto, onResetPhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      if (capturedPhoto) return;
      setIsInitializing(true);
      setCameraError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Kamera tidak didukung pada browser ini.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera Stream Error:', err);
        setCameraError(
          'Gagal mengakses kamera langsung. Pastikan izin kamera aktif dan Anda menggunakan koneksi HTTPS / localhost.'
        );
      } finally {
        setIsInitializing(false);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, capturedPhoto]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    onCapture(photoDataUrl);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Viewfinder Frame */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.25)] bg-slate-950 flex items-center justify-center">
        
        {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="Captured Presensi"
            className="w-full h-full object-cover rounded-full"
          />
        ) : cameraError ? (
          <div className="p-4 text-center flex flex-col items-center justify-center text-red-500 text-xs">
            <AlertTriangle className="w-8 h-8 mb-2 animate-bounce" />
            <p>{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
            {/* Viewfinder Target Crosshairs HUD */}
            <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-full pointer-events-none animate-spin-slow" />
            <div className="absolute w-48 h-48 border border-blue-400/40 rounded-full pointer-events-none" />
            
            {/* Anti-Fraud Watermark Overlay */}
            <div className="absolute bottom-4 inset-x-0 text-center">
              <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-amber-300 border border-amber-400/30 shadow-lg">
                LIVE CAMERA ONLY • NO UPLOAD
              </span>
            </div>
          </>
        )}

        {isInitializing && !capturedPhoto && !cameraError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-blue-300 text-xs gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span>Memuat Kamera...</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Action Controls */}
      <div className="mt-4 flex items-center gap-3">
        {!capturedPhoto && !cameraError && (
          <>
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span>Putar Kamera</span>
            </button>

            <button
              type="button"
              onClick={handleTakeSnapshot}
              disabled={isInitializing}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.35)] transition transform active:scale-95 border border-amber-400/30"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Ambil Foto Selfi</span>
            </button>
          </>
        )}

        {capturedPhoto && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Foto Terverifikasi
            </span>
            <button
              type="button"
              onClick={onResetPhoto}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-300"
            >
              Foto Ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
