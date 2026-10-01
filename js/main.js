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
