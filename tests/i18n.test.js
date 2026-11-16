// =========================================================
// ชุดทดสอบปุ่มภาษา (ไทย / English) และปุ่มโหมดมืด/สว่าง
// วิธีรัน (ต้องมี Node.js + Playwright):  node tests/i18n.test.js
// - เปิดเว็บจากโฟลเดอร์นี้เอง (ไม่แตะเว็บจริง) · หน้าจองใช้โหมดทดลอง ไม่มีการจองจริงเข้าชีต
// - เช็กว่า: ทุกหน้าเป็นภาษาอังกฤษครบ ไม่เหลือภาษาไทย · ราคา/เวลา/เบอร์ในคำแปลตรงกับภาษาไทย
//   · จองในโหมดอังกฤษได้จนถึงหน้าชำระเงิน · กดกลับเป็นไทยได้ · โหมดมืดจำค่าได้ · จอ 360px ไม่ล้น
// =========================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let chromium;
try { ({ chromium } = require('playwright')); } catch (err) {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const NOW = new Date('2026-10-10T10:00:00+07:00');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/json' };
const PAGES = ['index.html', 'gallery.html', 'prices.html', 'stay.html', 'contact.html', 'nearby.html', 'booking.html', 'my-booking.html', '404.html'];
const TH = /[฀-๿]/;

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    let body = fs.readFileSync(file);
    if (url === '/booking.html') body = body.toString().replace('class="book booking-closed"', 'class="book"');
    if (url === '/js/booking.js') body = body.toString().replace(/^const API_URL = '.*';$/m, "const API_URL = '';");
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (got, want, msg) => expect(got === want, `${msg}: ได้ ${JSON.stringify(got)} แต่ควรเป็น ${JSON.stringify(want)}`);

let base;
let browser;
async function open(file, { lang = 'en', theme, scheme = 'light', width = 360, clock } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 780 }, locale: 'th-TH', timezoneId: 'Asia/Bangkok', colorScheme: scheme });
  await ctx.addInitScript(([l, t]) => {
    try {
      if (sessionStorage.getItem('seeded')) return; // ตั้งค่าครั้งแรกครั้งเดียว (รีโหลดแล้วต้องจำค่าที่กดไว้เอง)
      sessionStorage.setItem('seeded', '1');
      if (l === 'en') localStorage.setItem('lagoon-lang', 'en'); else localStorage.removeItem('lagoon-lang');
      if (t) localStorage.setItem('lagoon-theme', t); else localStorage.removeItem('lagoon-theme');
    } catch (e) { /* ข้าม */ }
  }, [lang, theme]);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  if (clock) await page.clock.install({ time: clock });
  await page.route(/fonts\.(googleapis|gstatic)|script\.google\.com/, (r) => r.abort());
  await page.goto(`${base}/${file}`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-wait'));
  await page.waitForTimeout(300);
  return page;
}
// ข้อความภาษาไทยที่ยังเหลือบนหน้า (ไม่นับปุ่ม "ไทย" ที่ตั้งใจเป็นภาษาไทย)
const thaiLeft = (page) => page.evaluate(() => {
  const TH = /[฀-๿]/;
  const out = [];
  const w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const pa = n.parentElement;
    if (!pa || pa.closest('script,style,textarea,[data-i18n-skip]')) continue;
    if (TH.test(n.nodeValue)) out.push(n.nodeValue.trim().slice(0, 80));
  }
  document.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach((e) => {
    if (e.closest('[data-i18n-skip]')) return;
    for (const a of ['alt', 'title', 'aria-label', 'placeholder']) { const v = e.getAttribute(a); if (v && TH.test(v)) out.push(`${a}="${v.slice(0, 80)}"`); }
  });
  return out;
});

// =========================================================
// คำแปล: ตัวเลขต้องตรงกับภาษาไทย
// =========================================================
test('ราคา/เวลา/เบอร์ ในคำแปลตรงกับภาษาไทยทุกข้อ', async () => {
  const sandbox = { window: {}, document: {}, HTMLInputElement: function () {}, HTMLTextAreaElement: function () {}, HTMLSelectElement: function () {} };
  ['HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement'].forEach((k) => { sandbox[k].prototype = {}; });
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/i18n-en.js'), 'utf8'), sandbox);
  const { dict } = sandbox.window.LagoonI18n;
  const nums = (s) => (s.replace(/<[^>]+>/g, '').replace(/(\d),(\d)/g, '$1$2').match(/\d+/g) || []).sort().join(' ');
  const bad = Object.entries(dict).filter(([th, en]) => nums(th) !== nums(en));
  expect(!bad.length, `ตัวเลขไม่ตรง:\n${bad.map(([th, en]) => `   ${th}\n → ${en}`).join('\n')}`);
  expect(Object.keys(dict).length > 400, 'คำแปลน้อยผิดปกติ');
});

// =========================================================
// ทุกหน้าเป็นภาษาอังกฤษครบ
// =========================================================
for (const file of PAGES) {
  test(`${file}: โหมด English ไม่เหลือภาษาไทย · จอ 360px ไม่ล้น`, async () => {
    const page = await open(file, file === 'booking.html' ? { clock: NOW } : {});
    eq(await page.evaluate(() => document.documentElement.lang), 'en', 'lang ของหน้า');
    const left = await thaiLeft(page);
    expect(!left.length, `ยังเป็นภาษาไทย ${left.length} จุด:\n   ${left.join('\n   ')}`);
    expect(!TH.test(await page.title()), `ชื่อแท็บยังเป็นภาษาไทย: ${await page.title()}`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw <= 360, `หน้ากว้างเกินจอ (${sw}px)`);
    expect(!page.errors.length, `มี error: ${page.errors.join(' | ')}`);
    await page.context().close();
  });
}

test('ภาษาไทยเป็นค่าเริ่มต้น และไม่โหลดไฟล์คำแปล', async () => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  const loaded = [];
  page.on('request', (r) => loaded.push(r.url()));
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.goto(`${base}/index.html`);
  await page.waitForTimeout(300);
  eq(await page.evaluate(() => document.documentElement.lang), 'th', 'lang ของหน้า');
  expect(!loaded.some((u) => /i18n-en\.js/.test(u)), 'ไม่ควรโหลด i18n-en.js ถ้ายังไม่กด EN');
  eq(await page.locator('.pref-lang').innerText(), 'EN', 'ปุ่มภาษา');
  await ctx.close();
});

test('กด EN แล้วเป็นอังกฤษ · กด "ไทย" กลับเป็นไทยเหมือนเดิม · เปิดหน้าอื่นยังจำภาษา', async () => {
  const page = await open('index.html', { lang: 'th' });
  const thH1 = await page.locator('h1').innerText();
  await page.click('.pref-lang');
  await page.waitForFunction(() => /Wake up/.test(document.querySelector('h1').textContent));
  eq(await page.locator('.pref-lang').innerText(), 'ไทย', 'ปุ่มภาษาหลังกด EN');
  await page.goto(`${base}/prices.html`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-wait'));
  eq(await page.locator('h1').innerText(), 'Choose camping or a cabin', 'หน้าราคายังเป็นภาษาอังกฤษ');
  await page.goto(`${base}/index.html`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-wait'));
  await page.click('.pref-lang');
  eq(await page.locator('h1').innerText(), thH1, 'หัวข้อกลับเป็นภาษาไทย');
  const left = await page.evaluate(() => document.body.innerText);
  expect(!/Wake up|See prices/.test(left), 'ยังเหลือภาษาอังกฤษหลังกดกลับเป็นไทย');
  await page.context().close();
});

test('ลิงก์ ?lang=en เปิดเป็นภาษาอังกฤษเลย', async () => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.goto(`${base}/stay.html?lang=en`);
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-wait'));
  expect(/Check-in/.test(await page.locator('body').innerText()), 'ต้องเป็นภาษาอังกฤษ');
  await ctx.close();
});

// =========================================================
// จองในโหมดอังกฤษ
// =========================================================
test('หน้าจอง (English): เลือกวัน → บ้าน + เต็นท์ → กรอกข้อมูล → หน้าชำระเงิน ไม่มีภาษาไทยโผล่', async () => {
  const page = await open('booking.html', { clock: NOW });
  await page.waitForSelector('.m');
  await page.click('.cal-day[data-date="2026-10-20"]');
  await page.click('.cal-day[data-date="2026-10-22"]');
  await page.evaluate(() => { const d = document.getElementById('house-list'); if (d) d.open = true; }); // กล่องรายละเอียดบ้านย่ออยู่ (ปรับ 1 พ.ย.)
  await page.click('[data-pick="lagoon-1"]');
  await page.click('[data-qty="#tent-rent"][data-d="1"]');
  const bar = await page.locator('#bar-text').innerText();
  expect(bar.includes('2 nights · total 5,200 THB'), `แถบสรุป: ${bar}`);
  eq(await page.locator('.m[data-house="lagoon-1"] .st').innerText(), 'Selected', 'ป้ายบนแผนผัง');
  let left = await thaiLeft(page);
  expect(!left.length, `ขั้นเลือกบ้าน ยังเป็นภาษาไทย:\n   ${left.join('\n   ')}`);

  await page.click('#to-details');
  await page.fill('[name=name]', 'Test Guest');
  await page.fill('[name=phone]', '12345');
  await page.fill('[name=guests]', '2');
  await page.check('[name=payType][value=deposit]');
  await page.check('[name=agree]');
  await page.click('#details-form [type=submit]');
  let err = await page.locator('#form-error').innerText();
  expect(/too short/.test(err), `ข้อความเตือนเบอร์สั้น: ${err}`);
  await page.fill('[name=phone]', '081-234-5678');
  await page.fill('[name=guests]', '5');
  await page.click('#details-form [type=submit]');
  err = await page.locator('#form-error').innerText();
  expect(/sleep up to 2/.test(err) && !TH.test(err), `ข้อความเตือนคนเกินบ้าน: ${err}`);
  await page.fill('[name=guests]', '2');
  left = await thaiLeft(page);
  expect(!left.length, `ขั้นกรอกข้อมูล ยังเป็นภาษาไทย:\n   ${left.join('\n   ')}`);
  await page.click('#details-form [type=submit]');
  await page.waitForFunction(() => !document.getElementById('step-done').hidden);
  eq(await page.locator('#pay-due').innerText(), '2,600 THB', 'ยอดมัดจำ');
  await page.click('#step-done details summary').catch(() => {});
  left = await thaiLeft(page);
  expect(!left.length, `หน้าชำระเงิน ยังเป็นภาษาไทย:\n   ${left.join('\n   ')}`);
  expect(!page.errors.length, `มี error: ${page.errors.join(' | ')}`);
  await page.context().close();
});

// =========================================================
// โหมดมืด / สว่าง
// =========================================================
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const LIGHT_BG = 'rgb(245, 241, 232)';
const DARK_BG = 'rgb(20, 22, 19)';

test('โหมดมืด: เครื่องตั้งสว่าง → กดปุ่มเป็นมืด → รีโหลดยังมืด → กดกลับเป็นสว่าง', async () => {
  const page = await open('index.html', { lang: 'th', scheme: 'light' });
  eq(await bg(page), LIGHT_BG, 'เริ่มต้นตามเครื่อง (สว่าง)');
  await page.click('.menu-btn');
  await page.click('.pref-theme');
  eq(await bg(page), DARK_BG, 'หลังกดปุ่มโหมดมืด');
  eq(await page.locator('.pref-theme').innerText(), 'โหมดสว่าง', 'ปุ่มเปลี่ยนเป็น "โหมดสว่าง"');
  await page.reload();
  eq(await bg(page), DARK_BG, 'รีโหลดแล้วยังจำโหมดมืด');
  await page.goto(`${base}/booking.html`);
  eq(await bg(page), DARK_BG, 'หน้าอื่นก็มืดด้วย');
  await page.click('.menu-btn');
  await page.click('.pref-theme');
  eq(await bg(page), LIGHT_BG, 'กดกลับเป็นสว่าง');
  eq(await page.evaluate(() => localStorage.getItem('lagoon-theme')), null, 'ตรงกับเครื่องแล้ว ไม่ต้องจำค่า');
  await page.context().close();
});

test('โหมดมืด: เครื่องตั้งมืด → เว็บมืดเอง · กดเป็นสว่างได้และจำไว้', async () => {
  const page = await open('prices.html', { lang: 'th', scheme: 'dark' });
  eq(await bg(page), DARK_BG, 'เริ่มต้นตามเครื่อง (มืด)');
  await page.click('.menu-btn');
  await page.click('.pref-theme');
  eq(await bg(page), LIGHT_BG, 'หลังกดโหมดสว่าง');
  await page.reload();
  eq(await bg(page), LIGHT_BG, 'รีโหลดแล้วยังสว่าง');
  await page.context().close();
});

test('จอใหญ่: ปุ่มภาษาและโหมดมืดอยู่บนแถบเมนู ไม่ดันเมนูตกบรรทัด', async () => {
  for (const width of [1021, 1100, 1280]) {
    const page = await open('index.html', { lang: 'en', width });
    const nav = await page.locator('.nav .wrap').boundingBox();
    expect(nav.height < 90, `แถบเมนูสูงเกิน (${Math.round(nav.height)}px) ที่จอ ${width}px`);
    expect(await page.locator('.pref-theme').isVisible(), 'ต้องเห็นปุ่มโหมดมืด');
    expect(await page.locator('.pref-lang').isVisible(), 'ต้องเห็นปุ่มภาษา');
    await page.context().close();
  }
});

// =========================================================
(async () => {
  const server = await serve();
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch();
  let fail = 0;
  for (const t of tests) {
    try { await t.fn(); console.log(`✓ ${t.name}`); } catch (err) { fail++; console.log(`✗ ${t.name}\n  ${err.message}`); }
  }
  await browser.close();
  server.close();
  console.log(fail ? `\nไม่ผ่าน ${fail} จาก ${tests.length} ข้อ` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
