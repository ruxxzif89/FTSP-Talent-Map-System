import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, icon, toast, openDrawer, confirmDialog } from '../util.js';
import { fieldHtml, readForm, busy, dataTable, pageHead, searchBox, debounce } from './_ui.js';

const F = [
  { name: 'name', label: 'Category Name', type: 'text', required: true },
  { name: 'color', label: 'Colour (hex)', type: 'text', required: true, placeholder: '#1d5fd1' },
  { name: 'description', label: 'Description', type: 'textarea' },
];
const used = (c) => new Set(store.expertise.filter((e) => e.category_id === c.id).map((e) => e.lecturer_id)).size;

export async function render(root) {
  mount(root, html`${pageHead('Expertise Categories', 'Add, rename and remove the fields lecturers can be mapped to.', html`<button class="btn primary" id="add">${icon('plus', 18)} Add Category</button>`)}<div class="toolbar">${searchBox('q', 'Search categories…')}</div><div id="t"></div>`);
  const t = dataTable($('#t', root), {
    rows: () => store.expertise_categories, searchText: (c) => c.name + ' ' + c.description,
    columns: [
      { label: 'Category', key: 'name', render: (c) => html`<span class="row" style="gap:10px;flex-wrap:nowrap"><i style="width:12px;height:12px;border-radius:4px;background:${c.color}"></i><b>${c.name}</b></span>` },
      { label: 'Description', key: 'description' }, { label: 'Lecturers', sort: used, render: used },
    ],
    actions: (c) => html`<button class="icon-btn" data-edit="${c.id}" aria-label="Edit ${c.name}" title="Edit">${icon('edit', 18)}</button><button class="icon-btn del" data-del="${c.id}" aria-label="Delete ${c.name}" title="Delete">${icon('trash', 18)}</button>`,
  });
  $('#q', root).oninput = debounce((e) => t.search(e.target.value));
  const form = (c) => openDrawer({
    title: c ? 'Edit Category' : 'Add Category',
    body: html`<form class="form" id="cf" novalidate>${F.map((f) => fieldHtml(f, c ? c[f.name] : f.name === 'color' ? '#1d5fd1' : ''))}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn primary" id="sv" type="submit">Save Category</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      $('#cf', el).onsubmit = async (ev) => {
        ev.preventDefault(); const { values, ok } = readForm(ev.target, F); if (!ok) return;
        if (!/^#[0-9a-fA-F]{6}$/.test(values.color)) { const e = $('#f_color_e', el); e.textContent = 'Use a 6-digit hex colour like #1d5fd1.'; e.hidden = false; return $('#f_color', el).focus(); }
        const b = $('#sv', el); busy(b, true);
        try { if (c) await api.update('expertise_categories', c.id, values); else await api.create('expertise_categories', values); toast('Category saved.'); close(); t.refresh(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Save Category'); }
      };
    },
  });
  $('#add', root).onclick = () => form(null);
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) return form(store.expertise_categories.find((c) => c.id === b.dataset.edit));
    if (b.dataset.del) {
      const c = store.expertise_categories.find((x) => x.id === b.dataset.del);
      if (await confirmDialog({ title: 'Delete category?', message: `“${c.name}” will be removed. Categories already used by lecturers cannot be deleted.` })) {
        try { await api.remove('expertise_categories', c.id); toast('Category deleted.'); t.refresh(); } catch (er) { toast(er.message, 'err'); }
      }
    }
  });
}
