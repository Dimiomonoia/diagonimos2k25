// ==============================
// Firebase Configuration (Olympion ClimateActionNow)
// ==============================

// Φόρτωση Firebase modules (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- Το δικό σου config ---
export const firebaseConfig = {
  apiKey: "AIzaSyDQ3YspHTSo-MSqn8Cv3U43GvZtb-1SuaY",
  authDomain: "diagonismos2k25.firebaseapp.com",
  projectId: "diagonismos2k25",
  storageBucket: "diagonismos2k25.firebasestorage.app",
  messagingSenderId: "1095449376797",
  appId: "1:1095449376797:web:8eea57548f9438dcee6ef4",
  measurementId: "G-791ZTFWWJM"
};

// --- Ενεργοποίηση Firebase & Firestore ---
export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);
