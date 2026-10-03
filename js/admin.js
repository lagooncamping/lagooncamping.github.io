// =========================================================
// หน้าหลังบ้าน (admin.html) — ใช้แทนการแก้ชีต Google Sheets เอง
// ข้อมูลทั้งหมดอ่าน/เขียนผ่าน Google Apps Script (google-apps-script/Code.gs ส่วน "หลังบ้าน")
// ต้องเข้าสู่ระบบด้วย PIN (เจ้าของตั้งใน Script properties ชื่อ ADMIN_PIN)
// =========================================================

// ลิงก์เดียวกับ js/booking.js
const API_URL = 'https://script.google.com/macros/s/AKfycbyCUEb3YTKm6_LoUal5cvBmZZR_-fhcYULSRiH2WDNnSgPOlHGDjqgYY8-Y7ID8rUvWVg/exec';

// คำในชีต — ต้องตรงกับ STATUS / BALANCE / REFUND / PAY_TYPES ใน Code.gs
const ST = { PENDING: 'รอชำระเงิน', CONFIRMED: 'ยืนยันแล้ว', CANCELLED: 'ยกเลิก', EXPIRED: 'หมดเวลา' };
const BAL = { UNPAID: 'ยังไม่ชำระ', CASH: 'เงินสด', TRANSFER: 'โอนหน้าเคาน์เตอร์' };
const REFUND_DONE = 'คืนเงินแล้ว';
const PAY_FULL = 'เต็มจำนวน';
const HOUSE_ORDER = ['lagoon-1', 'lagoon-2', 'studio', 'family-1', 'family-2'];
const CAL_DAYS = 30;
const STORE_KEY = 'lagoonAdminToken';

// ข้อความเมื่อมีปัญหา (รหัสตรงกับ Code.gs)
const ERRORS = {
  bad_pin: 'รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง',
  locked: 'ใส่รหัสผิดหลายครั้งเกินไป ระบบล็อกไว้ 1 ชั่วโมง กรุณารอแล้วค่อยลองใหม่',
  not_configured: 'ยังไม่ได้ตั้งรหัส PIN ในระบบ (ให้เจ้าของตั้ง ADMIN_PIN อย่างน้อย 6 ตัว)',
  network: 'เชื่อมต่อไม่ได้ เช็กอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง',
  auth: 'กรุณาเข้าสู่ระบบอีกครั้ง',
  bad_dates: 'วันที่ไม่ถูกต้อง (วันออกต้องหลังวันเข้า และหลังวันนี้)',
  too_long: 'ช่วงวันยาวเกินไป (ไม่เกิน 90 คืน)',
  bad_house: 'กรุณาเลือกบ้านหรือเต็นท์อย่างน้อย 1 อย่าง',
  bad_tent: 'จำนวนเต็นท์ไม่ถูกต้อง',
  bad_guests: 'จำนวนคนไม่ถูกต้อง',
  bad_name: 'กรุณาใส่ชื่อลูกค้า',
  bad_phone: 'เบอร์โทรยาวเกินไป',
  bad_note: 'หมายเหตุยาวเกินไป',
  bad_total: 'ยอดรวมต้องเป็นตัวเลขเต็ม ไม่ติดลบ',
  not_found: 'ไม่พบการจองนี้ในชีตแล้ว ลองกดโหลดใหม่',
  server: 'ระบบมีปัญหา ลองใหม่อีกครั้ง',
};
const errText = (code) => ERRORS[code] || 'ทำไม่สำเร็จ ลองใหม่อีกครั้ง';

// ---------- ตัวช่วย ----------
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baht = (n) => Number(n || 0).toLocaleString('th-TH');
const pad = (n) => String(n).padStart(2, '0');
const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_D = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const utc = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const t = utc(iso); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const nightsBetween = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
const bangkokToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
const bangkokTime = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
// "ส. 18 ต.ค." (ปีอื่นต่อท้าย พ.ศ. 2 หลัก)
function thDate(iso) {
  if (!isISO(iso)) return esc(iso || '-');
  const t = utc(iso);
  const y = t.getUTCFullYear();
  const thisYear = Number(state.today.slice(0, 4));
  return `${TH_D[t.getUTCDay()]} ${t.getUTCDate()} ${TH_M[t.getUTCMonth()]}${y !== thisYear ? ' ' + String(y + 543).slice(2) : ''}`;
}
const dateRange = (b) => `${thDate(b.checkin)} – ${thDate(b.checkout)} · ${b.nights} คืน`;
// "2026-10-03 16:30" (เวลาไทย) → Date
const deadlineDate = (s) => new Date(String(s).replace(' ', 'T') + ':00+07:00');
function countdown(s) {
  const ms = deadlineDate(s) - Date.now();
  if (!(ms > 0)) return 'เลยเวลาแล้ว';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `เหลือ ${h ? h + ' ชม. ' : ''}${m} นาที`;
}
const store = {
  get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } },
  set(v) { try { v ? localStorage.setItem(STORE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORE_KEY); } catch (e) { /* ไม่เป็นไร */ } },
};

// ---------- สถานะของหน้า ----------
const state = {
  token: '', data: null, tab: 'today', loading: false, loadedAt: 0,
  today: bangkokToday(), focus: '', addHouses: new Set(), blockHouses: new Set(),
};
const bookings = () => (state.data ? state.data.bookings : []);
const houseIds = () => HOUSE_ORDER.filter((h) => state.data && state.data.houses[h]);
const houseName = (id) => (state.data && state.data.houses[id] ? state.data.houses[id].name : id);
// การจองที่ยังล็อกบ้านอยู่
const isActive = (b) => b.status === ST.CONFIRMED || b.status === ST.PENDING;
const people = (b) => (Number(b.guests) || 0) + (Number(b.tent) || 0) + (Number(b.rent) || 0) * 2;
const byId = (id) => bookings().find((b) => b.id === id);

// ---------- เรียก Google Apps Script ----------
// ส่งแบบไม่ใส่ Content-Type (เป็น text/plain) เหมือน js/booking.js — ไม่ติด CORS
async function api(action, payload = {}) {
  let out;
  try {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ admin: action, token: state.token, ...payload }) });
    out = await res.json();
  } catch (err) {
    return { ok: false, error: 'network' };
  }
  if (!out || typeof out !== 'object') return { ok: false, error: 'server' };
  if (out.error === 'auth' || (out.error === 'not_configured' && action !== 'login')) logout(errText(out.error));
  return out;
}

// ---------- เข้าสู่ระบบ / ออก ----------
function showLogin(msg = '') {
  $('#app').hidden = true;
  $('#login').hidden = false;
  $('#login-error').textContent = msg;
  $('#pin').value = '';
  $('#pin').focus();
}
function logout(msg = '') {
  state.token = '';
  state.data = null;
  store.set(null);
  showLogin(msg);
}
$('#show-pin').addEventListener('change', (e) => { $('#pin').type = e.target.checked ? 'text' : 'password'; });
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = $('#pin').value.replace(/\s/g, '');
  const errEl = $('#login-error');
  if (!pin) { errEl.textContent = 'กรุณาใส่รหัส PIN'; return; }
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ…';
  errEl.textContent = '';
  const out = await api('login', { pin });
  btn.disabled = false;
  btn.textContent = 'เข้าสู่ระบบ';
  if (!out.ok) {
    // ระบบจองเวอร์ชันเก่ายังไม่รู้จักคำสั่ง login จะตอบเป็น error ของการจอง (เช่น bad_house)
    const loginCodes = ['bad_pin', 'locked', 'not_configured', 'network', 'server'];
    errEl.textContent = loginCodes.includes(out.error) ? errText(out.error)
      : 'ระบบหลังบ้านยังไม่เปิดใช้งาน (ต้องอัปเดตระบบจองใน Apps Script ก่อน)';
    $('#pin').select();
    return;
  }
  state.token = out.token;
  store.set({ token: out.token, exp: out.exp });
  startApp();
});
$('#logout').addEventListener('click', () => logout('ออกจากระบบแล้ว'));

function startApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  setTab(state.tab, false);
  load();
}

// ---------- โหลดข้อมูล ----------
async function load() {
  if (state.loading || !state.token) return;
  state.loading = true;
  const btn = $('#refresh');
  btn.disabled = true;
  btn.textContent = 'กำลังโหลด…';
  const out = await api('list');
  state.loading = false;
  btn.disabled = false;
  btn.textContent = '↻ โหลดใหม่';
  if (!state.token) return; // ถูกออกจากระบบระหว่างโหลด
  const errEl = $('#load-error');
  if (!out.ok) {
    errEl.hidden = false;
    errEl.textContent = 'โหลดข้อมูลไม่สำเร็จ: ' + errText(out.error);
    return;
  }
  errEl.hidden = true;
  state.data = out;
  state.today = out.today || bangkokToday();
  state.loadedAt = Date.now();
  $('#updated').textContent = `อัปเดตล่าสุด ${bangkokTime()} น.`;
  render();
  if (state.focus) openBooking(state.focus);
}
$('#refresh').addEventListener('click', load);
// กลับมาที่หน้านี้ (สลับแอป/เปิดจอ) → โหลดใหม่ ถ้าโหลดไว้นานกว่า 30 วินาที
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.token && Date.now() - state.loadedAt > 30000) load();
});
// นับถอยหลังเวลาชำระทุก 30 วินาที (เปลี่ยนแค่ตัวเลข ไม่วาดการ์ดใหม่)
setInterval(() => {
  document.querySelectorAll('[data-countdown]').forEach((el) => { el.textContent = countdown(el.dataset.countdown); });
}, 30000);

// ---------- แท็บ ----------
const TABS = ['today', 'pending', 'upcoming', 'calendar', 'all', 'add'];
function setTab(tab, scroll = true) {
  state.tab = TABS.includes(tab) ? tab : 'today';
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === state.tab)));
  TABS.forEach((t) => { $('#v-' + t).hidden = t !== state.tab; });
  renderView();
  if (scroll) window.scrollTo(0, 0);
}
document.querySelector('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  if (b.dataset.tab === 'add') openAdd();
  else setTab(b.dataset.tab);
});

function render() {
  const pending = bookings().filter((b) => b.status === ST.PENDING && !b.blocked).length;
  const count = $('#pending-count');
  count.hidden = !pending;
  count.textContent = pending;
  renderView();
}
function renderView() {
  if (!state.data) return;
  ({ today: renderToday, pending: renderPending, upcoming: renderUpcoming, calendar: renderCalendar, all: renderAll, add: refreshAdd })[state.tab]();
}

// ---------- การ์ดการจอง ----------
function statusClass(b) {
  if (b.blocked && b.status === ST.CONFIRMED) return 'blocked';
  return { [ST.PENDING]: 'pending', [ST.CONFIRMED]: 'confirmed', [ST.CANCELLED]: 'cancelled', [ST.EXPIRED]: 'expired' }[b.status] || 'other';
}
function itemsText(b) {
  const parts = b.houseNames.length ? [b.houseNames.join(', ')] : [];
  if (b.tent) parts.push(`เต็นท์มาเอง ${b.tent} ท่าน`);
  if (b.rent) parts.push(`เช่าเต็นท์ ${b.rent} หลัง`);
  return parts.join(' + ') || 'ลานกางเต็นท์';
}
// ยอดที่ยังต้องเก็บ = ยอดรวม − ที่จ่ายมาแล้ว
const remaining = (b) => Math.max(0, (Number(b.total) || 0) - (Number(b.due) || 0));
const refundAmount = (b) => Math.floor((Number(b.total) || 0) / 2);

function moneyHtml(b) {
  if (b.blocked) return '';
  const lines = [];
  if (b.status === ST.PENDING) {
    lines.push(`<b>ต้องโอน ${baht(b.due)} บาท</b> (${esc(b.payType || '-')}) · ยอดรวม ${baht(b.total)} บาท`);
    if (b.deadline) {
      const [d, t] = b.deadline.split(' ');
      lines.push(`โอนภายใน ${thDate(d)} ${esc(t || '')} น. · <b class="warn" data-countdown="${esc(b.deadline)}">${countdown(b.deadline)}</b>`);
    }
  } else if (b.status === ST.CANCELLED) {
    lines.push(`ยอดรวม ${baht(b.total)} บาท · ${esc(b.payType || '-')}`);
    if (b.payType === PAY_FULL) {
      lines.push(b.refund === REFUND_DONE ? `<b class="ok">✓ โอนคืนแล้ว ${baht(refundAmount(b))} บาท</b>` : `<b class="warn">ต้องโอนคืน 50% = ${baht(refundAmount(b))} บาท</b>`);
    } else if (b.payType) {
      lines.push('มัดจำไม่คืน');
    }
  } else if (b.status === ST.EXPIRED) {
    lines.push(`ไม่ได้โอนภายในเวลา · ยอดที่ต้องโอน ${baht(b.due)} บาท (${esc(b.payType || '-')})`);
  } else {
    lines.push(`ยอดรวม <b>${baht(b.total)} บาท</b>${b.payType ? ' · ' + esc(b.payType) : ''}`);
    if (b.balance === BAL.UNPAID) lines.push(`<b class="warn">ยังต้องเก็บอีก ${baht(remaining(b))} บาท</b>${b.due ? ` (จ่ายแล้ว ${baht(b.due)})` : ''}`);
    else if (b.balance) lines.push(`<b class="ok">✓ เก็บส่วนที่เหลือแล้ว (${esc(b.balance)})</b>`);
    else if (b.payType === PAY_FULL) lines.push('<b class="ok">✓ จ่ายครบแล้ว</b>');
  }
  return `<div class="money">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`;
}

// ปุ่มตามสถานะ: [รหัสคำสั่ง, ข้อความปุ่ม, คำถามยืนยัน, แบบปุ่ม]
function actionsFor(b) {
  const a = [];
  if (b.blocked) {
    if (b.status === ST.CONFIRMED) a.push(['cancel', 'เปิดให้จองได้', `เปิดบ้านให้รับจองช่วง ${dateRange(b)} ใช่ไหม?`, 'danger']);
    else a.push(['reopen', 'ปิดบ้านอีกครั้ง', 'ปิดบ้านช่วงนี้อีกครั้งใช่ไหม?', 'link']);
    return a;
  }
  if (b.status === ST.PENDING || b.status === ST.EXPIRED) {
    a.push(['confirm', 'ได้รับเงินแล้ว ยืนยัน', `ได้รับเงิน ${baht(b.due)} บาทแล้ว ใช่ไหม? (เช็กสลิปแล้ว)`, 'primary']);
    a.push(['cancel', 'ยกเลิก', 'ยกเลิกการจองนี้ใช่ไหม? บ้านจะว่างให้คนอื่นจองได้', 'danger']);
  } else if (b.status === ST.CONFIRMED) {
    if (b.balance === BAL.UNPAID) {
      a.push(['cash', 'รับเงินสด', `ได้รับเงินสด ${baht(remaining(b))} บาทแล้ว ใช่ไหม?`, 'primary']);
      a.push(['transfer', 'รับโอน', `ได้รับเงินโอน ${baht(remaining(b))} บาทแล้ว ใช่ไหม?`, 'primary']);
    } else if (b.balance === BAL.CASH || b.balance === BAL.TRANSFER) {
      a.push(['unpaid', 'แก้: ยังไม่ได้รับเงิน', 'เปลี่ยนกลับเป็น “ยังไม่ได้รับเงินส่วนที่เหลือ” ใช่ไหม?', 'link']);
    }
    const refundNote = b.payType === PAY_FULL ? ` ลูกค้าจ่ายเต็มจำนวน ต้องโอนคืน 50% = ${baht(refundAmount(b))} บาท` : '';
    a.push(['cancel', 'ยกเลิกการจอง', `ยกเลิกการจองนี้ใช่ไหม?${refundNote}`, 'danger']);
  } else if (b.status === ST.CANCELLED) {
    if (b.payType === PAY_FULL) {
      if (b.refund === REFUND_DONE) a.push(['unrefund', 'แก้: ยังไม่ได้โอนคืน', 'เปลี่ยนกลับเป็น “ยังไม่ได้โอนคืน” ใช่ไหม?', 'link']);
      else a.push(['refund', `โอนคืนแล้ว ${baht(refundAmount(b))} บาท`, `โอนคืนลูกค้า ${baht(refundAmount(b))} บาทแล้ว ใช่ไหม?`, 'primary']);
    }
    a.push(['reopen', 'ยกเลิกผิด? เปิดการจองนี้อีกครั้ง', 'เปิดการจองนี้กลับมาเป็น “ยืนยันแล้ว” ใช่ไหม?', 'link']);
  }
  return a;
}

function card(b) {
  const cls = statusClass(b);
  const pill = cls === 'blocked' ? 'ปิดบ้าน' : (b.status || 'ไม่มีสถานะ');
  const phone = String(b.phone || '').replace(/[^\d+]/g, '');
  const who = b.blocked ? '' : `<p class="who"><b>${esc(b.name || '-')}</b>${people(b) ? ` · ${people(b)} ท่าน` : ''}${b.guests && (b.tent || b.rent) ? ` (ในบ้าน ${b.guests})` : ''}</p>`;
  return `
  <article class="bk st-${cls}" id="b-${esc(b.id)}" data-id="${esc(b.id)}">
    <div class="bk-top"><span class="pill">${esc(pill)}</span><span class="bk-id">${esc(b.id)}</span></div>
    <h3>${b.blocked ? 'ปิดบ้าน: ' : ''}${esc(b.blocked ? b.houseNames.join(', ') : itemsText(b))}</h3>
    <p class="dates">${dateRange(b)}</p>
    ${who}
    ${b.note ? `<p class="bk-note">📝 ${esc(b.note)}</p>` : ''}
    ${moneyHtml(b)}
    ${phone.length >= 9 && !b.blocked ? `<a class="btn-call" href="tel:${esc(phone)}">📞 โทร ${esc(b.phone)}</a>` : (b.phone ? `<p>📞 ${esc(b.phone)}</p>` : '')}
    <div class="acts">${actionsFor(b).map(([act, label, ask, kind]) =>
      `<button type="button" class="${kind}" data-act="${act}" data-ask="${esc(ask)}">${esc(label)}</button>`).join('')}</div>
    <div class="ask" hidden>
      <p class="ask-q"></p>
      <div class="acts"><button type="button" class="primary" data-yes>ใช่</button><button type="button" class="ghost" data-no>ไม่ใช่</button></div>
    </div>
    <p class="error card-error" role="alert"></p>
  </article>`;
}
const cards = (list, empty) => (list.length ? list.map(card).join('') : `<p class="empty">${empty}</p>`);

// กดปุ่มบนการ์ด → ถามยืนยันในการ์ดก่อน → กด "ใช่" ค่อยทำจริง
const ACTIONS = {
  confirm: ['setStatus', { status: 'CONFIRMED' }, 'ยืนยันการจองแล้ว'],
  reopen: ['setStatus', { status: 'CONFIRMED' }, 'เปิดกลับมาแล้ว'],
  cancel: ['setStatus', { status: 'CANCELLED' }, 'ยกเลิกแล้ว'],
  cash: ['setBalance', { value: 'CASH' }, 'บันทึกรับเงินสดแล้ว'],
  transfer: ['setBalance', { value: 'TRANSFER' }, 'บันทึกรับโอนแล้ว'],
  unpaid: ['setBalance', { value: 'UNPAID' }, 'แก้เป็นยังไม่ได้รับเงินแล้ว'],
  refund: ['setRefund', { done: true }, 'บันทึกโอนคืนแล้ว'],
  unrefund: ['setRefund', { done: false }, 'แก้เป็นยังไม่ได้โอนคืนแล้ว'],
};
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act], [data-yes], [data-no]');
  const c = el && el.closest('.bk');
  if (!c) return;
  const ask = c.querySelector('.ask');
  const errEl = c.querySelector('.card-error');
  if (el.dataset.act) {
    c.dataset.pending = el.dataset.act;
    ask.querySelector('.ask-q').textContent = el.dataset.ask;
    ask.hidden = false;
    errEl.textContent = '';
    ask.querySelector('[data-yes]').focus();
    return;
  }
  if (el.hasAttribute('data-no')) { ask.hidden = true; return; }
  const [action, extra, done] = ACTIONS[c.dataset.pending] || [];
  if (!action) return;
  c.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  el.textContent = 'กำลังบันทึก…';
  const out = await api(action, { id: c.dataset.id, ...extra });
  if (!state.token) return;
  if (!out.ok) {
    c.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    el.textContent = 'ใช่';
    ask.hidden = true;
    errEl.textContent = out.error === 'booked'
      ? `ทำไม่ได้: ${out.houses.map(houseName).join(', ')} มีคนอื่นจองช่วงนี้ไปแล้ว`
      : errText(out.error);
    return;
  }
  toast(done);
  await load();
  if (c.isConnected) renderView(); // โหลดใหม่ไม่สำเร็จ: วาดการ์ดใหม่ ให้ปุ่มกดได้อีก
});

// ---------- แท็บ "วันนี้" ----------
function renderToday() {
  const t = state.today;
  const act = bookings().filter((b) => isActive(b) && !b.blocked);
  const arrive = act.filter((b) => b.checkin === t);
  const stay = act.filter((b) => b.checkin < t && b.checkout > t);
  const leave = act.filter((b) => b.checkout === t);
  const tonight = arrive.concat(stay);
  // บ้านว่างคืนนี้ = ไม่มีการจอง/ปิดบ้านที่ครอบคืนนี้
  const used = new Set(bookings().filter((b) => isActive(b) && b.checkin <= t && b.checkout > t).flatMap((b) => b.houses));
  const free = houseIds().filter((h) => !used.has(h)).map(houseName);
  const pending = bookings().filter((b) => b.status === ST.PENDING && !b.blocked).length;
  $('#h-today').textContent = `วันนี้ ${thDate(t)}`;
  $('#today-body').innerHTML = `
    <div class="summary">
      <p>คืนนี้มีแขก <b>${tonight.reduce((s, b) => s + people(b), 0)} ท่าน</b> (${tonight.length} การจอง)</p>
      <p>บ้านว่างคืนนี้: <b>${free.length ? esc(free.join(', ')) : 'เต็มทุกหลัง'}</b></p>
      ${pending ? `<p><button type="button" class="link" data-goto="pending">มีการจองรอชำระเงิน ${pending} รายการ →</button></p>` : ''}
    </div>
    <h2 class="sub">เข้าพักวันนี้ (${arrive.length})</h2>${cards(arrive, 'ไม่มีคนเข้าพักวันนี้')}
    <h2 class="sub">พักต่อคืนนี้ (${stay.length})</h2>${cards(stay, 'ไม่มี')}
    <h2 class="sub">ออกวันนี้ (${leave.length})</h2>${cards(leave, 'ไม่มีคนออกวันนี้')}`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-goto]');
  if (b) setTab(b.dataset.goto);
});

// ---------- แท็บ "รอชำระ" ----------
function renderPending() {
  const t = state.today;
  const pending = bookings().filter((b) => b.status === ST.PENDING && !b.blocked)
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
  const late = bookings().filter((b) => b.status === ST.EXPIRED && !b.blocked && b.checkout > t)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  $('#pending-body').innerHTML = cards(pending, 'ไม่มีการจองที่รอชำระเงิน 👍')
    + (late.length ? `<h2 class="sub">หมดเวลาแล้ว ยังไม่ได้รับเงิน (${late.length})</h2>
      <p class="hint">ถ้าลูกค้าโอนมาช้า กด “ได้รับเงินแล้ว ยืนยัน” ได้ (ถ้าบ้านยังว่าง)</p>${cards(late, '')}` : '');
}

// ---------- แท็บ "กำลังจะมา" ----------
function renderUpcoming() {
  const list = bookings().filter((b) => b.status === ST.CONFIRMED && !b.blocked && b.checkin > state.today);
  $('#upcoming-body').innerHTML = cards(list, 'ยังไม่มีการจองที่ยืนยันแล้วในวันข้างหน้า');
}

// ---------- แท็บ "ค้นหา/ย้อนหลัง" ----------
function renderAll() {
  const q = $('#search').value.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  const list = bookings().slice().reverse().filter((b) => !q
    || [b.name, b.id, b.note, b.houseNames.join(' ')].join(' ').toLowerCase().includes(q)
    || (digits.length >= 3 && String(b.phone).replace(/\D/g, '').includes(digits)));
  $('#all-body').innerHTML = cards(list.slice(0, 150), q ? 'ไม่พบการจองที่ตรงกับคำค้นหา' : 'ยังไม่มีการจอง');
}
$('#search').addEventListener('input', renderAll);

// ---------- แท็บ "ปฏิทิน" ----------
// การจองที่ครอบคืน day ของบ้าน h (ยืนยันแล้ว > ปิดบ้าน > รอชำระ)
function cellBooking(h, day) {
  const list = bookings().filter((b) => isActive(b) && b.houses.includes(h) && b.checkin <= day && b.checkout > day);
  const rank = (b) => (b.status === ST.CONFIRMED ? (b.blocked ? 1 : 0) : 2);
  return list.sort((a, b) => rank(a) - rank(b))[0];
}
function renderCalendar() {
  const days = Array.from({ length: CAL_DAYS }, (_, i) => addDays(state.today, i));
  const head = days.map((d) => {
    const t = utc(d);
    const dow = t.getUTCDay();
    return `<th scope="col" class="${dow === 6 || dow === 5 ? 'wkend' : ''}">${TH_D[dow]}<b>${t.getUTCDate()}</b>${t.getUTCDate() === 1 || d === state.today ? TH_M[t.getUTCMonth()] : ''}</th>`;
  }).join('');
  const rows = houseIds().map((h) => `<tr><th scope="row">${esc(houseName(h))}</th>${days.map((d) => {
    const b = cellBooking(h, d);
    const label = `${houseName(h)} ${thDate(d)}`;
    if (!b) return `<td><button type="button" class="c-free" data-free="${h}" data-day="${d}" aria-label="${esc(label)} ว่าง กดเพื่อจอง"></button></td>`;
    const kind = b.blocked ? 'blocked' : b.status === ST.PENDING ? 'pending' : 'booked';
    const word = { blocked: 'ปิดบ้าน', pending: 'รอชำระ', booked: 'จองแล้ว' }[kind];
    const start = b.checkin === d || d === state.today;
    return `<td><button type="button" class="c-${kind}" data-open="${esc(b.id)}" aria-label="${esc(label)} ${word}: ${esc(b.name)}">${start ? esc(b.blocked ? 'ปิด' : b.name) : ''}</button></td>`;
  }).join('')}</tr>`).join('');
  $('#cal-scroll').innerHTML = `<table class="cal"><thead><tr><th class="corner">บ้าน</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
  const blocks = bookings().filter((b) => b.blocked && b.status === ST.CONFIRMED && b.checkout > state.today);
  $('#blocks-body').innerHTML = cards(blocks, 'ไม่มีบ้านที่ปิดอยู่');
  const shown = $('#cal-detail').dataset.id;
  if (shown) showCalDetail(shown, false);
  renderPicks('#block-houses', state.blockHouses);
}
function showCalDetail(id, scroll = true) {
  const b = byId(id);
  const box = $('#cal-detail');
  box.dataset.id = b ? id : '';
  box.innerHTML = b ? `<h2 class="sub">การจองที่เลือก <button type="button" class="link" data-close-detail>ปิด</button></h2>${card(b)}` : '';
  if (b && scroll) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$('#cal-scroll').addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) { showCalDetail(open.dataset.open); return; }
  const free = e.target.closest('[data-free]');
  if (free) openAdd({ house: free.dataset.free, checkin: free.dataset.day, checkout: addDays(free.dataset.day, 1) });
});
$('#cal-detail').addEventListener('click', (e) => {
  if (e.target.closest('[data-close-detail]')) showCalDetail('', false);
});

// ---------- ปุ่มเลือกบ้าน (ใช้ทั้งฟอร์มเพิ่มการจองและปิดบ้าน) ----------
// taken = { houseId: ชื่อคนที่จองอยู่ } บ้านที่ไม่ว่างในช่วงวันที่เลือก
function renderPicks(sel, set, taken = {}) {
  if (!state.data) return;
  $(sel).innerHTML = houseIds().map((h) => {
    const info = state.data.houses[h];
    const busy = Object.prototype.hasOwnProperty.call(taken, h);
    if (busy) set.delete(h);
    return `<button type="button" class="pick${busy ? ' is-taken' : ''}" data-house="${h}" aria-pressed="${set.has(h)}" ${busy ? 'disabled' : ''}>
      <b>${esc(info.name)}</b><span>${busy ? `ไม่ว่าง · ${esc(taken[h])}` : `${baht(info.price)} บาท · ${info.guests} ท่าน`}</span></button>`;
  }).join('');
}
function bindPicks(sel, set, after) {
  $(sel).addEventListener('click', (e) => {
    const b = e.target.closest('[data-house]');
    if (!b || b.disabled) return;
    set.has(b.dataset.house) ? set.delete(b.dataset.house) : set.add(b.dataset.house);
    b.setAttribute('aria-pressed', String(set.has(b.dataset.house)));
    if (after) after();
  });
}
// บ้านที่ถูกจองในช่วง from–to (ใช้ข้อมูลล่าสุดที่โหลดมา Google เช็กซ้ำอีกรอบตอนบันทึก)
function takenBetween(from, to) {
  const taken = {};
  if (!isISO(from) || !isISO(to) || to <= from) return taken;
  bookings().filter((b) => isActive(b) && b.checkin < to && b.checkout > from)
    .forEach((b) => b.houses.forEach((h) => { taken[h] = b.blocked ? 'ปิดบ้าน' : b.name; }));
  return taken;
}

// ---------- ฟอร์ม "เพิ่มการจอง" ----------
const addForm = $('#add-form');
const F = (name) => addForm.elements[name];
const intVal = (name) => Math.max(0, Math.floor(Number(F(name).value)) || 0);

function openAdd(prefill = {}) {
  addForm.reset();
  state.addHouses = new Set(prefill.house ? [prefill.house] : []);
  F('checkin').value = prefill.checkin || state.today;
  F('checkout').value = prefill.checkout || addDays(state.today, 1);
  F('guests').value = prefill.house && state.data ? state.data.houses[prefill.house].guests : 2;
  $('#add-error').textContent = '';
  setTab('add');
}
function refreshAdd() {
  const from = F('checkin').value;
  const to = F('checkout').value;
  F('checkout').min = isISO(from) ? addDays(from, 1) : '';
  renderPicks('#add-houses', state.addHouses, takenBetween(from, to));
  updateEstimate();
}
function estimate() {
  const n = isISO(F('checkin').value) && isISO(F('checkout').value) ? nightsBetween(F('checkin').value, F('checkout').value) : 0;
  if (!state.data || n <= 0) return { n, total: 0 };
  const per = [...state.addHouses].reduce((s, h) => s + state.data.houses[h].price, 0)
    + intVal('tentGuests') * state.data.tentPrice + intVal('tentRentals') * state.data.tentRent;
  return { n, total: per * n };
}
function updateEstimate() {
  const { n, total } = estimate();
  $('#add-nights').textContent = n > 0 ? `${thDate(F('checkin').value)} – ${thDate(F('checkout').value)} · ${n} คืน` : 'วันออกต้องหลังวันเข้า';
  F('total').placeholder = total ? String(total) : '';
  const typed = F('total').value.trim();
  const sum = typed === '' ? total : Math.floor(Number(typed)) || 0;
  const paid = addForm.querySelector('[name=paid]:checked').value;
  const rate = state.data ? state.data.depositRate || 0.5 : 0.5;
  const dep = Math.ceil(sum * rate);
  $('#add-estimate').innerHTML = `ราคาตามระบบ: <b>${baht(total)} บาท</b>`
    + (typed !== '' ? ` · ใช้ยอดที่แก้: <b>${baht(sum)} บาท</b>` : '')
    + '<br>' + (paid === 'none' ? `ต้องเก็บเงินทั้งหมด ${baht(sum)} บาท`
      : paid === 'deposit' ? `มัดจำ ${baht(dep)} บาท · ต้องเก็บเพิ่มวันเข้าพัก ${baht(sum - dep)} บาท`
        : 'จ่ายครบแล้ว ไม่ต้องเก็บเพิ่ม');
}
bindPicks('#add-houses', state.addHouses, updateEstimate);
['checkin', 'checkout'].forEach((n) => F(n).addEventListener('change', () => {
  if (n === 'checkin' && isISO(F('checkin').value) && !(F('checkout').value > F('checkin').value)) F('checkout').value = addDays(F('checkin').value, 1);
  refreshAdd();
}));
addForm.addEventListener('input', (e) => { if (['tentGuests', 'tentRentals', 'total', 'paid'].includes(e.target.name)) updateEstimate(); });
addForm.addEventListener('change', (e) => { if (e.target.name === 'paid') updateEstimate(); });
// ปุ่ม − / +
addForm.addEventListener('click', (e) => {
  const b = e.target.closest('[data-step]');
  if (!b) return;
  const input = F(b.dataset.step);
  input.value = Math.min(Number(input.max), Math.max(0, (Number(input.value) || 0) + Number(b.dataset.d)));
  updateEstimate();
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#add-error');
  errEl.textContent = '';
  const checkin = F('checkin').value;
  const checkout = F('checkout').value;
  const houses = [...state.addHouses];
  const name = F('name').value.trim();
  if (!isISO(checkin) || !isISO(checkout) || checkout <= checkin) { errEl.textContent = 'วันออกต้องหลังวันเข้า'; return; }
  if (checkout <= state.today) { errEl.textContent = 'วันออกต้องหลังวันนี้'; return; }
  if (!houses.length && !intVal('tentGuests') && !intVal('tentRentals')) { errEl.textContent = ERRORS.bad_house; return; }
  if (!name) { errEl.textContent = ERRORS.bad_name; F('name').focus(); return; }
  const busy = houses.filter((h) => takenBetween(checkin, checkout)[h]);
  if (busy.length) { errEl.textContent = `${busy.map(houseName).join(', ')} ไม่ว่างในวันที่เลือก`; return; }
  const typed = F('total').value.trim();
  if (typed !== '' && !(Number.isInteger(Number(typed)) && Number(typed) >= 0)) { errEl.textContent = ERRORS.bad_total; return; }

  const btn = addForm.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึก…';
  const out = await api('addBooking', {
    houses, checkin, checkout,
    guests: houses.length ? intVal('guests') : 0,
    tentGuests: intVal('tentGuests'),
    tentRentals: intVal('tentRentals'),
    name,
    phone: F('phone').value.trim(),
    note: F('note').value.trim(),
    paid: addForm.querySelector('[name=paid]:checked').value,
    total: typed === '' ? '' : Number(typed),
  });
  btn.disabled = false;
  btn.textContent = 'บันทึกการจอง';
  if (!state.token) return;
  if (!out.ok) {
    if (out.error === 'booked') {
      errEl.textContent = `${out.houses.map(houseName).join(', ')} เพิ่งมีคนจองไป กรุณาเลือกบ้านอื่น`;
      await load();
    } else {
      errEl.textContent = errText(out.error);
    }
    return;
  }
  toast(`บันทึกการจองแล้ว (รหัส ${out.id})`);
  state.addHouses.clear();
  addForm.reset();
  state.focus = out.id;
  await load();
});

// ---------- ฟอร์ม "ปิดบ้าน" ----------
const blockForm = $('#block-form');
bindPicks('#block-houses', state.blockHouses);
$('#block-box').addEventListener('toggle', () => {
  if (!$('#block-box').open) return;
  if (!blockForm.elements.from.value) blockForm.elements.from.value = state.today;
  if (!blockForm.elements.to.value) blockForm.elements.to.value = addDays(state.today, 1);
});
blockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#block-error');
  errEl.textContent = '';
  const from = blockForm.elements.from.value;
  const to = blockForm.elements.to.value;
  const houses = [...state.blockHouses];
  if (!houses.length) { errEl.textContent = 'กรุณาเลือกบ้านที่จะปิด'; return; }
  if (!isISO(from) || !isISO(to) || to <= from || to <= state.today) { errEl.textContent = 'วันที่ไม่ถูกต้อง (วันเปิดรับต้องหลังวันเริ่มปิด และหลังวันนี้)'; return; }
  const btn = blockForm.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึก…';
  const out = await api('block', { houses, from, to, reason: blockForm.elements.reason.value.trim() });
  btn.disabled = false;
  btn.textContent = 'ปิดบ้าน';
  if (!state.token) return;
  if (!out.ok) {
    errEl.textContent = out.error === 'booked'
      ? `${out.houses.map(houseName).join(', ')} มีการจองอยู่ในช่วงนี้ ปิดไม่ได้ (ยกเลิกหรือย้ายการจองก่อน)`
      : errText(out.error);
    return;
  }
  toast('ปิดบ้านแล้ว ลูกค้าจะจองช่วงนี้ไม่ได้');
  state.blockHouses.clear();
  blockForm.reset();
  $('#block-box').open = false;
  await load();
});

// ---------- เปิดการจองจากลิงก์ (admin.html#LG...) ----------
function openBooking(id) {
  state.focus = '';
  const b = byId(id);
  if (!b) { toast('ไม่พบการจองนี้ (อาจเก่ากว่า 60 วัน หรือถูกลบจากชีต)'); return; }
  if (b.status === ST.PENDING && !b.blocked) setTab('pending', false);
  else { $('#search').value = ''; setTab('all', false); }
  const el = document.getElementById('b-' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 2500);
}
function readHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  return /^(LG|BLK|ROW)[\w-]{1,30}$/.test(id) ? id : '';
}
window.addEventListener('hashchange', () => {
  const id = readHash();
  if (!id) return;
  if (state.data) openBooking(id); else state.focus = id;
});

// ---------- ข้อความแจ้งสั้นๆ ด้านล่าง ----------
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}

// ---------- เริ่ม ----------
state.focus = readHash();
const saved = store.get();
if (saved && saved.token && Number(saved.exp) > Date.now()) {
  state.token = saved.token;
  startApp();
} else {
  store.set(null);
  showLogin();
}
