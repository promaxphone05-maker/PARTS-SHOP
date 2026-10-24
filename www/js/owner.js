import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, runTransaction, addDoc } from 'firebase/firestore';
import { t, getLang, setLang, locale, CATEGORY_SUGGESTIONS } from './i18n.js';
import { $, esc, money, num, uid, lsGet, lsSet, startOfDay, fmtDate, fmtTime } from './util.js';
import { toast, sheet, armed, beep, notify, askNotifyPermission } from './ui.js';
import { MAX_CUSTOMERS } from './config.js';

const OPEN = ['new', 'confirmed', 'ready'];

export function startOwner(root, user, signout) {
  const S = { tab: 'orders', prods: {}, costs: {}, orders: [], users: [], sales: [], shop: {}, ofilter: 'open', q: '', low: false, cart: {}, range: 'today', loaded: false };
  const unsubs = [];
  let db;
  const prodList = () => Object.values(S.prods);

  // ---------- data writes ----------
  async function recordSale({ lines, discount = 0, note = '', orderId = null, customer = '' }) {
    const ids = [...new Set(lines.map((l) => l.pid))];
    const res = await runTransaction(db, async (tx) => {
      const ps = {}, cs = {};
      for (const id of ids) {
        const p = await tx.get(doc(db, 'products', id)); if (!p.exists()) { const e = new Error('missing'); e.code = 'missing'; throw e; }
        ps[id] = p.data();
        const c = await tx.get(doc(db, 'costs', id)); cs[id] = c.exists() ? Number(c.data().cost || 0) : 0;
      }
      const need = {};
      for (const l of lines) need[l.pid] = (need[l.pid] || 0) + l.qty;
      for (const id of ids) if ((ps[id].qty || 0) < need[id]) { const e = new Error('stock'); e.code = 'stock'; e.part = ps[id].name; e.have = ps[id].qty || 0; throw e; }
      let sub = 0, cost = 0; const out = [];
      for (const l of lines) { const price = ps[l.pid].price; out.push({ pid: l.pid, name: ps[l.pid].name, qty: l.qty, price, cost: cs[l.pid] }); sub += l.qty * price; cost += l.qty * cs[l.pid]; }
      const d = Math.min(Math.max(num(discount), 0), sub);
      for (const id of ids) tx.update(doc(db, 'products', id), { qty: ps[id].qty - need[id] });
      const sref = doc(collection(db, 'sales'));
      tx.set(sref, { at: Date.now(), lines: out, discount: d, total: sub - d, profit: sub - d - cost, note, customer, orderId });
      if (orderId) tx.update(doc(db, 'orders', orderId), { status: 'picked', updatedAt: Date.now() });
      return { total: sub - d };
    });
    return res;
  }
  function saleError(e) {
    if (e && e.code === 'stock') toast(t('notInStock', e.part, e.have));
    else if (e && e.code === 'missing') toast(t('partGone'));
    else toast(t('errNet'));
  }
  const setStatus = (id, status) => updateDoc(doc(db, 'orders', id), { status, updatedAt: Date.now() }).catch(() => toast(t('errNet')));

  // ---------- views ----------
  function shell() {
    root.innerHTML = '<header class="bar"><h1 id="ttl"></h1><button data-a="settings">⚙️</button></header><main id="main"></main><nav class="tabs" id="tabs"></nav>';
    draw();
  }
  function tabs() {
    const newN = S.orders.filter((o) => o.status === 'new').length;
    const pend = S.users.filter((u) => u.status === 'pending').length;
    const T = [['orders', '📦', t('tabOrders'), newN], ['sell', '🛒', t('tabSell'), 0], ['stock', '🔧', t('tabStock'), 0], ['customers', '👥', t('tabCustomers'), pend], ['sales', '📊', t('tabSales'), 0]];
    $('#tabs').innerHTML = T.map(([id, ic, lb, n]) => '<button data-tab="' + id + '" class="' + (S.tab === id ? 'on' : '') + '"><span class="ic">' + ic + '</span>' + lb + (n ? '<span class="badge">' + n + '</span>' : '') + '</button>').join('');
    $('#ttl').textContent = S.shop.name || t('appName');
  }

  function orderCard(o) {
    const act = {
      new: '<button class="btn sm" data-ost="confirmed" data-id="' + o.id + '">✔ ' + t('confirm') + '</button><button class="btn sm alt" data-ost="declined" data-id="' + o.id + '">' + t('decline') + '</button>',
      confirmed: '<button class="btn sm" data-ost="ready" data-id="' + o.id + '">' + t('ready') + '</button><button class="btn sm alt" data-ost="cancelled" data-id="' + o.id + '">' + t('cancelOrder') + '</button>',
      ready: '<button class="btn sm" data-pick="' + o.id + '">' + t('picked') + '</button><button class="btn sm alt" data-ost="cancelled" data-id="' + o.id + '">' + t('cancelOrder') + '</button>',
      cancelled: '<button class="btn sm alt" data-ost="new" data-id="' + o.id + '">' + t('reopen') + '</button>',
      declined: '<button class="btn sm alt" data-ost="new" data-id="' + o.id + '">' + t('reopen') + '</button>', picked: ''
    }[o.status] || '';
    return '<div class="card"><div class="row"><div class="grow"><b>' + esc(o.name) + '</b> <span class="mute">' + esc(fmtDate(o.createdAt, locale())) + '</span></div><span class="pill ' + (o.status === 'new' ? 'warn' : ['cancelled', 'declined'].includes(o.status) ? 'bad' : 'ok') + '">' + t('st_' + o.status) + '</span></div>' +
      '<div class="sep"></div>' + (o.lines || []).map((l) => {
        const p = S.prods[l.pid]; const short = p && p.qty < l.qty && OPEN.includes(o.status);
        return '<div class="line"><span>' + l.qty + ' × ' + esc(l.name) + (short ? ' <span class="pill bad">' + t('onlyN', p.qty) + '</span>' : '') + '</span><span>' + money(l.qty * l.price) + '</span></div>';
      }).join('') + '<div class="sep"></div><div class="line"><b>' + t('total') + '</b><b>' + money(o.total) + '</b></div>' +
      (o.note ? '<div class="mute">📝 ' + esc(o.note) + '</div>' : '') +
      '<div class="row" style="flex-wrap:wrap;margin-top:10px"><a class="btn sm alt" href="tel:+' + esc(o.phone) + '">📞 ' + t('callCustomer') + '</a>' + act + '</div></div>';
  }
  function viewOrders() {
    const list = S.orders.filter((o) => S.ofilter === 'open' ? OPEN.includes(o.status) : !OPEN.includes(o.status));
    return '<div class="chips"><button data-of="open" class="' + (S.ofilter === 'open' ? 'on' : '') + '">' + t('open') + '</button><button data-of="closed" class="' + (S.ofilter === 'closed' ? 'on' : '') + '">' + t('closed') + '</button></div>' +
      (list.length ? list.map(orderCard).join('') : '<div class="center mute"><div class="emoji">📦</div>' + (S.ofilter === 'open' ? t('noOpen') : t('noClosed')) + '</div>');
  }

  function matches(p) { const q = S.q.trim().toLowerCase(); return !q || (p.name + ' ' + (p.compat || '') + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase().includes(q); }
  function sellList() {
    const l = prodList().filter(matches).sort((a, b) => a.name.localeCompare(b.name));
    if (!l.length) return '<div class="center mute">' + (prodList().length ? t('noMatch') : t('noPartsOwner')) + '</div>';
    return l.map((p) => '<div class="card"><div class="row"><div class="grow"><b>' + esc(p.name) + '</b><div class="mute">' + esc(p.compat || '') + '</div><span class="pill ' + (p.qty <= 0 ? 'bad' : p.qty <= (p.alertAt || 3) ? 'warn' : 'ok') + '">' + p.qty + '</span></div><div style="text-align:end"><div class="big">' + money(p.price) + '</div>' +
      (p.qty > 0 ? '<button class="btn sm" data-add="' + p.id + '">+</button>' : '') + '</div></div></div>').join('');
  }
  function viewSell() {
    const ls = Object.entries(S.cart).filter(([id]) => S.prods[id]);
    const sub = ls.reduce((a, [id, q]) => a + q * S.prods[id].price, 0);
    return (ls.length ? '<div class="card"><h2>' + t('currentSale') + '</h2>' + ls.map(([id, q]) => '<div class="row" style="margin-bottom:6px"><div class="grow">' + esc(S.prods[id].name) + '<div class="mute">' + money(S.prods[id].price) + '</div></div><div class="qty"><button data-sdec="' + id + '">−</button><b>' + q + '</b><button data-add="' + id + '">+</button></div></div>').join('') +
      '<div class="grid2"><label class="f"><span>' + t('discount') + '</span><input id="disc" type="number" inputmode="decimal" value="' + esc(S.disc || '') + '"></label><label class="f"><span>' + t('customerNote') + '</span><input id="snote" value="' + esc(S.snote || '') + '"></label></div>' +
      '<div class="line"><b>' + t('total') + '</b><b class="big" id="stot">' + money(Math.max(0, sub - num(S.disc))) + '</b></div><button class="btn full" data-a="sell">' + t('recordSale') + '</button></div>' : '') +
      '<input id="q" type="search" placeholder="' + t('search') + '" value="' + esc(S.q) + '" style="margin-bottom:10px"><div id="list">' + sellList() + '</div>';
  }

  function stockList() {
    let l = prodList().filter(matches); if (S.low) l = l.filter((p) => p.qty <= (p.alertAt || 3));
    l.sort((a, b) => a.name.localeCompare(b.name));
    if (!l.length) return '<div class="center mute"><div class="emoji">🔧</div>' + (prodList().length ? t('noMatch') : t('noPartsOwner')) + '</div>';
    return l.map((p) => '<div class="card" data-edit="' + p.id + '"><div class="row"><div class="grow"><b>' + esc(p.name) + '</b><div class="mute">' + esc([p.category, p.compat, p.sku].filter(Boolean).join(' · ')) + '</div></div><div style="text-align:end"><div><b>' + money(p.price) + '</b></div><span class="pill ' + (p.qty <= 0 ? 'bad' : p.qty <= (p.alertAt || 3) ? 'warn' : 'ok') + '">' + (p.qty <= 0 ? t('out') : p.qty <= (p.alertAt || 3) ? t('low') + ' · ' + p.qty : p.qty) + '</span></div></div></div>').join('');
  }
  function viewStock() {
    const l = prodList(); const units = l.reduce((a, p) => a + (p.qty || 0), 0); const val = l.reduce((a, p) => a + (p.qty || 0) * (S.costs[p.id] || 0), 0);
    const re = l.filter((p) => p.qty <= (p.alertAt || 3)).length;
    return '<div class="stats"><div class="card"><div class="mute">' + t('partsListed') + '</div><div class="big">' + l.length + '</div></div><div class="card"><div class="mute">' + t('unitsOnShelf') + '</div><div class="big">' + units + '</div></div><div class="card"><div class="mute">' + t('stockCost') + '</div><div class="big">' + money(val) + '</div></div><div class="card"><div class="mute">' + t('reorder') + '</div><div class="big">' + re + '</div></div></div>' +
      '<button class="btn full" data-a="addpart" style="margin-bottom:10px">' + t('addPart') + '</button><input id="q" type="search" placeholder="' + t('search') + '" value="' + esc(S.q) + '">' +
      '<div class="chips" style="margin-top:10px"><button data-a="low" class="' + (S.low ? 'on' : '') + '">' + t('lowOnly') + '</button></div><div id="list">' + stockList() + '</div>';
  }

  function viewCustomers() {
    const g = (s) => S.users.filter((u) => u.status === s).sort((a, b) => b.createdAt - a.createdAt);
    const approved = g('approved');
    const card = (u, btns) => '<div class="card"><div class="row"><div class="grow"><b>' + esc(u.name) + '</b><div class="mute">+' + esc(u.phone) + ' · ' + t('joined') + ' ' + esc(fmtDate(u.createdAt, locale())) + '</div></div></div><div class="row" style="margin-top:8px;flex-wrap:wrap"><a class="btn sm alt" href="tel:+' + esc(u.phone) + '">📞</a>' + btns + '</div></div>';
    const b = (a, id, lb, cls) => '<button class="btn sm ' + (cls || '') + '" data-u="' + a + '" data-id="' + id + '">' + lb + '</button>';
    return '<div class="mute" style="margin-bottom:8px">' + approved.length + ' / ' + MAX_CUSTOMERS + '</div>' +
      '<h2>' + t('pendingReq') + '</h2>' + (g('pending').map((u) => card(u, b('approve', u.id, '✔ ' + t('approve')) + b('block', u.id, t('block'), 'alt'))).join('') || '<div class="mute">' + t('noPending') + '</div>') +
      '<h2>' + t('approvedList') + '</h2>' + (approved.map((u) => card(u, b('block', u.id, t('block'), 'alt') + b('remove', u.id, t('remove'), 'alt'))).join('') || '<div class="mute">' + t('noCustomers') + '</div>') +
      (g('blocked').length ? '<h2>' + t('blockedList') + '</h2>' + g('blocked').map((u) => card(u, b('approve', u.id, t('unblock')) + b('remove', u.id, t('remove'), 'alt'))).join('') : '');
  }

  function viewSales() {
    const from = S.range === 'today' ? startOfDay(Date.now()) : S.range === 'week' ? startOfDay(Date.now()) - 6 * 864e5 : 0;
    const l = S.sales.filter((s) => s.at >= from).sort((a, b) => b.at - a.at);
    const rev = l.reduce((a, s) => a + s.total, 0), pr = l.reduce((a, s) => a + s.profit, 0), pcs = l.reduce((a, s) => a + s.lines.reduce((x, y) => x + y.qty, 0), 0);
    return '<div class="chips">' + [['today', t('today')], ['week', t('days7')], ['all', t('allTime')]].map(([k, lb]) => '<button data-range="' + k + '" class="' + (S.range === k ? 'on' : '') + '">' + lb + '</button>').join('') + '</div>' +
      '<div class="stats"><div class="card"><div class="mute">' + t('revenue') + '</div><div class="big">' + money(rev) + '</div></div><div class="card"><div class="mute">' + t('profit') + '</div><div class="big" style="color:var(--ok)">' + money(pr) + '</div></div><div class="card"><div class="mute">' + t('salesCount') + '</div><div class="big">' + l.length + '</div></div><div class="card"><div class="mute">' + t('partsSold') + '</div><div class="big">' + pcs + '</div></div></div>' +
      (l.length ? l.slice(0, 100).map((s) => '<div class="card"><div class="row"><div class="grow">' + s.lines.map((x) => x.qty + ' × ' + esc(x.name)).join('<br>') + (s.customer || s.note ? '<div class="mute">' + esc(s.customer || s.note) + '</div>' : '') + '<div class="mute">' + esc(fmtDate(s.at, locale())) + '</div></div><div style="text-align:end"><b>' + money(s.total) + '</b><div class="mute" style="color:var(--ok)">+' + money(s.profit) + '</div></div></div></div>').join('') : '<div class="center mute">' + t('noSales') + '</div>');
  }

  function draw() {
    const m = $('#main'); if (!m) return;
    const keep = document.activeElement && ['q', 'disc', 'snote'].includes(document.activeElement.id) ? document.activeElement.id : null;
    m.innerHTML = { orders: viewOrders, sell: viewSell, stock: viewStock, customers: viewCustomers, sales: viewSales }[S.tab]();
    tabs();
    if (keep && $('#' + keep)) { const el = $('#' + keep); el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* number inputs */ } }
  }

  // ---------- sheets ----------
  function partSheet(id) {
    const p = id ? S.prods[id] : { name: '', compat: '', category: '', sku: '', qty: 0, alertAt: 3, price: 0 };
    const cost = id ? (S.costs[id] || 0) : 0;
    const cats = CATEGORY_SUGGESTIONS[getLang()];
    const s = sheet('<h2>' + (id ? t('editPart') : t('addPart')) + '</h2>' +
      '<label class="f"><span>' + t('partName') + '</span><input id="f-name" value="' + esc(p.name) + '"></label>' +
      '<label class="f"><span>' + t('compat') + '</span><input id="f-compat" value="' + esc(p.compat || '') + '"></label>' +
      '<div class="grid2"><label class="f"><span>' + t('category') + '</span><input id="f-cat" list="cats" value="' + esc(p.category || '') + '"><datalist id="cats">' + cats.map((c) => '<option value="' + esc(c) + '">').join('') + '</datalist></label><label class="f"><span>' + t('sku') + '</span><input id="f-sku" value="' + esc(p.sku || '') + '"></label></div>' +
      '<div class="grid2"><label class="f"><span>' + t('buy') + '</span><input id="f-cost" type="number" inputmode="decimal" value="' + cost + '"></label><label class="f"><span>' + t('sell') + '</span><input id="f-price" type="number" inputmode="decimal" value="' + p.price + '"></label></div>' +
      '<div class="mute" id="f-mg"></div><div class="grid2"><label class="f"><span>' + t('qty') + '</span><input id="f-qty" type="number" inputmode="numeric" value="' + p.qty + '"></label><label class="f"><span>' + t('alertAt') + '</span><input id="f-al" type="number" inputmode="numeric" value="' + (p.alertAt || 3) + '"></label></div>' +
      '<div class="row" style="margin-top:12px"><button class="btn grow" id="f-save">' + t('save') + '</button>' + (id ? '<button class="btn bad" id="f-del">' + t('delete') + '</button>' : '') + '</div>');
    const mg = () => { const c = num($('#f-cost').value), pr = num($('#f-price').value); $('#f-mg').textContent = pr > 0 ? t('margin', money(pr - c), Math.round((pr - c) / pr * 100)) : ''; };
    s.el.oninput = mg; mg();
    $('#f-save').onclick = async () => {
      const name = $('#f-name').value.trim(); if (!name) { $('#f-name').focus(); return; }
      const pid = id || uid('p');
      try {
        await setDoc(doc(db, 'products', pid), { name, compat: $('#f-compat').value.trim(), category: $('#f-cat').value.trim(), sku: $('#f-sku').value.trim(), price: num($('#f-price').value), qty: Math.max(0, Math.round(num($('#f-qty').value))), alertAt: Math.max(0, Math.round(num($('#f-al').value))) });
        await setDoc(doc(db, 'costs', pid), { cost: num($('#f-cost').value) });
        toast(t('partSaved')); s.close();
      } catch (e) { toast(t('errNet')); }
    };
    if (id) $('#f-del').onclick = (e) => armed(e.target, async () => { try { await deleteDoc(doc(db, 'products', id)); await deleteDoc(doc(db, 'costs', id)); s.close(); } catch (er) { toast(t('errNet')); } });
  }

  function settingsSheet() {
    const s = sheet('<h2>' + t('settings') + '</h2><label class="f"><span>' + t('shopName') + '</span><input id="s-name" value="' + esc(S.shop.name || '') + '"></label>' +
      '<label class="f"><span>' + t('shopPhone') + '</span><input id="s-phone" type="tel" value="' + esc(S.shop.phone || '') + '"></label>' +
      '<button class="btn full" id="s-save">' + t('save') + '</button><div class="sep"></div><div class="mute">' + t('language') + '</div>' +
      '<div class="row" style="margin:8px 0">' + ['ar', 'fr', 'en'].map((l) => '<button class="btn sm grow ' + (l === getLang() ? '' : 'alt') + '" data-pick="' + l + '">' + { ar: 'العربية', fr: 'Français', en: 'English' }[l] + '</button>').join('') + '</div>' +
      '<button class="btn alt full" id="s-out">' + t('signout') + '</button>');
    $('#s-save').onclick = async () => { try { await setDoc(doc(db, 'settings', 'shop'), { name: $('#s-name').value.trim(), phone: $('#s-phone').value.trim() }); toast(t('saved')); s.close(); } catch (e) { toast(t('errNet')); } };
    $('#s-out').onclick = () => signout();
    s.el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pick]'); if (b) { setLang(b.dataset.pick); s.close(); shell(); } });
  }

  // ---------- events ----------
  root.onclick = async (e) => {
    const g = (a) => e.target.closest('[' + a + ']'); let el;
    if ((el = g('data-tab'))) { S.tab = el.dataset.tab; S.q = ''; draw(); }
    else if ((el = g('data-of'))) { S.ofilter = el.dataset.of; draw(); }
    else if ((el = g('data-range'))) { S.range = el.dataset.range; draw(); }
    else if ((el = g('data-ost'))) { setStatus(el.dataset.id, el.dataset.ost); }
    else if ((el = g('data-pick'))) {
      const o = S.orders.find((x) => x.id === el.dataset.pick); if (!o) return; el.disabled = true;
      try { const r = await recordSale({ lines: o.lines, orderId: o.id, customer: o.name, note: o.note || '' }); toast(t('saleDone') + money(r.total)); } catch (er) { saleError(er); el.disabled = false; }
    }
    else if ((el = g('data-add'))) { const id = el.dataset.add; const p = S.prods[id]; const n = (S.cart[id] || 0) + 1; if (p && n <= p.qty) { S.cart[id] = n; draw(); } else if (p) toast(t('onlyN', p.qty)); }
    else if ((el = g('data-sdec'))) { const id = el.dataset.sdec; const n = (S.cart[id] || 0) - 1; if (n > 0) S.cart[id] = n; else delete S.cart[id]; draw(); }
    else if ((el = g('data-edit'))) { partSheet(el.dataset.edit); }
    else if ((el = g('data-u'))) {
      const id = el.dataset.id, a = el.dataset.u;
      try {
        if (a === 'approve') {
          const cur = S.users.find((u) => u.id === id);
          if (cur && cur.status !== 'approved' && S.users.filter((u) => u.status === 'approved').length >= MAX_CUSTOMERS) { toast(t('limitReached')); return; }
          await updateDoc(doc(db, 'users', id), { status: 'approved', approvedAt: Date.now() });
        } else if (a === 'block') await updateDoc(doc(db, 'users', id), { status: 'blocked' });
        else if (a === 'remove') armed(el, () => deleteDoc(doc(db, 'users', id)));
      } catch (er) { toast(t('errNet')); }
    }
    else if ((el = g('data-a'))) {
      const a = el.dataset.a;
      if (a === 'settings') settingsSheet();
      else if (a === 'addpart') partSheet(null);
      else if (a === 'low') { S.low = !S.low; draw(); }
      else if (a === 'sell') {
        const lines = Object.entries(S.cart).filter(([id]) => S.prods[id]).map(([pid, qty]) => ({ pid, qty })); if (!lines.length) return; el.disabled = true;
        try { const r = await recordSale({ lines, discount: S.disc, note: S.snote || '' }); S.cart = {}; S.disc = ''; S.snote = ''; toast(t('saleDone') + money(r.total)); draw(); } catch (er) { saleError(er); el.disabled = false; }
      }
    }
  };
  root.oninput = (e) => {
    const id = e.target.id;
    if (id === 'q') { S.q = e.target.value; const l = $('#list'); if (l) l.innerHTML = S.tab === 'sell' ? sellList() : stockList(); }
    else if (id === 'disc') { S.disc = e.target.value; const sub = Object.entries(S.cart).reduce((a, [pid, q]) => a + (S.prods[pid] ? q * S.prods[pid].price : 0), 0); const st = $('#stot'); if (st) st.textContent = money(Math.max(0, sub - num(S.disc))); }
    else if (id === 'snote') S.snote = e.target.value;
  };

  // ---------- live data ----------
  import('./fb.js').then((m) => {
    db = m.db; shell(); askNotifyPermission();
    const watch = (name, fn) => unsubs.push(onSnapshot(collection(db, name), fn, () => toast(t('errNet'))));
    watch('products', (s) => { S.prods = {}; s.docs.forEach((d) => { S.prods[d.id] = { id: d.id, ...d.data() }; }); draw(); });
    watch('costs', (s) => { S.costs = {}; s.docs.forEach((d) => { S.costs[d.id] = Number(d.data().cost || 0); }); });
    watch('users', (s) => {
      const first = !S.loaded2; S.loaded2 = true;
      const prev = new Set(S.users.map((u) => u.id));
      S.users = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!first) S.users.filter((u) => u.status === 'pending' && !prev.has(u.id)).forEach((u) => { beep(); toast('👤 ' + u.name); notify(t('tabCustomers'), u.name); });
      draw();
    });
    watch('sales', (s) => { S.sales = s.docs.map((d) => d.data()); draw(); });
    watch('orders', (s) => {
      const first = !S.loaded; S.loaded = true;
      const prev = new Set(S.orders.map((o) => o.id));
      S.orders = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
      if (!first) S.orders.filter((o) => !prev.has(o.id) && o.status === 'new').forEach((o) => { const msg = t('newOrderFrom', o.name, money(o.total)); beep(); toast('🔔 ' + msg); notify(t('tabOrders'), msg); });
      draw();
    });
    unsubs.push(onSnapshot(doc(db, 'settings', 'shop'), (s) => { S.shop = s.exists() ? s.data() : {}; tabs(); }));
  });
  return () => unsubs.forEach((u) => u());
}
