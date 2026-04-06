// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBmHbFYH0LjasCftrTkIUIUV3nysNd3f0",
  authDomain: "kibbutz-work-app.firebaseapp.com",
  projectId: "kibbutz-work-app",
  storageBucket: "kibbutz-work-app.firebasestorage.app",
  messagingSenderId: "611206729136",
  appId: "1:611206729136:web:e09be9bd2237a7d4561a75",
  measurementId: "G-E9ESJHR6LR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);