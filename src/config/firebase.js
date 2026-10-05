import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQHsnOjA4toHxs3uo7N46R0u1MpJFh4Js",
  authDomain: "e-card-72671.firebaseapp.com",
  projectId: "e-card-72671",
  storageBucket: "e-card-72671.firebasestorage.app",
  messagingSenderId: "1029901355444",
  appId: "1:1029901355444:web:c4bb7c910c16ffc0134ae1",
  measurementId: "G-4QWGR6X1NS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services - NO STORAGE
export const auth = getAuth(app);
export const db = getFirestore(app);
// storage removed - using Cloudinary instead

export default app;
