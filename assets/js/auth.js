// ==============================
// Firebase Auth + Firestore User Points System
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut, updateProfile } 
  from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } 
  from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { firebaseConfig } from "./fb.js";

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authArea = document.querySelector('#authArea');
const dialog = document.querySelector('#authDialog');

// --------------------------
// Ενημέρωση UI
// --------------------------
function updateAuthUI(user){
  if(!authArea) return;
  if(user){
    authArea.innerHTML = `
      <span class="muted">👋 ${user.displayName || user.email}</span>
      <button id="logoutBtn" class="btn secondary">Αποσύνδεση</button>`;
    document.querySelector('#logoutBtn').addEventListener('click', ()=>signOut(auth));
  }else{
    authArea.innerHTML = `<button id="loginBtn" class="btn">Σύνδεση</button>`;
    document.querySelector('#loginBtn').addEventListener('click', ()=>dialog?.showModal());
  }
}

// --------------------------
// Δημιουργία ή Σύνδεση
// --------------------------
async function handleAuth(e){
  e.preventDefault();
  const email = document.querySelector('#authEmail').value.trim();
  const pass = document.querySelector('#authPass').value.trim();
  const name = document.querySelector('#authName').value.trim();
  const isSignup = document.querySelector('#authMode').value === 'signup';

  try{
    let userCred;
    if(isSignup){
      userCred = await createUserWithEmailAndPassword(auth,email,pass);
      await updateProfile(userCred.user,{ displayName:name });

      // --- Δημιουργία εγγραφής Firestore ---
      await setDoc(doc(db,"users",userCred.user.uid),{
        display: name,
        email: email,
        points: 0,
        volunteer: false
      });
    }else{
      userCred = await signInWithEmailAndPassword(auth,email,pass);
    }

    dialog.close();
  }catch(err){
    alert("Σφάλμα: " + err.message);
  }
}

// --------------------------
// Ανίχνευση κατάστασης σύνδεσης
// --------------------------
onAuthStateChanged(auth,async user=>{
  updateAuthUI(user);
  if(user){
    const snap = await getDoc(doc(db,"users",user.uid));
    if(snap.exists()){
      const data = snap.data();
      localStorage.setItem("eco_user", JSON.stringify({
        uid: user.uid,
        display: data.display,
        points: data.points || 0
      }));
    }
  }else{
    localStorage.removeItem("eco_user");
  }
});

// --------------------------
// Προσθήκη πόντων (π.χ. όταν κάνει δράση)
// --------------------------
export async function addPoints(uid, amount=5){
  if(!uid) return;
  const ref = doc(db,"users",uid);
  await updateDoc(ref,{ points: increment(amount) });
}

// --------------------------
// Event Listener
// --------------------------
document.querySelector('#authForm')?.addEventListener('submit',handleAuth);
/**
 * Έλεγχος αν ο τρέχων χρήστης είναι admin
 * (διαβάζει από Firestore)
 */
export async function isAdminUser(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    return !!snap.data().isAdmin;
  } catch (err) {
    console.error("Σφάλμα στον έλεγχο admin:", err);
    return false;
  }
}
