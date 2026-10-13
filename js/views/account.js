import * as api from '../api.js';
import { store } from '../api.js';
import { html, mount, $, toast, icon, confirmDialog } from '../util.js';
import { fieldHtml, readForm, busy, pageHead } from './_ui.js';
import { CONFIG } from '../config.js';
import { ROLE_LABEL } from '../schema.js';

export async function render(root) {
  const F = [
    { name: 'current', label: 'Kata Laluan Semasa', type: 'password', required: true, autocomplete: 'current-password' },
    { name: 'password', label: 'Kata Laluan Baharu', type: 'password', required: true, minlen: 8, autocomplete: 'new-password' },
    { name: 'confirm', label: 'Sahkan Kata Laluan Baharu', type: 'password', required: true, autocomplete: 'new-password' },
  ];
  mount(root, html`${pageHead('Akaun & Kata Laluan', `Log masuk sebagai ${store.me.username} (${ROLE_LABEL[store.me.role]}).`)}
    <section class="card" style="max-width:520px"><h3>${icon('lock', 18)} Tukar kata laluan</h3><form class="form" id="f" novalidate>${F.map((f) => fieldHtml(f))}<div class="form-actions"><button class="btn primary" id="sv" type="submit">Kemas Kini Kata Laluan</button></div></form></section>
    ${store.me.role === 'admin' ? html`<section class="card" style="max-width:520px;margin-top:18px"><h3>${icon('users', 18)} Data contoh</h3><p class="muted small" style="margin-bottom:12px">Isikan sistem dengan <b>100 pensyarah fiksyen</b> (profil, kepakaran, penyelidikan, penerbitan, pensijilan, latihan, konsultansi, pencapaian) untuk melihat rupanya pada skala sebenar. Baris contoh ditandakan, jadi memadamnya tidak menjejaskan data sebenar. Setiap pensyarah contoh log masuk dengan nama penggunanya dan <code>Lecturer@123</code>.</p><div class="row"><button class="btn primary" id="ld">${icon('plus', 18)} Muatkan 100 pensyarah contoh</button><button class="btn ghost" id="cd">${icon('trash', 18)} Buang data contoh</button></div><p class="small faint" id="dmsg" role="status" style="margin-top:10px"></p></section>` : ''}
    ${store.me.role === 'admin' && CONFIG.backend === 'local' ? html`<section class="card" style="max-width:520px;margin-top:18px"><h3>${icon('alert', 18)} Data demo</h3><p class="muted small" style="margin-bottom:12px">Anda menggunakan pangkalan data demo dalam pelayar. Tetapan semula memulihkan data contoh asal dan melog keluar semua pengguna.</p><button class="btn ghost" id="rs">Tetap semula data demo</button></section>` : ''}`);
  $('#f', root).onsubmit = async (e) => {
    e.preventDefault(); const { values, ok } = readForm(e.target, F); if (!ok) return;
    const err = (n, m) => { const x = $('#f_' + n + '_e', root); x.textContent = m; x.hidden = false; $('#f_' + n, root).focus(); };
    if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) return err('password', 'Sertakan sekurang-kurangnya satu huruf dan satu nombor.');
    if (values.password !== values.confirm) return err('confirm', 'Kata laluan tidak sepadan.');
    const b = $('#sv', root); busy(b, true);
    try { await api.changePassword(values.current, values.password); toast('Kata laluan dikemas kini.'); e.target.reset(); } catch (x) { toast(x.message, 'err'); }
    busy(b, false, 'Kemas Kini Kata Laluan');
  };
  const ld = $('#ld', root), cd = $('#cd', root), msg = $('#dmsg', root);
  if (ld) {
    const lock = (on, text) => { ld.disabled = cd.disabled = on; msg.textContent = text || ''; };
    ld.onclick = async () => {
      if (store.lecturers.some((l) => l.id.startsWith('demo_'))) return toast('Data contoh sudah dimuatkan.', 'err');
      lock(true, 'Menjana dan memuat naik — ini boleh mengambil masa sehingga seminit…');
      try {
        const [{ buildSeed }, { sha256 }] = await Promise.all([import('../seed.js'), import('../local-server.js')]);
        const seed = await buildSeed((salt, pw) => sha256(salt + ':' + pw), { count: 100, prefix: 'demo_', includeAdmin: false, docs: false, categories: store.expertise_categories.map(({ id, name, color }) => ({ id, name, color })) });
        const tables = {}; ['users', 'lecturers', 'expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'activity_log'].forEach((t) => (tables[t] = seed[t]));
        const r = await api.bulkImport(tables);
        toast(`${r.lecturers} pensyarah dan ${Object.values(r).reduce((a, b) => a + b, 0)} baris dimuatkan.`); lock(false, 'Selesai. Buka Papan Pemuka atau Pemetaan Bakat.');
      } catch (e) { toast(e.message, 'err'); lock(false, 'Gagal: ' + e.message); }
    };
    cd.onclick = async () => {
      if (!(await confirmDialog({ title: 'Buang data contoh?', message: 'Semua pensyarah contoh dan rekod mereka akan dipadam. Akaun dan data sebenar tidak terjejas.', confirm: 'Buang' }))) return;
      lock(true, 'Sedang membuang…');
      try { const r = await api.clearDemo(); toast(`${r.lecturers} pensyarah contoh dibuang.`); lock(false, ''); } catch (e) { toast(e.message, 'err'); lock(false, ''); }
    };
  }
  const rs = $('#rs', root); if (rs) rs.onclick = async () => { await api.resetDemo(); await api.logout(); location.hash = '#/login'; location.reload(); };
}
