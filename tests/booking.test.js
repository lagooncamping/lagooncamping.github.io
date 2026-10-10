// =========================================================
// ชุดทดสอบอัตโนมัติของเว็บ (หน้าจองเป็นหลัก) — เปิดเว็บในเบราว์เซอร์จำลองจอมือถือ แล้วลองกดจองจริงทีละขั้น
// วิธีรัน (ต้องมี Node.js + Playwright):  node tests/booking.test.js
// - เปิดเว็บจากโฟลเดอร์นี้เอง (ไม่แตะเว็บจริง) · บังคับเปิดหน้าจองชั่วคราว (เอา booking-closed ออก) เฉพาะตอนทดสอบ
// - ตัดการเชื่อม Google Sheets (API_URL ว่าง = โหมดทดลอง) จึงไม่มีการจองจริงเข้าชีต
// - ล็อกเวลาเป็น 10 ต.ค. 2569 10:00 น. (เวลาไทย) ทุกครั้ง ผลจึงไม่เปลี่ยนตามวันที่รัน
// ผ่านทุกข้อ = จบด้วย "ผ่านทั้งหมด" · ไม่ผ่าน = บอกข้อที่พังและจบด้วย exit code 1
// =========================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

let chromium;
try { ({ chromium } = require('playwright')); } catch (err) {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const NOW = new Date('2026-10-10T10:00:00+07:00');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'text/xml', '.txt': 'text/plain' };

// ---------- เว็บเซิร์ฟเวอร์เล็กๆ: ส่งไฟล์จากโฟลเดอร์เว็บ + ดัดแปลงหน้าจองสำหรับทดสอบ ----------
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

// ---------- ตัวช่วยเล็กๆ ----------
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (got, want, msg) => expect(got === want, `${msg}: ได้ ${JSON.stringify(got)} แต่ควรเป็น ${JSON.stringify(want)}`);
const baht = (n) => n.toLocaleString('en-US');

// อ่านรายการบ้านจากไฟล์โค้ด (ใช้เช็กว่า 3 ที่ตรงกัน)
function housesFromBookingJs() {
  return [...read('js/booking.js').matchAll(/id: '([\w-]+)', name: '([^']+)', type: '[^']*', guests: (\d+), price: (\d+)/g)]
    .map(([, id, name, guests, price]) => ({ id, name, guests: +guests, price: +price }));
}
function housesFromCodeGs() {
  return [...read('google-apps-script/Code.gs').matchAll(/'([\w-]+)': \{ name: '([^']+)', price: (\d+), guests: (\d+) \}/g)]
    .map(([, id, name, price, guests]) => ({ id, name, guests: +guests, price: +price }));
}
const HOUSES = housesFromBookingJs();

let base;
let browser;
async function openBooking(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, locale: 'th-TH', timezoneId: 'Asia/Bangkok', ...opts.ctx });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  await page.clock.install({ time: opts.time || NOW });
  await page.route(/script\.google\.com/, (r) => r.abort());
  if (opts.blockQr) await page.route(/qrcode/, (r) => r.abort());
  await page.goto(`${base}/booking.html${opts.hash || ''}`);
  await page.waitForSelector('.m');
  return page;
}
const step = (page) => page.evaluate(() => ['pick', 'details', 'done'].find((s) => !document.getElementById(`step-${s}`).hidden));
// ไปขั้นกรอกข้อมูล แล้วกรอกให้ครบ (ส่งค่าไหนมาก็ทับค่าเริ่มต้น)
async function fillDetails(page, f = {}) {
  await page.click('#to-details');
  eq(await step(page), 'details', 'กด "ถัดไป" แล้วต้องไปหน้ากรอกข้อมูล');
  await page.fill('[name=name]', f.name ?? 'ทดสอบ ระบบ');
  await page.fill('[name=phone]', f.phone ?? '081-234-5678');
  if (await page.locator('[name=guests]').isEnabled()) await page.fill('[name=guests]', String(f.guests ?? 2));
  await page.check(`[name=payType][value=${f.payType || 'deposit'}]`);
  await page.check('[name=agree]');
  await page.click('#details-form [type=submit]');
}

// =========================================================
// ข้อมูลตรงกันทุกที่
// =========================================================
test('มีบ้าน 6 หลังในหน้าจอง', async () => {
  eq(HOUSES.length, 6, 'จำนวนบ้านใน js/booking.js');
});
test('บ้าน ราคา จำนวนคน ใน js/booking.js ตรงกับระบบ Google (Code.gs)', async () => {
  const gs = housesFromCodeGs();
  for (const h of HOUSES) {
    const g = gs.find((x) => x.id === h.id);
    expect(g, `Code.gs ไม่มีบ้าน ${h.id} (ลูกค้าจะจองหลังนี้ไม่ได้)`);
    eq(g.price, h.price, `ราคา ${h.id}`);
    eq(g.guests, h.guests, `จำนวนคน ${h.id}`);
  }
  eq(gs.length, HOUSES.length, 'จำนวนบ้านใน Code.gs');
});
test('หน้าแอดมิน (js/admin.js) มีบ้านครบทุกหลัง', async () => {
  const order = read('js/admin.js').match(/HOUSE_ORDER = \[([^\]]*)\]/)[1];
  for (const h of HOUSES) expect(order.includes(`'${h.id}'`), `admin.js ไม่มี ${h.id}`);
});
test('ราคาเต็นท์ใน js/booking.js ตรงกับ Code.gs', async () => {
  for (const k of ['TENT_PRICE', 'TENT_RENT', 'TENT_RENT_SMALL', 'SAME_DAY_CUTOFF', 'HOLD_HOURS']) {
    const re = new RegExp(`const ${k} = (\\d+)`);
    eq(read('js/booking.js').match(re)?.[1], read('google-apps-script/Code.gs').match(re)?.[1], k);
  }
});
test('หน้าราคา (prices.html) มีราคาบ้านทุกแบบ', async () => {
  const html = read('prices.html');
  for (const p of new Set(HOUSES.map((h) => h.price))) expect(html.includes(baht(p)), `prices.html ไม่มีราคา ${baht(p)}`);
});

// =========================================================
// ทุกหน้า: ไม่พัง ไม่ล้นจอ รูปไม่เสีย
// =========================================================
test('ทุกหน้าเปิดได้ ไม่มี error ไม่ล้นจอมือถือ รูปไม่เสีย', async () => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.route(/script\.google\.com/, (r) => r.abort());
  for (const p of ['index.html', 'prices.html', 'gallery.html', 'stay.html', 'nearby.html', 'contact.html', 'booking.html', 'my-booking.html', '404.html']) {
    const errors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${base}/${p}`, { waitUntil: 'load' });
    const r = await page.evaluate(async () => {
      document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
      await Promise.all([...document.images].filter((i) => i.getAttribute('src')).map((i) => (i.complete ? null : new Promise((ok) => { i.onload = ok; i.onerror = ok; }))));
      return {
        over: document.documentElement.scrollWidth - innerWidth,
        broken: [...document.images].filter((i) => i.getAttribute('src') && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      };
    });
    expect(!errors.length, `${p}: ${errors[0]}`);
    expect(r.over <= 0, `${p} กว้างเกินจอ ${r.over}px`);
    expect(!r.broken.length, `${p} รูปเสีย: ${r.broken.join(', ')}`);
  }
  await ctx.close();
});

// =========================================================
// แผนผังบ้าน
// =========================================================
test('แผนผังมีป้ายครบทุกหลัง และพอดีจอ 360px ไม่ต้องปัดข้าง', async () => {
  const page = await openBooking();
  for (const h of HOUSES) eq(await page.locator(`.m[data-house="${h.id}"]`).count(), 1, `ป้าย ${h.id} บนแผนผัง`);
  const box = await page.locator('.plan').boundingBox();
  for (const h of HOUSES) {
    const b = await page.locator(`.m[data-house="${h.id}"]`).boundingBox();
    expect(b.x >= box.x && b.x + b.width <= box.x + box.width + 1, `ป้าย ${h.id} ล้นขอบแผนผัง`);
  }
  // ป้ายไม่ทับกันเอง
  const boxes = await Promise.all(HOUSES.map((h) => page.locator(`.m[data-house="${h.id}"]`).boundingBox()));
  boxes.sort((a, b) => a.y - b.y);
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].y >= boxes[i - 1].y + boxes[i - 1].height - 1, 'ป้ายบ้านทับกัน');
  const tent = await page.locator('.tent-spot').boundingBox();
  expect(tent.y >= boxes[boxes.length - 1].y + boxes[boxes.length - 1].height - 1, 'ป้ายลานเต็นท์ทับป้ายบ้าน');
  expect(!page.errors.length, page.errors[0]);
});
test('แตะบ้านบนแผนผัง = เลือก · แตะอีกครั้ง = ยกเลิก · แถบสรุปยอดถูก', async () => {
  const page = await openBooking();
  const h = HOUSES.find((x) => x.id === 'family-1');
  await page.click('.m[data-house="family-1"]');
  expect(await page.locator('#house-family-1').evaluate((e) => e.classList.contains('is-picked')), 'การ์ด Family 1 ต้องขึ้นว่าเลือกแล้ว');
  expect((await page.locator('#bar-text').innerText()).includes(`รวม ${baht(h.price)} บาท`), 'ยอดในแถบสรุป');
  eq(await page.locator('.m[data-house="family-1"] .st').innerText(), 'เลือกแล้ว', 'ป้ายบนแผนผัง');
  await page.click('.m[data-house="family-1"]');
  expect(await page.locator('#bar').isHidden(), 'ยกเลิกแล้วแถบสรุปต้องหาย');
});
test('บ้านที่ถูกจองแล้ว: ป้ายขึ้น "ถูกจองแล้ว" และแตะแล้วไม่ถูกเลือก', async () => {
  const page = await openBooking(); // โหมดทดลอง: Lagoon 2 ถูกจองคืนนี้
  eq(await page.locator('.m[data-house="lagoon-2"] .st').innerText(), 'ถูกจองแล้ว', 'ป้าย Lagoon 2');
  await page.click('.m[data-house="lagoon-2"]');
  expect(await page.locator('#bar').isHidden(), 'ต้องเลือกบ้านที่ถูกจองไม่ได้');
  expect(await page.locator('#more-lagoon-2').isVisible(), 'แตะบ้านที่ถูกจอง → เปิดรูป/รายละเอียดแทน');
  expect(await page.locator('[data-pick="lagoon-2"]').isDisabled(), 'ปุ่ม "เลือก" ของ Lagoon 2 ต้องกดไม่ได้');
});

// =========================================================
// จองบ้านทุกหลังจนถึงหน้าชำระเงิน
// =========================================================
for (const h of HOUSES) {
  test(`จอง ${h.name} 2 คืน มัดจำ 50% ได้ยอดถูก`, async () => {
    const page = await openBooking();
    await page.click('.cal-day[data-date="2026-10-20"]');
    await page.click('.cal-day[data-date="2026-10-22"]');
    await page.click(`[data-pick="${h.id}"]`);
    await fillDetails(page, { guests: h.guests });
    eq(await step(page), 'done', `${h.name}: ต้องไปถึงหน้าชำระเงิน (${await page.locator('#form-error').innerText()})`);
    eq(await page.locator('#pay-due').innerText(), `${baht(Math.ceil(h.price * 2 * 0.5))} บาท`, 'ยอดมัดจำ');
    expect(!page.errors.length, page.errors[0]);
  });
}
test('ชำระเต็มจำนวน: ยอด = ราคาเต็ม และไม่มีแถวยอดคงเหลือ', async () => {
  const page = await openBooking();
  await page.click('[data-pick="studio"]');
  await fillDetails(page, { payType: 'full' });
  eq(await page.locator('#pay-due').innerText(), '1,500 บาท', 'ยอดเต็มจำนวน');
  expect(await page.locator('#pay-rest').isHidden(), 'ไม่ควรมียอดคงเหลือ');
});
test('จองเฉพาะเต็นท์ (ไม่มีบ้าน): นำมาเอง 3 ท่าน + เช่าหลังใหญ่ 1 + หลังเล็ก 1', async () => {
  const page = await openBooking();
  for (let i = 0; i < 3; i++) await page.click('[data-qty="#tent-guests"][data-d="1"]');
  await page.click('[data-qty="#tent-rent"][data-d="1"]');
  await page.click('[data-qty="#tent-rent-s"][data-d="1"]');
  expect((await page.locator('#bar-text').innerText()).includes('รวม 2,900 บาท'), 'ยอดเต็นท์ 3×200 + 1,300 + 1,000');
  await fillDetails(page);
  eq(await step(page), 'done', 'จองเฉพาะเต็นท์ต้องไปถึงหน้าชำระเงิน');
  eq(await page.locator('#pay-due').innerText(), '1,450 บาท', 'มัดจำ 50%');
});
test('โหลด QR ไม่ได้ ยังมีเลขพร้อมเพย์และยอดให้โอน', async () => {
  const page = await openBooking({ blockQr: true });
  await page.click('[data-pick="lagoon-1"]');
  await fillDetails(page);
  const t = await page.locator('#pay-qr').innerText();
  expect(t.includes('090-936-5562') && t.includes('650'), `ข้อความแทน QR: ${t}`);
});
test('กดย้อนกลับจากหน้าชำระเงิน กลับมาหน้าเลือกบ้าน', async () => {
  const page = await openBooking();
  await page.click('[data-pick="lagoon-1"]');
  await fillDetails(page);
  await page.goBack();
  eq(await step(page), 'pick', 'หลังกดย้อนกลับ');
});

// =========================================================
// กันข้อมูลผิด
// =========================================================
test('จำนวนเต็นท์: พิมพ์ 999 → 30 · ติดลบ → 0', async () => {
  const page = await openBooking();
  await page.fill('#tent-guests', '999'); await page.locator('#tent-guests').blur();
  eq(await page.inputValue('#tent-guests'), '30', 'สูงสุด');
  await page.fill('#tent-guests', '-3'); await page.locator('#tent-guests').blur();
  eq(await page.inputValue('#tent-guests'), '0', 'ติดลบ');
});
test('วันเช็กเอาต์ไม่หลังวันเช็กอิน → ขึ้นข้อความ และไปต่อไม่ได้', async () => {
  const page = await openBooking();
  await page.click('[data-pick="lagoon-1"]');
  await page.fill('#checkout', '2026-10-10'); await page.dispatchEvent('#checkout', 'change');
  eq(await page.locator('#date-note').innerText(), 'วันเช็กเอาต์ต้องหลังวันเช็กอิน', 'ข้อความใต้ช่องวันที่');
  await page.click('#to-details');
  eq(await step(page), 'pick', 'ต้องยังอยู่หน้าเลือกบ้าน');
});
test('หลัง 18:00 น. จองเข้าพักคืนนี้ไม่ได้ (วันแรกที่เลือกได้ = พรุ่งนี้)', async () => {
  const page = await openBooking({ time: new Date('2026-10-10T19:00:00+07:00') });
  eq(await page.inputValue('#checkin'), '2026-10-11', 'วันเช็กอินเริ่มต้น');
  expect(await page.locator('#late-note').isVisible(), 'ต้องมีข้อความบอกให้โทรจอง');
  expect(await page.locator('.cal-day[data-date="2026-10-10"]').isDisabled(), 'วันนี้ในปฏิทินต้องกดไม่ได้');
});
test('ข้ามเดือน/ข้ามปี: 30 ธ.ค. – 2 ม.ค. = 3 คืน', async () => {
  const page = await openBooking();
  await page.fill('#checkin', '2026-12-30'); await page.dispatchEvent('#checkin', 'change');
  await page.fill('#checkout', '2027-01-02'); await page.dispatchEvent('#checkout', 'change');
  expect((await page.locator('#nights').innerText()).includes('3 คืน'), 'จำนวนคืน');
});
test('ฟอร์ม: ชื่อว่าง/เว้นวรรคล้วน · เบอร์สั้น · คนเกินบ้าน → ไม่ผ่าน · เบอร์ +66 → ผ่าน', async () => {
  const page = await openBooking();
  await page.click('[data-pick="lagoon-1"]');
  await fillDetails(page, { name: '   ' });
  eq(await page.locator('#form-error').innerText(), 'กรุณากรอกชื่อผู้จอง', 'ชื่อเว้นวรรคล้วน');
  await page.fill('[name=name]', 'ทดสอบ');
  await page.fill('[name=phone]', '12345');
  await page.click('#details-form [type=submit]');
  expect((await page.locator('#form-error').innerText()).includes('สั้นเกินไป'), 'เบอร์สั้น');
  await page.fill('[name=phone]', '+66 81 234 5678');
  await page.fill('[name=guests]', '5');
  await page.click('#details-form [type=submit]');
  expect((await page.locator('#form-error').innerText()).includes('สูงสุด 2 ท่าน'), 'คนเกินบ้าน');
  await page.fill('[name=guests]', '2');
  await page.click('#details-form [type=submit]');
  eq(await step(page), 'done', 'กรอกถูกแล้วต้องผ่าน');
});

// =========================================================
(async () => {
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
