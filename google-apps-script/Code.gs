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
const HOUSES = {
  'lagoon-1': { name: 'Lagoon 1', price: 1300 },
  'lagoon-2': { name: 'Lagoon 2', price: 1300 },
  'studio': { name: 'Lagoon Studio', price: 1500 },
  'family-1': { name: 'Lagoon Family 1', price: 2500 },
  'family-2': { name: 'Lagoon Family 2', price: 3000 },
};

const HEADERS = ['เวลาที่จอง', 'รหัสการจอง', 'รหัสบ้าน', 'บ้าน', 'เช็กอิน', 'เช็กเอาต์', 'คืน', 'ผู้เข้าพัก',
  'ชื่อ', 'เบอร์โทร', 'หมายเหตุ', 'ยอดรวม (บาท)', 'สถานะ', 'ยอดที่ต้องชำระ (บาท)', 'ชำระภายใน', 'แบบชำระ',
  'ชำระส่วนที่เหลือ', 'คืนเงิน', 'กางเต็นท์เอง (ท่าน)', 'เช่าเต็นท์ (หลัง)'];
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

  // ข้อความจาก LINE (webhook) ไม่ใช่การจองจากหน้าเว็บ
  if (Array.isArray(d.events)) {
    d.events.forEach((ev) => { try { lineEvent_(ev); } catch (err) { console.error('LINE: ' + err); } });
    return json_({ ok: true });
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
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
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

// แอดมินพิมพ์การจองเองในชีต อาจพิมพ์รหัสบ้านเป็นชื่อ เช่น "Lagoon 1", "Studio", "Family 2" — แปลงเป็นรหัสให้
function houseId_(v) {
  const s = String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (HOUSES[s]) return s;
  const key = s.replace(/^lagoon /, '').replace(/ /g, '');
  const alias = { '1': 'lagoon-1', '2': 'lagoon-2', lagoon1: 'lagoon-1', lagoon2: 'lagoon-2',
    studio: 'studio', family1: 'family-1', family2: 'family-2' };
  return alias[key] || s;
}

// การจองที่ยังล็อกบ้านอยู่ (ส่งเฉพาะบ้านกับวันที่ ไม่ส่งข้อมูลลูกค้า)
function activeBookings_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  const today = todayISO_();
  const now = nowText_();
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .map((r) => ({
      house: houseId_(r[COL.house - 1]) || houseId_(r[3]), // ช่องรหัสบ้านว่าง ลองดูช่องชื่อบ้าน
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
  if (d.houses.some((h) => !HOUSES[h])) return 'bad_house';
  const tent = Number(d.tentGuests || 0);
  const rent = Number(d.tentRentals || 0);
  if (!(Number.isInteger(tent) && tent >= 0 && tent <= 30)) return 'bad_tent';
  if (!(Number.isInteger(rent) && rent >= 0 && rent <= 10)) return 'bad_tent';
  if (!d.houses.length && !tent && !rent) return 'bad_house'; // ต้องมีบ้านหรือเต็นท์อย่างน้อย 1 อย่าง
  if (!isDate(d.checkin) || !isDate(d.checkout) || d.checkout <= d.checkin || d.checkin < todayISO_()) return 'bad_dates';
  if (d.checkin === todayISO_() && Number(Utilities.formatDate(new Date(), TZ, 'H')) >= SAME_DAY_CUTOFF) return 'too_late';
  if (nights_(d.checkin, d.checkout) > 30) return 'too_long';
  if (!d.name || String(d.name).trim().length > 100) return 'bad_name';
  if (!/^0[0-9]{8,9}$/.test(String(d.phone || '').replace(/[\s-]/g, ''))) return 'bad_phone';
  const guests = Number(d.guests);
  if (!(guests >= (d.houses.length ? 1 : 0) && guests <= 30)) return 'bad_guests'; // จองแค่เต็นท์ = 0 คนในบ้าน
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

function props_() {
  return PropertiesService.getScriptProperties();
}

function adminIds_() {
  return (props_().getProperty('ADMIN_IDS') || '').split(',').filter(Boolean);
}

function lineEvent_(ev) {
  if (ev.type !== 'message' || !ev.message || ev.message.type !== 'text' || !ev.source || !ev.source.userId) return;
  const user = ev.source.userId;
  const text = String(ev.message.text).trim();
  const admins = adminIds_();

  // ลงทะเบียนแอดมินด้วยรหัสลับ
  const reg = text.match(/^ลงทะเบียน\s+(.+)$/);
  if (reg) {
    const code = props_().getProperty('ADMIN_CODE');
    if (!code || reg[1].trim() !== code) return; // รหัสผิด: เงียบ ไม่บอกว่ามีระบบนี้
    if (!admins.includes(user)) props_().setProperty('ADMIN_IDS', admins.concat(user).join(','));
    lineReply_(ev.replyToken, 'ลงทะเบียนแอดมินแล้วครับ ✅\nมีคนจองใหม่จะแจ้งเตือนที่แชทนี้\n\n' + LINE_HELP);
    return;
  }
  if (!admins.includes(user)) return;

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
  ].join('\n');
  try {
    lineApi_('/v2/bot/message/multicast', { to: admins, messages: [{ type: 'text', text }] });
  } catch (err) {
    console.error('ส่ง LINE แจ้งเตือนไม่สำเร็จ: ' + err);
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
  sh.getRange(2, 1, last - 1, HEADERS.length).getValues().forEach((r, i) => {
    const status = r[COL.status - 1];
    if (status === STATUS.CANCELLED || status === STATUS.EXPIRED || isExpired_(status, r[COL.deadline - 1], now)) return;
    const key = String(r[1]).trim() || 'row' + i; // แถวที่แอดมินพิมพ์เองอาจไม่มีรหัส
    const g = groups[key] || (groups[key] = {
      houses: [], from: iso_(r[COL.checkin - 1]), to: iso_(r[COL.checkout - 1]),
      guests: r[7], tent: Number(r[18]) || 0, rent: Number(r[19]) || 0, name: String(r[8]), phone: String(r[9]), note: String(r[10] || ''), status,
    });
    const hid = houseId_(r[COL.house - 1]) || houseId_(r[3]);
    g.houses.push(HOUSES[hid] ? HOUSES[hid].name : String(r[3] || r[COL.house - 1]));
  });
  return Object.values(groups).sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
}

function bookingText_(g) {
  return [
    '🏠 ' + g.houses.join(', '),
    '👤 ' + g.name + ' · ' + (Number(g.guests) ? g.guests + ' ท่านในบ้าน' : 'ไม่มีบ้าน') + (g.tent ? ' · ⛺ มาเอง ' + g.tent + ' ท่าน' : '') + (g.rent ? ' · ⛺ เช่า ' + g.rent + ' หลัง' : ''),
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
  const guests = list.reduce((sum, g) => sum + Number(g.guests || 0), 0);
  const houses = list.reduce((sum, g) => sum + g.houses.length, 0);
  return head + '\nจอง ' + houses + ' หลัง · ' + guests + ' ท่าน\n\n' + list.map(bookingText_).join('\n\n');
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
function parseDate_(text, today) {
  const m = text.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{2,4}))?$/);
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
  } else {
    year = Number(today.slice(0, 4));
    if (year + '-' + pad(month) + '-' + pad(day) < today) year += 1;
  }
  return year + '-' + pad(month) + '-' + pad(day);
}

/** กด Run ครั้งเดียวหลังเพิ่มส่วน LINE เพื่อให้ Google ขออนุญาตเชื่อมต่อ LINE (UrlFetchApp) */
function authorizeLine() {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/info', { muteHttpExceptions: true });
}
