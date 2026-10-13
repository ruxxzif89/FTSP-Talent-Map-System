// In-browser stand-in for the Apps Script backend (backend/Code.gs).
// Same actions, same rules (auth, ownership, referential integrity) so the UI cannot tell them apart.
import { TABLES, OWNED, ENTITIES, MAX_FILE_BYTES } from './schema.js';
import { buildSeed } from './seed.js';

const K = (t) => 'ftm:db:' + t;
const read = (t) => JSON.parse(localStorage.getItem(K(t)) || '[]');
const write = (t, rows) => localStorage.setItem(K(t), JSON.stringify(rows));
const nowIso = () => new Date().toISOString();
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const hashPw = (salt, pw) => sha256(salt + ':' + pw);

// ---- IndexedDB blob store (file bodies live outside the row tables) ----
let _db;
function blobDb() {
  return (_db ||= new Promise((res, rej) => {
    const r = indexedDB.open('ftm-blobs', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('blobs');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}
async function blobOp(mode, fn) {
  const db = await blobDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('blobs', mode);
    const req = fn(tx.objectStore('blobs'));
    tx.oncomplete = () => res(req && req.result);
    tx.onerror = () => rej(tx.error);
  });
}

class HttpError extends Error { constructor(msg, code = 400) { super(msg); this.code = code; } }

async function ensureSeed() {
  if (localStorage.getItem('ftm:seeded') === '3') return;
  const seed = await buildSeed(hashPw);
  TABLES.forEach((t) => write(t, seed[t] || []));
  localStorage.setItem('ftm:seeded', '3');
}

function session(token) {
  const s = JSON.parse(localStorage.getItem('ftm:sessions') || '{}');
  const e = s[token];
  if (!e || e.exp < Date.now()) throw new HttpError('Session expired. Please sign in again.', 401);
  const user = read('users').find((u) => u.id === e.uid);
  if (!user || user.status !== 'Active') throw new HttpError('Account is inactive.', 401);
  const lecturer = read('lecturers').find((l) => l.user_id === user.id) || null;
  return { user, lecturer };
}

const safeUser = ({ password_hash, salt, ...u }) => u;
const needAdmin = (ctx) => { if (ctx.user.role !== 'admin') throw new HttpError('Admin only.', 403); };

function logActivity(lecturer_id, message) {
  const rows = read('activity_log');
  rows.push({ id: uid('act'), lecturer_id, message, created_at: nowIso() });
  write('activity_log', rows.slice(-400));
}

const actions = {
  async login({ username, password }) {
    const u = read('users').find((x) => x.username.toLowerCase() === String(username).trim().toLowerCase() || x.email.toLowerCase() === String(username).trim().toLowerCase());
    if (!u || (await hashPw(u.salt, password)) !== u.password_hash) throw new HttpError('Invalid username or password.', 401);
    if (u.status !== 'Active') throw new HttpError('This account is inactive. Contact the administrator.', 403);
    const token = uid('tok') + uid('t');
    const s = JSON.parse(localStorage.getItem('ftm:sessions') || '{}');
    s[token] = { uid: u.id, exp: Date.now() + 12 * 3600 * 1000 };
    localStorage.setItem('ftm:sessions', JSON.stringify(s));
    const rows = read('users');
    rows.find((x) => x.id === u.id).last_login = nowIso();
    write('users', rows);
    return { token, user: safeUser(u) };
  },
  async logout(_p, _c, token) {
    const s = JSON.parse(localStorage.getItem('ftm:sessions') || '{}');
    delete s[token];
    localStorage.setItem('ftm:sessions', JSON.stringify(s));
    return true;
  },
  async me(_p, ctx) { return { user: safeUser(ctx.user) }; },

  // One round trip hands the client everything it may see.
  async snapshot(_p, ctx) {
    const out = {};
    const isAdmin = ctx.user.role === 'admin';
    const lid = ctx.lecturer && ctx.lecturer.id;
    out.users = isAdmin ? read('users').map(safeUser) : [safeUser(ctx.user)];
    out.lecturers = isAdmin ? read('lecturers') : read('lecturers').filter((l) => l.id === lid);
    out.expertise_categories = read('expertise_categories');
    OWNED.forEach((t) => { out[t] = isAdmin ? read(t) : read(t).filter((r) => r.lecturer_id === lid); });
    return out;
  },

  async create({ table, row }, ctx) {
    if (!['expertise_categories', ...OWNED].includes(table) || table === 'activity_log' || table === 'documents') throw new HttpError('Invalid table.');
    const isAdmin = ctx.user.role === 'admin';
    if (table === 'expertise_categories') needAdmin(ctx);
    const r = { ...row, id: uid(table.slice(0, 3)), created_at: nowIso(), updated_at: nowIso() };
    if (OWNED.includes(table)) {
      r.lecturer_id = isAdmin ? row.lecturer_id : ctx.lecturer && ctx.lecturer.id;
      if (!r.lecturer_id || !read('lecturers').some((l) => l.id === r.lecturer_id)) throw new HttpError('Lecturer required.');
      if (r.document_id) assertOwnsDoc(r.document_id, r.lecturer_id);
    }
    if (table === 'expertise_categories' && read(table).some((c) => c.name.toLowerCase() === String(r.name).toLowerCase())) throw new HttpError('Category already exists.');
    const rows = read(table); rows.push(r); write(table, rows);
    if (r.lecturer_id) logActivity(r.lecturer_id, 'Added new ' + ENTITIES[table].singular.toLowerCase());
    return r;
  },

  async update({ table, id, patch }, ctx) {
    if (!['lecturers', 'expertise_categories', ...OWNED].includes(table) || table === 'activity_log') throw new HttpError('Invalid table.');
    const rows = read(table);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new HttpError('Record not found.', 404);
    const isAdmin = ctx.user.role === 'admin';
    if (table === 'expertise_categories') needAdmin(ctx);
    else if (table === 'lecturers') { if (!isAdmin && row.id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Forbidden.', 403); }
    else if (!isAdmin && row.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Forbidden.', 403);
    let { id: _i, lecturer_id, user_id, created_at, ...safe } = patch;
    if (table === 'documents') safe = { title: safe.title, doc_type: safe.doc_type }; // file body/metadata are immutable
    if (table === 'lecturers' && !isAdmin) delete safe.staff_id;
    if (safe.document_id) assertOwnsDoc(safe.document_id, row.lecturer_id);
    Object.assign(row, safe, { updated_at: nowIso() });
    write(table, rows);
    if (table === 'lecturers') {
      const users = read('users'); const u = users.find((x) => x.id === row.user_id);
      if (u) { u.full_name = row.full_name; u.email = row.email; u.department = row.department; write('users', users); }
      logActivity(row.id, 'Updated profile information');
    } else if (row.lecturer_id) logActivity(row.lecturer_id, 'Updated ' + ENTITIES[table].singular.toLowerCase() + ' information');
    return row;
  },

  async remove({ table, id }, ctx) {
    if (!['expertise_categories', ...OWNED].includes(table) || table === 'activity_log') throw new HttpError('Invalid table.');
    const rows = read(table);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new HttpError('Record not found.', 404);
    const isAdmin = ctx.user.role === 'admin';
    if (table === 'expertise_categories') {
      needAdmin(ctx);
      if (read('expertise').some((e) => e.category_id === id)) throw new HttpError('Category is in use by lecturer expertise records and cannot be deleted.', 409);
    } else if (!isAdmin && row.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Forbidden.', 403);
    write(table, rows.filter((r) => r.id !== id));
    if (table === 'documents') {
      await blobOp('readwrite', (s) => s.delete(id));
      // detach from any record that referenced it
      OWNED.forEach((t) => { if (t === 'documents' || t === 'activity_log') return; const rr = read(t); let ch = false; rr.forEach((x) => { if (x.document_id === id) { x.document_id = ''; ch = true; } }); if (ch) write(t, rr); });
    }
    if (row.lecturer_id) logActivity(row.lecturer_id, 'Removed ' + ENTITIES[table].singular.toLowerCase());
    return { id };
  },

  async upload({ lecturer_id, doc_type, title, file_name, mime, size, dataUrl }, ctx) {
    const isAdmin = ctx.user.role === 'admin';
    const lid = isAdmin ? lecturer_id : ctx.lecturer && ctx.lecturer.id;
    if (!lid) throw new HttpError('Lecturer required.');
    if (size > MAX_FILE_BYTES) throw new HttpError('File exceeds 5 MB.');
    if (!/^data:(application\/pdf|image\/(png|jpeg)|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))/.test(dataUrl)) throw new HttpError('Unsupported file type.');
    const row = { id: uid('doc'), lecturer_id: lid, doc_type, title: title || file_name, file_name, mime, size, created_at: nowIso(), updated_at: nowIso() };
    await blobOp('readwrite', (s) => s.put(dataUrl, row.id));
    const rows = read('documents'); rows.push(row); write('documents', rows);
    logActivity(lid, 'Uploaded document');
    return row;
  },

  async download({ id }, ctx) {
    const d = read('documents').find((x) => x.id === id);
    if (!d) throw new HttpError('Document not found.', 404);
    if (ctx.user.role !== 'admin' && d.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Forbidden.', 403);
    const dataUrl = await blobOp('readonly', (s) => s.get(id));
    return { file_name: d.file_name, mime: d.mime, dataUrl: dataUrl || '' };
  },

  // ---- accounts (admin) ----
  async createUser({ user }, ctx) {
    needAdmin(ctx);
    const { username, email, full_name, role, department, status, password } = user;
    if (!username || !email || !full_name || !password) throw new HttpError('Missing required fields.');
    if (password.length < 8) throw new HttpError('Password must be at least 8 characters.');
    const users = read('users');
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new HttpError('Username already taken.', 409);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new HttpError('Email already registered.', 409);
    const salt = uid('s');
    const u = { id: uid('usr'), username, email, full_name, role, department, status: status || 'Active', salt, password_hash: await hashPw(salt, password), last_login: '', created_at: nowIso(), updated_at: nowIso() };
    users.push(u); write('users', users);
    if (role === 'lecturer') {
      const lecs = read('lecturers');
      lecs.push({ id: uid('lec'), user_id: u.id, staff_id: 'UPNM' + String(lecs.length + 1).padStart(3, '0'), full_name, email, department, position: 'Lecturer', phone: '', location: '', bio: '', photo: '', created_at: nowIso(), updated_at: nowIso() });
      write('lecturers', lecs);
    }
    return safeUser(u);
  },
  async updateUser({ id, patch }, ctx) {
    needAdmin(ctx);
    const users = read('users'); const u = users.find((x) => x.id === id);
    if (!u) throw new HttpError('User not found.', 404);
    if (u.id === ctx.user.id && patch.status && patch.status !== 'Active') throw new HttpError('You cannot deactivate your own account.');
    if (patch.email && users.some((x) => x.id !== id && x.email.toLowerCase() === patch.email.toLowerCase())) throw new HttpError('Email already registered.', 409);
    ['full_name', 'email', 'department', 'status'].forEach((k) => { if (patch[k] !== undefined) u[k] = patch[k]; });
    u.updated_at = nowIso(); write('users', users);
    const lecs = read('lecturers'); const l = lecs.find((x) => x.user_id === id);
    if (l) { l.full_name = u.full_name; l.email = u.email; l.department = u.department; write('lecturers', lecs); }
    return safeUser(u);
  },
  async resetPassword({ id, password }, ctx) {
    needAdmin(ctx);
    if (!password || password.length < 8) throw new HttpError('Password must be at least 8 characters.');
    const users = read('users'); const u = users.find((x) => x.id === id);
    if (!u) throw new HttpError('User not found.', 404);
    u.salt = uid('s'); u.password_hash = await hashPw(u.salt, password); write('users', users);
    return true;
  },
  async changePassword({ current, password }, ctx) {
    if (!password || password.length < 8) throw new HttpError('Password must be at least 8 characters.');
    const users = read('users'); const u = users.find((x) => x.id === ctx.user.id);
    if ((await hashPw(u.salt, current)) !== u.password_hash) throw new HttpError('Current password is incorrect.');
    u.salt = uid('s'); u.password_hash = await hashPw(u.salt, password); write('users', users);
    return true;
  },
  async deleteUser({ id }, ctx) {
    needAdmin(ctx);
    if (id === ctx.user.id) throw new HttpError('You cannot delete your own account.');
    const lec = read('lecturers').find((l) => l.user_id === id);
    if (lec) {
      for (const d of read('documents').filter((x) => x.lecturer_id === lec.id)) await blobOp('readwrite', (s) => s.delete(d.id));
      OWNED.forEach((t) => write(t, read(t).filter((r) => r.lecturer_id !== lec.id)));
      write('lecturers', read('lecturers').filter((l) => l.id !== lec.id));
    }
    write('users', read('users').filter((u) => u.id !== id));
    return { id };
  },
  async resetDemo() {
    localStorage.removeItem('ftm:seeded'); localStorage.removeItem('ftm:sessions');
    await ensureSeed();
    return true;
  },
};

function assertOwnsDoc(docId, lecturerId) {
  const d = read('documents').find((x) => x.id === docId);
  if (!d || d.lecturer_id !== lecturerId) throw new HttpError('Invalid supporting document.');
}

export async function handle(action, payload, token) {
  await ensureSeed();
  const fn = actions[action];
  if (!fn) throw new HttpError('Unknown action: ' + action, 404);
  const open = ['login', 'resetDemo'];
  const ctx = open.includes(action) ? null : session(token);
  // small artificial latency keeps loading states honest during demo
  await new Promise((r) => setTimeout(r, 120));
  return fn(payload || {}, ctx, token);
}
