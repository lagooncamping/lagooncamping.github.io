/**
 * The Lagoon Camping Resort — ระบบรับจองจากหน้าเว็บ (Google Apps Script)
 *
 * ไฟล์นี้ไม่ได้อยู่บนเว็บ ต้องคัดลอกไปวางใน Google Sheets > ส่วนขยาย > Apps Script
 * วิธีติดตั้งทีละขั้นอยู่ในไฟล์ SETUP-GOOGLE-SHEETS.md
 *
 * - doGet  : ส่งรายการ "บ้านไหนถูกจองวันไหน" ให้หน้าเว็บ (ไม่ส่งชื่อ/เบอร์ลูกค้า)
 * - doPost : รับการจองใหม่ เช็กว่าไม่ซ้อนกับการจองเดิม แล้วบันทึกลงชีตเป็น "รอยืนยัน"
 */

// ID ของไฟล์ชีต (ตัวอักษรยาว ๆ ในลิงก์ชีต ระหว่าง /d/ กับ /edit)
// เว้นว่างได้ถ้าสร้างสคริปต์จากเมนู ส่วนขยาย > Apps Script ในชีตนั้นเอง
const SPREADSHEET_ID = '';
const SHEET_NAME = 'การจอง';
const TZ = 'Asia/Bangkok';
const STATUS = { PENDING: 'รอยืนยัน', CONFIRMED: 'ยืนยันแล้ว', CANCELLED: 'ยกเลิก' };
// อีเมลที่จะได้รับแจ้งเตือนเมื่อมีการจองใหม่ (เว้นว่าง = ไม่ส่ง)
const NOTIFY_EMAIL = 'lagooncampingresort@gmail.com';

// ต้องตรงกับ id ของบ้านใน js/booking.js
const HOUSES = {
  'lagoon-1': 'Lagoon 1',
  'lagoon-2': 'Lagoon 2',
  'lagoon-3': 'Lagoon 3',
  'studio': 'Lagoon Studio',
  'family-1': 'Lagoon Family 1',
  'family-2': 'Lagoon Family 2',
};

const HEADERS = ['เวลาที่จอง', 'รหัสการจอง', 'รหัสบ้าน', 'บ้าน', 'เช็คอิน', 'เช็คเอาท์', 'คืน', 'ผู้เข้าพัก',
  'ชื่อ', 'เบอร์โทร', 'หมายเหตุ', 'ยอดรวม (บาท)', 'สถานะ'];
const COL = { house: 3, checkin: 5, checkout: 6, status: 13 }; // ลำดับคอลัมน์ (เริ่มที่ 1)

/** กด Run ฟังก์ชันนี้ครั้งเดียวตอนติดตั้ง: สร้างหัวตาราง ช่องเลือกสถานะ และสีตามสถานะ */
function setup() {
  const ss = spreadsheet_();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME, 0);
  const rows = sh.getMaxRows() - 1;

  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  // เก็บวันที่และเบอร์โทรเป็นข้อความ (กันชีตแปลงเป็นวันที่/ตัวเลขเอง)
  sh.getRange('E:F').setNumberFormat('@');
  sh.getRange('J:J').setNumberFormat('@');

  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(Object.values(STATUS), true).build();
  sh.getRange(2, COL.status, rows, 1).setDataValidation(statusRule);

  const all = sh.getRange(2, 1, rows, HEADERS.length);
  const color = (text, bg) => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$M2="' + text + '"').setBackground(bg).setRanges([all]).build();
  sh.setConditionalFormatRules([
    color(STATUS.PENDING, '#FFF4D6'),
    color(STATUS.CONFIRMED, '#E3F1E0'),
    color(STATUS.CANCELLED, '#EEEEEE'),
  ]);
  sh.autoResizeColumns(1, HEADERS.length);
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
  if (d.website) return json_({ ok: true, id: 'LG000000-0000' });

  d.houses = Array.isArray(d.houses) ? [...new Set(d.houses)] : [];
  const problem = validate_(d);
  if (problem) return json_({ ok: false, error: problem });

  // ล็อกไว้ กันสองคนจองบ้านเดียวกันพร้อมกัน
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let id;
  try {
    const sh = sheet_();
    const current = activeBookings_(sh);
    const taken = d.houses.filter((h) => current.some((b) => b.house === h && b.from < d.checkout && b.to > d.checkin));
    if (taken.length) return json_({ ok: false, error: 'booked', houses: taken });

    const now = new Date();
    id = 'LG' + Utilities.formatDate(now, TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    const nights = nights_(d.checkin, d.checkout);
    const rows = d.houses.map((h) => [
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm'), id, h, HOUSES[h], d.checkin, d.checkout, nights,
      Number(d.guests), safe_(d.name), safe_(d.phone), safe_(d.note), Number(d.total) || '', STATUS.PENDING,
    ]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }

  notify_(id, d); // ส่งหลังปลดล็อก จะได้ไม่ทำให้คนอื่นที่กำลังจองต้องรอ
  return json_({ ok: true, id });
}

/** กด Run ครั้งเดียวหลังเพิ่มการแจ้งเตือนอีเมล เพื่อให้ Google ขออนุญาตส่งอีเมล */
function authorizeEmail() {
  MailApp.getRemainingDailyQuota();
}

// ส่งอีเมลแจ้งแอดมินว่ามีการจองใหม่ (ถ้าส่งไม่ได้ การจองยังบันทึกอยู่ในชีตตามปกติ)
function notify_(id, d) {
  if (!NOTIFY_EMAIL) return;
  try {
    const names = d.houses.map((h) => HOUSES[h]).join(', ');
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
      'ยอดรวม: ' + (Number(d.total) || 0) + ' บาท',
      '',
      'เปิดชีตการจอง: ' + spreadsheet_().getUrl(),
      'อย่าลืมโทรหรือทักไลน์ยืนยันกับลูกค้า แล้วเปลี่ยนสถานะในชีต',
    ].join('\n');
    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (err) {
    console.error('ส่งอีเมลแจ้งเตือนไม่สำเร็จ: ' + err);
  }
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

// แอดมินอาจพิมพ์วันที่เองจนชีตแปลงเป็น Date — แปลงกลับเป็น yyyy-mm-dd
function iso_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
}

function nights_(from, to) {
  return Math.round((new Date(to + 'T00:00:00Z') - new Date(from + 'T00:00:00Z')) / 86400000);
}

// การจองที่ยังไม่ยกเลิกและยังไม่ผ่านไป (ส่งเฉพาะบ้านกับวันที่ ไม่ส่งข้อมูลลูกค้า)
function activeBookings_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const today = todayISO_();
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .map((r) => ({
      house: String(r[COL.house - 1]).trim(),
      from: iso_(r[COL.checkin - 1]),
      to: iso_(r[COL.checkout - 1]),
      status: r[COL.status - 1],
    }))
    .filter((b) => HOUSES[b.house] && b.status !== STATUS.CANCELLED && b.to > today)
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
