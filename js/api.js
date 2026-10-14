// The only module the UI uses to reach data. Swap transports here (local -> Apps Script -> SQL/REST).
import { CONFIG } from './config.js';
import { ENTITIES, TABLES } from './schema.js';

const TOKEN_KEY = 'ftm:token';
let token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
export const store = { me: null, loaded: false };
const listeners = new Set();
export const onChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((f) => f());

async function transport(action, payload) {
  const tk = token; // ditangkap serta-merta: logout membersihkan token sebelum permintaan dihantar
  if (CONFIG.backend === 'gas') {
    if (!CONFIG.gasUrl) throw new Error('URL Apps Script belum ditetapkan (js/config.js).');
    // text/plain avoids a CORS preflight, which Apps Script web apps cannot answer.
    const res = await fetch(CONFIG.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload, token: tk }) });
    const j = await res.json();
    if (!j.ok) { const e = new Error(j.error || 'Permintaan gagal'); e.code = j.code; throw e; }
    return j.data;
  }
  const { handle } = await import('./local-server.js');
  return handle(action, payload, tk);
}

export async function call(action, payload) {
  try { return await transport(action, payload); }
  catch (e) {
    if (e.code === 401 && action !== 'login') { clearSession(); location.hash = '#/login'; }
    throw e;
  }
}

function clearSession() {
  token = ''; store.me = null; store.loaded = false;
  sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('ftm:snap');
}

export async function login(username, password, remember) {
  const r = await call('login', { username, password });
  token = r.token;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  store.me = r.user;
  await load();
  return r.user;
}
// Log keluar serta-merta: sesi dibersihkan di sini dahulu; pembatalan token di pelayan berjalan di latar belakang.
export function logout() { if (token) call('logout').catch(() => {}); clearSession(); emit(); return Promise.resolve(); }

// Session cache: lets a refresh paint instantly from the last snapshot while fresh data loads in the background.
const SNAP_KEY = 'ftm:snap';
const DATA_KEYS = TABLES;
const dataOnly = () => Object.fromEntries(DATA_KEYS.map((k) => [k, store[k] || []]));
export function saveSnap() { try { if (store.me && store.loaded) sessionStorage.setItem(SNAP_KEY, JSON.stringify({ me: store.me, snap: dataOnly() })); } catch { /* quota / private mode: just skip caching */ } }
const readSnap = () => { try { return JSON.parse(sessionStorage.getItem(SNAP_KEY)); } catch { return null; } };
addEventListener('pagehide', saveSnap);

// Resolves {user, revalidate}: `revalidate` is a promise<boolean> (true when fresh data differs from what was painted).
export async function restore() {
  if (!token) return null;
  const cached = readSnap();
  const fetchFresh = () => Promise.all([call('me'), call('snapshot')]); // parallel: one round trip instead of two
  try {
    if (cached && cached.me) {
      Object.assign(store, cached.snap, { me: cached.me, loaded: true }); fill();
      const revalidate = fetchFresh().then(([m, snap]) => { const changed = JSON.stringify(snap) !== JSON.stringify(cached.snap); store.me = m.user; Object.assign(store, snap, { loaded: true }); fill(); saveSnap(); return changed; }).catch(() => false);
      return { user: cached.me, revalidate };
    }
    const [m, snap] = await fetchFresh();
    store.me = m.user; Object.assign(store, snap, { loaded: true }); fill(); saveSnap(); emit();
    return { user: m.user, revalidate: Promise.resolve(false) };
  } catch { clearSession(); return null; }
}

export async function load() {
  const snap = await call('snapshot');
  Object.assign(store, snap, { loaded: true }); fill();
  saveSnap();
  emit();
}

const SING = Object.fromEntries(Object.entries(ENTITIES).map(([k, e]) => [k, e.singular.toLowerCase()]));
SING.promotion_assessors = 'penilai luar';
const fill = () => TABLES.forEach((t) => { if (!Array.isArray(store[t])) store[t] = []; });
const patchStore = (table, row) => { const list = store[table]; const i = list.findIndex((r) => r.id === row.id); if (i >= 0) list[i] = row; else list.push(row); };

export async function create(table, row) { const r = await call('create', { table, row }); patchStore(table, r); note(r.lecturer_id, 'Menambah ' + SING[table] + ' baharu'); emit(); return r; }
export async function update(table, id, patch) { const r = await call('update', { table, id, patch }); patchStore(table, r); if (table === 'lecturers') { const u = store.users.find((x) => x.id === r.user_id); if (u) Object.assign(u, { full_name: r.full_name, email: r.email, department: r.department }); } note(r.lecturer_id || r.id, table === 'lecturers' ? 'Mengemas kini maklumat profil' : 'Mengemas kini maklumat ' + SING[table]); emit(); return r; }
export async function remove(table, id) { const old = store[table].find((r) => r.id === id); await call('remove', { table, id }); store[table] = store[table].filter((r) => r.id !== id); if (table === 'documents') ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements'].forEach((t) => store[t].forEach((r) => { if (r.document_id === id) r.document_id = ''; })); if (old) note(old.lecturer_id, 'Memadam ' + SING[table]); emit(); }
export async function upload(file, meta) {
  const dataUrl = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  const row = await call('upload', { ...meta, file_name: file.name, mime: file.type, size: file.size, dataUrl });
  store.documents.push(row); emit();
  return row;
}
export async function download(id) { return call('download', { id }); }
export const createUser = async (user) => { const u = await call('createUser', { user }); await load(); return u; };
export const updateUser = async (id, patch) => { const u = await call('updateUser', { id, patch }); await load(); return u; };
export const resetPassword = (id, password) => call('resetPassword', { id, password });
export const changePassword = (current, password) => call('changePassword', { current, password });
export const deleteUser = async (id) => { await call('deleteUser', { id }); await load(); };
export const resetDemo = () => call('resetDemo');
// ---- kenaikan pangkat ----
export async function promoSave(data) { const r = await call('promoSave', data); patchStore('promotion_applications', r); emit(); return r; }
export async function promoSubmit(id, ack) { const r = await call('promoSubmit', { id, ack }); await load(); return r; }
export async function promoAct(id, payload) { const r = await call('promoAct', { id, ...payload }); await load(); return r; }
export async function promoAppeal(id, reason) { const r = await call('promoAppeal', { id, reason }); await load(); return r; }
export async function promoRemove(id) { await call('promoRemove', { id }); store.promotion_applications = store.promotion_applications.filter((a) => a.id !== id); store.promotion_events = store.promotion_events.filter((e) => e.application_id !== id); emit(); }
export const bulkImport = async (tables) => { const r = await call('bulkImport', { tables }); await load(); return r; };
export const clearDemo = async () => { const r = await call('clearDemo'); await load(); return r; };

// Mirrors what the server logs, so we avoid a second round trip.
function note(lecturer_id, message) { if (lecturer_id && store.lecturers.some((l) => l.id === lecturer_id)) store.activity_log.push({ id: 'local_' + Date.now(), lecturer_id, message, created_at: new Date().toISOString() }); }

// ---- selectors (read helpers over the cached snapshot) ----
export const lecturerOf = (id) => store.lecturers.find((l) => l.id === id);
export const categoryOf = (id) => store.expertise_categories.find((c) => c.id === id);
export const myLecturer = () => store.me && store.lecturers.find((l) => l.user_id === store.me.id);
export const docOf = (id) => store.documents.find((d) => d.id === id);
