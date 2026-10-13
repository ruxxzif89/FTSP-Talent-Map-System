import * as api from '../api.js';
import { store, myLecturer, lecturerOf, categoryOf } from '../api.js';
import { html, mount, $, icon, barChart, donut, fmtDate, levelPct, levelRank, avatar } from '../util.js';
import { ENTITIES, DEPARTMENTS, LEVELS } from '../schema.js';
import { pageHead } from './_ui.js';

const tile = (key, n, label, to) => html`<a class="stat tint-${ENTITIES[key] ? ENTITIES[key].tint : key}" href="${to}"><span class="si">${icon(ENTITIES[key].icon, 22)}</span><b>${n}</b><span class="l">${label}</span><span class="more">Lihat Butiran ${icon('arrow', 14)}</span></a>`;
const ago = (iso) => { const d = Math.floor((Date.now() - new Date(iso)) / 864e5); return d <= 0 ? 'Hari ini' : d === 1 ? 'Semalam' : d < 30 ? d + ' hari lalu' : fmtDate(iso); };

export function completion(l) {
  const checks = [l.photo, l.phone, l.bio, l.location, l.position, l.department, l.full_name,
    store.expertise.some((e) => e.lecturer_id === l.id), store.research.some((e) => e.lecturer_id === l.id), store.publications.some((e) => e.lecturer_id === l.id), store.certifications.some((e) => e.lecturer_id === l.id)];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function render(root) {
  return store.me.role === 'admin' ? admin(root) : lecturer(root);
}

function activityList(rows, showWho) {
  if (!rows.length) return html`<p class="muted">Belum ada aktiviti.</p>`;
  return html`<ul class="act-list">${rows.map((r) => html`<li><span class="ico">${icon(/Menambah|Memuat naik|Added|Uploaded/.test(r.message) ? 'plus' : /Memadam|Removed/.test(r.message) ? 'trash' : 'edit', 16)}</span><span>${r.message}${showWho ? html` <span class="faint">· ${(lecturerOf(r.lecturer_id) || {}).full_name}</span>` : ''}</span><span class="d">${ago(r.created_at)}</span></li>`)}</ul>`;
}

function admin(root) {
  const draw = (dept) => {
    const exp = store.expertise.filter((e) => !dept || (lecturerOf(e.lecturer_id) || {}).department === dept);
    const by = store.expertise_categories.map((c) => ({ label: c.name, value: new Set(exp.filter((e) => e.category_id === c.id).map((e) => e.lecturer_id)).size, color: c.color })).sort((a, b) => b.value - a.value).slice(0, 8);
    $('#bars', root).innerHTML = barChart(by).s;
  };
  const dep = DEPARTMENTS.map((d) => ({ label: d, value: store.lecturers.filter((l) => l.department === d).length })).filter((d) => d.value);
  const recent = [...store.activity_log].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  mount(root, html`
    ${pageHead('Papan Pemuka', 'Gambaran keseluruhan bakat dan kepakaran pensyarah FSTP')}
    <div class="grid g4">
      <a class="stat tint-blue" href="#/lecturers"><span class="si">${icon('users', 22)}</span><b>${store.lecturers.length}</b><span class="l">Pensyarah</span><span class="more">Lihat Butiran ${icon('arrow', 14)}</span></a>
      <a class="stat tint-green" href="#/categories"><span class="si">${icon('tag', 22)}</span><b>${store.expertise_categories.length}</b><span class="l">Kategori Kepakaran</span><span class="more">Lihat Butiran ${icon('arrow', 14)}</span></a>
      ${tile('publications', store.publications.length, 'Penerbitan Penyelidikan', '#/publications')}
      ${tile('certifications', store.certifications.length, 'Pensijilan', '#/certifications')}
    </div>
    <section class="card" style="margin-top:18px"><h3>Galaksi Kepakaran <a class="small" href="#/talent">Buka dalam Pemetaan Bakat →</a></h3>
      <div class="galaxy" id="gx" style="height:min(52vh,440px)"><div class="tip" id="tip"></div><div class="gx-wait" aria-hidden="true">Memuatkan galaksi 3D…</div><div class="fallback" id="fb"><p>Paparan 3D memerlukan WebGL, yang tidak tersedia di sini.</p></div><div class="hud"><span>Setiap pusat bercahaya ialah satu kategori kepakaran; setiap titik ialah seorang pensyarah</span><span>Seret untuk putar · tatal untuk zum · klik titik untuk membuka profil</span></div></div></section>
    <div class="grid g-2-1" style="margin-top:18px">
      <section class="card"><h3>Taburan Kepakaran <select class="input" id="dsel" style="max-width:210px;min-height:38px" aria-label="Jabatan"><option value="">Semua Jabatan</option>${DEPARTMENTS.map((d) => html`<option>${d}</option>`)}</select></h3><div id="bars"></div><p class="small faint" style="margin-top:6px">Bilangan pensyarah bagi setiap kategori kepakaran.</p></section>
      <section class="card"><h3>Pensyarah Mengikut Jabatan</h3>${donut(dep, { center: store.lecturers.length, sub: 'Pensyarah' })}</section>
    </div>
    <div class="grid g2" style="margin-top:18px">
      <section class="card"><h3>Aktiviti Terkini</h3>${activityList(recent, true)}</section>
      <section class="card"><h3>Pensijilan Hampir Tamat Tempoh</h3>${expiring()}</section>
    </div>`);
  draw('');
  $('#dsel', root).onchange = (e) => draw(e.target.value);

  // Lazy: Three.js (~700 KB from the CDN) and the scene are only fetched/built once the card nears the viewport.
  let galaxy = null, gone = false, started = false, io = null;
  const start = () => {
    if (started || gone) return; started = true;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    idle(() => { if (!gone) load(); }, { timeout: 1500 }); // after first paint + data, never before
  };
  const load = () => {
    import('../three/galaxy.js').then((m) => {
      if (gone) return;
      galaxy = m.createGalaxy($('#gx', root), { lecturers: store.lecturers, expertise: store.expertise, categories: store.expertise_categories, onOpen: (id) => (location.hash = '#/lecturer/' + id), tip: $('#tip', root) });
      if (!galaxy) $('#fb', root).style.display = 'grid';
    }).catch(() => { const fb = $('#fb', root); if (fb) fb.style.display = 'grid'; });
  };
  const box = $('#gx', root);
  if ('IntersectionObserver' in window) { io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '250px' }); io.observe(box); } else start();
  return () => { gone = true; if (io) io.disconnect(); if (galaxy) galaxy.dispose(); };
}

function expiring() {
  const rows = store.certifications.filter((c) => c.expiry_date && new Date(c.expiry_date) > Date.now() && (new Date(c.expiry_date) - Date.now()) / 864e5 <= 120).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)).slice(0, 5);
  return rows.length ? html`<ul class="act-list">${rows.map((c) => html`<li><span class="ico">${icon('alert', 16)}</span><span>${c.name}<br><small class="faint">${(lecturerOf(c.lecturer_id) || {}).full_name || ''}</small></span><span class="d">${fmtDate(c.expiry_date)}</span></li>`)}</ul>` : html`<p class="muted">Tiada pensijilan tamat tempoh dalam 120 hari akan datang.</p>`;
}

function lecturer(root) {
  const me = myLecturer(); const pct = completion(me);
  const top = [...store.expertise].sort((a, b) => levelRank(b.level) - levelRank(a.level) || b.years - a.years).slice(0, 5);
  const recent = [...store.activity_log].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  mount(root, html`
    <section class="card welcome">
      <div class="row" style="flex-wrap:nowrap;gap:16px">${avatar(me, 60)}<div><h1 style="font-size:22px;font-weight:800">Selamat datang, ${me.full_name}</h1><p class="muted">Jabatan ${me.department}, FSTP</p></div></div>
      <div><div class="row between small" style="margin-bottom:6px"><b>Kelengkapan Profil</b><b>${pct}%</b></div><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Kelengkapan profil"><i style="width:0" data-w="${pct}"></i></div>${pct < 100 ? html`<p class="small muted" style="margin-top:6px"><a href="#/profile">Lengkapkan profil anda</a> supaya lebih mudah ditemui.</p>` : ''}</div>
    </section>
    <div class="grid g4" style="margin-top:18px">
      ${tile('expertise', store.expertise.length, 'Kepakaran', '#/expertise')}${tile('research', store.research.length, 'Penyelidikan', '#/research')}${tile('publications', store.publications.length, 'Penerbitan', '#/publications')}${tile('certifications', store.certifications.length, 'Pensijilan', '#/certifications')}
    </div>
    <div class="grid g2" style="margin-top:18px">
      <section class="card"><h3>Aktiviti Terkini</h3>${activityList(recent)}</section>
      <section class="card"><h3>Kepakaran Saya (5 Teratas) <a class="small" href="#/expertise">Lihat Semua →</a></h3>${top.length ? top.map((e) => html`<div class="lvbar"><span>${e.area}</span><span class="bar"><i style="width:${levelPct(e.level)}%"></i></span><span class="t">${e.level}</span></div>`) : html`<p class="muted">Tambah kepakaran anda supaya rakan sekerja dapat menemui anda.</p>`}</section>
    </div>
    <div class="grid g4" style="margin-top:18px">${['training', 'consultancy', 'achievements', 'documents'].map((k) => tile(k, store[k].length, ENTITIES[k].plural, '#/' + k))}</div>`);
  requestAnimationFrame(() => root.querySelectorAll('[data-w]').forEach((i) => (i.style.width = i.dataset.w + '%')));
}
