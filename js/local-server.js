// In-browser stand-in for the Apps Script backend (backend/Code.gs).
// Same actions, same rules (auth, ownership, referential integrity) so the UI cannot tell them apart.
import { TABLES, OWNED, ENTITIES, MAX_FILE_BYTES, ADMIN_WRITE, ACTION_ONLY, SERVICE_FIELDS } from './schema.js';
import { NEXT_GRADE, stepsFor } from './promotion/guideline.js';
import { allowedActs, nextStatus, ACTIVE_STATUSES, appealInfo } from './promotion/workflow.js';
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
  if (localStorage.getItem('ftm:seeded') === '6') return;
  const seed = await buildSeed(hashPw, { count: 100 });
  TABLES.forEach((t) => write(t, seed[t] || []));
  localStorage.setItem('ftm:seeded', '6');
}

function session(token) {
  const s = JSON.parse(localStorage.getItem('ftm:sessions') || '{}');
  const e = s[token];
  if (!e || e.exp < Date.now()) throw new HttpError('Sesi tamat. Sila log masuk semula.', 401);
  const user = read('users').find((u) => u.id === e.uid);
  if (!user || user.status !== 'Active') throw new HttpError('Akaun tidak aktif.', 401);
  const lecturer = read('lecturers').find((l) => l.user_id === user.id) || null;
  return { user, lecturer };
}

const safeUser = ({ password_hash, salt, ...u }) => u;
const needAdmin = (ctx) => { if (ctx.user.role !== 'admin') throw new HttpError('Untuk pentadbir sahaja.', 403); };

const S = (t) => (ENTITIES[t] ? ENTITIES[t].singular.toLowerCase() : t);
function logActivity(lecturer_id, message) {
  const rows = read('activity_log');
  rows.push({ id: uid('act'), lecturer_id, message, created_at: nowIso() });
  write('activity_log', rows.slice(-400));
}

const actions = {
  async login({ username, password }) {
    const u = read('users').find((x) => x.username.toLowerCase() === String(username).trim().toLowerCase() || x.email.toLowerCase() === String(username).trim().toLowerCase());
    if (!u || (await hashPw(u.salt, password)) !== u.password_hash) throw new HttpError('Nama pengguna atau kata laluan tidak sah.', 401);
    if (u.status !== 'Active') throw new HttpError('Akaun ini tidak aktif. Sila hubungi pentadbir.', 403);
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
    if (!['expertise_categories', ...OWNED].includes(table) || ['activity_log', 'documents', ...ACTION_ONLY].includes(table)) throw new HttpError('Jadual tidak sah.');
    const isAdmin = ctx.user.role === 'admin';
    if (table === 'expertise_categories' || ADMIN_WRITE.includes(table)) needAdmin(ctx);
    const r = { ...row, id: uid(table.slice(0, 3)), created_at: nowIso(), updated_at: nowIso() };
    if (OWNED.includes(table)) {
      r.lecturer_id = isAdmin ? row.lecturer_id : ctx.lecturer && ctx.lecturer.id;
      if (!r.lecturer_id || !read('lecturers').some((l) => l.id === r.lecturer_id)) throw new HttpError('Pensyarah diperlukan.');
      if (r.document_id) assertOwnsDoc(r.document_id, r.lecturer_id);
    }
    if (table === 'expertise_categories' && read(table).some((c) => c.name.toLowerCase() === String(r.name).toLowerCase())) throw new HttpError('Kategori sudah wujud.');
    const rows = read(table); rows.push(r); write(table, rows);
    if (r.lecturer_id) logActivity(r.lecturer_id, 'Menambah ' + S(table) + ' baharu');
    return r;
  },

  async update({ table, id, patch }, ctx) {
    if (!['lecturers', 'expertise_categories', ...OWNED].includes(table) || ['activity_log', ...ACTION_ONLY].includes(table)) throw new HttpError('Jadual tidak sah.');
    const rows = read(table);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new HttpError('Rekod tidak ditemui.', 404);
    const isAdmin = ctx.user.role === 'admin';
    if (table === 'expertise_categories' || ADMIN_WRITE.includes(table)) needAdmin(ctx);
    else if (table === 'lecturers') { if (!isAdmin && row.id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403); }
    else if (!isAdmin && row.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403);
    let { id: _i, lecturer_id, user_id, created_at, ...safe } = patch;
    if (table === 'documents') safe = { title: safe.title, doc_type: safe.doc_type }; // file body/metadata are immutable
    if (table === 'lecturers' && !isAdmin) { delete safe.staff_id; SERVICE_FIELDS.forEach((k) => delete safe[k]); } // maklumat perkhidmatan = data HR, pentadbir sahaja
    if (safe.document_id) assertOwnsDoc(safe.document_id, row.lecturer_id);
    Object.assign(row, safe, { updated_at: nowIso() });
    write(table, rows);
    if (table === 'lecturers') {
      const users = read('users'); const u = users.find((x) => x.id === row.user_id);
      if (u) { u.full_name = row.full_name; u.email = row.email; u.department = row.department; write('users', users); }
      logActivity(row.id, 'Mengemas kini maklumat profil');
    } else if (row.lecturer_id) logActivity(row.lecturer_id, 'Mengemas kini maklumat ' + S(table));
    return row;
  },

  async remove({ table, id }, ctx) {
    if (!['expertise_categories', ...OWNED].includes(table) || ['activity_log', ...ACTION_ONLY].includes(table)) throw new HttpError('Jadual tidak sah.');
    const rows = read(table);
    const row = rows.find((r) => r.id === id);
    if (!row) throw new HttpError('Rekod tidak ditemui.', 404);
    const isAdmin = ctx.user.role === 'admin';
    if (ADMIN_WRITE.includes(table)) needAdmin(ctx);
    if (table === 'expertise_categories') {
      needAdmin(ctx);
      if (read('expertise').some((e) => e.category_id === id)) throw new HttpError('Kategori ini sedang digunakan oleh rekod kepakaran pensyarah dan tidak boleh dipadam.', 409);
    } else if (!isAdmin && row.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403);
    write(table, rows.filter((r) => r.id !== id));
    if (table === 'documents') {
      await blobOp('readwrite', (s) => s.delete(id));
      // detach from any record that referenced it
      OWNED.forEach((t) => { if (t === 'documents' || t === 'activity_log') return; const rr = read(t); let ch = false; rr.forEach((x) => { if (x.document_id === id) { x.document_id = ''; ch = true; } }); if (ch) write(t, rr); });
    }
    if (row.lecturer_id) logActivity(row.lecturer_id, 'Memadam ' + S(table));
    return { id };
  },

  async upload({ lecturer_id, doc_type, title, file_name, mime, size, dataUrl }, ctx) {
    const isAdmin = ctx.user.role === 'admin';
    const lid = isAdmin ? lecturer_id : ctx.lecturer && ctx.lecturer.id;
    if (!lid) throw new HttpError('Pensyarah diperlukan.');
    if (size > MAX_FILE_BYTES) throw new HttpError('Fail melebihi 5 MB.');
    if (!/^data:(application\/pdf|image\/(png|jpeg)|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))/.test(dataUrl)) throw new HttpError('Jenis fail tidak disokong.');
    const row = { id: uid('doc'), lecturer_id: lid, doc_type, title: title || file_name, file_name, mime, size, created_at: nowIso(), updated_at: nowIso() };
    await blobOp('readwrite', (s) => s.put(dataUrl, row.id));
    const rows = read('documents'); rows.push(row); write('documents', rows);
    logActivity(lid, 'Memuat naik dokumen');
    return row;
  },

  async download({ id }, ctx) {
    const d = read('documents').find((x) => x.id === id);
    if (!d) throw new HttpError('Dokumen tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && d.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403);
    const dataUrl = await blobOp('readonly', (s) => s.get(id));
    return { file_name: d.file_name, mime: d.mime, dataUrl: dataUrl || '' };
  },


  // ---------- Kenaikan pangkat (aliran kerja disemak di pelayan; lihat js/promotion/workflow.js) ----------
  async promoSave(p, ctx) {
    const admin = ctx.user.role === 'admin';
    const lec = read('lecturers').find((l) => l.id === (admin ? p.lecturer_id || (p.id && (read('promotion_applications').find((a) => a.id === p.id) || {}).lecturer_id) : ctx.lecturer && ctx.lecturer.id));
    if (!lec) throw new HttpError('Pensyarah diperlukan.');
    const rows = read('promotion_applications');
    let app = p.id && rows.find((a) => a.id === p.id);
    if (app) { if (app.lecturer_id !== lec.id) throw new HttpError('Tidak dibenarkan.', 403); if (app.status !== 'draf') throw new HttpError('Permohonan hanya boleh dikemas kini semasa masih draf.', 409); }
    else {
      if (!lec.grade || !NEXT_GRADE[lec.grade]) throw new HttpError('Gred semasa belum ditetapkan atau sudah di gred tertinggi. Hubungi Pentadbir.', 409);
      if (rows.some((a) => a.lecturer_id === lec.id && ACTIVE_STATUSES.includes(a.status))) throw new HttpError('Anda sudah mempunyai permohonan yang sedang berjalan.', 409);
      app = { id: uid('prm'), lecturer_id: lec.id, from_grade: lec.grade, to_grade: NEXT_GRADE[lec.grade], field: lec.field || 'Sains & Teknologi', status: 'draf', step_since: nowIso(), submitted_at: '', decision_date: '', effective_date: '', qualifications: '', work_history: '', thesis_title: '', note_candidate: '', checks: '{}', appeal_reason: '', created_at: nowIso(), updated_at: nowIso() };
      rows.push(app);
    }
    ['qualifications', 'work_history', 'thesis_title', 'note_candidate'].forEach((k) => { if (p[k] !== undefined) app[k] = String(p[k]).slice(0, 4000); });
    app.updated_at = nowIso(); write('promotion_applications', rows);
    return app;
  },
  async promoSubmit({ id, ack }, ctx) {
    const rows = read('promotion_applications'); const app = rows.find((a) => a.id === id);
    if (!app) throw new HttpError('Permohonan tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403);
    if (app.status !== 'draf') throw new HttpError('Permohonan ini sudah dihantar.', 409);
    if (!ack) throw new HttpError('Sila tandakan pengakuan bahawa maklumat adalah benar.');
    app.status = 'fakulti'; app.submitted_at = nowIso(); app.step_since = nowIso(); app.updated_at = nowIso(); write('promotion_applications', rows);
    promoEvent(app, ctx.user.full_name, 'Calon', 'hantar', 'draf', 'fakulti', 'Permohonan dihantar kepada Fakulti.'); logActivity(app.lecturer_id, 'Menghantar permohonan kenaikan pangkat');
    return app;
  },
  async promoAct({ id, act, note, as, checks, effective }, ctx) {
    needAdmin(ctx);
    const rows = read('promotion_applications'); const app = rows.find((a) => a.id === id);
    if (!app) throw new HttpError('Permohonan tidak ditemui.', 404);
    let to; try { to = nextStatus(app.status, act, app.to_grade); } catch (e) { throw new HttpError(e.message, 409); }
    if (app.status === 'penilai' && act === 'lulus' && read('promotion_assessors').filter((x) => x.application_id === id && x.status === 'Laporan diterima').length < 3) throw new HttpError('Sekurang-kurangnya 3 laporan Penilai Luar diperlukan sebelum meneruskan.', 409);
    const from = app.status; const today = nowIso().slice(0, 10);
    const ck = JSON.parse(app.checks || '{}'); Object.entries(checks || {}).forEach(([k, v]) => { if (v) ck[`${from}.${k}`] = today; else delete ck[`${from}.${k}`]; }); app.checks = JSON.stringify(ck);
    app.status = to; app.step_since = nowIso(); app.updated_at = nowIso();
    if (['berjaya', 'tidak_berjaya', 'rayuan_berjaya', 'rayuan_ditolak', 'ditarik_balik'].includes(to)) app.decision_date = today;
    if (to === 'berjaya') app.effective_date = effective || today;
    write('promotion_applications', rows);
    promoEvent(app, ctx.user.full_name, String(as || 'Pentadbir').slice(0, 60), act, from, to, String(note || '').slice(0, 1000));
    logActivity(app.lecturer_id, to === 'berjaya' ? 'Permohonan kenaikan pangkat berjaya' : 'Status permohonan kenaikan pangkat dikemas kini');
    return app;
  },
  async promoAppeal({ id, reason }, ctx) {
    const rows = read('promotion_applications'); const app = rows.find((a) => a.id === id);
    if (!app) throw new HttpError('Permohonan tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw new HttpError('Tidak dibenarkan.', 403);
    const ai = appealInfo(app); if (!ai.can) throw new HttpError('Tempoh rayuan 30 hari telah tamat atau rayuan tidak dibenarkan bagi status ini.', 409);
    if (String(reason || '').trim().length < 20) throw new HttpError('Sila nyatakan alasan rayuan (sekurang-kurangnya 20 aksara).');
    app.status = 'rayuan'; app.appeal_reason = String(reason).slice(0, 2000); app.step_since = nowIso(); app.updated_at = nowIso(); write('promotion_applications', rows);
    promoEvent(app, ctx.user.full_name, 'Calon', 'rayuan', 'tidak_berjaya', 'rayuan', app.appeal_reason);
    return app;
  },
  async promoRemove({ id }, ctx) {
    const rows = read('promotion_applications'); const app = rows.find((a) => a.id === id);
    if (!app) throw new HttpError('Permohonan tidak ditemui.', 404);
    const admin = ctx.user.role === 'admin';
    if (!admin && (app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id) || app.status !== 'draf')) throw new HttpError('Hanya draf sendiri boleh dipadam.', 403);
    write('promotion_applications', rows.filter((a) => a.id !== id)); write('promotion_events', read('promotion_events').filter((e) => e.application_id !== id)); write('promotion_assessors', read('promotion_assessors').filter((x) => x.application_id !== id));
    return { id };
  },

  // ---- accounts (admin) ----
  async createUser({ user }, ctx) {
    needAdmin(ctx);
    const { username, email, full_name, role, department, status, password } = user;
    if (!username || !email || !full_name || !password) throw new HttpError('Medan wajib tidak lengkap.');
    if (password.length < 8) throw new HttpError('Kata laluan mestilah sekurang-kurangnya 8 aksara.');
    const users = read('users');
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new HttpError('Nama pengguna sudah digunakan.', 409);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new HttpError('E-mel sudah didaftarkan.', 409);
    const salt = uid('s');
    const u = { id: uid('usr'), username, email, full_name, role, department, status: status || 'Active', salt, password_hash: await hashPw(salt, password), last_login: '', created_at: nowIso(), updated_at: nowIso() };
    users.push(u); write('users', users);
    if (role === 'lecturer') {
      const lecs = read('lecturers');
      lecs.push({ id: uid('lec'), user_id: u.id, staff_id: 'UPNM' + String(lecs.length + 1).padStart(3, '0'), full_name, email, department, position: 'Pensyarah', phone: '', location: '', bio: '', photo: '', created_at: nowIso(), updated_at: nowIso() });
      write('lecturers', lecs);
    }
    return safeUser(u);
  },
  async updateUser({ id, patch }, ctx) {
    needAdmin(ctx);
    const users = read('users'); const u = users.find((x) => x.id === id);
    if (!u) throw new HttpError('Pengguna tidak ditemui.', 404);
    if (u.id === ctx.user.id && patch.status && patch.status !== 'Active') throw new HttpError('Anda tidak boleh menyahaktifkan akaun sendiri.');
    if (patch.email && users.some((x) => x.id !== id && x.email.toLowerCase() === patch.email.toLowerCase())) throw new HttpError('E-mel sudah didaftarkan.', 409);
    ['full_name', 'email', 'department', 'status'].forEach((k) => { if (patch[k] !== undefined) u[k] = patch[k]; });
    u.updated_at = nowIso(); write('users', users);
    const lecs = read('lecturers'); const l = lecs.find((x) => x.user_id === id);
    if (l) { l.full_name = u.full_name; l.email = u.email; l.department = u.department; write('lecturers', lecs); }
    return safeUser(u);
  },
  async resetPassword({ id, password }, ctx) {
    needAdmin(ctx);
    if (!password || password.length < 8) throw new HttpError('Kata laluan mestilah sekurang-kurangnya 8 aksara.');
    const users = read('users'); const u = users.find((x) => x.id === id);
    if (!u) throw new HttpError('Pengguna tidak ditemui.', 404);
    u.salt = uid('s'); u.password_hash = await hashPw(u.salt, password); write('users', users);
    return true;
  },
  async changePassword({ current, password }, ctx) {
    if (!password || password.length < 8) throw new HttpError('Kata laluan mestilah sekurang-kurangnya 8 aksara.');
    const users = read('users'); const u = users.find((x) => x.id === ctx.user.id);
    if ((await hashPw(u.salt, current)) !== u.password_hash) throw new HttpError('Kata laluan semasa tidak betul.');
    u.salt = uid('s'); u.password_hash = await hashPw(u.salt, password); write('users', users);
    return true;
  },
  async deleteUser({ id }, ctx) {
    needAdmin(ctx);
    if (id === ctx.user.id) throw new HttpError('Anda tidak boleh memadam akaun sendiri.');
    const lec = read('lecturers').find((l) => l.user_id === id);
    if (lec) {
      for (const d of read('documents').filter((x) => x.lecturer_id === lec.id)) await blobOp('readwrite', (s) => s.delete(d.id));
      OWNED.forEach((t) => write(t, read(t).filter((r) => r.lecturer_id !== lec.id)));
      write('lecturers', read('lecturers').filter((l) => l.id !== lec.id));
    }
    write('users', read('users').filter((u) => u.id !== id));
    return { id };
  },
  async bulkImport({ tables }, ctx) {
    needAdmin(ctx); const out = {};
    for (const [t, rows] of Object.entries(tables)) {
      if (!TABLES.includes(t)) throw new HttpError('Jadual tidak diketahui: ' + t);
      rows.forEach((r) => { if (!String(r.id).startsWith('demo_')) throw new HttpError('Import pukal hanya menerima id demo_.'); if (t === 'users' && r.role !== 'lecturer') throw new HttpError('Import pukal tidak boleh mencipta pentadbir.'); });
      const have = new Set(read(t).map((r) => r.id)); const fresh = rows.filter((r) => !have.has(r.id));
      write(t, [...read(t), ...fresh]); out[t] = fresh.length;
    }
    return out;
  },
  async clearDemo(_p, ctx) {
    needAdmin(ctx); const out = {};
    for (const t of TABLES) { const rows = read(t); const keep = rows.filter((r) => !String(r.id).startsWith('demo_') && !String(r.lecturer_id || '').startsWith('demo_')); out[t] = rows.length - keep.length; write(t, keep); }
    return out;
  },
  async resetDemo() {
    localStorage.removeItem('ftm:seeded'); localStorage.removeItem('ftm:sessions');
    await ensureSeed();
    return true;
  },
};

function promoEvent(app, actor, role, action, from, to, note) {
  const rows = read('promotion_events');
  rows.push({ id: uid('pev'), application_id: app.id, lecturer_id: app.lecturer_id, at: nowIso(), actor, actor_role: role, action, from_status: from, to_status: to, note });
  write('promotion_events', rows);
}
function assertOwnsDoc(docId, lecturerId) {
  const d = read('documents').find((x) => x.id === docId);
  if (!d || d.lecturer_id !== lecturerId) throw new HttpError('Dokumen sokongan tidak sah.');
}

export async function handle(action, payload, token) {
  await ensureSeed();
  const fn = actions[action];
  if (!fn) throw new HttpError('Tindakan tidak diketahui: ' + action, 404);
  const open = ['login', 'resetDemo'];
  const ctx = open.includes(action) ? null : session(token);
  // small artificial latency keeps loading states honest during demo
  await new Promise((r) => setTimeout(r, 120));
  return fn(payload || {}, ctx, token);
}
