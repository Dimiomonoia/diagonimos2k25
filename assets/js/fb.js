// assets/js/fb.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ3YspHTSo-MSqn8Cv3U43GvZtb-1SuaY",
  authDomain: "diagonismos2k25.firebaseapp.com",
  projectId: "diagonismos2k25",
  storageBucket: "diagonismos2k25.firebasestorage.app",
  messagingSenderId: "1095449376797",
  appId: "1:1095449376797:web:8eea57548f9438dcee6ef4",
  measurementId: "G-791ZTFWWJM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
