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
const TENT_RENT = 1300;      // เช่าเต็นท์ของรีสอร์ท บาท/หลัง/คืน (พร้อมเครื่องนอน 2 ชุด พัดลม ปลั๊ก) — ต้องตรงกับ Code.gs
const TENT_RENT_SLEEPS = 2;  // เต็นท์เช่า 1 หลังนอนได้ 2 ท่าน
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
// TODO: เปลี่ยนรูปตัวอย่างเป็นรูปจริงของแต่ละหลัง
const HOUSES = [
  {
    id: 'lagoon-1', name: 'Lagoon 1', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    features: ['1 เตียงใหญ่', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
    ],
  },
  {
    id: 'lagoon-2', name: 'Lagoon 2', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    features: ['1 เตียงใหญ่', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
    ],
  },
  {
    id: 'family-1', name: 'Lagoon Family 1', type: 'บ้านหลังกลาง', guests: 4, price: 2500,
    features: ['1 ห้องนอน 2 เตียง', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/kayak.jpg', alt: 'รูปตัวอย่าง: พายเรือแคนูในทะเลสาบ' },
      { src: 'img/sunset.jpg', alt: 'รูปตัวอย่าง: พระอาทิตย์ตกริมทะเลสาบ' },
    ],
  },
  {
    id: 'family-2', name: 'Lagoon Family 2', type: 'บ้านหลังใหญ่ · มีครัว', guests: 4, price: 3000,
    features: ['2 ห้องนอน (ห้องละ 1 เตียงใหญ่)', '2 ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
      { src: 'img/night.jpg', alt: 'รูปตัวอย่าง: ลานแคมป์ยามค่ำคืน' },
    ],
  },
  {
    id: 'studio', name: 'Lagoon Studio', type: 'บ้านหลังใหม่ สไตล์โมเดิร์น', guests: 2, price: 1500,
    features: ['2 เตียง', 'ห้องน้ำในตัว'],
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพัก' },
      { src: 'img/sunset.jpg', alt: 'รูปตัวอย่าง: พระอาทิตย์ตกริมทะเลสาบ' },
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

const hasDates = () => state.checkin && state.checkout && state.checkout > state.checkin;
const nights = () => (hasDates() ? nightsBetween(state.checkin, state.checkout) : 0);
const selectedHouses = () => HOUSES.filter((h) => state.selected.has(h.id));
// เต็นท์ (การ์ด "ลานกางเต็นท์" ใต้รายการบ้าน): นำมาเอง = จำนวนคน, เช่าของรีสอร์ท = จำนวนหลัง
const qty = (sel, max) => Math.min(max, Math.max(0, Math.floor(Number($(sel).value)) || 0));
const tentGuests = () => qty('#tent-guests', 30);
const tentRentals = () => qty('#tent-rent', 10);
const hasItems = () => state.selected.size > 0 || tentGuests() > 0 || tentRentals() > 0;
const perNight = () => selectedHouses().reduce((sum, h) => sum + h.price, 0) + tentGuests() * TENT_PRICE + tentRentals() * TENT_RENT;
const total = () => perNight() * nights();
// รายการที่เลือก เช่น ["Lagoon 1", "นำเต็นท์มาเอง 3 ท่าน", "เช่าเต็นท์ 1 หลัง"]
const itemNames = () => [
  ...selectedHouses().map((h) => h.name),
  tentGuests() ? `นำเต็นท์มาเอง ${tentGuests()} ท่าน` : '',
  tentRentals() ? `เช่าเต็นท์ ${tentRentals()} หลัง` : '',
].filter(Boolean);

// ---------- สร้างการ์ดบ้าน ----------
housesEl.innerHTML = HOUSES.map((h) => `
  <article class="house" id="house-${h.id}" data-house="${h.id}">
    <div class="slides" role="region" tabindex="0" aria-label="รูป ${h.name} ปัดซ้ายขวาเพื่อดูรูปถัดไป">
      ${h.photos.map((p) => `<img src="${p.src}" alt="${p.alt}" loading="lazy">`).join('')}
    </div>
    <div class="slide-nav">
      <button type="button" data-step="-1" aria-label="รูปก่อนหน้า">‹</button>
      <span class="dots">${h.photos.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</span>
      <button type="button" data-step="1" aria-label="รูปถัดไป">›</button>
    </div>
    <div class="house-head"><h3>${h.name}</h3><span class="status"></span></div>
    <p class="house-type">${h.type}</p>
    <ul class="house-feats">
      <li>${ICON.guests}พักได้ ${h.guests} ท่าน</li>
      ${(h.features || []).map((f) => `<li>${/ห้องน้ำ/.test(f) ? ICON.bath : ICON.bed}${f}</li>`).join('')}
    </ul>
    <p class="house-price"><b>${baht(h.price)}</b> บาท/คืน</p>
    <label class="pick"><input type="checkbox" value="${h.id}" aria-label="เลือก ${h.name}"><span>เลือกบ้านหลังนี้</span></label>
  </article>`).join('');

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
    card.querySelector('.status').textContent = !dated ? '' : booked ? 'ถูกจองแล้ว' : 'ว่าง';
    const box = card.querySelector('input');
    box.checked = picked;
    box.disabled = !dated || booked;

    const marker = document.querySelector(`.m[data-house="${h.id}"]`);
    marker.classList.toggle('is-booked', booked);
    marker.classList.toggle('is-selected', picked);
    marker.setAttribute('aria-pressed', String(picked));
    marker.setAttribute('aria-label', `${h.name}${booked ? ' ถูกจองแล้ว' : picked ? ' เลือกแล้ว' : dated ? ' ว่าง' : ''}`);
    marker.querySelector('.st').textContent = !dated ? '' : booked ? 'ถูกจองแล้ว' : picked ? 'เลือกแล้ว' : 'ว่าง';
  });

  $('#nights').innerHTML = state.loading ? 'กำลังเช็กวันว่าง…'
    : state.loadError ? `เช็กวันว่างไม่สำเร็จ กรุณาลองใหม่ หรือโทรจอง ${PHONE} <button type="button" class="retry" data-retry>ลองอีกครั้ง</button>`
    : dated ? `${thaiDate(state.checkin)} – ${thaiDate(state.checkout)} · <b>${nights()} คืน</b>`
    : (state.checkin && state.checkout ? 'วันเช็กเอาต์ต้องหลังวันเช็กอิน' : 'เลือกวันเข้าพักก่อน แล้วติ๊กเลือกบ้านที่ว่าง');

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
['#tent-guests', '#tent-rent'].forEach((sel) => {
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
  if (state.checkin) {
    checkoutEl.min = addDays(state.checkin, 1);
    // ถ้ายังไม่เลือกวันออก หรือวันออกอยู่ก่อนวันเข้า ให้ตั้งเป็นอีก 1 คืน
    if (!state.checkout || state.checkout <= state.checkin) {
      state.checkout = checkoutEl.value = addDays(state.checkin, 1);
    }
  }
  render();
});
checkoutEl.addEventListener('change', () => { state.checkout = checkoutEl.value; render(); });

// ---------- ติ๊กเลือกบ้าน ----------
housesEl.addEventListener('change', (e) => {
  if (e.target.type !== 'checkbox') return;
  e.target.checked ? state.selected.add(e.target.value) : state.selected.delete(e.target.value);
  render();
});

// ---------- กดบ้านบนแผนผัง → เลื่อนไปที่การ์ดบ้านหลังนั้น ----------
document.querySelectorAll('.m').forEach((marker) => {
  const open = () => {
    const card = $(`#house-${marker.dataset.house}`);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1200);
  };
  // เป็น <button> อยู่แล้ว กด Enter/Space ได้เอง ไม่ต้องดักคีย์บอร์ดเพิ่ม
  marker.addEventListener('click', open);
});

// ---------- ย่อแผนผังมุมสูง (วาดไว้กว้าง 800px) ให้พอดีความกว้างจอ ไม่เล็กกว่า 0.45 เท่า (เล็กกว่านั้นเลื่อนซ้ายขวาเอา) ----------
// ย่อเหลือน้อยกว่า 0.7 เท่า → ใส่คลาส is-small ให้ตัวหนังสือบนแผนผังใหญ่ขึ้น อ่านออกบนมือถือ
const aerialBox = $('.aerial-scroll');
// ยังเลื่อนไปทางขวาได้อีก → โชว์ขอบจางด้านขวาเป็นคำใบ้
const updateAerialHint = () => {
  const more = aerialBox.scrollWidth - aerialBox.clientWidth - aerialBox.scrollLeft > 2;
  aerialBox.classList.toggle('can-scroll', more);
};
const fitAerial = () => {
  const s = Math.max(0.45, Math.min(1, aerialBox.clientWidth / 800));
  aerialBox.style.setProperty('--s', s);
  aerialBox.classList.toggle('is-small', s < 0.7);
  updateAerialHint();
};
new ResizeObserver(fitAerial).observe(aerialBox);
aerialBox.addEventListener('scroll', updateAerialHint, { passive: true });
fitAerial();

// ---------- มาจากลิงก์ชื่อบ้านในหน้าราคา (เช่น booking.html#house-family-1) → เลื่อนไปที่การ์ดนั้น ----------
const linked = location.hash.startsWith('#house-') && document.getElementById(location.hash.slice(1));
if (linked) {
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
  $('#bar').hidden = step !== 'pick' || !hasItems();
  if (push) history.pushState({ step }, '', step === 'pick' ? location.pathname : `#${step}`);
  window.scrollTo(0, 0);
  // ย้ายโฟกัสไปที่หัวข้อของขั้นตอนนั้น (โปรแกรมอ่านหน้าจอรู้ว่าเปลี่ยนหน้าแล้ว) โดยไม่ให้หน้ากระโดด
  $(`#step-${step} h1`).focus({ preventScroll: true });
}
window.addEventListener('popstate', (e) => {
  const step = e.state?.step || 'pick';
  // ถ้าย้อนมาหน้ากรอกข้อมูลแต่ยังไม่ได้เลือกบ้าน/วัน ให้กลับไปหน้าเลือกบ้าน
  const target = step === 'details' && (!hasItems() || !hasDates()) ? 'pick' : step;
  // กดปุ่ม Forward ของเบราว์เซอร์มาหน้ากรอกข้อมูล → เตรียมสรุปและยอดเงินใหม่ให้ตรงกับที่เลือกล่าสุด
  if (target === 'details') prepDetails();
  go(target, false);
});
history.replaceState({ step: 'pick' }, '', location.pathname);

// สรุปรายการ + ยอดในตัวเลือกแบบชำระเงิน
function updateSummary() {
  const n = nights();
  const own = tentGuests();
  const rent = tentRentals();
  $('#summary').innerHTML = `
    ${state.selected.size ? `<dt>บ้าน</dt><dd>${selectedHouses().map((h) => h.name).join(', ')}</dd>` : ''}
    ${own ? `<dt>นำเต็นท์มาเอง</dt><dd>${own} ท่าน × ${baht(TENT_PRICE)} บาท × ${n} คืน = ${baht(own * TENT_PRICE * n)} บาท</dd>` : ''}
    ${rent ? `<dt>เช่าเต็นท์</dt><dd>${rent} หลัง × ${baht(TENT_RENT)} บาท × ${n} คืน = ${baht(rent * TENT_RENT * n)} บาท</dd>` : ''}
    <dt>เช็กอิน</dt><dd>${thaiDate(state.checkin)} (ตั้งแต่ 11:00)</dd>
    <dt>เช็กเอาต์</dt><dd>${thaiDate(state.checkout)} (ก่อน 12:00)</dd>
    <dt>รวม</dt><dd>${n} คืน · ${baht(total())} บาท</dd>`;
  document.querySelector('[data-amount="deposit"]').textContent = `${baht(Math.ceil(total() * DEPOSIT_RATE))} บาท`;
  document.querySelector('[data-amount="full"]').textContent = `${baht(total())} บาท`;
}

// เตรียมหน้ากรอกข้อมูล: ช่องจำนวนคน + ข้อความความจุ + สรุปรายการและยอดเงิน
function prepDetails() {
  // ช่อง "จำนวนคนพักในบ้าน" ใช้เฉพาะตอนจองบ้าน (จองแค่เต็นท์ จำนวนคนนับจากเต็นท์)
  const withHouse = state.selected.size > 0;
  $('#guests-field').hidden = !withHouse;
  $('#guests-field input').required = withHouse;
  const capacity = selectedHouses().reduce((sum, h) => sum + h.guests, 0);
  $('#capacity').textContent = withHouse ? `บ้านที่เลือกรองรับได้ ${capacity} ท่าน (มากกว่านี้ ทัก LINE ขอเสริมเตียง หรือย้อนกลับไปเพิ่มเต็นท์)` : '';
  updateSummary();
}

$('#to-details').addEventListener('click', () => {
  if (!hasItems() || !hasDates()) return;
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
$('#details-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = $('#form-error');
  errorEl.textContent = '';
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const houses = selectedHouses();
  if (!hasItems()) { go('pick'); return; }

  // คนเกินที่บ้านรับได้: ยังไม่มีราคาเสริมเตียง ให้ทักแอดมินก่อน (หรือเลือกบ้าน/เต็นท์เพิ่ม)
  const capacity = houses.reduce((sum, h) => sum + h.guests, 0);
  if (houses.length && Number(data.guests) > capacity) {
    errorEl.innerHTML = `บ้านที่เลือกพักได้สูงสุด ${capacity} ท่าน ถ้ามา ${Number(data.guests)} ท่าน กรุณาย้อนกลับไปเลือกบ้านหรือเต็นท์เพิ่ม หรือทัก <a href="https://line.me/R/ti/p/${LINE_ID}" target="_blank" rel="noopener">LINE ${LINE_ID}</a> / โทร ${PHONE} เพื่อขอเสริมเตียง`;
    return;
  }
  // จำนวนคนในบ้าน (จองแค่เต็นท์ = 0) · คนทั้งหมด = ในบ้าน + นำเต็นท์มาเอง + เช่าเต็นท์ (หลังละ 2 ท่าน)
  const houseGuests = houses.length ? Number(data.guests) : 0;
  const allGuests = houseGuests + tentGuests() + tentRentals() * TENT_RENT_SLEEPS;

  // ยอดและเวลาชำระ: ถ้าต่อ Google Sheets จะใช้ตัวเลขที่ Google คำนวณ (ด้านล่าง)
  const payType = data.payType === 'full' ? 'full' : 'deposit';
  let id = '';
  let bookingTotal = total();
  let amountDue = payType === 'full' ? bookingTotal : Math.ceil(bookingTotal * DEPOSIT_RATE);
  const dueAt = new Date(Date.now() + HOLD_HOURS * 3600000);
  let deadline = `${toISO(dueAt)} ${pad(dueAt.getHours())}:${pad(dueAt.getMinutes())}`;
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
          name: data.name.trim(),
          phone: data.phone.trim(),
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

  const [dueDate, dueTime] = deadline.split(' ');
  const deadlineText = `${thaiDate(dueDate)} เวลา ${dueTime} น.`;
  const summary = [
    houses.length ? `บ้าน: ${houses.map((h) => h.name).join(', ')} (${houseGuests} ท่าน)` : '',
    tentGuests() ? `นำเต็นท์มาเอง: ${tentGuests()} ท่าน` : '',
    tentRentals() ? `เช่าเต็นท์: ${tentRentals()} หลัง` : '',
    `เช็กอิน: ${thaiDate(state.checkin)}`,
    `เช็กเอาต์: ${thaiDate(state.checkout)}`,
    `${nights()} คืน · รวม ${allGuests} ท่าน`,
    `ยอดรวม: ${baht(bookingTotal)} บาท`,
    `ชื่อ: ${data.name.trim()}`,
    `เบอร์: ${data.phone.trim()}`,
    data.note.trim() ? `หมายเหตุ: ${data.note.trim()}` : '',
  ].filter(Boolean).join('\n');
  const payLabel = payType === 'full' ? 'ยอดชำระเต็มจำนวน' : 'ยอดมัดจำ 50%';
  // ข้อความที่ลูกค้าส่งเข้าแชต LINE พร้อมแนบสลิป
  const message = [
    'ส่งสลิปการจอง The Lagoon 🏕️',
    id ? `รหัสการจอง: ${id}` : null,
    `${payLabel}: ${baht(amountDue)} บาท`,
    '(แนบรูปสลิปโอนเงินในแชตนี้)',
    '',
    summary,
  ].filter((line) => line !== null).join('\n');

  // จำไว้ในหน้านี้ด้วย เพื่อให้บ้านขึ้นว่า "ถูกจองแล้ว" ทันที
  houses.forEach((h) => BOOKINGS.push({ house: h.id, from: state.checkin, to: state.checkout }));

  // หน้าชำระเงิน
  $('#pay-id').textContent = id || '(โหมดทดลอง)';
  $('#pay-due-label').textContent = payLabel;
  $('#pay-due').textContent = `${baht(amountDue)} บาท`;
  $('#pay-rest').textContent = `${baht(bookingTotal - amountDue)} บาท — ชำระวันเช็กอิน (เงินสดหรือโอนหน้าเคาน์เตอร์)`;
  document.querySelectorAll('.pay-rest-row').forEach((el) => { el.hidden = payType === 'full'; });
  $('#pay-deadline').textContent = deadlineText;
  $('#pay-refund').textContent = payType === 'full'
    ? `ชำระเต็มจำนวน: หากยกเลิกหรือไม่มาเข้าพัก รับเงินคืน 50% ของยอดจอง (${baht(Math.floor(bookingTotal / 2))} บาท) แอดมินจะโอนคืนให้`
    : 'มัดจำ 50%: หากยกเลิกหรือไม่มาเข้าพัก ไม่คืนเงินมัดจำ';
  const qrBox = $('#pay-qr');
  if (window.qrcode) {
    const qr = qrcode(0, 'M');
    qr.addData(promptPayPayload(PROMPTPAY, amountDue));
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  } else {
    qrBox.textContent = `โหลด QR ไม่สำเร็จ — โอนเข้าพร้อมเพย์ 090-936-5562 ยอด ${baht(amountDue)} บาท`;
  }
  $('#done-text').textContent = (id ? `รหัสการจอง: ${id}\n` : '') + summary;
  $('#line-link').href = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(message)}`;

  state.selected.clear();
  $('#tent-guests').value = 0;
  $('#tent-rent').value = 0;
  form.reset();
  render();
  go('done');
});

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
