// หน้า "เช็กการจองของฉัน" (my-booking.html)
// ลูกค้าใส่เบอร์โทรที่ใช้ตอนจอง → ถาม Google Apps Script (Code.gs: lookupByPhone_) → โชว์ใบยืนยันการจองทีละใบ
// - ไม่ใส่เบอร์ในลิงก์ (กันเบอร์หลุดไปกับประวัติเว็บ/การแชร์ลิงก์) · จำเบอร์ล่าสุดไว้ในเครื่องนี้เท่านั้น (กด "ล้าง" ได้)
// - ปุ่ม "บันทึกเป็นรูป" วาดใบยืนยันลงรูป PNG (lagoon-<รหัส>.png) · "คัดลอก" คัดลอกเป็นข้อความ
(() => {
  // ต้องตรงกับ API_URL ใน js/booking.js
  const API_URL = 'https://script.google.com/macros/s/AKfycbyCUEb3YTKm6_LoUal5cvBmZZR_-fhcYULSRiH2WDNnSgPOlHGDjqgYY8-Y7ID8rUvWVg/exec';
  const PHONE = '081-930-4969';
  const PHONE_TEL = 'tel:+66819304969';
  const LINE_ID = '@477nvamb';
  const MAP_URL = 'https://goo.gl/maps/8mGhpGAEaRzAJNGq6';
  const CHECK_TIMES = 'เช็กอินได้ตั้งแต่ 11:00 น. และเช็กเอาต์ก่อน 12:00 น.'; // ต้องตรงกับ stay.html
  const SAVED_PHONE_KEY = 'lagoon-my-phone';
  const PENDING_KEY = 'lagoon-booking'; // การจองรอชำระที่ js/booking.js จำไว้
  const STATUS = { PENDING: 'รอชำระเงิน', CONFIRMED: 'ยืนยันแล้ว', CANCELLED: 'ยกเลิก', EXPIRED: 'หมดเวลา' };

  const $ = (s) => document.querySelector(s);
  const form = $('#mb-form');
  const input = $('#mb-phone');
  const btn = $('#mb-submit');
  const errorEl = $('#mb-error');
  const statusEl = $('#mb-status');
  const results = $('#mb-results');
  const savedEl = $('#mb-saved');
  if (!form) return;

  // ---------- เบอร์โทร: กติกาเดียวกับ normPhone_ ใน Code.gs ----------
  // เก็บแต่ตัวเลข · +66/66 นำหน้า → 0 · เบอร์ไทย = 0 + 8–9 หลัก (บ้าน 9 หลัก มือถือ 10 หลัก)
  const thaiDigits = (s) => String(s).replace(/[๐-๙]/g, (c) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(c)));
  function normPhone(v) {
    let s = thaiDigits(v == null ? '' : v).replace(/\D/g, '');
    if (/^660\d{8,9}$/.test(s)) s = s.slice(2);
    else if (/^66\d{8,9}$/.test(s)) s = `0${s.slice(2)}`;
    return /^0\d{8,9}$/.test(s) ? s : '';
  }
  // ข้อความผิดพลาดของช่องเบอร์ (ว่าง = ใช้ได้)
  function phoneProblem(raw) {
    const v = thaiDigits(raw).trim();
    if (!v) return 'กรุณาใส่เบอร์โทรที่ใช้ตอนจอง';
    if (/[^\d\s+\-().]/.test(v)) return 'ใส่ได้เฉพาะตัวเลข เช่น 081-234-5678';
    if (normPhone(v)) return '';
    const digits = v.replace(/\D/g, '');
    if (digits.length < 9) return 'เบอร์โทรสั้นเกินไป เบอร์มือถือมี 10 หลัก เช่น 081-234-5678';
    if (digits.length > 12 || (digits.length > 10 && !/^66/.test(digits))) return 'เบอร์โทรยาวเกินไป เบอร์มือถือมี 10 หลัก เช่น 081-234-5678';
    return 'เบอร์โทรต้องขึ้นต้นด้วย 0 เช่น 081-234-5678';
  }

  // ---------- วันที่/ตัวเลข ----------
  const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  // '2026-10-18' → "ส. 18 ต.ค. 2569"
  function thaiDate(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    if (!y || !m || !d) return String(iso || '');
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return `${TH_DOW[dow]} ${d} ${TH_MONTHS[m - 1]} ${y + 543}`;
  }
  // 'yyyy-MM-dd HH:mm' → "ศ. 3 ต.ค. 2569 เวลา 20:00 น."
  const deadlineThai = (s) => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s || '') ? `${thaiDate(s.slice(0, 10))} เวลา ${s.slice(11)} น.` : '');
  const baht = (n) => `${Number(n || 0).toLocaleString('th-TH')} บาท`;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- ข้อมูลที่โชว์ในใบยืนยัน (ใช้ทั้งการ์ด รูป และข้อความคัดลอก) ----------
  function peopleText(p) {
    if (!p) return '';
    return [
      p.guests ? `${p.guests} ท่านในบ้าน` : '',
      p.tentGuests ? `เต็นท์มาเอง ${p.tentGuests} ท่าน` : '',
      p.tentRentals ? `เช่าเต็นท์ ${p.tentRentals} หลัง (2 ท่าน/หลัง)` : '',
    ].filter(Boolean).join(' · ');
  }
  function statusInfo(b) {
    switch (b.status) {
      case STATUS.CONFIRMED: return { cls: 'ok', label: 'ยืนยันแล้ว', active: true };
      case STATUS.PENDING: return { cls: 'wait', label: 'รอชำระเงิน', active: true };
      case STATUS.CANCELLED: return { cls: 'off', label: 'ยกเลิก', active: false };
      case STATUS.EXPIRED: return { cls: 'off', label: 'หมดเวลาชำระ', active: false };
      default: return { cls: 'off', label: b.status || 'รอแอดมินตรวจสอบ', active: false };
    }
  }
  // แถวข้อมูล [หัวข้อ, ค่า, เน้น?]
  function rowsOf(b) {
    const rows = [];
    if (b.nameMasked) rows.push(['ชื่อผู้จอง', b.nameMasked]);
    rows.push(['ที่พัก', (b.items || []).join(', ')]);
    rows.push(['วันที่', `${thaiDate(b.checkin)} – ${thaiDate(b.checkout)} · ${b.nights} คืน`]);
    const people = peopleText(b.people);
    if (people) rows.push(['ผู้เข้าพัก', people]);
    if (b.total) rows.push(['ยอดรวม', baht(b.total)]);
    if (b.paid) rows.push(['ชำระแล้ว', baht(b.paid)]);
    if (b.balanceDue > 0) rows.push(['ชำระวันเช็กอิน', `${baht(b.balanceDue)} (เงินสดหรือโอนหน้าเคาน์เตอร์)`, true]);
    return rows;
  }
  function refundText(b) {
    if (!b.refund) return '';
    return b.refund === 'done'
      ? `คืนเงิน 50% แล้ว (${baht(b.refundAmount)})`
      : `ถ้าชำระเต็มจำนวนแล้ว จะได้รับเงินคืน 50% (${baht(b.refundAmount)}) แอดมินจะโอนคืนให้`;
  }
  function payNowText(b) {
    if (b.status !== STATUS.PENDING || !b.payNow) return '';
    const when = deadlineThai(b.deadline);
    return `โอน ${baht(b.payNow)}${when ? ` ภายใน ${when}` : ''} แล้วส่งสลิปทาง LINE ${LINE_ID}`;
  }
  const isPast = (b) => b.checkout < today;

  // การจองรอชำระที่จำไว้ในเครื่องนี้ (จากหน้าจอง) → ลิงก์ไปหน้า QR ได้
  function savedPendingId() {
    try {
      const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      return p && p.id ? String(p.id) : '';
    } catch (err) {
      return '';
    }
  }

  // ---------- การ์ดใบยืนยัน ----------
  function voucherHTML(b, i) {
    const st = statusInfo(b);
    const pendingSaved = b.status === STATUS.PENDING && b.id && b.id === savedPendingId();
    const pay = payNowText(b);
    const refund = refundText(b);
    return `
    <article class="voucher v-${st.cls}" data-i="${i}" aria-labelledby="v-id-${i}">
      <header class="v-head">
        <span class="v-brand">The Lagoon</span>
        <span class="v-title">ใบยืนยันการจอง</span>
      </header>
      <div class="v-main">
        <p class="v-id-label">รหัสการจอง</p>
        <p class="v-id" id="v-id-${i}">${b.id ? esc(b.id) : 'ไม่มีรหัส (จองทางโทรศัพท์)'}</p>
        <p class="v-tags"><span class="v-pill">${esc(st.label)}</span>${isPast(b) && st.active ? '<span class="v-past">ผ่านไปแล้ว</span>' : ''}</p>
        ${pay ? `<div class="v-alert"><p>${esc(pay)}</p>${pendingSaved
          ? '<a class="v-alert-link" href="booking.html#pay">ดู QR / ส่งสลิป →</a>'
          : `<a class="v-alert-link" href="https://line.me/R/ti/p/${encodeURIComponent(LINE_ID)}" target="_blank" rel="noopener">ส่งสลิปทาง LINE →</a>`}</div>` : ''}
        <dl class="v-rows">${rowsOf(b).map(([k, v, strong]) => `<div class="v-row${strong ? ' v-strong' : ''}"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        ${refund ? `<p class="v-note">${esc(refund)}</p>` : ''}
        ${st.active ? `<p class="v-times">${esc(CHECK_TIMES)}</p>
        <p class="v-links"><a href="${MAP_URL}" target="_blank" rel="noopener">แผนที่ / นำทาง</a><a href="${PHONE_TEL}">โทร ${PHONE}</a></p>` : ''}
      </div>
      <div class="v-tools">
        <button class="v-tool" type="button" data-save>บันทึกเป็นรูป</button>
        <button class="v-tool" type="button" data-copy>คัดลอก</button>
      </div>
      <p class="v-msg" role="status"></p>
      <textarea class="v-copy-text" rows="9" readonly hidden aria-label="รายละเอียดการจองสำหรับคัดลอก"></textarea>
      ${st.active ? '<p class="v-hint">แสดงหน้านี้หรือรูปนี้กับเจ้าหน้าที่ตอนเช็กอิน</p>' : ''}
    </article>`;
  }

  let shown = [];
  function showResults(list) {
    shown = list;
    if (!list.length) {
      results.innerHTML = `<div class="mb-empty"><p>ไม่พบการจองของเบอร์นี้ ลองเช็กเบอร์ที่ใช้ตอนจอง หรือทัก LINE <a href="https://line.me/R/ti/p/${encodeURIComponent(LINE_ID)}" target="_blank" rel="noopener">${LINE_ID}</a></p>
        <p class="mb-small">โชว์เฉพาะการจองที่ยังไม่ถึงวันเข้าพัก และที่เช็กเอาต์ไปไม่เกิน 30 วัน</p></div>`;
      statusEl.textContent = 'ไม่พบการจอง';
      return;
    }
    statusEl.textContent = `พบ ${list.length} การจอง`;
    results.innerHTML = `<p class="mb-count">พบ ${list.length} การจอง</p>${list.map(voucherHTML).join('')}`;
  }

  // ---------- ค้นหา ----------
  const SERVER_TEXT = {
    bad_phone: 'เบอร์โทรไม่ถูกต้อง กรุณาตรวจอีกครั้ง เช่น 081-234-5678',
    busy: 'ค้นหาบ่อยเกินไป รอ 10 นาทีแล้วลองใหม่',
    server: `ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง หรือทัก LINE ${LINE_ID}`,
  };
  const NOT_READY = `ระบบเช็กการจองยังไม่พร้อมใช้งาน กรุณาทัก LINE ${LINE_ID} หรือโทร ${PHONE}`;
  let busy = false;

  function setError(msg) {
    errorEl.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  async function search(phone) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : 0;
    try {
      // ส่งแบบ text/plain (ค่าเริ่มต้นของ fetch กับ string) เพื่อให้ Google Apps Script รับได้โดยไม่ติด CORS
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ lookup: 'phone', phone }), signal: ctrl ? ctrl.signal : undefined });
      let out;
      try { out = await res.json(); } catch (err) { return { error: 'net' }; }
      return out || { error: 'net' };
    } catch (err) {
      return { error: err && err.name === 'AbortError' ? 'timeout' : 'net' };
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return; // กดซ้ำระหว่างรอ
    const problem = phoneProblem(input.value);
    if (problem) {
      setError(problem);
      input.focus();
      return;
    }
    const phone = normPhone(input.value);
    setError('');
    busy = true;
    btn.disabled = true;
    btn.textContent = 'กำลังค้นหา…';
    form.setAttribute('aria-busy', 'true');
    statusEl.textContent = 'กำลังค้นหา…';
    results.innerHTML = '';
    const out = await search(phone);
    busy = false;
    btn.disabled = false;
    btn.textContent = 'ค้นหาการจอง';
    form.removeAttribute('aria-busy');

    if (out.ok && Array.isArray(out.bookings)) {
      remember(phone);
      showResults(out.bookings);
      const first = results.querySelector('.voucher, .mb-empty');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    statusEl.textContent = '';
    if (out.error === 'net') {
      setError(navigator.onLine === false
        ? 'ไม่มีอินเทอร์เน็ต กรุณาเชื่อมต่อแล้วลองใหม่'
        : `เชื่อมต่อระบบไม่สำเร็จ ลองใหม่อีกครั้ง หรือโทร ${PHONE}`);
    } else if (out.error === 'timeout') {
      setError('ระบบตอบช้า ลองใหม่อีกครั้ง');
    } else if (SERVER_TEXT[out.error]) {
      setError(SERVER_TEXT[out.error]);
    } else {
      // ระบบหลังบ้าน (Code.gs) ยังเป็นรุ่นเก่า: ตอบเหมือนเป็นการจอง เช่น bad_house / bad_dates
      setError(NOT_READY);
    }
  });
  input.addEventListener('input', () => { if (errorEl.textContent) setError(''); });

  // ---------- จำเบอร์ล่าสุดไว้ในเครื่องนี้ ----------
  function remember(phone) {
    try {
      localStorage.setItem(SAVED_PHONE_KEY, phone);
      savedEl.hidden = false;
    } catch (err) { /* โหมดส่วนตัว: ไม่จำ */ }
  }
  try {
    const saved = localStorage.getItem(SAVED_PHONE_KEY);
    if (saved && normPhone(saved)) {
      input.value = saved.replace(/^(\d{3})(\d{3})(\d{3,4})$/, '$1-$2-$3');
      savedEl.hidden = false;
    }
  } catch (err) { /* ข้าม */ }
  $('#mb-clear').addEventListener('click', () => {
    try { localStorage.removeItem(SAVED_PHONE_KEY); } catch (err) { /* ข้าม */ }
    input.value = '';
    savedEl.hidden = true;
    results.innerHTML = '';
    statusEl.textContent = 'ล้างเบอร์ที่จำไว้แล้ว';
    setError('');
    input.focus();
  });

  // ---------- ปุ่มบนใบยืนยัน ----------
  const plainText = (b) => {
    const st = statusInfo(b);
    return [
      'The Lagoon Camping Resort — ใบยืนยันการจอง',
      `รหัสการจอง: ${b.id || 'ไม่มีรหัส (จองทางโทรศัพท์)'}`,
      `สถานะ: ${st.label}`,
      payNowText(b),
      ...rowsOf(b).map(([k, v]) => `${k}: ${v}`),
      refundText(b),
      st.active ? CHECK_TIMES : '',
      st.active ? `แผนที่: ${MAP_URL}` : '',
      `โทร: ${PHONE} · LINE ${LINE_ID}`,
    ].filter(Boolean).join('\n');
  };

  // ตัดข้อความให้พอดีความกว้าง (ภาษาไทยไม่มีเว้นวรรคระหว่างคำ → ตัดทีละตัวอักษรเมื่อจำเป็น ไม่ตัดกลางสระ/วรรณยุกต์)
  function wrapLines(ctx, text, maxW) {
    const marks = /[ัิ-ฺ็-๎]/;
    const units = [];
    Array.from(String(text)).forEach((ch) => {
      if (marks.test(ch) && units.length) units[units.length - 1] += ch;
      else units.push(ch);
    });
    const lines = [];
    let line = '';
    let lastSpace = -1;
    units.forEach((u) => {
      const next = line + u;
      if (ctx.measureText(next).width <= maxW || !line) {
        line = next;
        if (u === ' ') lastSpace = line.length;
        return;
      }
      if (lastSpace > 0 && lastSpace < line.length) {
        lines.push(line.slice(0, lastSpace).trimEnd());
        line = line.slice(lastSpace) + u;
      } else {
        lines.push(line);
        line = u.trimStart();
      }
      lastSpace = -1;
    });
    if (line) lines.push(line);
    return lines;
  }

  async function voucherCanvas(b) {
    try { await Promise.all([document.fonts.load('40px Chonburi'), document.fonts.load('600 28px Anuphan'), document.fonts.load('22px Anuphan')]); } catch (err) { /* ใช้ฟอนต์สำรอง */ }
    const st = statusInfo(b);
    const W = 720;
    const pad = 48;
    const inner = W - pad * 2;
    const colors = {
      ok: ['#e3f1e0', '#245c2e'], wait: ['#fff1d6', '#8a5300'], off: ['#ececec', '#555555'],
    }[st.cls];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // วางเนื้อหาก่อน (คำนวณความสูง) แล้วค่อยวาดจริง
    const ops = [];
    let y = 0;
    const text = (t, font, color, opts = {}) => {
      ctx.font = font;
      const lines = wrapLines(ctx, t, opts.maxW || inner);
      lines.forEach((ln) => {
        y += opts.lh;
        ops.push({ t: ln, font, color, x: opts.x || pad, y, align: opts.align || 'left' });
      });
    };
    y = 40;
    text('The Lagoon', '40px Chonburi, Anuphan, serif', '#2f4a36', { lh: 44, align: 'center', x: W / 2 });
    text('ใบยืนยันการจอง', '600 24px Anuphan, sans-serif', '#6b6a5f', { lh: 40, align: 'center', x: W / 2 });
    y += 24;
    const lineY1 = y;
    text('รหัสการจอง', '22px Anuphan, sans-serif', '#6b6a5f', { lh: 40, align: 'center', x: W / 2 });
    text(b.id || 'ไม่มีรหัส (จองทางโทรศัพท์)', b.id ? '600 52px Anuphan, sans-serif' : '600 32px Anuphan, sans-serif', '#1f231f', { lh: b.id ? 62 : 44, align: 'center', x: W / 2 });
    y += 20;
    const pillY = y;
    y += 48;
    const pay = payNowText(b);
    if (pay) { y += 8; text(pay, '600 22px Anuphan, sans-serif', '#8a5300', { lh: 32 }); }
    y += 16;
    rowsOf(b).forEach(([k, v, strong]) => {
      const top = y;
      text(k, '20px Anuphan, sans-serif', '#6b6a5f', { lh: 32, maxW: 190 });
      const afterLabel = y;
      y = top;
      text(v, `${strong ? '600 ' : ''}22px Anuphan, sans-serif`, strong ? '#a14b14' : '#1f231f', { lh: 32, x: pad + 200, maxW: inner - 200 });
      y = Math.max(y, afterLabel) + 8;
    });
    const refund = refundText(b);
    if (refund) text(refund, '20px Anuphan, sans-serif', '#555555', { lh: 30 });
    if (st.active) {
      y += 12;
      text(CHECK_TIMES, '20px Anuphan, sans-serif', '#1f231f', { lh: 30 });
      text(`แผนที่ ${MAP_URL}`, '20px Anuphan, sans-serif', '#2f4a36', { lh: 30 });
      text(`โทร ${PHONE} · LINE ${LINE_ID}`, '20px Anuphan, sans-serif', '#2f4a36', { lh: 30 });
      y += 16;
      text('แสดงรูปนี้กับเจ้าหน้าที่ตอนเช็กอิน', '600 22px Anuphan, sans-serif', '#2f4a36', { lh: 34, align: 'center', x: W / 2 });
    } else {
      text(`โทร ${PHONE} · LINE ${LINE_ID}`, '20px Anuphan, sans-serif', '#2f4a36', { lh: 30 });
    }
    const H = y + 40;

    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = '#fbf9f4';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2f4a36';
    ctx.fillRect(0, 0, W, 10);
    ctx.strokeStyle = '#e0d9ca';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(pad, lineY1);
    ctx.lineTo(W - pad, lineY1);
    ctx.stroke();
    ctx.setLineDash([]);
    // ป้ายสถานะ
    ctx.font = '600 24px Anuphan, sans-serif';
    const pw = ctx.measureText(st.label).width + 48;
    const px = (W - pw) / 2;
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px, pillY, pw, 44, 22); else ctx.rect(px, pillY, pw, 44);
    ctx.fill();
    ctx.fillStyle = colors[1];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.label, W / 2, pillY + 23);
    ctx.textBaseline = 'alphabetic';
    ops.forEach((o) => {
      ctx.font = o.font;
      ctx.fillStyle = o.color;
      ctx.textAlign = o.align;
      ctx.fillText(o.t, o.x, o.y);
    });
    return canvas;
  }

  results.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-save], [data-copy]');
    if (!el) return;
    const card = el.closest('.voucher');
    const b = shown[Number(card.dataset.i)];
    const msg = card.querySelector('.v-msg');
    if (!b) return;
    if (el.hasAttribute('data-save')) {
      el.disabled = true;
      try {
        const canvas = await voucherCanvas(b);
        if (!canvas) throw new Error('no canvas');
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `lagoon-${b.id || 'booking'}.png`;
        document.body.append(a);
        a.click();
        a.remove();
        msg.textContent = 'บันทึกรูปแล้ว (ดูในรูปภาพหรือไฟล์ดาวน์โหลด)';
      } catch (err) {
        msg.textContent = 'บันทึกรูปไม่สำเร็จ — แคปหน้าจอใบยืนยันนี้แทนได้';
      } finally {
        el.disabled = false;
      }
      return;
    }
    // คัดลอก: ลอง clipboard → execCommand → โชว์กล่องให้กดค้างคัดลอกเอง (แบบเดียวกับ js/booking.js)
    const txt = plainText(b);
    try {
      await navigator.clipboard.writeText(txt);
      msg.textContent = 'คัดลอกแล้ว';
      return;
    } catch (err) { /* วิธีสำรอง */ }
    const box = card.querySelector('.v-copy-text');
    box.value = txt;
    box.hidden = false;
    box.focus();
    box.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
    if (copied) {
      box.hidden = true;
      msg.textContent = 'คัดลอกแล้ว';
    } else {
      msg.textContent = 'คัดลอกอัตโนมัติไม่ได้ — กดค้างที่ข้อความด้านล่างเพื่อคัดลอก';
    }
  });

  // ให้ทดสอบได้ในคอนโซล (ไม่มีผลกับการใช้งาน)
  window.lagoonMyBooking = { normPhone, phoneProblem, thaiDate, voucherCanvas: (i) => voucherCanvas(shown[i]) };
})();
