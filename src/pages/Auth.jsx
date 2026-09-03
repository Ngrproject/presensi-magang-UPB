import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Key, GraduationCap, Building2, AlertCircle } from 'lucide-react';

export function AuthPage() {
  const { login, register, loading, authError, switchDemoUser, demoUsers } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('Universitas Putra Bangsa (UPB)');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await register(studentId, name, email, university, password);
      } else {
        await login(studentId || email, password);
      }
    } catch (err) {
      // Handled by context state
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col justify-center items-center py-8">
      
      {/* App Logo & Header */}
      <div className="text-center mb-6 max-w-md w-full">
        <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-blue-500 to-sky-400 border border-blue-300 shadow-lg shadow-blue-500/20 mb-3">
          <GraduationCap className="w-10 h-10 text-amber-300" />
        </div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent tracking-tight text-center">
          E-PRESENSI MAGANG UPB
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-medium">
          Sistem Portal Presensi & Logbook Mahasiswa UPB
        </p>
      </div>

      {/* Responsive Centered White Card */}
      <div className="w-full max-w-md bg-white border border-blue-100 shadow-xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        
        {/* Card Top Pill */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            {isRegisterMode ? 'Pendaftaran Mahasiswa UPB' : 'Masuk Ke Akun UPB'}
          </span>
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline transition"
          >
            {isRegisterMode ? 'Sudah Punya Akun? Login' : 'Daftar Akun Baru'}
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Mahasiswa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Universitas / Perguruan Tinggi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Universitas Putra Bangsa (UPB)"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-semibold"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isRegisterMode ? 'Nomor Induk Mahasiswa (NIM UPB)' : 'NIM / Email Student UPB'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="210101234 atau email"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email (Kampus / Pribadi)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@students.upb.ac.id"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition transform active:scale-98 disabled:opacity-50 border border-amber-300"
          >
            {loading ? 'Memproses...' : isRegisterMode ? 'DAFTAR AKUN MAGANG UPB' : 'MASUK KE SYSTEM UPB'}
          </button>
        </form>
      </div>

      {/* Quick Switch Demo Accounts Panel */}
      <div className="w-full max-w-md mt-5 bg-white/80 border border-blue-100 rounded-2xl p-4 text-center shadow-xs">
        <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">
          Demo Fast Access Mahasiswa UPB
        </p>
        <div className="flex gap-2">
          {demoUsers.map((user, idx) => (
            <button
              key={user.uid}
              onClick={() => switchDemoUser(idx)}
              className="flex-1 py-2 px-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 hover:bg-blue-100/80 transition text-left flex items-center gap-2"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-amber-400 shrink-0"
              />
              <div className="truncate">
                <p className="font-bold truncate text-slate-900">{user.name}</p>
                <p className="text-[10px] text-blue-600 font-mono">NIM: {user.studentId}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
