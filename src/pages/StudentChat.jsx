import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  MessageSquare, UserPlus, Send, Search, Users,
  Plus, CheckCircle2, AlertCircle, Sparkles, Check, X, ArrowLeft
} from 'lucide-react';

export function StudentChatPage() {
  const { currentUser, allUsers } = useAuth();
  const {
    studentFriends,
    studentChats,
    groupMessages,
    customGroups,
    addStudentFriendByNim,
    sendStudentChatMessage,
    sendGroupChatMessage,
    createCustomGroup,
    purgeOldStudentChats
  } = useApp();

  const [activeTabType, setActiveTabType] = useState('group'); // 'group' | 'private'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFriendUid, setSelectedFriendUid] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  
  const [privateMessageInput, setPrivateMessageInput] = useState('');
  const [groupMessageInput, setGroupMessageInput] = useState('');
  
  // Modals & Toasts
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [nimInput, setNimInput] = useState('');
  
  // Create Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberUids, setSelectedMemberUids] = useState([]);
  const [groupNimInput, setGroupNimInput] = useState('');

  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const privateChatRef = useRef(null);
  const groupChatRef = useRef(null);

  // Background check for expired chats (under the hood)
  useEffect(() => {
    purgeOldStudentChats();
    const interval = setInterval(() => {
      purgeOldStudentChats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Student Users for friends & group members selection
  const studentUsers = (allUsers || []).filter(
    u => (u.role || 'student') === 'student' && u.uid !== currentUser?.uid
  );

  // 1. Friends list
  const friendsListMap = new Map();
  (studentFriends || []).forEach(f => {
    friendsListMap.set(f.uid, f);
  });
  studentUsers.forEach(s => {
    if (!friendsListMap.has(s.uid)) {
      friendsListMap.set(s.uid, {
        uid: s.uid,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        avatarUrl: s.avatarUrl,
        addedAt: null
      });
    }
  });

  const allDisplayFriends = Array.from(friendsListMap.values()).filter(f => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.studentId || '').toLowerCase().includes(q)
    );
  });

  // 2. Custom Groups for current user (created by user or user is a member)
  const myCustomGroups = (customGroups || []).filter(g => {
    const isMember = g.memberUids?.includes(currentUser?.uid) || g.createdByUid === currentUser?.uid;
    const matchesSearch = (g.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return isMember && matchesSearch;
  });

  // Active Group Details
  const activeGroup = myCustomGroups.find(g => g.id === selectedGroupId) || myCustomGroups[0];

  // Active Private Friend Details
  const activeFriend = allDisplayFriends.find(f => f.uid === selectedFriendUid) || allDisplayFriends[0];

  // Messages thread for active group
  const activeGroupMessages = activeGroup
    ? (groupMessages || []).filter(m => m.groupId === activeGroup.id)
    : [];

  // Messages thread for active private friend
  const activePrivateMessages = activeFriend
    ? (studentChats || []).filter(
        m =>
          (m.senderUid === currentUser?.uid && m.recipientUid === activeFriend.uid) ||
          (m.senderUid === activeFriend.uid && m.recipientUid === currentUser?.uid)
      )
    : [];

  // Auto scroll on new message
  useEffect(() => {
    if (privateChatRef.current) {
      privateChatRef.current.scrollTop = privateChatRef.current.scrollHeight;
    }
    if (groupChatRef.current) {
      groupChatRef.current.scrollTop = groupChatRef.current.scrollHeight;
    }
  }, [activePrivateMessages.length, activeGroupMessages.length, activeTabType, selectedGroupId, selectedFriendUid]);

  // Handle Add Friend by NIM
  const handleAddFriendSubmit = async (e) => {
    e.preventDefault();
    try {
      const added = await addStudentFriendByNim(nimInput, allUsers);
      showToast(`Berhasil menambahkan ${added.name} (NIM: ${added.studentId}) ke daftar teman!`);
      setSelectedFriendUid(added.uid);
      setActiveTabType('private');
      setMobileShowChat(true);
      setNimInput('');
      setIsAddFriendModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan teman.', 'error');
    }
  };

  // Handle Create Custom Group
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showToast('Mohon masukkan nama grup.', 'error');
      return;
    }

    try {
      const created = await createCustomGroup({
        groupName: newGroupName,
        memberUids: selectedMemberUids
      });

      showToast(`Grup "${created.name}" berhasil dibuat!`);
      setSelectedGroupId(created.id);
      setActiveTabType('group');
      setMobileShowChat(true);
      setNewGroupName('');
      setSelectedMemberUids([]);
      setIsCreateGroupModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Gagal membuat grup baru.', 'error');
    }
  };

  // Handle Add Member by NIM in Create Group Form
  const handleAddGroupMemberByNim = (e) => {
    e.preventDefault();
    const nim = groupNimInput.trim();
    if (!nim) return;
    const target = studentUsers.find(u => u.studentId === nim);
    if (!target) {
      showToast(`Mahasiswa dengan NIM ${nim} tidak ditemukan.`, 'error');
      return;
    }
    if (selectedMemberUids.includes(target.uid)) {
      showToast(`Mahasiswa ${target.name} sudah ada dalam anggota grup.`, 'error');
      return;
    }
    setSelectedMemberUids(prev => [...prev, target.uid]);
    setGroupNimInput('');
    showToast(`Ditambahkan: ${target.name} (${target.studentId})`);
  };

  // Toggle member selection in Create Group Form
  const toggleMemberSelection = (uid) => {
    setSelectedMemberUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  // Handle Send Private Message
  const handleSendPrivateMessage = async (e) => {
    e.preventDefault();
    if (!privateMessageInput.trim() || !activeFriend) return;
    try {
      await sendStudentChatMessage({
        recipientUid: activeFriend.uid,
        recipientNim: activeFriend.studentId,
        message: privateMessageInput
      });
      setPrivateMessageInput('');
    } catch (err) {
      showToast('Gagal mengirim pesan.', 'error');
    }
  };

  // Handle Send Group Message
  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!groupMessageInput.trim() || !activeGroup) return;
    try {
      await sendGroupChatMessage({
        groupId: activeGroup.id,
        companyName: activeGroup.name,
        message: groupMessageInput
      });
      setGroupMessageInput('');
    } catch (err) {
      showToast('Gagal mengirim pesan grup.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all ${
          toastMsg.type === 'error'
            ? 'bg-red-900/95 text-white border-red-500'
            : 'bg-slate-900/95 text-white border-emerald-400'
        }`}>
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMsg.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 border border-sky-300/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-bold mb-2">
              <MessageSquare className="w-4 h-4 text-amber-300" />
              PORTAL DISKUSI MAHASISWA UPB
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ruang Chat & Grup Diskusi Mahasiswa
            </h1>
            <p className="text-slate-200 text-xs mt-1 max-w-xl">
              Buat grup diskusi secara bebas atau berkirim pesan personal antar mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-900 font-black text-xs shadow-md hover:bg-blue-50 flex items-center gap-1.5 transition border border-amber-300"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Buat Grup Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Sidebar: Group / Personal Tabs & Item List */}
        <div className={`lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3 flex-col h-[620px] ${
          mobileShowChat ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Tab Switcher: Grup Diskusi vs Personal */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setActiveTabType('group');
                setMobileShowChat(false);
              }}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                activeTabType === 'group'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Grup Saya ({myCustomGroups.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTabType('private');
                setMobileShowChat(false);
              }}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 ${
                activeTabType === 'private'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Personal ({allDisplayFriends.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTabType === 'group' ? "Cari nama grup..." : "Cari nama / NIM..."}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeTabType === 'group' ? (
              <>
                {myCustomGroups.map((grp) => {
                  const isSelected = activeGroup?.id === grp.id;
                  return (
                    <button
                      key={grp.id}
                      onClick={() => {
                        setSelectedGroupId(grp.id);
                        setMobileShowChat(true);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        <Users className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{grp.name}</p>
                        <p className="text-[10px] text-blue-600 font-medium">
                          {grp.memberUids?.length || 1} Anggota
                        </p>
                      </div>
                    </button>
                  );
                })}

                {myCustomGroups.length === 0 && (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Belum ada grup yang diikuti.</p>
                    <button
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Grup Pertama</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Daftar Mahasiswa</span>
                  <button
                    onClick={() => setIsAddFriendModalOpen(true)}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ NIM</span>
                  </button>
                </div>

                {allDisplayFriends.map((friend) => {
                  const isSelected = activeFriend?.uid === friend.uid;
                  return (
                    <button
                      key={friend.uid}
                      onClick={() => {
                        setSelectedFriendUid(friend.uid);
                        setMobileShowChat(true);
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={friend.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={friend.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-blue-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{friend.name}</p>
                        <p className="text-[10px] text-blue-600 font-mono font-semibold">NIM: {friend.studentId}</p>
                      </div>
                    </button>
                  );
                })}

                {allDisplayFriends.length === 0 && (
                  <div className="py-10 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">Tidak ada mahasiswa ditemukan.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Main Area: Chat Window */}
        <div className={`lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex-col h-[620px] ${
          mobileShowChat ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* OPTION 1: CUSTOM GROUP CHAT THREAD */}
          {activeTabType === 'group' && activeGroup ? (
            <>
              {/* Header Active Custom Group */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 shrink-0"
                    title="Kembali ke Daftar Chat"
                  >
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Kembali</span>
                  </button>
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                    <Users className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{activeGroup.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">
                      {activeGroup.memberUids?.length || 1} Anggota • Dibuat oleh {activeGroup.createdByName || 'Mahasiswa'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Messages Stream */}
              <div ref={groupChatRef} className="flex-1 overflow-y-auto space-y-3 p-2">
                {activeGroupMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">Belum Ada Pesan di Grup "{activeGroup.name}"</h4>
                    <p className="text-xs max-w-sm">
                      Mulailah berdiskusi dengan anggota grup Anda di bawah ini!
                    </p>
                  </div>
                ) : (
                  activeGroupMessages.map((msg) => {
                    const isSelf = msg.senderUid === currentUser?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <img
                          src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover border border-blue-500 shrink-0 mt-1"
                        />

                        <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs space-y-1 shadow-xs ${
                          isSelf
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-3 border-b pb-1 mb-1 border-white/20">
                            <span className="font-bold text-[11px]">
                              {isSelf ? 'Saya' : msg.senderName}
                            </span>
                            <span className="text-[9px] opacity-80 font-mono">
                              NIM: {msg.senderNim || '-'}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>

                          <p className="text-[9px] text-right opacity-60 font-mono pt-1">
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Group Message Input Form */}
              <form onSubmit={handleSendGroupMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={groupMessageInput}
                  onChange={(e) => setGroupMessageInput(e.target.value)}
                  placeholder={`Tulis pesan untuk grup ${activeGroup.name}...`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                />

                <button
                  type="submit"
                  className="py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Ke Grup</span>
                </button>
              </form>
            </>
          ) : activeTabType === 'group' ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <button
                onClick={() => setMobileShowChat(false)}
                className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold mb-2 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Kembali ke Daftar Chat</span>
              </button>
              <Users className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Belum Ada Grup Diskusi</h3>
              <p className="text-xs max-w-xs">
                Klik tombol "Buat Grup Baru" di kanan atas untuk membuat grup diskusi custom.
              </p>
            </div>
          ) : null}

          {/* OPTION 2: PRIVATE 1-ON-1 CHAT THREAD */}
          {activeTabType === 'private' && activeFriend ? (
            <>
              {/* Header Active Friend */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 shrink-0"
                    title="Kembali ke Daftar Chat"
                  >
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Kembali</span>
                  </button>
                  <img
                    src={activeFriend.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={activeFriend.name}
                    className="w-11 h-11 rounded-2xl object-cover border-2 border-blue-500 shadow-xs"
                  />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{activeFriend.name}</h3>
                    <p className="text-xs font-mono font-bold text-blue-600">NIM: {activeFriend.studentId}</p>
                  </div>
                </div>
              </div>

              {/* Private Chat Thread Messages */}
              <div ref={privateChatRef} className="flex-1 overflow-y-auto space-y-3 p-2">
                {activePrivateMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-semibold">Belum ada obrolan dengan {activeFriend.name}.</p>
                    <p className="text-[11px] max-w-sm">Mulailah percakapan personal!</p>
                  </div>
                ) : (
                  activePrivateMessages.map((msg) => {
                    const isSelf = msg.senderUid === currentUser?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl p-3.5 text-xs space-y-1 shadow-xs ${
                            isSelf
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                          }`}
                        >
                          <p className="font-bold text-[10px] opacity-80">
                            {isSelf ? 'Saya' : msg.senderName}
                          </p>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <p className="text-[9px] text-right opacity-60 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Private Message Input Form */}
              <form onSubmit={handleSendPrivateMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={privateMessageInput}
                  onChange={(e) => setPrivateMessageInput(e.target.value)}
                  placeholder={`Tulis pesan personal untuk ${activeFriend.name}...`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                />

                <button
                  type="submit"
                  className="py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>
              </form>
            </>
          ) : activeTabType === 'private' ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <button
                onClick={() => setMobileShowChat(false)}
                className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold mb-2 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>Kembali ke Daftar Chat</span>
              </button>
              <Users className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Pilih Teman untuk Memulai Obrolan</h3>
              <p className="text-xs max-w-xs">
                Klik tombol "+ NIM" di kiri atas untuk menambahkan teman baru dengan memasukkan NIM mereka.
              </p>
            </div>
          ) : null}

        </div>

      </div>

      {/* MODAL 1: BUAT GRUP BARU */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Buat Grup Diskusi Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Grup *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Contoh: Kelompok Project Web Magang"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Add Member by NIM Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tambah Anggota via NIM (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupNimInput}
                    onChange={(e) => setGroupNimInput(e.target.value)}
                    placeholder="Masukkan NIM (misal: 210101234)"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddGroupMemberByNim}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 transition"
                  >
                    Tambah NIM
                  </button>
                </div>
              </div>

              {/* Student Checkbox List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Pilih Dari Daftar Mahasiswa ({studentUsers.length})
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  {studentUsers.map((stu) => {
                    const isSelected = selectedMemberUids.includes(stu.uid);
                    return (
                      <label
                        key={stu.uid}
                        onClick={() => toggleMemberSelection(stu.uid)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={stu.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={stu.name}
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{stu.name}</p>
                            <p className="text-[10px] text-blue-600 font-mono">NIM: {stu.studentId}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-xs shadow-md shadow-blue-500/20"
                >
                  Buat Grup Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH TEMAN VIA NIM (PERSONAL) */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Tambah Teman Mahasiswa</span>
              </h3>
              <button
                onClick={() => setIsAddFriendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFriendSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan NIM Mahasiswa UPB *
                </label>
                <input
                  type="text"
                  required
                  value={nimInput}
                  onChange={(e) => setNimInput(e.target.value)}
                  placeholder="Contoh: 210101234"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan mencari mahasiswa berdasarkan NIM yang sudah terdaftar di portal.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Cari & Tambah Teman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
