import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase web config is publishable. Paste your project's values here.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
export function fb(): { auth: Auth; db: Firestore } {
  app = app ?? (getApps()[0] || initializeApp(firebaseConfig));
  return { auth: getAuth(app), db: getFirestore(app) };
}
