// Tuấn Tú Label mockup: language switch, fitted wordmarks, Code 128 barcodes, the label run, small motion.

// ---------- Code 128 (set B): real, scannable bars ----------
const C128 = ('212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 ' +
  '122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 ' +
  '212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 ' +
  '113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 ' +
  '431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 ' +
  '241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 ' +
  '131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112').split(' ');
console.assert(C128.length === 107 && C128.slice(0, 106).every((p) => [...p].reduce((a, b) => a + +b, 0) === 11), 'Code 128 table broken');

function code128(text) {
  const vals = [104, ...[...text].map((c) => c.charCodeAt(0) - 32)];
  const check = vals.reduce((sum, v, i) => sum + v * (i || 1), 0) % 103;
  return [...vals, check, 106].map((v) => C128[v]).join('');
}

// Bars as SVG rects, filling width x height in user units.
function barsSVG(text, w, h, color = '#0f2236') {
  const widths = [...code128(text)].map(Number);
  const modules = widths.reduce((a, b) => a + b, 0);
  const u = w / modules;
  let x = 0, out = '';
  widths.forEach((m, i) => { if (i % 2 === 0) out += `<rect x="${(x * u).toFixed(2)}" y="0" width="${(m * u).toFixed(2)}" height="${h}" fill="${color}"/>`; x += m; });
  return out;
}

// ---------- language ----------
const i18nEls = [...document.querySelectorAll('[data-en]')];
i18nEls.forEach((el) => { el.dataset.vi = el.innerHTML; });
const attrEls = ['aria-label', 'alt'].flatMap((a) => [...document.querySelectorAll(`[data-en-${a}]`)].map((el) => [el, a, el.getAttribute(a) || '']));
let lang = 'vi';
const T = { vi: { no: 'Số', word: 'Tem số', file: 'Chưa chọn file', ok: 'Đã nhận yêu cầu. Chúng tôi sẽ gọi lại trong giờ làm việc.', bad: 'Vui lòng điền họ tên, số điện thoại, loại tem và số lượng.', note: (n, s) => `Mẫu in thử: "${n}", số bắt đầu ${s}.` },
  en: { no: 'No.', word: 'Label no.', file: 'No file chosen', ok: 'Request received. We will call you back within working hours.', bad: 'Please fill in your name, phone, label type and quantity.', note: (n, s) => `Sample run: "${n}", starting at ${s}.` } };

function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  i18nEls.forEach((el) => { el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.vi; });
  attrEls.forEach(([el, a, vi]) => el.setAttribute(a, l === 'en' ? el.getAttribute(`data-en-${a}`) : vi));
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  document.getElementById('heroWord').textContent = T[l].word;
  renderRoll(false);
  fitAll();
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------- fitted wordmarks: one line, margin to margin ----------
function fitAll() {
  document.querySelectorAll('[data-fit]').forEach((el) => {
    const box = el.parentElement.clientWidth - parseFloat(getComputedStyle(el.parentElement).paddingLeft || 0) - parseFloat(getComputedStyle(el.parentElement).paddingRight || 0);
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * box / el.scrollWidth).toFixed(2) + 'px';
  });
}
fitAll();
document.fonts && document.fonts.ready.then(fitAll);
addEventListener('resize', fitAll);

// ---------- hero label: a different number on every visit ----------
const visitNo = 'TT-' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
document.getElementById('heroSerial').textContent = visitNo;
document.getElementById('heroBar').innerHTML = barsSVG(visitNo, 188, 66);

// ---------- the label run ----------
const roll = document.getElementById('roll');
const nameIn = document.getElementById('tryName');
const startIn = document.getElementById('tryStart');
function renderRoll(animate = true) {
  const name = nameIn.value.trim() || nameIn.defaultValue;
  const start = Math.max(0, Math.min(99999994, parseInt(startIn.value, 10) || 0));
  roll.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const n = String(start + i).padStart(8, '0');
    const code = 'TT' + n;
    const safe = name.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    return `<li class="tem${animate ? ' is-new' : ''}" style="--i:${i}"><span class="tem__name">${safe}</span><span class="tem__no">${T[lang].no} ${n}</span>` +
      `<span class="tem__bar"><svg viewBox="0 0 200 52" preserveAspectRatio="none" role="img" aria-label="Code 128 ${code}">${barsSVG(code, 200, 52)}</svg></span><span class="tem__cap">${code}</span></li>`;
  }).join('');
}
let rollTimer;
[nameIn, startIn].forEach((el) => el.addEventListener('input', () => { clearTimeout(rollTimer); rollTimer = setTimeout(renderRoll, 160); }));
renderRoll(false);

// "Quote this label" carries the run into the quote form.
document.getElementById('tryQuote').addEventListener('click', () => {
  document.getElementById('qType').value = 'serial';
  document.getElementById('qNote').value = T[lang].note(nameIn.value.trim() || nameIn.defaultValue, startIn.value || 0);
});

// ---------- product index: description in the empty columns ----------
const desc = document.querySelector('.feat__desc');
document.querySelectorAll('.feat__col li').forEach((li) => {
  const show = () => {
    document.querySelectorAll('.feat__col li.is-on').forEach((x) => x.classList.remove('is-on'));
    li.classList.add('is-on');
    desc.innerHTML = `<strong>${li.textContent}</strong><span>${lang === 'en' ? li.dataset.dEn : li.dataset.d}</span>`;
  };
  li.addEventListener('mouseenter', show);
  li.addEventListener('focus', show);
});

// ---------- uses: one lit name moving through the sentence ----------
const uses = [...document.querySelectorAll('#uses span')];
let lit = 0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
uses[0].classList.add('is-lit');
setInterval(() => { uses[lit].classList.remove('is-lit'); lit = (lit + 1) % uses.length; uses[lit].classList.add('is-lit'); }, reduce ? 4000 : 2000);

// ---------- quote form (to be wired to the ERP) ----------
const qf = document.getElementById('quoteForm');
document.getElementById('qFile').addEventListener('change', (e) => {
  document.getElementById('fileName').textContent = e.target.files[0] ? e.target.files[0].name : T[lang].file;
});
qf.addEventListener('submit', (e) => {
  e.preventDefault();
  const ok = qf.checkValidity();
  document.getElementById('quoteOk').textContent = ok ? T[lang].ok : T[lang].bad;
  if (!ok) qf.querySelector(':invalid').focus();
});

// ---------- reveals: once, never left hidden ----------
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  targets.forEach((el) => io.observe(el));
})();

// ---------- the one moving picture pauses off screen ----------
const vid = document.querySelector('.band video');
if (vid) {
  if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); }
  else new IntersectionObserver(([en]) => { en.isIntersecting ? vid.play().catch(() => {}) : vid.pause(); }).observe(vid);
}
