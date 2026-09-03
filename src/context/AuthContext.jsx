import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, auth } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext(null);

const DEMO_USERS = [
  {
    uid: 'demo_user_1',
    studentId: '210101234',
    email: 'budi.santoso@students.upb.ac.id',
    name: 'Budi Santoso',
    university: 'Universitas Putra Bangsa (UPB)',
    company: 'PT Telkom Indonesia Tbk',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    isNewUser: false
  },
  {
    uid: 'demo_user_2',
    studentId: '220409876',
    email: 'siti.rahma@students.upb.ac.id',
    name: 'Siti Rahmawati',
    university: 'Universitas Putra Bangsa (UPB)',
    company: 'BMKG Stasiun Meteorologi Class I',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    isNewUser: false
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('presensi_user_session');
    return saved ? JSON.parse(saved) : DEMO_USERS[0];
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          const saved = localStorage.getItem('presensi_user_session');
          const savedObj = saved ? JSON.parse(saved) : {};
          const userProfile = {
            uid: user.uid,
            email: user.email,
            studentId: savedObj.studentId || user.displayName || user.email.split('@')[0],
            name: savedObj.name || user.displayName || 'Mahasiswa UPB',
            university: savedObj.university || 'Universitas Putra Bangsa (UPB)',
            avatarUrl: savedObj.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
          };
          setCurrentUser(userProfile);
          localStorage.setItem('presensi_user_session', JSON.stringify(userProfile));
        } else {
          const saved = localStorage.getItem('presensi_user_session');
          if (saved) {
            setCurrentUser(JSON.parse(saved));
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const updateUserProfile = (updatedFields) => {
    setCurrentUser((prev) => {
      const nextUser = {
        ...prev,
        ...updatedFields
      };
      localStorage.setItem('presensi_user_session', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const login = async (identifier, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isFirebaseConfigured && auth) {
        const email = identifier.includes('@') ? identifier : `${identifier}@students.upb.ac.id`;
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const matched = DEMO_USERS.find(
          (u) => u.studentId === identifier || u.email === identifier
        );
        const loggedUser = matched || {
          uid: `user_${Date.now()}`,
          studentId: identifier,
          email: identifier.includes('@') ? identifier : `${identifier}@students.upb.ac.id`,
          name: `Mahasiswa (${identifier})`,
          university: 'Universitas Putra Bangsa (UPB)',
          company: 'Belum diatur',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: true
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('presensi_user_session', JSON.stringify(loggedUser));
      }
    } catch (err) {
      console.error("Login error:", err);
      setAuthError(err.message || 'Login gagal. Periksa kembali NIM/Email dan Password Anda.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (studentId, name, email, university, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isFirebaseConfigured && auth) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = {
          uid: userCred.user.uid,
          studentId,
          name,
          email,
          university: university || 'Universitas Putra Bangsa (UPB)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: true
        };
        setCurrentUser(newUser);
        localStorage.setItem('presensi_user_session', JSON.stringify(newUser));
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const newUser = {
          uid: `user_${Date.now()}`,
          studentId,
          name,
          email: email || `${studentId}@students.upb.ac.id`,
          university: university || 'Universitas Putra Bangsa (UPB)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: true
        };
        setCurrentUser(newUser);
        localStorage.setItem('presensi_user_session', JSON.stringify(newUser));
      }
    } catch (err) {
      console.error("Registration error:", err);
      setAuthError(err.message || 'Pendaftaran gagal.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('presensi_user_session');
  };

  const switchDemoUser = (index) => {
    const user = DEMO_USERS[index] || DEMO_USERS[0];
    setCurrentUser(user);
    localStorage.setItem('presensi_user_session', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        updateUserProfile,
        login,
        register,
        logout,
        switchDemoUser,
        demoUsers: DEMO_USERS
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
