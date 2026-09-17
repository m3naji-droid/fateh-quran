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
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA2CR66DY5I3TCn_gqXvwTjJUCq2ZKZW08",
  authDomain: "grounded-technique-rgmzr.firebaseapp.com",
  projectId: "grounded-technique-rgmzr",
  storageBucket: "grounded-technique-rgmzr.firebasestorage.app",
  messagingSenderId: "944676198315",
  appId: "1:944676198315:web:5bf9874602742ff930a4ee"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase initialized successfully for project:", firebaseConfig.projectId);

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    console.log("Google Login Success");
  } catch (err) {
    console.error("Google Login Error:", err);
  }
}

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
