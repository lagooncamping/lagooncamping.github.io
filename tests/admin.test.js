// =========================================================
// ชุดทดสอบหน้าหลังบ้าน (admin.html) — เปิดหน้าแอดมินในเบราว์เซอร์จำลองจอมือถือ แล้วลองเพิ่ม/แก้/ยกเลิกการจองจริงทีละขั้น
// วิธีรัน (ต้องมี Node.js + Playwright):  node tests/admin.test.js
// - ไม่แตะเว็บจริงและชีตจริง: รัน google-apps-script/Code.gs ในเครื่องนี้ กับ "ชีตจำลอง" ในหน่วยความจำ
//   (หน้าเว็บส่งคำสั่งมาที่ /api ของเซิร์ฟเวอร์ทดสอบ แทน script.google.com)
// - ล็อกเวลาเป็น 2 พ.ย. 2569 10:00 น. (เวลาไทย) ทุกครั้ง ผลจึงไม่เปลี่ยนตามวันที่รัน
// ผ่านทุกข้อ = จบด้วย "ผ่านทั้งหมด" · ไม่ผ่าน = บอกข้อที่พังและจบด้วย exit code 1
// =========================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

let chromium;
try { ({ chromium } = require('playwright')); } catch (err) {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const NOW = new Date('2026-11-02T10:00:00+07:00');
const PIN = '246810';
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

// ---------- Google Apps Script จำลอง (เท่าที่ Code.gs ใช้) ----------
function fakeSheet(headers) {
  const rows = [headers.slice()];
  let cols = headers.length;
  const cell = (r, c) => (rows[r - 1] && rows[r - 1][c - 1] !== undefined ? rows[r - 1][c - 1] : '');
  const put = (r, c, v) => { while (rows.length < r) rows.push([]); rows[r - 1][c - 1] = v; };
  const range = (r, c, nr = 1, nc = 1) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
    setValues: (v) => { v.forEach((row, i) => row.forEach((x, j) => put(r + i, c + j, x))); return range(r, c, nr, nc); },
    getValue: () => cell(r, c),
    setValue: (v) => { put(r, c, v); return range(r, c, nr, nc); },
    setNumberFormat() { return this; }, setFontWeight() { return this; }, setDataValidation() { return this; }, setBackground() { return this; },
  });
  return {
    rows,
    getLastRow: () => rows.length,
    getMaxRows: () => 1000,
    getMaxColumns: () => cols,
    insertColumnsAfter: (_, n) => { cols += n; },
    getRange: (a, c, nr, nc) => (typeof a === 'string' ? range(1, 1) : range(a, c, nr, nc)),
    deleteRow: (n) => { rows.splice(n - 1, 1); },
    setFrozenRows() {}, setConditionalFormatRules() {}, autoResizeColumns() {},
  };
}

function loadCodeGs() {
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); }
    static now() { return NOW.getTime(); }
  }
  const props = { ADMIN_PIN: PIN };
  const cache = {};
  const bkk = (d) => { const t = new RealDate(d.getTime() + 7 * 3600000); const p = (n) => String(n).padStart(2, '0'); return { y: t.getUTCFullYear(), M: p(t.getUTCMonth() + 1), d: p(t.getUTCDate()), H: p(t.getUTCHours()), m: p(t.getUTCMinutes()) }; };
  const ctx = {
    Date: FakeDate, console, Math, JSON,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, openById: () => ss, flush() {}, newDataValidation: () => ({ requireValueInList() { return this; }, build() {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, remove: (k) => { delete cache[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    Utilities: {
      formatDate(d, tz, fmt) {
        const t = bkk(d);
        return fmt.replace('yyyy', t.y).replace('yy', String(t.y).slice(2)).replace('MM', t.M).replace('dd', t.d).replace('HH', t.H).replace('mm', t.m).replace(/^H$/, String(Number(t.H)));
      },
      computeHmacSha256Signature: (v, k) => [...crypto.createHmac('sha256', k).update(v).digest()],
      base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'),
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType() { return s; } }) },
    MailApp: { sendEmail() {} },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '' }) },
  };
  vm.createContext(ctx);
  vm.runInContext(read('google-apps-script/Code.gs') + '\n;this.__HEADERS = HEADERS;', ctx);
  const sheet = fakeSheet(ctx.__HEADERS);
  const ss = { getSheetByName: () => sheet, getUrl: () => 'https://example.invalid/sheet' };
  return { gs: ctx, sheet };
}

let gs;
let sheet;
const call = (body) => JSON.parse(gs.doPost({ postData: { contents: JSON.stringify(body) } }));

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/api' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(gs.doPost({ postData: { contents: body } }));
      });
      return;
    }
    const file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    let out = fs.readFileSync(file);
    if (url === '/js/admin.js') out = out.toString().replace(/^const API_URL = '.*';$/m, "const API_URL = '/api';");
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(out);
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

// ---------- ตัวช่วยเล็กๆ ----------
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (got, want, msg) => expect(JSON.stringify(got) === JSON.stringify(want), `${msg}: ได้ ${JSON.stringify(got)} แต่ควรเป็น ${JSON.stringify(want)}`);
// แถวในชีตของรหัสนี้ (ไม่รวมหัวตาราง) เป็น { บ้าน, เช็กอิน, ... }
const rowsOf = (id) => sheet.rows.slice(1).filter((r) => r[1] === id).map((r) => ({
  house: r[2], checkin: r[4], checkout: r[5], nights: r[6], guests: r[7], name: r[8], phone: r[9], note: r[10],
  total: r[11], status: r[12], due: r[13], deadline: r[14], payType: r[15], balance: r[16], tent: r[18], rent: r[19], line: r[20],
}));

let base;
let browser;
let page;
async function openAdmin() {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, locale: 'th-TH', timezoneId: 'Asia/Bangkok' });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.clock.install({ time: NOW });
  await p.goto(`${base}/admin.html`);
  await p.fill('#pin', PIN);
  await p.click('#login-form [type=submit]');
  await p.waitForSelector('#app:not([hidden])');
  await p.waitForFunction(() => /อัปเดตล่าสุด/.test(document.getElementById('updated').textContent));
  return p;
}
const reload = async () => {
  await page.click('#refresh');
  await page.waitForFunction(() => !document.getElementById('refresh').disabled);
};
const card = (id) => page.locator(`#v-all #b-${id}`);
async function search(text) {
  await page.click('[data-tab=all]');
  await page.fill('#search', text);
}
const pick = (h) => page.click(`#add-houses [data-house=${h}]`);
async function save() {
  await page.click('#add-form [type=submit]');
  await page.waitForFunction(() => !document.querySelector('#add-form [type=submit]').disabled);
}

// การจองจากหน้าเว็บ (รอชำระ มัดจำ 50%) ใส่ตรงเข้าระบบ เหมือนลูกค้ากดจอง
function webBooking(houses, checkin, checkout, extra = {}) {
  const out = call({ houses, checkin, checkout, guests: 2, name: 'ลูกค้า เว็บ', phone: '0812345678', payType: 'deposit', ...extra });
  expect(out.ok, 'จองจากหน้าเว็บไม่สำเร็จ: ' + out.error);
  return out.id;
}

// =========================================================
test('เข้าหลังบ้านด้วย PIN ได้ · PIN ผิดเข้าไม่ได้', async () => {
  eq(call({ admin: 'login', pin: '000000' }).error, 'bad_pin', 'PIN ผิด');
  page = await openAdmin();
  expect(await page.locator('#v-today').isVisible(), 'ต้องเห็นแท็บวันนี้');
});

test('เพิ่มการจองจากหลังบ้าน → ยืนยันแล้ว + ยอดตามราคาระบบ', async () => {
  await page.click('[data-tab=add]');
  await page.fill('#add-form [name=checkin]', '2026-11-10');
  await page.fill('#add-form [name=checkout]', '2026-11-12');
  await page.dispatchEvent('#add-form [name=checkout]', 'change');
  await pick('lagoon-1');
  await page.fill('#add-form [name=name]', 'สมชาย โทรจอง');
  await page.fill('#add-form [name=phone]', '089-111-2222');
  await page.check('#add-form [name=paid][value=deposit]', { force: true });
  await save();
  const id = sheet.rows[sheet.rows.length - 1][1];
  const r = rowsOf(id);
  eq(r.length, 1, 'จำนวนแถว');
  eq([r[0].house, r[0].status, r[0].total, r[0].due], ['lagoon-1', 'ยืนยันแล้ว', 2600, 1300], 'บ้าน/สถานะ/ยอด/มัดจำ');
  test.addId = id;
});

test('แก้ไขการจอง: ย้ายวัน + เพิ่มบ้านเป็น 2 หลัง → ชีตมี 2 แถว รหัสเดิม', async () => {
  const id = test.addId;
  await search('สมชาย');
  await card(id).locator('[data-edit]').click();
  eq(await page.locator('#h-add').innerText(), 'แก้ไขการจอง', 'หัวฟอร์ม');
  eq(await page.inputValue('#add-form [name=name]'), 'สมชาย โทรจอง', 'ชื่อเดิมต้องอยู่ในฟอร์ม');
  expect(!(await page.locator('#add-form [name=paid]').first().isVisible()), 'โหมดแก้ไขไม่ต้องเห็นช่องจ่ายเงิน');
  await page.fill('#add-form [name=checkin]', '2026-11-11');
  await page.dispatchEvent('#add-form [name=checkin]', 'change');
  await page.fill('#add-form [name=checkout]', '2026-11-13');
  await page.dispatchEvent('#add-form [name=checkout]', 'change');
  await pick('lagoon-2');
  await page.click('#use-system-price');
  eq(await page.inputValue('#add-form [name=total]'), '5200', 'ราคาตามระบบ 2 หลัง 2 คืน');
  await page.fill('#add-form [name=guests]', '4');
  await page.fill('#add-form [name=phone]', '089-999-0000');
  await save();
  const r = rowsOf(id);
  eq(r.map((x) => x.house), ['lagoon-1', 'lagoon-2'], 'บ้าน');
  eq([r[1].checkin, r[1].checkout, r[1].nights, r[1].guests, r[1].phone, r[1].total], ['2026-11-11', '2026-11-13', 2, 4, '089-999-0000', 5200], 'ข้อมูลใหม่ในแถวที่เพิ่ม');
  eq([r[1].status, r[1].due, r[1].payType], ['ยืนยันแล้ว', 1300, 'มัดจำ 50%'], 'สถานะและเงินที่จ่ายแล้วต้องเท่าเดิม');
  await page.waitForSelector(`#b-${id}.flash, #b-${id}`);
  expect((await page.locator(`#b-${id}`).first().innerText()).includes('Lagoon 1, Lagoon 2'), 'การ์ดต้องโชว์ 2 หลัง');
});

test('แก้ไขการจอง: ลดเหลือบ้านเดียว → แถวที่เกินถูกลบ แถวอื่นไม่โดน', async () => {
  const id = test.addId;
  const other = webBooking(['family-1'], '2026-11-20', '2026-11-21');
  await reload();
  const before = sheet.rows.length;
  await search('สมชาย');
  await card(id).locator('[data-edit]').click();
  await pick('lagoon-1'); // เอา Lagoon 1 ออก เหลือ Lagoon 2
  await save();
  eq(rowsOf(id).map((x) => x.house), ['lagoon-2'], 'เหลือบ้านเดียว');
  eq(sheet.rows.length, before - 1, 'จำนวนแถวในชีต');
  eq(rowsOf(other).length, 1, 'การจองอื่นต้องอยู่ครบ');
});

test('แก้ไขไปทับบ้านที่มีคนจองแล้ว → ไม่ยอม และไม่แก้ชีต', async () => {
  const id = test.addId;
  webBooking(['lagoon-3'], '2026-11-11', '2026-11-12');
  const snap = JSON.stringify(rowsOf(id));
  // หน้าเว็บยังไม่รู้ (ยังไม่โหลดใหม่) → Google ต้องเช็กเองแล้วตอบว่าไม่ว่าง
  await search('สมชาย');
  await card(id).locator('[data-edit]').click();
  await pick('lagoon-3');
  await save();
  expect((await page.locator('#add-error').innerText()).includes('Lagoon 3'), 'ต้องบอกว่า Lagoon 3 ไม่ว่าง');
  eq(JSON.stringify(rowsOf(id)), snap, 'ชีตต้องไม่เปลี่ยน');
  // โหลดใหม่แล้ว ปุ่ม Lagoon 3 ต้องกดไม่ได้
  expect(await page.locator('#add-houses [data-house=lagoon-3]').isDisabled(), 'Lagoon 3 ต้องขึ้นว่าไม่ว่าง');
  await page.click('#edit-cancel');
});

test('แก้การจองจากเว็บที่ยังรอชำระ → ยอดที่ต้องโอนคิดใหม่ (มัดจำ 50%) เวลาชำระเท่าเดิม', async () => {
  const id = webBooking(['studio'], '2026-11-15', '2026-11-16', { name: 'มานี เว็บ' });
  const deadline = rowsOf(id)[0].deadline;
  await reload();
  await page.click('[data-tab=pending]');
  await page.locator(`#v-pending #b-${id} [data-edit]`).click();
  await page.fill('#add-form [name=checkout]', '2026-11-17');
  await page.dispatchEvent('#add-form [name=checkout]', 'change');
  await page.click('#use-system-price');
  expect((await page.locator('#add-estimate').innerText()).includes('ลูกค้าต้องโอน 1,500'), 'ต้องบอกยอดโอนใหม่');
  await save();
  const r = rowsOf(id)[0];
  eq([r.nights, r.total, r.due, r.status, r.deadline], [2, 3000, 1500, 'รอชำระเงิน', deadline], 'ยอด/สถานะ/เวลาชำระ');
});

test('แก้ช่วงปิดบ้าน: เปลี่ยนวันและเหตุผลได้', async () => {
  const out = call({ admin: 'login', pin: PIN });
  const blk = call({ admin: 'block', token: out.token, houses: ['family-2'], from: '2026-11-05', to: '2026-11-07', reason: 'ซ่อมแอร์' });
  expect(blk.ok, 'ปิดบ้านไม่สำเร็จ');
  await reload();
  await page.click('[data-tab=calendar]');
  await page.locator(`#blocks-body #b-${blk.id} [data-edit]`).click();
  eq(await page.locator('#h-add').innerText(), 'แก้ช่วงปิดบ้าน', 'หัวฟอร์ม');
  expect(!(await page.locator('#add-form [name=name]').isVisible()), 'ปิดบ้านไม่ต้องมีช่องชื่อลูกค้า');
  await page.fill('#add-form [name=checkout]', '2026-11-09');
  await page.dispatchEvent('#add-form [name=checkout]', 'change');
  await page.fill('#add-form [name=note]', 'ซ่อมแอร์ + ทาสี');
  await save();
  const r = rowsOf(blk.id)[0];
  eq([r.house, r.checkin, r.checkout, r.note, r.status], ['family-2', '2026-11-05', '2026-11-09', 'ซ่อมแอร์ + ทาสี', 'ยืนยันแล้ว'], 'ปิดบ้านหลังแก้');
});

test('แก้ชื่อ/เบอร์ของการจองที่ผ่านไปแล้วได้ (วันไม่เปลี่ยน)', async () => {
  const token = call({ admin: 'login', pin: PIN }).token;
  const add = call({ admin: 'addBooking', token, houses: ['lagoon-1'], checkin: '2026-11-01', checkout: '2026-11-03', guests: 2, name: 'แขกเก่า', paid: 'full' });
  expect(add.ok, 'เพิ่มการจองไม่สำเร็จ');
  sheet.rows.forEach((r) => { if (r[1] === add.id) { r[4] = '2026-10-20'; r[5] = '2026-10-22'; } }); // ทำให้เป็นการจองที่ผ่านไปแล้ว
  const edit = call({ admin: 'editBooking', token, id: add.id, houses: ['lagoon-1'], checkin: '2026-10-20', checkout: '2026-10-22', guests: 2, name: 'แขกเก่า (แก้ชื่อ)', phone: '0800000000', total: 2600 });
  expect(edit.ok, 'แก้ไม่ได้: ' + edit.error);
  eq(rowsOf(add.id)[0].name, 'แขกเก่า (แก้ชื่อ)', 'ชื่อ');
  const moved = call({ admin: 'editBooking', token, id: add.id, houses: ['lagoon-1'], checkin: '2026-10-25', checkout: '2026-10-26', guests: 2, name: 'x', total: 1 });
  eq(moved.error, 'bad_dates', 'ย้ายไปวันที่ผ่านไปแล้วต้องไม่ได้');
});

test('แก้ไขต้องเข้าสู่ระบบก่อน · แก้รหัสที่ไม่มีอยู่ = ไม่พบ', async () => {
  eq(call({ admin: 'editBooking', token: 'x', id: test.addId }).error, 'auth', 'ไม่มี token');
  const token = call({ admin: 'login', pin: PIN }).token;
  eq(call({ admin: 'editBooking', token, id: 'LG000000-0000', houses: [], checkin: '2026-11-10', checkout: '2026-11-11' }).error, 'not_found', 'รหัสไม่มี');
});

test('หน้าแอดมินไม่มี error ใน console', async () => {
  eq(page.errors, [], 'error');
});

// =========================================================
(async () => {
  ({ gs, sheet } = loadCodeGs());
  const server = await serve();
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ ${t.name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${t.name}\n    ${err.message.split('\n')[0]}`);
    }
  }
  await browser.close();
  server.close();
  console.log(failed ? `\nไม่ผ่าน ${failed} จาก ${tests.length} ข้อ` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
  process.exit(failed ? 1 : 0);
})();
