import { createRequire } from 'module'; const require = createRequire(import.meta.url); const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
import http from 'http'; import fs from 'fs'; import path from 'path';
const WWW = path.resolve('../www'); const FAKE = fs.readFileSync('./fake-firebase.js', 'utf8');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  let u = q.url.split('?')[0]; if (u === '/fake.js') { r.setHeader('content-type', 'text/javascript'); return r.end(FAKE); }
  if (u === '/stub.js') { r.setHeader('content-type', 'text/javascript'); return r.end('export const Capacitor={isNativePlatform:()=>false};export const LocalNotifications={};'); }
  if (u === '/') u = '/index.html'; const f = path.join(WWW, u);
  if (!fs.existsSync(f)) { r.statusCode = 404; return r.end(); }
  let b = fs.readFileSync(f); r.setHeader('content-type', types[path.extname(f)] || 'text/plain');
  if (u === '/js/config.js') b = Buffer.from(b.toString().replace(/PASTE_API_KEY/, 'k'));
  if (u === '/index.html') b = Buffer.from(b.toString().replace('<script type="module"', '<script type="importmap">{"imports":{"firebase/app":"/fake.js","firebase/auth":"/fake.js","firebase/firestore":"/fake.js","@capacitor/core":"/stub.js","@capacitor/local-notifications":"/stub.js"}}</script><script type="module"'));
  r.end(b);
}).listen(0);
const base = 'http://localhost:' + srv.address().port;
const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 800 } });
const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
const mk = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => { fails.push('pageerror ' + e.message); console.log('PAGEERROR', e.message); }); await p.goto(base); await p.evaluate(() => localStorage.setItem('lang', 'en')); await p.reload(); return p; };
const owner = await mk();
// owner registers, then becomes admin through the (simulated) console step
await owner.click('#a-sw'); await owner.fill('#a-name', 'Owner'); await owner.fill('#a-phone', '0661000000'); await owner.fill('#a-pass', 'secret1'); await owner.click('#a-go');
await owner.waitForSelector('#w-uid'); const ouid = await owner.inputValue('#w-uid'); ok(ouid === 'u_213661000000', 'owner sees pending screen with uid');
await owner.evaluate((u) => { const s = JSON.parse(localStorage.getItem('__fake_db')); s.docs['admins/' + u] = {}; delete s.docs['users/' + u]; localStorage.setItem('__fake_db', JSON.stringify(s)); }, ouid);
await owner.click('#w-chk'); await owner.waitForSelector('nav.tabs');
ok(await owner.locator('nav.tabs button').count() === 5, 'owner app has 5 tabs');
// add a part
await owner.click('[data-tab=stock]'); await owner.click('[data-a=addpart]');
await owner.fill('#f-name', 'iPhone 11 Screen'); await owner.fill('#f-compat', 'iPhone 11'); await owner.fill('#f-cost', '3000'); await owner.fill('#f-price', '4500'); await owner.fill('#f-qty', '5'); await owner.click('#f-save');
await owner.waitForSelector('[data-edit]'); ok((await owner.textContent('#list')).includes('iPhone 11 Screen'), 'part saved and listed');
// customer
const cust = await mk();
await cust.click('#a-sw'); await cust.fill('#a-name', 'Ali'); await cust.fill('#a-phone', '0555123456'); await cust.fill('#a-pass', 'abcdef'); await cust.click('#a-go');
await cust.waitForSelector('text=Request under review'); ok(true, 'customer waits for approval');
await owner.click('[data-tab=customers]'); await owner.waitForSelector('[data-u=approve]'); await owner.click('[data-u=approve]');
await cust.waitForSelector('nav.tabs'); ok(true, 'customer enters shop right after approval (live)');
await cust.waitForSelector('text=iPhone 11 Screen'); await cust.click('[data-inc]'); await cust.click('[data-inc]');
await cust.click('[data-tab=cart]'); await cust.fill('#note', 'black'); await cust.click('[data-a=order]');
await cust.waitForSelector('text=Sent'); ok(true, 'order placed, shown in My orders as Sent');
await owner.click('[data-tab=orders]'); await owner.waitForSelector('[data-ost=confirmed]'); ok((await owner.textContent('#main')).includes('Ali'), 'owner sees order from Ali in the app');
await owner.click('[data-ost=confirmed]'); await cust.waitForSelector('text=Confirmed'); ok(true, 'customer sees Confirmed live');
await owner.click('[data-ost=ready]'); await owner.click('[data-pick]'); await owner.waitForSelector('text=Sale recorded');
await owner.click('[data-tab=stock]'); ok((await owner.textContent('#list')).match(/\b3\b/) !== null, 'stock decreased 5 -> 3');
await owner.click('[data-tab=sales]'); const st = (await owner.textContent('#main')).replace(/[\u00a0\u202f]/g, ' '); console.log(JSON.stringify(st.slice(0,300)), await owner.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('__fake_db')).docs).filter(k=>k.startsWith('sales')))); ok(st.includes('9 000') && st.includes('3 000'), 'sale recorded: revenue 9 000, profit 3 000');
// block
await owner.click('[data-tab=customers]'); await owner.click('[data-u=block]'); await cust.waitForSelector('text=Account not active'); ok(true, 'blocked customer is locked out live');
// 51st customer cap
await owner.evaluate(() => { const s = JSON.parse(localStorage.getItem('__fake_db')); for (let i = 0; i < 50; i++) s.docs['users/x' + i] = { name: 'C' + i, phone: '2135' + i, status: 'approved', createdAt: Date.now() }; s.docs['users/zz'] = { name: 'Late', phone: '213999', status: 'pending', createdAt: Date.now() }; localStorage.setItem('__fake_db', JSON.stringify(s)); window.dispatchEvent(new StorageEvent('storage', { key: '__fake_db' })); });
await owner.click('[data-tab=customers]'); await owner.waitForSelector('.card:has-text("Late")'); await owner.locator('.card:has-text("Late") [data-u=approve]').click(); await owner.waitForSelector('text=limit of 50'); ok(true, 'cap of 50 enforced');
// arabic RTL + wrong login
await cust.click('#w-out'); await cust.waitForSelector('#a-go'); await cust.click('#a-sw'); await cust.fill('#a-phone', '0555123456'); await cust.fill('#a-pass', 'wrong11'); await cust.click('#a-go'); await cust.waitForSelector('#a-err:has-text("Wrong")'); ok(true, 'wrong password message');
await cust.click('[data-lang=ar]'); ok(await cust.evaluate(() => document.documentElement.dir) === 'rtl', 'Arabic switches to RTL');
await owner.screenshot({ path: 'owner.png' }); await cust.screenshot({ path: 'auth-ar.png' });
await br.close(); srv.close();
console.log(fails.length ? 'FAILED: ' + fails.join(' | ') : 'ALL PASSED'); process.exit(fails.length ? 1 : 0);
