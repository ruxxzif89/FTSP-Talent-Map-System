import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, toast, icon } from '../util.js';
import { fieldHtml, readForm, busy, pageHead } from './_ui.js';
import { CONFIG } from '../config.js';

export async function render(root) {
  const F = [
    { name: 'current', label: 'Current Password', type: 'password', required: true, autocomplete: 'current-password' },
    { name: 'password', label: 'New Password', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' },
    { name: 'confirm', label: 'Confirm New Password', type: 'password', required: true, autocomplete: 'new-password' },
  ];
  mount(root, html`${pageHead('Account & Password', `Signed in as ${store.me.username} (${store.me.role}).`)}
    <section class="card" style="max-width:520px"><h3>${icon('lock', 18)} Change password</h3><form class="form" id="f" novalidate>${F.map((f) => fieldHtml(f))}<div class="form-actions"><button class="btn primary" id="sv" type="submit">Update Password</button></div></form></section>
    ${store.me.role === 'admin' && CONFIG.backend === 'local' ? html`<section class="card" style="max-width:520px;margin-top:18px"><h3>${icon('alert', 18)} Demo data</h3><p class="muted small" style="margin-bottom:12px">You are using the in-browser demo database. Reset restores the original sample data and signs everyone out.</p><button class="btn ghost" id="rs">Reset demo data</button></section>` : ''}`);
  $('#f', root).onsubmit = async (e) => {
    e.preventDefault(); const { values, ok } = readForm(e.target, F); if (!ok) return;
    const err = (n, m) => { const x = $('#f_' + n + '_e', root); x.textContent = m; x.hidden = false; $('#f_' + n, root).focus(); };
    if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) return err('password', 'Include at least one letter and one number.');
    if (values.password !== values.confirm) return err('confirm', 'Passwords do not match.');
    const b = $('#sv', root); busy(b, true);
    try { await api.changePassword(values.current, values.password); toast('Password updated.'); e.target.reset(); } catch (x) { toast(x.message, 'err'); }
    busy(b, false, 'Update Password');
  };
  const rs = $('#rs', root); if (rs) rs.onclick = async () => { await api.resetDemo(); await api.logout(); location.hash = '#/login'; location.reload(); };
}
