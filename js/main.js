// ปุ่ม "คัดลอก" เบอร์โทร: กดแล้วคัดลอกเบอร์ไปไว้ในคลิปบอร์ด
document.querySelectorAll('.copy').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'คัดลอกแล้ว';
      setTimeout(() => { button.textContent = 'คัดลอก'; }, 1600);
    } catch (err) {
      // ถ้าเบราว์เซอร์ไม่ให้คัดลอก ให้ไฮไลต์เบอร์แทน เพื่อให้ผู้ใช้กด Ctrl+C เอง
      const range = document.createRange();
      range.selectNodeContents(button.previousElementSibling);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
});

// ---------- แถบเตือน "มีการจองรอชำระ" (ทุกหน้า ยกเว้นหน้าจอง — js/booking.js จัดการเองในหน้านั้น) ----------
// js/booking.js จำการจองที่เพิ่งส่งไว้ในเครื่อง (คีย์ lagoon-booking: รหัส ยอด เวลาหมดเขต — ไม่มีชื่อ/เบอร์)
// ยังไม่หมดเวลาชำระ → โชว์แถบเล็กๆ มุมซ้ายล่าง ลิงก์ไป booking.html#pay · กด × = ซ่อนเฉพาะการจองนี้
(function pendingBanner() {
  if (document.getElementById('step-done')) return; // หน้าจอง
  const KEY = 'lagoon-booking';
  const HIDDEN_KEY = 'lagoon-booking-hidden';
  let p;
  let left;
  try {
    p = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!p) return;
    // เวลาหมดเขตเป็นเวลาไทย รูปแบบ 'yyyy-MM-dd HH:mm'
    const ok = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(p.deadline || '') && p.id;
    left = ok ? new Date(`${p.deadline.replace(' ', 'T')}:00+07:00`).getTime() - Date.now() : NaN;
    if (!(left > 0)) { localStorage.removeItem(KEY); return; }
    if (localStorage.getItem(HIDDEN_KEY) === String(p.id)) return;
  } catch (err) {
    return;
  }

  // ใช้ลิงก์ "จองที่พัก" ที่มีอยู่ในหน้าเป็นต้นแบบ (หน้า 404 ใช้ /booking.html)
  const bookLink = document.querySelector('a[href$="booking.html"]');
  const bar = document.createElement('aside');
  bar.className = 'pending-bar';
  bar.setAttribute('aria-label', 'การจองรอชำระ');
  const text = document.createElement('p');
  text.textContent = `มีการจองรอชำระ · ภายใน ${p.deadline.slice(11)} น.`;
  const go = document.createElement('a');
  go.href = `${bookLink ? bookLink.getAttribute('href') : 'booking.html'}#pay`;
  go.textContent = 'ดู QR / ส่งสลิป';
  const hide = document.createElement('button');
  hide.type = 'button';
  hide.setAttribute('aria-label', 'ซ่อน');
  hide.textContent = '×';
  hide.addEventListener('click', () => {
    try { localStorage.setItem(HIDDEN_KEY, String(p.id)); } catch (err) { /* ซ่อนแค่หน้านี้ */ }
    bar.remove();
  });
  // ลิงก์รอง: เช็กสถานะการจองด้วยเบอร์โทร (my-booking.html อยู่โฟลเดอร์เดียวกับหน้าจอง)
  const check = document.createElement('a');
  check.className = 'pb-sub';
  check.href = go.href.replace(/booking\.html#pay$/,'my-booking.html');
  check.textContent = 'เช็กการจองของฉัน';
  bar.append(text, go);
  if (!document.getElementById('mb-form')) bar.append(check); // อยู่หน้าเช็กการจองแล้ว ไม่ต้องโชว์
  bar.append(hide);
  document.body.append(bar);
  // ถึงเวลาหมดเขตระหว่างเปิดหน้าอยู่ → เอาแถบออก
  if (left < 2147483647) setTimeout(() => bar.remove(), left);
})();

// ---------- รายการ "ของที่ควรเตรียมมา" (เฉพาะหน้า stay.html #checklist) ----------
// ติ๊กแล้วจำไว้ในเครื่อง (คีย์ lagoon-pack: {ชื่อของ: true}) · ปุ่ม "ล้างเครื่องหมาย" = เอาติ๊กออกทั้งหมด
// ถ้าเบราว์เซอร์ไม่ให้ใช้ localStorage (เช่นโหมดส่วนตัว) ก็ยังติ๊กได้ แค่ไม่จำ
(function packChecklist() {
  const list = document.getElementById('pack-list');
  if (!list) return; // หน้าอื่นไม่มีรายการนี้
  const KEY = 'lagoon-pack';
  const boxes = list.querySelectorAll('input[type="checkbox"][data-pack]');
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (err) {
    saved = {};
  }
  boxes.forEach((box) => {
    box.checked = saved[box.dataset.pack] === true;
    box.addEventListener('change', () => {
      if (box.checked) saved[box.dataset.pack] = true;
      else delete saved[box.dataset.pack];
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (err) { /* ไม่จำ */ }
    });
  });
  const reset = document.getElementById('pack-reset');
  if (reset) {
    reset.addEventListener('click', () => {
      boxes.forEach((box) => { box.checked = false; });
      saved = {};
      try { localStorage.removeItem(KEY); } catch (err) { /* ไม่จำ */ }
    });
  }
})();
