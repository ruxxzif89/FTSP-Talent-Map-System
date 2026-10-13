import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, toast, icon, confirmDialog } from '../util.js';
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
    ${store.me.role === 'admin' ? html`<section class="card" style="max-width:520px;margin-top:18px"><h3>${icon('users', 18)} Sample data</h3><p class="muted small" style="margin-bottom:12px">Fill the system with <b>100 fictional lecturers</b> (profiles, expertise, research, publications, certifications, training, consultancy, achievements) to preview how it looks at scale. Sample rows are tagged, so removing them never touches real data. Every sample lecturer signs in with their username and <code>Lecturer@123</code>.</p><div class="row"><button class="btn primary" id="ld">${icon('plus', 18)} Load 100 sample lecturers</button><button class="btn ghost" id="cd">${icon('trash', 18)} Remove sample data</button></div><p class="small faint" id="dmsg" role="status" style="margin-top:10px"></p></section>` : ''}
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
  const ld = $('#ld', root), cd = $('#cd', root), msg = $('#dmsg', root);
  if (ld) {
    const lock = (on, text) => { ld.disabled = cd.disabled = on; msg.textContent = text || ''; };
    ld.onclick = async () => {
      if (store.lecturers.some((l) => l.id.startsWith('demo_'))) return toast('Sample data is already loaded.', 'err');
      lock(true, 'Generating and uploading — this can take up to a minute…');
      try {
        const [{ buildSeed }, { sha256 }] = await Promise.all([import('../seed.js'), import('../local-server.js')]);
        const seed = await buildSeed((salt, pw) => sha256(salt + ':' + pw), { count: 100, prefix: 'demo_', includeAdmin: false, docs: false, categories: store.expertise_categories.map(({ id, name, color }) => ({ id, name, color })) });
        const tables = {}; ['users', 'lecturers', 'expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'activity_log'].forEach((t) => (tables[t] = seed[t]));
        const r = await api.bulkImport(tables);
        toast(`Loaded ${r.lecturers} lecturers and ${Object.values(r).reduce((a, b) => a + b, 0)} rows.`); lock(false, 'Done. Open Dashboard or Talent Mapping.');
      } catch (e) { toast(e.message, 'err'); lock(false, 'Failed: ' + e.message); }
    };
    cd.onclick = async () => {
      if (!(await confirmDialog({ title: 'Remove sample data?', message: 'All sample lecturers and their records will be deleted. Real accounts and data are not affected.', confirm: 'Remove' }))) return;
      lock(true, 'Removing…');
      try { const r = await api.clearDemo(); toast(`Removed ${r.lecturers} sample lecturers.`); lock(false, ''); } catch (e) { toast(e.message, 'err'); lock(false, ''); }
    };
  }
  const rs = $('#rs', root); if (rs) rs.onclick = async () => { await api.resetDemo(); await api.logout(); location.hash = '#/login'; location.reload(); };
}
