import { t } from './i18n.js';

let tt;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2800);
}

// Bottom sheet. Returns {el, close}.
export function sheet(html) {
  const s = document.createElement('div');
  s.className = 'scrim';
  s.innerHTML = '<div class="sheet" role="dialog">' + html + '</div>';
  document.body.appendChild(s);
  const close = () => s.remove();
  s.addEventListener('click', (e) => { if (e.target === s) close(); });
  s.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  return { el: s.firstChild, close };
}

// Two-tap confirm so a stray tap never deletes anything.
export function armed(btn, run) {
  if (btn.dataset.armed) { run(); return; }
  const old = btn.textContent;
  btn.dataset.armed = '1'; btn.textContent = t('tapAgain');
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 3000);
}

export function beep() {
  try {
    const C = window.AudioContext || window.webkitAudioContext; const c = new C();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(c.currentTime + 0.25);
  } catch (e) { /* no audio */ }
}

// Local notification through Capacitor when running as the Android app.
export async function notify(title, body) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const p = await LocalNotifications.checkPermissions();
    if (p.display !== 'granted') { const r = await LocalNotifications.requestPermissions(); if (r.display !== 'granted') return; }
    await LocalNotifications.schedule({ notifications: [{ id: Math.floor(Math.random() * 2e9), title, body }] });
  } catch (e) { /* notifications are optional */ }
}
export async function askNotifyPermission() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
  } catch (e) { /* ignore */ }
}
