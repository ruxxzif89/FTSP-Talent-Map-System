// Talent Mapping: search/filter lecturers by expertise, with a card view and a 3D "expertise galaxy".
import { store, categoryOf } from '../api.js';
import { html, mount, $, $$, icon, avatar, levelClass, levelRank, esc } from '../util.js';
import { DEPARTMENTS, LEVELS } from '../schema.js';
import { pageHead, debounce } from './_ui.js';

export function searchTalent({ q = '', dept = '', level = '', cat = '' }) {
  const text = q.trim().toLowerCase();
  const out = [];
  for (const l of store.lecturers) {
    if (dept && l.department !== dept) continue;
    const exps = store.expertise.filter((e) => e.lecturer_id === l.id);
    const nameHit = text && l.full_name.toLowerCase().includes(text);
    const works = text ? [...store.research, ...store.publications].filter((r) => r.lecturer_id === l.id && (r.title || '').toLowerCase().includes(text)) : [];
    let hits = exps.filter((e) => (!cat || e.category_id === cat) && (!level || e.level === level) && (!text || nameHit || `${e.area} ${e.interest} ${(categoryOf(e.category_id) || {}).name}`.toLowerCase().includes(text)));
    if (!hits.length && text && !cat && !level && works.length) hits = exps.slice(0, 1); // matched via research/publication titles only
    if (!hits.length && !(nameHit && !cat && !level)) continue;
    const best = [...(hits.length ? hits : exps)].sort((a, b) => levelRank(b.level) - levelRank(a.level) || b.years - a.years)[0];
    out.push({ l, best, hits, score: (best ? levelRank(best.level) * 10 + best.years : 0) + (nameHit ? 50 : 0) + works.length });
  }
  return out;
}

export async function render(root, { cat: catParam }) {
  const st = { q: '', dept: '', level: '', cat: catParam || '', sort: 'relevance', view: 'cards' };
  const cats = store.expertise_categories;
  mount(root, html`${pageHead('Talent Mapping', 'Search and find lecturers based on expertise, department or research area.', html`<div class="seg" role="group" aria-label="View"><button data-view="cards" aria-pressed="true">${icon('grid', 16)} Cards</button><button data-view="3d" aria-pressed="false">${icon('cube', 16)} 3D Galaxy</button></div>`)}
    <div class="card" style="margin-bottom:18px"><div class="toolbar" style="margin:0"><div class="search">${icon('search', 18)}<input class="input" id="q" type="search" placeholder="Search lecturer name, expertise or research topic…" aria-label="Search talent"></div>
      <select class="input" id="d" style="max-width:220px" aria-label="Department"><option value="">All Departments</option>${DEPARTMENTS.map((d) => html`<option>${d}</option>`)}</select>
      <select class="input" id="lv" style="max-width:200px" aria-label="Expertise level"><option value="">All Expertise Levels</option>${LEVELS.map((d) => html`<option>${d}</option>`)}</select></div></div>
    <div class="tm"><aside class="card" style="padding:12px"><h3 style="padding:4px 10px 0">Expertise Categories</h3><ul class="cat-list" id="cats"></ul></aside><section><div class="row between" style="margin-bottom:14px"><h2 id="rh" style="font-size:18px;font-weight:800"></h2><select class="input" id="so" style="max-width:190px;min-height:38px" aria-label="Sort"><option value="relevance">Sort by: Relevance</option><option value="name">Sort by: Name</option><option value="years">Sort by: Experience</option></select></div><div id="res" aria-live="polite"></div></section></div>`);

  let galaxy = null; let disposed = false;
  const results = () => searchTalent(st);
  const drawCats = () => {
    const base = searchTalent({ ...st, cat: '' });
    const counts = new Map(); base.forEach((r) => new Set(store.expertise.filter((e) => e.lecturer_id === r.l.id && (!st.level || e.level === st.level)).map((e) => e.category_id)).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
    $('#cats', root).innerHTML = html`<li><button data-cat="" aria-pressed="${!st.cat}"><i style="background:var(--ink-3)"></i>All categories<em>${base.length}</em></button></li>${[...cats].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)).map((c) => html`<li><button data-cat="${c.id}" aria-pressed="${st.cat === c.id}"><i style="background:${c.color}"></i>${c.name}<em>${counts.get(c.id) || 0}</em></button></li>`)}`.s;
  };
  const draw = () => {
    drawCats();
    let r = results();
    r.sort(st.sort === 'name' ? (a, b) => a.l.full_name.localeCompare(b.l.full_name) : st.sort === 'years' ? (a, b) => (b.best ? b.best.years : 0) - (a.best ? a.best.years : 0) : (a, b) => b.score - a.score);
    const c = cats.find((x) => x.id === st.cat);
    $('#rh', root).textContent = `${c ? c.name + ' Experts' : st.q ? 'Search results' : 'All Lecturers'} (${r.length} Lecturer${r.length === 1 ? '' : 's'})`;
    const res = $('#res', root);
    if (st.view === '3d') { if (galaxy) { galaxy.setFilter(new Set(r.map((x) => x.l.id))); } else load3d(res, r); return; }
    if (galaxy) { galaxy.dispose(); galaxy = null; }
    res.innerHTML = r.length ? html`<div class="people">${r.map(({ l, best, hits }) => html`<article class="person">${avatar(l, 64)}<div class="body"><h4>${l.full_name}</h4>${best ? html`<span class="badge ${levelClass(best.level)}" style="margin-top:4px">${best.level}</span>` : ''}<div class="meta"><span>${icon('brain', 14)} ${l.department}</span>${best ? html`<span>${icon('award', 14)} ${best.years} years experience</span><span>${icon('tag', 14)} ${[...new Set((hits.length ? hits : [best]).map((e) => e.area))].slice(0, 3).join(', ')}</span>` : html`<span>${icon('alert', 14)} No expertise recorded</span>`}</div><a class="btn outline sm" style="width:100%" href="#/lecturer/${l.id}">View Profile</a></div></article>`)}</div>`.s
      : html`<div class="card empty">${icon('search', 40)}<h3>No lecturers match</h3><p>Try removing a filter or searching a broader term.</p></div>`.s;
  };

  async function load3d(host, r) {
    host.innerHTML = html`<div class="galaxy" id="gx"><div class="tip" id="tip"></div><div class="fallback" id="fb"><p>3D view needs WebGL, which isn’t available here.<br>Switch back to <b>Cards</b>.</p></div><div class="hud"><span>Drag to orbit · scroll to zoom</span><span>Click a person to open their profile</span><span id="gcount"></span></div></div>`.s;
    try {
      const m = await import('../three/galaxy.js');
      if (disposed) return;
      galaxy = m.createGalaxy($('#gx', root), { lecturers: store.lecturers, expertise: store.expertise, categories: cats, onOpen: (id) => (location.hash = '#/lecturer/' + id), tip: $('#tip', root) });
      if (!galaxy) throw new Error('webgl');
      galaxy.setFilter(new Set(r.map((x) => x.l.id)));
      $('#gcount', root).textContent = `${r.length} lecturers highlighted`;
    } catch (e) { $('#fb', root).style.display = 'grid'; }
  }

  $('#q', root).oninput = debounce((e) => { st.q = e.target.value; draw(); });
  $('#d', root).onchange = (e) => { st.dept = e.target.value; draw(); };
  $('#lv', root).onchange = (e) => { st.level = e.target.value; draw(); };
  $('#so', root).onchange = (e) => { st.sort = e.target.value; draw(); };
  $('#cats', root).onclick = (e) => { const b = e.target.closest('[data-cat]'); if (b) { st.cat = b.dataset.cat; draw(); } };
  $$('[data-view]', root).forEach((b) => (b.onclick = () => { st.view = b.dataset.view; $$('[data-view]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); if (st.view === 'cards' && galaxy) { galaxy.dispose(); galaxy = null; } draw(); }));
  draw();
  return () => { disposed = true; if (galaxy) galaxy.dispose(); };
}
