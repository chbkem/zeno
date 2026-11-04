import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase web config is publishable. The API key and measurement ID are
// injected at build time from the project's saved secrets (see vite.config.ts).
export const firebaseConfig = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] as string,
  authDomain: "zeno-95f50.firebaseapp.com",
  projectId: "zeno-95f50",
  storageBucket: "zeno-95f50.firebasestorage.app",
  messagingSenderId: "1009504756576",
  appId: "1:1009504756576:web:2a199f07344e3d57deb405",
  measurementId: import.meta.env["VITE_FIREBASE_MEASUREMENT_ID"] as string,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
export function fb(): { auth: Auth; db: Firestore } {
  app = app ?? (getApps()[0] || initializeApp(firebaseConfig));
  return { auth: getAuth(app), db: getFirestore(app) };
}
