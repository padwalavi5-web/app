import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Loads Firebase config from Vercel/Vite env vars, falling back to the bundled project defaults.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA0MzwidiAeCMIkDBbOPMKzKQPjEC7J75U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'kibbutz-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'kibbutz-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'kibbutz-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '483095906433',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:483095906433:web:5dbdc65a56e371e20fe580',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-XFX61PL8SM',
};

// Creates the single Firebase app instance used across the project.
const app = initializeApp(firebaseConfig);

// Shared Firestore database handle for all data queries and writes.
export const db = getFirestore(app);
