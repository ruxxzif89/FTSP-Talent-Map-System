import * as api from '../api.js';
import { store, lecturerOf, categoryOf } from '../api.js';
import { html, mount, $, icon, download, toCsv, fmtDate } from '../util.js';
import { DEPARTMENTS, ENTITIES, LEVELS } from '../schema.js';
import { pageHead } from './_ui.js';

const lec = (id) => lecturerOf(id) || {};
// Each report: title + builder returning {head, rows} (plain strings so CSV and on-screen table agree).
const REPORTS = {
  directory: { title: 'Direktori pensyarah', build: (f) => ({ head: ['No. Staf', 'Nama', 'Jawatan', 'Jabatan', 'E-mel', 'Telefon'], rows: store.lecturers.filter((l) => !f.dept || l.department === f.dept).map((l) => [l.staff_id, l.full_name, l.position, l.department, l.email, l.phone]) }) },
  matrix: { title: 'Matriks kepakaran', build: (f) => ({ head: ['Pensyarah', 'Jabatan', 'Kategori', 'Kepakaran', 'Tahap', 'Tahun'], rows: store.expertise.filter((e) => (!f.dept || lec(e.lecturer_id).department === f.dept) && (!f.level || e.level === f.level)).map((e) => [lec(e.lecturer_id).full_name, lec(e.lecturer_id).department, (categoryOf(e.category_id) || {}).name, e.area, e.level, e.years]).sort((a, b) => String(a[2]).localeCompare(String(b[2])) || String(a[0]).localeCompare(String(b[0]))) }) },
};
for (const k of ['research', 'publications', 'certifications', 'training', 'consultancy', 'achievements']) {
  const E = ENTITIES[k];
  REPORTS[k] = { title: E.plural, build: (f) => ({ head: ['Pensyarah', 'Jabatan', ...E.columns.map((c) => c.label)], rows: store[k].filter((r) => (!f.dept || lec(r.lecturer_id).department === f.dept) && (!f.year || String(r.year || (r.date || r.issue_date || '').slice(0, 4)) === f.year)).map((r) => [lec(r.lecturer_id).full_name, lec(r.lecturer_id).department, ...E.columns.map((c) => c.fmt === 'date' || c.fmt === 'expiry' ? (r[c.key] || '') : r[c.key])]) }) };
}

export async function render(root) {
  const f = { type: 'matrix', dept: '', level: '', year: '' };
  const years = [...new Set([...store.research, ...store.publications, ...store.consultancy, ...store.achievements].map((r) => r.year))].sort((a, b) => b - a);
  mount(root, html`${pageHead('Laporan', 'Tapis, pratonton, kemudian eksport ke CSV atau cetak / simpan sebagai PDF.', html`<button class="btn ghost" id="pr">${icon('print', 18)} Cetak / PDF</button><button class="btn primary" id="ex">${icon('download', 18)} Eksport CSV</button>`)}
    <div class="card no-print" style="margin-bottom:18px"><div class="toolbar" style="margin:0"><select class="input" id="t" style="max-width:240px" aria-label="Jenis laporan">${Object.entries(REPORTS).map(([k, r]) => html`<option value="${k}">${r.title}</option>`)}</select>
      <select class="input" id="d" style="max-width:220px" aria-label="Jabatan"><option value="">Semua jabatan</option>${DEPARTMENTS.map((d) => html`<option>${d}</option>`)}</select>
      <select class="input" id="l" style="max-width:200px" aria-label="Tahap"><option value="">Semua tahap</option>${LEVELS.map((d) => html`<option>${d}</option>`)}</select>
      <select class="input" id="y" style="max-width:160px" aria-label="Tahun"><option value="">Semua tahun</option>${years.map((y) => html`<option>${y}</option>`)}</select></div><p class="small faint" style="margin-top:8px">Tahap terpakai untuk matriks kepakaran; tahun terpakai untuk rekod bertarikh.</p></div>
    <div id="out"></div>`);
  const cur = () => REPORTS[f.type].build(f);
  const draw = () => {
    const { head, rows } = cur();
    $('#out', root).innerHTML = html`<div class="card" style="padding:0"><div class="row between" style="padding:16px 20px"><h3 style="margin:0">${REPORTS[f.type].title}</h3><span class="small muted">${rows.length} baris · dijana pada ${fmtDate(new Date())}${f.dept ? ' · ' + f.dept : ''}</span></div>${rows.length ? html`<div class="tbl-wrap" style="border:0;border-radius:0;box-shadow:none;border-top:1px solid var(--line)"><table><thead><tr>${head.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${rows.slice(0, 200).map((r) => html`<tr>${r.map((c) => html`<td>${c === '' || c == null ? '—' : c}</td>`)}</tr>`)}</tbody></table>${rows.length > 200 ? html`<div class="pager"><span>Memaparkan 200 pertama daripada ${rows.length}. Eksport CSV untuk semua baris.</span></div>` : ''}</div>` : html`<div class="empty">${icon('report', 36)}<h3>Tiada baris sepadan dengan penapis ini</h3></div>`}</div>`.s;
  };
  [['t', 'type'], ['d', 'dept'], ['l', 'level'], ['y', 'year']].forEach(([id, k]) => ($('#' + id, root).onchange = (e) => { f[k] = e.target.value; draw(); }));
  $('#ex', root).onclick = () => { const { head, rows } = cur(); download(`laporan-fstp-${f.type}.csv`, toCsv(head, rows)); };
  $('#pr', root).onclick = () => print();
  draw();
}
