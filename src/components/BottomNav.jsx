import React from 'react';
import { LayoutDashboard, Camera, BookOpen, Settings, User, FileText, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function BottomNav({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isLecturer = currentUser?.role === 'lecturer';

  let navItems = [];
  if (isLecturer) {
    navItems = [
      { id: 'bimbingan', label: 'Bimbingan', icon: GraduationCap },
      { id: 'profile', label: 'Profil Saya', icon: User }
    ];
  } else if (isAdmin) {
    navItems = [
      { id: 'admin', label: 'Admin', icon: ShieldCheck },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'presence', label: 'Presensi', icon: Camera },
      { id: 'logbook', label: 'Logbook', icon: BookOpen },
      { id: 'reports', label: 'Laporan', icon: FileText },
      { id: 'bimbingan', label: 'Bimbingan', icon: GraduationCap },
      { id: 'settings', label: 'Instansi', icon: Settings },
      { id: 'profile', label: 'Profil', icon: User }
    ];
  } else {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'presence', label: 'Presensi', icon: Camera },
      { id: 'logbook', label: 'Logbook', icon: BookOpen },
      { id: 'reports', label: 'Laporan', icon: FileText },
      { id: 'bimbingan', label: 'Bimbingan', icon: GraduationCap },
      { id: 'settings', label: 'Instansi', icon: Settings },
      { id: 'profile', label: 'Profil', icon: User }
    ];
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 max-w-3xl mx-auto z-50">
      <div className="bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-[0_12px_35px_rgba(37,99,235,0.18)] rounded-full p-1.5 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1.5 sm:px-3 rounded-full transition-all duration-300 ${isActive
                ? 'text-white font-bold'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/80'
                }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 rounded-full border border-amber-300/40 shadow-[0_4px_15px_rgba(37,99,235,0.4)] animate-pulse" />
              )}
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-amber-300' : ''
                  }`}
              />
              <span className="text-[9px] sm:text-[10px] tracking-tight relative z-10 mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
