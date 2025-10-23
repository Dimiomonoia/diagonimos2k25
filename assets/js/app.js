// =======================
// EcoAction Hub — app.js (final merged)
// =======================

// ---- Keys / Helpers ----
const LS_USERS  = 'eco_users';
const LS_SESSION = 'eco_session';
const LS_ACTIONS = 'eco_actions';
const LS_RATES  = 'eco_rates';

const qs  = (sel)=>document.querySelector(sel);
const qsa = (sel)=>Array.from(document.querySelectorAll(sel));
const store = {
  get(key, fallback){ try{ const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch{ return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};
// Επιστρέφει είτε μόνο το username είτε ολόκληρο το αντικείμενο χρήστη
function currentUser(full=false){
  const u = store.get(LS_SESSION, null);
  if(!u) return null;
  if(!full) return u;
  const users = store.get(LS_USERS, {});
  return { username: u, ...(users[u] || {}) };
}
function msg(sel, text){ const el = typeof sel==="string"?qs(sel):sel; if(el) el.textContent = text; }

// ---- Προεπιλεγμένος admin ----
const ADMIN_USER = 'Olympion_School';
const ADMIN_PASS = 'Olymp123';
const ADMIN_NAME = 'Olympion School';

(function ensureAdmin(){
  const users = store.get(LS_USERS, {});
  if(!users[ADMIN_USER]){
    users[ADMIN_USER] = {
      pass: ADMIN_PASS,
      display: ADMIN_NAME,
      volunteer: true,
      points: 999,
      isAdmin: true
    };
    store.set(LS_USERS, users);
  }
})();

// ---- Nav active indicator (multi-page) ----
(function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  qsa('nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href')===path));
})();

// =======================
// AUTH (prototype)
// =======================
const authDialog = qs('#authDialog');

// Δυναμική περιοχή στο header (κουμπί login ή chip χρήστη)
function renderAuthArea(){
  const host = qs('#authArea'); if(!host) return;
  const u = currentUser();

  if(!u){
    host.innerHTML = `<button class="btn ghost" id="authBtn">Είσοδος / Εγγραφή</button>`;
    qs('#authBtn')?.addEventListener('click', ()=>authDialog?.showModal());
    return;
  }

  const users = store.get(LS_USERS, {});
  const uObj = currentUser(true);
  const displayName = uObj?.display || u;
  const pts = users[u]?.points || 0;
  const letter = displayName.slice(0,1).toUpperCase();

  host.innerHTML = `
    <div class="userchip" id="userChip" tabindex="0" aria-haspopup="true">
      <div class="avatar">${letter}</div>
      <span class="name">${displayName}</span>
      <span class="points">★ ${pts}</span>
    </div>
    <div class="usermenu" id="userMenu" hidden>
      <a href="account.html">Ο λογαριασμός μου</a>
      <a href="add.html">Υποβολή δράσης</a>
      <button id="logoutBtn" class="menu-danger">Αποσύνδεση</button>
    </div>`;

  const chip = qs('#userChip');
  const menu = qs('#userMenu');
  function toggleMenu(show){ menu.hidden = (show===undefined)? !menu.hidden : !show?true:false; }
  chip.addEventListener('click', ()=>toggleMenu());
  chip.addEventListener('blur', ()=>setTimeout(()=>menu.hidden=true, 150));
  qs('#logoutBtn')?.addEventListener('click', ()=>{ store.set(LS_SESSION,null); renderAuthArea(); drawAccountPanel(); });
}

// ΝΕΟΙ listeners για register/login (οι μόνοι ενεργοί)
if(qs('#registerBtn')) qs('#registerBtn').addEventListener('click', (e)=>{ 
  e.preventDefault();
  const u = qs('#regUser').value.trim();
  const p = qs('#regPass').value.trim();
  const users = store.get(LS_USERS, {});
  if(!u || !p){ return msg('#authMsg','Συμπλήρωσε και τα δύο πεδία.'); }
  if(users[u]){ return msg('#authMsg','Το όνομα υπάρχει. Δοκίμασε άλλο ή κάνε είσοδο.'); }
  users[u] = { pass:p, volunteer:false, points:0 };
  store.set(LS_USERS, users);
  store.set(LS_SESSION, u);
  msg('#authMsg','✅ Εγγραφήκατε & συνδεθήκατε!');
  setTimeout(()=>{ authDialog?.close(); renderAuthArea(); drawAccountPanel(); toast('Καλωσήρθες, '+u+'!'); }, 400);
});

if(qs('#loginBtn')) qs('#loginBtn').addEventListener('click', (e)=>{ 
  e.preventDefault();
  const u = qs('#regUser').value.trim();
  const p = qs('#regPass').value.trim();
  const users = store.get(LS_USERS, {});
  if(users[u]?.pass === p){
    store.set(LS_SESSION, u);
    const disp = (users[u]?.display)||u;
    msg('#authMsg','✅ Καλωσήρθες, '+disp+'!');
    setTimeout(()=>{ authDialog?.close(); renderAuthArea(); drawAccountPanel(); toast('Συνδέθηκες ως '+disp); }, 300);
  } else {
    msg('#authMsg','Λάθος στοιχεία.');
  }
});

function logout(){ store.set(LS_SESSION,null); location.reload(); }

function toast(text){
  let t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add('show'), 10);
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, 2200);
}

// =======================
// Account page panel
// =======================
function drawAccountPanel(){
  const panel = qs('#accountPanel'); if(!panel) return;
  const u = currentUser();
  if(!u){
    panel.innerHTML = `
      <div class="card"><div class="p center">
        <h3>Δεν είσαι συνδεδεμένος/η</h3>
        <p class="muted">Συνδέσου για να δεις προφίλ, πόντους και να δηλώσεις εθελοντής/ντρια.</p>
        <button class="btn" onclick="document.querySelector('#authDialog').showModal()">Είσοδος / Εγγραφή</button>
      </div></div>`;
    return;
  }

  const users = store.get(LS_USERS, {});
  const row = users[u] || { points:0, volunteer:false };
  const uObj = currentUser(true);
  const displayName = (uObj && uObj.display) ? uObj.display : u;
  const bonus = row.volunteer ? 3 : 0;
  const total = (row.points||0) + bonus;
  const target = 120;
  const pct = Math.min(100, (total/target*100)).toFixed(1);

  // Πρόχειρες 3 τελευταίες δράσεις του χρήστη
  const myActions = (store.get(LS_ACTIONS, [])||[]).filter(a=>a.owner===u).slice(0,3);

  panel.innerHTML = `
    <div class="grid account-grid">
      <section class="card">
        <div class="p profile">
          <div class="avatar big">${displayName.slice(0,1).toUpperCase()}</div>
          <div class="meta">
            <h3>${displayName} ${row.isAdmin?'<span class="badge-admin">Admin</span>':''}</h3>
            <p class="muted">Μέλος EcoAction • ${row.volunteer? 'Εθελοντής/ντρια' : 'Μη εθελοντής'}</p>
            <label class="switch">
              <input type="checkbox" id="volChk" ${row.volunteer?'checked':''}/>
              <span>Δήλωση ως Εθελοντής/ντρια</span>
            </label>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="p">
          <h3>Πόντοι & Πρόοδος</h3>
          <div id="pointsBar" class="bar"><div id="pointsFill" style="width:${pct}%"></div></div>
          <div class="muted" id="pointsText">${total} / ${target}</div>
          <div class="chips">
            <span class="chip">Συνολικοί πόντοι: <strong>${row.points||0}</strong></span>
            ${row.volunteer?'<span class="chip green">+3 bonus εθελοντή</span>':''}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="p">
          <h3>Οι τελευταίες δράσεις μου</h3>
          ${myActions.length? myActions.map(a=>`
            <div class="mini-action">
              <img src="${a.image||''}" alt="" onerror="this.style.display='none'"/>
              <div>
                <strong>${a.title}</strong>
                <div class="muted">${a.category}</div>
              </div>
            </div>`).join('') : '<p class="muted">Δεν έχεις υποβάλει ακόμη δράση.</p>'}
          <div style="margin-top:10px"><a class="btn" href="add.html">Υποβολή νέας δράσης</a></div>
        </div>
      </section>

      <section class="card">
        <div class="p">
          <h3>Ασφάλεια</h3>
          <p class="muted">🌿 Θυμήσου να αποσυνδέεσαι — η ασφάλεια ξεκινά από σένα!</p>
          <button class="btn secondary" onclick="logout()">Αποσύνδεση</button>
        </div>
      </section>
    </div>`;

  // events
  qs('#volChk')?.addEventListener('change', (e)=>{ row.volunteer = e.target.checked; users[u]=row; store.set(LS_USERS, users); updatePointsUI(); drawAccountPanel(); renderAuthArea(); });
}
drawAccountPanel();

// =======================
// WAYS (ideas list)
// =======================
const sampleWays = [
  // 1) Διατροφή & Βιώσιμη Κατανάλωση Τροφίμων
  {
    title: 'Διατροφή & Βιώσιμη Κατανάλωση',
    cat: 'Διατροφή',
    tips: [
      'Σχολικός/κοινοτικός λαχανόκηπος',
      'Τοπικά & εποχιακά προϊόντα',
      'Λιγότερο κόκκινο κρέας, λιγότερα επεξεργασμένα',
      'Καμπάνια κατά της σπατάλης τροφίμων',
      'Μαθήματα φυτικής/μεσογειακής διατροφής',
      'Κομποστοποίηση οργανικών αποβλήτων'
    ],
    img: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1400&q=80'
  },

  // 2) Φύση & Βιοποικιλότητα
  {
    title: 'Φύση & Βιοποικιλότητα',
    cat: 'Φύση',
    tips: [
      'Δενδροφυτεύσεις & καθαρισμοί πάρκων/παραλιών',
      'Πράσινες γωνιές – κήποι με μέλισσες',
      'Υιοθεσία πάρκου ή δέντρου',
      'Φύτευση τοπικών, ανθεκτικών ειδών',
      'Ενημέρωση για επικονιαστές (μέλισσες, πεταλούδες)'
    ],
    img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80'
  },

  // 3) Κοινότητα & Πόλη
  {
    title: 'Κοινότητα & Πόλη',
    cat: 'Κοινότητα',
    tips: [
      'Ανταλλακτικά παζάρια ρούχων/βιβλίων',
      'Zero waste δράσεις στο σχολείο/γειτονιά',
      'Συνεργασία με δήμο για πράσινες πρωτοβουλίες',
      'Εθελοντισμός σε τοπικές ΜΚΟ',
      'Φεστιβάλ περιβάλλοντος – “Ημέρα Κλίματος”'
    ],
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1400&q=80'
  },

  // 4) Πολιτική & Κοινωνική Δράση
  {
    title: 'Πολιτική & Κοινωνική Δράση',
    cat: 'Πολιτική',
    tips: [
      'Υποστήριξη πράσινων πολιτικών',
      'Επιστολές σε βουλευτές/δημάρχους για δράση',
      'Συμμετοχή σε Earth Day / Fridays for Future',
      'Δίκαιη ενεργειακή μετάβαση & διαφάνεια'
    ],
    img: 'https://plus.unsplash.com/premium_photo-1663061406443-48423f04e73d?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29tbXVuaXR5JTIwc2VydmljZXxlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000'
  },

  // ——— οι παλιές σου κάρτες παρακάτω ———
  {title:'Περπάτημα/ποδήλατο στο σχολείο', 
    cat:'Μετακίνηση', 
    tips:['Οργάνωσε car-pool με συμμαθητές','Χάρτης ασφαλών διαδρομών'], 
    img:'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1400&q=80'},
  
    {title:'Μείωση πλαστικών', 
    cat:'Ανακύκλωση', 
    tips:['Παγούρι & τάπερ πολλαπλών χρήσεων','Κατάργηση καλαμακίων'], 
    img:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=80'},
  
    {title:'Εξοικονόμηση ενέργειας', 
    cat:'Ενέργεια', 
    tips:['Σβήνουμε φώτα, χαμηλώνουμε κλιματισμό','LED λάμπες στο σχολείο'], 
    img:'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80'},
  
    {title:'Κομποστοποίηση', 
    cat:'Σχολείο', 
    tips:['Κάδος στο κυλικείο/κήπο','Πινακίδες εκπαίδευσης'], 
    img:'https://images.unsplash.com/photo-1621496654772-c66c48290259?auto=format&fit=crop&w=1400&q=80'}
];


function drawWays(){
  const wrap = qs('#waysList'); if(!wrap) return;
  wrap.innerHTML = sampleWays.map(w=>`
    <article class="card">
      <img src="${w.img}" alt="${w.title}" style="width:100%;height:160px;object-fit:cover"/>
      <div class="p">
        <h3>${w.title}</h3>
        <p class="muted">Κατηγορία: ${w.cat}</p>
        <ul class="muted">${w.tips.map(t=>`<li>• ${t}</li>`).join('')}</ul>
      </div>
    </article>`).join('');
}
drawWays();

// =======================
// ACTIONS (submit / list / rating) + upload εικόνας
// =======================
if(qs('#actionForm')){
  qs('#actionForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const u = currentUser();
    if(!u){ msg('#formMsg','Χρειάζεται σύνδεση.'); return; }

    // Λήψη εικόνας από file input ή URL
    const fileInput = qs('#imageUpload');
    let imgData = qs('#image')?.value.trim() || '';

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(ev) {
          imgData = ev.target.result; // base64
          saveAction(imgData);
        };
        reader.readAsDataURL(file);
        return; // περιμένουμε το FileReader
      }
    }
    saveAction(imgData);

    function saveAction(imageBase64){
      const actions = store.get(LS_ACTIONS, []);
      const rec = {
        id: Date.now().toString(36),
        owner: u,
        title: qs('#title').value.trim(),
        category: qs('#category').value,
        image: imageBase64,                // base64 ή URL
        link: qs('#link').value.trim(),
        desc: qs('#desc').value.trim(),
        created: Date.now(),
        avg: 0,
        votes: 0
      };
      actions.unshift(rec);
      store.set(LS_ACTIONS, actions);

      // +10 πόντοι
      const users = store.get(LS_USERS, {}); 
      users[u].points = (users[u].points||0) + 10; 
      store.set(LS_USERS, users);

      msg('#formMsg','✅ Αποθηκεύτηκε!');
      qs('#actionForm').reset();
      if(qs('#preview')) qs('#preview').style.display = 'none';
      drawActions(); updatePointsUI();
    }
  });
}

// preview για image upload
const uploadEl = qs('#imageUpload');
if (uploadEl) {
  uploadEl.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = qs('#preview');
        if(img){ img.src = ev.target.result; img.style.display = 'block'; }
      };
      reader.readAsDataURL(file);
    }
  });
}

function drawActions(){
  const list = qs('#actionsList'); if(!list) return;
  const actions = store.get(LS_ACTIONS, []);
  const dataset = (actions.length? actions: [
    {id:'seed1', owner:'demo', title:'Δενδροφύτευση στο πάρκο', category:'Κοινότητα', image:'https://images.unsplash.com/photo-1606117331085-5760e3b58520?q=80&w=1400&auto=format&fit=crop', link:'#', desc:'30 δεντράκια με τη Β΄Γυμνασίου', created:Date.now(), avg:4.2, votes:18},
    {id:'seed2', owner:'demo', title:'Συλλογή καπακιών', category:'Σχολείο', image:'https://source.unsplash.com/Qtj5RYq10vA/1400x933', link:'#', desc:'Για ανακύκλωση & κοινωνική προσφορά', created:Date.now(), avg:3.8, votes:25}
  ]);
  list.innerHTML = dataset.map(a=>actionCard(a)).join('');
}
drawActions();

function actionCard(a){
  const avg = calcAvg(a.id);
  const u = currentUser();
  const isAdmin = store.get(LS_USERS, {})[u]?.isAdmin;
  const canDelete = (u && (a.owner === u || isAdmin));

  return `
    <article class="card">
      <img src="${a.image||'https://images.unsplash.com/photo-1490290332410-1c0b3aa02ad8?q=80&w=1400&auto=format&fit=crop'}" alt="${a.title}" style="width:100%;height:160px;object-fit:cover"/>
      <div class="p">
        <h3>${a.title}</h3>
        <p class="muted">Κατηγορία: ${a.category} • από <em>${a.owner}</em></p>
        <p>${a.desc||''}</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div>${starsUI(a.id, avg)}</div>
          <span class="muted">${avg.toFixed(1)} / 5</span>
        </div>
        ${a.link?`<p><a href="${a.link}" target="_blank" rel="noopener">Περισσότερα →</a></p>`:''}
        ${canDelete?`<div style="margin-top:8px"><button class="btn danger delete-action" data-id="${a.id}">🗑 Διαγραφή</button></div>`:''}
      </div>
    </article>`;
}
// ratings + delete
document.addEventListener('click', (e)=>{
  const del = e.target.closest('.delete-action');
  if(del){
    const id = del.dataset.id;
    const actions = store.get(LS_ACTIONS, []);
    const filtered = actions.filter(a=>a.id !== id);
    store.set(LS_ACTIONS, filtered);
    toast('Διαγράφηκε η δράση.');
    drawActions();
    return;
  }

  const star = e.target.closest('.star');
  if(!star) return;
  const u = currentUser(); if(!u){ alert('Πρέπει να συνδεθείς για να ψηφίσεις.'); return; }
  const id = star.dataset.id; const val = Number(star.dataset.val);
  const rates = store.get(LS_RATES, {});
  rates[id] = rates[id]||{}; rates[id][u] = val;
  store.set(LS_RATES, rates);

  const actions = store.get(LS_ACTIONS, []);
  const a = actions.find(x=>x.id===id);
  if(a){
    const users = store.get(LS_USERS, {});
    if(users[a.owner]) users[a.owner].points = (users[a.owner].points||0)+1;
    if(users[u]) users[u].points = (users[u].points||0)+1;
    store.set(LS_USERS, users);
  }
  drawActions(); updatePointsUI();
});
function starsUI(id, avg){
  const stars = [1,2,3,4,5].map(i=>`<span class="star ${i<=Math.round(avg)?'':'off'}" data-id="${id}" data-val="${i}">★</span>`).join('');
  return `<div class="stars" data-id="${id}">${stars}</div>`;
}
function calcAvg(id){
  const rates = store.get(LS_RATES, {});
  const map = rates[id]||{}; const vals = Object.values(map);
  if(!vals.length) return 0;
  return vals.reduce((a,b)=>a+b,0)/vals.length;
}

// =======================
// Points / Rewards bar
// =======================
function updatePointsUI(){
  const u = currentUser(); const users = store.get(LS_USERS, {}); const row = u? users[u]: null;
  let points = row? (row.points||0) : 0;
  if(row?.volunteer) points += 3;
  const target = 120;
  if(qs('#pointsFill')) qs('#pointsFill').style.width = Math.min(100, (points/target*100)).toFixed(1)+'%';
  if(qs('#pointsText')) qs('#pointsText').textContent = `${points} / ${target}`;
}
updatePointsUI();

// ---- Bad habits με SVG icons (data URI) ----
const icons = {
  plastics: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%235eead4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h4l1 2v3H7V5l1-2z"/><rect x="6" y="8" width="10" height="12" rx="2" ry="2"/></svg>',
  energy:   'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23f1c453" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h6l-2 8L21 8h-6l2-6z"/></svg>',
  water:    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%235eead4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/></svg>',
  car:      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23b1ff95" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5"/><path d="M5 16h14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  food:     'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ff7b7b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2c2 2 2 6-1 8-2 2-4 2-5 5 3 1 5 0 7-2 2-2 3-5 1-11z"/><path d="M14 7c3 3 4 7 2 10"/></svg>',
  recycle:  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%235eead4" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l3-3 3 3"/><path d="M6 4v6"/><path d="M21 17l-3 3-3-3"/><path d="M18 20v-6"/><path d="M7 21l-4-7h6l-2 7z"/><path d="M17 3l4 7h-6l2-7z"/></svg>'
};

const bads = [
  {title:'Πεταμένα πλαστικά', icon:icons.plastics, tip:'Χρησιμοποιούμε παγούρι/δοχείο πολλαπλών χρήσεων και στήνουμε σταθμό ανακύκλωσης στο σχολείο.'},
  {title:'Σπατάλη ρεύματος', icon:icons.energy,   tip:'Σβήνουμε φώτα/οθόνες, ρυθμίζουμε κλιματισμό στους 26°C το καλοκαίρι.'},
  {title:'Σπατάλη νερού',   icon:icons.water,    tip:'Ντους κάτω από 5 λεπτά, βρύσες με αεριστήρες, επισκευή διαρροών.'},
  {title:'Μετακίνηση με ΙΧ', icon:icons.car,     tip:'Περπάτημα/ποδήλατο/ΜΜΜ/συνταξίδια, «Ημέρα χωρίς αυτοκίνητο».'},
  {title:'Τρόφιμα στα σκουπίδια', icon:icons.food, tip:'Μενού εβδομάδας, κομποστοποίηση υπολειμμάτων, ενημερωτικές αφίσες.'},
  {title:'Λάθος ανακύκλωση', icon:icons.recycle,  tip:'Καθαρά, στεγνά υλικά, οδηγός ανακύκλωσης με εικονίδια.'}
];

const badGrid = qs('#badGrid');
if(badGrid){
  badGrid.innerHTML = bads.map(b=>`
    <div class="bad-item" data-title="${b.title}" data-tip="${b.tip}">
      <div class="icon"><img src='${b.icon}' alt="" /></div>
      <div>
        <strong>${b.title}</strong>
        <div class="muted">Πάτησε για συμβουλές</div>
      </div>
    </div>`).join('');
  badGrid.addEventListener('click', (e)=>{
    const item = e.target.closest('.bad-item'); if(!item) return;
    qs('#tipTitle').textContent = item.dataset.title;
    qs('#tipBody').textContent = item.dataset.tip;
    qs('#tipDialog').showModal();
  });
  qs('#tipClose')?.addEventListener('click', ()=>qs('#tipDialog').close());
}

// =======================
// Slider (home only)
// =======================
(function sliderInit(){
  const slider = qs('#slider'); if(!slider) return;
  const slides = qsa('.slide'); let idx=0;
  function show(i){ slides[idx].classList.remove('active'); idx=(i+slides.length)%slides.length; slides[idx].classList.add('active'); }
  qs('#prev')?.addEventListener('click',()=>show(idx-1));
  qs('#next')?.addEventListener('click',()=>show(idx+1));
  setInterval(()=>show(idx+1), 6000);
})();

// =======================
// QUIZ: μία-μία ερώτηση, τυχαία σειρά, τυχαίες θέσεις απαντήσεων
// =======================
const questionBank = [
  {q:'Τι προκαλεί την αύξηση της θερμοκρασίας του πλανήτη;', a:['Η περιστροφή της Γης','Οι εκρήξεις ηφαιστείων','Οι ανθρώπινες δραστηριότητες που παράγουν αέρια του θερμοκηπίου','Η βαρύτητα της Σελήνης'], c:2},
  {q:'Ποια από τις παρακάτω είναι ανανεώσιμη πηγή ενέργειας;', a:['Πετρέλαιο','Άνθρακας','Φυσικό αέριο','Ηλιακή ενέργεια'], c:3},
  {q:'Ποια δραστηριότητα συμβάλλει στη μείωση των εκπομπών διοξειδίου του άνθρακα (CO₂);', a:['Η καύση κάρβουνου για θέρμανση','Η χρήση ιδιωτικών αυτοκινήτων καθημερινά','Η φύτευση δέντρων','Η υπερβολική κατανάλωση νερού'], c:2},
  {q:'Ποιο είναι ένα αποτέλεσμα της κλιματικής αλλαγής;', a:['Σταθερές θερμοκρασίες','Περισσότερα είδη φυτών','Πιο συχνά ακραία καιρικά φαινόμενα','Λιγότερες πλημμύρες'], c:2},
  {q:'Τι μπορούμε να κάνουμε για να βοηθήσουμε στη μείωση της κλιματικής αλλαγής;', a:['Να αφήνουμε τα φώτα αναμμένα όλη μέρα','Να ανακυκλώνουμε και να μειώνουμε τα απόβλητά μας','Να χρησιμοποιούμε πλαστικά μιας χρήσης','Να πετάμε σκουπίδια στη φύση'], c:1},
  {q:'Ποια από τις παρακάτω συνήθειες βοηθάει περισσότερο στην προστασία του περιβάλλοντος;', a:['Να πλένουμε το αυτοκίνητο κάθε μέρα','Να πηγαίνουμε παντού με το αυτοκίνητο','Να χρησιμοποιούμε ποδήλατο ή μέσα μαζικής μεταφοράς','Να αγοράζουμε μόνο εμφιαλωμένο νερό'], c:2},
  {q:'Ποια από τις παρακάτω ενέργειες βοηθά στη μείωση της κατανάλωσης ενέργειας στο σπίτι;', a:['Να αφήνουμε τις συσκευές σε stand-by','Να ανοίγουμε τα παράθυρα με το καλοριφέρ ανοιχτό','Να χρησιμοποιούμε λαμπτήρες LED','Να αφήνουμε τον θερμοσίφωνα αναμμένο όλη μέρα'], c:2},
  {q:'Ποια από τις παρακάτω πρακτικές συμβάλλει σε πιο βιώσιμες μετακινήσεις;', a:['Χρήση ιδιωτικού αυτοκινήτου για μικρές αποστάσεις','Χρήση ποδηλάτου ή περπάτημα','Αύξηση αεροπορικών ταξιδιών','Αγορά μεγάλων/βαριών οχημάτων'], c:1}
];

(function perQuestionQuiz(){
  const qText     = document.querySelector('#qText');
  const qForm     = document.querySelector('#qForm');
  const submitBtn = document.querySelector('#submitOne');
  const nextBtn   = document.querySelector('#nextOne');
  const feedback  = document.querySelector('#qFeedback');
  const progress  = document.querySelector('#qProgress');
  const restart   = document.querySelector('#restartQuiz');
  if(!qText || !qForm) return; // τρέχει μόνο στη σελίδα games.html

  // Fisher–Yates
  function shuffleArray(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
  function shuffled(n){ return shuffleArray(Array.from({length:n},(_,i)=>i)); }

  let order = shuffled(questionBank.length); // τυχαία σειρά ερωτήσεων
  let step = 0;
  // θα κρατάμε για ΚΑΘΕ ερώτηση τη σειρά των επιλογών της
  let optionOrderPerStep = [];

  function drawProgress(){
    progress.textContent = `${step+1} / ${order.length}`;
  }

  function renderQuestion(){
    const q = questionBank[order[step]];
    qText.textContent = `${step+1}. ${q.q}`;

    // αν δεν έχουμε ήδη τυχαία σειρά για αυτή την ερώτηση, φτιάξε τώρα
    if(!optionOrderPerStep[step]){
      optionOrderPerStep[step] = shuffled(q.a.length);
    }
    const perm = optionOrderPerStep[step];

    // εμφανίζουμε τις επιλογές με βάση το perm
    qForm.innerHTML = perm.map((origIdx,shownIdx)=>`
      <label style="display:block;margin:6px 0">
        <input type="radio" name="opt" value="${origIdx}">
        ${String.fromCharCode(65+shownIdx)}. ${q.a[origIdx]}
      </label>
    `).join('');

    feedback.textContent = '';
    submitBtn.disabled = false;
    nextBtn.disabled = true;
    drawProgress();
  }

  function submitCurrent(){
    const sel = qForm.querySelector('input[name="opt"]:checked');
    if(!sel){ feedback.textContent = 'Επίλεξε μια απάντηση.'; return; }
    const chosenOrigIndex = Number(sel.value);    // είναι το "original" index
    const q = questionBank[order[step]];
    const isCorrect = chosenOrigIndex === q.c;
    // βρες σε ποια θέση (A/B/C/D) βρίσκεται τώρα το σωστό μετά το perm
    const correctShownPos = optionOrderPerStep[step].indexOf(q.c);
    feedback.textContent = isCorrect
      ? '✅ Σωστό!'
      : `❌ Λάθος. Σωστό: ${String.fromCharCode(65+correctShownPos)}.`;
    submitBtn.disabled = true;
    nextBtn.disabled = false;
  }

  function nextQuestion(){
    if(step < order.length-1){
      step++;
      renderQuestion();
    } else {
      qText.textContent = 'Ολοκλήρωση! Θέλεις να ξαναπαίξεις;';
      qForm.innerHTML = '';
      feedback.textContent = '';
      submitBtn.disabled = true;
      nextBtn.disabled = true;
    }
  }

  submitBtn?.addEventListener('click', e=>{ e.preventDefault(); submitCurrent(); });
  nextBtn?.addEventListener('click',   e=>{ e.preventDefault(); nextQuestion(); });
  restart?.addEventListener('click', ()=>{
    order = shuffled(questionBank.length);
    step = 0;
    optionOrderPerStep = [];   // νέα τυχαία σειρά ΚΑΙ για τις απαντήσεις
    renderQuestion();
  });

  renderQuestion();
})();


// Τελικό: απόδοση auth περιοχής στο header
renderAuthArea();
