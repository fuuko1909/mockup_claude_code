// Tuấn Tú Label mockup: language switch, QR labels, the test strip, tabs, accordion, index preview, reveals.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let lang = 'vi';

  // ---------- QR as an SVG path (qrcode-generator, MIT) ----------
  if (window.qrcode) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qrPath = (text) => {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, d };
  };
  const qrSvg = (text) => {
    if (!window.qrcode) return '';
    const { n, d } = qrPath(text);
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true"><path d="${d}" fill="#0b2238"/></svg>`;
  };

  // ---------- the product tile: three round QR labels ----------
  $$('.spec-qr').forEach((g) => {
    const serial = g.dataset.serial;
    const ns = 'http://www.w3.org/2000/svg';
    const disc = document.createElementNS(ns, 'circle');
    disc.setAttribute('r', '62'); disc.setAttribute('fill', '#176fc0');
    g.appendChild(disc);
    if (window.qrcode) {
      const { n, d } = qrPath(`TUAN TU LABEL|${serial}`);
      const s = 52 / n;
      const bg = document.createElementNS(ns, 'rect');
      Object.entries({ x: -30, y: -40, width: 60, height: 60, fill: '#ffffff' }).forEach(([k, v]) => bg.setAttribute(k, v));
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d); p.setAttribute('fill', '#0b2238');
      p.setAttribute('transform', `translate(-26 -36) scale(${s})`);
      p.setAttribute('shape-rendering', 'crispEdges');
      g.append(bg, p);
    }
    const t = document.createElementNS(ns, 'text');
    Object.entries({ y: 38, 'text-anchor': 'middle', 'font-family': 'Lexend', 'font-weight': 700, 'font-size': 12, fill: '#ffffff' }).forEach(([k, v]) => t.setAttribute(k, v));
    t.textContent = serial;
    g.appendChild(t);
  });

  // ---------- the live strip ----------
  const strip = $('#strip');
  const nameIn = $('#tr-name');
  const startIn = $('#tr-start');
  const roll = $('.roll');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const renderStrip = (feed) => {
    if (!strip) return;
    const name = nameIn.value.trim() || (lang === 'en' ? 'Your product' : 'Sản phẩm của bạn');
    const digits = startIn.value.replace(/\D/g, '');
    const width = Math.max(digits.length, 6);
    const start = parseInt(digits || '1', 10);
    // only whole labels: as many as fit between the roll and the right margin
    const run = getComputedStyle(strip);
    const first = strip.firstElementChild;
    const w = first ? first.offsetWidth : 216;
    const gap = parseFloat(run.columnGap) || 40;
    const room = strip.clientWidth - parseFloat(run.paddingLeft) - (innerWidth < 641 ? 16 : 40);
    const count = Math.max(1, Math.min(12, Math.floor((room + gap) / (w + gap))));
    let html = '';
    for (let i = 0; i < count; i++) {
      const serial = 'TT-' + String(start + i).padStart(width, '0');
      html += `<li class="lbl"><span class="lbl__name">${esc(name)}</span><span class="lbl__qr">${qrSvg(`${name}|${serial}`)}</span><span class="lbl__serial">${serial}</span></li>`;
    }
    strip.innerHTML = html;
    if (feed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const el of [strip, roll]) { el.classList.remove('is-feeding'); void el.offsetWidth; el.classList.add('is-feeding'); }
    }
  };
  let timer;
  const onType = () => { clearTimeout(timer); timer = setTimeout(() => renderStrip(true), 160); };
  nameIn?.addEventListener('input', onType);
  startIn?.addEventListener('input', () => { startIn.value = startIn.value.replace(/\D/g, ''); onType(); });
  renderStrip(false);
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; renderStrip(false); } });

  // ---------- HP Indigo tabs ----------
  const tabs = $$('[role="tab"]');
  const panel = $('#p-press');
  const keyOf = (t) => t.id.replace('t-', '');
  const showTab = (tab, focus) => {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    panel.textContent = panel.dataset[`${lang}${keyOf(tab)[0].toUpperCase()}${keyOf(tab).slice(1)}`];
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); showTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  // ---------- process accordion ----------
  const stages = $$('.stage');
  stages.forEach((st) => {
    $('.stage__btn', st).addEventListener('click', () => {
      stages.forEach((o) => {
        const on = o === st;
        o.classList.toggle('is-open', on);
        $('.stage__btn', o).setAttribute('aria-expanded', on);
      });
      // keyboard users land inside the opened stage
      if (matchMedia('(min-width: 641px)').matches) $('.stage__body', st).setAttribute('tabindex', '-1'), $('.stage__body', st).focus({ preventScroll: true });
    });
  });

  // ---------- index with preview, anchored to the row ----------
  (() => {
    const root = $('.index');
    if (!root) return;
    const frame = $('.index__frame', root);
    const picture = $('img', frame);
    const wide = matchMedia('(min-width: 900px)');
    let warmed = false;
    const show = (row) => {
      if (!wide.matches) return;
      if (!warmed) { warmed = true; $$('[data-preview]', root).forEach((a) => { new Image().src = a.dataset.preview; }); }
      picture.src = row.dataset.preview;
      const y = row.offsetTop + row.offsetHeight / 2 - frame.offsetHeight / 2;
      const max = root.offsetHeight - frame.offsetHeight;
      const opening = !frame.classList.contains('is-open');
      if (opening) frame.style.transitionProperty = 'clip-path';
      frame.style.transform = `translateY(${Math.min(max, Math.max(0, y))}px)`;
      if (opening) { frame.getBoundingClientRect(); frame.style.transitionProperty = ''; }
      frame.classList.add('is-open');
    };
    // the frame stays open on the last row pointed at; it starts on the first row
    const rows = $$('.index__row', root);
    rows.forEach((row) => {
      row.addEventListener('pointerenter', () => show(row));
      row.addEventListener('focus', () => show(row));
    });
    if (rows[0]) show(rows[0]);
    wide.addEventListener('change', () => rows[0] && show(rows[0]));
  })();

  // ---------- quote form (mockup: ERP comes later) ----------
  const form = $('#quote-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    $('#quote-sent').hidden = false;
  });

  // ---------- language switch ----------
  const ATTRS = [['enPlaceholder', 'placeholder'], ['enAria', 'aria-label'], ['enAlt', 'alt']];
  const setLang = (next) => {
    if (next === lang) return;
    $$('[data-en]').forEach((el) => {
      if (el.dataset.vi === undefined) el.dataset.vi = el.innerHTML;
      el.innerHTML = next === 'en' ? el.dataset.en : el.dataset.vi;
    });
    for (const [key, attr] of ATTRS) {
      $$(`[data-${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}]`).forEach((el) => {
        const viKey = 'vi' + attr.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
        if (el.dataset[viKey] === undefined) el.dataset[viKey] = el.getAttribute(attr) || '';
        el.setAttribute(attr, next === 'en' ? el.dataset[key] : el.dataset[viKey]);
      });
    }
    lang = next;
    document.documentElement.lang = next;
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === next));
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (active) showTab(active);
    renderStrip(false);
  };
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  // ---------- reveal once ----------
  const targets = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
    addEventListener('load', () => setTimeout(() => targets.forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
    }), 2500));
  } else targets.forEach((el) => el.classList.add('is-in'));
})();
