# 🎓 E-Presensi Magang UPB (PWA)
> **Sistem Portal Presensi Kamera Selfie, Geofencing GPS & Daily Logbook Mahasiswa Universitas Putra Bangsa (UPB)**

![E-Presensi Magang UPB](https://img.shields.io/badge/UNIVERSITAS_PUTRA_BANGSA-UPB-blue?style=for-the-badge&logo=graduation-cap)
![React Vite](https://img.shields.io/badge/React_18-Vite-sky?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase)

---

## 📌 1. TENTANG APLIKASI

**E-Presensi Magang UPB** adalah aplikasi *Single Page Application* (SPA) berstandar **Progressive Web App (PWA)** yang dirancang khusus untuk mahasiswa **Universitas Putra Bangsa (UPB)** yang sedang melaksanakan program Magang / Praktik Kerja Lapangan (PKL).

Aplikasi ini mengintegrasikan **Anti-Fraud Live Camera Selfie**, **Geofencing GPS jarak akurat (Formula Haversine)**, **Work End Time Check-Out Guardrail (Presensi Pulang HANYA setelah jam pulang)**, **Guardrail Daily Logbook**, **Duration Audit Logs**, serta **Cloud Real-time Sync** ke Google Firebase Firestore.

---

## ✨ 2. FITUR-FITUR UTAMA

### 📱 1. Responsive & Anti-Gravity UI Design
- **Desktop Layout**: Navigation header top bar, 3-column grid dashboard, 2-column presensi & instansi configuration, serta side-by-side logbook editor.
- **Mobile Layout**: Floating glass bottom navbar (`fixed bottom-4 z-50`), aman dari tumpang-tindih scroll (`pb-28`).
- **Official Branding**: Menggunakan Logo Emas Resmi Universitas Putra Bangsa (`logo-upb.png`).

### 📷 2. Anti-Fraud Live Camera Viewfinder
- Membuka aliran video kamera depan HP/perangkat secara langsung (`facingMode: "user"`).
- Tidak menyediakan tombol upload foto dari galeri pada saat presensi untuk mencegah kecurangan/titip presensi.

### 🌐 3. GPS Geofencing (Formula Haversine Real-time)
- Menghitung jarak fisik presisi antara koordinat GPS HP mahasiswa dan koordinat target instansi magang:
  $$d = 2R \times \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)}\right)$$
- Tombol **Submit Presensi** terkunci otomatis jika mahasiswa berada di luar radius kantor (misal: > 50 meter).

### ⏰ 4. Work End Time Check-Out Guardrail
- Presensi Pulang **DILINDUNGI & DIKUNCI** secara otomatis oleh sistem sebelum jam kerja pulang yang telah dikonfigurasi (Default: **Pukul 16:00 WIB**).
- Jika mahasiswa mencoba Presensi Pulang sebelum jam tersebut (misal: pukul 10.47 WIB), tombol akan terkunci dan menampilkan notifikasi peringatan:
  `"BELUM WAKTU PULANG: Presensi Pulang hanya dapat dilakukan setelah jam kerja selesai (Pukul 16:00 WIB)."`

### 🔒 5. Logbook Check-Out Guardrail
- Mahasiswa **WAJIB** mengisi & menyimpan kegiatan harian (*Daily Logbook*) hari ini terlebih dahulu sebelum diizinkan melakukan **Presensi Pulang**.

### 🏢 6. Konfigurasi Instansi & Audit Logs
- Pengaturan Nama Instansi, Koordinat GPS Target, Radius Geofence, Jam Kerja, dan Periode Magang.
- **Locking Mechanism**: Koordinat & tanggal mulai terkunci otomatis permanen setelah check-in pertama tercatat.
- Perubahan tanggal selesai dicatat ke dalam `duration_audit_logs`.

### 🚀 7. Mandatory Onboarding Setup
- Pendaftaran akun baru (`isNewUser: true`) secara otomatis mengarahkan mahasiswa ke **Langkah Awal Konfigurasi Instansi Magang** sebelum mengaktifkan akses penuh ke Dashboard.

### 👤 8. Profil Mahasiswa & Device Photo Upload
- Mengelola data mahasiswa (Nama, NIM, Email, Perguruan Tinggi).
- Pengunggah foto profil pribadi langsung dari penyimpanan perangkat HP/Laptop dengan kompresi otomatis Canvas (400x400) yang aman dari *infinite loading*.

---

## 🛠️ 3. TEKNOLOGI YANG DIGUNAKAN

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (Vite) | Single Page Application super cepat & modern |
| **Styling** | Tailwind CSS v4 | Responsive utility classes & glassmorphism |
| **Icon Set** | Lucide React | Ikon UI modern & presisi |
| **Database Cloud** | Firebase Firestore | Database NoSQL cloud real-time terpusat |
| **Authentication** | Firebase Auth | Autentikasi akun mahasiswa terenkripsi |
| **Storage Fallback** | LocalStorage | Mode penyimpanan lokal terisolasi |
| **Animations** | Canvas Confetti | Efek perayaan pergerakan sukses |

---

## 💻 4. PANDUAN JALANKAN SECARA LOKAL

### Langkah-Langkah:
```bash
npm install
npm run build
npx vite preview --host --port 4173
```

---

## 🌐 5. PANDUAN HOSTING & DEPLOYMENT (VERCEL)

```bash
npm run build
npx vercel --prod
```

---

### 🎓 Hak Cipta & Pengembang
Dibuat untuk **Universitas Putra Bangsa (UPB)**.
*Sistem Portal Presensi & Logbook Mahasiswa Magang.*
