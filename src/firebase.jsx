// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

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

// Firestore
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => console.log("🔥 Offline Firestore enabled"))
  .catch((err) => console.log("Offline persistence error:", err.code));

// Authentication
export const auth = getAuth(app);

// Analytics (optional)
let analytics;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});
export { analytics };
