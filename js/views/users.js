import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, icon, toast, openDrawer, confirmDialog, fmtDate } from '../util.js';
import { DEPARTMENTS, ROLE_LABEL } from '../schema.js';
import { fieldHtml, readForm, busy, dataTable, pageHead, searchBox, cell, debounce } from './_ui.js';

const strongPw = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export async function render(root) {
  mount(root, html`${pageHead('Urus Pengguna', 'Cipta, kemas kini dan nyahaktifkan akaun sistem.', html`<button class="btn primary" id="add">${icon('plus', 18)} Tambah Pengguna</button>`)}<div class="toolbar">${searchBox('q', 'Cari pengguna…')}</div><div id="t"></div>`);
  const t = dataTable($('#t', root), {
    rows: () => store.users, searchText: (u) => [u.full_name, u.username, u.email, u.role, u.department].join(' '),
    columns: [
      { label: 'Nama', key: 'full_name', render: (u) => html`<b>${u.full_name}</b>` }, { label: 'Nama Pengguna', key: 'username' }, { label: 'E-mel', key: 'email' },
      { label: 'Peranan', key: 'role', render: (u) => html`<span class="badge ${u.role === 'admin' ? 'info' : 'mute'}">${ROLE_LABEL[u.role] || u.role}</span>` },
      { label: 'Jabatan', key: 'department' }, { label: 'Status', key: 'status', fmt: 'status' },
      { label: 'Log masuk terakhir', key: 'last_login', render: (u) => (u.last_login ? fmtDate(u.last_login) : html`<span class="faint">Tidak pernah</span>`) },
    ],
    actions: (u) => html`<button class="icon-btn" data-edit="${u.id}" aria-label="Kemas kini ${u.full_name}" title="Kemas kini">${icon('edit', 18)}</button><button class="icon-btn" data-pw="${u.id}" aria-label="Tetap semula kata laluan untuk ${u.full_name}" title="Tetap semula kata laluan">${icon('key', 18)}</button>${u.id !== store.me.id ? html`<button class="icon-btn del" data-del="${u.id}" aria-label="Padam ${u.full_name}" title="Padam">${icon('trash', 18)}</button>` : ''}`,
  });
  $('#q', root).oninput = debounce((e) => t.search(e.target.value));

  const userForm = (u) => {
    const F = [
      { name: 'full_name', label: 'Nama Penuh', type: 'text', required: true }, { name: 'username', label: 'Nama Pengguna', type: 'text', required: true, readonly: !!u, autocomplete: 'off' },
      { name: 'email', label: 'E-mel', type: 'email', required: true }, { name: 'role', label: 'Peranan', type: 'select', options: [['lecturer', 'Pensyarah'], ['admin', 'Pentadbir']], required: true },
      { name: 'department', label: 'Jabatan', type: 'select', options: [...DEPARTMENTS, 'Pejabat Fakulti', ...(u && ![...DEPARTMENTS, 'Pejabat Fakulti'].includes(u.department) && u.department ? [u.department] : [])], required: true }, { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Inactive', 'Tidak Aktif']], required: true },
      ...(u ? [] : [{ name: 'password', label: 'Kata Laluan Awal', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' }]),
    ];
    openDrawer({
      title: u ? 'Kemas Kini Pengguna' : 'Tambah Akaun Pengguna',
      body: html`<form class="form" id="uf" novalidate>${F.map((f) => fieldHtml(f, u ? u[f.name] ?? '' : f.name === 'status' ? 'Active' : f.name === 'role' ? 'lecturer' : ''))}${u ? html`<p class="small muted">Peranan tidak boleh ditukar selepas akaun dicipta. Gunakan “tetap semula kata laluan” untuk menetapkan kata laluan baharu.</p>` : html`<p class="small muted">Minimum 8 aksara, dengan huruf dan nombor. Minta pengguna menukarnya selepas log masuk pertama.</p>`}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv" type="submit">Simpan Pengguna</button></div></form>`,
      onMount: (el, close) => {
        if (u) $('#f_role', el).disabled = true;
        $('[data-cancel]', el).onclick = close;
        $('#uf', el).onsubmit = async (ev) => {
          ev.preventDefault(); const { values, ok } = readForm(ev.target, F); if (!ok) return;
          if (!u && !strongPw(values.password)) { const e = $('#f_password_e', el); e.textContent = 'Gunakan sekurang-kurangnya 8 aksara termasuk huruf dan nombor.'; e.hidden = false; $('#f_password', el).focus(); return; }
          const b = $('#sv', el); busy(b, true);
          try { if (u) await api.updateUser(u.id, values); else await api.createUser(values); toast('Pengguna berjaya disimpan.'); close(); t.refresh(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Simpan Pengguna'); }
        };
      },
    });
  };
  const pwForm = (u) => openDrawer({
    title: 'Tetap Semula Kata Laluan',
    body: html`<form class="form" id="pf" novalidate><p class="muted">Tetapkan kata laluan baharu untuk <b>${u.full_name}</b>.</p>${fieldHtml({ name: 'password', label: 'Kata Laluan Baharu', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' })}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv" type="submit">Tetap Semula Kata Laluan</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      $('#pf', el).onsubmit = async (ev) => { ev.preventDefault(); const { values, ok } = readForm(ev.target, [{ name: 'password', label: 'x', type: 'password', required: true, minlen: 8 }]); if (!ok) return; if (!strongPw(values.password)) { const e = $('#f_password_e', el); e.textContent = 'Gunakan sekurang-kurangnya 8 aksara termasuk huruf dan nombor.'; e.hidden = false; return; } const b = $('#sv', el); busy(b, true); try { await api.resetPassword(u.id, values.password); toast('Kata laluan telah ditetapkan semula.'); close(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Tetap Semula Kata Laluan'); } };
    },
  });
  $('#add', root).onclick = () => userForm(null);
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) return userForm(store.users.find((u) => u.id === b.dataset.edit));
    if (b.dataset.pw) return pwForm(store.users.find((u) => u.id === b.dataset.pw));
    if (b.dataset.del) {
      const u = store.users.find((x) => x.id === b.dataset.del);
      if (await confirmDialog({ title: 'Padam pengguna?', message: `${u.full_name}${u.role === 'lecturer' ? ' beserta SEMUA rekod kepakaran, penyelidikan, penerbitan dan dokumen yang dimuat naik' : ''} akan dipadam secara kekal. Pertimbangkan untuk menetapkan akaun kepada Tidak Aktif sebaliknya.` })) {
        try { await api.deleteUser(u.id); toast('Pengguna telah dipadam.'); t.refresh(); } catch (er) { toast(er.message, 'err'); }
      }
    }
  });
}
