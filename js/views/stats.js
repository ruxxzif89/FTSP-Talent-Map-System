import { store, lecturerOf } from '../api.js';
import { html, mount, icon, barChart, donut, PALETTE, fmtDate } from '../util.js';
import { LEVELS, DEPARTMENTS } from '../schema.js';
import { pageHead } from './_ui.js';

const count = (rows, key) => { const m = new Map(); rows.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1)); return m; };

export async function render(root) {
  const cats = store.expertise_categories.map((c) => ({ label: c.name, color: c.color, value: new Set(store.expertise.filter((e) => e.category_id === c.id).map((e) => e.lecturer_id)).size })).sort((a, b) => b.value - a.value);
  const lv = LEVELS.map((l, i) => ({ label: l, value: store.expertise.filter((e) => e.level === l).length, color: PALETTE[i] }));
  const dept = DEPARTMENTS.map((d, i) => ({ label: d, value: store.lecturers.filter((l) => l.department === d).length, color: PALETTE[i] })).filter((d) => d.value);
  const pubYear = [...count(store.publications, 'year')].sort((a, b) => a[0] - b[0]).slice(-8).map(([y, n]) => ({ label: String(y), value: n }));
  const pubType = [...count(store.publications, 'type')].map(([k, v], i) => ({ label: k, value: v, color: PALETTE[i % PALETTE.length] }));
  const noExp = store.lecturers.filter((l) => !store.expertise.some((e) => e.lecturer_id === l.id));
  const avgYears = store.expertise.length ? (store.expertise.reduce((a, e) => a + Number(e.years || 0), 0) / store.expertise.length).toFixed(1) : '0';
  const leaders = store.lecturers.map((l) => ({ l, n: store.publications.filter((p) => p.lecturer_id === l.id).length })).sort((a, b) => b.n - a.n).slice(0, 5);
  mount(root, html`${pageHead('Statistics', 'Faculty-wide expertise and output figures for planning.')}
    <div class="grid g4">
      <div class="stat tint-blue"><span class="si">${icon('users', 22)}</span><b>${store.lecturers.length}</b><span class="l">Lecturers</span></div>
      <div class="stat tint-green"><span class="si">${icon('brain', 22)}</span><b>${store.expertise.length}</b><span class="l">Expertise records</span></div>
      <div class="stat tint-amber"><span class="si">${icon('star', 22)}</span><b>${avgYears}</b><span class="l">Avg. years of experience</span></div>
      <div class="stat tint-rose"><span class="si">${icon('alert', 22)}</span><b>${noExp.length}</b><span class="l">Lecturers with no expertise</span></div>
    </div>
    <div class="grid g-2-1" style="margin-top:18px"><section class="card"><h3>Lecturers per expertise category</h3>${barChart(cats.slice(0, 10), { height: 230 })}</section><section class="card"><h3>Expertise level</h3>${donut(lv, { center: store.expertise.length, sub: 'Records' })}</section></div>
    <div class="grid g3" style="margin-top:18px"><section class="card"><h3>Publications per year</h3>${barChart(pubYear, { color: '#8b5cf6' })}</section><section class="card"><h3>Publication types</h3>${donut(pubType, { center: store.publications.length, sub: 'Total' })}</section><section class="card"><h3>By department</h3>${donut(dept, { center: store.lecturers.length, sub: 'Lecturers' })}</section></div>
    <div class="grid g2" style="margin-top:18px"><section class="card"><h3>Top publishing lecturers</h3><ul class="act-list">${leaders.map(({ l, n }) => html`<li><a href="#/lecturer/${l.id}">${l.full_name}</a><span class="d"><b>${n}</b> publications</span></li>`)}</ul></section>
    <section class="card"><h3>Needs attention: no expertise recorded</h3>${noExp.length ? html`<ul class="act-list">${noExp.slice(0, 6).map((l) => html`<li><a href="#/lecturer/${l.id}">${l.full_name}</a><span class="d">${l.department}</span></li>`)}</ul>` : html`<p class="muted">Every lecturer has at least one expertise record.</p>`}</section></div>`);
}
