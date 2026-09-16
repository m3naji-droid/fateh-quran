import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying database ID if present
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Authenticate anonymously so every client has access
let authReadyPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        if (user) {
          resolve();
        } else {
          signInAnonymously(auth)
            .then(() => resolve())
            .catch((err) => {
              console.warn('Anonymous auth note:', err);
              resolve();
            });
        }
      });
    });
  }
  return authReadyPromise;
}

// Auto-trigger auth
ensureAuth();

export {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
};
