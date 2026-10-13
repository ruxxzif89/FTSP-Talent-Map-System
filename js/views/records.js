// Generic CRUD page driven by ENTITIES (expertise, research, publications, ... documents).
import * as api from '../api.js';
import { store, lecturerOf, myLecturer } from '../api.js';
import { html, mount, $, icon, toast, openDrawer, confirmDialog, download, toCsv, avatar } from '../util.js';
import { ENTITIES } from '../schema.js';
import { fieldHtml, readForm, busy, dataTable, pageHead, searchBox, cell, saveDownload, debounce } from './_ui.js';

export async function render(root, { entity, lecturer: lecFilter }) {
  const E = ENTITIES[entity]; const admin = store.me.role === 'admin';
  const me = myLecturer();
  const state = { lec: '' };
  const rowsFn = () => store[E.table].filter((r) => !state.lec || r.lecturer_id === state.lec);
  const lecCol = admin ? [{ label: 'Lecturer', render: (r) => { const l = lecturerOf(r.lecturer_id); return l ? html`<a class="row" style="gap:8px;flex-wrap:nowrap;color:inherit" href="#/lecturer/${l.id}">${avatar(l, 26)}<span>${l.full_name}</span></a>` : '—'; }, sort: (r) => (lecturerOf(r.lecturer_id) || {}).full_name || '' }] : [];
  const columns = [...lecCol, ...E.columns];
  const docBtn = (r) => {
    const d = entity === 'documents' ? r : api.docOf(r.document_id);
    return d ? html`<button class="icon-btn" data-dl="${d.id}" aria-label="Download file for ${E.title(r)}" title="Download">${icon('download', 18)}</button>` : '';
  };

  mount(root, html`
    ${pageHead(admin ? E.plural : E.mine, admin ? `All lecturers' ${E.plural.toLowerCase()} records.` : `Manage your ${E.plural.toLowerCase()} records.`,
      html`<button class="btn ghost" id="exp">${icon('download', 18)} Export CSV</button><button class="btn primary" id="add">${icon('plus', 18)} Add ${E.singular}</button>`)}
    <div class="toolbar">${searchBox('q', `Search ${E.plural.toLowerCase()}…`)}${admin ? html`<select class="input" id="lf" style="max-width:260px" aria-label="Filter by lecturer"><option value="">All lecturers</option>${[...store.lecturers].sort((a, b) => a.full_name.localeCompare(b.full_name)).map((l) => html`<option value="${l.id}">${l.full_name}</option>`)}</select>` : ''}</div>
    <div id="tbl"></div>`);

  const tbl = dataTable($('#tbl', root), {
    columns, rows: rowsFn,
    searchText: (r) => [E.title(r), ...E.columns.map((c) => (c.fmt === 'category' ? (api.categoryOf(r[c.key]) || {}).name : r[c.key])), (lecturerOf(r.lecturer_id) || {}).full_name].join(' '),
    actions: (r) => html`${docBtn(r)}<button class="icon-btn" data-edit="${r.id}" aria-label="Edit ${E.title(r)}" title="Edit">${icon('edit', 18)}</button><button class="icon-btn del" data-del="${r.id}" aria-label="Delete ${E.title(r)}" title="Delete">${icon('trash', 18)}</button>`,
    empty: { title: `No ${E.plural.toLowerCase()} yet`, text: `Add your first ${E.singular.toLowerCase()} record to get started.`, cta: html`<button class="btn primary" data-empty-add style="margin-top:14px">${icon('plus', 18)} Add ${E.singular}</button>` },
  });
  $('#q', root).oninput = debounce((e) => tbl.search(e.target.value));
  const lf = $('#lf', root); if (lf) { if (lecFilter) { lf.value = lecFilter; state.lec = lecFilter; tbl.refresh(); } lf.onchange = () => { state.lec = lf.value; tbl.refresh(); }; }

  const form = (row) => {
    const base = entity === 'documents' && row ? E.fields.filter((f) => f.name !== 'file') : E.fields; // editing a document only changes its metadata
    const fields = admin && !row ? [{ name: 'lecturer_id', label: 'Lecturer', type: 'lecturer', required: true }, ...base] : base;
    const body = html`<form class="form" id="rf" novalidate>${fields.map((f) => fieldHtml(f, f.name === 'lecturer_id' ? state.lec : row ? row[f.name] ?? '' : f.name === 'year' ? new Date().getFullYear() : ''))}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn primary" type="submit" id="sv">Save ${E.singular}</button></div></form>`;
    openDrawer({
      title: `${row ? 'Edit' : 'Add New'} ${E.singular}`, body,
      onMount: (el, close) => {
        $('[data-cancel]', el).onclick = close;
        $('#rf', el).onsubmit = async (ev) => {
          ev.preventDefault();
          const { values, files, ok } = readForm(ev.target, fields); if (!ok) return;
          const btn = $('#sv', el); busy(btn, true);
          try {
            const lid = values.lecturer_id || (row && row.lecturer_id) || (me && me.id);
            if (entity === 'documents') {
              if (row) await api.update('documents', row.id, { title: values.title, doc_type: values.doc_type });
              else await api.upload(files.file, { lecturer_id: lid, doc_type: values.doc_type, title: values.title });
            } else {
              for (const f of fields.filter((x) => x.type === 'file')) {
                if (files[f.name]) { const d = await api.upload(files[f.name], { lecturer_id: lid, doc_type: f.docType || 'Other', title: E.title(values) || files[f.name].name }); values[f.name] = d.id; } else delete values[f.name];
              }
              if (row) await api.update(E.table, row.id, values); else await api.create(E.table, values);
            }
            toast(`${E.singular} saved.`); close(); tbl.refresh();
          } catch (e) { toast(e.message, 'err'); busy(btn, false, `Save ${E.singular}`); }
        };
      },
    });
  };
  $('#add', root).onclick = () => form(null);
  $('#exp', root).onclick = () => {
    const rows = rowsFn(); const head = [...(admin ? ['Lecturer', 'Staff ID'] : []), ...E.columns.map((c) => c.label)];
    download(`${entity}.csv`, toCsv(head, rows.map((r) => [...(admin ? [(lecturerOf(r.lecturer_id) || {}).full_name, (lecturerOf(r.lecturer_id) || {}).staff_id] : []), ...E.columns.map((c) => (c.fmt === 'category' ? (api.categoryOf(r[c.key]) || {}).name : r[c.key]))])));
  };
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-empty-add')) return form(null);
    if (t.dataset.edit) return form(store[E.table].find((r) => r.id === t.dataset.edit));
    if (t.dataset.dl) return saveDownload(t.dataset.dl);
    if (t.dataset.del) {
      const r = store[E.table].find((x) => x.id === t.dataset.del);
      if (await confirmDialog({ title: `Delete ${E.singular.toLowerCase()}?`, message: `“${E.title(r)}” will be permanently removed.` })) {
        try { await api.remove(E.table, r.id); toast(`${E.singular} deleted.`); tbl.refresh(); } catch (er) { toast(er.message, 'err'); }
      }
    }
  });
}
