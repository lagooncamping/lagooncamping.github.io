/**
 * The Lagoon Camping Resort — ระบบรับจองจากหน้าเว็บ (Google Apps Script)
 *
 * ไฟล์นี้ไม่ได้อยู่บนเว็บ ต้องคัดลอกไปวางใน Apps Script (โปรเจกต์ "The Lagoon – ระบบจอง")
 * วิธีติดตั้งทีละขั้นอยู่ในไฟล์ SETUP-GOOGLE-SHEETS.md
 *
 * - doGet  : ส่งรายการ "บ้านไหนถูกจองวันไหน" ให้หน้าเว็บ (ไม่ส่งชื่อ/เบอร์ลูกค้า)
 * - doPost : รับการจองใหม่ เช็กว่าไม่ซ้อนกับการจองเดิม คำนวณยอดที่ต้องชำระ (มัดจำ 50% หรือเต็มจำนวน)
 *            แล้วบันทึกลงชีตเป็น "รอชำระเงิน" (ล็อกบ้านไว้ HOLD_HOURS ชั่วโมง)
 * - expireBookings : ตั้งเวลาให้รันทุก 15 นาที เปลี่ยนการจองที่เลยเวลาชำระเป็น "หมดเวลา"
 * - LINE (ถ้าตั้งค่าแล้ว): แจ้งเตือนแอดมินทาง LINE เมื่อมีการจองใหม่ และให้แอดมินพิมพ์ถามรายการจองได้
 *   ค่าลับเก็บใน Project Settings > Script properties (ห้ามใส่ในไฟล์นี้ เพราะไฟล์นี้อยู่บน GitHub):
 *     LINE_TOKEN = Channel access token ของ LINE OA
 *     ADMIN_CODE = รหัสลับสำหรับลงทะเบียนแอดมิน (ตั้งเอง ยาว ๆ เดายาก)
 *     ADMIN_IDS  = ระบบเติมเองเมื่อแอดมินพิมพ์ "ลงทะเบียน <รหัสลับ>" ในแชท LINE OA
 * - หลังบ้าน (หน้า admin.html): ดู/ยืนยัน/ยกเลิกการจอง เพิ่มการจองทางโทรศัพท์ รับเงินส่วนที่เหลือ คืนเงิน
 *   ปฏิทินบ้านว่าง และปิดบ้าน (ซ่อม/ไม่รับจอง) — ไม่ต้องเข้าไปแก้ในชีตเอง
 *   ตั้งรหัสเข้าหลังบ้านที่ Project Settings > Script properties > Add script property
 *     ADMIN_PIN  = ตัวเลข 6 หลักขึ้นไป (ตั้งเอง ห้ามใช้ 123456 หรือวันเกิด) ยังไม่ตั้ง = หลังบ้านเข้าไม่ได้
 *   เปลี่ยน ADMIN_PIN = ทุกเครื่องที่เคยเข้าไว้ถูกออกจากระบบทันที · ใส่ผิดรวมกัน 10 ครั้ง/ชั่วโมง = ล็อก 1 ชั่วโมง
 * - เช็กการจองของฉัน (หน้า my-booking.html): ลูกค้าใส่เบอร์โทร ดูการจองของตัวเอง (ดู lookupByPhone_ ท้ายไฟล์)
 * - LINE ลูกค้า: ส่งข้อความที่มีเลขการจอง (เช่น ข้อความส่งสลิป) → บอทตอบใบยืนยันการจอง และจำ LINE ของลูกค้าไว้
 *   ในคอลัมน์ 'LINE ลูกค้า' · แอดมินกดยืนยันการจองในหลังบ้าน → ส่งใบยืนยันเข้า LINE ลูกค้าให้เอง (1 ข้อความ)
 *   ชีตเก่าที่ยังไม่มีคอลัมน์ 'LINE ลูกค้า' ใช้ได้เลย (ระบบเพิ่มให้) หรือกด Run setup() อีกครั้งก็ได้
 *   แก้ไฟล์นี้แล้วต้อง Deploy > Manage deployments > แก้ (ดินสอ) > Version: New version > Deploy ทุกครั้ง
 * - ซิงก์ปฏิทินกับ Airbnb / Agoda (iCal) — ยังไม่ทำงานจนกว่าจะตั้งค่า (โค้ดอยู่ส่วน "OTA" ท้ายไฟล์)
 *   ส่งออก: ลิงก์ปฏิทินของแต่ละบ้าน (มีแค่วันที่ไม่ว่าง ไม่มีชื่อ/เบอร์ลูกค้า) ให้ Airbnb/Agoda ดึงไปปิดวัน
 *   นำเข้า: ทุก 15 นาที (รันพร้อม expireBookings) ดึงปฏิทินจาก Airbnb/Agoda มาเป็นแถวในชีต ช่อง 'ที่มา' = airbnb/agoda
 *     → หน้าเว็บจองวันนั้นไม่ได้ · ถ้าชนกับการจองในเว็บ แจ้ง LINE แอดมินทันที (ครั้งเดียวต่อเรื่อง)
 *
 *   วิธีเปิดใช้ซิงก์ Agoda/Airbnb (ทำครั้งเดียว)
 *   1) วางไฟล์นี้ใน Apps Script แล้ว Deploy > Manage deployments > แก้ (ดินสอ) > Version: New version > Deploy
 *   2) เลือกฟังก์ชัน setupOta แล้วกด Run (Google ขออนุญาต กดอนุญาต) → ดู Execution log จะมีลิงก์ส่งออกของแต่ละบ้าน
 *        Airbnb: ปฏิทินของที่พัก > Availability > Connect calendars > Import calendar → วางลิงก์ที่มี src=airbnb
 *        Agoda YCS: Calendar > Calendar connections → วางลิงก์ที่มี src=agoda
 *          (Agoda ใช้ได้เฉพาะประเภทห้องที่มี 1 ห้อง — ตั้งบ้านแต่ละหลังเป็น 1 ประเภทห้อง)
 *      ⚠️ ลิงก์ส่งออกมีรหัสลับ ICS_KEY อยู่ข้างใน ห้ามโพสต์ที่สาธารณะ
 *         (หลุด = ลบ Script property ICS_KEY → Run setupOta ใหม่ → วางลิงก์ใหม่ใน Airbnb/Agoda)
 *   3) คัดลอกลิงก์ "Export calendar" ของแต่ละ OTA มาใส่ Script property ชื่อ OTA_ICAL (บรรทัดเดียว) เช่น
 *        {"lagoon-1":{"airbnb":"https://www.airbnb.com/calendar/ical/....ics","agoda":"https://...."},"family-1":{"airbnb":"https://..."}}
 *      (รหัสบ้าน: lagoon-1 lagoon-2 studio family-1 family-2 · ลานกางเต็นท์ไม่ซิงก์)
 *   4) เลือกฟังก์ชัน syncOtaCalendars กด Run 1 ครั้ง แล้ว Run otaStatus ดูว่าแต่ละปฏิทินดึงสำเร็จ (ok) กี่รายการ
 *   หยุดซิงก์ = ลบ Script property OTA_ICAL (แถวที่ดึงมาแล้วยังอยู่ในชีต เปลี่ยนสถานะเป็น "ยกเลิก" ในชีตเองได้)
 */

// ID ของไฟล์ชีต (ตัวอักษรยาว ๆ ในลิงก์ชีต ระหว่าง /d/ กับ /edit)
// เว้นว่างได้ถ้าสร้างสคริปต์จากเมนู ส่วนขยาย > Apps Script ในชีตนั้นเอง
const SPREADSHEET_ID = '';
const SHEET_NAME = 'การจอง';
const TZ = 'Asia/Bangkok';
const STATUS = { PENDING: 'รอชำระเงิน', CONFIRMED: 'ยืนยันแล้ว', CANCELLED: 'ยกเลิก', EXPIRED: 'หมดเวลา' };
// อีเมลที่จะได้รับแจ้งเตือนเมื่อมีการจองใหม่ (เว้นว่าง = ไม่ส่ง)
const NOTIFY_EMAIL = 'lagooncampingresort@gmail.com';

// เงื่อนไขการชำระ (ตามที่เจ้าของกำหนด 2 ต.ค. 2026)
// ลูกค้าเลือกเอง: มัดจำ 50% (ยกเลิก/ไม่มา ไม่คืนเงิน · ที่เหลือจ่ายวันเช็กอิน เงินสดหรือโอนหน้าเคาน์เตอร์)
// หรือ เต็มจำนวน (ยกเลิก/ไม่มา คืน 50% ของยอดจอง — แอดมินโอนคืนเอง)
const DEPOSIT_RATE = 0.5; // มัดจำ 50%
const HOLD_HOURS = 6;     // ต้องชำระภายใน 6 ชั่วโมง ไม่งั้นบ้านหลุด
const PAY_TYPES = { deposit: 'มัดจำ 50%', full: 'เต็มจำนวน' };
const TENT_PRICE = 200;  // นำเต็นท์มาเอง บาท/ท่าน/คืน — ต้องตรงกับ js/booking.js
const TENT_RENT = 1300;  // เช่าเต็นท์ของรีสอร์ท บาท/หลัง/คืน (นอน 2 ท่าน พร้อมเครื่องนอน 2 ชุด พัดลม ปลั๊ก) — ต้องตรงกับ js/booking.js
// จองเฉพาะเต็นท์ (ไม่มีบ้าน) บันทึกเป็น 1 แถว รหัสบ้าน 'tent' (ไม่ล็อกบ้านหลังไหน)
const TENT_ROW = { id: 'tent', name: 'ลานกางเต็นท์' };
const SAME_DAY_CUTOFF = 18; // หลัง 18:00 น. ไม่รับจองเข้าพักวันนี้ทางเว็บ (ให้โทรจอง) — ต้องตรงกับ js/booking.js

// ราคาต่อคืน — ต้องตรงกับ js/booking.js (ระบบคำนวณยอดจากราคานี้ ไม่เชื่อยอดที่ส่งมาจากหน้าเว็บ)
// guests = นอนได้สูงสุดกี่ท่าน (ใช้เช็กว่าจำนวนผู้เข้าพักไม่เกินที่บ้านรับได้)
const HOUSES = {
  'lagoon-1': { name: 'Lagoon 1', price: 1300, guests: 2 },
  'lagoon-2': { name: 'Lagoon 2', price: 1300, guests: 2 },
  'studio': { name: 'Lagoon Studio', price: 1500, guests: 2 },
  'family-1': { name: 'Lagoon Family 1', price: 2500, guests: 4 },
  'family-2': { name: 'Lagoon Family 2', price: 3000, guests: 4 },
};

// รหัสบ้านนี้มีจริงไหม (เช็กเฉพาะรหัสใน HOUSES เอง กันค่าแปลก ๆ อย่าง 'constructor')
function isHouse_(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(HOUSES, id);
}

const HEADERS = ['เวลาที่จอง', 'รหัสการจอง', 'รหัสบ้าน', 'บ้าน', 'เช็กอิน', 'เช็กเอาต์', 'คืน', 'ผู้เข้าพัก',
  'ชื่อ', 'เบอร์โทร', 'หมายเหตุ', 'ยอดรวม (บาท)', 'สถานะ', 'ยอดที่ต้องชำระ (บาท)', 'ชำระภายใน', 'แบบชำระ',
  'ชำระส่วนที่เหลือ', 'คืนเงิน', 'กางเต็นท์เอง (ท่าน)', 'เช่าเต็นท์ (หลัง)', 'LINE ลูกค้า', 'ที่มา'];
const COL = { house: 3, checkin: 5, checkout: 6, status: 13, deadline: 15, balance: 17, refund: 18, line: 21, source: 22 }; // ลำดับคอลัมน์ (เริ่มที่ 1)
// คอลัมน์ 'LINE ลูกค้า' (ช่องที่ 21) = LINE userId ของลูกค้าที่ทักมาพร้อมเลขการจอง (ระบบเติมเอง ห้ามแก้/ห้ามแชร์)
// ใช้ส่งใบยืนยันเข้า LINE ลูกค้าตอนแอดมินกดยืนยัน · ชีตเก่าที่ยังไม่มีคอลัมน์นี้ใช้ได้ (ระบบเพิ่มหัวคอลัมน์ให้ตอนต้องใช้)
// คอลัมน์ 'ที่มา' (ช่องที่ 22) = airbnb / agoda เฉพาะแถวที่ซิงก์มาจาก OTA (ระบบเขียนเอง) · ว่าง = จองในเว็บ/หลังบ้าน/พิมพ์เอง

// ช่องให้แอดมินเลือก
// - ชำระส่วนที่เหลือ: แบบมัดจำ 50% จ่ายที่เหลือวันเช็กอิน (เงินสด หรือ โอนหน้าเคาน์เตอร์)
// - คืนเงิน: แบบเต็มจำนวนที่ยกเลิกหรือไม่มาพัก แอดมินโอนคืน 50% แล้วเลือก "คืนเงินแล้ว"
const BALANCE = { UNPAID: 'ยังไม่ชำระ', CASH: 'เงินสด', TRANSFER: 'โอนหน้าเคาน์เตอร์' };
const REFUND = { DONE: 'คืนเงินแล้ว' };

/** กด Run ตอนติดตั้ง (รันซ้ำได้): สร้างหัวตาราง ช่องเลือกสถานะ และสีตามสถานะ */
function setup() {
  const ss = spreadsheet_();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME, 0);
  const rows = sh.getMaxRows() - 1;
  ensureCols_(sh);

  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // เก็บวันที่ เบอร์โทร และเวลาชำระเป็นข้อความ (กันชีตแปลงเป็นวันที่/ตัวเลขเอง)
  sh.getRange('E:F').setNumberFormat('@');
  sh.getRange('J:J').setNumberFormat('@');
  sh.getRange('O:O').setNumberFormat('@');

  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(STATUS), true).build();
  sh.getRange(2, COL.status, rows, 1).setDataValidation(statusRule);
  const list = (values) => SpreadsheetApp.newDataValidation().requireValueInList(values, true).build();
  sh.getRange(2, COL.balance, rows, 1).setDataValidation(list(Object.values(BALANCE)));
  sh.getRange(2, COL.refund, rows, 1).setDataValidation(list(Object.values(REFUND)));

  const all = sh.getRange(2, 1, rows, HEADERS.length);
  const color = (text, bg) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$M2="' + text + '"').setBackground(bg).setRanges([all]).build();
  sh.setConditionalFormatRules([
    color(STATUS.PENDING, '#FFF4D6'),
    color(STATUS.CONFIRMED, '#E3F1E0'),
    color(STATUS.CANCELLED, '#EEEEEE'),
    color(STATUS.EXPIRED, '#EEEEEE'),
  ]);
  sh.autoResizeColumns(1, HEADERS.length);
}

/** กด Run ครั้งเดียว: ตั้งให้ expireBookings รันเองทุก 15 นาที */
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'expireBookings')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('expireBookings').timeBased().everyMinutes(15).create();
}

/** กด Run ครั้งเดียวหลังเพิ่มการแจ้งเตือนอีเมล เพื่อให้ Google ขออนุญาตส่งอีเมล */
function authorizeEmail() {
  MailApp.getRemainingDailyQuota();
}

/** เปลี่ยนการจองที่เลยเวลาชำระเงินเป็น "หมดเวลา" ให้แอดมินเห็นในชีต
 *  (หน้าเว็บปลดบ้านให้อยู่แล้วตั้งแต่เลยเวลา ไม่ต้องรอฟังก์ชันนี้) */
function expireBookings() {
  // ล็อกไว้ กันชนกับการจองใหม่ที่กำลังเขียนแถวอยู่
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const last = sh.getLastRow();
    if (last < 2) return;
    const now = nowText_();
    const status = sh.getRange(2, COL.status, last - 1, 1).getValues();
    const deadline = sh.getRange(2, COL.deadline, last - 1, 1).getValues();
    // เขียนเฉพาะช่องที่เปลี่ยนจริง ไม่ทับสถานะที่แอดมินเพิ่งแก้ในแถวอื่น
    status.forEach((row, i) => {
      if (isExpired_(row[0], deadline[i][0], now)) sh.getRange(i + 2, COL.status).setValue(STATUS.EXPIRED);
    });
  } finally {
    lock.releaseLock();
    // ซิงก์ปฏิทิน Airbnb/Agoda ไปด้วยในตัวตั้งเวลาเดียวกัน (ยังไม่ตั้ง OTA_ICAL = ไม่ทำอะไร) · พังก็ไม่กระทบส่วนอื่น
    try {
      syncOtaCalendars();
    } catch (err) {
      console.error('ซิงก์ปฏิทิน OTA: ' + err);
    }
  }
}

/** หน้าเว็บขอดูวันว่าง · ?ics=<รหัสบ้าน>&k=<ICS_KEY> = ปฏิทินส่งออกให้ Airbnb/Agoda (ดู icsFeed_) */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.ics !== undefined) return icsFeed_(p);
  return json_({ ok: true, bookings: activeBookings_(sheet_()) });
}

/** หน้าเว็บส่งการจองใหม่ */
function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }

  // ข้อความจาก LINE (webhook) ไม่ใช่การจองจากหน้าเว็บ
  if (Array.isArray(d.events)) {
    d.events.forEach((ev) => { try { lineEvent_(ev); } catch (err) { console.error('LINE: ' + err); } });
    return json_({ ok: true });
  }

  // หน้าหลังบ้าน (admin.html) — ต้องเข้าสู่ระบบด้วย PIN ก่อน
  if (d && typeof d.admin === 'string') {
    let out;
    try {
      out = adminApi_(d);
    } catch (err) {
      console.error('หลังบ้าน: ' + err);
      out = { ok: false, error: 'server' };
    }
    return json_(out);
  }

  // ลูกค้าเช็กการจองของตัวเองด้วยเบอร์โทร (หน้า my-booking.html) — ไม่บันทึกอะไรลงชีต
  if (d && d.lookup === 'phone') {
    let out;
    try {
      out = lookupByPhone_(d.phone);
    } catch (err) {
      console.error('เช็กการจอง: ' + err);
      out = { ok: false, error: 'server' };
    }
    return json_(out);
  }

  // ช่องลับกันบอท: คนจริงมองไม่เห็นช่องนี้ ถ้ามีค่ามาแปลว่าเป็นบอท ทำเหมือนสำเร็จแต่ไม่บันทึก
  if (d.website) return json_({ ok: true, id: 'LG000000-0000', total: 0, due: 0, payType: 'deposit', deadline: '' });

  d.houses = Array.isArray(d.houses) ? [...new Set(d.houses)] : [];
  const problem = validate_(d);
  if (problem) return json_({ ok: false, error: problem });

  const nights = nights_(d.checkin, d.checkout);
  const tent = Math.floor(Number(d.tentGuests) || 0);
  const rent = Math.floor(Number(d.tentRentals) || 0);
  const total = (d.houses.reduce((sum, h) => sum + HOUSES[h].price, 0) + tent * TENT_PRICE + rent * TENT_RENT) * nights;
  const payType = d.payType === 'full' ? 'full' : 'deposit';
  const due = payType === 'full' ? total : Math.ceil(total * DEPOSIT_RATE);

  // ล็อกไว้ กันสองคนจองบ้านเดียวกันพร้อมกัน
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let id;
  let deadline;
  try {
    const sh = sheet_();
    const current = activeBookings_(sh);
    const taken = d.houses.filter((h) => current.some((b) => b.house === h && b.from < d.checkout && b.to > d.checkin));
    if (taken.length) return json_({ ok: false, error: 'booked', houses: taken });

    const now = new Date();
    id = 'LG' + Utilities.formatDate(now, TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    deadline = Utilities.formatDate(new Date(now.getTime() + HOLD_HOURS * 3600000), TZ, 'yyyy-MM-dd HH:mm');
    // 1 แถวต่อบ้าน · จองแค่เต็นท์ = 1 แถวรหัส 'tent'
    const items = d.houses.length ? d.houses.map((h) => ({ id: h, name: HOUSES[h].name })) : [TENT_ROW];
    const rows = items.map((h) => [
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm'), id, h.id, h.name, d.checkin, d.checkout, nights,
      Number(d.guests), safe_(d.name), safe_(d.phone), safe_(d.note), total, STATUS.PENDING, due, deadline,
      PAY_TYPES[payType], payType === 'deposit' ? BALANCE.UNPAID : '', '', tent || '', rent || '',
    ]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } finally {
    try {
      SpreadsheetApp.flush(); // เขียนลงชีตให้เสร็จก่อนปลดล็อก คนถัดไปจะเห็นแถวใหม่แน่นอน
    } finally {
      lock.releaseLock();
    }
  }

  notify_(id, d, total, due, payType, deadline); // ส่งหลังปลดล็อก จะได้ไม่ทำให้คนอื่นที่กำลังจองต้องรอ
  lineNotify_(id, d, due, payType);
  return json_({ ok: true, id, total, due, payType, deadline });
}

// ---------- ตัวช่วย ----------

function spreadsheet_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_() {
  return spreadsheet_().getSheetByName(SHEET_NAME);
}

// จำนวนคอลัมน์ที่อ่านได้ (ชีตเก่าอาจมีคอลัมน์น้อยกว่า HEADERS — ช่องที่ไม่มีจะเป็น undefined)
function readCols_(sh) {
  const max = typeof sh.getMaxColumns === 'function' ? sh.getMaxColumns() : HEADERS.length;
  return Math.max(1, Math.min(HEADERS.length, max));
}

// ชีตมีคอลัมน์ไม่ถึงช่องที่ upTo (ไม่ใส่ = ครบ HEADERS) → เพิ่มคอลัมน์ท้ายตาราง
// หัวคอลัมน์ 'LINE ลูกค้า' / 'ที่มา' ยังว่าง → เขียนให้
function ensureCols_(sh, upTo) {
  const need = upTo || HEADERS.length;
  const max = typeof sh.getMaxColumns === 'function' ? sh.getMaxColumns() : HEADERS.length;
  if (max < need) sh.insertColumnsAfter(max, need - max);
  [COL.line, COL.source].filter((c) => c <= need).forEach((c) => {
    const head = sh.getRange(1, c);
    if (String(head.getValue() || '').trim() === '') head.setValue(HEADERS[c - 1]);
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function todayISO_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function nowText_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
}

// แอดมินอาจพิมพ์วันที่เองจนชีตแปลงเป็น Date — แปลงกลับเป็นข้อความ
// หรือพิมพ์แบบไทย เช่น 8/10/2569, 8/10/69, 8/10/2026 (ต้องมีปีเสมอ) → yyyy-mm-dd
function iso_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  return parseDate_(s, '') || s; // อ่านไม่ออก ส่งคืนตามเดิม
}
function stamp_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm') : String(v || '').trim();
}

// รอชำระเงิน + เลยเวลาแล้ว = หมดเวลา (แถวที่แอดมินพิมพ์เองโดยไม่ใส่เวลาชำระ จะไม่หมดเวลา)
function isExpired_(status, deadline, now) {
  const dl = stamp_(deadline);
  return status === STATUS.PENDING && dl !== '' && dl <= now;
}

function nights_(from, to) {
  return Math.round((new Date(to + 'T00:00:00Z') - new Date(from + 'T00:00:00Z')) / 86400000);
}

// แอดมินพิมพ์การจองเองในชีต อาจพิมพ์รหัสบ้านเป็นชื่อ เช่น "Lagoon 1", "Studio", "Family 2",
// "สตูดิโอ", "แฟมิลี่ 1", "ครอบครัว1", "ลากูน 1" — แปลงเป็นรหัสให้ (ไม่สนตัวใหญ่เล็ก เว้นวรรค ขีด)
const HOUSE_ALIAS = {
  '1': 'lagoon-1', '2': 'lagoon-2',
  studio: 'studio', 'สตูดิโอ': 'studio', 'สตูดิโอ้': 'studio',
  family1: 'family-1', 'แฟมิลี่1': 'family-1', 'แฟมิลี1': 'family-1', 'แฟมมิลี่1': 'family-1', 'ครอบครัว1': 'family-1',
  family2: 'family-2', 'แฟมิลี่2': 'family-2', 'แฟมิลี2': 'family-2', 'แฟมมิลี่2': 'family-2', 'ครอบครัว2': 'family-2',
};
function houseId_(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (isHouse_(s)) return s;
  // ตัดเว้นวรรค ขีด ขีดล่าง แล้วตัดคำนำหน้า "บ้าน" / "lagoon" / "ลากูน"
  const key = s.replace(/[\s\-_]+/g, '').replace(/^บ้าน/, '').replace(/^(lagoon|ลากูน)/, '');
  return Object.prototype.hasOwnProperty.call(HOUSE_ALIAS, key) ? HOUSE_ALIAS[key] : s;
}

// การจองที่ยังล็อกบ้านอยู่ (ส่งเฉพาะบ้านกับวันที่ ไม่ส่งข้อมูลลูกค้า)
function activeBookings_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const today = todayISO_();
  const now = nowText_();
  return sh.getRange(2, 1, last - 1, readCols_(sh)).getValues()
    .map((r) => ({
      house: houseId_(r[COL.house - 1]) || houseId_(r[3]), // ช่องรหัสบ้านว่าง ลองดูช่องชื่อบ้าน
      from: iso_(r[COL.checkin - 1]),
      to: iso_(r[COL.checkout - 1]),
      status: r[COL.status - 1],
      deadline: r[COL.deadline - 1],
    }))
    .filter((b) => isHouse_(b.house) && b.to > today
      && b.status !== STATUS.CANCELLED && b.status !== STATUS.EXPIRED
      && !isExpired_(b.status, b.deadline, now))
    .map((b) => ({ house: b.house, from: b.from, to: b.to }));
}

function validate_(d) {
  const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (d.houses.some((h) => !isHouse_(h))) return 'bad_house';
  const tent = Number(d.tentGuests || 0);
  const rent = Number(d.tentRentals || 0);
  if (!(Number.isInteger(tent) && tent >= 0 && tent <= 30)) return 'bad_tent';
  if (!(Number.isInteger(rent) && rent >= 0 && rent <= 10)) return 'bad_tent';
  if (!d.houses.length && !tent && !rent) return 'bad_house'; // ต้องมีบ้านหรือเต็นท์อย่างน้อย 1 อย่าง
  if (!isDate(d.checkin) || !isDate(d.checkout) || d.checkout <= d.checkin || d.checkin < todayISO_()) return 'bad_dates';
  if (d.checkin === todayISO_() && Number(Utilities.formatDate(new Date(), TZ, 'H')) >= SAME_DAY_CUTOFF) return 'too_late';
  if (nights_(d.checkin, d.checkout) > 30) return 'too_long';
  const name = String(d.name == null ? '' : d.name).trim();
  if (!name || name.length > 100) return 'bad_name';
  if (!/^0[0-9]{8,9}$/.test(String(d.phone || '').replace(/[\s-]/g, ''))) return 'bad_phone';
  const guests = Number(d.guests);
  if (!(Number.isInteger(guests) && guests >= (d.houses.length ? 1 : 0) && guests <= 30)) return 'bad_guests'; // จองแค่เต็นท์ = 0 คนในบ้าน
  const capacity = d.houses.reduce((sum, h) => sum + HOUSES[h].guests, 0);
  if (d.houses.length && guests > capacity) return 'over_capacity'; // คนเกินที่บ้านที่เลือกนอนได้
  if (d.note && String(d.note).length > 500) return 'bad_note';
  return '';
}

// สิ่งที่จอง เช่น "Lagoon 1, Lagoon 2 + เต็นท์มาเอง 3 ท่าน + เช่าเต็นท์ 1 หลัง"
function itemsText_(d) {
  const parts = d.houses.map((h) => HOUSES[h].name);
  if (Number(d.tentGuests)) parts.push('นำเต็นท์มาเอง ' + Number(d.tentGuests) + ' ท่าน');
  if (Number(d.tentRentals)) parts.push('เช่าเต็นท์ ' + Number(d.tentRentals) + ' หลัง');
  return parts.join(' + ');
}

// จำนวนคน เช่น "4 ท่านในบ้าน · เต็นท์มาเอง 3 ท่าน · เช่าเต็นท์ 1 หลัง"
function guestsText_(d) {
  return [
    Number(d.guests) ? Number(d.guests) + ' ท่านในบ้าน' : '',
    Number(d.tentGuests) ? 'เต็นท์มาเอง ' + Number(d.tentGuests) + ' ท่าน' : '',
    Number(d.tentRentals) ? 'เช่าเต็นท์ ' + Number(d.tentRentals) + ' หลัง (2 ท่าน/หลัง)' : '',
  ].filter(Boolean).join(' · ');
}

// กันข้อความที่ขึ้นต้นด้วย = + - @ ไม่ให้ชีตตีความเป็นสูตร
function safe_(v) {
  const s = String(v || '').trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// ส่งอีเมลแจ้งแอดมินว่ามีการจองใหม่ (ถ้าส่งไม่ได้ การจองยังบันทึกอยู่ในชีตตามปกติ)
function notify_(id, d, total, due, payType, deadline) {
  if (!NOTIFY_EMAIL) return;
  try {
    const names = itemsText_(d);
    const subject = 'จองใหม่ ' + id + ' · ' + names + ' · ' + d.checkin + ' ถึง ' + d.checkout;
    const body = [
      'มีคำขอจองใหม่จากหน้าเว็บ (สถานะ: ' + STATUS.PENDING + ')',
      '',
      'รหัสการจอง: ' + id,
      'บ้าน: ' + names,
      'เช็กอิน: ' + d.checkin,
      'เช็กเอาต์: ' + d.checkout + ' (' + nights_(d.checkin, d.checkout) + ' คืน)',
      'ผู้เข้าพัก: ' + guestsText_(d),
      'ชื่อ: ' + String(d.name).trim(),
      'เบอร์โทร: ' + String(d.phone).trim(),
      'หมายเหตุ: ' + (String(d.note || '').trim() || '-'),
      'ยอดรวม: ' + total + ' บาท',
      'แบบชำระ: ' + PAY_TYPES[payType] + ' — ยอดที่ต้องชำระ ' + due + ' บาท ภายใน ' + deadline,
      '',
      'เปิดชีตการจอง: ' + spreadsheet_().getUrl(),
      'ได้รับสลิปและเช็กยอดเข้าแล้ว ให้เปลี่ยนสถานะในชีตเป็น "' + STATUS.CONFIRMED + '"',
      'ถ้าไม่ชำระภายในเวลา ระบบจะปลดบ้านและเปลี่ยนเป็น "' + STATUS.EXPIRED + '" เอง',
    ].join('\n');
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    console.error('ส่งอีเมลแจ้งเตือนไม่สำเร็จ: ' + err);
  }
}

// ---------- LINE: แจ้งเตือนแอดมิน + ถามรายการจองในแชท ----------
// แอดมิน (เช่น คุณพ่อ) แอด LINE OA เป็นเพื่อน แล้วพิมพ์ "ลงทะเบียน <รหัสลับ>" ครั้งเดียว
// จากนั้นพิมพ์: จอง · วันนี้ · พรุ่งนี้ · วันที่ เช่น 15/10 · เมนู
// คนที่ไม่ใช่แอดมินพิมพ์มา บอทจะเงียบ (ข้อความตอบกลับอัตโนมัติของ LINE OA ทำงานตามปกติ)

const LINE_HELP = [
  'พิมพ์ได้ตามนี้ครับ',
  '• จอง = การจองที่กำลังจะมาถึงทั้งหมด',
  '• วันนี้ = คืนนี้ใครพักบ้าง',
  '• พรุ่งนี้ = คืนพรุ่งนี้ใครพักบ้าง',
  '• 15/10 = คืนวันที่ 15 ต.ค. ใครพักบ้าง',
  '• หยุดแจ้งเตือน = เลิกรับแจ้งเตือนการจองใหม่',
].join('\n');

const REG_MAX_FAILS = 5;      // พิมพ์รหัสลงทะเบียนผิดได้กี่ครั้ง/ชั่วโมง ต่อคน
const REG_MAX_FAILS_ALL = 20; // รวมทุกคน/ชั่วโมง (กันเปลี่ยนบัญชีมาเดา)

function props_() {
  return PropertiesService.getScriptProperties();
}

function adminIds_() {
  return (props_().getProperty('ADMIN_IDS') || '').split(',').filter(Boolean);
}

function lineEvent_(ev) {
  // ลูกค้าส่งรูป (มักเป็นสลิป) → ตอบรับ (ดู lineImageAck_) · แอดมินส่งรูป = เงียบ
  if (ev.type === 'message' && ev.message && ev.message.type === 'image' && ev.source && ev.source.userId) {
    if (!adminIds_().includes(ev.source.userId)) lineImageAck_(ev, ev.source.userId);
    return;
  }
  if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text' || !ev.source || !ev.source.userId) return;
  const user = ev.source.userId;
  const text = String(ev.message.text).trim();
  const admins = adminIds_();

  // ลงทะเบียนแอดมินด้วยรหัสลับ
  const reg = text.match(/^ลงทะเบียน\s+(.+)$/);
  if (reg) {
    // กันคนสุ่มเดารหัส: ผิดเกิน REG_MAX_FAILS ครั้ง/ชั่วโมง (ต่อคน) หรือรวมทุกคนเกิน REG_MAX_FAILS_ALL = เงียบ ไม่เช็กรหัสเลย
    const cache = CacheService.getScriptCache();
    const userKey = 'reg_fail_' + user;
    const fails = Number(cache.get(userKey)) || 0;
    const allFails = Number(cache.get('reg_fail_all')) || 0;
    if (fails >= REG_MAX_FAILS || allFails >= REG_MAX_FAILS_ALL) return;
    const code = props_().getProperty('ADMIN_CODE');
    if (!code || reg[1].trim() !== code) { // รหัสผิด: เงียบ ไม่บอกว่ามีระบบนี้
      cache.put(userKey, String(fails + 1), 3600);
      cache.put('reg_fail_all', String(allFails + 1), 3600);
      return;
    }
    cache.remove(userKey);
    if (!admins.includes(user)) {
      props_().setProperty('ADMIN_IDS', admins.concat(user).join(','));
      // บอกแอดมินเดิมทุกคน เผื่อรหัสหลุดไปถึงคนแปลกหน้า
      if (admins.length) linePush_(admins, 'มีแอดมินใหม่ลงทะเบียนในบอท ถ้าไม่ใช่คนที่คุณรู้จัก ให้เปลี่ยนรหัส ADMIN_CODE ทันที');
    }
    lineReply_(ev.replyToken, 'ลงทะเบียนแอดมินแล้วครับ ✅\nมีคนจองใหม่จะแจ้งเตือนที่แชทนี้\n\n' + LINE_HELP);
    return;
  }
  // ข้อความที่มีเลขการจอง (ลูกค้าส่งสลิป / พิมพ์ "เช็กการจอง LG...") → ตอบใบยืนยันการจอง (ดู lineVoucherReply_)
  const bookingId = bookingIdIn_(text);
  if (!admins.includes(user)) {
    if (bookingId) lineVoucherReply_(ev, user, text, bookingId, false);
    return; // ลูกค้าพิมพ์อย่างอื่น = เงียบ
  }
  if (bookingId) {
    lineVoucherReply_(ev, user, text, bookingId, true);
    return;
  }

  if (text === 'หยุดแจ้งเตือน') {
    props_().setProperty('ADMIN_IDS', admins.filter((id) => id !== user).join(','));
    lineReply_(ev.replyToken, 'หยุดแจ้งเตือนแล้วครับ ถ้าจะกลับมารับแจ้งเตือน พิมพ์ "ลงทะเบียน <รหัสลับ>" อีกครั้ง');
    return;
  }

  const today = todayISO_();
  const date = parseDate_(text, today);
  let reply;
  if (text === 'จอง' || text === 'รายการจอง') reply = upcomingText_(today);
  else if (text === 'วันนี้' || text === 'คืนนี้') reply = nightText_(today);
  else if (text === 'พรุ่งนี้') reply = nightText_(addDaysISO_(today, 1));
  else if (date) reply = nightText_(date);
  else reply = LINE_HELP;
  lineReply_(ev.replyToken, reply);
}

// แจ้งแอดมินทุกคนเมื่อมีการจองใหม่ (นับเป็นข้อความ push ของ LINE OA: แพ็กเกจฟรี 200 ข้อความ/เดือน)
function lineNotify_(id, d, due, payType) {
  const admins = adminIds_();
  if (!admins.length || !props_().getProperty('LINE_TOKEN')) return;
  const text = [
    '🔔 มีคนจองใหม่',
    '🏠 ' + itemsText_(d),
    '📅 ' + thaiRange_(d.checkin, d.checkout),
    '👤 ' + String(d.name).trim() + ' · ' + guestsText_(d),
    '📞 ' + String(d.phone).trim(),
    '💰 ' + PAY_TYPES[payType] + ' ' + due.toLocaleString('en-US') + ' บาท (รอชำระเงิน)',
    'รหัส ' + id,
    'เปิดในหลังบ้าน: ' + ADMIN_URL + '#' + id,
  ].join('\n');
  // บ้านนี้ขายใน Airbnb/Agoda ด้วย → ต่อท้ายข้อความเดิม (ไม่ส่งเพิ่มอีกข้อความ ประหยัดโควตา)
  const ota = otaReminder_(d.houses, d.checkin, d.checkout, 'web');
  linePush_(admins, ota ? text + '\n\n' + ota : text);
}

// ส่งข้อความหาแอดมินหลายคน: ลอง multicast ก่อน ถ้าพัง ส่งทีละคน (id ไหนเสีย คนอื่นยังได้รับ)
function linePush_(ids, text) {
  if (!ids.length || !props_().getProperty('LINE_TOKEN')) return;
  const messages = [{ type: 'text', text: text.slice(0, 4900) }];
  try {
    lineApi_('/v2/bot/message/multicast', { to: ids, messages });
  } catch (err) {
    console.error('ส่ง LINE แบบรวมไม่สำเร็จ ลองส่งทีละคน: ' + err);
    ids.forEach((id) => {
      try {
        lineApi_('/v2/bot/message/push', { to: id, messages });
      } catch (err2) {
        console.error('ส่ง LINE ถึง ' + id + ' ไม่สำเร็จ: ' + err2);
      }
    });
  }
}

function lineReply_(token, text) {
  lineApi_('/v2/bot/message/reply', { replyToken: token, messages: [{ type: 'text', text: text.slice(0, 4900) }] });
}

function lineApi_(path, body) {
  const res = UrlFetchApp.fetch('https://api.line.me' + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + props_().getProperty('LINE_TOKEN') },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error(res.getResponseCode() + ' ' + res.getContentText());
}

// การจองที่ยังมีผล (ไม่ยกเลิก/ไม่หมดเวลา) รวมแถวที่จองหลายบ้านในรหัสเดียวกัน
function bookingGroups_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const now = nowText_();
  const groups = {};
  sh.getRange(2, 1, last - 1, readCols_(sh)).getValues().forEach((r, i) => {
    const status = r[COL.status - 1];
    if (status === STATUS.CANCELLED || status === STATUS.EXPIRED || isExpired_(status, r[COL.deadline - 1], now)) return;
    const key = String(r[1]).trim() || 'row' + i; // แถวที่แอดมินพิมพ์เองอาจไม่มีรหัส
    const g = groups[key] || (groups[key] = {
      houses: [], from: iso_(r[COL.checkin - 1]), to: iso_(r[COL.checkout - 1]),
      guests: r[7], tent: Number(r[18]) || 0, rent: Number(r[19]) || 0, name: String(r[8]), phone: String(r[9]), note: String(r[10] || ''), status,
      blocked: /^BLK/.test(key), // ปิดบ้านจากหลังบ้าน (ซ่อม/ไม่รับจอง) ไม่ใช่แขก
      ota: otaSourceOf_(r, key), // '' = เว็บ/หลังบ้าน · airbnb / agoda = ซิงก์มาจาก OTA
    });
    const hid = houseId_(r[COL.house - 1]) || houseId_(r[3]);
    if (hid === TENT_ROW.id) return; // แถวจองเฉพาะเต็นท์ ไม่นับเป็นบ้าน
    g.houses.push(isHouse_(hid) ? HOUSES[hid].name : String(r[3] || r[COL.house - 1]));
  });
  return Object.values(groups).sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
}

// จำนวนคนทั้งหมดของการจอง = คนในบ้าน + เต็นท์มาเอง + เช่าเต็นท์ × 2
// (จองเฉพาะเต็นท์ที่แอดมินพิมพ์เองโดยไม่ใส่ช่องเต็นท์ ใช้ช่องผู้เข้าพักแทน)
function groupPeople_(g) {
  const inHouse = Number(g.guests) || 0;
  const tents = g.tent + g.rent * 2;
  if (!g.houses.length) return tents || inHouse;
  return inHouse + tents;
}

function bookingText_(g) {
  if (g.ota) { // ซิงก์มาจาก Airbnb/Agoda: ไม่มีชื่อ/เบอร์/จำนวนคน
    const label = OTA_SOURCES[g.ota];
    const closed = OTA_BLOCK_NAME.test(g.name);
    return '🌐 ' + (closed ? label + ' ปิดวัน' : 'จองผ่าน ' + label) + ' · ' + g.houses.join(', ')
      + '\n📅 ' + thaiRange_(g.from, g.to) + (closed ? '' : '\nℹ️ ดูชื่อ/จำนวนคนในแอป ' + label);
  }
  if (g.blocked) return '🔧 ปิดบ้าน ' + g.houses.join(', ') + '\n📅 ' + thaiRange_(g.from, g.to) + (g.note ? '\n📝 ' + g.note : '');
  const people = [
    g.houses.length ? (Number(g.guests) || 0) + ' ท่านในบ้าน' : 'ไม่มีบ้าน',
    g.tent ? '⛺ มาเอง ' + g.tent + ' ท่าน' : '',
    g.rent ? '⛺ เช่า ' + g.rent + ' หลัง' : '',
  ].filter(Boolean).join(' · ');
  return [
    g.houses.length ? '🏠 ' + g.houses.join(', ') : '⛺ ' + TENT_ROW.name + ' (ไม่มีบ้าน)',
    '👤 ' + g.name + ' · ' + people,
    '📞 ' + g.phone,
    '📅 ' + thaiRange_(g.from, g.to),
    (g.status === STATUS.CONFIRMED ? '✅ ' : '⏳ ') + g.status + (g.note ? '\n📝 ' + g.note : ''),
  ].join('\n');
}

function upcomingText_(today) {
  const list = bookingGroups_().filter((g) => g.to > today);
  if (!list.length) return 'ยังไม่มีการจองที่กำลังจะมาถึงครับ';
  const shown = list.slice(0, 25);
  return '📋 การจองที่กำลังจะมาถึง ' + list.length + ' รายการ\n\n' + shown.map(bookingText_).join('\n\n')
    + (list.length > shown.length ? '\n\n…และอีก ' + (list.length - shown.length) + ' รายการ ดูทั้งหมดในชีต' : '');
}

// ใครพักคืนวันที่ day (เช็กอินแล้ว ยังไม่เช็กเอาต์)
function nightText_(day) {
  const list = bookingGroups_().filter((g) => g.from <= day && g.to > day);
  const head = '🌙 คืนวัน' + thaiDate_(day, true);
  if (!list.length) return head + '\nยังไม่มีคนจองครับ บ้านว่างทุกหลัง';
  // บ้านที่ปิดซ่อม / OTA ปิดวัน ไม่นับเป็นแขก · จองผ่าน OTA นับบ้าน แต่ไม่รู้จำนวนคน (นับ 0)
  const guests = list.filter((g) => !g.blocked && !(g.ota && OTA_BLOCK_NAME.test(g.name)));
  const people = guests.reduce((sum, g) => sum + groupPeople_(g), 0);
  const houses = guests.reduce((sum, g) => sum + g.houses.length, 0);
  const tent = list.reduce((sum, g) => sum + g.tent, 0);
  const rent = list.reduce((sum, g) => sum + g.rent, 0);
  const summary = [
    'บ้าน ' + houses + ' หลัง',
    tent ? 'เต็นท์มาเอง ' + tent + ' ท่าน' : '',
    rent ? 'เช่าเต็นท์ ' + rent + ' หลัง' : '',
    'รวม ' + people + ' ท่าน' + (guests.some((g) => g.ota) ? ' (ไม่รวมแขก Airbnb/Agoda)' : ''),
  ].filter(Boolean).join(' · ');
  return head + '\n' + summary + '\n\n' + list.map(bookingText_).join('\n\n');
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function thaiDate_(iso, withDay) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (withDay ? TH_DAYS[dow] + ' ' : '') + d + ' ' + TH_MONTHS[m - 1] + ' ' + String(y + 543).slice(2);
}

function thaiRange_(from, to) {
  return thaiDate_(from, true) + ' – ' + thaiDate_(to, true) + ' (' + nights_(from, to) + ' คืน)';
}

function addDaysISO_(iso, n) {
  const t = new Date(iso + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

// "15/10", "15/10/69", "15/10/2569", "15/10/2026" → yyyy-mm-dd (ไม่ใส่ปี = ครั้งถัดไปที่ถึงวันนั้น)
// today ว่าง = ต้องมีปี (ใช้กับวันที่ที่แอดมินพิมพ์ในชีต) · วันที่ไม่มีจริง เช่น 31/2 → ''
function parseDate_(text, today) {
  const m = String(text).match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{2,4}))?$/);
  if (!m) return '';
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  const pad = (n) => String(n).padStart(2, '0');
  let year;
  if (m[3]) {
    year = Number(m[3]);
    if (year < 100) year += year >= 60 ? 2500 : 2000; // 69 = พ.ศ. 2569, 26 = ค.ศ. 2026
    if (year > 2400) year -= 543;
    if (year < 2000 || year > 2100) return '';
  } else {
    if (!today) return '';
    year = Number(today.slice(0, 4));
    if (year + '-' + pad(month) + '-' + pad(day) < today) year += 1;
  }
  // วันที่ต้องมีจริง (31/2, 31/4 ไม่มี) — แปลงไปมาแล้วต้องได้วันเดิม
  const t = new Date(Date.UTC(year, month - 1, day));
  if (t.getUTCFullYear() !== year || t.getUTCMonth() !== month - 1 || t.getUTCDate() !== day) return '';
  return year + '-' + pad(month) + '-' + pad(day);
}

/** กด Run ครั้งเดียวหลังเพิ่มส่วน LINE เพื่อให้ Google ขออนุญาตเชื่อมต่อ LINE (UrlFetchApp) */
function authorizeLine() {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/info', { muteHttpExceptions: true });
}

// ---------- หลังบ้าน (admin.html): API สำหรับแอดมิน ----------
// ทุกคำขอส่งมาทาง doPost เป็น { admin: '<คำสั่ง>', token, ... }
// login → { ok, token, exp } · คำสั่งอื่นต้องมี token ที่ยังไม่หมดอายุ ไม่งั้นได้ { ok:false, error:'auth' }
//   list · setStatus · setBalance · setRefund · addBooking · block (ดูรายละเอียดที่แต่ละฟังก์ชัน)

const ADMIN_URL = 'https://lagooncamping.github.io/admin.html';
const ADMIN_TOKEN_DAYS = 30;  // เข้าสู่ระบบครั้งเดียว ใช้ได้ 30 วัน
const ADMIN_MAX_FAILS = 10;   // ใส่ PIN ผิดรวมกันเกินนี้ใน 1 ชั่วโมง = ล็อกการเข้าสู่ระบบ
const ADMIN_MAX_NIGHTS = 90;  // แอดมินจอง/ปิดบ้านได้ยาวสุดกี่คืน
const ADMIN_PAID = { none: 'ยังไม่ชำระ', deposit: PAY_TYPES.deposit, full: PAY_TYPES.full };

function adminApi_(d) {
  const pin = String(props_().getProperty('ADMIN_PIN') || '').trim();
  if (pin.length < 6) return { ok: false, error: 'not_configured' };
  if (d.admin === 'login') return adminLogin_(d, pin);
  if (!adminTokenOk_(d.token, pin)) return { ok: false, error: 'auth' };
  switch (d.admin) {
    case 'list': return adminList_();
    case 'setStatus': return adminSetStatus_(d);
    case 'setBalance': return adminSetBalance_(d);
    case 'setRefund': return adminSetRefund_(d);
    case 'addBooking': return adminAdd_(d, false);
    case 'block': return adminAdd_(d, true);
    default: return { ok: false, error: 'bad_request' };
  }
}

// เทียบข้อความแบบใช้เวลาเท่ากันเสมอ (ไม่หยุดตั้งแต่ตัวแรกที่ต่าง)
function sameText_(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// token = เวลาหมดอายุ + ลายเซ็น (คำนวณจาก PIN) ไม่ต้องเก็บไว้ที่ไหน · เปลี่ยน PIN = token เก่าใช้ไม่ได้ทั้งหมด
function adminSign_(exp, pin) {
  const sig = Utilities.computeHmacSha256Signature(String(exp), pin + ':lagoon-admin');
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
}

function adminTokenOk_(token, pin) {
  const m = String(token || '').match(/^(\d{10,16})\.([A-Za-z0-9_-]+)$/);
  if (!m) return false;
  const exp = Number(m[1]);
  const now = Date.now();
  if (exp <= now || exp > now + (ADMIN_TOKEN_DAYS + 1) * 86400000) return false;
  return sameText_(m[2], adminSign_(m[1], pin));
}

function adminLogin_(d, pin) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('admin_fail')) || 0;
  if (fails >= ADMIN_MAX_FAILS) return { ok: false, error: 'locked' };
  if (!sameText_(String(d.pin == null ? '' : d.pin).trim(), pin)) {
    cache.put('admin_fail', String(fails + 1), 3600); // นับรวมทุกคน (Apps Script ไม่รู้ IP คนส่ง)
    return { ok: false, error: fails + 1 >= ADMIN_MAX_FAILS ? 'locked' : 'bad_pin' };
  }
  const exp = Date.now() + ADMIN_TOKEN_DAYS * 86400000;
  return { ok: true, token: exp + '.' + adminSign_(exp, pin), exp };
}

// รหัสการจองของแถว (แถวที่แอดมินพิมพ์เองในชีตไม่มีรหัส → ROW<เลขแถว>)
function rowKey_(r, i) {
  return String(r[1] == null ? '' : r[1]).trim() || 'ROW' + (i + 2);
}

function adminValues_(sh) {
  const last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, readCols_(sh)).getValues();
}

// เขียนลงชีตแบบล็อก (กันชนกับลูกค้าที่กำลังจองจากหน้าเว็บ) แล้ว flush ก่อนปลดล็อก
function adminLocked_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn(sheet_());
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }
}

// บ้านไหนในรายการ houses ถูกจอง (ที่ยังมีผล) ซ้อนช่วง from–to อยู่ (ไม่นับแถวของรหัส exceptId)
function adminTaken_(values, houses, from, to, exceptId) {
  const today = todayISO_();
  const now = nowText_();
  return houses.filter((h) => values.some((r, i) => {
    if (exceptId && rowKey_(r, i) === exceptId) return false;
    const status = r[COL.status - 1];
    const end = iso_(r[COL.checkout - 1]);
    return (houseId_(r[COL.house - 1]) || houseId_(r[3])) === h
      && iso_(r[COL.checkin - 1]) < to && end > from && end > today
      && status !== STATUS.CANCELLED && status !== STATUS.EXPIRED && !isExpired_(status, r[COL.deadline - 1], now);
  }));
}

// แถวทั้งหมดของรหัสการจองนี้ (เลขแถวในชีต)
function adminRows_(values, id) {
  const rows = [];
  values.forEach((r, i) => { if (rowKey_(r, i) === id) rows.push(i + 2); });
  return rows;
}

/** list: การจองทั้งหมดที่เช็กเอาต์ไม่เกิน 60 วันที่แล้ว + ที่จะมาถึง รวมแถวของรหัสเดียวกัน */
function adminList_() {
  const today = todayISO_();
  const now = nowText_();
  const since = addDaysISO_(today, -60);
  const groups = {};
  const order = [];
  adminValues_(sheet_()).forEach((r, i) => {
    const id = rowKey_(r, i);
    const hid = houseId_(r[COL.house - 1]) || houseId_(r[3]);
    let g = groups[id];
    if (!g) {
      const checkin = iso_(r[COL.checkin - 1]);
      const checkout = iso_(r[COL.checkout - 1]);
      const status = isExpired_(r[COL.status - 1], r[COL.deadline - 1], now) ? STATUS.EXPIRED : String(r[COL.status - 1] || '');
      const isISO = /^\d{4}-\d{2}-\d{2}$/.test(checkin) && /^\d{4}-\d{2}-\d{2}$/.test(checkout);
      g = groups[id] = {
        id, rows: [], houses: [], houseNames: [], checkin, checkout,
        nights: isISO ? nights_(checkin, checkout) : Number(r[6]) || 0,
        guests: Number(r[7]) || 0, name: String(r[8] || ''), phone: String(r[9] || ''), note: String(r[10] || ''),
        total: Number(r[11]) || 0, status, due: Number(r[13]) || 0, deadline: stamp_(r[COL.deadline - 1]),
        payType: String(r[15] || ''), balance: String(r[COL.balance - 1] || ''), refund: String(r[COL.refund - 1] || ''),
        tent: Number(r[18]) || 0, rent: Number(r[19]) || 0, createdAt: stamp_(r[0]), blocked: /^BLK/.test(id),
        lineLinked: String(r[COL.line - 1] || '').trim() !== '', // ลูกค้าทัก LINE พร้อมเลขการจองแล้ว (ไม่ส่ง userId)
        source: otaSourceOf_(r, id), // '' = เว็บ/หลังบ้าน · airbnb / agoda = ซิงก์มา (หลังบ้านแก้ไม่ได้)
        show: !isISO || checkout >= since,
      };
      order.push(id);
    }
    g.rows.push(i + 2);
    if (hid === TENT_ROW.id) return; // แถวจองเฉพาะเต็นท์
    g.houses.push(isHouse_(hid) ? hid : String(r[3] || r[COL.house - 1] || ''));
    g.houseNames.push(isHouse_(hid) ? HOUSES[hid].name : String(r[3] || r[COL.house - 1] || ''));
  });
  const bookings = order.map((id) => groups[id]).filter((g) => g.show)
    .sort((a, b) => (a.checkin < b.checkin ? -1 : a.checkin > b.checkin ? 1 : 0));
  bookings.forEach((g) => delete g.show);
  return { ok: true, today, now, houses: HOUSES, tentPrice: TENT_PRICE, tentRent: TENT_RENT, depositRate: DEPOSIT_RATE, bookings };
}

// รับได้ทั้งชื่อย่อ (CONFIRMED) และคำไทย (ยืนยันแล้ว)
function pick_(map, keys, v) {
  const s = String(v == null ? '' : v);
  const key = keys.find((k) => k === s || map[k] === s);
  return key ? map[key] : '';
}

/** setStatus { id, status: CONFIRMED | CANCELLED | PENDING } → ทุกแถวของการจองนี้ */
function adminSetStatus_(d) {
  const status = pick_(STATUS, ['CONFIRMED', 'CANCELLED', 'PENDING'], d.status);
  if (!status) return { ok: false, error: 'bad_status' };
  const id = String(d.id || '');
  if (OTA_ID.test(id)) return { ok: false, error: 'ota_readonly' }; // แถวจาก Airbnb/Agoda: ปฏิทินของ OTA เป็นตัวกำหนด
  let lineUser = ''; // ยืนยันจาก รอชำระ/หมดเวลา + ลูกค้าเคยทัก LINE พร้อมเลขการจอง → ส่งใบยืนยันให้หลังปลดล็อก
  const out = adminLocked_((sh) => {
    const values = adminValues_(sh);
    const rows = adminRows_(values, id);
    if (!rows.length) return { ok: false, error: 'not_found' };
    const r = values[rows[0] - 2];
    if (status !== STATUS.CANCELLED) {
      // เปิดการจองกลับมา (เช่น เคยยกเลิก/หมดเวลา) แต่มีคนอื่นจองบ้านนั้นไปแล้ว → ไม่ให้ทำ
      const houses = rows.map((n) => houseId_(values[n - 2][COL.house - 1]) || houseId_(values[n - 2][3])).filter(isHouse_);
      const taken = adminTaken_(values, houses, iso_(r[COL.checkin - 1]), iso_(r[COL.checkout - 1]), id);
      if (taken.length) return { ok: false, error: 'booked', houses: taken };
    }
    const before = String(r[COL.status - 1] || '').trim();
    if (status === STATUS.CONFIRMED && (before === STATUS.PENDING || before === STATUS.EXPIRED) && !/^BLK/.test(id)) {
      lineUser = rows.map((n) => String(values[n - 2][COL.line - 1] || '').trim()).find(Boolean) || '';
    }
    rows.forEach((n) => sh.getRange(n, COL.status).setValue(status));
    return { ok: true, id, status };
  });
  if (!out.ok) return out;
  out.pushed = lineUser ? pushVoucher_(id, lineUser) : false;
  return out;
}

// ส่งใบยืนยันการจองเข้า LINE ลูกค้า 1 ข้อความ (push นับโควตา) · ส่งไม่ได้ = false ไม่กระทบการยืนยัน
function pushVoucher_(id, userId) {
  try {
    if (!/^U[0-9a-f]{32}$/i.test(userId) || !props_().getProperty('LINE_TOKEN')) return false;
    const rows = adminValues_(sheet_()).filter((r, i) => rowKey_(r, i) === id);
    const b = rows.length ? voucherOf_(rows, nowText_()) : null;
    if (!b) return false;
    const text = 'ยืนยันการจองแล้ว ✅\n\n' + voucherText_(b, false);
    lineApi_('/v2/bot/message/push', { to: userId, messages: [{ type: 'text', text: text.slice(0, 4900) }] });
    return true;
  } catch (err) {
    console.error('ส่งใบยืนยันเข้า LINE ลูกค้าไม่สำเร็จ (' + id + ')'); // ไม่ log ข้อความ/รหัสผู้ใช้
    return false;
  }
}

/** setBalance { id, value: ยังไม่ชำระ | เงินสด | โอนหน้าเคาน์เตอร์ } (หรือ UNPAID | CASH | TRANSFER) */
function adminSetBalance_(d) {
  const value = pick_(BALANCE, Object.keys(BALANCE), d.value);
  if (!value) return { ok: false, error: 'bad_value' };
  return adminSetCol_(d.id, COL.balance, value);
}

/** setRefund { id, done: true/false } */
function adminSetRefund_(d) {
  return adminSetCol_(d.id, COL.refund, d.done === true ? REFUND.DONE : '');
}

function adminSetCol_(id, col, value) {
  id = String(id || '');
  if (OTA_ID.test(id)) return { ok: false, error: 'ota_readonly' };
  return adminLocked_((sh) => {
    const rows = adminRows_(adminValues_(sh), id);
    if (!rows.length) return { ok: false, error: 'not_found' };
    rows.forEach((n) => sh.getRange(n, col).setValue(value));
    return { ok: true, id, value };
  });
}

/** addBooking (block=false): จองทางโทรศัพท์/LINE/walk-in → ยืนยันแล้วทันที ไม่ส่ง LINE (ประหยัดโควตา 200 ข้อความ/เดือน)
 *    { houses[], checkin, checkout, guests, name, phone, note, tentGuests, tentRentals, total?, paid: none|deposit|full }
 *  block (block=true): ปิดบ้าน (ซ่อม/ไม่รับจอง) { houses[], from, to, reason } — เปิดคืน = setStatus CANCELLED */
function adminAdd_(d, block) {
  const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const houses = Array.isArray(d.houses) ? [...new Set(d.houses.map(String))] : [];
  if (houses.some((h) => !isHouse_(h))) return { ok: false, error: 'bad_house' };
  const checkin = block ? d.from : d.checkin;
  const checkout = block ? d.to : d.checkout;
  // วันนี้/ย้อนหลังได้ (แขก walk-in) แต่วันออกต้องหลังวันนี้
  if (!isDate(checkin) || !isDate(checkout) || checkout <= checkin || checkout <= todayISO_()) return { ok: false, error: 'bad_dates' };
  const nights = nights_(checkin, checkout);
  if (!(nights > 0)) return { ok: false, error: 'bad_dates' };
  if (nights > ADMIN_MAX_NIGHTS) return { ok: false, error: 'too_long' };

  let tent = 0;
  let rent = 0;
  let guests = 0;
  let name = 'ปิดบ้าน';
  let phone = '';
  let note;
  let total = 0;
  let paid = 'none';
  if (block) {
    if (!houses.length) return { ok: false, error: 'bad_house' };
    note = String(d.reason == null ? '' : d.reason).trim();
    if (note.length > 200) return { ok: false, error: 'bad_note' };
  } else {
    tent = Number(d.tentGuests || 0);
    rent = Number(d.tentRentals || 0);
    if (!(Number.isInteger(tent) && tent >= 0 && tent <= 30)) return { ok: false, error: 'bad_tent' };
    if (!(Number.isInteger(rent) && rent >= 0 && rent <= 10)) return { ok: false, error: 'bad_tent' };
    if (!houses.length && !tent && !rent) return { ok: false, error: 'bad_house' };
    guests = Number(d.guests || 0);
    if (!(Number.isInteger(guests) && guests >= 0 && guests <= 30)) return { ok: false, error: 'bad_guests' };
    name = String(d.name == null ? '' : d.name).trim();
    if (!name || name.length > 100) return { ok: false, error: 'bad_name' };
    phone = String(d.phone == null ? '' : d.phone).trim();
    if (phone.length > 30) return { ok: false, error: 'bad_phone' };
    note = String(d.note == null ? '' : d.note).trim();
    if (note.length > 500) return { ok: false, error: 'bad_note' };
    note = note ? '[แอดมิน] ' + note : '[แอดมิน]';
    paid = Object.prototype.hasOwnProperty.call(ADMIN_PAID, d.paid) ? d.paid : 'none';
    if (d.total !== undefined && d.total !== null && d.total !== '') {
      total = Number(d.total);
      if (!(Number.isInteger(total) && total >= 0 && total <= 10000000)) return { ok: false, error: 'bad_total' };
    } else {
      total = (houses.reduce((sum, h) => sum + HOUSES[h].price, 0) + tent * TENT_PRICE + rent * TENT_RENT) * nights;
    }
  }
  // ยอดที่จ่ายมาแล้ว: ยังไม่จ่าย = 0 · มัดจำ = 50% · จ่ายครบ = ยอดรวม
  const due = block || paid === 'none' ? 0 : paid === 'full' ? total : Math.ceil(total * DEPOSIT_RATE);

  const out = adminLocked_((sh) => {
    const values = adminValues_(sh);
    const taken = adminTaken_(values, houses, checkin, checkout, '');
    if (taken.length) return { ok: false, error: 'booked', houses: taken };

    const now = new Date();
    const ids = new Set(values.map((r, i) => rowKey_(r, i)));
    let id;
    do {
      id = (block ? 'BLK' : 'LG') + Utilities.formatDate(now, TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    } while (ids.has(id));
    const items = houses.length ? houses.map((h) => ({ id: h, name: HOUSES[h].name })) : [TENT_ROW];
    const rows = items.map((h) => [
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm'), id, h.id, h.name, checkin, checkout, nights,
      guests, safe_(name), safe_(phone), safe_(note), total, STATUS.CONFIRMED, due, '',
      block ? '' : ADMIN_PAID[paid], !block && paid !== 'full' ? BALANCE.UNPAID : '', '', tent || '', rent || '',
    ]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return { ok: true, id, total, due };
  });
  // บ้านนี้ขายใน Airbnb/Agoda ด้วย → เตือนแอดมินให้ปิดวันในแอป 1 ข้อความ (หลังปลดล็อก · บ้านไม่ได้ขาย OTA = ไม่ส่ง)
  if (out.ok) {
    const ota = otaReminder_(houses, checkin, checkout, block ? 'block' : 'admin');
    if (ota) linePush_(adminIds_(), ota + '\nรหัส ' + out.id);
  }
  return out;
}

// ---------- ลูกค้าเช็กการจองของตัวเอง (หน้า my-booking.html) ----------
// ส่งมาทาง doPost เป็น { lookup: 'phone', phone: '081-234-5678' }
// → { ok:true, bookings:[...] } (ไม่พบ = รายการว่าง) · { ok:false, error: 'bad_phone' | 'busy' | 'server' }
// ส่งกลับเฉพาะข้อมูลที่ใช้โชว์ใบยืนยันการจอง: ไม่ส่งเบอร์โทร ชื่อเต็ม หมายเหตุ เลขแถว หรือเวลาที่จอง
// กันคนสุ่มเบอร์มาดู: ต่อเบอร์ไม่เกิน 10 ครั้ง/10 นาที · รวมทุกคนไม่เกิน 200 ครั้ง/10 นาที (นับรวมเบอร์ผิดรูปแบบด้วย)

const LOOKUP_MAX_PHONE = 10;   // ค้นหาเบอร์เดียวกันได้กี่ครั้ง ต่อ 10 นาที
const LOOKUP_MAX_ALL = 200;    // ค้นหารวมทุกเบอร์ได้กี่ครั้ง ต่อ 10 นาที
const LOOKUP_WINDOW = 600;     // 10 นาที (วินาที)
const LOOKUP_PAST_DAYS = 30;   // โชว์การจองที่เช็กเอาต์ไปแล้วไม่เกิน 30 วัน
const LOOKUP_MAX_RESULTS = 10;

// เบอร์ที่ลูกค้าพิมพ์ → 0XXXXXXXX (9 หลัก บ้าน) หรือ 0XXXXXXXXX (10 หลัก มือถือ) · ไม่ใช่เบอร์ไทย = ''
// ต้องตรงกับ normPhone ใน js/my-booking.js
function normPhone_(v) {
  if (v == null || typeof v === 'object') return '';
  let s = String(v).replace(/\D/g, '');
  if (/^660\d{8,9}$/.test(s)) s = s.slice(2);            // +66 081... (ใส่ 0 ซ้ำ)
  else if (/^66\d{8,9}$/.test(s)) s = '0' + s.slice(2);   // +66812345678 / 66 81 234 5678
  return /^0\d{8,9}$/.test(s) ? s : '';
}

// เลขสำหรับเทียบเบอร์ในชีต: ตัดทุกอย่างที่ไม่ใช่ตัวเลข แปลง 66 นำหน้าเป็น 0 ตัด 0 นำหน้า แล้วเอา 9 หลักท้าย
// (ชีตอาจเก็บเป็นตัวเลขจน 0 หาย เช่น 812345678 · มีขีด/เว้นวรรค · มี ' นำหน้าจาก safe_)
function phoneKey_(v) {
  let s = String(v == null ? '' : v).replace(/\D/g, '');
  if (/^66\d{8,9}$/.test(s)) s = s.slice(2);
  s = s.replace(/^0+/, '');
  return s.length >= 8 ? s.slice(-9) : '';
}

// ช่องเบอร์ในชีตอาจมีหลายเบอร์ เช่น "081-111-2222, 089-333-4444" → เทียบทีละเบอร์
function phoneMatches_(cell, key) {
  if (cell === '' || cell == null) return false;
  if (typeof cell === 'number') return phoneKey_(cell) === key;
  return String(cell).split(/[,/;\n]|และ|หรือ/).some((part) => phoneKey_(part) === key);
}

// ชื่อลูกค้าแบบปิดบัง: 2 ตัวแรก + *** (สระบน/ล่าง/วรรณยุกต์ติดไปกับตัวอักษรหน้า ไม่ตัดกลางตัว)
function maskName_(v) {
  let s = String(v == null ? '' : v).trim().replace(/^'+/, '').trim();
  const noTitle = s.replace(/^(คุณ|คุน|k\.|khun)\s*/i, '');
  if (noTitle) s = noTitle;
  if (!s) return '';
  const mark = /[ัิ-ฺ็-๎̀-ͯ️‍]/;
  const out = [];
  for (const ch of Array.from(s)) {
    if (mark.test(ch) && out.length) out[out.length - 1] += ch;
    else if (out.length < 2) out.push(ch);
    else break;
  }
  return out.join('') + '***';
}

// นับครั้งใน CacheService (หมดอายุ 10 นาทีหลังครั้งล่าสุด) · เกินแล้ว = true
function overLimit_(cache, key, max) {
  const n = Number(cache.get(key)) || 0;
  if (n >= max) return true;
  cache.put(key, String(n + 1), LOOKUP_WINDOW);
  return false;
}

function lookupByPhone_(input) {
  const cache = CacheService.getScriptCache();
  if (overLimit_(cache, 'lookup_all', LOOKUP_MAX_ALL)) return { ok: false, error: 'busy' };
  const phone = normPhone_(input);
  if (!phone) return { ok: false, error: 'bad_phone' };
  if (overLimit_(cache, 'lookup_' + phone, LOOKUP_MAX_PHONE)) return { ok: false, error: 'busy' };

  const key = phoneKey_(phone);
  const today = todayISO_();
  const now = nowText_();
  const since = addDaysISO_(today, -LOOKUP_PAST_DAYS);
  const groups = {};
  const order = [];
  adminValues_(sheet_()).forEach((r, i) => {
    const id = rowKey_(r, i);
    let g = groups[id];
    if (!g) {
      g = groups[id] = { id, rows: [], match: false };
      order.push(id);
    }
    g.rows.push(r);
    if (phoneMatches_(r[9], key)) g.match = true;
  });

  const list = [];
  order.forEach((id) => {
    const g = groups[id];
    if (!g.match || /^BLK/.test(id)) return; // ปิดบ้าน (ซ่อม/ไม่รับจอง) ไม่ใช่การจองของลูกค้า
    const b = voucherOf_(g.rows, now);
    if (!b || b.checkout < since) return;
    // ลำดับ: กำลังจะมาถึง/กำลังพัก (ใกล้สุดก่อน) → ที่ยกเลิก/หมดเวลา → ที่ผ่านไปแล้ว (ล่าสุดก่อน)
    const closed = b.status === STATUS.CANCELLED || b.status === STATUS.EXPIRED;
    list.push({ b, rank: b.checkout < today ? 2 : closed ? 1 : 0 });
  });
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  list.sort((x, y) => x.rank - y.rank || (x.rank === 2 ? cmp(y.b.checkin, x.b.checkin) : cmp(x.b.checkin, y.b.checkin)));
  return { ok: true, bookings: list.slice(0, LOOKUP_MAX_RESULTS).map((x) => x.b) };
}

// ข้อมูลใบยืนยันการจองจากแถวทั้งหมดของรหัสเดียวกัน (ใช้ทั้งหน้าเว็บและ LINE)
// ส่งเฉพาะช่องที่ลูกค้าเห็นได้ · วันที่อ่านไม่ออก = null
function voucherOf_(rows, now) {
  const r = rows[0];
  const checkin = iso_(r[COL.checkin - 1]);
  const checkout = iso_(r[COL.checkout - 1]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin) || !/^\d{4}-\d{2}-\d{2}$/.test(checkout)) return null;

  const rawStatus = String(r[COL.status - 1] || '').trim();
  const status = isExpired_(rawStatus, r[COL.deadline - 1], now) ? STATUS.EXPIRED : rawStatus;
  const total = Number(r[11]) || 0;
  const due = Number(r[13]) || 0;
  const payTypeText = String(r[15] || '').trim();
  const payType = payTypeText === PAY_TYPES.full ? 'full' : payTypeText === PAY_TYPES.deposit ? 'deposit' : 'none';
  const balance = String(r[COL.balance - 1] || '').trim();
  const confirmed = status === STATUS.CONFIRMED;
  const pending = status === STATUS.PENDING;
  const closed = status === STATUS.CANCELLED || status === STATUS.EXPIRED;
  const paid = confirmed && payType !== 'none' ? due : 0;
  let balanceDue = 0;
  if (!closed && balance !== BALANCE.CASH && balance !== BALANCE.TRANSFER && !(confirmed && payType === 'full')) {
    balanceDue = Math.max(0, total - (pending ? due : paid)); // รอชำระ: ส่วนที่เหลือหลังโอนยอดที่ต้องชำระตอนนี้
  }

  const houses = [];
  rows.forEach((row) => {
    const hid = houseId_(row[COL.house - 1]) || houseId_(row[3]);
    if (hid === TENT_ROW.id) return;
    const name = isHouse_(hid) ? HOUSES[hid].name : String(row[3] || row[COL.house - 1] || '').trim();
    if (name && !houses.includes(name)) houses.push(name);
  });
  const tent = Number(r[18]) || 0;
  const rent = Number(r[19]) || 0;
  const items = houses.slice();
  if (tent) items.push('นำเต็นท์มาเอง ' + tent + ' ท่าน');
  if (rent) items.push('เช่าเต็นท์ ' + rent + ' หลัง');
  if (!items.length) items.push(TENT_ROW.name);

  const b = {
    id: String(r[1] == null ? '' : r[1]).trim(), // แถวที่พิมพ์เองในชีตไม่มีรหัส = '' (ไม่ส่งเลขแถว)
    items, checkin, checkout, nights: nights_(checkin, checkout),
    people: { guests: Number(r[7]) || 0, tentGuests: tent, tentRentals: rent },
    total, payType, paid, balanceDue, status,
    nameMasked: maskName_(r[8]),
  };
  if (pending) {
    b.deadline = stamp_(r[COL.deadline - 1]);
    b.payNow = due;
  }
  if (status === STATUS.CANCELLED && payType === 'full') {
    b.refund = String(r[COL.refund - 1] || '').trim() === REFUND.DONE ? 'done' : 'pending';
    b.refundAmount = Math.floor(total / 2);
  }
  return b;
}

// ---------- LINE: ลูกค้าส่งเลขการจองมา → ตอบใบยืนยันการจอง ----------
// ลูกค้า (ไม่ใช่แอดมิน) ส่งข้อความที่มีเลขการจอง เช่น ข้อความ "ส่งสลิปการจอง..." จากปุ่ม "ส่งสลิปทาง LINE"
// หรือ "เช็กการจอง LG261003-1234" → ตอบกลับ (reply ฟรี ไม่ใช้ push) ด้วยใบยืนยันการจองแบบปิดชื่อ
// ข้อความที่ไม่มีเลขการจอง = เงียบ (ให้ข้อความตอบกลับอัตโนมัติของ LINE OA ทำงานตามปกติ)
// กันสุ่มเลข: ต่อคนไม่เกิน 10 ครั้ง/10 นาที · รวมทุกคน 100 ครั้ง/10 นาที เกินแล้วเงียบ · ไม่บันทึกข้อความลูกค้าลง log
const LINE_LOOKUP_MAX_USER = 10;
const LINE_LOOKUP_MAX_ALL = 100;
const SITE_URL = 'https://lagooncamping.github.io';
const MAP_URL = 'https://goo.gl/maps/8mGhpGAEaRzAJNGq6';
const PROMPTPAY_TEXT = '090-936-5562'; // ต้องตรงกับ PROMPTPAY ใน js/booking.js
const CHECK_TIMES = 'เช็กอินได้ตั้งแต่ 11:00 น. และเช็กเอาต์ก่อน 12:00 น.'; // ต้องตรงกับ stay.html

// เลขการจองในข้อความ (LG + ปีเดือนวัน 6 หลัก + ขีด + 4 หลัก) ไม่มี = ''
function bookingIdIn_(text) {
  const m = String(text || '').match(/LG\d{6}-\d{4}/i);
  return m ? m[0].toUpperCase() : '';
}

// ตอบเลขการจองทาง LINE · แอดมินไม่จำกัดจำนวนครั้ง
function lineVoucherReply_(ev, user, text, id, isAdmin) {
  if (!isAdmin) {
    const cache = CacheService.getScriptCache();
    if (overLimit_(cache, 'line_lookup_all', LINE_LOOKUP_MAX_ALL)) return;
    if (overLimit_(cache, 'line_lookup_' + user, LINE_LOOKUP_MAX_USER)) return;
  }
  const rows = adminValues_(sheet_()).filter((r) => String(r[1] == null ? '' : r[1]).trim().toUpperCase() === id);
  const b = rows.length ? voucherOf_(rows, nowText_()) : null;
  if (!b) {
    lineReply_(ev.replyToken, 'ไม่พบเลขการจองนี้ กรุณาตรวจเลขอีกครั้ง หรือรอแอดมินตอบกลับ');
    return;
  }
  if (!isAdmin && (b.status === STATUS.PENDING || b.status === STATUS.CONFIRMED)) {
    try {
      linkLine_(id, user);
    } catch (err) {
      console.error('จำ LINE ลูกค้าไม่สำเร็จ'); // ไม่ log ข้อความ/รหัสผู้ใช้ · ยังตอบใบยืนยันตามปกติ
    }
  }
  lineReply_(ev.replyToken, voucherText_(b, /สลิป/.test(text)));
}

// ลูกค้าส่งรูปมา (มักเป็นสลิป): ผูก LINE ไว้กับการจองที่รอชำระ → "ได้รับสลิปแล้ว (รหัส ...)"
// ไม่ได้ผูก → ขอให้พิมพ์รหัสการจองมาด้วย · ตอบได้ 1 ครั้ง/คน/10 นาที (ลูกค้ามักส่งหลายรูป)
// ไม่ดาวน์โหลด/ไม่เก็บรูป · ใช้ reply (ฟรี) ไม่ใช้ push · ไม่แจ้งแอดมิน (แอดมินเห็นในแชตอยู่แล้ว)
const LINE_IMAGE_ACK_ALL = 300; // ตอบรูปรวมทุกคนไม่เกินนี้ ต่อ 10 นาที (กันอ่านชีตถี่เกิน)
function lineImageAck_(ev, user) {
  const cache = CacheService.getScriptCache();
  const key = 'line_img_' + user;
  if (cache.get(key)) return;
  if (overLimit_(cache, 'line_img_all', LINE_IMAGE_ACK_ALL)) return;
  cache.put(key, '1', LOOKUP_WINDOW);
  const now = nowText_();
  const ids = [];
  adminValues_(sheet_()).forEach((r) => {
    const id = String(r[1] == null ? '' : r[1]).trim();
    if (!id || /^BLK/.test(id) || ids.includes(id) || String(r[COL.line - 1] || '').trim() !== user) return;
    const status = String(r[COL.status - 1] || '').trim();
    if (status === STATUS.PENDING && !isExpired_(status, r[COL.deadline - 1], now)) ids.push(id);
  });
  lineReply_(ev.replyToken, ids.length
    ? 'ได้รับสลิปแล้ว ✅ (รหัสการจอง ' + ids.join(', ') + ')\nแอดมินจะตรวจยอดและยืนยันให้เร็วที่สุด เมื่อยืนยันแล้วจะส่งใบยืนยันการจองมาที่แชตนี้'
    : 'ได้รับรูปแล้ว 🙏 ถ้าเป็นสลิปโอนเงิน กรุณาพิมพ์รหัสการจอง (เช่น LG261003-1234) มาด้วย แอดมินจะตรวจให้');
}

// จำ LINE userId ของลูกค้าไว้ในคอลัมน์ 'LINE ลูกค้า' ทุกแถวของการจองนี้ (ใช้ส่งใบยืนยันตอนแอดมินกดยืนยัน)
// คนแรกที่ส่งเลขการจองมาเป็นเจ้าของ — มีคนอื่นจำไว้แล้วไม่เขียนทับ · ไม่จำการปิดบ้าน (BLK)
function linkLine_(id, user) {
  if (/^BLK/.test(id) || !/^U[0-9a-f]{32}$/i.test(user)) return false;
  return adminLocked_((sh) => {
    ensureCols_(sh, COL.line);
    const values = adminValues_(sh);
    const rows = [];
    values.forEach((r, i) => { if (String(r[1] == null ? '' : r[1]).trim().toUpperCase() === id) rows.push(i + 2); });
    if (!rows.length) return false;
    const current = rows.map((n) => String(values[n - 2][COL.line - 1] || '').trim()).find(Boolean);
    if (current) return current === user;
    rows.forEach((n) => sh.getRange(n, COL.line).setValue(user));
    return true;
  });
}

// ใบยืนยันการจองแบบข้อความ (LINE รับได้ 5000 ตัวอักษร — lineReply_ ตัดที่ 4900 อยู่แล้ว)
function voucherText_(b, slipSent) {
  const baht = (n) => Number(n).toLocaleString('en-US') + ' บาท';
  const active = b.status === STATUS.CONFIRMED || b.status === STATUS.PENDING;
  const labels = {};
  labels[STATUS.CONFIRMED] = '✅ ยืนยันแล้ว';
  labels[STATUS.PENDING] = '⏳ รอชำระเงิน';
  labels[STATUS.CANCELLED] = '❌ ยกเลิก';
  labels[STATUS.EXPIRED] = '⌛ หมดเวลาชำระ (การจองถูกยกเลิกอัตโนมัติ)';
  const p = b.people;
  const people = [
    p.guests ? p.guests + ' ท่านในบ้าน' : '',
    p.tentGuests ? 'เต็นท์มาเอง ' + p.tentGuests + ' ท่าน' : '',
    p.tentRentals ? 'เช่าเต็นท์ ' + p.tentRentals + ' หลัง (2 ท่าน/หลัง)' : '',
  ].filter(Boolean).join(' · ');
  const lines = ['📋 ใบยืนยันการจอง The Lagoon', 'รหัส ' + b.id, labels[b.status] || 'ℹ️ ' + (b.status || 'รอแอดมินตรวจสอบ')];
  if (b.status === STATUS.PENDING) {
    if (slipSent) lines.push('ได้รับข้อความแล้ว แอดมินจะตรวจสลิปและยืนยันให้เร็วที่สุด');
    if (b.payNow) lines.push('💳 ' + (b.payType === 'full' ? 'ยอดชำระเต็มจำนวน ' : 'ยอดมัดจำ ') + baht(b.payNow) + ' · พร้อมเพย์ ' + PROMPTPAY_TEXT);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(b.deadline || '')) {
      lines.push('⏰ ชำระภายใน ' + thaiDate_(b.deadline.slice(0, 10), true) + ' เวลา ' + b.deadline.slice(11) + ' น.');
    }
  }
  lines.push('');
  if (b.nameMasked) lines.push('👤 ' + b.nameMasked);
  lines.push('🏠 ' + b.items.join(', '));
  lines.push('📅 ' + thaiRange_(b.checkin, b.checkout));
  if (people) lines.push('👥 ' + people);
  if (b.total) lines.push('💰 ยอดรวม ' + baht(b.total) + (b.paid ? ' · ชำระแล้ว ' + baht(b.paid) : ''));
  if (b.balanceDue) lines.push('💵 ชำระวันเช็กอิน ' + baht(b.balanceDue) + ' (เงินสดหรือโอนหน้าเคาน์เตอร์)');
  if (b.refund === 'done') lines.push('↩️ คืนเงิน 50% แล้ว (' + baht(b.refundAmount) + ')');
  else if (b.refund) lines.push('↩️ ถ้าชำระเต็มจำนวนแล้ว จะได้รับเงินคืน 50% (' + baht(b.refundAmount) + ') แอดมินจะโอนคืนให้');
  if (active) {
    lines.push('🕚 ' + CHECK_TIMES);
    lines.push('📍 แผนที่ ' + MAP_URL);
    lines.push('');
    lines.push('แสดงข้อความนี้กับเจ้าหน้าที่ตอนเช็กอิน');
  }
  lines.push('ดูใบยืนยันการจอง: ' + SITE_URL + '/my-booking.html');
  return lines.join('\n');
}

// ---------- OTA: ซิงก์ปฏิทินกับ Airbnb / Agoda (iCal) ----------
// ยังไม่ตั้ง Script property OTA_ICAL (นำเข้า) / ICS_KEY (ส่งออก) = ส่วนนี้ไม่ทำอะไรเลย · วิธีเปิดใช้ดูหัวไฟล์
// Script properties:
//   OTA_ICAL    = (เจ้าของตั้ง) ลิงก์ปฏิทินของ OTA ต่อบ้าน {"lagoon-1":{"airbnb":"https://...","agoda":"https://..."}}
//   ICS_KEY     = (setupOta สร้างให้) รหัสลับในลิงก์ส่งออก — ไม่ตรง = ตอบ "not found"
//   OTA_LAST    = (ระบบเขียนเอง) ผลซิงก์ล่าสุดของแต่ละปฏิทิน ดูด้วย otaStatus()
//   OTA_ALERTED = (ระบบเขียนเอง) การแจ้งเตือน "จองชนกัน" ที่ส่งไปแล้ว (กันส่งซ้ำ)
// แถวที่ซิงก์มา: รหัส EXT-AIRBNB-xxxxxxxx / EXT-AGODA-xxxxxxxx · สถานะ ยืนยันแล้ว · ยอด 0 · ช่อง 'ที่มา' = airbnb/agoda
//   เป็นแถวธรรมดา → หน้าเว็บ/หลังบ้านเห็นว่าบ้านไม่ว่างเอง · ปฏิทินของ OTA เป็นตัวกำหนด (หลังบ้านแก้/ยกเลิกไม่ได้)
//   OTA ลบการจองออก → แถวเปลี่ยนเป็น "ยกเลิก" เอง (เฉพาะตอนดึงปฏิทินนั้นสำเร็จ ดึงไม่ได้ = ไม่แตะแถวเดิม)

// ลิงก์ Web app (/exec) — ต้องตรงกับ API_URL ใน js/booking.js (ใช้ตอน setupOta หา URL เองไม่ได้)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyCUEb3YTKm6_LoUal5cvBmZZR_-fhcYULSRiH2WDNnSgPOlHGDjqgYY8-Y7ID8rUvWVg/exec';
const OTA_SOURCES = { airbnb: 'Airbnb', agoda: 'Agoda' };
const OTA_ID = /^EXT-/;                 // รหัสการจองที่ซิงก์มาจาก OTA
const OTA_BLOCK_NAME = /\(ปิดวัน\)$/;   // ชื่อในชีตของ "ปิดวัน" จาก OTA (ไม่ใช่แขก)
const OTA_BLOCK_SUMMARY = /not available|unavailable|blocked|closed/i; // SUMMARY แบบปิดวัน เช่น "Airbnb (Not available)"
const OTA_MAX_DAYS = 730;               // นำเข้าเฉพาะการจองภายใน 2 ปี

/** กด Run ครั้งเดียวตอนเปิดใช้ (รันซ้ำได้): สร้าง ICS_KEY · เพิ่มคอลัมน์ 'ที่มา' · ตั้งเวลาซิงก์ · พิมพ์ลิงก์ส่งออก */
function setupOta() {
  const p = props_();
  let key = p.getProperty('ICS_KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '');
    p.setProperty('ICS_KEY', key);
  }
  ensureCols_(sheet_());
  // ซิงก์รันใน expireBookings (ทุก 15 นาที) — ยังไม่มีตัวตั้งเวลานี้ = สร้างให้ (มีแล้วไม่สร้างซ้ำ)
  if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === 'expireBookings')) {
    ScriptApp.newTrigger('expireBookings').timeBased().everyMinutes(15).create();
  }
  let url = '';
  try {
    url = ScriptApp.getService().getUrl() || '';
  } catch (err) {
    url = '';
  }
  if (!/\/exec$/.test(url)) url = WEB_APP_URL; // รันจาก editor มักได้ลิงก์ /dev (ใช้กับ OTA ไม่ได้)
  const lines = ['ลิงก์ส่งออกปฏิทิน (ห้ามโพสต์ที่สาธารณะ) — วางลิงก์ src=airbnb ใน Airbnb และ src=agoda ใน Agoda YCS', ''];
  Object.keys(HOUSES).forEach((h) => {
    const base = url + '?ics=' + h + '&k=' + key;
    lines.push(HOUSES[h].name + ' (' + h + ')');
    Object.keys(OTA_SOURCES).forEach((src) => lines.push('  ' + OTA_SOURCES[src] + ': ' + base + '&src=' + src + '&x=.ics'));
  });
  const cfg = otaConfig_();
  lines.push('', Object.keys(cfg).length
    ? 'นำเข้าจาก OTA (OTA_ICAL): ' + Object.keys(cfg).map((h) => h + ' ← ' + Object.keys(cfg[h]).map((s) => OTA_SOURCES[s]).join('+')).join(' · ')
    : 'ยังไม่ได้ตั้ง OTA_ICAL (ยังไม่ดึงปฏิทินจาก Airbnb/Agoda) — ดูขั้นตอนที่ 3 หัวไฟล์');
  Logger.log(lines.join('\n'));
}

/** กด Run เพื่อดูผลซิงก์ล่าสุดของแต่ละปฏิทิน (ไม่แสดงลิงก์ เพราะลิงก์ของ OTA มีรหัสลับ) */
function otaStatus() {
  const cfg = otaConfig_();
  const last = readJson_('OTA_LAST');
  const keys = [];
  Object.keys(cfg).forEach((h) => Object.keys(cfg[h]).forEach((s) => keys.push(h + ':' + s)));
  if (!keys.length) {
    Logger.log('ยังไม่ได้ตั้ง OTA_ICAL — ระบบซิงก์ยังไม่ทำงาน');
    return;
  }
  Logger.log(keys.map((k) => {
    const r = last[k];
    if (!r) return k + ': ยังไม่เคยซิงก์ (Run syncOtaCalendars)';
    return k + ': ' + (r.ok
      ? 'ok ' + r.at + ' · ' + r.events + ' รายการ (ใหม่ ' + r.added + ' · แก้ ' + r.updated + ' · ยกเลิก ' + r.cancelled + ')'
      : 'ผิดพลาด ' + r.at + ' · ' + r.error + (r.lastOk ? ' · สำเร็จล่าสุด ' + r.lastOk : ''));
  }).join('\n'));
}

function readJson_(name) {
  try {
    const v = JSON.parse(props_().getProperty(name) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (err) {
    return {};
  }
}

// OTA_ICAL ที่อ่านได้ (เฉพาะรหัสบ้านจริง + ลิงก์ https) · ไม่ได้ตั้ง/อ่านไม่ออก = {}
function otaConfig_() {
  const raw = props_().getProperty('OTA_ICAL');
  if (!raw) return {};
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    console.error('OTA_ICAL ไม่ใช่ JSON ที่ถูกต้อง');
    return {};
  }
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  Object.keys(obj).forEach((h) => {
    if (!isHouse_(h) || !obj[h] || typeof obj[h] !== 'object') return;
    Object.keys(OTA_SOURCES).forEach((src) => {
      const url = String(obj[h][src] || '').trim();
      if (/^https:\/\/\S+$/i.test(url)) (out[h] = out[h] || {})[src] = url;
    });
  });
  return out;
}

// แถวนี้มาจาก OTA ไหน ('' = เว็บ/หลังบ้าน/พิมพ์เอง) — ดูช่อง 'ที่มา' ก่อน ไม่มีค่อยดูจากรหัส
function otaSourceOf_(r, id) {
  const s = String(r[COL.source - 1] == null ? '' : r[COL.source - 1]).trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(OTA_SOURCES, s)) return s;
  const m = String(id || '').match(/^EXT-(AIRBNB|AGODA)-/);
  return m ? m[1].toLowerCase() : '';
}

// ข้อความเตือนแอดมิน: จอง/ปิดบ้านที่ขายใน OTA ด้วย → ปิดวันในแอป OTA (บ้านไม่ได้ขาย OTA = '')
// kind: 'web' = ลูกค้าจองในเว็บ · 'admin' = แอดมินเพิ่มการจอง · 'block' = แอดมินปิดบ้าน
function otaReminder_(houses, from, to, kind) {
  const cfg = otaConfig_();
  const linked = (houses || []).filter((h) => cfg[h]);
  if (!linked.length) return '';
  const apps = Object.keys(OTA_SOURCES).filter((s) => linked.some((h) => cfg[h][s])).map((s) => OTA_SOURCES[s]).join('/');
  const names = linked.map((h) => HOUSES[h].name).join(', ');
  const what = kind === 'block' ? 'มีการปิดบ้าน ' + names + ' ในหลังบ้าน'
    : 'มีการจองบ้าน ' + names + (kind === 'admin' ? ' ในหลังบ้าน' : ' ในเว็บ');
  return '🔔 ' + what + ' ' + thaiRange_(from, to) + ' — บ้านนี้ขายใน ' + apps + ' ด้วย กรุณาปิดวันในแอป ' + apps
    + ' (ระบบจะซิงก์เองภายใน ~3 ชม.)';
}

// ---- ส่งออก: ปฏิทินของบ้าน 1 หลัง (doGet ?ics=<รหัสบ้าน>&k=<ICS_KEY>[&src=airbnb|agoda]) ----
// มีแค่ช่วงวันที่ไม่ว่าง (SUMMARY:Reserved) ไม่มีชื่อ เบอร์ หรือข้อมูลลูกค้าเลย
// รวม: ยืนยันแล้ว + รอชำระที่ยังไม่หมดเวลา + ปิดบ้าน (BLK) + ที่ซิงก์มาจาก OTA อื่น
// src=airbnb → ไม่ส่งแถวที่มาจาก Airbnb กลับไปให้ Airbnb เอง (กันวนซ้ำ)
function icsFeed_(p) {
  const key = String(props_().getProperty('ICS_KEY') || '');
  const house = String(p.ics == null ? '' : p.ics);
  if (key.length < 16 || !isHouse_(house) || !sameText_(String(p.k == null ? '' : p.k), key)) {
    return ContentService.createTextOutput('not found');
  }
  const skip = Object.prototype.hasOwnProperty.call(OTA_SOURCES, p.src) ? p.src : '';
  const today = todayISO_();
  const now = nowText_();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); // 20261003T101500Z
  const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Lagoon Camping Resort//Booking//TH', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsText_('The Lagoon ' + HOUSES[house].name)];
  const seen = {};
  adminValues_(sheet_()).forEach((r, i) => {
    if ((houseId_(r[COL.house - 1]) || houseId_(r[3])) !== house) return;
    const status = r[COL.status - 1];
    if (status === STATUS.CANCELLED || status === STATUS.EXPIRED || isExpired_(status, r[COL.deadline - 1], now)) return;
    const from = iso_(r[COL.checkin - 1]);
    const to = iso_(r[COL.checkout - 1]);
    if (!isISO(from) || !isISO(to) || to <= from || to < today) return;
    const id = rowKey_(r, i);
    if (skip && otaSourceOf_(r, id) === skip) return;
    let uid = (id + '-' + house).replace(/[^\w-]/g, '');
    if (seen[uid]) uid += '-' + (i + 2);
    seen[uid] = true;
    lines.push('BEGIN:VEVENT', 'UID:' + uid + '@lagooncamping', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE=' + from.replace(/-/g, ''), 'DTEND;VALUE=DATE=' + to.replace(/-/g, ''),
      'SUMMARY:Reserved', 'TRANSP:OPAQUE', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return ContentService.createTextOutput(lines.map(icsFold_).join('\r\n') + '\r\n').setMimeType(ContentService.MimeType.ICAL);
}

// ข้อความใน iCal: \ ; , ขึ้นบรรทัดใหม่ ต้อง escape
function icsText_(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// บรรทัดยาวเกิน 75 ไบต์ (UTF-8) → ตัดขึ้นบรรทัดใหม่ขึ้นต้นด้วยเว้นวรรค (RFC 5545) ไม่ตัดกลางตัวอักษร
function icsFold_(line) {
  const parts = [];
  let cur = '';
  let bytes = 0;
  Array.from(line).forEach((ch) => {
    const c = ch.codePointAt(0);
    const n = c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    if (bytes + n > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  });
  parts.push(cur);
  return parts.join('\r\n ');
}

// ---- นำเข้า: ดึงปฏิทินจาก Airbnb/Agoda มาเป็นแถวในชีต ----
/** รันเองทุก 15 นาทีใน expireBookings · กด Run เองได้ (ยังไม่ตั้ง OTA_ICAL = ไม่ทำอะไร) */
function syncOtaCalendars() {
  const cfg = otaConfig_();
  const feeds = [];
  Object.keys(cfg).forEach((h) => Object.keys(cfg[h]).forEach((src) => feeds.push({ house: h, src, url: cfg[h][src], key: h + ':' + src })));
  if (!feeds.length) return { ok: true, feeds: 0 };

  // ดึงทุกปฏิทินพร้อมกัน นอกล็อก (เน็ตช้าไม่ทำให้ลูกค้าที่กำลังจองต้องรอ)
  const today = todayISO_();
  otaFetch_(feeds).forEach((res, i) => {
    const f = feeds[i];
    const events = res.error ? null : icsParse_(res.text);
    if (!events) f.error = res.error || 'ไม่ใช่ไฟล์ปฏิทิน (ไม่มี VCALENDAR)';
    else f.events = otaEvents_(events, f.src, f.house, today);
  });

  const conflicts = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    ensureCols_(sh);
    const values = adminValues_(sh); // อ่านชีตครั้งเดียว
    const stamp = nowText_();
    const index = {};
    values.forEach((r, i) => {
      const id = rowKey_(r, i);
      if (OTA_ID.test(id) && index[id] === undefined) index[id] = i;
    });
    const added = [];
    const touched = []; // การจองจาก OTA ที่ใหม่/เปลี่ยนวัน → เช็กชนกับการจองในเว็บ
    feeds.forEach((f) => {
      if (!f.events) return;
      const st = f.stat = { events: 0, added: 0, updated: 0, cancelled: 0 };
      Object.keys(f.events).forEach((id) => {
        const ev = f.events[id];
        st.events++;
        const name = OTA_SOURCES[f.src] + (ev.block ? ' (ปิดวัน)' : '');
        const note = safe_('[sync] ' + ev.summary.slice(0, 60));
        // ช่อง 3–13: รหัสบ้าน บ้าน เข้า ออก คืน คน ชื่อ เบอร์ หมายเหตุ ยอดรวม สถานะ
        const fields = [f.house, HOUSES[f.house].name, ev.from, ev.to, nights_(ev.from, ev.to), '', name, '', note, 0, STATUS.CONFIRMED];
        const i = index[id];
        if (i === undefined) {
          const row = [stamp, id].concat(fields, [0, '', '', '', '', '', '', '', f.src]);
          added.push(row);
          index[id] = -1; // กัน UID ซ้ำในอีกปฏิทิน
          st.added++;
          touched.push({ f, ev, id });
          return;
        }
        if (i < 0) return;
        const r = values[i];
        const moved = iso_(r[COL.checkin - 1]) !== ev.from || iso_(r[COL.checkout - 1]) !== ev.to
          || String(r[COL.status - 1] || '').trim() !== STATUS.CONFIRMED || houseId_(r[COL.house - 1]) !== f.house;
        if (!moved && String(r[8]) === name && String(r[10]) === note) return; // ไม่มีอะไรเปลี่ยน ไม่เขียน
        sh.getRange(i + 2, 3, 1, fields.length).setValues([fields]);
        fields.forEach((v, j) => { r[2 + j] = v; });
        st.updated++;
        if (moved) touched.push({ f, ev, id });
      });
      // หายไปจากปฏิทินที่ดึงสำเร็จ → ยกเลิก (ไม่แตะการจองที่ผ่านไปแล้ว)
      values.forEach((r, i) => {
        const id = rowKey_(r, i);
        if (!OTA_ID.test(id) || f.events[id] || otaSourceOf_(r, id) !== f.src) return;
        if ((houseId_(r[COL.house - 1]) || houseId_(r[3])) !== f.house) return;
        if (String(r[COL.status - 1] || '').trim() === STATUS.CANCELLED || !(iso_(r[COL.checkout - 1]) > today)) return;
        sh.getRange(i + 2, COL.status).setValue(STATUS.CANCELLED);
        r[COL.status - 1] = STATUS.CANCELLED;
        st.cancelled++;
      });
    });
    if (added.length) sh.getRange(sh.getLastRow() + 1, 1, added.length, added[0].length).setValues(added);

    // จองชนกัน: การจองจาก OTA ที่ใหม่/เปลี่ยนวัน ทับการจองที่ยังมีผลของบ้านเดียวกัน (เว็บ/หลังบ้าน หรือ OTA อีกเจ้า)
    const all = values.concat(added);
    const now = nowText_();
    touched.forEach(({ f, ev, id }) => {
      if (!(ev.to > today)) return;
      all.forEach((r, i) => {
        const other = rowKey_(r, i);
        if (other === id) return;
        const src = otaSourceOf_(r, other);
        if (src === f.src) return; // ปฏิทินเดียวกัน OTA จัดการเอง
        if ((houseId_(r[COL.house - 1]) || houseId_(r[3])) !== f.house) return;
        const status = r[COL.status - 1];
        if (status === STATUS.CANCELLED || status === STATUS.EXPIRED || isExpired_(status, r[COL.deadline - 1], now)) return;
        const from = iso_(r[COL.checkin - 1]);
        const to = iso_(r[COL.checkout - 1]);
        if (!(from < ev.to && to > ev.from && to > today)) return;
        // "ปิดวัน" ที่อยู่ในช่วงการจองของเราพอดี = OTA สะท้อนปฏิทินที่เราส่งออกไป ไม่ใช่การจองชน
        if (ev.block && from <= ev.from && to >= ev.to) return;
        conflicts.push({ key: id + '|' + ev.from + '|' + ev.to + '|' + other, until: ev.to, house: f.house, src: f.src, ev, other, otherSrc: src });
      });
    });
  } finally {
    try {
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
  }

  // บันทึกผลซิงก์ (ดูด้วย otaStatus)
  const prev = readJson_('OTA_LAST');
  const last = {};
  const at = nowText_();
  feeds.forEach((f) => {
    const old = prev[f.key] || {};
    last[f.key] = f.stat
      ? Object.assign({ at, ok: true }, f.stat)
      : { at, ok: false, error: f.error, lastOk: old.ok ? old.at : old.lastOk || '' };
    if (!f.stat) console.error('ซิงก์ ' + f.key + ' ไม่สำเร็จ: ' + f.error);
  });
  props_().setProperty('OTA_LAST', JSON.stringify(last));

  // แจ้ง LINE แอดมิน (เรื่องละครั้ง · รวมเป็นข้อความเดียว)
  const alerted = readJson_('OTA_ALERTED');
  Object.keys(alerted).forEach((k) => { if (!(String(alerted[k]) >= today)) delete alerted[k]; });
  const fresh = conflicts.filter((c) => !alerted[c.key]);
  if (fresh.length) {
    const text = fresh.map((c) => '⚠️ จองชนกัน: ' + HOUSES[c.house].name + ' ' + thaiRange_(c.ev.from, c.ev.to)
      + ' · มีการจองจาก ' + OTA_SOURCES[c.src] + ' ทับกับการจอง' + (c.otherSrc ? 'จาก ' + OTA_SOURCES[c.otherSrc] : 'ในเว็บ')
      + ' ' + c.other + ' กรุณาตรวจสอบด่วน').join('\n\n');
    linePush_(adminIds_(), text + '\n\nเปิดในหลังบ้าน: ' + ADMIN_URL);
    fresh.forEach((c) => { alerted[c.key] = c.until; });
  }
  props_().setProperty('OTA_ALERTED', JSON.stringify(alerted));
  return { ok: true, feeds: feeds.length, failed: feeds.filter((f) => !f.stat).length, conflicts: fresh.length };
}

// ดึงทุกลิงก์พร้อมกัน · ลิงก์ไหนเน็ตพัง (fetchAll โยน error ทั้งชุด) → ลองทีละลิงก์
// ข้อความผิดพลาดตัดลิงก์ออก (ลิงก์ของ OTA มีรหัสลับ)
function otaFetch_(feeds) {
  const reqs = feeds.map((f) => ({ url: f.url, muteHttpExceptions: true, followRedirects: true, headers: { Accept: 'text/calendar' } }));
  const clean = (err) => String(err).replace(/https?:\/\/\S+/g, '<ลิงก์>').slice(0, 120);
  let res;
  try {
    res = UrlFetchApp.fetchAll(reqs);
  } catch (err) {
    res = reqs.map((q) => {
      try {
        return UrlFetchApp.fetch(q.url, q);
      } catch (err2) {
        return { error: 'ดึงไม่สำเร็จ: ' + clean(err2) };
      }
    });
  }
  return res.map((r) => {
    if (r.error) return r;
    try {
      const code = r.getResponseCode();
      return code === 200 ? { text: r.getContentText('UTF-8') } : { error: 'HTTP ' + code };
    } catch (err) {
      return { error: clean(err) };
    }
  });
}

// อ่านไฟล์ iCal → [{ DTSTART, DTEND, UID, SUMMARY, STATUS }] · ไม่ใช่ VCALENDAR ครบไฟล์ = null
function icsParse_(text) {
  const s = String(text || '').replace(/^\uFEFF/, '');
  if (!/^\s*BEGIN:VCALENDAR/i.test(s) || !/END:VCALENDAR\s*$/i.test(s)) return null;
  const events = [];
  let ev = null;
  s.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n').forEach((line) => {
    const up = line.trim().toUpperCase();
    if (up === 'BEGIN:VEVENT') { ev = {}; return; }
    if (up === 'END:VEVENT') { if (ev) events.push(ev); ev = null; return; }
    if (!ev) return;
    // ชื่อ;พารามิเตอร์:ค่า (โคลอนในเครื่องหมายคำพูดของพารามิเตอร์ไม่นับ)
    let q = false;
    let c = -1;
    for (let k = 0; k < line.length; k++) {
      if (line[k] === '"') q = !q;
      else if (line[k] === ':' && !q) { c = k; break; }
    }
    if (c < 0) return;
    const name = line.slice(0, c).split(';')[0].trim().toUpperCase();
    const value = line.slice(c + 1).trim();
    if (name === 'DTSTART' || name === 'DTEND') ev[name] = icsDate_(value);
    else if (name === 'UID' || name === 'SUMMARY' || name === 'STATUS') {
      ev[name] = value.replace(/\\n/gi, ' ').replace(/\\([\\;,])/g, '$1');
    }
  });
  return events;
}

// 20261010 / 20261010T140000 / 20261010T070000Z → yyyy-mm-dd (เวลา UTC แปลงเป็นวันที่ไทย · มีเขตเวลาอื่น ใช้วันที่ตามที่เขียน)
function icsDate_(v) {
  const m = String(v).match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/i);
  if (!m) return '';
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)));
  if (t.getUTCMonth() !== Number(m[2]) - 1 || t.getUTCDate() !== Number(m[3])) return ''; // วันที่ไม่มีจริง
  return m[7] ? Utilities.formatDate(t, TZ, 'yyyy-MM-dd') : m[1] + '-' + m[2] + '-' + m[3];
}

// VEVENT → การจองที่จะเขียนลงชีต { รหัส EXT-...: { from, to, block, summary } }
// ไม่มีวันออก (หรือวันออกไม่หลังวันเข้า) = 1 คืน · เอาเฉพาะที่ยังไม่ออก (วันออก >= วันนี้) และเข้าพักภายใน 2 ปี
function otaEvents_(events, src, house, today) {
  const max = addDaysISO_(today, OTA_MAX_DAYS);
  const out = {};
  events.forEach((ev) => {
    if (/^CANCELLED$/i.test(ev.STATUS || '')) return;
    const from = ev.DTSTART;
    if (!from) return;
    const to = ev.DTEND && ev.DTEND > from ? ev.DTEND : addDaysISO_(from, 1);
    if (to < today || from > max) return;
    const summary = String(ev.SUMMARY || '').replace(/\s+/g, ' ').trim();
    const uid = String(ev.UID || '').trim() || from + '|' + to + '|' + summary;
    const id = 'EXT-' + src.toUpperCase() + '-' + hash8_(house + '|' + uid);
    if (out[id]) return;
    out[id] = { from, to, summary, block: OTA_BLOCK_SUMMARY.test(summary) };
  });
  return out;
}

// แฮช 8 ตัวอักษร (FNV-1a 32 บิต) — UID เดิมได้รหัสเดิมเสมอ
function hash8_(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8).toUpperCase();
}
