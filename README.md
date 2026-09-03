# 🎓 E-Presensi Magang UPB (PWA)
> **Sistem Portal Presensi Kamera Selfie, Geofencing GPS, Form Pengajuan Izin & Daily Logbook Mahasiswa Universitas Putra Bangsa (UPB)**

![E-Presensi Magang UPB](https://img.shields.io/badge/UNIVERSITAS_PUTRA_BANGSA-UPB-blue?style=for-the-badge&logo=graduation-cap)
![React Vite](https://img.shields.io/badge/React_18-Vite-sky?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase)

---

## 📌 1. TENTANG APLIKASI

**E-Presensi Magang UPB** adalah aplikasi *Single Page Application* (SPA) berstandar **Progressive Web App (PWA)** yang dirancang khusus untuk mahasiswa **Universitas Putra Bangsa (UPB)** yang sedang melaksanakan program Magang / Praktik Kerja Lapangan (PKL).

Aplikasi ini mengintegrasikan **Anti-Fraud Live Camera Selfie**, **Geofencing GPS jarak akurat (Formula Haversine)**, **Form Pengajuan Ketidakhadiran (Sakit, Izin, Libur)**, **Kalkulasi Otomatis Status Alpha**, **Work End Time Check-Out Guardrail**, **Guardrail Daily Logbook**, **Duration Audit Logs**, serta **Cloud Real-time Sync** ke Google Firebase Firestore.

---

## ✨ 2. FITUR-FITUR UTAMA

### 📱 1. Responsive & Anti-Gravity UI Design
- **Desktop Layout**: Navigation header top bar, 3-column grid dashboard, 2-column presensi & instansi configuration, serta side-by-side logbook editor.
- **Mobile Layout**: Floating glass bottom navbar (`fixed bottom-4 z-50`), aman dari tumpang-tindih scroll (`pb-28`).
- **Official Branding**: Menggunakan Logo Emas Resmi Universitas Putra Bangsa (`logo-upb.png`).

### 📷 2. Anti-Fraud Live Camera Viewfinder
- Membuka aliran video kamera depan HP/perangkat secara langsung (`facingMode: "user"`).
- Kamera terintegrasi secara langsung (*direct embedded*) di dalam kartu presensi.

### 📝 3. Form Pengajuan Izin / Ketidakhadiran
- Tab khusus pengajuan ketidakhadiran tanpa kamera selfie untuk kategori:
  1. 🤒 **SAKIT**: Sakit dengan/tanpa lampiran surat dokter.
  2. ✉️ **IZIN**: Izin kepentingan pribadi/akademik.
  3. 🇮🇩 **LIBUR NASIONAL**: Hari libur kalender nasional resmi.
  4. 🏢 **LIBUR INSTANSI**: Libur internal kantor instansi magang.
- Mendukung unggah foto/lampiran berkas bukti langsung dari perangkat HP/Laptop.

### 📊 4. Rekapitulasi Otomatis Status ALPHA & Kehadiran
- Dashboard menampilkan statistik rekapitulasi kehadiran lengkap: **Hadir**, **Sakit**, **Izin**, **Libur**, dan **Alpha** (Kalkulasi otomatis hari kerja magang yang terlewat tanpa presensi/izin).

### 🌐 5. GPS Geofencing (Formula Haversine Real-time)
- Menghitung jarak fisik presisi antara koordinat GPS HP mahasiswa dan koordinat target instansi magang:
  $$d = 2R \times \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)}\right)$$

### ⏰ 6. Work End Time Check-Out Guardrail
- Presensi Pulang **DILINDUNGI & DIKUNCI** secara otomatis oleh sistem sebelum jam kerja pulang yang telah dikonfigurasi (Default: **Pukul 16:00 WIB**).

### 🔒 7. Logbook Check-Out Guardrail
- Mahasiswa **WAJIB** mengisi & menyimpan kegiatan harian (*Daily Logbook*) hari ini terlebih dahulu sebelum diizinkan melakukan **Presensi Pulang**.

### 👤 8. Profil Mahasiswa & Device Photo Upload
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

---

## 💻 4. PANDUAN JALANKAN SECARA LOKAL

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
