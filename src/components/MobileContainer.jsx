import React from 'react';

export function MobileContainer({ children }) {
  return (
    <div className="min-h-dvh w-full bg-slate-100 flex items-center justify-center p-0 md:py-6 selection:bg-amber-400/40 selection:text-blue-950">
      <div className="relative w-full max-w-md h-dvh md:h-[884px] md:max-h-[92vh] md:rounded-[44px] bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 text-slate-900 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.15)] border border-slate-200/80 backdrop-blur-3xl">
        
        {/* Ambient Floating Orbs */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[70px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-amber-400/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Top Status Bar (PWA Bar) */}
        <div className="w-full pt-3 pb-1 px-6 flex items-center justify-between text-[11px] font-medium tracking-widest text-slate-200 border-b border-blue-900/10 z-20 bg-blue-950/95 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            UNIV PRESENSI PWA
          </span>
          <span className="text-slate-300 font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
            v2.4 LIGHT
          </span>
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
