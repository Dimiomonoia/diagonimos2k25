// assets/js/auth.js
import { auth, db } from './fb.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---- helpers ----
const pseudoEmail = (username) =>
  `${username.toLowerCase().replace(/[^a-z0-9]+/g,'-')}@can.local`;

// Ελάχιστη αποθήκευση του τρέχοντα χρήστη για το UI
function cacheUser(u) {
  if(!u){ localStorage.removeItem('eco_user'); return; }
  localStorage.setItem('eco_user', JSON.stringify({
    uid: u.uid, display: u.displayName || u.email?.split('@')[0]
  }));
}

// Δημιουργία/ενημέρωση προφίλ στο Firestore
export async function saveUser(uid, data={}){
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if(snap.exists()){
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }else{
    await setDoc(ref, {
      display: data.display || 'user',
      points: data.points ?? 0,
      volunteer: !!data.volunteer,
      isAdmin: !!data.isAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  // mapping username→uid (για αναζητήσεις με username στο μέλλον)
  if (data.username){
    await setDoc(doc(db,'usernames', data.username.toLowerCase()), {
      uid, email: pseudoEmail(data.username)
    });
  }
}

// Πόντοι
export async function addPoints(uid, amount){
  const ref = doc(db,'users', uid);
  const snap = await getDoc(ref);
  const curr = snap.exists() ? (snap.data().points||0) : 0;
  await saveUser(uid, { points: curr + amount });
}

// Έλεγχος admin
export async function isAdminUser(uid){
  const ref = doc(db,'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? !!snap.data().isAdmin : false;
}

// ---- UI wiring (κουμπιά) ----
const regBtn = document.querySelector('#registerBtn');
const logBtn = document.querySelector('#loginBtn');
const logoutBtn = document.querySelector('#logoutBtn');
const msgEl = document.querySelector('#authMsg');

regBtn?.addEventListener('click', async (e)=>{
  e.preventDefault();
  const u = document.querySelector('#regUser')?.value.trim();
  const p = document.querySelector('#regPass')?.value.trim();
  if(!u || !p){ msgEl && (msgEl.textContent = 'Συμπλήρωσε username & κωδικό.'); return; }
  try{
    const email = pseudoEmail(u);
    const cred = await createUserWithEmailAndPassword(auth, email, p);
    await updateProfile(cred.user, { displayName: u });
    // Αν είναι ο επίσημος λογαριασμός, κάνε τον admin (1η φορά)
    const isOlympion = (u === 'Olympion_School');
    await saveUser(cred.user.uid, {
      username: u, display: u,
      volunteer: false,
      isAdmin: isOlympion // ο Olympion_School admin by default
    });
    cacheUser(cred.user);
    msgEl && (msgEl.textContent = '✅ Εγγραφήκατε & συνδεθήκατε!');
    document.querySelector('#authDialog')?.close();
    renderAuthArea();
  }catch(err){
    msgEl && (msgEl.textContent = 'Σφάλμα: '+err.message);
  }
});

logBtn?.addEventListener('click', async (e)=>{
  e.preventDefault();
  const u = document.querySelector('#regUser')?.value.trim();
  const p = document.querySelector('#regPass')?.value.trim();
  if(!u || !p){ msgEl && (msgEl.textContent = 'Συμπλήρωσε username & κωδικό.'); return; }
  try{
    const email = u.includes('@') ? u : pseudoEmail(u);
    const cred = await signInWithEmailAndPassword(auth, email, p);
    cacheUser(cred.user);
    msgEl && (msgEl.textContent = `✅ Καλωσήρθες, ${cred.user.displayName||u}!`);
    document.querySelector('#authDialog')?.close();
    renderAuthArea();
  }catch(err){
    msgEl && (msgEl.textContent = 'Σφάλμα: '+err.message);
  }
});

logoutBtn?.addEventListener('click', async()=>{
  await signOut(auth);
  cacheUser(null);
  renderAuthArea();
  location.reload();
});

// Παρακολούθηση session
onAuthStateChanged(auth, async (user)=>{
  cacheUser(user || null);
  renderAuthArea();
});

// ---- Header chip (δεξιά) ----
export async function renderAuthArea(){
  const host = document.querySelector('#authArea'); if(!host) return;
  const user = auth.currentUser;

  if(!user){
    host.innerHTML = `<button class="btn ghost" id="authBtn">Είσοδος / Εγγραφή</button>`;
    document.querySelector('#authBtn')?.addEventListener('click',()=> {
      document.querySelector('#authDialog')?.showModal();
    });
    return;
  }
  const snap = await getDoc(doc(db,'users', user.uid));
  const pts = snap.exists() ? (snap.data().points||0) : 0;
  const letter = (user.displayName||'?').slice(0,1).toUpperCase();

  host.innerHTML = `
    <div class="userchip" id="userChip" tabindex="0" aria-haspopup="true">
      <div class="avatar">${letter}</div>
      <span class="name">${user.displayName||user.email}</span>
      <span class="points">★ ${pts}</span>
    </div>
    <div class="usermenu" id="userMenu" hidden>
      <a href="account.html">Ο λογαριασμός μου</a>
      <a href="add.html">Υποβολή δράσης</a>
      <a href="leaderboard.html">Κατάταξη</a>
      <button id="logoutBtn2" class="menu-danger">Αποσύνδεση</button>
    </div>`;
  const chip = document.querySelector('#userChip');
  const menu = document.querySelector('#userMenu');
  chip?.addEventListener('click', ()=> menu.hidden = !menu.hidden);
  chip?.addEventListener('blur', ()=> setTimeout(()=> menu.hidden=true, 150));
  document.querySelector('#logoutBtn2')?.addEventListener('click', async ()=>{
    await signOut(auth); cacheUser(null); renderAuthArea(); location.reload();
  });
}
renderAuthArea();
