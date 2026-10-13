// "My Profile" (lecturer edit form) — also reused by admin to edit any lecturer via openProfileEditor().
import * as api from '../api.js';
import { store, myLecturer } from '../api.js';
import { html, mount, $, $$, avatar, toast, openDrawer, raw } from '../util.js';
import { DEPARTMENTS, POSITIONS } from '../schema.js';
import { fieldHtml, readForm, busy, pageHead } from './_ui.js';
import { completion } from './dashboard.js';

const fields = (admin) => ({
  personal: [
    { name: 'staff_id', label: 'Staff ID', type: 'text', required: true, readonly: !admin },
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
    { name: 'phone', label: 'Phone Number', type: 'text', autocomplete: 'tel' },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Kuala Lumpur, Malaysia' },
  ],
  professional: [
    { name: 'department', label: 'Department', type: 'select', options: DEPARTMENTS, required: true },
    { name: 'position', label: 'Position', type: 'select', options: POSITIONS, required: true },
    { name: 'bio', label: 'Short Biography', type: 'textarea', placeholder: 'Your research focus and background…' },
  ],
});

// Center-crop to a 200px square JPEG so the photo fits comfortably in one sheet cell.
function toSmallJpeg(file) {
  return new Promise((res, rej) => {
    if (!/^image\/(jpeg|png)$/.test(file.type)) return rej(new Error('Photo must be a JPG or PNG.'));
    if (file.size > 2 * 1024 * 1024) return rej(new Error('Photo must be under 2 MB.'));
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = 200; c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 200, 200); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); };
    img.onerror = () => rej(new Error('Could not read that image.'));
    img.src = url;
  });
}

function formBody(l, admin) {
  const F = fields(admin);
  return html`<form class="form" id="pf" novalidate>
    <div class="photo-edit"><span id="ph">${avatar(l, 112)}</span><label class="btn outline sm" style="cursor:pointer">Change Photo<input type="file" id="photo" accept="image/jpeg,image/png" class="sr"></label><span class="small faint">JPG/PNG (Max 2MB)</span></div>
    <div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="personal">Personal Information</button><button type="button" role="tab" aria-selected="false" data-tab="professional">Professional Information</button></div>
    <div data-pane="personal" class="stack">${F.personal.map((f) => fieldHtml(f, l[f.name] ?? ''))}</div>
    <div data-pane="professional" class="stack" hidden>${F.professional.map((f) => fieldHtml(f, l[f.name] ?? ''))}</div>
    <div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancel</button><button class="btn primary" id="sv" type="submit">Save Profile</button></div>
  </form>`;
}

function wire(el, l, admin, done) {
  const F = fields(admin); let photo = l.photo;
  $$('[data-tab]', el).forEach((t) => (t.onclick = () => { $$('[data-tab]', el).forEach((x) => x.setAttribute('aria-selected', x === t)); $$('[data-pane]', el).forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tab)); }));
  $('#photo', el).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await toSmallJpeg(f); $('#ph', el).innerHTML = avatar({ ...l, photo }, 112).s; } catch (er) { toast(er.message, 'err'); e.target.value = ''; } };
  $('[data-cancel]', el).onclick = () => done(false);
  $('#pf', el).onsubmit = async (ev) => {
    ev.preventDefault();
    const all = [...F.personal, ...F.professional];
    $$('[data-pane]', el).forEach((p) => (p.hidden = false)); // so validation can focus any field
    const { values, ok } = readForm(ev.target, all);
    if (!ok) { const bad = $('[aria-invalid=true]', el); const pane = bad && bad.closest('[data-pane]'); $$('[data-pane]', el).forEach((p) => (p.hidden = p !== pane)); $$('[data-tab]', el).forEach((t) => t.setAttribute('aria-selected', pane && t.dataset.tab === pane.dataset.pane)); return; }
    $$('[data-pane]', el).forEach((p) => (p.hidden = p.dataset.pane !== 'personal')); $$('[data-tab]', el).forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === 'personal'));
    const btn = $('#sv', el); busy(btn, true);
    try { if (!admin) delete values.staff_id; await api.update('lecturers', l.id, { ...values, photo }); toast('Profile saved.'); done(true); }
    catch (e) { toast(e.message, 'err'); busy(btn, false, 'Save Profile'); }
  };
}

export function openProfileEditor(l, onSaved) {
  openDrawer({ title: 'Edit Profile', body: formBody(l, store.me.role === 'admin'), onMount: (el, close) => wire(el, l, store.me.role === 'admin', (saved) => { close(); if (saved && onSaved) onSaved(); }) });
}

export async function render(root) {
  const l = myLecturer();
  const draw = () => {
    const cur = myLecturer();
    mount(root, html`${pageHead('My Profile', `Profile completion: ${completion(cur)}%`)}<section class="card" style="max-width:720px">${formBody(cur, false)}</section>`);
    wire(root, cur, false, () => draw());
  };
  draw();
}
