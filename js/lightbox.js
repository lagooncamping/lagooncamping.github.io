// กดรูปเพื่อดูภาพขยายเต็มจอ (แกลเลอรี รูปในหน้าราคา และรูปบ้านในหน้าจอง)
// เปลี่ยนรูป: ปุ่ม ‹ › / ลูกศรซ้ายขวา / ปัดนิ้ว · ปิด: ปุ่ม × / กดพื้นที่ว่าง / Esc
(() => {
  const SELECTOR = '.gallery img, .board .photo, .slides img';
  if (!document.querySelector(SELECTOR)) return;

  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'ภาพขยาย');
  box.innerHTML = `
    <figure><img alt=""><figcaption></figcaption></figure>
    <p class="lb-count" aria-live="polite"></p>
    <button type="button" class="lb-close" aria-label="ปิดภาพขยาย">×</button>
    <button type="button" class="lb-prev" aria-label="รูปก่อนหน้า">‹</button>
    <button type="button" class="lb-next" aria-label="รูปถัดไป">›</button>`;
  document.body.appendChild(box);
  const big = box.querySelector('img');
  const cap = box.querySelector('figcaption');
  const count = box.querySelector('.lb-count');
  let group = [];
  let index = 0;

  // ให้กดรูปด้วยคีย์บอร์ดได้ด้วย (Tab ไปที่รูป แล้วกด Enter)
  document.querySelectorAll(SELECTOR).forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `ดูภาพขยาย: ${img.alt}`);
  });

  // รูปที่อยู่ในแกลเลอรีเดียวกัน / การ์ดบ้านเดียวกัน = เลื่อนดูต่อกันได้
  const groupOf = (img) => [...(img.closest('.gallery, .slides, .price-grid') || document.body).querySelectorAll(SELECTOR)];
  const captionOf = (img) =>
    img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt.replace(/^รูปตัวอย่าง:\s*/, '');

  function show(i) {
    index = (i + group.length) % group.length;
    const img = group[index];
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    cap.textContent = captionOf(img);
    count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : '';
    box.classList.toggle('single', group.length < 2);
  }

  function open(img) {
    group = groupOf(img);
    show(group.indexOf(img));
    box.showModal();
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest?.(SELECTOR);
    if (img) open(img);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches?.(SELECTOR) && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      open(e.target);
    }
  });

  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  // กดพื้นที่ว่างรอบรูป = ปิด
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.tagName === 'FIGURE') box.close();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // ปัดนิ้วซ้าย-ขวาบนมือถือ
  let startX = null;
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (startX === null || group.length < 2) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
