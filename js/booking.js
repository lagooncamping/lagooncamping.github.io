// =========================================================
// หน้าจองที่พัก
// - ถ้าใส่ API_URL: อ่านวันว่างและบันทึกการจองลง Google Sheets
// - ถ้าเว้น API_URL ว่าง: โหมดทดลอง ใช้การจองตัวอย่าง และจำไว้แค่จนกว่าจะรีเฟรชหน้า
// =========================================================

// ลิงก์ Web App จาก Google Apps Script (ดูวิธีได้ในไฟล์ SETUP-GOOGLE-SHEETS.md)
const API_URL = 'https://script.google.com/macros/s/AKfycbyCUEb3YTKm6_LoUal5cvBmZZR_-fhcYULSRiH2WDNnSgPOlHGDjqgYY8-Y7ID8rUvWVg/exec';

const LINE_ID = '@477nvamb';
const PHONE = '081-930-4969';

// เงื่อนไขมัดจำ (ต้องตรงกับ google-apps-script/Code.gs — ยอดจริงคำนวณที่ Google)
const PROMPTPAY = '0909365562';
const DEPOSIT_RATE = 0.5;
const HOLD_HOURS = 6;
const TENT_PRICE = 200;      // นำเต็นท์มาเอง บาท/ท่าน/คืน — ต้องตรงกับ Code.gs
const TENT_RENT = 1300;      // เช่าเต็นท์หลังใหญ่ บาท/หลัง/คืน (พร้อมเครื่องนอน 2 ชุด พัดลม ปลั๊ก) — ต้องตรงกับ Code.gs
const TENT_RENT_SMALL = 1000; // เช่าเต็นท์หลังเล็ก บาท/หลัง/คืน (พร้อมเครื่องนอน 2 ชุด พัดลม ปลั๊ก) — ต้องตรงกับ Code.gs
const TENT_RENT_SLEEPS = 2;  // เต็นท์เช่า 1 หลัง (ทั้งใหญ่และเล็ก) นอนได้ 2 ท่าน
const EXTRA_PERSON = 300;    // เพิ่มคนในบ้าน คนละ 300 บาท (มีที่นอนปิกนิกเสริม) — แจ้งแอดมิน ไม่คิดในระบบจอง
const SAME_DAY_CUTOFF = 18;  // หลัง 18:00 น. ปิดรับจองเข้าพักวันนี้ทางเว็บ — ต้องตรงกับ Code.gs

// ---------- QR พร้อมเพย์ (มาตรฐาน EMVCo ที่ธนาคารไทยใช้) ----------
const tlv = (id, value) => id + String(value.length).padStart(2, '0') + value;
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function promptPayPayload(phone, amount) {
  const target = '0066' + phone.replace(/\D/g, '').slice(1); // 0909365562 → 0066909365562
  const body = tlv('00', '01') + tlv('01', '12')
    + tlv('29', tlv('00', 'A000000677010111') + tlv('01', target))
    + tlv('53', '764') + tlv('54', amount.toFixed(2)) + tlv('58', 'TH') + '6304';
  return body + crc16(body);
}

// ---------- ข้อมูลบ้าน (แก้ชื่อ ราคา รูป ได้ตรงนี้) ----------
// รูปจริง (9 ต.ค. 2569) ตัดมาจากภาพ "รูปบ้านส่งลูกค้า" ในโฟลเดอร์ AIOS — รูปห้องนอน Lagoon 1–3 ใช้รูปเดียวกัน (บ้านเหมือนกันทั้ง 3 หลัง)
const LAGOON_ROOM = { src: 'img/house-lagoon-room.jpg', alt: 'ห้องนอนบ้าน Lagoon เตียงใหญ่ มีแอร์' };
const LAKE = { src: 'img/lake-view.jpg', alt: 'วิวทะเลสาบหน้าที่พัก' };
const HOUSES = [
  {
    id: 'lagoon-1', name: 'Lagoon 1', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    features: ['1 เตียงใหญ่', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-lagoon-1.jpg', alt: 'บ้านไม้ Lagoon 1 ยกพื้น มีระเบียงหน้าบ้าน' },
      LAGOON_ROOM,
      { src: 'img/house-lagoon-garden.jpg', alt: 'บ้านพักไม้เรียงริมสนามหญ้า' },
      LAKE,
    ],
  },
  {
    id: 'lagoon-2', name: 'Lagoon 2', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    features: ['1 เตียงใหญ่', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-lagoon-2.jpg', alt: 'บ้านไม้ Lagoon 2 ท่ามกลางต้นปาล์ม' },
      LAGOON_ROOM,
      { src: 'img/house-lagoon-garden.jpg', alt: 'บ้านพักไม้เรียงริมสนามหญ้า' },
      LAKE,
    ],
  },
  {
    id: 'lagoon-3', name: 'Lagoon 3', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    features: ['1 เตียงใหญ่', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-lagoon-3.jpg', alt: 'บ้านไม้ Lagoon เรียงกันริมสนามหญ้า' },
      LAGOON_ROOM,
      { src: 'img/house-lagoon-3-lake.jpg', alt: 'ต้นไม้ใหญ่ริมทะเลสาบ' },
      LAKE,
    ],
  },
  {
    id: 'family-1', name: 'Lagoon Family 1', type: 'บ้านหลังกลาง', guests: 4, price: 2500,
    features: ['1 ห้องนอน 2 เตียง', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-family-1.jpg', alt: 'บ้านไม้ Lagoon Family 1 ระเบียงกว้าง มีเรือแคนูหน้าบ้าน' },
      { src: 'img/house-family-1-room.jpg', alt: 'ห้องนอน Family 1 เตียง 2 เตียง ผนังไม้' },
      { src: 'img/house-family-1-room2.jpg', alt: 'ห้องนอน Family 1 มีตู้เย็นและโต๊ะเครื่องแป้ง' },
      LAKE,
    ],
  },
  {
    id: 'family-2', name: 'Lagoon Family 2', type: 'บ้านหลังใหญ่ · มีครัว', guests: 4, price: 3000,
    features: ['2 ห้องนอน (ห้องละ 1 เตียงใหญ่)', '2 ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-family-2.jpg', alt: 'บ้านไม้ 2 ชั้น Lagoon Family 2 เปิดไฟยามค่ำ' },
      { src: 'img/house-family-2-day.jpg', alt: 'บ้าน Family 2 ตอนกลางวัน ใต้ถุนมีโต๊ะนั่งเล่น' },
      { src: 'img/house-family-2-room.jpg', alt: 'ห้องนอน Family 2 เตียงใหญ่ มีแอร์' },
      { src: 'img/house-family-2-view.jpg', alt: 'วิวจากระเบียง Family 2 เห็นชิงช้าและทะเลสาบ' },
    ],
  },
  {
    id: 'studio', name: 'Lagoon Studio', type: 'บ้านหลังใหม่ สไตล์โมเดิร์น', guests: 2, price: 1500,
    features: ['2 เตียง', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-studio.jpg', alt: 'บ้าน Lagoon Studio ประตูกระจกบานใหญ่ มีโต๊ะหน้าบ้าน' },
      { src: 'img/house-studio-room.jpg', alt: 'ห้องนอน Studio พื้นกระเบื้อง มีตู้เย็น' },
      { src: 'img/house-studio-view.jpg', alt: 'วิวสนามหญ้าและทะเลสาบจากประตู Studio' },
      LAKE,
    ],
  },
];

// ไอคอนเล็กๆ หน้าข้อมูลบ้าน
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  guests: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
  bed: svg('<path d="M3 18V6M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.8"/>'),
  bath: svg('<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V5.5A2 2 0 0 1 9.5 4M7 19l-1 2M17 19l1 2"/>'),
};

// ---------- วันที่ ----------
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return toISO(d); };
const nightsBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const thaiDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const baht = (n) => n.toLocaleString('th-TH');
// วันนี้ตามเวลาไทยเสมอ (ไม่ขึ้นกับเขตเวลาในเครื่องลูกค้า) — en-CA ให้รูปแบบ YYYY-MM-DD
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
// วันเวลาตามเวลาไทยในรูปแบบ 'yyyy-MM-dd HH:mm' (แบบเดียวกับที่ Code.gs ส่งกลับมา) — sv-SE ให้รูปแบบนี้พอดี
const bangkokStamp = (d) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
// 'yyyy-MM-dd HH:mm' (เวลาไทย) → เวลาจริงเป็นมิลลิวินาที (ผิดรูปแบบ = NaN)
const bangkokTime = (s) => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s || '') ? new Date(`${s.replace(' ', 'T')}:00+07:00`).getTime() : NaN);

// ---------- เบอร์โทร: กติกาเดียวกับ normPhone ใน js/my-booking.js และ normPhone_ / validate_ ใน Code.gs ----------
// เก็บแต่ตัวเลข · +66/66 นำหน้า → 0 · เลขไทย ๐–๙ ใช้ได้ · เบอร์ไทย = 0 + 8–9 หลัก (บ้าน 9 หลัก มือถือ 10 หลัก)
const thaiDigits = (s) => String(s).replace(/[๐-๙]/g, (c) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c)));
function normPhone(v) {
  let s = thaiDigits(v == null ? '' : v).replace(/\D/g, '');
  if (/^660\d{8,9}$/.test(s)) s = s.slice(2);
  else if (/^66\d{8,9}$/.test(s)) s = `0${s.slice(2)}`;
  return /^0\d{8,9}$/.test(s) ? s : '';
}
// ข้อความผิดพลาดของช่องเบอร์โทร (ว่าง = ใช้ได้)
function phoneProblem(raw) {
  const v = thaiDigits(raw == null ? '' : raw).trim();
  if (!v) return 'กรุณาใส่เบอร์โทร';
  if (/[^\d\s+\-().]/.test(v)) return 'เบอร์โทรใส่ได้เฉพาะตัวเลข เช่น 081-234-5678';
  if (normPhone(v)) return '';
  const digits = v.replace(/\D/g, '');
  if (digits.length < 9) return 'เบอร์โทรสั้นเกินไป (ต้องมี 9–10 หลัก) เช่น 081-234-5678';
  if (digits.length > 12 || (digits.length > 10 && !/^66/.test(digits))) return 'เบอร์โทรยาวเกินไป (ต้องมี 9–10 หลัก) เช่น 081-234-5678';
  return 'เบอร์โทรต้องขึ้นต้นด้วย 0 เช่น 081-234-5678';
}
// เบอร์ที่ส่งไป Google: พิมพ์มาแบบที่ระบบรับอยู่แล้ว (0 + 8–9 หลัก มีขีด/เว้นวรรคได้) → ส่งตามที่พิมพ์
// แบบอื่น (+66, เลขไทย, วงเล็บ) → แปลงเป็น 0XX-XXX-XXXX (มีขีด ชีตจะไม่ตัด 0 ข้างหน้าทิ้ง)
function phoneForServer(raw) {
  const typed = String(raw).trim();
  if (/^0[0-9]{8,9}$/.test(typed.replace(/[\s-]/g, ''))) return typed;
  return normPhone(typed).replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3');
}

// ---------- จำการจองที่รอชำระไว้ในเครื่องลูกค้า ----------
// ลูกค้าสลับไปแอปธนาคารแล้วมือถือรีโหลดหน้า → เปิดหน้าชำระเงินกลับมาได้ (booking.html#pay)
// เก็บเฉพาะรหัสการจอง ยอด เวลา และรายการแบบย่อ — ไม่เก็บชื่อ/เบอร์โทร · js/main.js อ่านคีย์เดียวกันเพื่อโชว์แถบเตือนหน้าอื่น
const PENDING_KEY = 'lagoon-booking';
function savePending(p) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch (err) { /* โหมดส่วนตัว/ปิดที่เก็บข้อมูล: ข้ามไป */ }
}
// การจองที่ยังไม่หมดเวลาชำระ (หมดเวลาแล้วหรือข้อมูลเสีย → ลบทิ้งเงียบๆ)
function loadPending() {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    if (!p) return null;
    const ok = p.id && Number(p.due) > 0 && bangkokTime(p.deadline) > Date.now();
    if (!ok) { localStorage.removeItem(PENDING_KEY); return null; }
    return p;
  } catch (err) {
    return null;
  }
}
function dropPending() {
  try { localStorage.removeItem(PENDING_KEY); } catch (err) { /* ข้าม */ }
}

// การจองที่มีอยู่แล้ว (from = วันเช็คอิน, to = วันเช็คเอาท์)
// โหมดทดลองใช้ตัวอย่างนี้ ถ้าต่อ Google Sheets แล้วจะโหลดของจริงมาแทน
let BOOKINGS = API_URL ? [] : [
  { house: 'lagoon-2', from: today, to: addDays(today, 2) },
  { house: 'family-1', from: addDays(today, 5), to: addDays(today, 7) },
];

// บ้านหลังนี้ถูกจองซ้อนกับช่วงวันที่เลือกไหม
const isBooked = (id, from, to) => BOOKINGS.some((b) => b.house === id && b.from < to && b.to > from);

// ---------- สถานะของหน้า ----------
const state = { checkin: '', checkout: '', selected: new Set(), loading: false, loadError: false };
const $ = (sel) => document.querySelector(sel);
const checkinEl = $('#checkin');
const checkoutEl = $('#checkout');
const housesEl = $('#houses');

// ปัญหาของวันที่ที่เลือก (ใช้ได้ = '') — บนคอมพิมพ์วันที่เองในช่องได้ (ข้าม min) จึงเช็กซ้ำด้วยกติกาเดียวกับปฏิทิน (firstDay)
function dateProblem() {
  const { checkin, checkout } = state;
  if (!checkin || !checkout) return 'กรุณาเลือกวันเช็กอินและวันเช็กเอาต์';
  if (checkin < firstDay) {
    return checkin === today
      ? `หลัง ${SAME_DAY_CUTOFF}:00 น. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาเลือกวันเช็กอินตั้งแต่ ${thaiDate(firstDay)} (เข้าพักคืนนี้ โทร ${PHONE})`
      : `เลือกวันที่ผ่านมาแล้วไม่ได้ กรุณาเลือกวันเช็กอินตั้งแต่ ${thaiDate(firstDay)}`;
  }
  if (checkout <= checkin) return 'วันเช็กเอาต์ต้องหลังวันเช็กอิน';
  return '';
}
const hasDates = () => !dateProblem();
const nights = () => (hasDates() ? nightsBetween(state.checkin, state.checkout) : 0);
const selectedHouses = () => HOUSES.filter((h) => state.selected.has(h.id));
// เต็นท์ (การ์ด "ลานกางเต็นท์"): นำมาเอง = จำนวนคน, เช่าของรีสอร์ท = จำนวนหลัง (หลังใหญ่ #tent-rent · หลังเล็ก #tent-rent-s)
const qty = (sel, max) => Math.min(max, Math.max(0, Math.floor(Number($(sel).value)) || 0));
const tentGuests = () => qty('#tent-guests', 30);
const tentRentals = () => qty('#tent-rent', 10);
const tentRentalsSmall = () => qty('#tent-rent-s', 10);
const rentCount = () => tentRentals() + tentRentalsSmall(); // เต็นท์เช่าทั้งหมด (หลังละ 2 ท่าน)
const hasItems = () => state.selected.size > 0 || tentGuests() > 0 || rentCount() > 0;
const perNight = () => selectedHouses().reduce((sum, h) => sum + h.price, 0) + tentGuests() * TENT_PRICE
  + tentRentals() * TENT_RENT + tentRentalsSmall() * TENT_RENT_SMALL;
const total = () => perNight() * nights();
// เต็นท์เช่าแบบสั้น เช่น "เช่าเต็นท์หลังใหญ่ 1 หลัง · หลังเล็ก 2 หลัง" / "เช่าเต็นท์หลังเล็ก 1 หลัง" (ไม่เช่า = '')
const rentLabel = () => {
  const big = tentRentals();
  const small = tentRentalsSmall();
  if (big && small) return `เช่าเต็นท์หลังใหญ่ ${big} หลัง · หลังเล็ก ${small} หลัง`;
  if (big) return `เช่าเต็นท์หลังใหญ่ ${big} หลัง`;
  return small ? `เช่าเต็นท์หลังเล็ก ${small} หลัง` : '';
};
// รายการที่เลือก เช่น ["Lagoon 1", "นำเต็นท์มาเอง 3 ท่าน", "เช่าเต็นท์หลังใหญ่ 1 หลัง · หลังเล็ก 1 หลัง"]
const itemNames = () => [
  ...selectedHouses().map((h) => h.name),
  tentGuests() ? `นำเต็นท์มาเอง ${tentGuests()} ท่าน` : '',
  rentLabel(),
].filter(Boolean);

// ---------- สร้างรายการบ้าน (แบบย่อ 1 แถวต่อหลัง) ----------
// แถว = รูปเล็ก + ชื่อ + พักได้กี่ท่าน · เตียง + ราคา + สถานะ + ปุ่ม "เลือก"
// กด "ดูรูป" → กางรูปหลายรูป (ปัดซ้ายขวา) และข้อมูลเต็มของหลังนั้น (กางได้ทีละหลัง)
const bedInfo = (h) => (h.features || []).find((f) => !/ห้องน้ำ/.test(f)) || '';
housesEl.innerHTML = HOUSES.map((h) => `
  <article class="house" id="house-${h.id}" data-house="${h.id}">
    <div class="house-row">
      <img class="house-thumb" src="${h.photos[0].src}" alt="${h.photos[0].alt}" loading="lazy">
      <div class="house-info">
        <div class="house-head"><h3>${h.name}</h3><span class="status"></span></div>
        <p class="house-meta">พักได้ ${h.guests} ท่าน${bedInfo(h) ? ` · ${bedInfo(h)}` : ''}</p>
        <p class="house-price"><b>${baht(h.price)}</b> บาท/คืน</p>
      </div>
      <div class="house-actions">
        <button class="more" type="button" aria-expanded="false" aria-controls="more-${h.id}">ดูรูป</button>
        <button class="pick" type="button" data-pick="${h.id}" aria-pressed="false" aria-label="เลือก ${h.name}">เลือก</button>
      </div>
    </div>
    <div class="house-more" id="more-${h.id}" hidden>
      <div class="slides" role="region" tabindex="0" aria-label="รูป ${h.name} ปัดซ้ายขวาเพื่อดูรูปถัดไป">
        ${h.photos.map((p) => `<img src="${p.src}" alt="${p.alt}" loading="lazy">`).join('')}
      </div>
      <div class="slide-nav">
        <button type="button" data-step="-1" aria-label="รูปก่อนหน้า">‹</button>
        <span class="dots">${h.photos.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</span>
        <button type="button" data-step="1" aria-label="รูปถัดไป">›</button>
      </div>
      <p class="house-type">${h.type}</p>
      <ul class="house-feats">
        <li>${ICON.guests}พักได้ ${h.guests} ท่าน</li>
        ${(h.features || []).map((f) => `<li>${/ห้องน้ำ/.test(f) ? ICON.bath : ICON.bed}${f}</li>`).join('')}
      </ul>
    </div>
  </article>`).join('');

// ---------- ป้ายบ้านบนแผนผัง (แนวตั้ง จากบนลงล่าง) ----------
// ลำดับบ้านริมน้ำจากบนลงล่าง — ถ้าลำดับจริงต่างจากนี้ สลับรหัสบ้านในรายการนี้ได้เลย (ตำแหน่งบนภาพขยับตามเอง)
// ภูมิยืนยันลำดับนี้แล้ว 10 ต.ค. 2569
const MAP_ORDER = ['lagoon-1', 'lagoon-2', 'lagoon-3', 'family-1', 'family-2', 'studio'];
const MAP_TOP = 6;   // % จากขอบบนของแผนผัง ถึงป้ายบ้านหลังแรก
const MAP_STEP = 12.6; // % ระยะห่างระหว่างป้ายบ้าน
const MAP_X = ['24%', '21%', '25%', '23%', '20%', '24%']; // ระยะจากขอบซ้าย (ให้ป้ายเรียงตามแนวตลิ่งที่โค้ง)
$('#map-pins').innerHTML = MAP_ORDER.map((id, i) => {
  const h = HOUSES.find((x) => x.id === id);
  if (!h) return '';
  return `<button class="m" type="button" data-house="${h.id}" style="--y:${MAP_TOP + i * MAP_STEP}%;--x:${MAP_X[i % MAP_X.length]}">
    <img src="${h.photos[0].src}" alt="" loading="lazy">
    <span class="pin-text"><b>${h.name.replace('Lagoon Family', 'Family').replace('Lagoon Studio', 'Studio')}</b><span class="st"></span></span>
    <span class="tick" aria-hidden="true">✓</span>
  </button>`;
}).join('');

// กาง/ย่อรายละเอียดบ้าน (กางหลังใหม่ → หลังอื่นย่อเก็บ ให้หน้าไม่ยาวเกิน)
function expandHouse(id, open = true) {
  housesEl.querySelectorAll('.house').forEach((card) => {
    const on = open && card.dataset.house === id;
    card.querySelector('.house-more').hidden = !on;
    card.querySelector('.more').setAttribute('aria-expanded', String(on));
    card.querySelector('.more').textContent = on ? 'ซ่อนรูป' : 'ดูรูป';
    card.classList.toggle('is-open', on);
  });
}
housesEl.addEventListener('click', (e) => {
  const more = e.target.closest('.more');
  if (more) {
    const id = more.closest('.house').dataset.house;
    expandHouse(id, more.getAttribute('aria-expanded') !== 'true');
    return;
  }
  // ปุ่ม "เลือก" / "✓ เลือกแล้ว"
  const pick = e.target.closest('[data-pick]');
  if (pick && !pick.disabled) {
    const id = pick.dataset.pick;
    state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
    render();
  }
});

// ปุ่มเลื่อนรูป + จุดบอกตำแหน่งรูป
housesEl.querySelectorAll('.house').forEach((card) => {
  const slides = card.querySelector('.slides');
  const dots = card.querySelectorAll('.dots i');
  card.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => slides.scrollBy({ left: slides.clientWidth * Number(btn.dataset.step), behavior: 'smooth' }));
  });
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    dots.forEach((d, j) => d.classList.toggle('on', i === j));
  }, { passive: true });
});

// ---------- อัปเดตหน้าจอทุกครั้งที่เปลี่ยนวัน/เลือกบ้าน ----------
function render() {
  const dated = hasDates() && !state.loading && !state.loadError;

  HOUSES.forEach((h) => {
    const booked = dated && isBooked(h.id, state.checkin, state.checkout);
    if (booked) state.selected.delete(h.id);
    const picked = state.selected.has(h.id);

    const card = $(`#house-${h.id}`);
    card.classList.toggle('is-booked', booked);
    card.classList.toggle('is-picked', picked);
    card.querySelector('.status').textContent = !dated ? '' : booked ? 'ถูกจองแล้ว' : 'ว่าง';
    const btn = card.querySelector('.pick');
    btn.setAttribute('aria-pressed', String(picked));
    btn.textContent = picked ? '✓ เลือกแล้ว' : 'เลือก';
    btn.disabled = !dated || booked;
    btn.setAttribute('aria-label', `${picked ? 'เลือกแล้ว' : 'เลือก'} ${h.name}${booked ? ' (ถูกจองแล้ว)' : ''}`);

    const marker = document.querySelector(`.m[data-house="${h.id}"]`);
    if (!marker) return; // บ้านที่ไม่อยู่ใน MAP_ORDER จะไม่มีป้ายบนแผนผัง
    marker.classList.toggle('is-booked', booked);
    marker.classList.toggle('is-selected', picked);
    marker.setAttribute('aria-pressed', String(picked));
    // ป้ายใต้ชื่อบ้านบนแผนผัง: ถูกจอง → "ถูกจองแล้ว" · เลือกแล้ว → "เลือกแล้ว" · ว่าง/ยังไม่เลือกวัน → ราคาต่อคืน
    const price = `${baht(h.price)} บาท/คืน`;
    marker.setAttribute('aria-label', `${h.name}${booked ? ' ถูกจองแล้ว' : picked ? ' เลือกแล้ว' : dated ? ' ว่าง' : ''}${booked ? '' : ` ${price}`}`);
    marker.querySelector('.st').textContent = booked ? 'ถูกจองแล้ว' : picked ? 'เลือกแล้ว' : price;
  });

  $('#nights').innerHTML = state.loading ? 'กำลังเช็กวันว่าง…'
    : state.loadError ? `เช็กวันว่างไม่สำเร็จ กรุณาลองใหม่ หรือโทรจอง ${PHONE} <button type="button" class="retry" data-retry>ลองอีกครั้ง</button>`
    : dated ? `${thaiDate(state.checkin)} – ${thaiDate(state.checkout)} · <b>${nights()} คืน</b>`
    : (state.checkin && state.checkout ? dateProblem() : 'เลือกวันเข้าพักก่อน แล้วกดเลือกบ้านที่ว่าง');
  // วันที่ใช้ไม่ได้ (พิมพ์ย้อนหลัง/วันนี้หลัง 18:00/เช็กเอาต์ไม่หลังเช็กอิน) → บอกใต้ช่องวันที่ด้วย
  const dateNote = $('#date-note');
  dateNote.textContent = state.checkin && state.checkout ? dateProblem() : '';
  dateNote.hidden = !dateNote.textContent;
  renderCal();

  // ปุ่มลัด 3 แบบที่พัก + ลานเต็นท์บนแผนผัง: ขึ้นสถานะ "เลือกแล้ว" ตามที่เลือกอยู่
  const tentsOn = tentGuests() > 0 || rentCount() > 0;
  $('.tent-spot').classList.toggle('is-picked', tentsOn);
  $('.tp-house')?.classList.toggle('on', state.selected.size > 0);
  $('.tp-own')?.classList.toggle('on', tentGuests() > 0);
  $('.tp-rent')?.classList.toggle('on', rentCount() > 0);

  $('#bar').hidden = !hasItems() || $('#step-pick').hidden;
  if (hasItems()) {
    // บรรทัดแรก = รายการ (ยาวเกินตัดด้วย …) บรรทัดสอง = ยอดรวม (เห็นเสมอ)
    $('#bar-text').innerHTML = `<span class="bar-items">${itemNames().join(', ')}</span><b>${nights()} คืน · รวม ${baht(total())} บาท</b>`;
  }
  syncBarHeight();
}

// เว้นที่ท้ายหน้าเท่าความสูงจริงของแถบสรุปด้านล่าง (ไม่ให้บังท้ายเว็บ) — ค่าสำรองใน CSS คือ 110px
const barEl = $('#bar');
function syncBarHeight() {
  if (!barEl.hidden && barEl.offsetHeight) document.documentElement.style.setProperty('--bar-h', `${barEl.offsetHeight}px`);
}
new ResizeObserver(syncBarHeight).observe(barEl);

// ปุ่ม "ลองอีกครั้ง" ตอนโหลดวันว่างไม่สำเร็จ
$('#nights').addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) loadBookings(); });

// ---------- ปุ่ม − / + ของเต็นท์ ----------
document.querySelectorAll('[data-qty]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.qty);
    input.value = Math.min(Number(input.max), Math.max(0, (Number(input.value) || 0) + Number(btn.dataset.d)));
    render();
  });
});
// พิมพ์ตัวเลขเอง: คำนวณทันที และพอออกจากช่อง ปรับตัวเลขในช่องให้อยู่ระหว่าง 0 ถึงค่าสูงสุด
['#tent-guests', '#tent-rent', '#tent-rent-s'].forEach((sel) => {
  const input = $(sel);
  input.addEventListener('input', render);
  input.addEventListener('change', () => {
    input.value = qty(sel, Number(input.max));
    render();
  });
});

// ---------- เลือกวัน ----------
// หลัง SAME_DAY_CUTOFF น. (เวลาไทย) ปิดรับจองเข้าพักวันนี้ทางเว็บ ให้โทรจองแทน — ต้องตรงกับ Code.gs
const bangkokHour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Bangkok' }).format(new Date()));
const firstDay = bangkokHour >= SAME_DAY_CUTOFF ? addDays(today, 1) : today;
if (firstDay !== today) {
  $('#late-note').hidden = false;
  $('#late-note').innerHTML = `หลัง ${SAME_DAY_CUTOFF}:00 น. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาโทร <a href="tel:+66819304969">${PHONE}</a> หรือทัก <a href="https://line.me/R/ti/p/${LINE_ID}" target="_blank" rel="noopener">LINE ${LINE_ID}</a>`;
}
checkinEl.min = firstDay;
checkoutEl.min = addDays(firstDay, 1);
// ค่าเริ่มต้น: เข้าพักวันแรกที่จองได้ (ปกติ = วันนี้) ออกวันถัดไป (ลูกค้าเปลี่ยนเองได้)
state.checkin = checkinEl.value = firstDay;
state.checkout = checkoutEl.value = addDays(firstDay, 1);
checkinEl.addEventListener('change', () => {
  state.checkin = checkinEl.value;
  // พิมพ์วันที่ก่อนวันแรกที่จองได้ (ย้อนหลัง / วันนี้หลัง 18:00) → ไม่รับ: ขึ้นข้อความใต้ช่องวันที่ (dateProblem)
  // เลือกบ้าน/ไปขั้นถัดไปไม่ได้จนกว่าจะแก้ · ไม่แก้ค่าในช่องให้เอง (ระหว่างพิมพ์ปี ค่าจะเป็นปีแปลกๆ ชั่วคราว)
  if (state.checkin && state.checkin >= firstDay) {
    checkoutEl.min = addDays(state.checkin, 1);
    // ถ้ายังไม่เลือกวันออก หรือวันออกอยู่ก่อนวันเข้า ให้ตั้งเป็นอีก 1 คืน
    if (!state.checkout || state.checkout <= state.checkin) {
      state.checkout = checkoutEl.value = addDays(state.checkin, 1);
    }
    showMonthOf(state.checkin);
  }
  calNext = 'in';
  render();
});
checkoutEl.addEventListener('change', () => { state.checkout = checkoutEl.value; calNext = 'in'; render(); });

// ---------- ปฏิทินวันว่าง (ใต้ช่องเช็กอิน/เช็กเอาต์) ----------
// 1 ช่อง = 1 คืน (วันที่นั้น → วันถัดไป) · ตัวเลขใต้วันที่ = บ้านที่ยังว่างคืนนั้น นับจากการจองที่โหลดมา (BOOKINGS)
// ลานกางเต็นท์ไม่จำกัดจำนวน จึงนับเฉพาะบ้าน · มือถือโชว์ทีละ 1 เดือน จอกว้างโชว์ 2 เดือน
// แตะวันแรก = เช็กอิน แล้วแตะวันที่หลังกว่า = เช็กเอาต์ (แตะวันที่ก่อนหรือเท่าวันเช็กอิน = เปลี่ยนวันเช็กอินใหม่)
const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const CAL_MAX_AHEAD = 12;          // เลื่อนดูล่วงหน้าได้ 12 เดือน
const calEl = $('#cal-months');
const calWide = window.matchMedia('(min-width: 720px)');
const firstMonth = firstDay.slice(0, 7); // 'YYYY-MM' เดือนแรกที่จองได้ (ย้อนไปเดือนก่อนหน้าไม่ได้)
let calOffset = 0;   // เดือนแรกที่โชว์ = firstMonth + calOffset
let calNext = 'in';  // แตะครั้งถัดไปเป็นวันเช็กอิน ('in') หรือวันเช็กเอาต์ ('out')
let calFocus = '';   // วันที่ที่กดปุ่ม Tab แล้วเข้ามาที่ปฏิทินจะโฟกัส (ลูกศรเลื่อนไปวันอื่น)

const monthAdd = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthDiff = (a, b) => { const [ay, am] = a.split('-').map(Number); const [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); };
const calCount = () => 1; // เจ้าของขอให้แสดงเดือนเดียวทุกขนาดจอ
const calMonths = () => Array.from({ length: calCount() }, (_, i) => monthAdd(firstMonth, calOffset + i));
const thaiMonth = (ym) => `${TH_MONTHS[Number(ym.slice(5)) - 1]} ${Number(ym.slice(0, 4)) + 543}`;
const shortThai = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${TH_DOW[d.getDay()]} ${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`; };
// บ้านว่างกี่หลังในคืนวันที่ iso (ยังโหลดไม่เสร็จ/โหลดไม่สำเร็จ = null ไม่โชว์ตัวเลข)
const freeOn = (iso) => (state.loading || state.loadError ? null : HOUSES.filter((h) => !isBooked(h.id, iso, addDays(iso, 1))).length);
// เลื่อนปฏิทินให้เห็นเดือนของวันที่ iso (ถ้ายังไม่เห็น)
function showMonthOf(iso) {
  const ym = iso.slice(0, 7);
  if (calMonths().includes(ym)) return;
  calOffset = Math.min(CAL_MAX_AHEAD, Math.max(0, monthDiff(firstMonth, ym)));
}

function monthHTML(ym) {
  const [y, m] = ym.split('-').map(Number);
  const startDow = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const total = HOUSES.length;
  const cells = TH_DOW.map((d) => `<span class="cal-dow" aria-hidden="true">${d}</span>`);
  for (let i = 0; i < startDow; i++) cells.push('<span class="cal-pad" aria-hidden="true"></span>');
  for (let day = 1; day <= days; day++) {
    const iso = `${ym}-${pad(day)}`;
    const dow = (startDow + day - 1) % 7;
    const past = iso < firstDay;
    const free = past ? null : freeOn(iso);
    const lvl = free === null ? '' : free === 0 ? 'full' : free === total ? 'all' : 'some';
    const isIn = iso === state.checkin && !past; // พิมพ์วันย้อนหลังในช่อง → ไม่ไฮไลต์วันที่จองไม่ได้
    const isOut = hasDates() && iso === state.checkout;
    const inRange = hasDates() && iso > state.checkin && iso < state.checkout;
    const cls = ['cal-day', lvl && `is-${lvl}`, (dow === 5 || dow === 6) && 'is-wknd', isIn && 'is-start', isOut && 'is-end', inRange && 'in-range', iso === today && 'is-today'].filter(Boolean).join(' ');
    const label = [
      shortThai(iso),
      past ? 'จองทางเว็บไม่ได้' : free === null ? '' : free === 0 ? 'เต็มทุกหลัง' : `ว่าง ${free} จาก ${total} หลัง`,
      isIn ? 'วันเช็กอิน' : '', isOut ? 'วันเช็กเอาต์' : '', inRange ? 'อยู่ในช่วงที่เลือก' : '',
    ].filter(Boolean).join(' ');
    const mark = free === null ? '' : `<span class="cal-free" aria-hidden="true">${free === 0 ? 'เต็ม' : `${free}/${total}`}</span>`;
    cells.push(`<button type="button" class="${cls}" data-date="${iso}" aria-label="${label}" aria-pressed="${isIn || isOut}" tabindex="${iso === calFocus ? 0 : -1}"${past ? ' disabled' : ''}><span class="cal-num">${day}</span>${mark}</button>`);
  }
  return `<div class="cal-month" role="group" aria-label="${thaiMonth(ym)}"><p class="cal-mname" aria-hidden="true">${thaiMonth(ym)}</p><div class="cal-grid">${cells.join('')}</div></div>`;
}

function renderCal() {
  const months = calMonths();
  const shown = (iso) => iso && iso >= firstDay && months.includes(iso.slice(0, 7));
  // วันที่ที่รับโฟกัสจากปุ่ม Tab: วันที่เพิ่งกด/เลื่อนด้วยลูกศร → วันเช็กอิน → วันแรกที่จองได้ของเดือนที่โชว์
  if (!shown(calFocus)) calFocus = shown(state.checkin) ? state.checkin : (months[0] === firstMonth ? firstDay : `${months[0]}-01`);
  calEl.innerHTML = months.map(monthHTML).join('');
  calEl.classList.toggle('two', months.length > 1);
  $('#cal-title').textContent = months.map(thaiMonth).join(' – ');
  $('#cal-prev').disabled = calOffset <= 0;
  $('#cal-next').disabled = calOffset >= CAL_MAX_AHEAD;
  $('#cal-status').textContent = state.loading ? 'กำลังโหลดวันว่าง…'
    : state.loadError ? 'โหลดวันว่างไม่สำเร็จ ยังเลือกวันได้ตามปกติ'
    : ''; // เจ้าของขอเอาข้อความแนะนำ "แตะวันที่…" ออก (เหลือแค่ตอนโหลด/โหลดไม่สำเร็จ)
  // มีคืนในช่วงที่เลือกที่บ้านเต็มทุกหลัง → บอกให้รู้ (บ้านที่ถูกจองยังขึ้น "ถูกจองแล้ว" ตามเดิม)
  let full = false;
  if (hasDates()) for (let d = state.checkin; d < state.checkout && !full; d = addDays(d, 1)) full = freeOn(d) === 0;
  $('#full-note').hidden = !full;
}

calEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-date]');
  if (!b || b.disabled) return;
  const d = b.dataset.date;
  if (calNext === 'out' && d > state.checkin) {
    state.checkout = d;
    calNext = 'in';
  } else {
    state.checkin = d;
    // วันเช็กเอาต์เดิมใช้ไม่ได้แล้ว → ตั้งเป็นอีก 1 คืนไว้ก่อน (แตะวันถัดไปเพื่อเปลี่ยน)
    if (!state.checkout || state.checkout <= d) state.checkout = addDays(d, 1);
    calNext = 'out';
  }
  checkinEl.value = state.checkin;
  checkoutEl.value = state.checkout;
  checkoutEl.min = addDays(state.checkin, 1);
  calFocus = d;
  render();
  calEl.querySelector(`[data-date="${d}"]`)?.focus({ preventScroll: true });
});
// ลูกศรซ้าย/ขวา = วันก่อน/ถัดไป · ขึ้น/ลง = สัปดาห์ก่อน/ถัดไป (เลื่อนเดือนให้เองถ้าเลยเดือนที่โชว์)
calEl.addEventListener('keydown', (e) => {
  const b = e.target.closest('[data-date]');
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  if (!b || !step) return;
  const d = addDays(b.dataset.date, step);
  if (d < firstDay || monthDiff(firstMonth, d.slice(0, 7)) > CAL_MAX_AHEAD + calCount() - 1) return;
  e.preventDefault();
  if (!calMonths().includes(d.slice(0, 7))) calOffset = Math.min(CAL_MAX_AHEAD, Math.max(0, calOffset + Math.sign(step)));
  calFocus = d;
  renderCal();
  calEl.querySelector(`[data-date="${d}"]`)?.focus();
});
$('#cal-prev').addEventListener('click', () => { calOffset = Math.max(0, calOffset - 1); renderCal(); });
$('#cal-next').addEventListener('click', () => { calOffset = Math.min(CAL_MAX_AHEAD, calOffset + 1); renderCal(); });
calWide.addEventListener('change', renderCal);
showMonthOf(state.checkin);

// ---------- แตะบ้านบนแผนผัง → เลือก/ยกเลิกบ้านหลังนั้นได้เลย (เหมือนกดปุ่ม "เลือก" ในรายการบ้าน) ----------
// ยังเลือกไม่ได้ (ยังไม่เลือกวัน หรือหลังนั้นถูกจองแล้ว) → เลื่อนไปที่แถวบ้านหลังนั้น และกางรูป/รายละเอียดให้แทน
document.querySelectorAll('.m').forEach((marker) => {
  const id = marker.dataset.house;
  const open = () => {
    expandHouse(id);
    const card = $(`#house-${id}`);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1200);
  };
  // เป็น <button> อยู่แล้ว กด Enter/Space ได้เอง ไม่ต้องดักคีย์บอร์ดเพิ่ม
  marker.addEventListener('click', () => {
    const pick = $(`#house-${id} .pick`);
    if (pick.disabled) { open(); return; }
    state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
    render();
  });
});

// ---------- ปุ่ม/ลิงก์ที่มี data-jump (ปุ่มลัด 3 แบบที่พัก, ลานเต็นท์บนแผนผัง) → เลื่อนไปที่เป้าหมาย + ไฮไลต์ชั่วครู่ ----------
// data-focus = ช่องตัวเลขที่จะโฟกัสปุ่ม "+" ข้างๆ ให้ (ไม่โฟกัสช่องพิมพ์ เพื่อไม่ให้แป้นพิมพ์มือถือเด้งขึ้นมา)
// ระยะเว้นด้านบน (กันเมนูบังหัวการ์ด) ตั้งไว้ที่ scroll-margin-top ใน css/booking.css
function flash(el, ms = 1200) {
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), ms);
}
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-jump]');
  if (!link) return;
  const target = $(link.dataset.jump);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  flash(target);
  if (link.dataset.focus) {
    const plus = document.querySelector(`[data-qty="${link.dataset.focus}"][data-d="1"]`);
    if (plus) plus.focus({ preventScroll: true });
  }
});
// ราคาเริ่มต้นบ้านบนปุ่มลัด: คำนวณจากรายการบ้านด้านบน (แก้ราคาบ้านแล้วปุ่มนี้เปลี่ยนตาม)


// ---------- มาจากลิงก์ในหน้าราคา/หน้าแรก (เช่น booking.html#house-family-1 หรือ booking.html#tents) → เลื่อนไปที่การ์ดนั้น ----------
const linked = (location.hash.startsWith('#house-') || location.hash === '#tents') && document.getElementById(location.hash.slice(1));
if (linked) {
  if (linked.classList.contains('house')) expandHouse(linked.dataset.house); // ลิงก์ไปบ้าน → กางรูปและรายละเอียดหลังนั้นให้เลย
  const jump = () => linked.scrollIntoView({ behavior: 'instant', block: 'start' });
  jump();
  window.addEventListener('load', jump, { once: true }); // เลื่อนซ้ำหลังโหลดเสร็จ เผื่อหน้ายังขยับอยู่
  linked.classList.add('flash');
  setTimeout(() => linked.classList.remove('flash'), 1600);
}

// ---------- สลับขั้นตอน (ปุ่มย้อนกลับของเบราว์เซอร์ใช้ได้) ----------
const STEPS = ['pick', 'details', 'done'];
function go(step, push = true) {
  STEPS.forEach((s) => { $(`#step-${s}`).hidden = s !== step; });
  // แถบขั้นตอน 1–2–3 ด้านบน: ขั้นที่ผ่านแล้วขึ้น ✓ ขั้นปัจจุบันเป็นสีเขียว
  const at = STEPS.indexOf(step);
  document.querySelectorAll('#steps li').forEach((li, i) => {
    li.classList.toggle('is-done', i < at);
    if (i === at) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  $('#bar').hidden = step !== 'pick' || !hasItems();
  updatePendingNote(step);
  // ขั้นชำระเงินใช้ #pay — รีโหลดหน้าแล้วเปิดหน้าชำระเงินจากที่จำไว้ได้
  if (push) history.pushState({ step }, '', step === 'pick' ? location.pathname : step === 'done' ? '#pay' : `#${step}`);
  window.scrollTo(0, 0);
  // ย้ายโฟกัสไปที่หัวข้อของขั้นตอนนั้น (โปรแกรมอ่านหน้าจอรู้ว่าเปลี่ยนหน้าแล้ว) โดยไม่ให้หน้ากระโดด
  $(`#step-${step} h1`).focus({ preventScroll: true });
}
window.addEventListener('popstate', (e) => {
  let step = e.state?.step || 'pick';
  // เปลี่ยนเป็น #pay เอง (พิมพ์/กดลิงก์ในหน้าเดิม) → เปิดหน้าชำระเงินจากการจองที่จำไว้
  if (!e.state && location.hash === '#pay') {
    const p = loadPending();
    if (p) { showPayment(p); step = 'done'; }
  }
  // ถ้าย้อนมาหน้ากรอกข้อมูลแต่ยังไม่ได้เลือกบ้าน/วัน ให้กลับไปหน้าเลือกบ้าน
  // ย้อน/ไปหน้าชำระเงินแต่ยังไม่มีข้อมูลการจองในหน้านี้ ก็กลับไปหน้าเลือกบ้านเช่นกัน
  const target = (step === 'details' && (!hasItems() || !hasDates())) || (step === 'done' && !payShown) ? 'pick' : step;
  // กดปุ่ม Forward ของเบราว์เซอร์มาหน้ากรอกข้อมูล → เตรียมสรุปและยอดเงินใหม่ให้ตรงกับที่เลือกล่าสุด
  if (target === 'details') prepDetails();
  go(target, false);
});
const startHash = location.hash; // จำไว้ก่อนล้าง (#pay = เปิดหน้าชำระเงินจากการจองที่จำไว้)
history.replaceState({ step: 'pick' }, '', location.pathname);

// สรุปรายการ + ยอดในตัวเลือกแบบชำระเงิน
function updateSummary() {
  const n = nights();
  const own = tentGuests();
  const rent = tentRentals();
  const rentS = tentRentalsSmall();
  $('#summary').innerHTML = `
    ${state.selected.size ? `<dt>บ้าน</dt><dd>${selectedHouses().map((h) => h.name).join(', ')}</dd>` : ''}
    ${own ? `<dt>นำเต็นท์มาเอง</dt><dd>${own} ท่าน × ${baht(TENT_PRICE)} บาท × ${n} คืน = ${baht(own * TENT_PRICE * n)} บาท</dd>` : ''}
    ${rent ? `<dt>เช่าเต็นท์หลังใหญ่</dt><dd>${rent} หลัง × ${baht(TENT_RENT)} บาท × ${n} คืน = ${baht(rent * TENT_RENT * n)} บาท</dd>` : ''}
    ${rentS ? `<dt>เช่าเต็นท์หลังเล็ก</dt><dd>${rentS} หลัง × ${baht(TENT_RENT_SMALL)} บาท × ${n} คืน = ${baht(rentS * TENT_RENT_SMALL * n)} บาท</dd>` : ''}
    <dt>เช็กอิน</dt><dd>${thaiDate(state.checkin)} (ตั้งแต่ 11:00)</dd>
    <dt>เช็กเอาต์</dt><dd>${thaiDate(state.checkout)} (ก่อน 12:00)</dd>
    <dt>รวม</dt><dd>${n} คืน · ${baht(total())} บาท</dd>`;
  document.querySelector('[data-amount="deposit"]').textContent = `${baht(Math.ceil(total() * DEPOSIT_RATE))} บาท`;
  document.querySelector('[data-amount="full"]').textContent = `${baht(total())} บาท`;
}

// เตรียมหน้ากรอกข้อมูล: ช่องจำนวนคน + ข้อความความจุ + สรุปรายการและยอดเงิน
function prepDetails() {
  // ช่อง "จำนวนคนพักในบ้าน" ใช้เฉพาะตอนจองบ้าน (จองแค่เต็นท์ จำนวนคนนับจากเต็นท์)
  // จองแค่เต็นท์ → ปิดช่องนี้ด้วย (disabled = ไม่ถูกเช็กและไม่ถูกส่ง) ค่าที่ค้างจากตอนเลือกบ้าน เช่น 35 จะไม่ขวางการจอง
  const withHouse = state.selected.size > 0;
  $('#guests-field').hidden = !withHouse;
  $('#guests-field input').required = withHouse;
  $('#guests-field input').disabled = !withHouse;
  const capacity = selectedHouses().reduce((sum, h) => sum + h.guests, 0);
  $('#capacity').textContent = withHouse ? `บ้านที่เลือกรองรับได้ ${capacity} ท่าน (มากกว่านี้ เพิ่มคนได้ คนละ ${EXTRA_PERSON} บาท มีที่นอนปิกนิกเสริม แจ้งทาง LINE หรือโทร ${PHONE} หรือย้อนกลับไปเพิ่มเต็นท์)` : '';
  updateSummary();
}

$('#to-details').addEventListener('click', () => {
  if (!hasItems()) return;
  if (!hasDates()) {
    // วันที่ยังใช้ไม่ได้ → เลื่อนขึ้นไปที่ช่องวันที่ ให้เห็นข้อความบอกเหตุผล (ไม่เงียบหาย)
    render();
    $('#date-note').textContent = dateProblem();
    $('#date-note').hidden = false;
    $('.dates').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  prepDetails();
  go('details');
});
document.querySelector('[data-back]').addEventListener('click', () => history.back());

// ---------- ยืนยันการจอง ----------
// ข้อความเมื่อ Google ตอบกลับว่ามีปัญหา (รหัสต้องตรงกับ google-apps-script/Code.gs)
// รหัสที่ไม่อยู่ในรายการนี้ จะขึ้นข้อความทั่วไปพร้อมเบอร์โทร
const SERVER_ERRORS = {
  bad_dates: 'วันที่ไม่ถูกต้อง กรุณาเลือกวันใหม่',
  too_long: 'จองได้สูงสุด 30 คืน',
  bad_phone: 'เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก เช่น 0812345678',
  bad_guests: 'จำนวนคนไม่ถูกต้อง',
  over_capacity: 'จำนวนคนเกินที่บ้านที่เลือกรับได้ กรุณาเลือกบ้านหรือเต็นท์เพิ่ม',
  bad_tent: 'จำนวนเต็นท์ไม่ถูกต้อง',
  bad_name: 'กรุณากรอกชื่อผู้จอง',
  bad_note: 'หมายเหตุยาวเกินไป (ไม่เกิน 500 ตัวอักษร)',
  bad_house: 'กรุณาเลือกบ้านหรือเต็นท์อย่างน้อย 1 อย่าง',
};
// ข้อความภาษาไทยของช่องที่ยังไม่ถูกต้อง (ไม่ใช้ข้อความของเบราว์เซอร์ ซึ่งอาจเป็นภาษาอังกฤษ)
function fieldProblem(el) {
  if (el.name === 'phone') return phoneProblem(el.value);
  if (el.name === 'name' && !el.value.trim()) return 'กรุณากรอกชื่อผู้จอง'; // เว้นวรรคล้วนก็ถือว่ายังไม่กรอก (Google ก็ปัดตก)
  const v = el.validity;
  if (v.valid) return '';
  if (el.name === 'name') return 'กรุณากรอกชื่อผู้จอง';
  if (el.name === 'guests') return v.valueMissing ? 'กรุณาใส่จำนวนคนพักในบ้าน' : `จำนวนคนพักในบ้านใส่ได้ ${el.min}–${el.max} ท่าน`;
  if (el.name === 'payType') return 'กรุณาเลือกแบบชำระเงิน (มัดจำ 50% หรือชำระเต็มจำนวน)';
  if (el.name === 'agree') return 'กรุณาติ๊กยอมรับเงื่อนไขการจองก่อนกดยืนยัน';
  if (el.name === 'note') return 'หมายเหตุยาวเกินไป (ไม่เกิน 500 ตัวอักษร)';
  return 'กรุณากรอกข้อมูลให้ครบถ้วน';
}
// เช็กฟอร์มก่อนส่ง: ช่องแรกที่ยังไม่ถูกต้อง → ข้อความภาษาไทยเหนือปุ่มยืนยันเสมอ + ฟองข้อความที่ช่องนั้น (ถ้ามองเห็นช่อง)
// ช่องที่ถูกซ่อนแต่ยังผิดอยู่ ก็ยังขึ้นข้อความ ไม่เงียบหายเหมือนก่อน
function formOk(form, errorEl) {
  const fields = [...form.elements].filter((el) => el.willValidate);
  fields.forEach((el) => el.setCustomValidity(''));
  const bad = fields.find((el) => fieldProblem(el));
  if (!bad) return true;
  const msg = fieldProblem(bad);
  errorEl.textContent = msg;
  bad.setCustomValidity(msg);
  if (!bad.closest('[hidden]')) bad.reportValidity(); // เลื่อนไปที่ช่องนั้น + ฟองข้อความภาษาไทย
  return false;
}
// แก้ช่องแล้ว → ล้างข้อความเดิม
$('#details-form').addEventListener('input', (e) => {
  if (e.target.setCustomValidity) e.target.setCustomValidity('');
});
$('#details-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = $('#form-error');
  errorEl.textContent = '';
  if (!formOk(form, errorEl)) return;
  const data = Object.fromEntries(new FormData(form));
  const phone = phoneForServer(data.phone);
  const houses = selectedHouses();
  if (!hasItems()) { go('pick'); return; }

  // คนเกินที่บ้านรับได้: เพิ่มคนได้คนละ 300 บาท (ที่นอนปิกนิกเสริม) แต่ต้องแจ้งแอดมิน — จองทางเว็บได้ไม่เกินที่บ้านรับได้
  const capacity = houses.reduce((sum, h) => sum + h.guests, 0);
  if (houses.length && Number(data.guests) > capacity) {
    errorEl.innerHTML = `บ้านที่เลือกพักได้สูงสุด ${capacity} ท่าน ถ้ามา ${Number(data.guests)} ท่าน เพิ่มคนได้ คนละ ${EXTRA_PERSON} บาท (มีที่นอนปิกนิกเสริม) กรุณาแจ้งทาง <a href="https://line.me/R/ti/p/${LINE_ID}" target="_blank" rel="noopener">LINE ${LINE_ID}</a> หรือโทร ${PHONE} (จองทางเว็บได้ไม่เกิน ${capacity} ท่าน) หรือย้อนกลับไปเลือกบ้านหรือเต็นท์เพิ่ม`;
    return;
  }
  // จำนวนคนในบ้าน (จองแค่เต็นท์ = 0) · คนทั้งหมด = ในบ้าน + นำเต็นท์มาเอง + เช่าเต็นท์ใหญ่/เล็ก (หลังละ 2 ท่าน)
  const houseGuests = houses.length ? Number(data.guests) : 0;
  const allGuests = houseGuests + tentGuests() + rentCount() * TENT_RENT_SLEEPS;

  // ยอดและเวลาชำระ: ถ้าต่อ Google Sheets จะใช้ตัวเลขที่ Google คำนวณ (ด้านล่าง)
  const payType = data.payType === 'full' ? 'full' : 'deposit';
  let id = '';
  let bookingTotal = total();
  let amountDue = payType === 'full' ? bookingTotal : Math.ceil(bookingTotal * DEPOSIT_RATE);
  let deadline = bangkokStamp(new Date(Date.now() + HOLD_HOURS * 3600000));
  if (API_URL) {
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'กำลังส่ง…';
    try {
      // ส่งแบบ text/plain เพื่อให้ Google Apps Script รับได้โดยไม่ติด CORS
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          houses: houses.map((h) => h.id),
          checkin: state.checkin,
          checkout: state.checkout,
          guests: houseGuests,
          tentGuests: tentGuests(),
          tentRentals: tentRentals(),
          tentRentalsSmall: tentRentalsSmall(),
          name: data.name.trim(),
          phone,
          note: data.note.trim(),
          payType,
          website: data.hp_extra, // ช่องลับกันบอท (ในหน้าเว็บชื่อ hp_extra แต่ส่งไป Google ในชื่อ website เหมือนเดิม)
        }),
      });
      const out = await res.json();
      if (out.error === 'booked') {
        const names = HOUSES.filter((h) => out.houses.includes(h.id)).map((h) => h.name).join(', ');
        alert(`ขออภัย ${names} เพิ่งถูกจองไปในวันที่เลือก กรุณาเลือกบ้านหรือวันใหม่`);
        out.houses.forEach((h) => state.selected.delete(h));
        await loadBookings();
        go('pick');
        return;
      }
      if (out.error === 'too_late') {
        errorEl.innerHTML = `หลัง ${SAME_DAY_CUTOFF}:00 น. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาโทร ${PHONE} หรือทัก LINE ${LINE_ID}`;
        return;
      }
      if (!out.ok) throw new Error(out.error);
      // รหัสหลอก LG000000-0000 = ระบบไม่ได้บันทึกการจองจริง → ถือว่าไม่สำเร็จ ไม่โชว์ QR ชำระเงิน
      if (out.id === 'LG000000-0000') throw new Error('fake_id');
      id = out.id;
      if (out.due) ({ total: bookingTotal, due: amountDue, deadline } = out);
    } catch (err) {
      errorEl.textContent = SERVER_ERRORS[err.message] || `ส่งการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือโทรจอง ${PHONE}`;
      return;
    } finally {
      btn.disabled = false;
      btn.textContent = 'ยืนยันการจอง';
    }
  }

  const summary = [
    houses.length ? `บ้าน: ${houses.map((h) => h.name).join(', ')} (${houseGuests} ท่าน)` : '',
    tentGuests() ? `นำเต็นท์มาเอง: ${tentGuests()} ท่าน` : '',
    tentRentals() ? `เช่าเต็นท์หลังใหญ่: ${tentRentals()} หลัง` : '',
    tentRentalsSmall() ? `เช่าเต็นท์หลังเล็ก: ${tentRentalsSmall()} หลัง` : '',
    `เช็กอิน: ${thaiDate(state.checkin)}`,
    `เช็กเอาต์: ${thaiDate(state.checkout)}`,
    `${nights()} คืน · รวม ${allGuests} ท่าน`,
    `ยอดรวม: ${baht(bookingTotal)} บาท`,
    `ชื่อ: ${data.name.trim()}`,
    `เบอร์: ${phone}`,
    data.note.trim() ? `หมายเหตุ: ${data.note.trim()}` : '',
  ].filter(Boolean).join('\n');
  const payLabel = payLabelOf(payType);
  // ข้อความที่ลูกค้าส่งเข้าแชต LINE พร้อมแนบสลิป (body = รายละเอียดการจองต่อท้าย)
  const lineMessage = (body) => [
    'ส่งสลิปการจอง The Lagoon 🏕️',
    id ? `รหัสการจอง: ${id}` : null,
    `${payLabel}: ${baht(amountDue)} บาท`,
    '(แนบรูปสลิปโอนเงินในแชตนี้)',
    '',
    body,
  ].filter((line) => line !== null).join('\n');
  const lineUrl = (body) => `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(lineMessage(body))}`;
  // รายการแบบย่อ (ไม่มีชื่อ/เบอร์) เช่น "Lagoon 1, เช่าเต็นท์หลังเล็ก 1 หลัง · ศ. 3 ต.ค. 2569 – ส. 4 ต.ค. 2569 (1 คืน)"
  const shortSummary = `${itemNames().join(', ')} · ${thaiDate(state.checkin)} – ${thaiDate(state.checkout)} (${nights()} คืน)`;

  // จำไว้ในหน้านี้ด้วย เพื่อให้บ้านขึ้นว่า "ถูกจองแล้ว" ทันที
  houses.forEach((h) => BOOKINGS.push({ house: h.id, from: state.checkin, to: state.checkout }));

  const pay = { id, due: amountDue, total: bookingTotal, payType, deadline, summary: shortSummary };
  // จำการจองไว้ในเครื่อง (เฉพาะการจองจริงที่มีรหัส) — ลิงก์ LINE ที่เก็บใช้รายการแบบย่อ ไม่มีชื่อ/เบอร์
  if (id) savePending({ ...pay, lineUrl: lineUrl(shortSummary), savedAt: Date.now() });

  // หน้าชำระเงิน (ตอนนี้ยังอยู่ในหน้าเดิม: ลิงก์ LINE และรายละเอียดใช้ข้อความเต็มที่มีชื่อ/เบอร์เหมือนเดิม)
  showPayment({ ...pay, lineUrl: lineUrl(summary), detail: (id ? `รหัสการจอง: ${id}\n` : '') + summary });

  state.selected.clear();
  $('#tent-guests').value = 0;
  $('#tent-rent').value = 0;
  $('#tent-rent-s').value = 0;
  form.reset();
  render();
  go('done');
});

// ---------- หน้าชำระเงิน (ใช้ทั้งตอนเพิ่งจองเสร็จ และตอนเปิดกลับมาจากการจองที่จำไว้) ----------
const payLabelOf = (payType) => (payType === 'full' ? 'ยอดชำระเต็มจำนวน' : 'ยอดมัดจำ 50%');
const PROMPTPAY_TEXT = PROMPTPAY.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3'); // 0909365562 → 090-936-5562
// 'yyyy-MM-dd HH:mm' → "ศ. 3 ต.ค. 2569 เวลา 20:00 น."
const deadlineThai = (deadline) => {
  const [dueDate, dueTime] = deadline.split(' ');
  return `${thaiDate(dueDate)} เวลา ${dueTime} น.`;
};
let payShown = null; // การจองที่โชว์อยู่ในหน้าชำระเงิน (ปุ่มบันทึกรูป/คัดลอกใช้ข้อมูลนี้)
let payTimer = 0;

// p = { id, due, total, payType, deadline, lineUrl, summary, detail? }
function showPayment(p) {
  payShown = p;
  const full = p.payType === 'full';
  $('#pay-id').textContent = p.id || '(โหมดทดลอง)';
  $('#pay-due-label').textContent = payLabelOf(p.payType);
  $('#pay-due').textContent = `${baht(p.due)} บาท`;
  $('#pay-rest').textContent = `${baht(p.total - p.due)} บาท — ชำระวันเช็กอิน (เงินสดหรือโอนหน้าเคาน์เตอร์)`;
  document.querySelectorAll('.pay-rest-row').forEach((el) => { el.hidden = full; });
  $('#pay-deadline').textContent = deadlineThai(p.deadline);
  // เงื่อนไขยกเลิก (เจ้าของยืนยัน 4 ต.ค. 2569): ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานพิจารณาเป็นรายกรณี)
  // ชำระเต็มจำนวน = มีมัดจำ 50% อยู่ในนั้น → ยกเลิก/ไม่มา คืนส่วนที่เกินมัดจำ = 50% ของยอดจอง (แอดมินโอนคืน)
  $('#pay-refund').textContent = full
    ? `ชำระเต็มจำนวน: ไม่ต้องจ่ายเพิ่มวันเช็กอิน · หากยกเลิกหรือไม่มาเข้าพัก ไม่คืนมัดจำ 50% แต่ได้รับเงินคืนส่วนที่เกินมัดจำ ${baht(Math.floor(p.total / 2))} บาท (50% ของยอดจอง) แอดมินโอนคืนให้ · งดใช้เสียงหลัง 22:00 น.`
    : 'หากยกเลิกหรือไม่มาเข้าพัก ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · งดใช้เสียงหลัง 22:00 น.';
  const qrBox = $('#pay-qr');
  const qr = makeQr(p.due);
  if (qr) {
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } else {
    qrBox.textContent = `โหลด QR ไม่สำเร็จ — โอนเข้าพร้อมเพย์ ${PROMPTPAY_TEXT} ยอด ${baht(p.due)} บาท`;
  }
  $('#save-qr').hidden = !qr;
  $('#done-text').textContent = p.detail || `${p.id ? `รหัสการจอง: ${p.id}\n` : ''}${p.summary}`;
  $('#line-link').href = p.lineUrl;
  $('#pay-tools-msg').textContent = '';
  $('#pay-copy-text').hidden = true;
  tickCountdown();
  clearInterval(payTimer);
  payTimer = setInterval(tickCountdown, 30000);
}

// QR พร้อมเพย์ตามยอด (ไลบรารี qrcode โหลดไม่สำเร็จ → null)
function makeQr(amount) {
  if (!window.qrcode) return null;
  const qr = qrcode(0, 'M');
  qr.addData(promptPayPayload(PROMPTPAY, amount));
  qr.make();
  return qr;
}

// เวลาที่เหลือก่อนหมดเวลาชำระ (อัปเดตทุก 30 วินาที) — หมดเวลาแล้วลบการจองที่จำไว้
function tickCountdown() {
  if (!payShown) return;
  const left = bangkokTime(payShown.deadline) - Date.now();
  const el = $('#pay-left');
  if (!(left > 0)) {
    el.textContent = '(หมดเวลาแล้ว)';
    if (payShown.id) dropPending();
    clearInterval(payTimer);
    return;
  }
  const mins = Math.ceil(left / 60000);
  const h = Math.floor(mins / 60);
  el.textContent = `(เหลืออีก ${h ? `${h} ชม. ` : ''}${mins % 60} นาที)`;
}

// ปุ่ม "บันทึกรูป QR": วาด QR + รหัสการจอง + ยอด + เวลาโอน ลงภาพเดียว แล้วดาวน์โหลดเป็น lagoon-<รหัส>.png
async function qrCanvas(p) {
  const qr = makeQr(p.due);
  if (!qr) return null;
  // รอฟอนต์ของเว็บโหลดเสร็จก่อน ไม่งั้นตัวหนังสือในรูปจะเป็นฟอนต์สำรอง
  try { await Promise.all([document.fonts.load('40px Chonburi'), document.fonts.load('600 28px Anuphan')]); } catch (err) { /* ใช้ฟอนต์สำรอง */ }
  const n = qr.getModuleCount();
  const cell = Math.floor(400 / (n + 4)); // ขนาดช่อง QR (รวมขอบขาว 2 ช่องรอบนอก ให้แอปธนาคารอ่านง่าย)
  const size = cell * (n + 4);
  const W = 640;
  const y0 = 136; // ขอบบนของ QR
  const H = y0 + size + 216;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbf9f4';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#2f4a36';
  ctx.font = '40px Chonburi, Anuphan, serif';
  ctx.fillText('The Lagoon', W / 2, 72);
  ctx.fillStyle = '#6b6a5f';
  ctx.font = '22px Anuphan, sans-serif';
  ctx.fillText(`พร้อมเพย์ ${PROMPTPAY_TEXT}`, W / 2, 110);

  // QR: กรอบขาว + ช่องดำทีละช่อง
  const x0 = (W - size) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x0, y0, size, size);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(x0 + (c + 2) * cell, y0 + (r + 2) * cell, cell, cell);
    }
  }

  let y = y0 + size + 52;
  ctx.fillStyle = '#1f231f';
  ctx.font = '600 26px Anuphan, sans-serif';
  ctx.fillText(`รหัสการจอง ${p.id || '(โหมดทดลอง)'}`, W / 2, y);
  y += 72;
  ctx.fillStyle = '#2f4a36';
  ctx.font = '600 60px Anuphan, sans-serif';
  ctx.fillText(`฿${baht(p.due)}`, W / 2, y);
  y += 48;
  ctx.fillStyle = '#b4462f';
  ctx.font = '600 24px Anuphan, sans-serif';
  ctx.fillText(`โอนภายใน ${deadlineThai(p.deadline)}`, W / 2, y);
  return canvas;
}

// ข้อความรายละเอียดสำหรับปุ่ม "คัดลอกรายละเอียด" (ไม่มีชื่อ/เบอร์)
const payText = (p) => [
  'The Lagoon Camping Resort',
  p.id ? `รหัสการจอง: ${p.id}` : null,
  p.summary,
  `${payLabelOf(p.payType)}: ${baht(p.due)} บาท`,
  `พร้อมเพย์: ${PROMPTPAY_TEXT}`,
  `ชำระภายใน: ${deadlineThai(p.deadline)}`,
].filter(Boolean).join('\n');

const toolsMsg = (text) => { $('#pay-tools-msg').textContent = text; };

$('#save-qr').addEventListener('click', async () => {
  if (!payShown) return;
  const canvas = await qrCanvas(payShown);
  if (!canvas) { toolsMsg(`สร้างรูปไม่สำเร็จ — โอนเข้าพร้อมเพย์ ${PROMPTPAY_TEXT} ยอด ${baht(payShown.due)} บาท`); return; }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `lagoon-${payShown.id || 'demo'}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  toolsMsg('บันทึกรูป QR แล้ว');
});

$('#copy-pay').addEventListener('click', async () => {
  if (!payShown) return;
  const text = payText(payShown);
  try {
    await navigator.clipboard.writeText(text);
    toolsMsg('คัดลอกรายละเอียดแล้ว');
    return;
  } catch (err) { /* ลองวิธีสำรองด้านล่าง */ }
  // วิธีสำรอง: ใส่ข้อความในกล่อง เลือกทั้งหมด แล้วสั่งคัดลอก · ไม่ได้อีก → โชว์กล่องให้กดค้างคัดลอกเอง
  const box = $('#pay-copy-text');
  box.value = text;
  box.hidden = false;
  box.focus();
  box.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
  if (copied) {
    box.hidden = true;
    toolsMsg('คัดลอกรายละเอียดแล้ว');
  } else {
    toolsMsg('คัดลอกอัตโนมัติไม่ได้ — กดค้างที่ข้อความด้านล่างเพื่อคัดลอก');
  }
});

// แถบบอก "มีการจองรอชำระ" ด้านบนหน้าจอง (โชว์เฉพาะขั้นเลือกบ้าน และยังไม่ได้กดซ่อน)
let pendingHidden = false;
function updatePendingNote(step = 'pick') {
  const note = $('#pending-note');
  const p = step === 'pick' && !pendingHidden ? loadPending() : null;
  note.hidden = !p;
  if (p) $('#pending-id').textContent = p.id;
}
function openPending() {
  const p = loadPending();
  if (!p) { updatePendingNote(); return; }
  showPayment(p);
  go('done');
}
$('#pending-open').addEventListener('click', openPending);
$('#pending-hide').addEventListener('click', () => { pendingHidden = true; updatePendingNote(); });

// ---------- โหลดวันว่างจาก Google Sheets ----------
async function loadBookings() {
  if (!API_URL) return;
  state.loading = true;
  render();
  try {
    const out = await (await fetch(API_URL)).json();
    if (!out.ok) throw new Error(out.error);
    BOOKINGS = out.bookings;
    state.loadError = false;
  } catch (err) {
    state.loadError = true;
  }
  state.loading = false;
  render();
}

document.querySelector('.demo-note').hidden = Boolean(API_URL);
render();
loadBookings();

// เปิดหน้าด้วย booking.html#pay (หรือรีโหลดตอนอยู่หน้าชำระเงิน) และมีการจองที่ยังไม่หมดเวลา → ไปหน้าชำระเงินเลย
// ไม่มี #pay → โชว์แถบ "คุณมีการจองรอชำระ" ด้านบนแทน
if ((startHash === '#pay' || startHash === '#done') && loadPending()) openPending();
else updatePendingNote();
