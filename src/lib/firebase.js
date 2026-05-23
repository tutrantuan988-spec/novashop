import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

export const firebaseApp = hasConfig ? initializeApp(firebaseConfig) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const isFirebaseReady = () => !!db;

let warned = false;
export function warnFirebaseMissing() {
  if (!warned && !isFirebaseReady()) {
    warned = true;
    console.warn('⚠️ Firebase chưa cấu hình — dùng local seed data');
  }
}
