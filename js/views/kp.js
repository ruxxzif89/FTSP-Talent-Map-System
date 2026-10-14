// Hab Kenaikan Pangkat (pensyarah): satu skrin, satu tindakan utama — "Apa yang perlu saya buat seterusnya?"
import { store, myLecturer } from '../api.js';
import { html, mount, icon, fmtDate } from '../util.js';
import { pageHead } from './_ui.js';
import { helpBtn } from '../help.js';
import { evaluate } from '../promotion/engine.js';
import { gradeLabel, NEXT_GRADE } from '../promotion/guideline.js';
import { ACTIVE_STATUSES } from '../promotion/workflow.js';
import { ring, ladder, componentCard, generalList, statusBadge, suggestHref, verdictTone } from './kpShared.js';
import { openLampiran } from './lampiran.js';

export async function render(root) {
  const lec = myLecturer();
  if (!lec) { mount(root, html`<div class="empty card">${icon('alert', 36)}<h3>Profil pensyarah tidak ditemui</h3></div>`); return; }
  const apps = store.promotion_applications.filter((a) => a.lecturer_id === lec.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const active = apps.find((a) => ACTIVE_STATUSES.includes(a.status));
  const ev = evaluate(lec, store, { today: new Date() });

  if (!ev.ok) {
    mount(root, html`${pageHead('Kenaikan Pangkat Saya', 'Semak kesediaan anda dan mohon apabila bersedia.', '', '', 'kp')}
      <div class="card empty">${icon('info', 40)}<h3>${ev.reason === 'top' ? 'Anda sudah di gred tertinggi' : 'Gred anda belum ditetapkan'}</h3><p>${ev.message}</p><p class="small faint" style="margin-top:8px">Maklumat gred, tarikh lantikan dan pengesahan ialah data Pejabat Pendaftar yang dimasukkan oleh Pentadbir.</p></div>
      ${history(apps)}`);
    return;
  }

  const s = ev.summary; const top = pickTop(ev);
  const cta = active
    ? html`<a class="btn primary" href="#/kp/${active.id}">${icon('arrow', 18)} ${active.status === 'draf' ? 'Teruskan draf permohonan' : 'Lihat status permohonan'}</a>`
    : s.ready ? html`<a class="btn primary" href="#/kp/mohon">${icon('arrow', 18)} Mulakan permohonan</a>`
      : html`<button class="btn primary" id="gototodo">${icon('arrow', 18)} Semak perkara yang perlu dilengkapkan</button>`;
  const hero = active
    ? html`<h2>Permohonan anda: ${statusBadge(active.status)}</h2><p>Permohonan ke ${gradeLabel(active.to_grade)} sedang berjalan. Klik butang di bawah untuk melihat langkah semasa dan apa yang berlaku seterusnya.</p>`
    : html`<h2>${s.verdictText}</h2><p>${s.ready ? `Semua kriteria wajib bagi ${gradeLabel(ev.to)} telah dipenuhi mengikut rekod anda. Anda boleh memulakan permohonan.` : `${s.metCount} daripada ${s.total} bahagian penilaian telah dipenuhi untuk ${gradeLabel(ev.to)}. Ikuti senarai "perkara paling penting" di bawah untuk melengkapkan rekod anda.`}</p>`;

  mount(root, html`
    ${pageHead('Kenaikan Pangkat Saya', `${gradeLabel(ev.from)} → ${gradeLabel(ev.to)}`, html`<a class="btn ghost" href="#/panduan">${icon('book', 18)} Panduan</a><a class="btn ghost" href="#/demo-kp">${icon('star', 18)} Demo berpandu</a>`, '', 'kp')}
    ${ladder(ev.from, ev.to)}
    <section class="kp-hero" aria-label="Ringkasan kesediaan">
      ${ring(s.pct, 'kesediaan')}
      <div class="stack" style="gap:12px;position:relative;z-index:1"><div>${hero}</div><div class="row">${cta}<button class="btn ghost" id="pv">${icon('print', 18)} Pratonton borang</button>${helpBtn('kp_preview')}${helpBtn('readiness', 'kesediaan')}</div><p class="small" style="opacity:.75">Aktiviti dikira ${ev.window.note || ''}${ev.window.start ? ` (mulai ${ev.window.start})` : ''} ${helpBtn('window')}</p></div>
    </section>
    ${!active && top.length ? html`<section class="card" id="todo" style="margin-top:18px"><h3>3 perkara paling penting sekarang ${helpBtn('verdict')}</h3>${top.map((g, i) => html`<div class="todo"><span class="n">${i + 1}</span><div class="tx"><b>${g.compLabel}</b><span>${g.text}</span></div>${g.suggest ? html`<a class="btn outline sm" href="${suggestHref(g.suggest)}">${icon('plus', 15)} ${g.suggest.text}</a>` : ''}</div>`)}</section>` : ''}
    <h2 style="font-size:18px;font-weight:800;margin:26px 0 12px">Bahagian penilaian ${helpBtn('or_branch', 'cara membaca')}</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))">${ev.components.map((c) => componentCard(c))}</div>
    <section class="card" style="margin-top:18px"><h3>Syarat umum</h3><p class="small muted" style="margin:-6px 0 8px">Sistem menyemak yang boleh disemak; yang lain disahkan oleh Pejabat Pendaftar / Fakulti semasa permohonan.</p>${generalList(ev.general)}</section>
    ${history(apps)}`);
  const gt = root.querySelector('#gototodo'); if (gt) gt.onclick = () => { const t = root.querySelector('#todo') || root.querySelector('.comp'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const pv = root.querySelector('#pv'); if (pv) pv.onclick = () => openLampiran(lec, active || null);
}

// 3 jurang teratas: satu bagi setiap komponen yang belum dipenuhi, bermula dengan yang paling hampir lengkap
function pickTop(ev) {
  const seen = new Set(); const out = [];
  const order = [...ev.components].filter((c) => c.status !== 'met').sort((a, b) => b.pct - a.pct);
  for (const c of order) { const g = c.gaps[0]; if (g && !seen.has(c.key)) { seen.add(c.key); out.push({ ...g, compLabel: c.label }); } }
  const sys = ev.general.filter((g) => g.status === 'fail').map((g) => ({ text: g.detail, compLabel: g.label, suggest: null }));
  return [...out, ...sys].slice(0, 3);
}

function history(apps) {
  const past = apps.filter((a) => !ACTIVE_STATUSES.includes(a.status));
  if (!past.length) return '';
  return html`<section class="card" style="margin-top:18px"><h3>Permohonan terdahulu</h3><div class="stack" style="gap:8px">${past.map((a) => html`<a class="todo" style="text-decoration:none;color:inherit" href="#/kp/${a.id}"><div class="tx"><b>${gradeLabel(a.from_grade)} → ${gradeLabel(a.to_grade)}</b><span>${fmtDate(a.submitted_at || a.created_at)}</span></div>${statusBadge(a.status)}${icon('chevron', 16)}</a>`)}</div></section>`;
}
