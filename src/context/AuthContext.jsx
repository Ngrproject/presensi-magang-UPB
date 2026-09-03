import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, auth, db } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('presensi_user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            
            let userProfile;
            if (userSnap.exists()) {
              userProfile = { uid: user.uid, ...userSnap.data() };
            } else {
              userProfile = {
                uid: user.uid,
                email: user.email,
                studentId: user.displayName || user.email.split('@')[0],
                name: user.displayName || 'Mahasiswa UPB',
                university: 'Universitas Putra Bangsa (UPB)',
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

  const login = async (identifier, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isFirebaseConfigured && auth && db) {
        const email = identifier.includes('@') ? identifier : `${identifier}@students.upb.ac.id`;
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        
        const userDocRef = doc(db, 'users', userCred.user.uid);
        const userSnap = await getDoc(userDocRef);
        
        let userProfile;
        if (userSnap.exists()) {
          userProfile = { uid: userCred.user.uid, ...userSnap.data() };
        } else {
          userProfile = {
            uid: userCred.user.uid,
            email: userCred.user.email,
            studentId: identifier,
            name: `Mahasiswa (${identifier})`,
            university: 'Universitas Putra Bangsa (UPB)',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
          };
          await setDoc(userDocRef, userProfile);
        }
        
        setCurrentUser(userProfile);
        localStorage.setItem('presensi_user_session', JSON.stringify(userProfile));
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const loggedUser = {
          uid: `user_${Date.now()}`,
          studentId: identifier,
          email: identifier.includes('@') ? identifier : `${identifier}@students.upb.ac.id`,
          name: `Mahasiswa (${identifier})`,
          university: 'Universitas Putra Bangsa (UPB)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isNewUser: false
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
      const newUserProfile = {
        studentId,
        name,
        email: email || `${studentId}@students.upb.ac.id`,
        university: university || 'Universitas Putra Bangsa (UPB)',
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        updateUserProfile,
        login,
        register,
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
