// The only module the UI uses to reach data. Swap transports here (local -> Apps Script -> SQL/REST).
import { CONFIG } from './config.js';
import { ENTITIES } from './schema.js';

const TOKEN_KEY = 'ftm:token';
let token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
export const store = { me: null, loaded: false };
const listeners = new Set();
export const onChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((f) => f());

async function transport(action, payload) {
  if (CONFIG.backend === 'gas') {
    if (!CONFIG.gasUrl) throw new Error('Apps Script URL is not configured (js/config.js).');
    // text/plain avoids a CORS preflight, which Apps Script web apps cannot answer.
    const res = await fetch(CONFIG.gasUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload, token }) });
    const j = await res.json();
    if (!j.ok) { const e = new Error(j.error || 'Request failed'); e.code = j.code; throw e; }
    return j.data;
  }
  const { handle } = await import('./local-server.js');
  return handle(action, payload, token);
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
  sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY);
}

export async function login(username, password, remember) {
  const r = await call('login', { username, password });
  token = r.token;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  store.me = r.user;
  await load();
  return r.user;
}
export async function logout() { try { if (token) await call('logout'); } catch { /* ignore */ } clearSession(); emit(); }

export async function restore() {
  if (!token) return null;
  try { const r = await call('me'); store.me = r.user; await load(); return r.user; } catch { clearSession(); return null; }
}

export async function load() {
  const snap = await call('snapshot');
  Object.assign(store, snap, { loaded: true });
  emit();
}

const SING = Object.fromEntries(Object.entries(ENTITIES).map(([k, e]) => [k, e.singular.toLowerCase()]));
const patchStore = (table, row) => { const list = store[table]; const i = list.findIndex((r) => r.id === row.id); if (i >= 0) list[i] = row; else list.push(row); };

export async function create(table, row) { const r = await call('create', { table, row }); patchStore(table, r); note(r.lecturer_id, 'Added new ' + SING[table]); emit(); return r; }
export async function update(table, id, patch) { const r = await call('update', { table, id, patch }); patchStore(table, r); if (table === 'lecturers') { const u = store.users.find((x) => x.id === r.user_id); if (u) Object.assign(u, { full_name: r.full_name, email: r.email, department: r.department }); } note(r.lecturer_id || r.id, table === 'lecturers' ? 'Updated profile information' : 'Updated ' + SING[table] + ' information'); emit(); return r; }
export async function remove(table, id) { const old = store[table].find((r) => r.id === id); await call('remove', { table, id }); store[table] = store[table].filter((r) => r.id !== id); if (table === 'documents') ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements'].forEach((t) => store[t].forEach((r) => { if (r.document_id === id) r.document_id = ''; })); if (old) note(old.lecturer_id, 'Removed ' + SING[table]); emit(); }
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
export const bulkImport = async (tables) => { const r = await call('bulkImport', { tables }); await load(); return r; };
export const clearDemo = async () => { const r = await call('clearDemo'); await load(); return r; };

// Mirrors what the server logs, so we avoid a second round trip.
function note(lecturer_id, message) { if (lecturer_id && store.lecturers.some((l) => l.id === lecturer_id)) store.activity_log.push({ id: 'local_' + Date.now(), lecturer_id, message, created_at: new Date().toISOString() }); }

// ---- selectors (read helpers over the cached snapshot) ----
export const lecturerOf = (id) => store.lecturers.find((l) => l.id === id);
export const categoryOf = (id) => store.expertise_categories.find((c) => c.id === id);
export const myLecturer = () => store.me && store.lecturers.find((l) => l.user_id === store.me.id);
export const docOf = (id) => store.documents.find((d) => d.id === id);
