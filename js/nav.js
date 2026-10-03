// เมนูด้านบน
// 1) มือถือ: เลื่อนหน้าลง → ซ่อนเมนูด้านบนให้เห็นเนื้อหาเต็มจอ / เลื่อนขึ้น → เมนูกลับมา
// 2) หน้าแรก: เลื่อนพ้นด้านบนแล้ว เมนูเปลี่ยนจากโปร่งใสเป็นสีเขียว
// 3) มือถือ: ปุ่ม "เมนู" กดเปิด-ปิดรายการเมนู (กด Esc หรือกดที่อื่นเพื่อปิด)
(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const mobile = window.matchMedia('(max-width: 960px)');
  let lastY = window.scrollY;
  let ticking = false;

  // ---------- ปุ่ม "เมนู" (มีเฉพาะหน้าที่ใส่ปุ่มไว้ หน้าอื่นข้ามส่วนนี้ไป) ----------
  const btn = nav.querySelector('.menu-btn');
  const menu = btn && document.getElementById(btn.getAttribute('aria-controls'));
  const isOpen = () => nav.classList.contains('is-open');

  function setOpen(open, returnFocus) {
    if (!btn || !menu) return;
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) nav.classList.remove('is-hidden');
    if (!open && returnFocus) btn.focus();
  }

  if (btn && menu) {
    btn.addEventListener('click', () => {
      const open = !isOpen();
      setOpen(open);
      // เปิดแล้วให้โฟกัสไปที่ลิงก์แรก (สำหรับคนใช้คีย์บอร์ด)
      if (open && btn.matches(':focus-visible')) {
        const first = menu.querySelector('a');
        if (first) first.focus();
      }
    });
    // กด Esc → ปิดเมนู แล้วกลับไปที่ปุ่ม
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setOpen(false, true);
    });
    // กดที่อื่นนอกแถบเมนู → ปิด
    document.addEventListener('click', (e) => {
      if (isOpen() && !nav.contains(e.target)) setOpen(false);
    });
    // กดลิงก์ในเมนู → ปิด (เผื่อเป็นลิงก์ในหน้าเดียวกัน)
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    // โฟกัสออกจากแถบเมนู (กด Tab ผ่านไป) → ปิด
    nav.addEventListener('focusout', (e) => {
      if (isOpen() && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
    });
    // ขยายจอเป็นจอใหญ่ → ปิดเมนูมือถือ
    mobile.addEventListener('change', () => { if (!mobile.matches) setOpen(false); });
  }

  // ---------- ซ่อน/แสดงเมนูตอนเลื่อนหน้า ----------
  function update() {
    const y = window.scrollY;
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    nav.classList.toggle('is-solid', y > 40);
    if (!mobile.matches || y < 120 || goingUp || isOpen()) nav.classList.remove('is-hidden');
    else if (goingDown) nav.classList.add('is-hidden');
    if (goingDown || goingUp) lastY = y;
    ticking = false;
  }

  update(); // ตั้งค่าเริ่มต้น (เผื่อเปิดหน้ามาแล้วเลื่อนลงไว้แล้ว)

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  // ถ้ากด Tab มาที่เมนู ให้เมนูโผล่เสมอ
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
