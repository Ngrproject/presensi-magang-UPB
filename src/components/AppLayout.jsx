import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Camera, BookOpen, 
  Settings, LogOut, Building2, User 
} from 'lucide-react';
import { BottomNav } from './BottomNav';

export function AppLayout({ children, activeTab, setActiveTab }) {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presence', label: 'Presensi', icon: Camera },
    { id: 'logbook', label: 'Logbook', icon: BookOpen },
    { id: 'settings', label: 'Konfigurasi Instansi', icon: Settings },
    { id: 'profile', label: 'Profil Saya', icon: User }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative">
      
      {/* Top Professional Header Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand: E-PRESENSI MAGANG UPB with Official UPB Emblem */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-upb.png"
              alt="Logo Universitas Putra Bangsa"
              className="w-10 h-10 object-contain drop-shadow-xs shrink-0"
            />
            <div>
              <h1 className="text-base font-black tracking-tight text-blue-900">
                E-PRESENSI MAGANG UPB
              </h1>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Sistem Portal Presensi & Logbook Mahasiswa UPB
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* User Profile Quick Menu */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 text-right p-1 rounded-2xl transition hover:bg-blue-50 border ${
                  activeTab === 'profile' ? 'border-blue-500 bg-blue-50' : 'border-transparent'
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
                    NIM: {currentUser.studentId}
                  </p>
                </div>
              </button>

              <button
                onClick={logout}
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

      {/* Main Content Area with Bottom Padding for Mobile Nav */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Mobile Floating Bottom Navigation (Fixed at bottom on viewport < 768px) */}
      {currentUser && (
        <div className="md:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}
    </div>
  );
}
