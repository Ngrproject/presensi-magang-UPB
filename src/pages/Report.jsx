import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  FileText, Download, Calendar, Filter, 
  CheckCircle2, Clock, Building2, UserCheck, 
  Stethoscope, Mail, Flag, ShieldAlert, Printer
} from 'lucide-react';

export function ReportPage() {
  const { currentUser } = useAuth();
  const { settings, presenceLogs, logbooks } = useApp();

  const [reportType, setReportType] = useState('akumulasi'); // 'harian' | 'mingguan' | 'bulanan' | 'akumulasi'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Merge Presences and Logbooks by dateStr
  const mergedData = useMemo(() => {
    const datesMap = new Map();

    // Populate from presences
    (presenceLogs || []).forEach((p) => {
      if (!p || !p.dateStr) return;
      datesMap.set(p.dateStr, {
        dateStr: p.dateStr,
        presence: p,
        logbook: null
      });
    });

    // Populate from logbooks
    (logbooks || []).forEach((l) => {
      if (!l || !l.dateStr) return;
      const existing = datesMap.get(l.dateStr) || { dateStr: l.dateStr, presence: null, logbook: null };
      existing.logbook = l;
      datesMap.set(l.dateStr, existing);
    });

    // Convert to sorted array descending
    const list = Array.from(datesMap.values());
    list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
    return list;
  }, [presenceLogs, logbooks]);

  // Filtered dataset according to reportType
  const filteredData = useMemo(() => {
    if (reportType === 'harian') {
      return mergedData.filter((d) => d.dateStr === selectedDate);
    }
    if (reportType === 'bulanan') {
      return mergedData.filter((d) => d.dateStr.startsWith(selectedMonth));
    }
    if (reportType === 'mingguan') {
      // Last 7 days from selectedDate
      const target = new Date(selectedDate);
      const minDate = new Date(target);
      minDate.setDate(minDate.getDate() - 7);
      return mergedData.filter((d) => {
        const curr = new Date(d.dateStr);
        return curr >= minDate && curr <= target;
      });
    }
    // 'akumulasi'
    return mergedData;
  }, [mergedData, reportType, selectedDate, selectedMonth]);

  // Statistics calculation for the filtered report
  const stats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let libur = 0;
    let alpha = 0;

    filteredData.forEach((item) => {
      const p = item.presence;
      if (p) {
        if (p.isLeave) {
          if (p.leaveType === 'SAKIT') sakit++;
          else if (p.leaveType === 'IZIN') izin++;
          else if (p.leaveType === 'LIBUR NASIONAL' || p.leaveType === 'LIBUR INSTANSI') libur++;
        } else if (p.checkInStatus === 'TEPAT WAKTU' || p.checkInStatus === 'HADIR TEPAT WAKTU' || p.checkInStatus === 'HADIR' || p.checkInStatus === 'TERLAMBAT') {
          hadir++;
        }
      }
    });

    return { hadir, sakit, izin, libur, alpha, total: filteredData.length };
  }, [filteredData]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeText = (item) => {
    const p = item.presence;
    if (!p) return item.logbook ? 'HANYA LOGBOOK' : 'ALPHA';
    if (p.isLeave) return `IZIN: ${p.leaveType}`;
    return p.checkInStatus || 'HADIR';
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Print Filter Controls (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-sky-600 to-blue-600 bg-clip-text text-transparent">
              LAPORAN PRESENSI & LOGBOOK MAGANG
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Cetak Laporan Harian, Mingguan, Bulanan & Akumulasi Format Resmi PDF UPB
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 border border-amber-300 flex items-center justify-center gap-2 transition transform active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>DOWNLOAD / CETAK LAPORAN PDF</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Report Type Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setReportType('harian')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                reportType === 'harian' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              📅 Harian
            </button>
            <button
              onClick={() => setReportType('mingguan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                reportType === 'mingguan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              🗓️ Mingguan
            </button>
            <button
              onClick={() => setReportType('bulanan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                reportType === 'bulanan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              📆 Bulanan
            </button>
            <button
              onClick={() => setReportType('akumulasi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                reportType === 'akumulasi' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              📈 Selama Ini (Akumulasi)
            </button>
          </div>

          {/* Date Pickers Based on Mode */}
          <div className="flex items-center gap-3">
            {reportType === 'harian' || reportType === 'mingguan' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Pilih Tanggal:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : reportType === 'bulanan' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Pilih Bulan:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-semibold italic">
                Menampilkan seluruh riwayat magang
              </span>
            )}
          </div>

        </div>
      </div>

      {/* PRINTABLE OFFICIAL PDF CONTAINER */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 sm:p-10 print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
        
        {/* OFFICIAL KOP SURAT HEADER UPB */}
        <div className="border-b-4 border-double border-blue-900 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo-upb.png"
              alt="Logo UPB"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <h2 className="text-base sm:text-lg font-black text-blue-950 uppercase tracking-tight">
                UNIVERSITAS PUTRA BANGSA (UPB)
              </h2>
              <p className="text-xs font-bold text-slate-800">
                PORTAL REKAPITULASI MAGANG / PRAKTIK KERJA LAPANGAN (PKL)
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Jl. Ronggowarsito No. 18, Pejagoan, Kebumen | Website: www.universitasputrabangsa.ac.id
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right text-[10px] font-mono text-slate-500">
            <span>DOKUMEN RESMI</span>
            <br />
            <span>Diterbitkan Otomatis</span>
          </div>
        </div>

        {/* REPORT TITLE BANNER */}
        <div className="text-center bg-slate-50 border border-slate-200 py-3 rounded-2xl print:bg-white print:border-slate-400">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide">
            LAPORAN {reportType === 'harian' ? `HARIAN (${selectedDate})` : reportType === 'mingguan' ? `MINGGUAN (HINGGA ${selectedDate})` : reportType === 'bulanan' ? `BULANAN (${selectedMonth})` : 'AKUMULASI SELAMA MAGANG'}
          </h3>
        </div>

        {/* METADATA MAHASISWA & INSTANSI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Nama Mahasiswa</span>
              <span className="font-bold text-slate-950">: {currentUser?.name || 'Mahasiswa UPB'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">NIM Mahasiswa</span>
              <span className="font-mono font-bold text-blue-900">: {currentUser?.studentId || '210101234'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Program Studi</span>
              <span className="font-semibold text-slate-800">: {currentUser?.prodi || 'Informatika / Ilmu Komputer'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Instansi Magang</span>
              <span className="font-bold text-slate-950">: {settings?.companyName || 'Belum Dikonfigurasi'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Periode Magang</span>
              <span className="font-mono text-slate-800">: {settings?.startDate || '-'} s.d. {settings?.endDate || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-600">Tanggal Cetak</span>
              <span className="font-mono text-slate-800">: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* REKAPITULASI STATISTIK RINGKASAN */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 print:border-slate-400">
            <span className="text-[10px] font-bold text-emerald-800 block">HADIR</span>
            <span className="text-base font-black text-emerald-900 font-mono">{stats.hadir}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 print:border-slate-400">
            <span className="text-[10px] font-bold text-red-800 block">SAKIT</span>
            <span className="text-base font-black text-red-900 font-mono">{stats.sakit}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 print:border-slate-400">
            <span className="text-[10px] font-bold text-amber-800 block">IZIN</span>
            <span className="text-base font-black text-amber-900 font-mono">{stats.izin}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-300 print:border-slate-400">
            <span className="text-[10px] font-bold text-sky-800 block">LIBUR</span>
            <span className="text-base font-black text-sky-900 font-mono">{stats.libur}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 print:border-slate-400">
            <span className="text-[10px] font-bold text-rose-800 block">ALPHA</span>
            <span className="text-base font-black text-rose-900 font-mono">{stats.alpha}</span>
          </div>
        </div>

        {/* MAIN DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-blue-900 text-white font-bold text-center print:bg-slate-200 print:text-black">
                <th className="p-2 border border-slate-300 w-10">NO</th>
                <th className="p-2 border border-slate-300 w-28">TANGGAL</th>
                <th className="p-2 border border-slate-300 w-24">PRESENSI</th>
                <th className="p-2 border border-slate-300 w-28">STATUS</th>
                <th className="p-2 border border-slate-300">CAPAIAN / KEGIATAN HARIAN</th>
                <th className="p-2 border border-slate-300">KENDALA & RENCANA</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold italic border border-slate-300">
                    Tidak ada data catatan presensi atau logbook untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.dateStr} className="border border-slate-300 hover:bg-slate-50/80">
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-semibold">{item.dateStr}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono">
                      {item.presence?.isLeave ? (
                        <span className="text-[10px] font-bold text-amber-700">IZIN</span>
                      ) : (
                        <span>
                          {item.presence?.checkInTime || '--:--'} - {item.presence?.checkOutTime || '--:--'}
                        </span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      {getStatusBadgeText(item)}
                    </td>
                    <td className="p-2 border border-slate-300">
                      {item.logbook?.achievements || (item.presence?.reason ? `Izin: ${item.presence.reason}` : '-')}
                    </td>
                    <td className="p-2 border border-slate-300 space-y-1">
                      {item.logbook?.obstacles && (
                        <div className="text-[11px] text-red-700">
                          <strong>Kendala:</strong> {item.logbook.obstacles}
                        </div>
                      )}
                      {item.logbook?.tomorrowPlan && (
                        <div className="text-[11px] text-blue-800">
                          <strong>Rencana:</strong> {item.logbook.tomorrowPlan}
                        </div>
                      )}
                      {!item.logbook?.obstacles && !item.logbook?.tomorrowPlan && '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* OFFICIAL 3-PARTY SIGNATURE BLOCK */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-900 border-t border-slate-200 print:pt-12">
          
          {/* Pembimbing Lapangan Instansi */}
          <div className="space-y-16">
            <div>
              <p className="font-bold">Mengetahui,</p>
              <p className="text-[11px] text-slate-600 font-medium">Pembimbing Lapangan Instansi</p>
            </div>
            <div>
              <p className="font-bold underline uppercase">( ............................................ )</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP / NIK: ..........................</p>
            </div>
          </div>

          {/* Dosen Pembimbing UPB */}
          <div className="space-y-16">
            <div>
              <p className="font-bold">Menyetujui,</p>
              <p className="text-[11px] text-slate-600 font-medium">Dosen Pembimbing Magang UPB</p>
            </div>
            <div>
              <p className="font-bold underline uppercase">( ............................................ )</p>
              <p className="text-[10px] text-slate-500 font-mono">NIDN: ................................</p>
            </div>
          </div>

          {/* Mahasiswa Magang */}
          <div className="space-y-16">
            <div>
              <p className="font-bold">Hormat Saya,</p>
              <p className="text-[11px] text-slate-600 font-medium">Mahasiswa Magang</p>
            </div>
            <div>
              <p className="font-bold underline uppercase">{currentUser?.name || 'Mahasiswa UPB'}</p>
              <p className="text-[10px] text-slate-500 font-mono">NIM: {currentUser?.studentId || '210101234'}</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
