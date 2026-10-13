import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, icon, toast, openDrawer, confirmDialog } from '../util.js';
import { fieldHtml, readForm, busy, dataTable, pageHead, searchBox, debounce } from './_ui.js';

const F = [
  { name: 'name', label: 'Nama Kategori', type: 'text', required: true },
  { name: 'color', label: 'Warna (hex)', type: 'text', required: true, placeholder: '#1d5fd1' },
  { name: 'description', label: 'Penerangan', type: 'textarea' },
];
const used = (c) => new Set(store.expertise.filter((e) => e.category_id === c.id).map((e) => e.lecturer_id)).size;

export async function render(root) {
  mount(root, html`${pageHead('Kategori Kepakaran', 'Tambah, namakan semula dan buang bidang yang boleh dipetakan kepada pensyarah.', html`<button class="btn primary" id="add">${icon('plus', 18)} Tambah Kategori</button>`)}<div class="toolbar">${searchBox('q', 'Cari kategori…')}</div><div id="t"></div>`);
  const t = dataTable($('#t', root), {
    rows: () => store.expertise_categories, searchText: (c) => c.name + ' ' + c.description,
    columns: [
      { label: 'Kategori', key: 'name', render: (c) => html`<span class="row" style="gap:10px;flex-wrap:nowrap"><i style="width:12px;height:12px;border-radius:4px;background:${c.color}"></i><b>${c.name}</b></span>` },
      { label: 'Penerangan', key: 'description' }, { label: 'Pensyarah', sort: used, render: used },
    ],
    actions: (c) => html`<button class="icon-btn" data-edit="${c.id}" aria-label="Kemas kini ${c.name}" title="Kemas kini">${icon('edit', 18)}</button><button class="icon-btn del" data-del="${c.id}" aria-label="Padam ${c.name}" title="Padam">${icon('trash', 18)}</button>`,
  });
  $('#q', root).oninput = debounce((e) => t.search(e.target.value));
  const form = (c) => openDrawer({
    title: c ? 'Kemas Kini Kategori' : 'Tambah Kategori',
    body: html`<form class="form" id="cf" novalidate>${F.map((f) => fieldHtml(f, c ? c[f.name] : f.name === 'color' ? '#1d5fd1' : ''))}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv" type="submit">Simpan Kategori</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      $('#cf', el).onsubmit = async (ev) => {
        ev.preventDefault(); const { values, ok } = readForm(ev.target, F); if (!ok) return;
        if (!/^#[0-9a-fA-F]{6}$/.test(values.color)) { const e = $('#f_color_e', el); e.textContent = 'Gunakan warna hex 6 digit seperti #1d5fd1.'; e.hidden = false; return $('#f_color', el).focus(); }
        const b = $('#sv', el); busy(b, true);
        try { if (c) await api.update('expertise_categories', c.id, values); else await api.create('expertise_categories', values); toast('Kategori berjaya disimpan.'); close(); t.refresh(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Simpan Kategori'); }
      };
    },
  });
  $('#add', root).onclick = () => form(null);
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) return form(store.expertise_categories.find((c) => c.id === b.dataset.edit));
    if (b.dataset.del) {
      const c = store.expertise_categories.find((x) => x.id === b.dataset.del);
      if (await confirmDialog({ title: 'Padam kategori?', message: `“${c.name}” akan dibuang. Kategori yang sudah digunakan oleh pensyarah tidak boleh dipadam.` })) {
        try { await api.remove('expertise_categories', c.id); toast('Kategori telah dipadam.'); t.refresh(); } catch (er) { toast(er.message, 'err'); }
      }
    }
  });
}
