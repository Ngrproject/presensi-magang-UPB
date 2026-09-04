import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  Users, UserPlus, ShieldCheck, MapPin, Unlock, 
  Calendar, Clock, Edit3, Trash2, CheckCircle2, 
  AlertTriangle, Search, Filter, BookOpen, UserCheck, 
  FileSpreadsheet, ShieldAlert, Sparkles
} from 'lucide-react';

export function AdminPage() {
  const { currentUser, allUsers, adminAddUser, adminUpdateUser, adminDeleteUser } = useAuth();
  const { 
    allPresenceLogs, allLogbooks, getTodayStr, 
    adminUnlockStudentSettings, adminSavePresence, adminDeletePresence 
  } = useApp();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'manual' | 'presences' | 'logbooks'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Notification / Toast state
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add User Modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    studentId: '',
    name: '',
    email: '',
    university: 'Universitas Putra Bangsa (UPB)',
    role: 'student'
  });

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null);

  // Manual Attendance Form state
  const [manualForm, setManualForm] = useState({
    userId: '',
    dateStr: getTodayStr(),
    checkInTime: '08:00',
    checkOutTime: '16:00',
    checkInStatus: 'TEPAT WAKTU',
    notes: 'Presensi diinputkan manual oleh Admin',
    isLeave: false,
    leaveType: ''
  });

  const todayStr = getTodayStr();

  // Statistics calculation
  const totalStudents = allUsers.filter(u => u.role !== 'admin').length;
  const todayPresences = allPresenceLogs.filter(p => p.dateStr === todayStr);
  const countHadir = todayPresences.filter(p => p.checkInStatus === 'TEPAT WAKTU' || p.checkInStatus === 'HADIR TEPAT WAKTU' || p.checkInStatus === 'HADIR').length;
  const countTerlambat = todayPresences.filter(p => p.checkInStatus === 'TERLAMBAT').length;
  const countIzin = todayPresences.filter(p => p.isLeave || p.checkInStatus === 'IZIN' || p.checkInStatus === 'SAKIT').length;
  const countAlpa = todayPresences.filter(p => p.checkInStatus === 'ALPA').length;

  // Filtered Users
  const filteredUsers = allUsers.filter(user => {
    const query = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.studentId || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query)
    );
  });

  // Filtered Presences
  const filteredPresences = allPresenceLogs.filter(pres => {
    const matchesSearch = (pres.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pres.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pres.dateStr || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || 
                          pres.checkInStatus === statusFilter ||
                          (statusFilter === 'IZIN' && pres.isLeave);
    return matchesSearch && matchesStatus;
  });

  // Filtered Logbooks
  const filteredLogbooks = allLogbooks.filter(log => {
    return (
      (log.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.studentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.dateStr || '').includes(searchTerm)
    );
  });

  // Handle Add User
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.studentId || !newUserForm.name) {
      showNotification('Mohon isi NIM dan Nama Mahasiswa!', 'error');
      return;
    }
    try {
      await adminAddUser(newUserForm);
      showNotification(`Mahasiswa ${newUserForm.name} (${newUserForm.studentId}) berhasil ditambahkan!`);
      setIsAddUserOpen(false);
      setNewUserForm({
        studentId: '',
        name: '',
        email: '',
        university: 'Universitas Putra Bangsa (UPB)',
        role: 'student'
      });
    } catch (err) {
      showNotification('Gagal menambahkan user.', 'error');
    }
  };

  // Handle Edit User
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await adminUpdateUser(editingUser.uid, editingUser);
      showNotification(`Data pengguna ${editingUser.name} berhasil diperbarui.`);
      setEditingUser(null);
    } catch (err) {
      showNotification('Gagal memperbarui user.', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user ${user.name} (${user.studentId})?`)) {
      try {
        await adminDeleteUser(user.uid);
        showNotification(`User ${user.name} berhasil dihapus.`);
      } catch (err) {
        showNotification('Gagal menghapus user.', 'error');
      }
    }
  };

  // Handle Unlock Location for Student
  const handleUnlockLocation = async (user) => {
    try {
      await adminUnlockStudentSettings(user.uid);
      showNotification(`🔓 Kunci Lokasi GPS untuk ${user.name} (${user.studentId}) telah DIBUKA. Mahasiswa dapat mengedit ulang lokasi GPS di halaman Instansi!`);
    } catch (err) {
      showNotification('Gagal membuka kunci lokasi.', 'error');
    }
  };

  // Handle Manual Attendance Submit
  const handleManualPresenceSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.userId) {
      showNotification('Silakan pilih Mahasiswa terlebih dahulu!', 'error');
      return;
    }
    const targetUser = allUsers.find(u => u.uid === manualForm.userId);
    if (!targetUser) return;

    try {
      await adminSavePresence({
        userId: targetUser.uid,
        studentName: targetUser.name,
        studentId: targetUser.studentId,
        dateStr: manualForm.dateStr,
        checkInTime: manualForm.checkInTime,
        checkOutTime: manualForm.checkOutTime,
        checkInStatus: manualForm.checkInStatus,
        checkOutStatus: 'SELESAI',
        notes: manualForm.notes,
        isLeave: manualForm.isLeave,
        leaveType: manualForm.isLeave ? manualForm.leaveType : null,
        reason: manualForm.isLeave ? manualForm.notes : null
      });
      showNotification(`Presensi manual untuk ${targetUser.name} tanggal ${manualForm.dateStr} berhasil disimpan!`);
      setManualForm({
        userId: '',
        dateStr: getTodayStr(),
        checkInTime: '08:00',
        checkOutTime: '16:00',
        checkInStatus: 'HADIR TEPAT WAKTU',
        notes: 'Presensi diinputkan manual oleh Admin',
        isLeave: false,
        leaveType: ''
      });
    } catch (err) {
      showNotification('Gagal menyimpan presensi manual.', 'error');
    }
  };

  // Handle Delete Presence
  const handleDeletePresence = async (pres) => {
    if (window.confirm(`Hapus catatan presensi ${pres.studentName} pada ${pres.dateStr}?`)) {
      try {
        await adminDeletePresence(pres.id);
        showNotification('Presensi berhasil dihapus.');
      } catch (err) {
        showNotification('Gagal menghapus presensi.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all transform animate-bounce ${
          notification.type === 'error' 
            ? 'bg-red-900/95 text-white border-red-500' 
            : 'bg-slate-900/95 text-white border-emerald-400'
        }`}>
          {notification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-blue-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              SISTEM MANAJEMEN ADMIN & KOORDINATOR UPB
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Panel Kontrol Absensi & Mahasiswa
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Pusat kendali untuk mengabsenkan user, membuka kunci lokasi GPS instansi, kelola akun mahasiswa, dan rekap presensi harian.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shrink-0">
            <UserCheck className="w-8 h-8 text-amber-400 p-1.5 bg-white/10 rounded-xl" />
            <div>
              <p className="text-[10px] text-slate-300 font-medium">Administrator Login</p>
              <p className="text-xs font-bold text-white">{currentUser?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-[#121212] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Total Mahasiswa</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalStudents}</p>
          <span className="text-[10px] text-blue-600 font-medium">Akun Terdaftar</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Presensi Hari Ini</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{todayPresences.length}</p>
          <span className="text-[10px] text-slate-400 font-medium">{todayStr}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-800">Hadir Tepat Waktu</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{countHadir}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Hari ini</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-800">Terlambat</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{countTerlambat}</p>
          <span className="text-[10px] text-amber-600 font-medium">Hari ini</span>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-800">Izin / Sakit / Alpa</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{countIzin + countAlpa}</p>
          <span className="text-[10px] text-purple-600 font-medium">Hari ini</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen User ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Absensikan User (Manual)</span>
        </button>

        <button
          onClick={() => setActiveTab('presences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'presences'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Rekap & Kontrol Presensi ({allPresenceLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logbooks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'logbooks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Monitor Logbook ({allLogbooks.length})</span>
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama, NIM, atau Tanggal..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {activeTab === 'presences' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="TEPAT WAKTU">Tepat Waktu</option>
            <option value="TERLAMBAT">Terlambat</option>
            <option value="IZIN">Izin / Sakit</option>
            <option value="ALPA">Alpa</option>
          </select>
        )}
      </div>

      {/* TAB 1: MANAJEMEN USER */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Daftar User & Akses Buka Lokasi GPS</span>
            </h2>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-2 border border-amber-300/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Mahasiswa Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {user.role === 'admin' && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">{user.name}</h3>
                    <p className="text-xs font-mono text-blue-600 font-bold">NIM: {user.studentId}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.university}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {/* UNLOCK GPS LOCATION BUTTON */}
                  <button
                    onClick={() => handleUnlockLocation(user)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition"
                    title="Buka Kunci Lokasi GPS agar mahasiswa bisa edit kembali lokasi di Halaman Instansi"
                  >
                    <Unlock className="w-4 h-4 text-amber-600" />
                    <span>Buka Kunci Lokasi GPS</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl p-6">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Tidak ada user ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ABSENSIKAN USER (MANUAL) */}
      {activeTab === 'manual' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Form Absensikan User (Manual Admin)</h2>
              <p className="text-xs text-slate-500">Inputkan atau ubah status presensi mahasiswa secara langsung.</p>
            </div>
          </div>

          <form onSubmit={handleManualPresenceSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Mahasiswa *
              </label>
              <select
                required
                value={manualForm.userId}
                onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Pilih Mahasiswa --</option>
                {allUsers.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} (NIM: {u.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Presensi *
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.dateStr}
                  onChange={(e) => setManualForm({ ...manualForm, dateStr: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Presensi *
                </label>
                <select
                  value={manualForm.checkInStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isL = val === 'IZIN' || val === 'SAKIT';
                    setManualForm({
                      ...manualForm,
                      checkInStatus: val,
                      isLeave: isL,
                      leaveType: isL ? val : ''
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="TEPAT WAKTU">HADIR TEPAT WAKTU</option>
                  <option value="TERLAMBAT">TERLAMBAT</option>
                  <option value="IZIN">IZIN</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="ALPA">ALPA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Masuk (Check-In)
                </label>
                <input
                  type="text"
                  value={manualForm.checkInTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                  placeholder="08:00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Keluar (Check-Out)
                </label>
                <input
                  type="text"
                  value={manualForm.checkOutTime}
                  onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                  placeholder="16:00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Alasan Admin
              </label>
              <textarea
                rows={2}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Catatan tambahan (misal: diabsensikan manual oleh koordinator)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 border border-amber-300/40 transition transform active:scale-98"
            >
              SIMPAN PRESENSI MANUAL MAHASISWA
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REKAP & KONTROL PRESENSI */}
      {activeTab === 'presences' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Daftar Seluruh Presensi Mahasiswa</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Total: {filteredPresences.length} Entri</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Mahasiswa</th>
                  <th className="p-4">Jam Masuk</th>
                  <th className="p-4">Jam Keluar</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filteredPresences.map((pres) => (
                  <tr key={pres.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono text-slate-600 font-bold">{pres.dateStr}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{pres.studentName}</p>
                      <p className="text-[10px] text-blue-600 font-mono">NIM: {pres.studentId}</p>
                    </td>
                    <td className="p-4 font-mono">{pres.checkInTime || '-'}</td>
                    <td className="p-4 font-mono">{pres.checkOutTime || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        pres.checkInStatus === 'TEPAT WAKTU' || pres.checkInStatus === 'HADIR TEPAT WAKTU' || pres.checkInStatus === 'HADIR'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pres.checkInStatus === 'TERLAMBAT'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : pres.isLeave || pres.checkInStatus === 'IZIN' || pres.checkInStatus === 'SAKIT'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {pres.checkInStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeletePresence(pres)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition"
                        title="Hapus Presensi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPresences.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Belum ada data presensi yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MONITOR LOGBOOK */}
      {activeTab === 'logbooks' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Monitor Logbook Harian Mahasiswa</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLogbooks.map((log) => (
              <div key={log.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{log.studentName}</h3>
                    <p className="text-[10px] text-blue-600 font-mono font-bold">NIM: {log.studentId}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-200">
                    {log.dateStr}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-700 text-[11px]">🎯 Pencapaian Harian:</p>
                    <p className="text-slate-600 text-xs whitespace-pre-wrap pl-3 border-l-2 border-emerald-400 mt-0.5">
                      {log.achievements || '-'}
                    </p>
                  </div>

                  {log.obstacles && (
                    <div>
                      <p className="font-bold text-amber-700 text-[11px]">⚠️ Kendala / Hambatan:</p>
                      <p className="text-slate-600 text-xs whitespace-pre-wrap pl-3 border-l-2 border-amber-400 mt-0.5">
                        {log.obstacles}
                      </p>
                    </div>
                  )}

                  {log.tomorrowPlan && (
                    <div>
                      <p className="font-bold text-blue-700 text-[11px]">🚀 Rencana Besok:</p>
                      <p className="text-slate-600 text-xs whitespace-pre-wrap pl-3 border-l-2 border-blue-400 mt-0.5">
                        {log.tomorrowPlan}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredLogbooks.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl p-6">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Belum ada logbook diinputkan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH USER MAHASISWA */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Tambah Akun Mahasiswa Baru</h3>

            <form onSubmit={handleAddUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.studentId}
                  onChange={(e) => setNewUserForm({ ...newUserForm, studentId: e.target.value })}
                  placeholder="Contoh: 2021001234"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Student UPB</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="Opsional (misal: budi@students.upb.ac.id)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Akun</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="student">Mahasiswa (Student)</option>
                  <option value="admin">Administrator / Koordinator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Edit Akun User</h3>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIM Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={editingUser.studentId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Student</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Akun</label>
                <select
                  value={editingUser.role || 'student'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="student">Mahasiswa (Student)</option>
                  <option value="admin">Administrator / Koordinator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
