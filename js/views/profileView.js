// Read-only profile page: #/lecturer/:id
import * as api from '../api.js';
import { store, lecturerOf, categoryOf, myLecturer } from '../api.js';
import { html, mount, $, icon, avatar, levelClass, fmtDate } from '../util.js';
import { ENTITIES } from '../schema.js';
import { pageHead, cell, saveDownload } from './_ui.js';
import { openProfileEditor } from './profile.js';

export async function render(root, { id }) {
  const admin = store.me.role === 'admin';
  const l = lecturerOf(id);
  if (!l || (!admin && l.id !== (myLecturer() || {}).id)) { mount(root, html`<div class="card empty">${icon('alert', 36)}<h3>Lecturer not found</h3><p><a href="#/dashboard">Back to dashboard</a></p></div>`); return; }
  const mine = (t) => store[t].filter((r) => r.lecturer_id === l.id);
  const exp = mine('expertise');
  const chips = [...new Set(exp.map((e) => (categoryOf(e.category_id) || {}).name).filter(Boolean))];
  const tiles = ['publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents'];
  const draw = () => {
    const lec = lecturerOf(id);
    mount(root, html`
      ${pageHead('Lecturer Profile', '', html`${admin ? html`<a class="btn ghost" href="#/lecturers">${icon('users', 18)} All lecturers</a>` : ''}<button class="btn primary" id="edit">${icon('edit', 18)} Edit Profile</button>`)}
      <section class="card profile-head">
        ${avatar(lec, 124)}
        <div class="stack" style="gap:10px">
          <div><h2 style="font-size:24px;font-weight:800">${lec.full_name}</h2><p class="muted">${lec.position} · ${lec.department}, FSTP · <span class="faint">${lec.staff_id}</span></p></div>
          <div class="row small muted" style="gap:18px"><span>${icon('mail', 16)} ${lec.email}</span>${lec.phone ? html`<span>${icon('phone', 16)} ${lec.phone}</span>` : ''}${lec.location ? html`<span>${icon('pin', 16)} ${lec.location}</span>` : ''}</div>
          ${lec.bio ? html`<p>${lec.bio}</p>` : ''}
          <div class="row" style="gap:8px">${chips.map((c) => html`<span class="chip">${c}</span>`)}</div>
        </div>
      </section>
      <div class="grid g3" style="margin-top:18px">${tiles.map((k) => html`<a class="stat tint-${ENTITIES[k].tint}" href="#/${k}${admin ? '?lecturer=' + l.id : ''}"><span class="si">${icon(ENTITIES[k].icon, 22)}</span><b>${mine(k).length}</b><span class="l">${ENTITIES[k].plural}</span></a>`)}</div>
      <div class="grid g2" style="margin-top:18px">
        <section class="card"><h3>Expertise</h3>${exp.length ? html`<div class="tbl-wrap"><table><thead><tr><th>Expertise</th><th>Category</th><th>Level</th><th>Years</th></tr></thead><tbody>${exp.map((e) => html`<tr><td>${e.area}</td><td>${cell('category', e.category_id)}</td><td><span class="badge ${levelClass(e.level)}">${e.level}</span></td><td>${e.years}</td></tr>`)}</tbody></table></div>` : html`<p class="muted">No expertise recorded yet.</p>`}</section>
        <section class="card"><h3>Latest Publications</h3>${mine('publications').length ? html`<ul class="act-list">${[...mine('publications')].sort((a, b) => b.year - a.year).slice(0, 5).map((p) => html`<li><span>${p.title}<br><small class="faint">${p.venue} · ${p.year}</small></span><span class="d">${cell('status', p.status)}</span></li>`)}</ul>` : html`<p class="muted">No publications recorded yet.</p>`}</section>
      </div>`);
    const eb = $('#edit', root); if (eb) eb.onclick = () => openProfileEditor(lec, draw);
  };
  draw();
  if (!admin) { /* lecturers reach their own record pages through the sidebar */ }
}
