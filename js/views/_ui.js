// Shared view helpers: form builder + validator, sortable/paged table, cell formatters.
import * as api from '../api.js';
import { store } from '../api.js';
import { html, raw, esc, $, $$, icon, fmtDate, fmtSize, levelClass, statusClass, toast } from '../util.js';
import { MAX_FILE_BYTES, FILE_ACCEPT } from '../schema.js';

// ---------- cell formatting ----------
export function cell(fmt, v, row) {
  switch (fmt) {
    case 'level': return html`<span class="badge ${levelClass(v)}">${v}</span>`;
    case 'status': return html`<span class="badge ${statusClass(v)}">${v}</span>`;
    case 'category': { const c = api.categoryOf(v); return c ? html`<span class="row" style="gap:8px;flex-wrap:nowrap"><i style="width:9px;height:9px;border-radius:50%;background:${c.color}"></i>${c.name}</span>` : '—'; }
    case 'date': return fmtDate(v);
    case 'expiry': { if (!v) return html`<span class="faint">No expiry</span>`; const d = (new Date(v) - Date.now()) / 864e5; return html`${fmtDate(v)} ${d < 0 ? html`<span class="badge danger">Expired</span>` : d <= 90 ? html`<span class="badge warn">Soon</span>` : ''}`; }
    case 'size': return fmtSize(v);
    case 'num': return v === '' || v == null ? '—' : String(v);
    default: return v === '' || v == null ? '—' : html`<div class="clip" title="${v}">${v}</div>`;
  }
}

// ---------- forms ----------
export function fieldHtml(f, val = '', opts = {}) {
  const id = 'f_' + f.name, req = f.required ? html`<span class="req" aria-hidden="true"> *</span>` : '';
  let ctl;
  const common = `id="${id}" name="${f.name}" ${f.required ? 'required aria-required="true"' : ''} aria-describedby="${id}_e"`;
  switch (f.type) {
    case 'textarea': ctl = html`<textarea class="input" ${raw(common)} rows="3">${val}</textarea>`; break;
    case 'select': ctl = html`<select class="input" ${raw(common)}><option value="">Select…</option>${f.options.map((o) => html`<option ${o === val ? raw('selected') : ''}>${o}</option>`)}</select>`; break;
    case 'category': ctl = html`<select class="input" ${raw(common)}><option value="">Select category…</option>${store.expertise_categories.map((c) => html`<option value="${c.id}" ${c.id === val ? raw('selected') : ''}>${c.name}</option>`)}</select>`; break;
    case 'lecturer': ctl = html`<select class="input" ${raw(common)}><option value="">Select lecturer…</option>${[...store.lecturers].sort((a, b) => a.full_name.localeCompare(b.full_name)).map((l) => html`<option value="${l.id}" ${l.id === val ? raw('selected') : ''}>${l.full_name}</option>`)}</select>`; break;
    case 'file': {
      const cur = val && api.docOf(val);
      ctl = html`<div class="file ${cur ? 'cur' : ''}">${icon('file', 20)}<input type="file" id="${id}" name="${f.name}" accept="${FILE_ACCEPT}" ${cur ? raw('data-has="1"') : ''} ${f.required && !cur ? raw('required') : ''} aria-describedby="${id}_e ${id}_h"></div><div class="hint" id="${id}_h">${cur ? html`Current: <b>${cur.file_name}</b>. Choose a file to replace it. ` : ''}PDF, JPG, PNG, DOC — max ${MAX_FILE_BYTES / 1048576} MB</div>`; break;
    }
    default: ctl = html`<input class="input" ${raw(common)} type="${f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : f.type === 'password' ? 'password' : 'text'}" value="${val}" ${f.min != null ? raw(`min="${f.min}"`) : ''} ${f.max != null ? raw(`max="${f.max}"`) : ''} ${f.placeholder ? raw(`placeholder="${esc(f.placeholder)}"`) : ''} ${f.autocomplete ? raw(`autocomplete="${f.autocomplete}"`) : ''} ${f.readonly ? raw('readonly') : ''}>`;
  }
  return html`<div class="fld ${opts.cls || ''}"><label for="${id}">${f.label}${req}</label>${ctl}<div class="err" id="${id}_e" role="alert" hidden></div></div>`;
}

// Validates + reads the form. Returns {values, files, ok}; shows inline errors and focuses the first bad field.
export function readForm(form, fields) {
  const values = {}, files = {}; let first = null;
  const bad = (f, msg) => { const e = $('#f_' + f.name + '_e', form), i = $('#f_' + f.name, form); e.innerHTML = icon('alert', 14).s + ' ' + esc(msg); e.hidden = false; i.setAttribute('aria-invalid', 'true'); first ||= i; };
  fields.forEach((f) => {
    const i = $('#f_' + f.name, form); const e = $('#f_' + f.name + '_e', form); if (!i) return;
    e.hidden = true; i.removeAttribute('aria-invalid');
    if (f.type === 'file') {
      const file = i.files && i.files[0];
      if (file) { if (file.size > MAX_FILE_BYTES) return bad(f, 'File exceeds 5 MB.'); if (!/\.(pdf|jpe?g|png|docx?)$/i.test(file.name)) return bad(f, 'Unsupported file type.'); files[f.name] = file; }
      else if (f.required && !i.dataset.has) return bad(f, 'Please choose a file.');
      return;
    }
    let v = i.value.trim();
    if (f.required && v === '') return bad(f, 'This field is required.');
    if (f.type === 'number' && v !== '') { const n = Number(v); if (Number.isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) return bad(f, `Enter a number${f.min != null ? ' from ' + f.min : ''}${f.max != null ? ' to ' + f.max : ''}.`); v = n; }
    if (f.type === 'url' && v !== '' && !/^https?:\/\/\S+$/i.test(v)) return bad(f, 'Enter a valid link starting with http(s)://');
    if (f.type === 'email' && v !== '' && !/^\S+@\S+\.\S+$/.test(v)) return bad(f, 'Enter a valid email address.');
    if (f.minlen && v.length < f.minlen) return bad(f, `Use at least ${f.minlen} characters.`);
    values[f.name] = v;
  });
  if (first) first.focus();
  return { values, files, ok: !first };
}

export const busy = (btn, on, label) => { btn.disabled = on; btn.innerHTML = on ? '<span class="spin"></span> Saving…' : label; };

export async function saveDownload(id) {
  try { const d = await api.download(id); if (!d.dataUrl) return toast('File is no longer available.', 'err'); const a = document.createElement('a'); a.href = d.dataUrl; a.download = d.file_name; a.click(); }
  catch (e) { toast(e.message, 'err'); }
}

// ---------- table ----------
// opts: {columns:[{label,key,render(row),sort(row)}], rows:()=>[], searchText(row), actions(row), empty:{title,text}, pageSize}
export function dataTable(host, opts) {
  const st = { q: '', sort: null, dir: 1, page: 0 };
  const size = opts.pageSize || 10;
  const draw = () => {
    let rows = opts.rows();
    if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter((r) => opts.searchText(r).toLowerCase().includes(q)); }
    if (st.sort != null) { const c = opts.columns[st.sort]; const g = c.sort || ((r) => r[c.key]); rows = [...rows].sort((a, b) => { const x = g(a), y = g(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })) * st.dir; }); }
    const pages = Math.max(1, Math.ceil(rows.length / size)); st.page = Math.min(st.page, pages - 1);
    const slice = rows.slice(st.page * size, st.page * size + size);
    host.innerHTML = rows.length ? html`<div class="tbl-wrap"><table><thead><tr>${opts.columns.map((c, i) => html`<th scope="col" ${st.sort === i ? raw(`aria-sort="${st.dir > 0 ? 'ascending' : 'descending'}"`) : ''}><button data-sort="${i}">${c.label}${st.sort === i ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`)}${opts.actions ? html`<th scope="col"><span class="sr">Actions</span></th>` : ''}</tr></thead><tbody>${slice.map((r) => html`<tr data-id="${r.id}">${opts.columns.map((c) => html`<td>${c.render ? c.render(r) : cell(c.fmt, r[c.key], r)}</td>`)}${opts.actions ? html`<td class="act">${opts.actions(r)}</td>` : ''}</tr>`)}</tbody></table><div class="pager"><span>${rows.length} record${rows.length === 1 ? '' : 's'}${st.q ? ' found' : ''}</span><span class="row" style="gap:6px"><button class="btn ghost sm" data-pg="-1" ${st.page === 0 ? 'disabled' : ''}>Previous</button><span>Page ${st.page + 1} / ${pages}</span><button class="btn ghost sm" data-pg="1" ${st.page >= pages - 1 ? 'disabled' : ''}>Next</button></span></div></div>`.s
      : html`<div class="card empty">${icon('search', 40)}<h3>${st.q ? 'No matching records' : opts.empty?.title || 'Nothing here yet'}</h3><p>${st.q ? 'Try a different search term.' : opts.empty?.text || ''}</p>${st.q || !opts.empty?.cta ? '' : opts.empty.cta}</div>`.s;
  };
  host.addEventListener('click', (e) => {
    const s = e.target.closest('[data-sort]'); if (s) { const i = +s.dataset.sort; st.dir = st.sort === i ? -st.dir : 1; st.sort = i; draw(); const nb = host.querySelector(`[data-sort="${i}"]`); nb && nb.focus(); }
    const p = e.target.closest('[data-pg]'); if (p) { st.page += +p.dataset.pg; draw(); }
  });
  draw();
  return { refresh: draw, search: (q) => { st.q = q; st.page = 0; draw(); } };
}

export const pageHead = (title, sub, actions = '', crumb = '') => html`<div class="page-head"><div>${crumb ? html`<div class="crumb">${crumb}</div>` : ''}<h1>${title}</h1>${sub ? html`<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
export const searchBox = (id, ph) => html`<div class="search">${icon('search', 18)}<input class="input" id="${id}" type="search" placeholder="${ph}" aria-label="${ph}"></div>`;
export const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export { $, $$ };
