// Small helpers shared by every screen.
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('fr-FR');
export const money = (n) => nf.format(Math.round(Number(n) || 0)).replace(/[  ]/g, ' ') + ' DA';
export const num = (x) => { const n = parseFloat(String(x == null ? '' : x).replace(',', '.')); return isFinite(n) ? n : 0; };
export const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Phone numbers: 0555 12 34 56 -> 213555123456. Used as the login name.
export function digits(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0') && d.length >= 9 && d.length <= 10) d = '213' + d.slice(1);
  return d;
}
export const validPhone = (p) => /^\d{9,15}$/.test(digits(p));
// Firebase wants an email. The customer never sees this one.
export const emailFor = (p) => digits(p) + '@phone.shop';

export const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const fmtTime = (t) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (t, loc) => new Date(t).toLocaleString(loc || 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Builds one sale from cart lines using the CURRENT product prices and the
// private buy prices. Throws {code:'stock'|'missing'} when it cannot be sold.
export function buildSale(lines, prods, costs, discount) {
  const out = []; let sub = 0, cost = 0;
  for (const l of lines) {
    const p = prods[l.pid];
    if (!p) { const e = new Error('missing'); e.code = 'missing'; throw e; }
    if ((p.qty || 0) < l.qty) { const e = new Error('stock'); e.code = 'stock'; e.part = p.name; e.have = p.qty || 0; throw e; }
    const c = Number(costs[l.pid] || 0);
    out.push({ pid: l.pid, name: p.name, qty: l.qty, price: p.price, cost: c });
    sub += l.qty * p.price; cost += l.qty * c;
  }
  const d = Math.min(Math.max(Number(discount) || 0, 0), sub);
  return { lines: out, total: sub - d, discount: d, profit: sub - d - cost };
}

export function lsGet(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
export function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage can be blocked */ } }
