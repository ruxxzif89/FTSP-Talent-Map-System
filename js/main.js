import * as api from './api.js';
import { store, onChange, myLecturer } from './api.js';
import { html, mount, $, $$, icon, logo, avatar, fmtDate } from './util.js';
import { ENTITIES, ENTITY_ORDER } from './schema.js';

const app = $('#app');
let cleanup = null;
let shellEl = null;

// route table: pattern -> {view module, roles}
const ROUTES = [
  ['dashboard', 'dashboard', ['admin', 'lecturer']],
  ['profile', 'profile', ['lecturer']],
  ['lecturers', 'lecturers', ['admin']],
  ['lecturer/:id', 'profileView', ['admin', 'lecturer']],
  ['talent', 'talent', ['admin']],
  ['users', 'users', ['admin']],
  ['categories', 'categories', ['admin']],
  ['stats', 'stats', ['admin']],
  ['reports', 'reports', ['admin']],
  ['account', 'account', ['admin', 'lecturer']],
  ...ENTITY_ORDER.map((e) => [e, 'records:' + e, ['admin', 'lecturer']]),
];

function match(path) {
  for (const [pat, view, roles] of ROUTES) {
    const a = pat.split('/'), b = path.split('/');
    if (a.length !== b.length) continue;
    const params = {}; let ok = true;
    a.forEach((seg, i) => { if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(b[i]); else if (seg !== b[i]) ok = false; });
    if (ok) return { view, roles, params, pat };
  }
  return null;
}

function navFor(role) {
  const ent = (k) => ({ href: '#/' + k, key: k, label: role === 'admin' ? ENTITIES[k].plural : ENTITIES[k].mine, icon: ENTITIES[k].icon });
  if (role === 'admin') return [
    { href: '#/dashboard', key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { grp: 'Manage' },
    { href: '#/users', key: 'users', label: 'Manage Users', icon: 'user' },
    { href: '#/lecturers', key: 'lecturers', label: 'Lecturers', icon: 'users' },
    { href: '#/categories', key: 'categories', label: 'Expertise Categories', icon: 'tag' },
    { href: '#/talent', key: 'talent', label: 'Talent Mapping', icon: 'map' },
    { grp: 'Records' },
    ...ENTITY_ORDER.map(ent),
    { grp: 'Insights' },
    { href: '#/stats', key: 'stats', label: 'Statistics', icon: 'chart' },
    { href: '#/reports', key: 'reports', label: 'Reports', icon: 'report' },
  ];
  return [
    { href: '#/dashboard', key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '#/profile', key: 'profile', label: 'My Profile', icon: 'user' },
    ...ENTITY_ORDER.map(ent),
  ];
}

function renderShell() {
  const me = store.me; const lec = myLecturer();
  const nav = navFor(me.role);
  mount(app, html`
    <div class="shell" id="shell">
      <header class="topbar">
        <button class="icon-btn menu-btn" id="menu" aria-label="Toggle navigation" aria-expanded="false">${icon('menu', 24)}</button>
        <a class="brand" href="#/dashboard" aria-label="FSTP Talent Map home">${logo(34)}<span>FSTP TALENT MAP<small>UPNM · Faculty of Defence Science &amp; Technology</small></span></a>
        <span class="grow"></span>
        <div class="rel"><button class="icon-btn" id="bell" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">${icon('bell', 22)}<span class="dot" id="bell-n" hidden></span></button><div id="bell-pop"></div></div>
        <div class="rel"><button class="user-chip" id="uchip" aria-haspopup="true" aria-expanded="false">${avatar(lec || { full_name: me.full_name }, 34)}<span class="n">${me.role === 'admin' ? 'Admin' : me.full_name}</span>${icon('chevron', 14)}</button><div id="u-pop"></div></div>
      </header>
      <aside class="sidebar" id="sidebar" aria-label="Main navigation"><nav>${nav.map((n) => (n.grp ? html`<div class="grp">${n.grp}</div>` : html`<a class="nav-a" href="${n.href}" data-key="${n.key}">${icon(n.icon, 19)}<span>${n.label}</span><span class="count" data-count="${n.key}" hidden></span></a>`))}</nav></aside>
      <div class="scrim" id="scrim"></div>
      <main id="view" tabindex="-1"></main>
    </div>`);
  shellEl = $('#shell');
  const setOpen = (v) => { shellEl.classList.toggle('open', v); $('#menu').setAttribute('aria-expanded', v); };
  $('#menu').onclick = () => setOpen(!shellEl.classList.contains('open'));
  $('#scrim').onclick = () => setOpen(false);
  $('#sidebar').addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  wirePopovers();
  updateChrome();
}

function activityFeed() {
  const rows = [...store.activity_log].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const soon = store.certifications.filter((c) => c.expiry_date && (new Date(c.expiry_date) - Date.now()) / 864e5 <= 90 && new Date(c.expiry_date) > Date.now());
  return { rows, soon };
}
function updateChrome() {
  if (!shellEl) return;
  const { soon } = activityFeed();
  const dot = $('#bell-n'); dot.hidden = !soon.length; dot.textContent = soon.length;
  const counts = { lecturers: store.lecturers.length, users: store.users.length, categories: store.expertise_categories.length };
  ENTITY_ORDER.forEach((k) => (counts[k] = store[k].length));
  $$('[data-count]').forEach((el) => { const n = counts[el.dataset.count]; el.textContent = n ?? ''; el.hidden = n == null; });
}

let popsWired = false, closeAllPops = () => {};
function wirePopovers() {
  const pops = [['#bell', '#bell-pop', bellHtml], ['#uchip', '#u-pop', userHtml]];
  const closeAll = () => pops.forEach(([b, p]) => { const pe = $(p), be = $(b); if (pe) pe.innerHTML = ''; if (be) be.setAttribute('aria-expanded', 'false'); });
  closeAllPops = closeAll;
  pops.forEach(([b, p, fn]) => {
    $(b).onclick = (e) => { e.stopPropagation(); const open = $(p).innerHTML !== ''; closeAll(); if (!open) { $(p).innerHTML = fn().s; $(b).setAttribute('aria-expanded', 'true'); const first = $(p + ' a,' + p + ' button'); first && first.focus(); } };
  });
  if (!popsWired) { // document-level listeners are registered once; they always call the latest closeAll
    popsWired = true;
    document.addEventListener('click', (e) => { if (!e.target.closest('.pop')) closeAllPops(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPops(); });
  }
  $('#u-pop').addEventListener('click', async (e) => {
    const t = e.target.closest('[data-do]'); if (!t) return;
    if (t.dataset.do === 'logout') { await api.logout(); location.hash = '#/login'; }
    if (t.dataset.do === 'theme') { const d = document.documentElement; const n = d.dataset.theme === 'dark' ? 'light' : 'dark'; d.dataset.theme = n; try { localStorage.setItem('ftm:theme', n); } catch { /* private mode */ } closeAll(); window.dispatchEvent(new Event('themechange')); }
  });
}
const bellHtml = () => {
  const { rows, soon } = activityFeed();
  return html`<div class="pop" role="region" aria-label="Notifications"><h4>Notifications</h4>${soon.map((c) => html`<div class="note">${icon('alert', 18)}<span><b>${c.name}</b> expires ${fmtDate(c.expiry_date)}${store.me.role === 'admin' ? ' · ' + (store.lecturers.find((l) => l.id === c.lecturer_id) || {}).full_name : ''}</span></div>`)}${rows.map((r) => html`<div class="note">${icon('check', 18)}<span>${r.message}<br><small class="faint">${fmtDate(r.created_at)}${store.me.role === 'admin' ? ' · ' + ((store.lecturers.find((l) => l.id === r.lecturer_id) || {}).full_name || '') : ''}</small></span></div>`)}${!rows.length && !soon.length ? html`<div class="note">You're all caught up.</div>` : ''}</div>`;
};
const userHtml = () => html`<div class="pop" role="menu"><h4>${store.me.full_name}</h4><a href="#/account" role="menuitem">${icon('key', 18)} Account &amp; password</a><button class="mi" data-do="theme" role="menuitem">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 18)} Switch theme</button><button class="mi" data-do="logout" role="menuitem">${icon('out', 18)} Sign out</button></div>`;

let revalidating = null;
async function route() {
  if (cleanup) { try { cleanup(); } catch { /* noop */ } cleanup = null; }
  const path = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  if (!store.me) {
    const r = await api.restore();
    if (!r && path !== 'login') { location.hash = '#/login'; return; }
    if (r) revalidating = r.revalidate;
  }
  if (!store.me) { return renderLogin(); }
  if (path === 'login' || path === '') { location.hash = '#/dashboard'; return; }
  if (!shellEl || !document.body.contains(shellEl)) renderShell();
  const m = match(path);
  const view = $('#view');
  if (!m || !m.roles.includes(store.me.role)) {
    mount(view, html`<div class="empty card">${icon('alert', 36)}<h3>Page not available</h3><p>${m ? 'Your role cannot open this page.' : 'That page does not exist.'}</p><p><a class="btn primary" href="#/dashboard" style="margin-top:14px">Back to dashboard</a></p></div>`);
    return;
  }
  const base = m.pat.split('/')[0];
  $$('.nav-a').forEach((a) => (a.dataset.key === base ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.title = 'FSTP Talent Map';
  try {
    const [mod, arg] = m.view.split(':');
    const v = await import(`./views/${mod}.js`);
    if (location.hash.replace(/^#\/?/, '').split('?')[0] !== path) return; // navigated away while loading
    const query = Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''));
    cleanup = (await v.render(view, { ...query, ...m.params, entity: arg })) || null;
    view.focus({ preventScroll: true }); window.scrollTo({ top: 0 });
    if (revalidating) { // painted from cache: if the server has newer data, redraw once (unless the user is mid-edit)
      const rv = revalidating; revalidating = null;
      rv.then((changed) => { if (changed && !document.querySelector('.overlay') && location.hash.replace(/^#\/?/, '').split('?')[0] === path) route(); });
    }
  } catch (e) {
    console.error(e);
    mount(view, html`<div class="empty card">${icon('alert', 36)}<h3>Something went wrong</h3><p>${e.message}</p></div>`);
  }
}

async function renderLogin() {
  shellEl = null;
  const v = await import('./views/login.js');
  cleanup = await v.render(app);
}

onChange(updateChrome);
window.addEventListener('hashchange', route);
route();
