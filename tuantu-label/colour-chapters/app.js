// Tuấn Tú Label mockup: language switch, the test strip (variable data), the feeding web, marquees, reveals.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let lang = 'vi';

  // ---------- VI / EN ----------
  // Every translatable element carries data-en (inner HTML) or data-en-<attr>; the Vietnamese is read
  // from the page itself the first time, so the HTML stays the single source for VI.
  function setLang(next) {
    if (next === lang) return;
    lang = next;
    for (const el of $$('[data-en]')) {
      if (!('vi' in el.dataset)) el.dataset.vi = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.vi;
    }
    for (const el of $$('*')) {
      for (const a of [...el.attributes]) {
        if (!a.name.startsWith('data-en-')) continue;
        const attr = a.name.slice(8), keep = 'data-vi-' + attr;
        if (!el.hasAttribute(keep)) el.setAttribute(keep, el.getAttribute(attr) || '');
        el.setAttribute(attr, lang === 'en' ? a.value : el.getAttribute(keep));
      }
    }
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Tuấn Tú Label | Label printing in Ho Chi Minh City on HP Indigo' : 'Tuấn Tú Label | In tem nhãn tại TP.HCM trên HP Indigo';
    renderStrip(false);
  }
  $('#lang').addEventListener('click', () => setLang(lang === 'vi' ? 'en' : 'vi'));
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  // ---------- the test strip ----------
  const serial = (n) => 'TT-' + String(n).padStart(6, '0');
  function qrSvg(text) {
    if (typeof qrcode !== 'function') return '';
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#121417"/></svg>`;
  }
  const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const nameIn = $('#try-name'), startIn = $('#try-start'), strip = $('#strip');
  function renderStrip(animate = true) {
    const name = nameIn.value.trim() || (lang === 'en' ? 'Your product' : 'Sản phẩm của bạn');
    let start = parseInt(startIn.value, 10);
    if (!Number.isFinite(start) || start < 1) start = 1;
    start = Math.min(start, 999996);
    const note = lang === 'en' ? 'Printed on HP Indigo' : 'In trên HP Indigo';
    strip.innerHTML = [0, 1, 2, 3].map((i) => {
      const s = serial(start + i);
      return `<div class="label${animate ? ' is-new' : ''}" style="--i:${i}">${qrSvg(s + ' ' + name)}<div><div class="label__name">${esc(name)}</div><div class="label__serial">${s}</div><div class="label__note">${note}</div></div></div>`;
    }).join('');
  }
  // self-check: serials pad to six digits and run on without gaps
  console.assert(serial(7) === 'TT-000007' && serial(1201) === 'TT-001201', 'serial format');
  let t;
  [nameIn, startIn].forEach((el) => el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(renderStrip, 180); }));
  // a different start for each visit, so the strip is never the same twice
  startIn.value = 1000 + Math.floor(Math.random() * 8000);
  renderStrip(false);

  // ---------- hero web: labels feeding off the roll ----------
  const web = $('#web');
  const base = Number(startIn.value);
  const tags = Array.from({ length: 16 }, (_, i) => `<div class="tag"><b>${serial(base + 7 - (i % 8))}</b><span>Tuấn Tú</span></div>`).join('');
  web.innerHTML = tags;

  // ---------- proof band ----------
  const names = ['Decal giấy', 'Decal nhựa', 'Tem bảo hành', 'Tem vỡ', 'Tem QR', 'Số serial', 'Ép kim'];
  const dots = ['var(--cyan)', 'var(--magenta)', 'var(--gold)', 'var(--blue)', 'var(--paper)'];
  const run = names.map((n, i) => `<span>${n}<i style="--c:${dots[i % dots.length]}"></i></span>`).join('');
  $('#band').innerHTML = run + run;

  // ---------- photo strip: duplicate for a seamless drift ----------
  const track = $('.strip-photos__track');
  track.insertAdjacentHTML('beforeend', track.innerHTML);

  // ---------- quote form (wired to the ERP later) ----------
  $('#quote-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.reportValidity()) return;
    $('#quote-status').textContent = lang === 'en'
      ? 'Thank you. This mockup does not send yet; the form will be connected to the ERP.'
      : 'Cảm ơn bạn. Bản mockup chưa gửi đi; form sẽ được nối vào ERP.';
  });

  // ---------- reveals, once ----------
  const targets = $$('[data-reveal], [data-grow]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => targets.forEach((el) => {
    const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
  }), 2500));
})();
