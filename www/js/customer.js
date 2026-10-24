import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { t, getLang, setLang, locale } from './i18n.js';
import { $, esc, money, lsGet, lsSet, fmtDate } from './util.js';
import { toast, sheet } from './ui.js';

const STATUS_CLASS = { new: '', confirmed: 'ok', ready: 'ok', picked: 'ok', cancelled: 'bad', declined: 'bad' };

export function startCustomer(root, user, profile, signout, shopPhone) {
  const key = 'cart_' + user.uid;
  const S = { tab: 'shop', prods: [], orders: [], cat: '', q: '', cart: lsGet(key, {}), note: '', busy: false };
  const unsubs = [];
  let db;

  const cartLines = () => Object.entries(S.cart).map(([pid, qty]) => {
    const p = S.prods.find((x) => x.id === pid);
    return p ? { pid, name: p.name, qty: Math.min(qty, p.qty), price: p.price, max: p.qty } : null;
  }).filter((l) => l && l.qty > 0);
  const cartCount = () => cartLines().reduce((a, l) => a + l.qty, 0);
  const cartTotal = () => cartLines().reduce((a, l) => a + l.qty * l.price, 0);
  const saveCart = () => lsSet(key, S.cart);

  function shell() {
    root.innerHTML = '<header class="bar"><h1>' + esc(profile.name || t('appName')) + '</h1><button data-a="lang">🌐</button><button data-a="out">' + t('signout') + '</button></header>' +
      '<main id="main"></main><nav class="tabs">' +
      [['shop', '🔧', t('shop')], ['cart', '🧺', t('basket')], ['orders', '📦', t('myOrders')]].map(([id, ic, lb]) =>
        '<button data-tab="' + id + '" class="' + (S.tab === id ? 'on' : '') + '"><span class="ic">' + ic + '</span>' + lb + (id === 'cart' && cartCount() ? '<span class="badge">' + cartCount() + '</span>' : '') + '</button>').join('') + '</nav>';
    draw();
  }

  function stockPill(p) {
    if (p.qty <= 0) return '<span class="pill bad">' + t('outStock') + '</span>';
    if (p.qty <= (p.alertAt || 3)) return '<span class="pill warn">' + t('fewLeft') + '</span>';
    return '<span class="pill ok">' + t('inStock') + '</span>';
  }

  function viewShop() {
    const cats = [...new Set(S.prods.map((p) => p.category).filter(Boolean))];
    const q = S.q.trim().toLowerCase();
    const list = S.prods.filter((p) => (!S.cat || p.category === S.cat) && (!q || (p.name + ' ' + (p.compat || '') + ' ' + (p.sku || '')).toLowerCase().includes(q)))
      .sort((a, b) => (b.qty > 0) - (a.qty > 0) || a.name.localeCompare(b.name));
    return '<input id="q" type="search" placeholder="' + t('search') + '" value="' + esc(S.q) + '">' +
      '<div class="chips" style="margin-top:10px"><button data-cat="" class="' + (!S.cat ? 'on' : '') + '">' + t('all') + '</button>' +
      cats.map((c) => '<button data-cat="' + esc(c) + '" class="' + (S.cat === c ? 'on' : '') + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<div id="list">' + listHtml(list) + '</div>';
  }
  function listHtml(list) {
    if (!S.prods.length) return '<div class="center mute"><div class="emoji">🔧</div>' + t('noParts') + '</div>';
    if (!list.length) return '<div class="center mute">' + t('noMatch') + '</div>';
    return list.map((p) => {
      const n = S.cart[p.id] || 0;
      return '<div class="card"><div class="row"><div class="grow"><b>' + esc(p.name) + '</b>' + (p.compat ? '<div class="mute">' + esc(p.compat) + '</div>' : '') +
        '<div style="margin-top:6px">' + stockPill(p) + '</div></div><div style="text-align:end"><div class="big">' + money(p.price) + '</div>' +
        (p.qty > 0 ? (n ? '<div class="qty" style="margin-top:6px"><button data-dec="' + p.id + '">−</button><b>' + n + '</b><button data-inc="' + p.id + '">+</button></div>' :
          '<button class="btn sm" style="margin-top:6px" data-inc="' + p.id + '">+ ' + t('basket') + '</button>') : '') + '</div></div></div>';
    }).join('');
  }

  function viewCart() {
    const ls = cartLines();
    if (!ls.length) return '<div class="center mute"><div class="emoji">🧺</div>' + t('emptyBasket') + '</div>';
    return '<h2>' + t('yourBasket') + ' · ' + t('items', cartCount()) + '</h2>' + ls.map((l) =>
      '<div class="card"><div class="row"><div class="grow"><b>' + esc(l.name) + '</b><div class="mute">' + money(l.price) + ' ' + t('each') + (l.qty >= l.max ? ' · ' + t('onlyN', l.max) : '') + '</div></div>' +
      '<div class="qty"><button data-dec="' + l.pid + '">−</button><b>' + l.qty + '</b><button data-inc="' + l.pid + '">+</button></div></div></div>').join('') +
      '<label class="f"><span>' + t('note') + '</span><textarea id="note" rows="2" placeholder="' + t('notePh') + '">' + esc(S.note) + '</textarea></label>' +
      '<div class="card"><div class="line"><span>' + t('total') + '</span><span class="big">' + money(cartTotal()) + '</span></div><div class="mute">' + t('payNote') + '</div></div>' +
      '<button class="btn full" data-a="order"' + (S.busy ? ' disabled' : '') + '>' + t('placeOrder') + '</button>' +
      '<p class="center" style="padding:10px"><a href="#" data-a="clear" style="color:var(--bad)">' + t('emptyBasket') + '</a></p>';
  }

  function viewOrders() {
    if (!S.orders.length) return '<div class="center mute"><div class="emoji">📦</div>' + t('noOrders') + '</div>';
    return S.orders.map((o) => '<div class="card"><div class="row"><div class="grow"><b>' + t('orderNo') + ' · ' + esc(fmtDate(o.createdAt, locale())) + '</b></div>' +
      '<span class="pill ' + (STATUS_CLASS[o.status] || '') + '">' + t('st_' + o.status) + '</span></div><div class="sep"></div>' +
      (o.lines || []).map((l) => '<div class="line"><span>' + l.qty + ' × ' + esc(l.name) + '</span><span>' + money(l.qty * l.price) + '</span></div>').join('') +
      '<div class="sep"></div><div class="line"><b>' + t('total') + '</b><b>' + money(o.total) + '</b></div>' + (o.note ? '<div class="mute">' + esc(o.note) + '</div>' : '') + '</div>').join('');
  }

  function draw() {
    const m = $('#main'); if (!m) return;
    m.innerHTML = S.tab === 'shop' ? viewShop() : S.tab === 'cart' ? viewCart() : viewOrders();
    document.querySelectorAll('nav.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
    const cb = document.querySelector('nav.tabs [data-tab="cart"]'); const bd = cb && cb.querySelector('.badge');
    if (bd) bd.remove();
    if (cb && cartCount()) cb.insertAdjacentHTML('beforeend', '<span class="badge">' + cartCount() + '</span>');
  }

  async function place() {
    const ls = cartLines(); if (!ls.length || S.busy) return;
    S.busy = true; draw();
    try {
      const now = Date.now();
      await addDoc(collection(db, 'orders'), {
        uid: user.uid, name: profile.name, phone: profile.phone, status: 'new', createdAt: now, updatedAt: now,
        lines: ls.map((l) => ({ pid: l.pid, name: l.name, qty: l.qty, price: l.price })), total: cartTotal(), note: S.note.trim()
      });
      S.cart = {}; S.note = ''; saveCart(); S.tab = 'orders'; toast(t('orderSent'));
    } catch (e) { toast(t('orderFail')); }
    S.busy = false; draw();
  }

  root.onclick = (e) => {
    const g = (a) => e.target.closest('[' + a + ']');
    let el;
    if ((el = g('data-tab'))) { S.tab = el.dataset.tab; draw(); }
    else if ((el = g('data-cat'))) { S.cat = el.dataset.cat; draw(); }
    else if ((el = g('data-inc'))) { const p = S.prods.find((x) => x.id === el.dataset.inc); const n = (S.cart[el.dataset.inc] || 0) + 1; if (p && n <= p.qty) { S.cart[p.id] = n; saveCart(); draw(); } else if (p) toast(t('onlyN', p.qty)); }
    else if ((el = g('data-dec'))) { const id = el.dataset.dec; const n = (S.cart[id] || 0) - 1; if (n > 0) S.cart[id] = n; else delete S.cart[id]; saveCart(); draw(); }
    else if ((el = g('data-a'))) {
      const a = el.dataset.a;
      if (a === 'order') place();
      else if (a === 'clear') { e.preventDefault(); S.cart = {}; saveCart(); draw(); }
      else if (a === 'out') signout();
      else if (a === 'lang') {
        const s = sheet('<h2>' + t('language') + '</h2>' + ['ar', 'fr', 'en'].map((l) => '<button class="btn ' + (l === getLang() ? '' : 'alt') + ' full" style="margin-bottom:8px" data-pick="' + l + '">' + { ar: 'العربية', fr: 'Français', en: 'English' }[l] + '</button>').join(''));
        s.el.onclick = (ev) => { const b = ev.target.closest('[data-pick]'); if (b) { setLang(b.dataset.pick); s.close(); shell(); } };
      }
    }
  };
  root.oninput = (e) => {
    if (e.target.id === 'q') { S.q = e.target.value; const list = $('#list'); if (list) { const q = S.q.trim().toLowerCase(); list.innerHTML = listHtml(S.prods.filter((p) => (!S.cat || p.category === S.cat) && (!q || (p.name + ' ' + (p.compat || '') + ' ' + (p.sku || '')).toLowerCase().includes(q)))); } }
    if (e.target.id === 'note') S.note = e.target.value;
  };

  import('./fb.js').then((m) => {
    db = m.db; shell();
    unsubs.push(onSnapshot(collection(db, 'products'), (snap) => {
      S.prods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // forget basket lines for parts that disappeared
      for (const id of Object.keys(S.cart)) if (!S.prods.find((p) => p.id === id)) delete S.cart[id];
      if (!(document.activeElement && (document.activeElement.id === 'q' || document.activeElement.id === 'note'))) draw();
    }, () => toast(t('errNet'))));
    unsubs.push(onSnapshot(query(collection(db, 'orders'), where('uid', '==', user.uid)), (snap) => {
      const prev = new Map(S.orders.map((o) => [o.id, o.status]));
      S.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
      for (const o of S.orders) if (prev.has(o.id) && prev.get(o.id) !== o.status) toast(t('orderNo') + ': ' + t('st_' + o.status));
      if (!(document.activeElement && document.activeElement.id === 'note')) draw();
    }));
  });
  return () => unsubs.forEach((u) => u());
}
