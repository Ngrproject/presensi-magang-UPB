import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  GraduationCap, MessageSquare, Paperclip, Send,
  FileText, CheckCircle2, XCircle, Clock, UserCheck,
  Search, Calendar, MapPin, Sparkles, Download, AlertCircle,
  File, User, Check, X, Eye, BookOpen, Camera, Image
} from 'lucide-react';

export function BimbinganPage() {
  const { currentUser, allUsers } = useAuth();
  const {
    mentorshipRequests,
    bimbinganMessages,
    requestMentorship,
    respondMentorship,
    sendBimbinganMessage,
    allPresenceLogs,
    allLogbooks
  } = useApp();

  const isLecturer = currentUser?.role === 'lecturer';

  // --- STUDENT STATE ---
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [studentMessageInput, setStudentMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // { name, type, dataUrl }
  const fileInputRef = useRef(null);

  // --- LECTURER STATE ---
  const [selectedStudentUid, setSelectedStudentUid] = useState(null);
  const [lecturerSubTab, setLecturerSubTab] = useState('chat'); // 'chat' | 'presence' | 'logbook'
  const [lecturerMessageInput, setLecturerMessageInput] = useState('');
  const [previewLogbookPhoto, setPreviewLogbookPhoto] = useState(null);

  const lecturersList = allUsers.filter(u => u.role === 'lecturer');

  // Find active mentorship request for current student
  const rawStudentReq = mentorshipRequests.find(r => 
    (
      (currentUser?.uid && (r.studentUid === currentUser.uid || r.studentId === currentUser.uid)) ||
      (currentUser?.studentId && (r.studentUid === currentUser.studentId || r.studentId === currentUser.studentId)) ||
      (currentUser?.name && r.studentName && r.studentName.toLowerCase() === currentUser.name.toLowerCase()) ||
      (currentUser?.email && r.studentEmail && r.studentEmail.toLowerCase() === currentUser.email.toLowerCase())
    ) && r.status === 'APPROVED'
  ) || mentorshipRequests.find(r => 
    (
      (currentUser?.uid && (r.studentUid === currentUser.uid || r.studentId === currentUser.uid)) ||
      (currentUser?.studentId && (r.studentUid === currentUser.studentId || r.studentId === currentUser.studentId)) ||
      (currentUser?.name && r.studentName && r.studentName.toLowerCase() === currentUser.name.toLowerCase()) ||
      (currentUser?.email && r.studentEmail && r.studentEmail.toLowerCase() === currentUser.email.toLowerCase())
    )
  );

  // If Admin assigned a lecturer to currentUser profile, currentUser.assignedLecturerName takes precedence
  const studentReq = currentUser?.assignedLecturerName ? {
    ...(rawStudentReq || {}),
    id: rawStudentReq?.id || `req_${currentUser?.uid || currentUser?.studentId}_admin`,
    studentId: currentUser?.studentId || '',
    studentUid: currentUser?.uid || currentUser?.studentId || '',
    studentName: currentUser?.name || 'Mahasiswa',
    studentEmail: currentUser?.email || '',
    studentUniversity: currentUser?.university || 'Universitas Putra Bangsa (UPB)',
    lecturerId: currentUser?.assignedLecturerId || rawStudentReq?.lecturerId || '',
    lecturerName: currentUser?.assignedLecturerName,
    status: 'APPROVED',
    createdAt: rawStudentReq?.createdAt || new Date().toISOString(),
    respondedAt: rawStudentReq?.respondedAt || new Date().toISOString(),
    assignedByAdmin: true
  } : rawStudentReq;

  // Filter messages for current request
  const studentMessages = studentReq ? bimbinganMessages.filter(m => m.requestId === studentReq.id || (studentReq.assignedByAdmin && (m.requestId.includes(currentUser?.uid) || m.requestId.includes(currentUser?.studentId)))) : [];

  // Filter requests & assigned students for lecturer
  const isMyLecturer = (lecturerId, lecturerName) => {
    if (!currentUser) return false;
    const myId = currentUser.studentId || currentUser.uid;
    const myUid = currentUser.uid;
    const myName = currentUser.name;
    return Boolean(
      (lecturerId && (lecturerId === myId || lecturerId === myUid)) ||
      (lecturerName && myName && lecturerName.toLowerCase() === myName.toLowerCase())
    );
  };

  // Build combined list of approved students for this lecturer
  const approvedStudentsMap = new Map();

  // 1. Add all students from allUsers who are currently assigned to this lecturer
  allUsers.forEach(u => {
    if ((u.role || 'student') === 'student' && isMyLecturer(u.assignedLecturerId, u.assignedLecturerName)) {
      const existingReq = mentorshipRequests.find(r =>
        r.studentUid === u.uid || r.studentId === u.studentId || (r.studentName && u.name && r.studentName.toLowerCase() === u.name.toLowerCase())
      );
      const reqId = existingReq?.id || `req_${u.uid || u.studentId}_admin`;
      approvedStudentsMap.set(u.uid || u.studentId, {
        id: reqId,
        studentId: u.studentId,
        studentUid: u.uid || u.studentId,
        studentName: u.name,
        studentEmail: u.email,
        studentUniversity: u.university || 'Universitas Putra Bangsa (UPB)',
        lecturerId: u.assignedLecturerId || currentUser?.studentId || currentUser?.uid,
        lecturerName: u.assignedLecturerName || currentUser?.name,
        status: 'APPROVED',
        assignedByAdmin: true
      });
    }
  });

  // 2. Add approved requests from mentorshipRequests ONLY IF the student hasn't been re-assigned to a DIFFERENT lecturer in allUsers
  mentorshipRequests.forEach(r => {
    if (r.status === 'APPROVED' && isMyLecturer(r.lecturerId, r.lecturerName)) {
      const targetUser = allUsers.find(u => u.uid === r.studentUid || u.studentId === r.studentId || (u.name && r.studentName && u.name.toLowerCase() === r.studentName.toLowerCase()));
      if (targetUser && targetUser.assignedLecturerId && !isMyLecturer(targetUser.assignedLecturerId, targetUser.assignedLecturerName)) {
        return; // Exclude student because Admin assigned them to a different lecturer!
      }
      const key = r.studentUid || r.studentId;
      if (!approvedStudentsMap.has(key)) {
        approvedStudentsMap.set(key, r);
      }
    }
  });

  const approvedStudents = Array.from(approvedStudentsMap.values());

  // 3. Pending requests for this lecturer (excluding students re-assigned to different lecturers)
  const pendingRequests = mentorshipRequests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (!isMyLecturer(r.lecturerId, r.lecturerName)) return false;
    const targetUser = allUsers.find(u => u.uid === r.studentUid || u.studentId === r.studentId || (u.name && r.studentName && u.name.toLowerCase() === r.studentName.toLowerCase()));
    if (targetUser && targetUser.assignedLecturerId && !isMyLecturer(targetUser.assignedLecturerId, targetUser.assignedLecturerName)) {
      return false;
    }
    return true;
  });

  // Selected student request for lecturer workspace
  const activeStudentReq = approvedStudents.find(r => r.studentUid === selectedStudentUid) || approvedStudents[0];
  const activeStudentMessages = activeStudentReq ? bimbinganMessages.filter(m => m.requestId === activeStudentReq.id) : [];

  // Presence and Logbooks for selected student in lecturer view
  const targetStudentPresences = activeStudentReq
    ? allPresenceLogs.filter(p => p.userId === activeStudentReq.studentUid)
    : [];
  const targetStudentLogbooks = activeStudentReq
    ? allLogbooks.filter(l => l.userId === activeStudentReq.studentUid)
    : [];

  // File Upload Handler (Converts PDF / Word / Image to Base64)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc') ? 'WORD' : 'FILE',
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Student submit request
  const handleStudentSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedLecturerId) {
      alert("Silakan pilih Dosen Pembimbing terlebih dahulu!");
      return;
    }
    const chosenLecturer = lecturersList.find(l => l.studentId === selectedLecturerId || l.uid === selectedLecturerId);
    if (!chosenLecturer) return;

    await requestMentorship({
      lecturerId: chosenLecturer.studentId || chosenLecturer.uid,
      lecturerName: chosenLecturer.name
    });
    alert(`Pengajuan Bimbingan berhasil dikirim ke ${chosenLecturer.name}!`);
  };

  // Student send chat message
  const handleStudentSendMessage = async (e) => {
    e.preventDefault();
    if ((!studentMessageInput.trim() && !selectedFile) || !studentReq) return;

    await sendBimbinganMessage({
      requestId: studentReq.id,
      message: studentMessageInput,
      fileName: selectedFile?.name || null,
      fileDataUrl: selectedFile?.dataUrl || null,
      fileType: selectedFile?.type || null
    });

    setStudentMessageInput('');
    setSelectedFile(null);
  };

  // Lecturer send chat message
  const handleLecturerSendMessage = async (e) => {
    e.preventDefault();
    if ((!lecturerMessageInput.trim() && !selectedFile) || !activeStudentReq) return;

    await sendBimbinganMessage({
      requestId: activeStudentReq.id,
      message: lecturerMessageInput,
      fileName: selectedFile?.name || null,
      fileDataUrl: selectedFile?.dataUrl || null,
      fileType: selectedFile?.type || null
    });

    setLecturerMessageInput('');
    setSelectedFile(null);
  };

  // ==========================================
  // VIEW FOR DOSEN PEMBIMBING (LECTURER)
  // ==========================================
  if (isLecturer) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 border border-sky-300/40 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold mb-2">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                PORTAL DOSEN PEMBIMBING MAGANG UPB
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Bimbingan & Monitoring Mahasiswa
              </h1>
              <p className="text-slate-300 text-xs mt-1 max-w-xl">
                Kelola persetujuan bimbingan, bertukar pesan & berkas Word/PDF, serta pantau presensi dan logbook harian mahasiswa secara online.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
              <UserCheck className="w-8 h-8 text-amber-400 p-1.5 bg-white/10 rounded-xl" />
              <div>
                <p className="text-[10px] text-slate-300 font-medium">NIDN Dosen</p>
                <p className="text-xs font-bold text-white">{currentUser?.studentId}</p>
                <p className="text-[11px] text-blue-300 font-semibold">{currentUser?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <Clock className="w-5 h-5 text-amber-600 animate-spin" />
              <span>Permohonan Bimbingan Masuk ({pendingRequests.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {req.studentName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-slate-900 truncate">{req.studentName}</h4>
                      <p className="text-[10px] text-blue-600 font-mono font-bold">NIM: {req.studentId}</p>
                      <p className="text-[10px] text-slate-500 truncate">{req.studentUniversity}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                    <button
                      onClick={() => respondMentorship(req.id, 'APPROVED')}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>
                    <button
                      onClick={() => respondMentorship(req.id, 'REJECTED')}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Students Workspace */}
        {approvedStudents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Mahasiswa Bimbingan Approved</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ketika mahasiswa mengajukan Anda sebagai Dosen Pembimbing dan Anda menyetujuinya, ruang bimbingan dan monitoring akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Left Sidebar: Student Selection List */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider px-2">
                Mahasiswa Bimbingan ({approvedStudents.length})
              </h3>

              <div className="space-y-2">
                {approvedStudents.map((req) => {
                  const isSelected = (selectedStudentUid || approvedStudents[0].studentUid) === req.studentUid;
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedStudentUid(req.studentUid)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {req.studentName?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{req.studentName}</p>
                        <p className="text-[10px] text-blue-600 font-mono font-semibold">NIM: {req.studentId}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Main Area: Workspace for Selected Student */}
            {activeStudentReq && (
              <div className="lg:col-span-3 space-y-4">

                {/* Top Student Banner & Sub-tab Navigation */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                      {activeStudentReq.studentName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{activeStudentReq.studentName}</h3>
                      <p className="text-xs text-blue-600 font-mono font-bold">NIM: {activeStudentReq.studentId}</p>
                      <p className="text-[10px] text-slate-500">{activeStudentReq.studentUniversity}</p>
                    </div>
                  </div>

                  {/* Sub Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => setLecturerSubTab('chat')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${lecturerSubTab === 'chat'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat & Berkas</span>
                    </button>

                    <button
                      onClick={() => setLecturerSubTab('presence')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${lecturerSubTab === 'presence'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Presensi ({targetStudentPresences.length})</span>
                    </button>

                    <button
                      onClick={() => setLecturerSubTab('logbook')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${lecturerSubTab === 'logbook'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Logbook ({targetStudentLogbooks.length})</span>
                    </button>
                  </div>
                </div>

                {/* SUB TAB 1: CHAT & BERKAS BIMBINGAN */}
                {lecturerSubTab === 'chat' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col h-[520px]">
                    <div className="flex-1 overflow-y-auto space-y-3 p-2">
                      {activeStudentMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                          <MessageSquare className="w-10 h-10 text-slate-300" />
                          <p className="text-xs font-semibold">Belum ada pesan bimbingan dengan {activeStudentReq.studentName}.</p>
                          <p className="text-[11px]">Mulailah menyapa atau memberikan arahan bimbingan di bawah ini.</p>
                        </div>
                      ) : (
                        activeStudentMessages.map((msg) => {
                          const isSelf = msg.senderId === currentUser?.uid;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-2 shadow-xs ${isSelf
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                                  }`}
                              >
                                <p className="font-bold text-[10px] opacity-80">{msg.senderName} ({msg.senderRole === 'lecturer' ? 'Dosen Pembimbing' : 'Mahasiswa'})</p>

                                {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}

                                {msg.fileName && msg.fileDataUrl && (
                                  <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${isSelf ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                                    <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold truncate">{msg.fileName}</p>
                                      <span className="text-[9px] opacity-75">{msg.fileType || 'Dokumen'}</span>
                                    </div>
                                    <a
                                      href={msg.fileDataUrl}
                                      download={msg.fileName}
                                      className={`p-1.5 rounded-lg border transition ${isSelf ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : 'bg-slate-100 hover:bg-blue-50 text-blue-600 border-slate-300'}`}
                                      title="Unduh Berkas"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                )}

                                <p className="text-[9px] text-right opacity-60">
                                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* File Badge Preview */}
                    {selectedFile && (
                      <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold">
                        <span className="truncate">📎 File Lampiran: {selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold ml-2">✕</button>
                      </div>
                    )}

                    {/* Chat Input Form */}
                    <form onSubmit={handleLecturerSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                        title="Upload Dokumen PDF / Word"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={lecturerMessageInput}
                        onChange={(e) => setLecturerMessageInput(e.target.value)}
                        placeholder="Tulis balasan atau masukan bimbingan..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />

                      <button
                        type="submit"
                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* SUB TAB 2: MONITORING PRESENSI */}
                {lecturerSubTab === 'presence' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-800">
                      Riwayat Presensi Mahasiswa ({targetStudentPresences.length} Catatan)
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Foto Selfie</th>
                            <th className="p-3">Masuk</th>
                            <th className="p-3">Keluar</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {targetStudentPresences.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-700">{p.dateStr}</td>
                              <td className="p-3">
                                {p.checkInPhoto ? (
                                  <img src={p.checkInPhoto} alt="Selfie" className="w-10 h-10 rounded-xl object-cover border" />
                                ) : (
                                  <span className="text-[10px] text-slate-400">Tidak ada</span>
                                )}
                              </td>
                              <td className="p-3 font-mono">{p.checkInTime || '-'}</td>
                              <td className="p-3 font-mono">{p.checkOutTime || '-'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${p.checkInStatus === 'TEPAT WAKTU' || p.checkInStatus === 'HADIR TEPAT WAKTU'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : p.checkInStatus === 'TERLAMBAT'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                  {p.checkInStatus}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {targetStudentPresences.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                                Belum ada riwayat presensi recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB 3: MONITORING LOGBOOK */}
                {lecturerSubTab === 'logbook' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-800">
                      Riwayat Logbook Harian Mahasiswa ({targetStudentLogbooks.length} Laporan)
                    </h4>

                    <div className="space-y-3">
                      {targetStudentLogbooks.map((log) => (
                        <div key={log.id} className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-xs font-mono font-bold text-blue-700">{log.dateStr}</span>
                            <span className="text-[10px] text-slate-400">Diperbarui: {new Date(log.updatedAt || Date.now()).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">🎯 Pencapaian:</p>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap pl-2 border-l-2 border-emerald-400">{log.achievements}</p>
                          </div>
                          {log.obstacles && (
                            <div>
                              <p className="text-[11px] font-bold text-amber-700">⚠️ Kendala:</p>
                              <p className="text-xs text-slate-600 whitespace-pre-wrap pl-2 border-l-2 border-amber-400">{log.obstacles}</p>
                            </div>
                          )}
                          {log.progressPhoto && (
                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-[11px] font-bold text-sky-700 flex items-center gap-1">
                                <Image className="w-3.5 h-3.5 text-sky-500" /> Foto Progress / Dokumentasi:
                              </p>
                              <div
                                onClick={() => setPreviewLogbookPhoto(log.progressPhoto)}
                                className="mt-1 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 cursor-pointer group bg-slate-900 shadow-xs"
                              >
                                <img src={log.progressPhoto} alt="Foto Progress" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {targetStudentLogbooks.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada catatan logbook harian.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW FOR MAHASISWA (STUDENT)
  // ==========================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 border border-sky-300/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold mb-2">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              SISTEM BIMBINGAN MAGANG ONLINE UPB
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Bimbingan & Konsultasi Dosen
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Pilih Dosen Pembimbing, ajukan permohonan, dan lakukan bimbingan interaktif serta unggah berkas laporan Word / PDF secara langsung.
            </p>
          </div>
        </div>
      </div>

      {/* CASE 1: NO REQUEST YET */}
      {!studentReq && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Pilih Dosen Pembimbing Magang</h2>
              <p className="text-xs text-slate-500">Pilih dosen dari daftar di bawah untuk mengajukan bimbingan.</p>
            </div>
          </div>

          <form onSubmit={handleStudentSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Daftar Dosen Pembimbing UPB *
              </label>
              <select
                required
                value={selectedLecturerId}
                onChange={(e) => setSelectedLecturerId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Pilih Dosen Pembimbing --</option>
                {lecturersList.map((l) => (
                  <option key={l.uid} value={l.studentId || l.uid}>
                    {l.name} (NIDN: {l.studentId})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-xs shadow-lg shadow-blue-500/20 border border-amber-300/40 transition"
            >
              KIRIM PERMOHONAN BIMBINGAN KE DOSEN
            </button>
          </form>
        </div>
      )}

      {/* CASE 2: REQUEST IS PENDING */}
      {studentReq && studentReq.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <Clock className="w-12 h-12 text-amber-600 mx-auto animate-spin" />
          <h3 className="text-base font-black text-amber-950">Pengajuan Bimbingan Sedang Menunggu Persetujuan</h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Anda telah mengajukan permohonan bimbingan kepada <span className="font-bold">{studentReq.lecturerName}</span>. Silakan menunggu dosen terkait menyetujui permohonan Anda.
          </p>
        </div>
      )}

      {/* CASE 3: REQUEST IS REJECTED */}
      {studentReq && studentReq.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-black text-red-950">Pengajuan Bimbingan Ditolak</h3>
          <p className="text-xs text-red-700">
            Pengajuan bimbingan ke <span className="font-bold">{studentReq.lecturerName}</span> telah ditolak. Silakan ajukan ulang ke dosen pembimbing lain.
          </p>
          <button
            onClick={() => requestMentorship({ lecturerId: '', lecturerName: '' })} // reset logic
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Pilih Dosen Lain
          </button>
        </div>
      )}

      {/* CASE 4: REQUEST IS APPROVED - WORKSPACE */}
      {studentReq && studentReq.status === 'APPROVED' && (
        <div className="space-y-4">

          {/* Dosen Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dosen Pembimbing Saya</p>
                <h3 className="text-sm font-black text-slate-900">{studentReq.lecturerName}</h3>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Disetujui
            </span>
          </div>

          {/* Chat & File Area */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col h-[550px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {studentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-semibold">Ruang bimbingan telah siap!</p>
                  <p className="text-[11px]">Kirimkan salam atau unggah draft berkas Word / PDF bimbingan Anda.</p>
                </div>
              ) : (
                studentMessages.map((msg) => {
                  const isSelf = msg.senderId === currentUser?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-2 shadow-xs ${isSelf
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                          }`}
                      >
                        <p className="font-bold text-[10px] opacity-80">{msg.senderName} ({msg.senderRole === 'lecturer' ? 'Dosen Pembimbing' : 'Mahasiswa'})</p>

                        {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}

                        {msg.fileName && msg.fileDataUrl && (
                          <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${isSelf ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold truncate">{msg.fileName}</p>
                              <span className="text-[9px] opacity-75">{msg.fileType || 'Dokumen'}</span>
                            </div>
                            <a
                              href={msg.fileDataUrl}
                              download={msg.fileName}
                              className={`p-1.5 rounded-lg border transition ${isSelf ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : 'bg-slate-100 hover:bg-blue-50 text-blue-600 border-slate-300'}`}
                              title="Unduh Berkas"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        <p className="text-[9px] text-right opacity-60">
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* File Badge Preview */}
            {selectedFile && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 font-semibold">
                <span className="truncate">📎 File Terlampir: {selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold ml-2">✕</button>
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={handleStudentSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                title="Upload Dokumen PDF / Word"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={studentMessageInput}
                onChange={(e) => setStudentMessageInput(e.target.value)}
                placeholder="Tulis pesan atau pertanyaan bimbingan..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW FOTO PROGRESS LOGBOOK */}
      {previewLogbookPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewLogbookPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 font-bold text-xs flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full border border-white/20"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
            <img
              src={previewLogbookPhoto}
              alt="Foto Progress Logbook"
              className="max-h-[80vh] w-auto object-contain rounded-2xl border-2 border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
