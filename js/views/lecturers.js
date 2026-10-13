import { store, categoryOf } from '../api.js';
import { html, mount, $, icon, avatar, levelClass, levelRank } from '../util.js';
import { DEPARTMENTS } from '../schema.js';
import { dataTable, pageHead, searchBox, debounce } from './_ui.js';

export async function render(root) {
  const st = { dept: '' };
  mount(root, html`${pageHead('Pensyarah', 'Direktori semua pensyarah FSTP.', html`<a class="btn primary" href="#/users">${icon('plus', 18)} Tambah akaun pensyarah</a>`)}
    <div class="toolbar">${searchBox('q', 'Cari nama, no. staf atau e-mel…')}<select class="input" id="d" style="max-width:240px" aria-label="Jabatan"><option value="">Semua jabatan</option>${DEPARTMENTS.map((d) => html`<option>${d}</option>`)}</select></div><div id="t"></div>`);
  const top = (l) => [...store.expertise.filter((e) => e.lecturer_id === l.id)].sort((a, b) => levelRank(b.level) - levelRank(a.level))[0];
  const t = dataTable($('#t', root), {
    rows: () => store.lecturers.filter((l) => !st.dept || l.department === st.dept),
    searchText: (l) => [l.full_name, l.staff_id, l.email, l.position].join(' '),
    columns: [
      { label: 'Pensyarah', sort: (l) => l.full_name, render: (l) => html`<a class="row" style="flex-wrap:nowrap;gap:10px;color:inherit" href="#/lecturer/${l.id}">${avatar(l, 34)}<span><b>${l.full_name}</b><br><small class="faint">${l.staff_id} · ${l.email}</small></span></a>` },
      { label: 'Jabatan', key: 'department' }, { label: 'Jawatan', key: 'position' },
      { label: 'Kepakaran utama', sort: (l) => (top(l) || {}).area || '', render: (l) => { const e = top(l); return e ? html`${e.area} <span class="badge ${levelClass(e.level)}">${e.level}</span>` : html`<span class="faint">Belum ada</span>`; } },
      { label: 'Rekod', sort: (l) => ['expertise', 'research', 'publications', 'certifications'].reduce((n, k) => n + store[k].filter((r) => r.lecturer_id === l.id).length, 0), render: (l) => ['expertise', 'research', 'publications', 'certifications'].reduce((n, k) => n + store[k].filter((r) => r.lecturer_id === l.id).length, 0) },
    ],
    actions: (l) => html`<a class="icon-btn" href="#/lecturer/${l.id}" aria-label="Lihat ${l.full_name}" title="Lihat profil">${icon('eye', 18)}</a>`,
  });
  $('#q', root).oninput = debounce((e) => t.search(e.target.value));
  $('#d', root).onchange = (e) => { st.dept = e.target.value; t.refresh(); };
}
