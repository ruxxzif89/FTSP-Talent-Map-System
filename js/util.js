// Tiny UI toolkit: safe templating, icons, toasts, drawer/dialog, formatting, charts.

const RAW = Symbol('raw');
export const raw = (s) => ({ [RAW]: true, s: String(s) });
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const str = (v) => (v == null || v === false ? '' : Array.isArray(v) ? v.map(str).join('') : v && v[RAW] ? v.s : esc(v));
// Tagged template: every interpolation is HTML-escaped unless it is itself html`` / raw().
export const html = (strings, ...vals) => raw(strings.reduce((o, s, i) => o + s + (i < vals.length ? str(vals[i]) : ''), ''));
export const mount = (el, tpl) => { el.innerHTML = tpl.s; return el; };
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---- icons (24px stroke set) ----
const P = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5c2.2.7 3.5 2.6 3.5 5.5"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.5 15h9"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"/>',
  cap: '<path d="M22 9 12 4 2 9l10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.500 6-3v-4.500"/><path d="M22 9v6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/>',
  map: '<path d="M9 4 3 6.500v13L9 17l6 3 6-2.500v-13L15 7z"/><path d="M9 4v13M15 7v13"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.200"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.500 7.500 2.500 7.500h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z"/><path d="m14 6 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M4 20h16"/>',
  eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.500 6.200A10 10 0 0 1 12 6c6.500 0 10 6 10 6a17 17 0 0 1-3.200 3.800M6.400 7.700A17 17 0 0 0 2 12s3.500 6 10 6a9.500 9.500 0 0 0 4-.9"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  out: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.500 4.500 4.500L19 7"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.500v.01"/>',
  cube: '<path d="m12 3 8.500 4.500v9L12 21l-8.500-4.500v-9z"/><path d="M12 12 3.500 7.500M12 12l8.500-4.500M12 12v9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.500"/><rect x="14" y="3" width="7" height="7" rx="1.500"/><rect x="3" y="14" width="7" height="7" rx="1.500"/><rect x="14" y="14" width="7" height="7" rx="1.500"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.500"/>',
  moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.500 8 8 9 4.500-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.500"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  play: '<path d="M7 4.500v15l12-7.500z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
};
export const icon = (name, size = 20, cls = '') => raw(`<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`);

export const logo = (size = 36) => raw(`<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#f2b705" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"><path d="M44 18 24 8 4 18l20 10z"/><path d="M12 23v9c0 3 5.500 6 12 6s12-3 12-6v-9"/><path d="M44 18v12"/></svg>`);

// ---- formatting ----
export const fmtDate = (d) => { if (!d) return '—'; const x = new Date(d); return isNaN(x) ? esc(d) : x.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' }); };
export const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
export const initials = (name) => String(name).replace(/^(Prof\.? Madya|Prof\.?|Dr\.?|Mr\.?|Ms\.?|Puan|Encik|Cik)\s+/gi, '').replace(/^(Prof\.? Madya|Prof\.?|Dr\.?)\s+/gi, '').split(/\s+/).filter((w) => !/^(bin|binti|bt|b\.?|a\/l|a\/p)$/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hue = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
export const avatar = (l, size = 40) => l && l.photo
  ? html`<img class="avatar" style="width:${size}px;height:${size}px" src="${l.photo}" alt="">`
  : html`<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;background:linear-gradient(135deg,hsl(${hue(l ? l.full_name : '?')} 55% 42%),hsl(${(hue(l ? l.full_name : '?') + 40) % 360} 60% 32%))" aria-hidden="true">${l ? initials(l.full_name) : '?'}</span>`;
// Kunci Bahasa Malaysia ialah nilai kanonik; kunci Inggeris dikekalkan supaya rekod lama masih dipaparkan dengan betul.
export const levelClass = (l) => ({ Pakar: 'lv-expert', Mahir: 'lv-adv', Pertengahan: 'lv-int', Asas: 'lv-beg', Expert: 'lv-expert', Advanced: 'lv-adv', Intermediate: 'lv-int', Beginner: 'lv-beg' }[l] || '');
export const levelPct = (l) => ({ Asas: 25, Pertengahan: 55, Mahir: 80, Pakar: 100, Beginner: 25, Intermediate: 55, Advanced: 80, Expert: 100 }[l] || 0);
export const levelRank = (l) => ({ Asas: 1, Pertengahan: 2, Mahir: 3, Pakar: 4, Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 }[l] || 0);
export const statusClass = (s) => ({ Selesai: 'ok', Diterbitkan: 'ok', Active: 'ok', 'Sedang Berjalan': 'info', 'Dalam Percetakan': 'info', Dirancang: 'warn', 'Dalam Semakan': 'warn', Draf: 'mute', Inactive: 'mute', Completed: 'ok', Published: 'ok', Ongoing: 'info', 'In Press': 'info', Planned: 'warn', 'Under Review': 'warn', Draft: 'mute' }[s] || 'mute');

export const download = (filename, content, mime = 'text/csv;charset=utf-8') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
export const toCsv = (head, rows) => '﻿' + [head, ...rows].map((r) => r.map((c) => { let s = String(c ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');

// ---- toast ----
export function toast(msg, kind = 'ok') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = (kind === 'err' ? icon('alert', 18) : icon('check', 18)).s + '<span></span>'; t.lastChild.textContent = msg;
  box.append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, kind === 'err' ? 5000 : 3000);
}

// ---- drawer / dialog (focus-trapped) ----
let lastFocus;
function trap(el, onClose) {
  const key = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', el).filter((x) => x.offsetParent !== null);
    if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  el.addEventListener('keydown', key);
}
export function openDrawer({ title, body, wide = false, onMount }) {
  lastFocus = document.activeElement;
  const wrap = document.createElement('div'); wrap.className = 'overlay';
  wrap.innerHTML = `<aside class="drawer ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2></h2><button class="icon-btn" data-x aria-label="Tutup">${icon('x').s}</button></header><div class="drawer-body"></div></aside>`;
  $('h2', wrap).textContent = title; $('.drawer-body', wrap).innerHTML = body.s;
  document.body.append(wrap); document.body.classList.add('noscroll');
  const onHash = () => close(); // navigasi (butang Kembali, pautan) menutup panel supaya ia tidak tertinggal di halaman lain
  const close = () => { removeEventListener('hashchange', onHash); wrap.classList.add('out'); document.body.classList.remove('noscroll'); setTimeout(() => { wrap.remove(); lastFocus && lastFocus.focus && lastFocus.focus(); }, 200); };
  addEventListener('hashchange', onHash);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  $('[data-x]', wrap).onclick = close; trap(wrap, close);
  requestAnimationFrame(() => { wrap.classList.add('in'); const f = $('input:not([type=hidden]),select,textarea', wrap); f && f.focus(); });
  onMount && onMount($('.drawer-body', wrap), close);
  return close;
}
export function confirmDialog({ title, message, confirm = 'Padam', danger = true }) {
  return new Promise((res) => {
    lastFocus = document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'overlay center';
    wrap.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t"><h2 id="dlg-t"></h2><p></p><div class="row end"><button class="btn ghost" data-no>Batal</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes></button></div></div>`;
    $('h2', wrap).textContent = title; $('p', wrap).textContent = message; $('[data-yes]', wrap).textContent = confirm;
    document.body.append(wrap);
    const done = (v) => { wrap.classList.add('out'); setTimeout(() => { wrap.remove(); lastFocus && lastFocus.focus && lastFocus.focus(); }, 150); res(v); };
    $('[data-no]', wrap).onclick = () => done(false); $('[data-yes]', wrap).onclick = () => done(true); trap(wrap, () => done(false));
    requestAnimationFrame(() => { wrap.classList.add('in'); $('[data-no]', wrap).focus(); });
  });
}

// ---- charts (SVG, no deps) ----
export function barChart(data, { height = 190, color = '#3b82f6' } = {}) {
  const max = Math.max(1, ...data.map((d) => d.value)); const W = 560, H = height, pad = { l: 28, b: 38, t: 18 };
  const bw = (W - pad.l) / data.length; const ticks = 4;
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carta bar">${[...Array(ticks + 1)].map((_, i) => { const v = Math.round((max / ticks) * i); const y = H - pad.b - ((H - pad.b - pad.t) * i) / ticks; return html`<line x1="${pad.l}" x2="${W}" y1="${y}" y2="${y}" class="grid"/><text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" class="axis">${v}</text>`; })}${data.map((d, i) => { const h = ((H - pad.b - pad.t) * d.value) / max; const x = pad.l + i * bw + bw * 0.2; return html`<g class="bar"><rect x="${x}" y="${H - pad.b - h}" width="${bw * 0.6}" height="${h}" rx="4" fill="${d.color || color}"><title>${d.label}: ${d.value}</title></rect><text x="${x + bw * 0.3}" y="${H - pad.b - h - 5}" text-anchor="middle" class="val">${d.value}</text><text x="${x + bw * 0.3}" y="${H - pad.b + 14}" text-anchor="middle" class="axis">${trunc(d.label, Math.max(6, Math.floor(bw / 6.500)))}</text></g>`; })}</svg>`;
}
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
export const PALETTE = ['#1d5fd1', '#22a06b', '#f2b705', '#8b5cf6', '#ef6c4d', '#0ea5b7', '#d946a8', '#64748b'];
export function donut(data, { center = '', sub = '' } = {}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1; let acc = 0; const R = 54, C = 2 * Math.PI * R;
  return html`<div class="donut-wrap"><svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Carta donat"><circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--line)" stroke-width="20"/>${data.map((d, i) => { const len = (d.value / total) * C; const el = html`<circle cx="70" cy="70" r="${R}" fill="none" stroke="${d.color || PALETTE[i % PALETTE.length]}" stroke-width="20" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${d.label}: ${d.value}</title></circle>`; acc += len; return el; })}<text x="70" y="68" text-anchor="middle" class="donut-n">${center}</text><text x="70" y="84" text-anchor="middle" class="axis">${sub}</text></svg><ul class="legend">${data.map((d, i) => html`<li><i style="background:${d.color || PALETTE[i % PALETTE.length]}"></i>${d.label} <b>${Math.round((d.value / total) * 100)}%</b></li>`)}</ul></div>`;
}
