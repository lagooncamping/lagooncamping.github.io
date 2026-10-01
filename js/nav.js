// มือถือ: เลื่อนหน้าลง → ซ่อนเมนูด้านบนให้เห็นเนื้อหาเต็มจอ / เลื่อนขึ้น → เมนูกลับมา
(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const mobile = window.matchMedia('(max-width: 720px)');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!mobile.matches || y < 120 || goingUp) nav.classList.remove('is-hidden');
    else if (goingDown) nav.classList.add('is-hidden');
    if (goingDown || goingUp) lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  // ถ้ากด Tab มาที่เมนู ให้เมนูโผล่เสมอ
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
})();
