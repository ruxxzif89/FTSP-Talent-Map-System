// "My Profile" (lecturer edit form) — also reused by admin to edit any lecturer via openProfileEditor().
import * as api from '../api.js';
import { store, myLecturer } from '../api.js';
import { html, mount, $, $$, avatar, toast, openDrawer, raw } from '../util.js';
import { DEPARTMENTS, POSITIONS, GRADE_OPTIONS, FIELDS } from '../schema.js';
import { fieldHtml, readForm, busy, pageHead } from './_ui.js';
import { helpBtn } from '../help.js';
import { completion } from './dashboard.js';

const fields = (admin) => ({
  personal: [
    { name: 'staff_id', label: 'No. Staf', type: 'text', required: true, readonly: !admin },
    { name: 'full_name', label: 'Nama Penuh', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'E-mel', type: 'email', required: true, autocomplete: 'email' },
    { name: 'phone', label: 'Nombor Telefon', type: 'text', autocomplete: 'tel' },
    { name: 'location', label: 'Lokasi', type: 'text', placeholder: 'cth. Kuala Lumpur, Malaysia' },
  ],
  professional: [
    { name: 'department', label: 'Jabatan', type: 'select', options: DEPARTMENTS, required: true },
    { name: 'position', label: 'Jawatan', type: 'select', options: POSITIONS, required: true },
    { name: 'scopus_h_index', label: 'H-indeks SCOPUS (untuk kenaikan pangkat)', type: 'number', min: 0, max: 200, help: 'f_hindex' },
    { name: 'bio', label: 'Biodata Ringkas', type: 'textarea', placeholder: 'Fokus penyelidikan dan latar belakang anda…' },
  ],
  service: [
    { name: 'grade', label: 'Gred semasa', type: 'select', options: GRADE_OPTIONS, help: 'f_grade' },
    { name: 'grade_since', label: 'Tarikh masuk gred semasa', type: 'date', help: 'f_grade_since' },
    { name: 'appointed_on', label: 'Tarikh dilantik di UPNM', type: 'date', help: 'f_appointed' },
    { name: 'confirmed_on', label: 'Tarikh disahkan dalam perkhidmatan', type: 'date', help: 'f_confirmed' },
    { name: 'vk7_since', label: 'Tarikh masuk Gred VK7 (jika berkaitan)', type: 'date', help: 'f_vk7' },
    { name: 'field', label: 'Bidang', type: 'select', options: FIELDS, help: 'f_field' },
    { name: 'has_phd', label: 'Memiliki PhD?', type: 'select', options: ['Ya', 'Tidak'], help: 'f_phd' },
    { name: 'has_prof_qual', label: 'Kelayakan profesional (cth. Ir.)?', type: 'select', options: ['Ya', 'Tidak'], help: 'f_profq' },
    { name: 'employment', label: 'Jenis lantikan', type: 'select', options: ['Tetap', 'Kontrak', 'Pinjaman'], help: 'f_employment' },
    { name: 'syarahan_perdana', label: 'Syarahan Perdana disampaikan?', type: 'select', options: ['Ya', 'Tidak'], help: 'f_syarahan' },
    { name: 'monograf', label: 'Monograf dihasilkan?', type: 'select', options: ['Ya', 'Tidak'], help: 'f_monograf' },
  ],
});

// Center-crop to a 200px square JPEG so the photo fits comfortably in one sheet cell.
function toSmallJpeg(file) {
  return new Promise((res, rej) => {
    if (!/^image\/(jpeg|png)$/.test(file.type)) return rej(new Error('Gambar mestilah JPG atau PNG.'));
    if (file.size > 2 * 1024 * 1024) return rej(new Error('Gambar mestilah kurang daripada 2 MB.'));
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = 200; c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 200, 200); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = () => rej(new Error('Gambar tersebut tidak dapat dibaca.'));
    img.src = url;
  });
}

function formBody(l, admin) {
  const F = fields(admin);
  return html`<form class="form" id="pf" novalidate>
    <div class="photo-edit"><span id="ph">${avatar(l, 112)}</span><label class="btn outline sm" style="cursor:pointer">Tukar Gambar<input type="file" id="photo" accept="image/jpeg,image/png" class="sr"></label><span class="small faint">JPG/PNG (Maks. 2MB)</span>${helpBtn('profile_photo')}</div>
    <div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="personal">Maklumat Peribadi</button><button type="button" role="tab" aria-selected="false" data-tab="professional">Maklumat Profesional</button>${admin ? html`<button type="button" role="tab" aria-selected="false" data-tab="service">Maklumat Perkhidmatan</button>` : ''}</div>
    <div data-pane="personal" class="stack">${F.personal.map((f) => fieldHtml(f, l[f.name] ?? ''))}</div>
    <div data-pane="professional" class="stack" hidden>${F.professional.map((f) => fieldHtml(f, l[f.name] ?? ''))}</div>
    ${admin ? html`<div data-pane="service" class="stack" hidden><p class="small muted">Data Pejabat Pendaftar yang digunakan oleh semakan Kenaikan Pangkat. Hanya Pentadbir boleh mengubahnya.</p>${F.service.map((f) => fieldHtml(f, l[f.name] ?? ''))}</div>` : ''}
    <div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv" type="submit">Simpan Profil</button></div>
  </form>`;
}

function wire(el, l, admin, done) {
  const F = fields(admin); let photo = l.photo;
  $$('[data-tab]', el).forEach((t) => (t.onclick = () => { $$('[data-tab]', el).forEach((x) => x.setAttribute('aria-selected', x === t)); $$('[data-pane]', el).forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab)); }));
  $('#photo', el).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await toSmallJpeg(f); $('#ph', el).innerHTML = avatar({ ...l, photo }, 112).s; } catch (er) { toast(er.message, 'err'); e.target.value = ''; } };
  $('[data-cancel]', el).onclick = () => done(false);
  $('#pf', el).onsubmit = async (ev) => {
    ev.preventDefault();
    const all = [...F.personal, ...F.professional, ...(admin ? F.service : [])];
    $$('[data-pane]', el).forEach((p) => (p.hidden = false)); // so validation can focus any field
    const { values, ok } = readForm(ev.target, all);
    if (!ok) { const bad = $('[aria-invalid=true]', el); const pane = bad && bad.closest('[data-pane]'); $$('[data-pane]', el).forEach((p) => (p.hidden = p !== pane)); $$('[data-tab]', el).forEach((t) => t.setAttribute('aria-selected', pane && t.dataset.tab === pane.dataset.pane)); return; }
    $$('[data-pane]', el).forEach((p) => (p.hidden = p.dataset.pane !== 'personal')); $$('[data-tab]', el).forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === 'personal'));
    const btn = $('#sv', el); busy(btn, true);
    try { if (!admin) delete values.staff_id; await api.update('lecturers', l.id, { ...values, photo }); toast('Profil berjaya disimpan.'); done(true); }
    catch (e) { toast(e.message, 'err'); busy(btn, false, 'Simpan Profil'); }
  };
}

export function openProfileEditor(l, onSaved) {
  openDrawer({ title: 'Kemas Kini Profil', body: formBody(l, store.me.role === 'admin'), onMount: (el, close) => wire(el, l, store.me.role === 'admin', (saved) => { close(); if (saved && onSaved) onSaved(); }) });
}

export async function render(root) {
  const l = myLecturer();
  const draw = () => {
    const cur = myLecturer();
    mount(root, html`${pageHead('Profil Saya', `Kelengkapan profil: ${completion(cur)}%`)}<section class="card" style="max-width:720px">${formBody(cur, false)}</section>`);
    wire(root, cur, false, () => draw());
  };
  draw();
}
