import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, icon, toast, openDrawer, confirmDialog, fmtDate } from '../util.js';
import { DEPARTMENTS } from '../schema.js';
import { fieldHtml, readForm, busy, dataTable, pageHead, searchBox, cell, debounce } from './_ui.js';

const strongPw = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export async function render(root) {
  mount(root, html`${pageHead('Manage Users', 'Create, edit and deactivate system accounts.', html`<button class="btn primary" id="add">${icon('plus', 18)} Add User</button>`)}<div class="toolbar">${searchBox('q', 'Search users…')}</div><div id="t"></div>`);
  const t = dataTable($('#t', root), {
    rows: () => store.users, searchText: (u) => [u.full_name, u.username, u.email, u.role, u.department].join(' '),
    columns: [
      { label: 'Name', key: 'full_name', render: (u) => html`<b>${u.full_name}</b>` }, { label: 'Username', key: 'username' }, { label: 'Email', key: 'email' },
      { label: 'Role', key: 'role', render: (u) => html`<span class="badge ${u.role === 'admin' ? 'info' : 'mute'}">${u.role === 'admin' ? 'Admin' : 'Lecturer'}</span>` },
      { label: 'Department', key: 'department' }, { label: 'Status', key: 'status', fmt: 'status' },
      { label: 'Last login', key: 'last_login', render: (u) => (u.last_login ? fmtDate(u.last_login) : html`<span class="faint">Never</span>`) },
    ],
    actions: (u) => html`<button class="icon-btn" data-edit="${u.id}" aria-label="Edit ${u.full_name}" title="Edit">${icon('edit', 18)}</button><button class="icon-btn" data-pw="${u.id}" aria-label="Reset password for ${u.full_name}" title="Reset password">${icon('key', 18)}</button>${u.id !== store.me.id ? html`<button class="icon-btn del" data-del="${u.id}" aria-label="Delete ${u.full_name}" title="Delete">${icon('trash', 18)}</button>` : ''}`,
  });
  $('#q', root).oninput = debounce((e) => t.search(e.target.value));

  const userForm = (u) => {
    const F = [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true }, { name: 'username', label: 'Username', type: 'text', required: true, readonly: !!u, autocomplete: 'off' },
      { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'role', label: 'Role', type: 'select', options: ['lecturer', 'admin'], required: true },
      { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS.concat('Faculty Office'), required: true }, { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
      ...(u ? [] : [{ name: 'password', label: 'Initial Password', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' }]),
    ];
    openDrawer({
      title: u ? 'Edit User' : 'Add User Account',
      body: html`<form class="form" id="uf" novalidate>${F.map((f) => fieldHtml(f, u ? u[f.name] ?? '' : f.name === 'status' ? 'Active' : f.name === 'role' ? 'lecturer' : ''))}${u ? html`<p class="small muted">Role cannot be changed after creation. Use “reset password” to set a new password.</p>` : html`<p class="small muted">Minimum 8 characters, with letters and a number. Ask the user to change it after first login.</p>`}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn primary" id="sv" type="submit">Save User</button></div></form>`,
      onMount: (el, close) => {
        if (u) $('#f_role', el).disabled = true;
        $('[data-cancel]', el).onclick = close;
        $('#uf', el).onsubmit = async (ev) => {
          ev.preventDefault(); const { values, ok } = readForm(ev.target, F); if (!ok) return;
          if (!u && !strongPw(values.password)) { const e = $('#f_password_e', el); e.textContent = 'Use at least 8 characters including a letter and a number.'; e.hidden = false; $('#f_password', el).focus(); return; }
          const b = $('#sv', el); busy(b, true);
          try { if (u) await api.updateUser(u.id, values); else await api.createUser(values); toast('User saved.'); close(); t.refresh(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Save User'); }
        };
      },
    });
  };
  const pwForm = (u) => openDrawer({
    title: 'Reset Password',
    body: html`<form class="form" id="pf" novalidate><p class="muted">Set a new password for <b>${u.full_name}</b>.</p>${fieldHtml({ name: 'password', label: 'New Password', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' })}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn primary" id="sv" type="submit">Reset Password</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      $('#pf', el).onsubmit = async (ev) => { ev.preventDefault(); const { values, ok } = readForm(ev.target, [{ name: 'password', label: 'x', type: 'password', required: true, minlen: 8 }]); if (!ok) return; if (!strongPw(values.password)) { const e = $('#f_password_e', el); e.textContent = 'Use at least 8 characters including a letter and a number.'; e.hidden = false; return; } const b = $('#sv', el); busy(b, true); try { await api.resetPassword(u.id, values.password); toast('Password reset.'); close(); } catch (e) { toast(e.message, 'err'); busy(b, false, 'Reset Password'); } };
    },
  });
  $('#add', root).onclick = () => userForm(null);
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) return userForm(store.users.find((u) => u.id === b.dataset.edit));
    if (b.dataset.pw) return pwForm(store.users.find((u) => u.id === b.dataset.pw));
    if (b.dataset.del) {
      const u = store.users.find((x) => x.id === b.dataset.del);
      if (await confirmDialog({ title: 'Delete user?', message: `${u.full_name}${u.role === 'lecturer' ? ' and ALL of their expertise, research, publications and uploaded documents' : ''} will be permanently deleted. Consider setting the account to Inactive instead.` })) {
        try { await api.deleteUser(u.id); toast('User deleted.'); t.refresh(); } catch (er) { toast(er.message, 'err'); }
      }
    }
  });
}
