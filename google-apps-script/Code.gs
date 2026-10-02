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

// ราคาต่อคืน — ต้องตรงกับ js/booking.js (ระบบคำนวณยอดจากราคานี้ ไม่เชื่อยอดที่ส่งมาจากหน้าเว็บ)
const HOUSES = {
  'lagoon-1': { name: 'Lagoon 1', price: 1500 },
  'lagoon-2': { name: 'Lagoon 2', price: 1500 },
  'lagoon-3': { name: 'Lagoon 3', price: 1500 },
  'studio': { name: 'Lagoon Studio', price: 1500 },
  'family-1': { name: 'Lagoon Family 1', price: 2500 },
  'family-2': { name: 'Lagoon Family 2', price: 3000 },
};

const HEADERS = ['เวลาที่จอง', 'รหัสการจอง', 'รหัสบ้าน', 'บ้าน', 'เช็กอิน', 'เช็กเอาต์', 'คืน', 'ผู้เข้าพัก',
  'ชื่อ', 'เบอร์โทร', 'หมายเหตุ', 'ยอดรวม (บาท)', 'สถานะ', 'ยอดที่ต้องชำระ (บาท)', 'ชำระภายใน', 'แบบชำระ',
  'ชำระส่วนที่เหลือ', 'คืนเงิน'];
const COL = { house: 3, checkin: 5, checkout: 6, status: 13, deadline: 15, balance: 17, refund: 18 }; // ลำดับคอลัมน์ (เริ่มที่ 1)

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
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return;
  const now = nowText_();
  const status = sh.getRange(2, COL.status, last - 1, 1).getValues();
  const deadline = sh.getRange(2, COL.deadline, last - 1, 1).getValues();
  let changed = false;
  status.forEach((row, i) => {
    if (isExpired_(row[0], deadline[i][0], now)) { row[0] = STATUS.EXPIRED; changed = true; }
  });
  if (changed) sh.getRange(2, COL.status, last - 1, 1).setValues(status);
}

/** หน้าเว็บขอดูวันว่าง */
function doGet() {
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

  // ช่องลับกันบอท: คนจริงมองไม่เห็นช่องนี้ ถ้ามีค่ามาแปลว่าเป็นบอท ทำเหมือนสำเร็จแต่ไม่บันทึก
  if (d.website) return json_({ ok: true, id: 'LG000000-0000', total: 0, due: 0, payType: 'deposit', deadline: '' });

  d.houses = Array.isArray(d.houses) ? [...new Set(d.houses)] : [];
  const problem = validate_(d);
  if (problem) return json_({ ok: false, error: problem });

  const nights = nights_(d.checkin, d.checkout);
  const total = d.houses.reduce((sum, h) => sum + HOUSES[h].price, 0) * nights;
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
    const rows = d.houses.map((h) => [
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm'), id, h, HOUSES[h].name, d.checkin, d.checkout, nights,
      Number(d.guests), safe_(d.name), safe_(d.phone), safe_(d.note), total, STATUS.PENDING, due, deadline,
      PAY_TYPES[payType], payType === 'deposit' ? BALANCE.UNPAID : '', '',
    ]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }

  notify_(id, d, total, due, payType, deadline); // ส่งหลังปลดล็อก จะได้ไม่ทำให้คนอื่นที่กำลังจองต้องรอ
  return json_({ ok: true, id, total, due, payType, deadline });
}

// ---------- ตัวช่วย ----------

function spreadsheet_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_() {
  return spreadsheet_().getSheetByName(SHEET_NAME);
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
function iso_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
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

// การจองที่ยังล็อกบ้านอยู่ (ส่งเฉพาะบ้านกับวันที่ ไม่ส่งข้อมูลลูกค้า)
function activeBookings_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const today = todayISO_();
  const now = nowText_();
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .map((r) => ({
      house: String(r[COL.house - 1]).trim(),
      from: iso_(r[COL.checkin - 1]),
      to: iso_(r[COL.checkout - 1]),
      status: r[COL.status - 1],
      deadline: r[COL.deadline - 1],
    }))
    .filter((b) => HOUSES[b.house] && b.to > today
      && b.status !== STATUS.CANCELLED && b.status !== STATUS.EXPIRED
      && !isExpired_(b.status, b.deadline, now))
    .map((b) => ({ house: b.house, from: b.from, to: b.to }));
}

function validate_(d) {
  const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!d.houses.length || d.houses.some((h) => !HOUSES[h])) return 'bad_house';
  if (!isDate(d.checkin) || !isDate(d.checkout) || d.checkout <= d.checkin || d.checkin < todayISO_()) return 'bad_dates';
  if (nights_(d.checkin, d.checkout) > 30) return 'too_long';
  if (!d.name || String(d.name).trim().length > 100) return 'bad_name';
  if (!/^0[0-9]{8,9}$/.test(String(d.phone || '').replace(/[\s-]/g, ''))) return 'bad_phone';
  const guests = Number(d.guests);
  if (!(guests >= 1 && guests <= 30)) return 'bad_guests';
  if (d.note && String(d.note).length > 500) return 'bad_note';
  return '';
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
    const names = d.houses.map((h) => HOUSES[h].name).join(', ');
    const subject = 'จองใหม่ ' + id + ' · ' + names + ' · ' + d.checkin + ' ถึง ' + d.checkout;
    const body = [
      'มีคำขอจองใหม่จากหน้าเว็บ (สถานะ: ' + STATUS.PENDING + ')',
      '',
      'รหัสการจอง: ' + id,
      'บ้าน: ' + names,
      'เช็กอิน: ' + d.checkin,
      'เช็กเอาต์: ' + d.checkout + ' (' + nights_(d.checkin, d.checkout) + ' คืน)',
      'ผู้เข้าพัก: ' + Number(d.guests) + ' ท่าน',
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
