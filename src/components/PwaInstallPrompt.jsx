import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, MoreVertical, PlusSquare, CheckCircle2 } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Strict Check: If already running in standalone app mode (installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed_session');
    if (dismissed === 'true') {
      setIsBannerDismissed(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Chrome / Android native install prompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowGuideModal(true);
      }
    } else {
      // If native prompt is not available (e.g. HTTP IP connection / Safari), show visual guide
      setShowGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed_session', 'true');
  };

  // IF APP IS INSTALLED (STANDALONE) OR USER DISMISSED -> DO NOT RENDER BANNER AT ALL!
  if (isStandalone || isBannerDismissed) return null;

  return (
    <>
      {/* Floating Smart PWA Install Banner (Only rendered if app is NOT installed yet) */}
      <div className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-short print:hidden">
        <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-blue-950 text-white rounded-3xl p-4 shadow-2xl border-2 border-amber-400/80 backdrop-blur-xl flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/app-icon.png"
              alt="Logo E-Presensi UPB"
              className="w-11 h-11 object-contain shrink-0 drop-shadow-md rounded-2xl bg-white/10 p-0.5 border border-white/20"
            />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>INSTAL APLIKASI PWA</span>
              </div>
              <h4 className="text-xs font-black text-white truncate">E-Presensi Magang UPB</h4>
              <p className="text-[10px] text-slate-200 font-medium truncate">
                Instal di HP untuk akses tanpa baris URL!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-200 text-blue-950 font-black text-xs shadow-lg transition flex items-center gap-1 transform active:scale-95 cursor-pointer border border-amber-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTAL</span>
            </button>

            <button
              onClick={handleDismissBanner}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
              title="Tutup Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Visual Instruction Modal (For HTTP IP connection / browser fallback) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-slate-900 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <img
                src="/app-icon.png"
                alt="Logo E-Presensi UPB"
                className="w-14 h-14 object-contain mx-auto drop-shadow-md rounded-2xl"
              />
              <h3 className="text-base font-black text-blue-950">Cara Instal Aplikasi di HP</h3>
              <p className="text-xs text-slate-500 font-medium">
                Ikuti 2 langkah mudah di bawah ini untuk memasang **E-Presensi UPB** di layar utama HP Anda:
              </p>
            </div>

            {isIos ? (
              /* iOS Safari Guide */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Tekan Tombol Share</p>
                    <p className="text-[11px] text-slate-500">
                      Tekan icon <Share className="w-3.5 h-3.5 text-blue-600 inline" /> di bagian bawah browser Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Pilih "Tambah ke Layar Utama"</p>
                    <p className="text-[11px] text-slate-500">
                      Gulir opsi ke bawah dan ketuk <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" /> **Add to Home Screen**.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android Chrome / Edge Guide */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Ketuk 3 Titik Menu Browser</p>
                    <p className="text-[11px] text-slate-500">
                      Ketuk icon menu <MoreVertical className="w-3.5 h-3.5 text-blue-600 inline" /> di pojok kanan atas browser Chrome/HP Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Pilih "Tambahkan ke Layar Utama"</p>
                    <p className="text-[11px] text-slate-500">
                      Pilih menu **"Tambahkan ke Layar Utama"** (*Add to Home Screen*) atau **"Instal Aplikasi"**.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold text-xs shadow-md hover:from-blue-500 hover:to-sky-500 transition"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
