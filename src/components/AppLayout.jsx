import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageSquare, AlertTriangle } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { PwaInstallPrompt } from './PwaInstallPrompt';

export function AppLayout({ children, activeTab, setActiveTab }) {
  const { currentUser, logout } = useAuth();
  const isLecturer = currentUser?.role === 'lecturer';
  const isStudent = currentUser?.role === 'student';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative">
      <PwaInstallPrompt />

      {/* Top Professional Header Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo & Brand: E-PRESENSI MAGANG UPB with Official UPB Emblem */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <img
              src="/logo-upb-gold.png"
              alt="Logo Universitas Putra Bangsa"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs shrink-0"
            />
            <div className="whitespace-nowrap">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-blue-900 leading-tight">
                E-PRESENSI MAGANG UPB
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block leading-tight">
                Sistem Portal Presensi & Logbook Mahasiswa UPB
              </p>
            </div>
          </div>

          {/* User Profile Quick Menu */}
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Chat Icon Button Next to Profile Photo for Students */}
              {isStudent && (
                <button
                  onClick={() => setActiveTab('chat')}
                  title="Ruang Chat Diskusi Mahasiswa"
                  className={`relative p-2 rounded-xl border transition ${
                    activeTab === 'chat'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>
              )}

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 text-right p-1 rounded-2xl transition hover:bg-blue-50 border ${activeTab === 'profile' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-blue-600 font-mono font-semibold">
                    {isLecturer ? 'NIDN' : 'NIM'}: {currentUser.studentId}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                title="Keluar Akun"
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Portal Akses UPB
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area with Bottom Padding for Bottom Nav */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 print:p-0 print:m-0 print:max-w-none">
        {children}
      </main>

      {/* Floating Bottom Navigation Bar for all screens */}
      {currentUser && (
        <div className="print:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Konfirmasi Keluar Akun</h3>
              <p className="text-xs text-slate-500 font-medium">
                Apakah Anda yakin ingin keluar dari akun portal presensi UPB?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
