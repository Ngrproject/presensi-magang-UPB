import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, GraduationCap, Building2, Mail, 
  Save, Check, ShieldCheck, Camera, Image, Upload, Trash2 
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80'
];

export function ProfilePage() {
  const { currentUser, updateUserProfile } = useAuth();
  const { settings } = useApp();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(currentUser?.name || '');
  const [studentId, setStudentId] = useState(currentUser?.studentId || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [university, setUniversity] = useState(currentUser?.university || 'Universitas Putra Bangsa (UPB)');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || AVATAR_PRESETS[0]);
  const [savedAlert, setSavedAlert] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Compress & convert device image file to clean lightweight Data URL
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(compressedDataUrl);
        setIsUploading(false);
      };
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!studentId.trim()) {
      alert('NIM tidak boleh kosong.');
      return;
    }

    await updateUserProfile({
      name,
      studentId,
      email,
      university,
      avatarUrl
    });

    setSavedAlert(true);
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 }
    });

    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden Device File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
          PROFIL MAHASISWA
        </h1>
        <p className="text-xs text-slate-500 font-medium">Kelola & Perbarui Informasi Identitas Diri Mahasiswa UPB</p>
      </div>

      {/* Save Success Alert */}
      {savedAlert && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profil Mahasiswa Berhasil Diperbarui!</span>
        </div>
      )}

      {/* Grid Layout: Desktop 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student ID Card Preview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 text-center space-y-4">
            
            {/* Avatar Preview & Upload Overlay Button */}
            <div className="relative inline-block group">
              <img
                src={avatarUrl}
                alt={name}
                className="w-32 h-32 rounded-3xl object-cover border-4 border-blue-500 shadow-md mx-auto"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Unggah Foto dari HP/Device"
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md border-2 border-white transition transform active:scale-90 flex items-center justify-center"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{name || 'Nama Mahasiswa'}</h2>
              <p className="text-xs font-mono font-bold text-blue-600">NIM: {studentId || '210101234'}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{university}</p>
            </div>

            {/* Device Upload Quick Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-2xl border border-blue-200 flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{isUploading ? 'Memproses Foto...' : 'Upload Foto dari Perangkat (HP)'}</span>
            </button>

            {/* Instansi Badge */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Instansi Magang Aktif
              </span>
              <p className="font-bold text-blue-900 truncate">
                {settings.companyName || 'Belum dikonfigurasi'}
              </p>
            </div>

            {/* Portal Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Status: Akun Mahasiswa Terverifikasi UPB
            </div>

          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-5">
            
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-blue-500" />
              Formulir Edit Data Mahasiswa
            </h2>

            {/* Section: Upload Device Photo */}
            <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-600" />
                    Foto Profil dari Galeri / Kamera HP
                  </h3>
                  <p className="text-[11px] text-slate-500">Pilih foto pribadi langsung dari penyimpanan perangkat Anda</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs border border-blue-400 transition"
                >
                  {isUploading ? 'Mengunggah...' : 'Pilih Foto File'}
                </button>
              </div>
            </div>

            {/* Avatar Selector Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-blue-500" />
                Atau Pilih Preset Avatar Mahasiswa
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`rounded-2xl overflow-hidden border-2 transition transform active:scale-95 ${
                      avatarUrl === preset ? 'border-blue-500 ring-2 ring-blue-300 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Avatar URL Field */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Custom Image URL (Opsional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Mahasiswa *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
              />
            </div>

            {/* Student ID (NIM) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Mahasiswa (NIM UPB) *
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="NIM"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-bold"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Alamat Email Student
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

            {/* University */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                Universitas / Perguruan Tinggi
              </label>
              <input
                type="text"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Universitas Putra Bangsa (UPB)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 hover:from-blue-400 hover:to-sky-500 text-white font-black text-sm shadow-lg shadow-blue-500/20 border border-amber-300 flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <Save className="w-5 h-5 text-amber-300" />
              <span>SIMPAN PERUBAHAN PROFIL</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
