import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { configured } from './config.js';
import { t, setLang, getLang, applyDir } from './i18n.js';
import { esc, $, digits, validPhone, emailFor } from './util.js';
import { toast } from './ui.js';

const root = document.getElementById('root');
applyDir();
let stop = null;          // cleanup of the current screen
let pendingName = '';     // name typed at sign-up
let mode = 'in';          // auth screen mode
let signingUp = false;    // pause routing while the profile document is being written

const langBar = () => '<div class="row" style="justify-content:center;margin-top:18px">' +
  ['ar', 'fr', 'en'].map((l) => '<button class="btn sm ' + (l === getLang() ? '' : 'alt') + '" data-lang="' + l + '">' + { ar: 'العربية', fr: 'Français', en: 'English' }[l] + '</button>').join('') + '</div>';

root.addEventListener('click', (e) => {
  const l = e.target.closest('[data-lang]');
  if (l) { setLang(l.dataset.lang); route(); }
});

function cleanup() { if (stop) { stop(); stop = null; } }

function authErr(e) {
  const c = e && e.code || '';
  if (c.includes('email-already-in-use')) return t('errExists');
  if (c.includes('network')) return t('errNet');
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login')) return t('errBadLogin');
  return t('errOther');
}

function showAuth() {
  cleanup();
  const up = mode === 'up';
  root.innerHTML = '<div class="auth"><h1>' + t('appName') + '</h1><p class="mute">' + (up ? t('signup') : t('signin')) + '</p>' +
    (up ? '<label class="f"><span>' + t('name') + '</span><input id="a-name" autocomplete="name"></label>' : '') +
    '<label class="f"><span>' + t('phone') + '</span><input id="a-phone" type="tel" inputmode="tel" placeholder="' + t('phoneHint') + '" autocomplete="username"></label>' +
    '<label class="f"><span>' + t('password') + '</span><input id="a-pass" type="password" placeholder="' + (up ? t('passHint') : '') + '" autocomplete="' + (up ? 'new-password' : 'current-password') + '"></label>' +
    '<div class="err" id="a-err"></div>' +
    '<button class="btn full" id="a-go">' + (up ? t('signup') : t('signin')) + '</button>' +
    '<p class="center" style="padding:14px 0 0"><a href="#" id="a-sw" style="color:var(--pri)">' + (up ? t('haveAcc') : t('noAcc')) + '</a></p>' + langBar() + '</div>';
  $('#a-sw').onclick = (e) => { e.preventDefault(); mode = up ? 'in' : 'up'; showAuth(); };
  $('#a-go').onclick = async () => {
    const err = $('#a-err'); const go = $('#a-go');
    const phone = $('#a-phone').value, pass = $('#a-pass').value, name = up ? $('#a-name').value.trim() : '';
    if (up && !name) { err.textContent = t('errName'); return; }
    if (!validPhone(phone)) { err.textContent = t('errPhone'); return; }
    if (pass.length < 6) { err.textContent = t('errPass'); return; }
    err.textContent = ''; go.disabled = true;
    try {
      const { auth } = await import('./fb.js');
      if (up) {
        pendingName = name; signingUp = true;
        const cred = await createUserWithEmailAndPassword(auth, emailFor(phone), pass);
        try { await createProfile(cred.user, name, phone); } finally { signingUp = false; }
        route();
      } else {
        await signInWithEmailAndPassword(auth, emailFor(phone), pass);
      }
    } catch (e) { signingUp = false; err.textContent = authErr(e); go.disabled = false; if (up && e && e.code === undefined) route(); }
  };
}

async function createProfile(user, name, phone) {
  const { db } = await import('./fb.js');
  await setDoc(doc(db, 'users', user.uid), { name, phone: digits(phone), status: 'pending', createdAt: Date.now() });
}

function showProfileForm(user) {
  cleanup();
  const ph = (user.email || '').split('@')[0];
  root.innerHTML = '<div class="auth"><h1>' + t('createProfileTitle') + '</h1><p class="mute">' + t('createProfileText') + '</p>' +
    '<label class="f"><span>' + t('name') + '</span><input id="p-name" value="' + esc(pendingName) + '"></label><div class="err" id="p-err"></div>' +
    '<button class="btn full" id="p-go">' + t('send') + '</button><p class="center"><a href="#" id="p-out" style="color:var(--pri)">' + t('signout') + '</a></p></div>';
  $('#p-out').onclick = async (e) => { e.preventDefault(); const { auth } = await import('./fb.js'); signOut(auth); };
  $('#p-go').onclick = async () => {
    const n = $('#p-name').value.trim(); if (!n) { $('#p-err').textContent = t('errName'); return; }
    try { await createProfile(user, n, ph); route(); } catch (e) { $('#p-err').textContent = t('errOther'); }
  };
}

function showWaiting(user, status, shopPhone) {
  const blocked = status === 'blocked';
  root.innerHTML = '<div class="auth"><div class="center"><div class="emoji">' + (blocked ? '🚫' : '⏳') + '</div><h2>' + (blocked ? t('blockedTitle') : t('pendingTitle')) + '</h2>' +
    '<p class="mute">' + (blocked ? t('blockedText') : t('pendingText')) + '</p></div>' +
    (shopPhone ? '<a class="btn alt full" href="tel:' + esc(shopPhone) + '">📞 ' + t('callShop') + '</a>' : '') +
    '<div class="card" style="margin-top:18px"><b>' + t('ownerBox') + '</b><p class="mute">' + t('ownerHint') + '</p>' +
    '<div class="row"><input readonly value="' + esc(user.uid) + '" id="w-uid"><button class="btn sm" id="w-copy">' + t('copy') + '</button></div></div>' +
    '<button class="btn alt full" id="w-chk">' + t('checkAgain') + '</button>' +
    '<p class="center"><a href="#" id="w-out" style="color:var(--pri)">' + t('signout') + '</a></p>' + langBar() + '</div>';
  $('#w-copy').onclick = async () => { try { await navigator.clipboard.writeText(user.uid); toast(t('copied')); } catch (e) { $('#w-uid').select(); } };
  $('#w-chk').onclick = () => route();
  $('#w-out').onclick = async (e) => { e.preventDefault(); const { auth } = await import('./fb.js'); signOut(auth); };
}

async function route() {
  if (signingUp) return;
  if (!configured()) { root.innerHTML = '<div class="auth"><div class="center"><div class="emoji">⚙️</div><p>' + t('needSetup') + '</p></div>' + langBar() + '</div>'; return; }
  const { auth, db } = await import('./fb.js');
  const user = auth.currentUser;
  if (!user) { showAuth(); return; }
  cleanup();
  root.innerHTML = '<div class="center mute">' + t('loading') + '</div>';
  const signout = () => signOut(auth);
  try {
    const adm = await getDoc(doc(db, 'admins', user.uid));
    if (adm.exists()) { const m = await import('./owner.js'); stop = m.startOwner(root, user, signout, route); return; }
    let shopPhone = '';
    try { const s = await getDoc(doc(db, 'settings', 'shop')); shopPhone = s.exists() ? (s.data().phone || '') : ''; } catch (e) { /* optional */ }
    const me = await getDoc(doc(db, 'users', user.uid));
    if (!me.exists()) { showProfileForm(user); return; }
    // Live: the screen changes by itself the moment the owner approves.
    let shown = '', child = null;
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      const st = snap.exists() ? snap.data().status : 'pending';
      if (st === shown) return;
      shown = st;
      if (child) { child(); child = null; }
      if (st === 'approved') { const m = await import('./customer.js'); child = m.startCustomer(root, user, snap.data(), signout, shopPhone); }
      else showWaiting(user, st, shopPhone);
    });
    stop = () => { unsub(); if (child) child(); };
  } catch (e) {
    root.innerHTML = '<div class="auth"><div class="center"><p>' + t('errNet') + '</p><p class="mute" dir="ltr">' + esc(String(e && e.code ? e.code : (e && e.message ? e.message : e))) + '</p><button class="btn" id="r-retry">' + t('checkAgain') + '</button></div>' + langBar() + '</div>';
    $('#r-retry').onclick = () => route();
  }
}

if (!configured()) route();
else import('./fb.js').then(({ auth }) => { onAuthStateChanged(auth, () => route()); });
