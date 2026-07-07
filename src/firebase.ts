// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0MzwidiAeCMIkDBbOPMKzKQPjEC7J75U",
  authDomain: "kibbutz-app.firebaseapp.com",
  projectId: "kibbutz-app",
  storageBucket: "kibbutz-app.firebasestorage.app",
  messagingSenderId: "483095906433",
  appId: "1:483095906433:web:5dbdc65a56e371e20fe580",
  measurementId: "G-XFX61PL8SM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ייצוא השירותים לשימוש בשאר האפליקציה
export const auth = getAuth(app);
export const db = getFirestore(app);

// הגדרת זיכרון לחיבור המשתמש (ישאר מחובר גם בריפרש)
void setPersistence(auth, browserLocalPersistence).catch(() => undefined);