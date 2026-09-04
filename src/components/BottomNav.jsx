import React from 'react';
import { LayoutDashboard, Camera, BookOpen, Settings, User, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function BottomNav({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'presence', label: 'Presensi', icon: Camera },
    { id: 'logbook', label: 'Logbook', icon: BookOpen },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'settings', label: 'Instansi', icon: Settings },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  if (isAdmin) {
    navItems.unshift({ id: 'admin', label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="fixed bottom-4 left-2 right-2 max-w-lg mx-auto z-50">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-blue-500/40 shadow-[0_12px_35px_rgba(15,23,42,0.4)] rounded-full p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full border border-amber-300/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse" />
              )}
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 ${
                  isActive ? 'scale-110 text-amber-300' : ''
                }`}
              />
              <span className="text-[9px] sm:text-[10px] tracking-wide relative z-10 mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
