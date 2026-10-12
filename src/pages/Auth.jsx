import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Building2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Search,
  Check
} from 'lucide-react';

export function AuthPage() {
  const { login, register, resetPasswordDirectly, findUserByIdentifier, loading, authError } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'

  // Main Auth Fields
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('Universitas Putra Bangsa (UPB)');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [detectedUser, setDetectedUser] = useState(null);
  const [forgotError, setForgotError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetSuccessUser, setResetSuccessUser] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Handle Login & Register submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') {
        await register(studentId, name, email, university, password);
      } else {
        await login(studentId || email, password);
      }
    } catch {
      // Handled by context state
    }
  };

  // Switch to Forgot Password mode
  const handleOpenForgot = () => {
    setForgotIdentifier(studentId || '');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setResetSuccess(false);
    setResetSuccessUser(null);
    setDetectedUser(null);
    setAuthMode('forgot');

    // Auto-check if studentId is already filled
    if (studentId.trim()) {
      handleCheckUser(studentId.trim());
    }
  };

  // Check user existence for Forgot Password
  const handleCheckUser = async (identifierVal) => {
    const val = (identifierVal || forgotIdentifier || '').trim();
    if (!val) {
      setDetectedUser(null);
      return;
    }

    setIsCheckingUser(true);
    setForgotError(null);
    try {
      const found = await findUserByIdentifier(val);
      setDetectedUser(found);
      if (!found) {
        setForgotError(`Akun dengan NIM atau Email "${val}" belum terdaftar.`);
      }
    } catch (err) {
      console.warn("Check user error:", err);
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Handle Direct Password Reset submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);

    const identifier = forgotIdentifier.trim();
    if (!identifier) {
      setForgotError('Silakan masukkan NIM atau Email akun Anda.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Konfirmasi kata sandi tidak cocok. Pastikan kedua kolom sama.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordDirectly(identifier, newPassword);
      setResetSuccess(true);
      setResetSuccessUser(res.user);

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    } catch (err) {
      setForgotError(err.message || 'Gagal mengubah kata sandi. Silakan periksa kembali data Anda.');
    } finally {
      setIsResetting(false);
    }
  };

  // 1-Click Login right after password reset
  const handleDirectLoginAfterReset = async () => {
    const targetIdentifier = resetSuccessUser?.studentId || resetSuccessUser?.email || forgotIdentifier;
    try {
      await login(targetIdentifier, newPassword);
    } catch {
      // If error occurs, return to login mode with prefilled credentials
      setStudentId(targetIdentifier);
      setPassword(newPassword);
      setAuthMode('login');
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col justify-center items-center py-8">

      {/* App Logo & Header with Official UPB Gold Emblem */}
      <div className="text-center mb-6 max-w-md w-full">
        <div className="inline-flex p-3 rounded-3xl bg-white border border-slate-200 shadow-md mb-3">
          <img
            src="/logo-upb-gold.png"
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

        {/* Card Top Pill & Mode Switcher */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            {authMode === 'forgot' ? (
              <>
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Atur Ulang Kata Sandi</span>
              </>
            ) : authMode === 'register' ? (
              <>
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Pendaftaran Mahasiswa UPB</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Masuk Ke Akun UPB</span>
              </>
            )}
          </span>

          {authMode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setForgotError(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Login</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'register' ? 'login' : 'register');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline transition"
            >
              {authMode === 'register' ? 'Sudah Punya Akun? Login' : 'Daftar Akun Baru'}
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* MODE: FORGOT PASSWORD (ATUR ULANG KATA SANDI LANGSUNG)         */}
        {/* ============================================================== */}
        {authMode === 'forgot' ? (
          <div>
            {!resetSuccess ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Identifier Input (NIM / Email) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      NIM UPB / Email Terdaftar *
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCheckUser()}
                      disabled={isCheckingUser || !forgotIdentifier.trim()}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Search className="w-3 h-3" />
                      <span>{isCheckingUser ? 'Memeriksa...' : 'Cek Akun'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => {
                        setForgotIdentifier(e.target.value);
                        setLookupAttempted(false);
                        setDetectedUser(null);
                        setForgotError(null);
                      }}
                      onBlur={() => {
                        if (forgotIdentifier.trim() && !detectedUser) {
                          handleCheckUser();
                        }
                      }}
                      placeholder="Contoh: 2021001234 atau email UPB"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition"
                    />
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Detected User Identification Card */}
                {detectedUser && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Akun Terverifikasi</span>
                    </div>
                    <p className="font-bold text-slate-900 pl-5 text-sm">
                      {detectedUser.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pl-5 text-[11px] text-slate-600 font-medium">
                      <span className="font-mono text-blue-700 font-bold">NIM: {detectedUser.studentId}</span>
                      <span>•</span>
                      <span>{detectedUser.university || 'Universitas Putra Bangsa (UPB)'}</span>
                    </div>
                  </div>
                )}

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Baru * (Minimal 6 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konfirmasi Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className={`w-full pl-9 pr-10 py-3 bg-slate-50 border rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : confirmPassword && newPassword === confirmPassword
                          ? 'border-emerald-300 focus:border-emerald-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Match Status Helper */}
                  {confirmPassword && (
                    <div className="mt-1.5 pl-1 text-[11px] font-semibold flex items-center gap-1">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Kata sandi cocok & siap disimpan
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Kata sandi konfirmasi tidak cocok
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Reset Button */}
                <button
                  type="submit"
                  disabled={isResetting || loading || (confirmPassword && newPassword !== confirmPassword)}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-sky-600 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition transform active:scale-98 disabled:opacity-50 border border-amber-300 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-amber-200" />
                  <span>{isResetting ? 'Memperbarui Password...' : 'SIMPAN & GANTI KATA SANDI SEKARANG'}</span>
                </button>

                {/* Back to Login link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs text-slate-500 hover:text-blue-700 font-medium transition"
                  >
                    Batal & Kembali ke Halaman Login
                  </button>
                </div>
              </form>
            ) : (
              /* Success View after Password Reset */
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg border border-emerald-300">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Kata Sandi Berhasil Diperbarui!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                    Password baru untuk akun{' '}
                    <strong className="text-blue-700">
                      {resetSuccessUser?.name || forgotIdentifier}
                    </strong>{' '}
                    telah aktif dan siap digunakan.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs font-mono text-blue-900">
                  <span>NIM / Email: </span>
                  <span className="font-bold">{resetSuccessUser?.studentId || forgotIdentifier}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDirectLoginAfterReset}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition transform active:scale-98 border border-amber-300 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>{loading ? 'Memproses...' : 'LANGSUNG MASUK KE SISTEM UPB'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentId(resetSuccessUser?.studentId || forgotIdentifier);
                      setPassword(newPassword);
                      setAuthMode('login');
                      setResetSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Kembali ke Form Login
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* MODE: LOGIN & REGISTER                                         */
          /* ============================================================== */
          <div>
            {authError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
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
                  {authMode === 'register' ? 'Nomor Induk Mahasiswa (NIM UPB) *' : 'NIM / Email Student UPB *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder={authMode === 'register' ? "Contoh: 2021001234" : "Masukkan NIM (cth: 2021001234) atau Email"}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition"
                  />
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                {authMode === 'login' && (
                  <p className="text-[11px] text-slate-500 mt-1 pl-1 font-medium">
                    💡 Masuk menggunakan <span className="font-semibold text-blue-700">NIM</span> atau <span className="font-semibold text-blue-700">Email</span> terdaftar.
                  </p>
                )}
              </div>

              {authMode === 'register' && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Kata Sandi (Password) *
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={handleOpenForgot}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                      <span>Lupa Password?</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition transform active:scale-98 disabled:opacity-50 border border-amber-300"
              >
                {loading ? 'Memproses...' : authMode === 'register' ? 'DAFTAR AKUN MAGANG UPB' : 'MASUK KE SYSTEM UPB'}
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
