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
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA2CR66DY5I3TCn_gqXvwTjJUCq2ZKZW08",
  authDomain: "grounded-technique-rgmzr.firebaseapp.com",
  projectId: "grounded-technique-rgmzr",
  storageBucket: "grounded-technique-rgmzr.firebasestorage.app",
  messagingSenderId: "944676198315",
  appId: "1:944676198315:web:5bf9874602742ff930a4ee",
  firestoreDatabaseId: "ai-studio-420cd5a9-10ed-4e84-97e9-7649c7b7816a"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    console.log("تم تسجيل الدخول بنجاح عبر جوجل!");
  } catch (err) {
    console.error("خطأ في تسجيل الدخول بجوجل:", err);
  }
}

let authReadyPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        resolve();
      });
    });
  }
  return authReadyPromise;
}

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
