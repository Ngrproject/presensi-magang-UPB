import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyALp-QIqUO6FroovX7SLoooivaj4F5YtkM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "epresensi-upb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "epresensi-upb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "epresensi-upb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "390655015312",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:390655015312:web:b0d8c5b18cef2c333b1b15"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY"
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn("Firebase initialization failed, switching to Local Mock Mode:", err);
  }
}

export { app, auth, db, storage, serverTimestamp };
