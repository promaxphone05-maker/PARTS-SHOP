// In-memory Firebase stand-in shared between tabs through localStorage. Tests only.
const K = '__fake_db';
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || { docs: {}, users: {} }; } catch (e) { return { docs: {}, users: {} }; } };
const save = (s) => { localStorage.setItem(K, JSON.stringify(s)); fire(); };
const subs = new Set();
const fire = () => subs.forEach((f) => f());
addEventListener('storage', (e) => { if (e.key === K || e.key === '__fake_auth') { fire(); authFire(); } });
let idn = 0; const nid = () => 'id' + Date.now().toString(36) + (idn++);

export const initializeApp = () => ({});
export const initializeFirestore = () => ({ fake: true });
const authSubs = new Set();
const authFire = () => authSubs.forEach((f) => f(auth.currentUser));
const auth = { get currentUser() { try { return JSON.parse(sessionStorage.getItem('__fake_auth')); } catch (e) { return null; } } };
export const getAuth = () => auth;
export const onAuthStateChanged = (a, f) => { authSubs.add(f); setTimeout(() => f(auth.currentUser), 0); return () => authSubs.delete(f); };
const err = (code) => Object.assign(new Error(code), { code });
export const createUserWithEmailAndPassword = async (a, email, pw) => {
  const s = load(); if (s.users[email]) throw err('auth/email-already-in-use');
  const u = { uid: 'u_' + email.split('@')[0], email }; s.users[email] = { pw, uid: u.uid }; save(s);
  sessionStorage.setItem('__fake_auth', JSON.stringify(u)); authFire(); return { user: u };
};
export const signInWithEmailAndPassword = async (a, email, pw) => {
  const s = load(); const r = s.users[email]; if (!r || r.pw !== pw) throw err('auth/invalid-credential');
  const u = { uid: r.uid, email }; sessionStorage.setItem('__fake_auth', JSON.stringify(u)); authFire(); return { user: u };
};
export const signOut = async () => { sessionStorage.removeItem('__fake_auth'); authFire(); };

export const collection = (db, name) => ({ col: name });
export const doc = (db, a, b) => (db && db.col ? { col: db.col, id: nid() } : a && a.col ? { col: a.col, id: b || nid() } : { col: a, id: b || nid() });
const snapDoc = (col, id, data) => ({ id, exists: () => data !== undefined, data: () => (data === undefined ? undefined : JSON.parse(JSON.stringify(data))) });
const colDocs = (name) => { const s = load(); return Object.entries(s.docs).filter(([k]) => k.startsWith(name + '/')).map(([k, v]) => ({ id: k.slice(name.length + 1), data: v })); };
export const getDoc = async (r) => snapDoc(r.col, r.id, load().docs[r.col + '/' + r.id]);
export const setDoc = async (r, d) => { const s = load(); s.docs[r.col + '/' + r.id] = JSON.parse(JSON.stringify(d)); save(s); };
export const updateDoc = async (r, d) => { const s = load(); const k = r.col + '/' + r.id; if (!s.docs[k]) throw err('not-found'); s.docs[k] = { ...s.docs[k], ...d }; save(s); };
export const deleteDoc = async (r) => { const s = load(); delete s.docs[r.col + '/' + r.id]; save(s); };
export const addDoc = async (c, d) => { const r = doc(null, c); await setDoc(r, d); return r; };
export const where = (f, op, v) => ({ f, op, v });
export const query = (c, w) => ({ col: c.col, w });
export const onSnapshot = (ref, cb) => {
  const run = () => {
    if (ref.id !== undefined && !ref.w) { cb(snapDoc(ref.col, ref.id, load().docs[ref.col + '/' + ref.id])); return; }
    let l = colDocs(ref.col); if (ref.w) l = l.filter((x) => x.data[ref.w.f] === ref.w.v);
    cb({ docs: l.map((x) => snapDoc(ref.col, x.id, x.data)) });
  };
  subs.add(run); setTimeout(run, 0); return () => subs.delete(run);
};
export const runTransaction = async (db, fn) => {
  const s = load(); const writes = [];
  const tx = {
    get: async (r) => snapDoc(r.col, r.id, s.docs[r.col + '/' + r.id]),
    update: (r, d) => writes.push(() => { s.docs[r.col + '/' + r.id] = { ...s.docs[r.col + '/' + r.id], ...d }; }),
    set: (r, d) => writes.push(() => { s.docs[r.col + '/' + r.id] = JSON.parse(JSON.stringify(d)); })
  };
  const out = await fn(tx); writes.forEach((w) => w()); save(s); return out;
};
