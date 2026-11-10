// =========================================================
// ปุ่มเลือกภาษา (ไทย / English) + โหมดสว่าง / โหมดมืด — ใช้ทุกหน้า
// - ใส่ไว้ใน <head> แบบไม่มี defer (ไฟล์เล็กมาก) เพื่อตั้งค่าก่อนหน้าเว็บโชว์ จะได้ไม่กะพริบ
// - จำค่าที่ลูกค้าเลือกไว้ในเครื่อง (localStorage) เปิดหน้าอื่น/กลับมาใหม่ยังเป็นแบบเดิม
// - ภาษาไทยเป็นค่าเริ่มต้นเสมอ · เลือก English แล้วจะโหลด js/i18n-en.js มาแปลข้อความบนหน้า
//   (ข้อความในไฟล์ .html ยังเป็นภาษาไทยเหมือนเดิม แก้ข้อความไทยแล้วต้องแก้คำแปลใน js/i18n-en.js ด้วย)
// - โหมดมืด: ถ้ายังไม่เคยกดเลือก จะตามการตั้งค่าเครื่องลูกค้า (สีอยู่ใน css/style.css)
// - ลิงก์ ?lang=en หรือ ?lang=th เปิดภาษานั้นได้เลย (เช่นส่งลิงก์ให้ลูกค้าต่างชาติ)
// =========================================================
(function () {
  var root = document.documentElement;
  var LANG_KEY = 'lagoon-lang';
  var THEME_KEY = 'lagoon-theme';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* โหมดส่วนตัว: ไม่จำค่า */ } }

  // โฟลเดอร์ js/ (หาจากที่อยู่ไฟล์นี้เอง ใช้ได้ทั้งหน้า 404 ที่อยู่ลึก)
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/prefs\.js(\?.*)?$/, '') : 'js/';
  var VERSION = (me && me.split('?')[1]) || '';

  // ---------- โหมดสว่าง/มืด ----------
  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function savedTheme() { var t = get(THEME_KEY); return t === 'light' || t === 'dark' ? t : ''; }
  function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : !!(darkMq && darkMq.matches); }
  function applyTheme(t) {
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    // สีแถบเบราว์เซอร์บนมือถือ ให้ตรงกับสีเมนู
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark() ? '#10130f' : '#1f3b2c');
    syncButtons();
  }
  if (savedTheme()) root.setAttribute('data-theme', savedTheme());

  // ---------- ภาษา ----------
  var m = location.search.match(/[?&]lang=(en|th)\b/);
  if (m) set(LANG_KEY, m[1] === 'en' ? 'en' : '');
  var lang = get(LANG_KEY) === 'en' ? 'en' : 'th';
  var dictLoading = null;
  function loadDict() {
    if (window.LagoonI18n) return Promise.resolve();
    if (dictLoading) return dictLoading;
    dictLoading = new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = base + 'i18n-en.js' + (VERSION ? '?' + VERSION : '');
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
    return dictLoading;
  }
  function reveal() { root.classList.remove('i18n-wait'); }
  if (lang === 'en') {
    root.lang = 'en';
    // ซ่อนหน้าแป๊บเดียวระหว่างแปล (ไม่ให้เห็นภาษาไทยกะพริบ) · ช้าเกิน 2.5 วินาทีก็โชว์เลย
    root.classList.add('i18n-wait');
    setTimeout(reveal, 2500);
    loadDict().then(function () { window.LagoonI18n.start(reveal); }, reveal);
  }
  function setLang(next) {
    lang = next;
    set(LANG_KEY, next === 'en' ? 'en' : '');
    root.lang = next === 'en' ? 'en' : 'th';
    if (next === 'en') loadDict().then(function () { window.LagoonI18n.start(); syncButtons(); });
    else if (window.LagoonI18n) window.LagoonI18n.stop();
    syncButtons();
  }

  // ---------- ปุ่มบนเมนู ----------
  var ICON_MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var ICON_SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var langBtn, themeBtn;
  function syncButtons() {
    var en = lang === 'en';
    if (langBtn) {
      langBtn.textContent = en ? 'ไทย' : 'EN';
      langBtn.setAttribute('lang', en ? 'th' : 'en');
      langBtn.setAttribute('aria-label', en ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English');
      langBtn.title = langBtn.getAttribute('aria-label');
    }
    if (themeBtn) {
      var dark = isDark();
      var label = dark ? (en ? 'Light mode' : 'โหมดสว่าง') : (en ? 'Dark mode' : 'โหมดมืด');
      themeBtn.innerHTML = (dark ? ICON_SUN : ICON_MOON) + '<span>' + label + '</span>';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.title = label;
    }
  }
  function addButtons() {
    var nav = document.querySelector('.nav .wrap');
    if (!nav || nav.querySelector('.pref-btn')) return;
    langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'pref-btn pref-lang';
    langBtn.setAttribute('data-i18n-skip', '');
    langBtn.addEventListener('click', function () { setLang(lang === 'en' ? 'th' : 'en'); });

    themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'pref-btn pref-theme';
    themeBtn.setAttribute('data-i18n-skip', '');
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      // ถ้าตรงกับการตั้งค่าเครื่องอยู่แล้ว ไม่ต้องจำ (เปลี่ยนเครื่องเป็นโหมดมืดทีหลังจะตามได้)
      var sys = darkMq && darkMq.matches ? 'dark' : 'light';
      set(THEME_KEY, next === sys ? '' : next);
      applyTheme(next === sys ? '' : next);
    });

    // ปุ่มภาษา: อยู่บนแถบเมนูเสมอ จับคู่กับปุ่ม "จองที่พัก" (มือถือ: ก่อนปุ่ม "เมนู")
    // ปุ่มโหมดมืด: จอใหญ่เป็นไอคอนท้ายแถวเมนู · มือถืออยู่ท้ายรายการเมนู
    var menuBtn = nav.querySelector('.menu-btn');
    var book = nav.querySelector(':scope > .btn');
    var actions = document.createElement('div');
    actions.className = 'nav-actions';
    nav.insertBefore(actions, book || menuBtn || null);
    actions.appendChild(langBtn);
    if (book) actions.appendChild(book);
    var list = nav.querySelector('ul');
    if (list) {
      var li = document.createElement('li');
      li.className = 'pref-item';
      li.appendChild(themeBtn);
      list.appendChild(li);
    } else nav.insertBefore(themeBtn, langBtn);
    syncButtons();
  }
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', function () { if (!savedTheme()) applyTheme(''); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButtons);
  else addButtons();
  // ข้ามหน้าในแท็บอื่นแล้วเปลี่ยนค่า → หน้านี้เปลี่ยนตาม
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY) applyTheme(savedTheme());
    if (e.key === LANG_KEY) setLang(e.newValue === 'en' ? 'en' : 'th');
  });
  window.LagoonPrefs = { lang: function () { return lang; }, setLang: setLang, isDark: isDark };
})();
