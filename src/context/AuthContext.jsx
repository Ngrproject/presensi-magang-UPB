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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('presensi_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [allUsers, setAllUsers] = useState(() => {
    const saved = localStorage.getItem('all_registered_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

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
        if (user) {
          try {
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
          } catch (err) {
            console.error("Error fetching user profile from Firestore:", err);
          }
        } else {
          const saved = localStorage.getItem('presensi_user_session');
          if (saved) {
            setCurrentUser(JSON.parse(saved));
          } else {
            setCurrentUser(null);
          }
        }
      });
      return () => unsubscribe();
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

        // If identifier is NIM (does not contain @), search Firestore for user email
        if (!identifier.includes('@')) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('studentId', '==', identifier));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const matchedData = querySnapshot.docs[0].data();
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
        }

        let userCred;
        const isAdminAccount = identifier.toLowerCase().includes('admin') || targetEmail.toLowerCase().includes('admin');

        try {
          userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
        } catch (signErr) {
          // If this is an Admin login attempt and the account does not exist in Firebase Auth yet, auto-create it
          if (isAdminAccount && (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential')) {
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
        
        const userDocRef = doc(db, 'users', userCred.user.uid);
        const userSnap = await getDoc(userDocRef);
        
        let userProfile;
        if (userSnap.exists()) {
          const data = userSnap.data();
          userProfile = { 
            uid: userCred.user.uid, 
            role: data.role || (isAdminAccount ? 'admin' : 'student'), 
            ...data 
          };
        } else {
          userProfile = {
            uid: userCred.user.uid,
            email: userCred.user.email,
            studentId: identifier.includes('@') ? userCred.user.email.split('@')[0] : identifier,
            name: isAdminAccount ? 'Administrator UPB' : `Mahasiswa (${identifier})`,
            university: 'Universitas Putra Bangsa (UPB)',
            role: isAdminAccount ? 'admin' : 'student',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
          };
          await setDoc(userDocRef, userProfile);
        }
        
        setCurrentUser(userProfile);
        localStorage.setItem('presensi_user_session', JSON.stringify(userProfile));
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const isEmail = identifier.includes('@');
        const isAdminAccount = identifier.toLowerCase().includes('admin');
        const loggedUser = {
          uid: isAdminAccount ? 'user_admin_default' : `user_${Date.now()}`,
          studentId: isEmail ? identifier.split('@')[0] : identifier,
          email: isEmail ? identifier : `${identifier}@students.upb.ac.id`,
          name: isAdminAccount ? 'Administrator UPB' : `Mahasiswa (${identifier})`,
          university: 'Universitas Putra Bangsa (UPB)',
          role: isAdminAccount ? 'admin' : 'student',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: false
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('presensi_user_session', JSON.stringify(loggedUser));

        // Add to mock allUsers list if not present
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
        customMsg = 'NIM/Email atau Password belum terdaftar / salah. Silakan klik "Daftar Akun Baru" jika belum memiliki akun.';
      } else if (err.code === 'auth/wrong-password') {
        customMsg = 'Password yang Anda masukkan salah.';
      } else if (err.code === 'auth/invalid-email') {
        customMsg = 'Format Email / NIM tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        customMsg = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat lagi.';
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
      const updated = prev.map(u => u.uid === uid ? { ...u, ...updatedFields } : u);
      localStorage.setItem('all_registered_users', JSON.stringify(updated));
      return updated;
    });

    if (currentUser?.uid === uid) {
      const updatedSelf = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedSelf);
      localStorage.setItem('presensi_user_session', JSON.stringify(updatedSelf));
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
    setAllUsers((prev) => {
      const updated = prev.filter(u => u.uid !== uid);
      localStorage.setItem('all_registered_users', JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', uid));
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
        updateUserProfile,
        login,
        register,
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
