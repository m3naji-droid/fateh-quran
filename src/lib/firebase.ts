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
const firebaseConfig = {
 apiKey: "AIzaSyA2CR66DY5I3TCn_gqXvwTjJUCq2ZKZW08",
 authDomain: "grounded-technique-rgmzr.firebaseapp.com",
 projectId: "grounded-technique-rgmzr",
 storageBucket: "grounded-technique-rgmzr.firebasestorage.app",
 messagingSenderId: "944676198315",
 appId: "1:944676198315:web:5bf9874602742ff930a4ee",
 firestoreDatabaseId: "ai-studio-420cd5a9-0ed-4e84-97e9-7649c7b7816a"
};
// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
