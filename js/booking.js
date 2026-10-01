// =========================================================
// หน้าจองที่พัก
// - ถ้าใส่ API_URL: อ่านวันว่างและบันทึกการจองลง Google Sheets
// - ถ้าเว้น API_URL ว่าง: โหมดทดลอง ใช้การจองตัวอย่าง และจำไว้แค่จนกว่าจะรีเฟรชหน้า
// =========================================================

// ลิงก์ Web App จาก Google Apps Script (ดูวิธีได้ในไฟล์ SETUP-GOOGLE-SHEETS.md)
const API_URL = 'https://script.google.com/macros/s/AKfycbyCUEb3YTKm6_LoUal5cvBmZZR_-fhcYULSRiH2WDNnSgPOlHGDjqgYY8-Y7ID8rUvWVg/exec';

const LINE_ID = '@477nvamb';
const PHONE = '081-930-4969';

// ---------- ข้อมูลบ้าน (แก้ชื่อ ราคา รูป ได้ตรงนี้) ----------
// TODO: เช็กกับเจ้าของ — Lagoon Studio มีกี่หลัง (ตอนนี้ใส่ 1)
// TODO: เปลี่ยนรูปตัวอย่างเป็นรูปจริงของแต่ละหลัง
const HOUSES = [
  {
    id: 'lagoon-1', name: 'Lagoon 1', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    photos: [
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
    ],
  },
  {
    id: 'lagoon-2', name: 'Lagoon 2', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
    ],
  },
  {
    id: 'lagoon-3', name: 'Lagoon 3', type: 'บ้านหลังเล็ก', guests: 2, price: 1300,
    photos: [
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
    ],
  },
  {
    id: 'studio', name: 'Lagoon Studio', type: 'บ้านหลังใหม่ สไตล์โมเดิร์น', guests: 2, price: 1500,
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพัก' },
      { src: 'img/sunset.jpg', alt: 'รูปตัวอย่าง: พระอาทิตย์ตกริมทะเลสาบ' },
    ],
  },
  {
    id: 'family-1', name: 'Lagoon Family 1', type: 'บ้านหลังกลาง · 1 ห้องนอน 1 ห้องน้ำ', guests: 4, price: 2500,
    photos: [
      { src: 'img/houses.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้ท่ามกลางสนามหญ้า' },
      { src: 'img/kayak.jpg', alt: 'รูปตัวอย่าง: พายเรือแคนูในทะเลสาบ' },
      { src: 'img/sunset.jpg', alt: 'รูปตัวอย่าง: พระอาทิตย์ตกริมทะเลสาบ' },
    ],
  },
  {
    id: 'family-2', name: 'Lagoon Family 2', type: 'บ้านหลังใหญ่ · 2 ห้องนอน 2 ห้องน้ำ · มีครัว', guests: 4, price: 3000,
    photos: [
      { src: 'img/house-orchid.jpg', alt: 'รูปตัวอย่าง: บ้านพักไม้' },
      { src: 'img/lake-view.jpg', alt: 'รูปตัวอย่าง: วิวทะเลสาบ' },
      { src: 'img/night.jpg', alt: 'รูปตัวอย่าง: ลานแคมป์ยามค่ำคืน' },
    ],
  },
];

// ---------- วันที่ ----------
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return toISO(d); };
const nightsBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const thaiDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const baht = (n) => n.toLocaleString('th-TH');
const today = toISO(new Date());

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
const total = () => selectedHouses().reduce((sum, h) => sum + h.price, 0) * nights();

// ---------- สร้างการ์ดบ้าน ----------
housesEl.innerHTML = HOUSES.map((h) => `
  <article class="house" id="house-${h.id}" data-house="${h.id}">
    <div class="slides" tabindex="0" aria-label="รูป ${h.name} ปัดซ้ายขวาเพื่อดูรูปถัดไป">
      ${h.photos.map((p) => `<img src="${p.src}" alt="${p.alt}" loading="lazy">`).join('')}
    </div>
    <div class="slide-nav">
      <button type="button" data-step="-1" aria-label="รูปก่อนหน้า">‹</button>
      <span class="dots">${h.photos.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</span>
      <button type="button" data-step="1" aria-label="รูปถัดไป">›</button>
    </div>
    <div class="house-head"><h3>${h.name}</h3><span class="status"></span></div>
    <p class="house-type">${h.type} · ${h.guests} ท่าน</p>
    <p class="house-price"><b>${baht(h.price)}</b> บาท/คืน</p>
    <label class="pick"><input type="checkbox" value="${h.id}"><span>เลือกบ้านหลังนี้</span></label>
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
    marker.setAttribute('aria-label', `${h.name}${booked ? ' ถูกจองแล้ว' : picked ? ' เลือกแล้ว' : ''}`);
  });

  $('#nights').innerHTML = state.loading ? 'กำลังเช็กวันว่าง…'
    : state.loadError ? `เช็กวันว่างไม่สำเร็จ กรุณารีเฟรชหน้า หรือโทรจอง ${PHONE}`
    : dated ? `${thaiDate(state.checkin)} – ${thaiDate(state.checkout)} · <b>${nights()} คืน</b>`
    : (state.checkin && state.checkout ? 'วันเช็กเอาต์ต้องหลังวันเช็กอิน' : 'เลือกวันเข้าพักก่อน แล้วติ๊กเลือกบ้านที่ว่าง');

  const count = state.selected.size;
  $('#bar').hidden = !count || $('#step-pick').hidden;
  if (count) {
    $('#bar-text').innerHTML = `${selectedHouses().map((h) => h.name).join(', ')}<br><b>${nights()} คืน · รวม ${baht(total())} บาท</b>`;
  }
}

// ---------- เลือกวัน ----------
checkinEl.min = today;
checkoutEl.min = addDays(today, 1);
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
  marker.addEventListener('click', open);
  marker.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

// ---------- สลับขั้นตอน (ปุ่มย้อนกลับของเบราว์เซอร์ใช้ได้) ----------
const STEPS = ['pick', 'details', 'done'];
function go(step, push = true) {
  STEPS.forEach((s) => { $(`#step-${s}`).hidden = s !== step; });
  $('#bar').hidden = step !== 'pick' || !state.selected.size;
  if (push) history.pushState({ step }, '', step === 'pick' ? location.pathname : `#${step}`);
  window.scrollTo(0, 0);
}
window.addEventListener('popstate', (e) => {
  const step = e.state?.step || 'pick';
  // ถ้าย้อนมาหน้ากรอกข้อมูลแต่ยังไม่ได้เลือกบ้าน ให้กลับไปหน้าเลือกบ้าน
  go(step === 'details' && !state.selected.size ? 'pick' : step, false);
});
history.replaceState({ step: 'pick' }, '', location.pathname);

$('#to-details').addEventListener('click', () => {
  if (!state.selected.size || !hasDates()) return;
  const capacity = selectedHouses().reduce((sum, h) => sum + h.guests, 0);
  $('#summary').innerHTML = `
    <dt>บ้าน</dt><dd>${selectedHouses().map((h) => h.name).join(', ')}</dd>
    <dt>เช็กอิน</dt><dd>${thaiDate(state.checkin)} (ตั้งแต่ 11:00)</dd>
    <dt>เช็กเอาต์</dt><dd>${thaiDate(state.checkout)} (ก่อน 12:00)</dd>
    <dt>รวม</dt><dd>${nights()} คืน · ${baht(total())} บาท</dd>`;
  $('#capacity').textContent = `บ้านที่เลือกรองรับได้ ${capacity} ท่าน`;
  go('details');
});
document.querySelector('[data-back]').addEventListener('click', () => history.back());

// ---------- ยืนยันการจอง ----------
$('#details-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = $('#form-error');
  errorEl.textContent = '';
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const houses = selectedHouses();
  if (!houses.length) { go('pick'); return; }

  let id = '';
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
          guests: Number(data.guests),
          name: data.name.trim(),
          phone: data.phone.trim(),
          note: data.note.trim(),
          total: total(),
          website: data.website, // ช่องลับกันบอท
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
      if (!out.ok) throw new Error(out.error);
      id = out.id;
    } catch (err) {
      errorEl.textContent = `ส่งการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือโทรจอง ${PHONE}`;
      return;
    } finally {
      btn.disabled = false;
      btn.textContent = 'ยืนยันการจอง';
    }
  }

  const message = [
    'ขอจองที่พัก The Lagoon 🏕️',
    id ? `รหัสการจอง: ${id}` : '',
    `บ้าน: ${houses.map((h) => h.name).join(', ')}`,
    `เช็กอิน: ${thaiDate(state.checkin)}`,
    `เช็กเอาต์: ${thaiDate(state.checkout)}`,
    `${nights()} คืน · ${data.guests} ท่าน`,
    `ยอดรวม: ${baht(total())} บาท`,
    `ชื่อ: ${data.name.trim()}`,
    `เบอร์: ${data.phone.trim()}`,
    data.note.trim() ? `หมายเหตุ: ${data.note.trim()}` : '',
  ].filter(Boolean).join('\n');

  // จำไว้ในหน้านี้ด้วย เพื่อให้บ้านขึ้นว่า "ถูกจองแล้ว" ทันที
  houses.forEach((h) => BOOKINGS.push({ house: h.id, from: state.checkin, to: state.checkout }));

  $('#done-h').textContent = id ? 'ได้รับคำขอจองแล้ว' : 'ส่งรายละเอียดการจองเข้า LINE';
  $('#done-text').textContent = message;
  $('#line-link').href = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(message)}`;

  state.selected.clear();
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
