// Borang bercetak yang dijana daripada rekod pensyarah (Lampiran 1: CV Akademik, Lampiran 3: Senarai Semak) — sedia untuk dicetak / simpan PDF.
import { store } from '../api.js';
import { html, esc, icon, fmtDate, openDrawer } from '../util.js';
import { compileLampiran, windowStart, evaluate } from '../promotion/engine.js';
import { RULES, NEXT_GRADE, gradeLabel } from '../promotion/guideline.js';

export function openLampiran(lec, app, T = store) {
  const to = (app && app.to_grade) || NEXT_GRADE[lec.grade];
  let start = 0;
  try { if (to && RULES[to]) start = windowStart(lec, RULES[to](0).windowKey); } catch { /* tiada tetingkap */ }
  const sections = compileLampiran(lec, T, start);
  const ev = (() => { try { return evaluate(lec, T, { to }); } catch { return null; } })();
  const body = html`<div class="stack"><div class="row between no-print"><span class="small muted">Dijana daripada rekod anda. Semak sebelum mencetak.</span><button class="btn primary" id="prt">${icon('print', 18)} Cetak / Simpan PDF</button></div>
    <div class="sheet" id="sheet">
      <p class="center">UNIVERSITI PERTAHANAN NASIONAL MALAYSIA</p>
      <h2>LAMPIRAN 1 — CURRICULUM VITAE AKADEMIK</h2>
      <p class="center">Permohonan kenaikan pangkat: ${gradeLabel(lec.grade)} → ${gradeLabel(to)}</p>
      <h3>Bahagian A — Maklumat Calon</h3>
      <div class="meta"><b>Nama</b><span>${lec.full_name}</span><b>No. Staf</b><span>${lec.staff_id}</span><b>Jabatan</b><span>${lec.department}</span><b>Gred semasa</b><span>${gradeLabel(lec.grade)}</span><b>Tarikh lantikan</b><span>${fmtDate(lec.appointed_on)}</span><b>Tarikh masuk gred</b><span>${fmtDate(lec.grade_since)}</span><b>Bidang</b><span>${lec.field || '—'}</span><b>H-indeks SCOPUS</b><span>${lec.scopus_h_index || '—'}</span>${app && app.qualifications ? html`<b>Kelayakan akademik</b><span>${app.qualifications}</span>` : ''}${app && app.thesis_title ? html`<b>Tajuk tesis</b><span>${app.thesis_title}</span>` : ''}</div>
      <h3>Bahagian B — Aktiviti Akademik ${start ? `(mulai ${start})` : ''}</h3>
      ${sections.map((s) => s.rows.length ? html`<p style="margin:10px 0 3px"><b>${s.label}</b></p><table><thead><tr><th style="width:70px">Kod</th><th>Perkara</th><th>Butiran</th><th style="width:50px">Tahun</th></tr></thead><tbody>${s.rows.map((r) => html`<tr><td>${r.code}</td><td>${r.title}</td><td>${r.extra}</td><td>${r.year}</td></tr>`)}</tbody></table>` : '')}
      <h3>Lampiran 3 — Senarai Semak Kriteria Wajib Minimum</h3>
      ${ev && ev.ok ? html`<table><thead><tr><th>Bahagian</th><th>Kriteria</th><th style="width:70px">Status</th></tr></thead><tbody>${ev.components.map((c) => html`<tr><td>${c.label}</td><td>${c.node.type === 'leaf' ? c.node.label : c.node.type === 'any' && c.node.best ? c.node.best.label || c.node.label : c.node.label || ''}</td><td>${c.status === 'met' ? 'Dipenuhi' : 'Belum'}</td></tr>`)}</tbody></table>
      <p class="small" style="margin-top:6px">Ringkasan: ${ev.summary.metCount} / ${ev.summary.total} bahagian dipenuhi. Penjanaan sistem bukan pengesahan rasmi.</p>` : html`<p>Penilaian tidak tersedia.</p>`}
      <p style="margin-top:22px">Akuan calon: Saya mengaku maklumat di atas adalah benar.</p>
      <p style="margin-top:30px">Tandatangan: ______________________ &nbsp;&nbsp; Tarikh: ______________</p>
    </div></div>`;
  openDrawer({ title: 'Pratonton Borang Permohonan', body, wide: true, onMount: (el) => { el.querySelector('#prt').onclick = () => { document.body.classList.add('printing-sheet'); const done = () => { document.body.classList.remove('printing-sheet'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); window.print(); setTimeout(done, 3000); }; } });
}
