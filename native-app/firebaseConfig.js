import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_-GffobnLyS4o62pJppmwXE27cEGMwNA",
  authDomain: "shahagro-cca7c.firebaseapp.com",
  projectId: "shahagro-cca7c",
  storageBucket: "shahagro-cca7c.firebasestorage.app",
  messagingSenderId: "180745797102",
  appId: "1:180745797102:web:b81858d8970894c39f62ff",
  measurementId: "G-8X7TZ6NWP4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
