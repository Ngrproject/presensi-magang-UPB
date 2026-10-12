import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, auth, db } from '../utils/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot
} from 'firebase/firestore';

const AuthContext = createContext(null);

const DEFAULT_LECTURERS = [
  {
    uid: 'dosen_1',
    studentId: '0612038401', // NIDN
    name: 'Dr. Hendra Wijaya, M.Kom',
    email: 'hendra.wijaya@upb.ac.id',
    university: 'Universitas Putra Bangsa (UPB)',
    role: 'lecturer',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
  },
  {
    uid: 'dosen_2',
    studentId: '0625078102', // NIDN
    name: 'Dra. Ratna Sarumpaet, M.T.',
    email: 'ratna.sarumpaet@upb.ac.id',
    university: 'Universitas Putra Bangsa (UPB)',
    role: 'lecturer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
  },
  {
    uid: 'dosen_3',
    studentId: '0608118903', // NIDN
    name: 'Budi Pratama, S.T., M.Eng.',
    email: 'budi.pratama@upb.ac.id',
    university: 'Universitas Putra Bangsa (UPB)',
    role: 'lecturer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('presensi_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [allUsers, setAllUsers] = useState(() => {
    const saved = localStorage.getItem('all_registered_users');
    let parsed = saved !== null ? JSON.parse(saved) : null;
    if (parsed === null) {
      parsed = [...DEFAULT_LECTURERS];
      localStorage.setItem('all_registered_users', JSON.stringify(parsed));
    }
    return parsed;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  // Firestore snapshot listener for all users
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const usersRef = collection(db, 'users');
      const unsub = onSnapshot(usersRef, (snap) => {
        const list = [];
        snap.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() });
        });
        setAllUsers(list);
        localStorage.setItem('all_registered_users', JSON.stringify(list));
      }, (err) => {
        console.warn("Firestore all users listener info:", err);
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);

            let userProfile;
            if (userSnap.exists()) {
              userProfile = { uid: user.uid, role: 'student', ...userSnap.data() };
            } else {
              userProfile = {
                uid: user.uid,
                email: user.email,
                studentId: user.displayName || user.email.split('@')[0],
                name: user.displayName || 'Mahasiswa UPB',
                university: 'Universitas Putra Bangsa (UPB)',
                role: 'student',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
              };
              await setDoc(userDocRef, userProfile);
            }

            setCurrentUser(userProfile);
            localStorage.setItem('presensi_user_session', JSON.stringify(userProfile));
          } else {
            const saved = localStorage.getItem('presensi_user_session');
            if (saved) {
              setCurrentUser(JSON.parse(saved));
            } else {
              setCurrentUser(null);
            }
          }
        } catch (err) {
          console.error("Error fetching user profile from Firestore:", err);
        } finally {
          setAuthInitializing(false);
        }
      });
      return () => unsubscribe();
    } else {
      setAuthInitializing(false);
    }
  }, []);

  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return;

    const nextUser = {
      ...currentUser,
      ...updatedFields
    };

    setCurrentUser(nextUser);
    localStorage.setItem('presensi_user_session', JSON.stringify(nextUser));

    if (isFirebaseConfigured && db && currentUser.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), nextUser, { merge: true });
      } catch (err) {
        console.error("Error syncing profile to Firestore:", err);
      }
    }
  };

  const findUserByIdentifier = async (identifierInput) => {
    const identifier = (identifierInput || '').trim();
    if (!identifier) return null;

    // 1. Check local allUsers first
    const localMatch = allUsers.find(
      (u) =>
        (u.studentId && u.studentId.trim().toLowerCase() === identifier.toLowerCase()) ||
        (u.email && u.email.trim().toLowerCase() === identifier.toLowerCase()) ||
        (u.uid && u.uid === identifier)
    );

    // 2. If Firebase is configured, check Firestore
    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        let q;
        if (identifier.includes('@')) {
          q = query(usersRef, where('email', '==', identifier));
        } else {
          q = query(usersRef, where('studentId', '==', identifier));
        }
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          return { uid: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        console.warn("Firestore findUserByIdentifier error:", err);
      }
    }

    return localMatch || null;
  };

  const resetPasswordDirectly = async (identifierInput, newPassword) => {
    setLoading(true);
    setAuthError(null);
    const identifier = (identifierInput || '').trim();

    if (!identifier) {
      setLoading(false);
      const msg = 'Silakan masukkan NIM atau Email akun Anda.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (!newPassword || newPassword.length < 6) {
      setLoading(false);
      const msg = 'Kata sandi baru minimal harus 6 karakter.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const targetUser = await findUserByIdentifier(identifier);

      if (!targetUser) {
        const msg = `Akun dengan NIM atau Email "${identifier}" tidak ditemukan. Pastikan data sudah benar.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      const targetUid = targetUser.uid;
      const updatedFields = {
        password: newPassword,
        passwordUpdatedAt: new Date().toISOString()
      };

      // 1. Update in Firestore if configured
      if (isFirebaseConfigured && db && targetUid) {
        try {
          await setDoc(doc(db, 'users', targetUid), updatedFields, { merge: true });
        } catch (dbErr) {
          console.error("Firestore password update error:", dbErr);
        }
      }

      // 2. Update local state and localStorage
      setAllUsers((prev) => {
        const updated = prev.map((u) => {
          if (
            u.uid === targetUid ||
            (u.studentId && targetUser.studentId && u.studentId.toLowerCase() === targetUser.studentId.toLowerCase()) ||
            (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
          ) {
            return { ...u, ...updatedFields };
          }
          return u;
        });
        localStorage.setItem('all_registered_users', JSON.stringify(updated));
        return updated;
      });

      // 3. Update current session if matching
      const savedSession = localStorage.getItem('presensi_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.uid === targetUid || parsed.studentId === targetUser.studentId) {
          const updatedSession = { ...parsed, ...updatedFields };
          localStorage.setItem('presensi_user_session', JSON.stringify(updatedSession));
          if (currentUser?.uid === targetUid) {
            setCurrentUser(updatedSession);
          }
        }
      }

      return {
        success: true,
        user: { ...targetUser, ...updatedFields }
      };
    } catch (err) {
      console.error("resetPasswordDirectly error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifierInput, password) => {
    setLoading(true);
    setAuthError(null);
    const identifier = (identifierInput || '').trim();

    if (!identifier) {
      setLoading(false);
      setAuthError('Silakan masukkan NIM atau Email Anda.');
      throw new Error('NIM atau Email kosong');
    }

    try {
      if (isFirebaseConfigured && auth && db) {
        let targetEmail = identifier;
        let matchedDocData = null;

        // If identifier is NIM (does not contain @), search Firestore for user email
        if (!identifier.includes('@')) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('studentId', '==', identifier));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const matchedData = querySnapshot.docs[0].data();
              matchedDocData = { uid: querySnapshot.docs[0].id, ...matchedData };
              if (matchedData.email) {
                targetEmail = matchedData.email;
              } else {
                targetEmail = `${identifier}@students.upb.ac.id`;
              }
            } else {
              targetEmail = `${identifier}@students.upb.ac.id`;
            }
          } catch (queryErr) {
            console.warn("NIM lookup in Firestore failed, using default domain fallback:", queryErr);
            targetEmail = `${identifier}@students.upb.ac.id`;
          }
        } else {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', identifier));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              matchedDocData = { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
            }
          } catch {
            // Optional catch binding
          }
        }

        let userCred = null;
        let bypassFirebaseWithFirestore = false;
        const isAdminAccount = identifier.toLowerCase().includes('admin') || targetEmail.toLowerCase().includes('admin');
        const isLecturerAccount = identifier.toLowerCase().includes('dosen') || targetEmail.toLowerCase().includes('dosen');

        try {
          userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
        } catch (signErr) {
          // Check if user has reset password directly in Firestore or allUsers
          const fallbackUser = matchedDocData || allUsers.find(
            (u) =>
              (u.studentId && u.studentId.toLowerCase() === identifier.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === targetEmail.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === identifier.toLowerCase())
          );

          if (fallbackUser && fallbackUser.password && fallbackUser.password === password) {
            bypassFirebaseWithFirestore = true;
          } else if (isAdminAccount && (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential')) {
            try {
              userCred = await createUserWithEmailAndPassword(auth, targetEmail, password);
            } catch (createErr) {
              console.warn("Could not auto-create admin account in Firebase Auth:", createErr);
              throw signErr;
            }
          } else {
            throw signErr;
          }
        }

        let userProfile;
        if (bypassFirebaseWithFirestore) {
          const fallbackUser = matchedDocData || allUsers.find(
            (u) =>
              (u.studentId && u.studentId.toLowerCase() === identifier.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === targetEmail.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === identifier.toLowerCase())
          );
          userProfile = {
            uid: fallbackUser.uid || `user_${identifier}`,
            role: fallbackUser.role || (isAdminAccount ? 'admin' : isLecturerAccount ? 'lecturer' : 'student'),
            ...fallbackUser,
            isNewUser: false
          };
        } else {
          const userDocRef = doc(db, 'users', userCred.user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            userProfile = {
              uid: userCred.user.uid,
              role: data.role || (isAdminAccount ? 'admin' : isLecturerAccount ? 'lecturer' : 'student'),
              ...data,
              isNewUser: false
            };
          } else {
            userProfile = {
              uid: userCred.user.uid,
              email: userCred.user.email,
              studentId: identifier.includes('@') ? userCred.user.email.split('@')[0] : identifier,
              name: isAdminAccount ? 'Administrator UPB' : isLecturerAccount ? `Dosen Pembimbing (${identifier})` : `Mahasiswa (${identifier})`,
              university: 'Universitas Putra Bangsa (UPB)',
              role: isAdminAccount ? 'admin' : isLecturerAccount ? 'lecturer' : 'student',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
              isNewUser: true
            };
            await setDoc(userDocRef, userProfile);
          }
        }

        setCurrentUser(userProfile);
        localStorage.setItem('presensi_user_session', JSON.stringify(userProfile));
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const isEmail = identifier.includes('@');
        const isAdminAccount = identifier.toLowerCase().includes('admin');
        const isLecturerAccount = identifier.toLowerCase().includes('dosen');
        
        // Match existing user in allUsers by studentId/NIDN, email, or uid
        const existingMatched = allUsers.find(
          u => (u.studentId && u.studentId.toLowerCase() === identifier.toLowerCase()) ||
               (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
               u.uid === identifier
        );

        if (existingMatched && existingMatched.password && existingMatched.password !== password) {
          const wrongErr = new Error('Password salah');
          wrongErr.code = 'auth/wrong-password';
          throw wrongErr;
        }

        const loggedUser = existingMatched || {
          uid: isAdminAccount ? 'user_admin_default' : isLecturerAccount ? `user_dosen_${identifier}` : `user_${identifier}`,
          studentId: isEmail ? identifier.split('@')[0] : identifier,
          email: isEmail ? identifier : `${identifier}@students.upb.ac.id`,
          name: isAdminAccount ? 'Administrator UPB' : isLecturerAccount ? `Dosen Pembimbing (${identifier})` : `Mahasiswa (${identifier})`,
          university: 'Universitas Putra Bangsa (UPB)',
          role: isAdminAccount ? 'admin' : isLecturerAccount ? 'lecturer' : 'student',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: false
        };

        setCurrentUser({ ...loggedUser, isNewUser: false });
        localStorage.setItem('presensi_user_session', JSON.stringify({ ...loggedUser, isNewUser: false }));

        setAllUsers((prev) => {
          if (!prev.some(u => u.uid === loggedUser.uid || u.studentId === loggedUser.studentId)) {
            const updated = [loggedUser, ...prev];
            localStorage.setItem('all_registered_users', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      let customMsg = 'Login gagal. Periksa kembali NIM/Email dan Password Anda.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        customMsg = 'NIM/Email atau Password belum terdaftar / salah. Silakan klik "Daftar Akun Baru" atau gunakan fitur "Lupa Password" jika Anda lupa kata sandi.';
      } else if (err.code === 'auth/wrong-password') {
        customMsg = 'Password yang Anda masukkan salah. Klik "Lupa Password?" jika ingin mengganti kata sandi secara langsung.';
      } else if (err.code === 'auth/invalid-email') {
        customMsg = 'Format Email / NIM tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        customMsg = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat lagi.';
      } else if (err.message) {
        customMsg = err.message;
      }
      setAuthError(customMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (studentId, name, email, university, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const newUserProfile = {
        studentId,
        name,
        email: email || `${studentId}@students.upb.ac.id`,
        university: university || 'Universitas Putra Bangsa (UPB)',
        role: 'student',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        isNewUser: true,
        password: password,
        createdAt: new Date().toISOString()
      };

      if (isFirebaseConfigured && auth && db) {
        const targetEmail = newUserProfile.email;
        const userCred = await createUserWithEmailAndPassword(auth, targetEmail, password);

        const fullProfile = {
          uid: userCred.user.uid,
          ...newUserProfile
        };

        // Write user document to Firestore collection 'users'
        await setDoc(doc(db, 'users', userCred.user.uid), fullProfile);

        setCurrentUser(fullProfile);
        localStorage.setItem('presensi_user_session', JSON.stringify(fullProfile));
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const fullProfile = {
          uid: `user_${Date.now()}`,
          ...newUserProfile
        };
        setCurrentUser(fullProfile);
        localStorage.setItem('presensi_user_session', JSON.stringify(fullProfile));

        setAllUsers((prev) => {
          const updated = [...prev, fullProfile];
          localStorage.setItem('all_registered_users', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setAuthError(err.message || 'Pendaftaran gagal.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const adminAddUser = async (userData) => {
    const targetUid = userData.uid || `user_${Date.now()}`;
    const newUser = {
      uid: targetUid,
      studentId: userData.studentId,
      name: userData.name,
      email: userData.email || `${userData.studentId}@students.upb.ac.id`,
      university: userData.university || 'Universitas Putra Bangsa (UPB)',
      role: userData.role || 'student',
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      createdAt: new Date().toISOString()
    };

    setAllUsers((prev) => {
      const idx = prev.findIndex(u => u.uid === targetUid);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newUser;
      } else {
        updated = [newUser, ...prev];
      }
      localStorage.setItem('all_registered_users', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', targetUid), newUser, { merge: true });
      } catch (err) {
        console.error("Firestore adminAddUser error:", err);
      }
    }
  };

  const adminUpdateUser = async (uid, updatedFields) => {
    setAllUsers((prev) => {
      const updated = prev.map(u => (u.uid === uid || u.studentId === uid) ? { ...u, ...updatedFields } : u);
      localStorage.setItem('all_registered_users', JSON.stringify(updated));
      return updated;
    });

    if (currentUser?.uid === uid || currentUser?.studentId === uid) {
      const updatedSelf = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedSelf);
      localStorage.setItem('presensi_user_session', JSON.stringify(updatedSelf));
    } else {
      const savedSession = localStorage.getItem('presensi_user_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession.uid === uid || parsedSession.studentId === uid || parsedSession.studentId === updatedFields.studentId) {
          const updatedSession = { ...parsedSession, ...updatedFields };
          localStorage.setItem('presensi_user_session', JSON.stringify(updatedSession));
        }
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', uid), updatedFields, { merge: true });
      } catch (err) {
        console.error("Firestore adminUpdateUser error:", err);
      }
    }
  };

  const adminDeleteUser = async (uid) => {
    const targetUser = allUsers.find(u => u.uid === uid || u.studentId === uid);
    const targetUid = targetUser?.uid || uid;
    const targetStudentId = targetUser?.studentId;

    setAllUsers((prev) => {
      const updated = prev.filter(u => 
        u.uid !== targetUid && 
        u.uid !== uid && 
        (!targetStudentId || u.studentId !== targetStudentId)
      );
      localStorage.setItem('all_registered_users', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', targetUid));
        if (targetStudentId && targetStudentId !== targetUid) {
          await deleteDoc(doc(db, 'users', targetStudentId)).catch(() => {});
        }
        if (uid !== targetUid && uid !== targetStudentId) {
          await deleteDoc(doc(db, 'users', uid)).catch(() => {});
        }
      } catch (err) {
        console.error("Firestore adminDeleteUser error:", err);
      }
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('presensi_user_session');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loading,
        authError,
        authInitializing,
        updateUserProfile,
        login,
        register,
        resetPasswordDirectly,
        findUserByIdentifier,
        adminAddUser,
        adminUpdateUser,
        adminDeleteUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
