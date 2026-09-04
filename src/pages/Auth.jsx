import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Key, Building2, AlertCircle } from 'lucide-react';

export function AuthPage() {
  const { login, register, loading, authError } = useAuth();
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
      
      {/* App Logo & Header with Official UPB Gold Emblem */}
      <div className="text-center mb-6 max-w-md w-full">
        <div className="inline-flex p-3 rounded-3xl bg-white border border-slate-200 shadow-md mb-3">
          <img
            src="/logo-upb.png"
            alt="Logo Universitas Putra Bangsa"
            className="w-16 h-16 object-contain drop-shadow-md"
          />
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
                  Nama Lengkap Mahasiswa *
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
                  Universitas / Perguruan Tinggi *
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
              {isRegisterMode ? 'Nomor Induk Mahasiswa (NIM UPB) *' : 'NIM / Email Student UPB *'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder={isRegisterMode ? "Contoh: 2021001234" : "Masukkan NIM (cth: 2021001234) atau Email"}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition"
              />
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {!isRegisterMode && (
              <p className="text-[11px] text-slate-500 mt-1 pl-1 font-medium">
                💡 Masuk menggunakan <span className="font-semibold text-blue-700">NIM</span> atau <span className="font-semibold text-blue-700">Email</span> terdaftar.
              </p>
            )}
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Student UPB *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@students.upb.ac.id"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi (Password) *
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

    </div>
  );
}
