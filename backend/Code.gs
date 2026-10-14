/**
 * FSTP Talent Map — Google Apps Script backend (Google Sheets as the database).
 * Mirrors js/local-server.js action-for-action, so the web UI works unchanged.
 *
 * ONE-TIME SETUP: paste this file into the Apps Script project, select `setup`, press Run,
 * approve permissions, then Deploy > Manage deployments > edit > New version.
 * Full steps: backend/README.md
 */

var SPREADSHEET_ID = '1LFZkj30JrlinLjcabWfZ-yEcO08EVwcDt2MPR0prRF0';
var DRIVE_FOLDER_NAME = 'FSTP_Talent_Map_Files';
var SESSION_SECONDS = 6 * 3600;          // CacheService maximum is 6 hours
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var MAX_CELL_CHARS = 45000;              // a Sheets cell holds 50,000 characters

// ---------- schema: one sheet per table; column names == SQL column names ----------
var T = {
  users:                ['id', 'username', 'email', 'full_name', 'role', 'department', 'status', 'salt', 'password_hash', 'last_login', 'created_at', 'updated_at'],
  lecturers:            ['id', 'user_id', 'staff_id', 'full_name', 'email', 'department', 'position', 'phone', 'location', 'bio', 'photo', 'created_at', 'updated_at', 'grade', 'grade_since', 'appointed_on', 'confirmed_on', 'vk7_since', 'field', 'has_phd', 'has_prof_qual', 'employment', 'syarahan_perdana', 'monograf', 'scopus_h_index'],
  expertise_categories: ['id', 'name', 'color', 'description', 'created_at', 'updated_at'],
  expertise:            ['id', 'lecturer_id', 'category_id', 'area', 'level', 'years', 'interest', 'document_id', 'created_at', 'updated_at'],
  research:             ['id', 'lecturer_id', 'title', 'area', 'category', 'year', 'status', 'description', 'document_id', 'created_at', 'updated_at', 'role', 'grant_source', 'amount', 'registered_ppi'],
  publications:         ['id', 'lecturer_id', 'title', 'type', 'venue', 'year', 'status', 'doi', 'document_id', 'created_at', 'updated_at', 'indexing', 'author_role'],
  certifications:       ['id', 'lecturer_id', 'name', 'issuer', 'issue_date', 'expiry_date', 'cert_no', 'document_id', 'created_at', 'updated_at'],
  training:             ['id', 'lecturer_id', 'name', 'organizer', 'date', 'status', 'duration_days', 'description', 'document_id', 'created_at', 'updated_at'],
  consultancy:          ['id', 'lecturer_id', 'project', 'client', 'role', 'year', 'status', 'description', 'document_id', 'created_at', 'updated_at', 'amount', 'kind', 'registered_ppi'],
  achievements:         ['id', 'lecturer_id', 'name', 'category', 'year', 'description', 'document_id', 'created_at', 'updated_at'],
  documents:            ['id', 'lecturer_id', 'doc_type', 'title', 'file_name', 'mime', 'size', 'file_ref', 'created_at', 'updated_at'],
  activity_log:         ['id', 'lecturer_id', 'message', 'created_at'],
  // Modul kenaikan pangkat
  activities:           ['id', 'lecturer_id', 'kind', 'title', 'year', 'level', 'role', 'student', 'graduated', 'semester', 'workload_met', 'blended', 'score', 'terms', 'document_id', 'created_at', 'updated_at'],
  lppt_scores:          ['id', 'lecturer_id', 'year', 'score', 'created_at', 'updated_at'],
  disciplinary:         ['id', 'lecturer_id', 'case_no', 'penalty', 'date', 'note', 'created_at', 'updated_at'],
  promotion_applications: ['id', 'lecturer_id', 'from_grade', 'to_grade', 'field', 'status', 'step_since', 'submitted_at', 'decision_date', 'effective_date', 'qualifications', 'work_history', 'thesis_title', 'note_candidate', 'checks', 'appeal_reason', 'created_at', 'updated_at'],
  promotion_events:     ['id', 'application_id', 'lecturer_id', 'at', 'actor', 'actor_role', 'action', 'from_status', 'to_status', 'note'],
  promotion_assessors:  ['id', 'application_id', 'lecturer_id', 'name', 'institution', 'country', 'position', 'h_index', 'checks', 'status', 'recommendation', 'report_note', 'created_at', 'updated_at']
};
var OWNED = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log', 'activities', 'lppt_scores', 'disciplinary', 'promotion_applications', 'promotion_events', 'promotion_assessors'];
var ADMIN_WRITE = ['lppt_scores', 'disciplinary', 'promotion_assessors'];               // hanya pentadbir boleh menulis
var ACTION_ONLY = ['promotion_applications', 'promotion_events'];                         // tiada CRUD generik: hanya melalui tindakan promo*
var SERVICE_FIELDS = ['grade', 'grade_since', 'appointed_on', 'confirmed_on', 'vk7_since', 'field', 'has_phd', 'has_prof_qual', 'employment', 'syarahan_perdana', 'monograf']; // data HR: pentadbir sahaja
var NEXT_GRADE = { DS11: 'DS13', DS13: 'DS14', DS14: 'VK7', VK7: 'VK6', VK6: 'VK5' };
var ACTIVE_STATUSES = ['draf', 'fakulti', 'pendaftar', 'saringan', 'penilai', 'pemilih', 'lpu', 'syarahan', 'rayuan'];
var FINAL_NEXT = { kembali: 'draf', gagal: 'tidak_berjaya', rayuan_berjaya: 'rayuan_berjaya', rayuan_tolak: 'rayuan_ditolak', tarik_balik: 'ditarik_balik' };
var ALLOWED_ACTS = { fakulti: ['lulus', 'kembali', 'gagal'], pendaftar: ['lulus', 'kembali', 'gagal'], saringan: ['lulus', 'gagal'], penilai: ['lulus'], pemilih: ['lulus', 'gagal'], lpu: ['lulus', 'gagal'], syarahan: ['lulus'], rayuan: ['rayuan_berjaya', 'rayuan_tolak'], berjaya: ['tarik_balik'] };
var APPEAL_DAYS = 30;
var SINGULAR = { expertise: 'kepakaran', research: 'penyelidikan', publications: 'penerbitan', certifications: 'pensijilan', training: 'latihan', consultancy: 'konsultansi', achievements: 'pencapaian', documents: 'dokumen', activities: 'aktiviti', lppt_scores: 'markah LPPT', disciplinary: 'hukuman tatatertib', promotion_assessors: 'penilai luar' };
var NUMERIC = { years: 1, year: 1, duration_days: 1, size: 1, amount: 1, score: 1, terms: 1, h_index: 1, scopus_h_index: 1 };
var DEFAULT_CATEGORIES = [
  ['Keselamatan Siber', '#1d5fd1'], ['Kecerdasan Buatan', '#7c3aed'], ['Rangkaian', '#0891b2'], ['Pangkalan Data', '#16a34a'],
  ['Forensik Digital', '#e11d48'], ['Kejuruteraan Perisian', '#ea580c'], ['Keselamatan Maklumat', '#0f766e'], ['Sains Data', '#ca8a04'],
  ['Internet Benda (IoT)', '#4f46e5'], ['Matematik & Pemodelan', '#be185d'], ['Teknologi Pertahanan', '#475569'], ['Lain-lain', '#64748b']
];
// Pemetaan nama lama (Inggeris) -> Bahasa Malaysia, digunakan oleh terjemahDataKeBM() untuk pangkalan data sedia ada.
var CATEGORY_MS = { 'Cybersecurity': 'Keselamatan Siber', 'Artificial Intelligence': 'Kecerdasan Buatan', 'Networking': 'Rangkaian', 'Database': 'Pangkalan Data', 'Digital Forensics': 'Forensik Digital', 'Software Engineering': 'Kejuruteraan Perisian', 'Information Security': 'Keselamatan Maklumat', 'Data Science': 'Sains Data', 'Internet of Things': 'Internet Benda (IoT)', 'Mathematics & Modelling': 'Matematik & Pemodelan', 'Defence Technology': 'Teknologi Pertahanan', 'Others': 'Lain-lain' };

// =====================================================================
// SETUP (run manually from the editor)
// =====================================================================

/** Creates every table (sheet) with headers, locks columns to plain text, seeds categories + the admin account. */
function setup() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(T).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var cols = T[name];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#0b2a5b').setFontColor('#ffffff');
    // Plain-text format stops Sheets turning "2026-10-13" into a Date and "UPNM001" into anything clever.
    sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@');
    NUMERIC && cols.forEach(function (c, i) { if (NUMERIC[c]) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('0'); });
    sh.setFrozenRows(1);
    if (name === 'users') sh.hideColumns(8, 2);          // salt + password_hash: hide from casual viewers
  });
  var blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);

  if (!rows_('expertise_categories').length) {
    DEFAULT_CATEGORIES.forEach(function (c) { insert_('expertise_categories', { id: uid_('cat'), name: c[0], color: c[1], description: c[0] + ' dan topik berkaitan.', created_at: now_(), updated_at: now_() }); });
  }
  if (!rows_('users').length) {
    var salt = uid_('s');
    insert_('users', { id: 'usr_admin', username: 'admin', email: 'admin@fstp.upnm.edu.my', full_name: 'Pentadbir Fakulti', role: 'admin', department: 'Pejabat Fakulti', status: 'Active', salt: salt, password_hash: hash_(salt, 'admin'), last_login: '', created_at: now_(), updated_at: now_() });
  }
  folder_();                                              // creates the Drive folder for uploads
  Logger.log('Persediaan selesai. Log masuk sebagai admin / admin dan tukar kata laluan dengan segera.');
}

/**
 * Jalankan SEKALI jika pangkalan data dibuat sebelum versi Bahasa Malaysia:
 * menukar nama kategori kepakaran asal (Inggeris) dan akaun pentadbir kepada Bahasa Malaysia.
 * Data contoh lama (rekod berbahasa Inggeris) perlu dibuang dan dimuatkan semula daripada Akaun > Data contoh.
 */
function terjemahDataKeBM() {
  rows_('expertise_categories').forEach(function (c) {
    if (CATEGORY_MS[c.name]) update_('expertise_categories', c.id, { name: CATEGORY_MS[c.name], description: CATEGORY_MS[c.name] + ' dan topik berkaitan.', updated_at: now_() });
  });
  var a = find_('users', 'usr_admin');
  if (a) update_('users', 'usr_admin', { full_name: 'Pentadbir Fakulti', department: 'Pejabat Fakulti', updated_at: now_() });
  Logger.log('Selesai: kategori dan akaun pentadbir telah diterjemah ke Bahasa Malaysia.');
}

/** Sets the admin account password to 'admin' (first-phase default). Run by hand if setup() ran earlier with another password. */
function resetAdminPassword() {
  var salt = uid_('s');
  update_('users', 'usr_admin', { salt: salt, password_hash: hash_(salt, 'admin'), status: 'Active', updated_at: now_() });
  Logger.log('Kata laluan admin kini: admin');
}

/** Wipes ALL data rows (keeps headers). Run by hand only. */
function resetAllData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(T).forEach(function (n) { var sh = ss.getSheetByName(n); if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1); });
  setup();
}

// =====================================================================
// HTTP entry points
// =====================================================================

function doGet() { return json_({ ok: true, data: { service: 'FSTP Talent Map API', status: 'running', tables: Object.keys(T) } }); }

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    var fn = ACTIONS[req.action];
    if (!fn) throw httpErr_('Tindakan tidak diketahui: ' + req.action, 404);
    var ctx = (req.action === 'login') ? null : session_(req.token);
    var write = WRITES[req.action];
    var lock = write ? LockService.getScriptLock() : null;
    if (lock) lock.waitLock(20000);
    try { out = { ok: true, data: fn(req.payload || {}, ctx, req.token) }; } finally { if (lock) lock.releaseLock(); }
  } catch (err) {
    out = { ok: false, error: err.publicMessage || 'Ralat pelayan. Sila cuba lagi.', code: err.code || 500 };
    if (!err.publicMessage) console.error(err && err.stack || err);
  }
  return json_(out);
}

var WRITES = { promoSave: 1, promoSubmit: 1, promoAct: 1, promoAppeal: 1, promoRemove: 1, bulkImport: 1, clearDemo: 1, create: 1, update: 1, remove: 1, upload: 1, createUser: 1, updateUser: 1, resetPassword: 1, changePassword: 1, deleteUser: 1 };

// =====================================================================
// Actions (same contract as js/local-server.js)
// =====================================================================

var ACTIONS = {
  login: function (p) {
    var key = String(p.username || '').trim().toLowerCase();
    var u = rows_('users').filter(function (x) { return String(x.username).toLowerCase() === key || String(x.email).toLowerCase() === key; })[0];
    if (!u || hash_(u.salt, String(p.password || '')) !== u.password_hash) throw httpErr_('Nama pengguna atau kata laluan tidak sah.', 401);
    if (u.status !== 'Active') throw httpErr_('Akaun ini tidak aktif. Sila hubungi pentadbir.', 403);
    var token = Utilities.getUuid() + Utilities.getUuid();
    CacheService.getScriptCache().put('tok:' + token, u.id, SESSION_SECONDS);
    update_('users', u.id, { last_login: now_() });
    return { token: token, user: safeUser_(u) };
  },
  logout: function (p, ctx, token) { CacheService.getScriptCache().remove('tok:' + token); return true; },
  me: function (p, ctx) { return { user: safeUser_(ctx.user) }; },

  snapshot: function (p, ctx) {
    var admin = ctx.user.role === 'admin', lid = ctx.lecturer && ctx.lecturer.id, out = {};
    out.users = admin ? rows_('users').map(safeUser_) : [safeUser_(ctx.user)];
    out.lecturers = admin ? rows_('lecturers') : rows_('lecturers').filter(function (l) { return l.id === lid; });
    out.expertise_categories = rows_('expertise_categories');
    OWNED.forEach(function (t) { out[t] = admin ? rows_(t) : rows_(t).filter(function (r) { return r.lecturer_id === lid; }); });
    return out;
  },

  create: function (p, ctx) {
    var table = p.table, row = p.row || {};
    if (table !== 'expertise_categories' && (OWNED.indexOf(table) < 0 || ['activity_log', 'documents'].concat(ACTION_ONLY).indexOf(table) >= 0)) throw httpErr_('Jadual tidak sah.', 400);
    var admin = ctx.user.role === 'admin';
    if (table === 'expertise_categories' || ADMIN_WRITE.indexOf(table) >= 0) needAdmin_(ctx);
    var r = clean_(table, row); r.id = uid_(table.slice(0, 3)); r.created_at = now_(); r.updated_at = now_();
    if (OWNED.indexOf(table) >= 0) {
      r.lecturer_id = admin ? row.lecturer_id : (ctx.lecturer && ctx.lecturer.id);
      if (!r.lecturer_id || !find_('lecturers', r.lecturer_id)) throw httpErr_('Pensyarah diperlukan.', 400);
      if (r.document_id) assertOwnsDoc_(r.document_id, r.lecturer_id);
    } else if (rows_(table).some(function (c) { return String(c.name).toLowerCase() === String(r.name).toLowerCase(); })) throw httpErr_('Kategori sudah wujud.', 409);
    insert_(table, r);
    if (r.lecturer_id) log_(r.lecturer_id, 'Menambah ' + SINGULAR[table] + ' baharu');
    return r;
  },

  update: function (p, ctx) {
    var table = p.table;
    if (table !== 'lecturers' && table !== 'expertise_categories' && (OWNED.indexOf(table) < 0 || ['activity_log'].concat(ACTION_ONLY).indexOf(table) >= 0)) throw httpErr_('Jadual tidak sah.', 400);
    var row = find_(table, p.id); if (!row) throw httpErr_('Rekod tidak ditemui.', 404);
    var admin = ctx.user.role === 'admin', mine = ctx.lecturer && ctx.lecturer.id;
    if (table === 'expertise_categories' || ADMIN_WRITE.indexOf(table) >= 0) needAdmin_(ctx);
    else if (table === 'lecturers') { if (!admin && row.id !== mine) throw httpErr_('Tidak dibenarkan.', 403); }
    else if (!admin && row.lecturer_id !== mine) throw httpErr_('Tidak dibenarkan.', 403);
    var patch = clean_(table, p.patch || {});
    ['id', 'lecturer_id', 'user_id', 'created_at'].forEach(function (k) { delete patch[k]; });
    if (table === 'lecturers' && !admin) { delete patch.staff_id; SERVICE_FIELDS.forEach(function (k) { delete patch[k]; }); }
    if (table === 'documents') patch = { title: patch.title, doc_type: patch.doc_type };
    if (patch.document_id) assertOwnsDoc_(patch.document_id, row.lecturer_id);
    patch.updated_at = now_();
    var saved = update_(table, p.id, patch);
    if (table === 'lecturers') {
      update_('users', saved.user_id, { full_name: saved.full_name, email: saved.email, department: saved.department });
      log_(saved.id, 'Mengemas kini maklumat profil');
    } else if (saved.lecturer_id) log_(saved.lecturer_id, 'Mengemas kini maklumat ' + SINGULAR[table]);
    return saved;
  },

  remove: function (p, ctx) {
    var table = p.table;
    if (table !== 'expertise_categories' && (OWNED.indexOf(table) < 0 || ['activity_log'].concat(ACTION_ONLY).indexOf(table) >= 0)) throw httpErr_('Jadual tidak sah.', 400);
    var row = find_(table, p.id); if (!row) throw httpErr_('Rekod tidak ditemui.', 404);
    var admin = ctx.user.role === 'admin';
    if (ADMIN_WRITE.indexOf(table) >= 0) needAdmin_(ctx);
    if (table === 'expertise_categories') {
      needAdmin_(ctx);
      if (rows_('expertise').some(function (e) { return e.category_id === p.id; })) throw httpErr_('Kategori ini sedang digunakan oleh rekod kepakaran pensyarah dan tidak boleh dipadam.', 409);
    } else if (!admin && row.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw httpErr_('Tidak dibenarkan.', 403);
    if (table === 'documents') {
      trashFile_(row.file_ref);
      OWNED.forEach(function (t) { if (t === 'documents' || t === 'activity_log') return; rows_(t).forEach(function (x) { if (x.document_id === p.id) update_(t, x.id, { document_id: '' }); }); });
    }
    delete_(table, p.id);
    if (row.lecturer_id) log_(row.lecturer_id, 'Memadam ' + SINGULAR[table]);
    return { id: p.id };
  },

  upload: function (p, ctx) {
    var admin = ctx.user.role === 'admin', lid = admin ? p.lecturer_id : (ctx.lecturer && ctx.lecturer.id);
    if (!lid || !find_('lecturers', lid)) throw httpErr_('Pensyarah diperlukan.', 400);
    if (Number(p.size) > MAX_FILE_BYTES) throw httpErr_('Fail melebihi 5 MB.', 400);
    var m = /^data:([\w\/+.\-]+);base64,(.+)$/.exec(String(p.dataUrl || ''));
    var okMime = /^(application\/pdf|image\/png|image\/jpeg|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;
    if (!m || !okMime.test(m[1])) throw httpErr_('Jenis fail tidak disokong.', 400);
    var bytes = Utilities.base64Decode(m[2]);
    if (bytes.length > MAX_FILE_BYTES) throw httpErr_('Fail melebihi 5 MB.', 400);
    var safeName = String(p.file_name || 'file').replace(/[^\w.\- ]/g, '_').slice(0, 120);
    var file = folder_().createFile(Utilities.newBlob(bytes, m[1], lid + '_' + Date.now() + '_' + safeName));
    var row = { id: uid_('doc'), lecturer_id: lid, doc_type: String(p.doc_type || 'Other'), title: String(p.title || safeName), file_name: safeName, mime: m[1], size: bytes.length, file_ref: file.getId(), created_at: now_(), updated_at: now_() };
    insert_('documents', row); log_(lid, 'Memuat naik dokumen');
    delete row.file_ref;               // never expose Drive ids to the browser
    return row;
  },

  download: function (p, ctx) {
    var d = find_('documents', p.id); if (!d) throw httpErr_('Dokumen tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && d.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw httpErr_('Tidak dibenarkan.', 403);
    var blob = DriveApp.getFileById(d.file_ref).getBlob();
    return { file_name: d.file_name, mime: d.mime, dataUrl: 'data:' + d.mime + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
  },

  /** Admin-only one-shot import of sample rows. Every id must start with 'demo_' so clearDemo can remove exactly these. */
  bulkImport: function (p, ctx) {
    needAdmin_(ctx);
    var tables = p.tables || {}, out = {};
    Object.keys(tables).forEach(function (t) {
      if (!T[t]) throw httpErr_('Jadual tidak diketahui: ' + t, 400);
      tables[t].forEach(function (r) {
        if (String(r.id).indexOf('demo_') !== 0) throw httpErr_('Import pukal hanya menerima id demo_.', 400);
        if (t === 'users' && r.role !== 'lecturer') throw httpErr_('Import pukal tidak boleh mencipta pentadbir.', 400);
      });
    });
    Object.keys(tables).forEach(function (t) {
      var rows = tables[t]; if (!rows.length) return;
      var existing = {}; rows_(t).forEach(function (r) { existing[r.id] = 1; });
      var fresh = rows.filter(function (r) { return !existing[r.id]; });          // idempotent: re-running adds nothing twice
      if (!fresh.length) { out[t] = 0; return; }
      var sh = sheet_(t), data = fresh.map(function (r) { return toArr_(t, r); });
      sh.getRange(sh.getLastRow() + 1, 1, data.length, T[t].length).setValues(data);
      out[t] = data.length;
    });
    return out;
  },

  /** Admin-only: removes every row created by bulkImport (ids / lecturer_ids starting 'demo_'). Real data is untouched. */
  clearDemo: function (p, ctx) {
    needAdmin_(ctx);
    var out = {};
    Object.keys(T).forEach(function (t) {
      var sh = sheet_(t), last = sh.getLastRow(); if (last < 2) { out[t] = 0; return; }
      var cols = T[t], range = sh.getRange(2, 1, last - 1, cols.length), vals = range.getValues();
      var li = cols.indexOf('lecturer_id'), isDemo = function (v) { return String(v[0]).indexOf('demo_') === 0 || (li >= 0 && String(v[li]).indexOf('demo_') === 0); };
      var keep = vals.filter(function (v) { return !isDemo(v); });
      out[t] = vals.length - keep.length;
      if (!out[t]) return;
      range.clearContent();
      if (keep.length) sh.getRange(2, 1, keep.length, cols.length).setValues(keep);
    });
    return out;
  },

  // ---------- Kenaikan pangkat (aliran kerja; ikut js/promotion/workflow.js) ----------
  promoSave: function (p, ctx) {
    var admin = ctx.user.role === 'admin', app = p.id ? find_('promotion_applications', p.id) : null;
    var lec = find_('lecturers', admin ? (p.lecturer_id || (app && app.lecturer_id)) : (ctx.lecturer && ctx.lecturer.id));
    if (!lec) throw httpErr_('Pensyarah diperlukan.', 400);
    if (app) {
      if (app.lecturer_id !== lec.id) throw httpErr_('Tidak dibenarkan.', 403);
      if (app.status !== 'draf') throw httpErr_('Permohonan hanya boleh dikemas kini semasa masih draf.', 409);
    } else {
      if (!lec.grade || !NEXT_GRADE[lec.grade]) throw httpErr_('Gred semasa belum ditetapkan atau sudah di gred tertinggi. Hubungi Pentadbir.', 409);
      if (rows_('promotion_applications').some(function (a) { return a.lecturer_id === lec.id && ACTIVE_STATUSES.indexOf(a.status) >= 0; })) throw httpErr_('Anda sudah mempunyai permohonan yang sedang berjalan.', 409);
      app = { id: uid_('prm'), lecturer_id: lec.id, from_grade: lec.grade, to_grade: NEXT_GRADE[lec.grade], field: lec.field || 'Sains & Teknologi', status: 'draf', step_since: now_(), submitted_at: '', decision_date: '', effective_date: '', qualifications: '', work_history: '', thesis_title: '', note_candidate: '', checks: '{}', appeal_reason: '', created_at: now_(), updated_at: now_() };
      insert_('promotion_applications', app);
    }
    var patch = { updated_at: now_() };
    ['qualifications', 'work_history', 'thesis_title', 'note_candidate'].forEach(function (k) { if (p[k] !== undefined) patch[k] = String(p[k]).slice(0, 4000); });
    return update_('promotion_applications', app.id, patch);
  },
  promoSubmit: function (p, ctx) {
    var app = find_('promotion_applications', p.id); if (!app) throw httpErr_('Permohonan tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw httpErr_('Tidak dibenarkan.', 403);
    if (app.status !== 'draf') throw httpErr_('Permohonan ini sudah dihantar.', 409);
    if (!p.ack) throw httpErr_('Sila tandakan pengakuan bahawa maklumat adalah benar.', 400);
    var saved = update_('promotion_applications', app.id, { status: 'fakulti', submitted_at: now_(), step_since: now_(), updated_at: now_() });
    promoEvent_(app, ctx.user.full_name, 'Calon', 'hantar', 'draf', 'fakulti', 'Permohonan dihantar kepada Fakulti.'); log_(app.lecturer_id, 'Menghantar permohonan kenaikan pangkat');
    return saved;
  },
  promoAct: function (p, ctx) {
    needAdmin_(ctx);
    var app = find_('promotion_applications', p.id); if (!app) throw httpErr_('Permohonan tidak ditemui.', 404);
    var allowed = (ALLOWED_ACTS[app.status] || []).filter(function (a) { return !(app.status === 'lpu' && a === 'gagal' && ['VK7', 'VK6', 'VK5'].indexOf(app.to_grade) < 0); });
    if (allowed.indexOf(p.act) < 0) throw httpErr_('Tindakan tidak dibenarkan pada langkah ini.', 409);
    var to = p.act === 'lulus' ? nextStatus_(app.to_grade, app.status) : FINAL_NEXT[p.act];
    if (app.status === 'penilai' && p.act === 'lulus' && rows_('promotion_assessors').filter(function (x) { return x.application_id === app.id && x.status === 'Laporan diterima'; }).length < 3) throw httpErr_('Sekurang-kurangnya 3 laporan Penilai Luar diperlukan sebelum meneruskan.', 409);
    var from = app.status, today = now_().slice(0, 10), ck = {};
    try { ck = JSON.parse(app.checks || '{}'); } catch (e) { ck = {}; }
    Object.keys(p.checks || {}).forEach(function (k) { if (p.checks[k]) ck[from + '.' + k] = today; else delete ck[from + '.' + k]; });
    var patch = { status: to, step_since: now_(), updated_at: now_(), checks: JSON.stringify(ck) };
    if (['berjaya', 'tidak_berjaya', 'rayuan_berjaya', 'rayuan_ditolak', 'ditarik_balik'].indexOf(to) >= 0) patch.decision_date = today;
    if (to === 'berjaya') patch.effective_date = p.effective || today;
    var saved = update_('promotion_applications', app.id, patch);
    promoEvent_(app, ctx.user.full_name, String(p.as || 'Pentadbir').slice(0, 60), p.act, from, to, String(p.note || '').slice(0, 1000));
    log_(app.lecturer_id, to === 'berjaya' ? 'Permohonan kenaikan pangkat berjaya' : 'Status permohonan kenaikan pangkat dikemas kini');
    return saved;
  },
  promoAppeal: function (p, ctx) {
    var app = find_('promotion_applications', p.id); if (!app) throw httpErr_('Permohonan tidak ditemui.', 404);
    if (ctx.user.role !== 'admin' && app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id)) throw httpErr_('Tidak dibenarkan.', 403);
    var days = app.decision_date ? (new Date().getTime() - new Date(app.decision_date).getTime()) / 864e5 : 999;
    if (app.status !== 'tidak_berjaya' || days > APPEAL_DAYS) throw httpErr_('Tempoh rayuan 30 hari telah tamat atau rayuan tidak dibenarkan bagi status ini.', 409);
    if (String(p.reason || '').trim().length < 20) throw httpErr_('Sila nyatakan alasan rayuan (sekurang-kurangnya 20 aksara).', 400);
    var saved = update_('promotion_applications', app.id, { status: 'rayuan', appeal_reason: String(p.reason).slice(0, 2000), step_since: now_(), updated_at: now_() });
    promoEvent_(app, ctx.user.full_name, 'Calon', 'rayuan', 'tidak_berjaya', 'rayuan', String(p.reason).slice(0, 2000));
    return saved;
  },
  promoRemove: function (p, ctx) {
    var app = find_('promotion_applications', p.id); if (!app) throw httpErr_('Permohonan tidak ditemui.', 404);
    var admin = ctx.user.role === 'admin';
    if (!admin && (app.lecturer_id !== (ctx.lecturer && ctx.lecturer.id) || app.status !== 'draf')) throw httpErr_('Hanya draf sendiri boleh dipadam.', 403);
    deleteWhere_('promotion_events', 'application_id', app.id); deleteWhere_('promotion_assessors', 'application_id', app.id); delete_('promotion_applications', app.id);
    return { id: p.id };
  },

  createUser: function (p, ctx) {
    needAdmin_(ctx);
    var u = p.user || {};
    if (!u.username || !u.email || !u.full_name || !u.password) throw httpErr_('Medan wajib tidak lengkap.', 400);
    if (String(u.password).length < 8) throw httpErr_('Kata laluan mestilah sekurang-kurangnya 8 aksara.', 400);
    var all = rows_('users');
    if (all.some(function (x) { return String(x.username).toLowerCase() === String(u.username).toLowerCase(); })) throw httpErr_('Nama pengguna sudah digunakan.', 409);
    if (all.some(function (x) { return String(x.email).toLowerCase() === String(u.email).toLowerCase(); })) throw httpErr_('E-mel sudah didaftarkan.', 409);
    var role = u.role === 'admin' ? 'admin' : 'lecturer', salt = uid_('s');
    var row = { id: uid_('usr'), username: u.username, email: u.email, full_name: u.full_name, role: role, department: u.department || '', status: u.status || 'Active', salt: salt, password_hash: hash_(salt, u.password), last_login: '', created_at: now_(), updated_at: now_() };
    insert_('users', row);
    if (role === 'lecturer') {
      var n = rows_('lecturers').length + 1;
      insert_('lecturers', { id: uid_('lec'), user_id: row.id, staff_id: 'UPNM' + ('000' + n).slice(-3), full_name: row.full_name, email: row.email, department: row.department, position: 'Pensyarah', phone: '', location: '', bio: '', photo: '', created_at: now_(), updated_at: now_() });
    }
    return safeUser_(row);
  },

  updateUser: function (p, ctx) {
    needAdmin_(ctx);
    var u = find_('users', p.id); if (!u) throw httpErr_('Pengguna tidak ditemui.', 404);
    var patch = p.patch || {};
    if (u.id === ctx.user.id && patch.status && patch.status !== 'Active') throw httpErr_('Anda tidak boleh menyahaktifkan akaun sendiri.', 400);
    if (patch.email && rows_('users').some(function (x) { return x.id !== u.id && String(x.email).toLowerCase() === String(patch.email).toLowerCase(); })) throw httpErr_('E-mel sudah didaftarkan.', 409);
    var set = { updated_at: now_() };
    ['full_name', 'email', 'department', 'status'].forEach(function (k) { if (patch[k] !== undefined) set[k] = patch[k]; });
    var saved = update_('users', u.id, set);
    var l = rows_('lecturers').filter(function (x) { return x.user_id === u.id; })[0];
    if (l) update_('lecturers', l.id, { full_name: saved.full_name, email: saved.email, department: saved.department, updated_at: now_() });
    return safeUser_(saved);
  },

  resetPassword: function (p, ctx) {
    needAdmin_(ctx);
    if (!p.password || String(p.password).length < 8) throw httpErr_('Kata laluan mestilah sekurang-kurangnya 8 aksara.', 400);
    if (!find_('users', p.id)) throw httpErr_('Pengguna tidak ditemui.', 404);
    var salt = uid_('s'); update_('users', p.id, { salt: salt, password_hash: hash_(salt, p.password), updated_at: now_() });
    return true;
  },

  changePassword: function (p, ctx) {
    if (!p.password || String(p.password).length < 8) throw httpErr_('Kata laluan mestilah sekurang-kurangnya 8 aksara.', 400);
    if (hash_(ctx.user.salt, String(p.current || '')) !== ctx.user.password_hash) throw httpErr_('Kata laluan semasa tidak betul.', 400);
    var salt = uid_('s'); update_('users', ctx.user.id, { salt: salt, password_hash: hash_(salt, p.password), updated_at: now_() });
    return true;
  },

  deleteUser: function (p, ctx) {
    needAdmin_(ctx);
    if (p.id === ctx.user.id) throw httpErr_('Anda tidak boleh memadam akaun sendiri.', 400);
    var lec = rows_('lecturers').filter(function (l) { return l.user_id === p.id; })[0];
    if (lec) {
      rows_('documents').filter(function (d) { return d.lecturer_id === lec.id; }).forEach(function (d) { trashFile_(d.file_ref); });
      OWNED.forEach(function (t) { deleteWhere_(t, 'lecturer_id', lec.id); });
      delete_('lecturers', lec.id);
    }
    delete_('users', p.id);
    return { id: p.id };
  }
};

// =====================================================================
// Helpers: sheet access
// =====================================================================

function sheet_(t) {
  var sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(t);
  if (!sh) throw httpErr_('Pangkalan data belum disediakan. Jalankan setup() dalam Apps Script.', 500);
  return sh;
}
function rows_(t) {
  var sh = sheet_(t), last = sh.getLastRow(), cols = T[t];
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, cols.length).getValues().map(function (v) {
    var o = {}; cols.forEach(function (c, i) { o[c] = NUMERIC[c] && v[i] !== '' ? Number(v[i]) : (v[i] instanceof Date ? v[i].toISOString() : v[i]); }); return o;
  }).filter(function (o) { return o.id !== ''; });
}
function find_(t, id) { return rows_(t).filter(function (r) { return r.id === id; })[0]; }
function toArr_(t, o) { return T[t].map(function (c) { return o[c] === undefined || o[c] === null ? '' : o[c]; }); }
function insert_(t, o) {
  Object.keys(o).forEach(function (k) { if (typeof o[k] === 'string' && o[k].length > MAX_CELL_CHARS) throw httpErr_('Nilai terlalu besar untuk disimpan (' + k + ').', 400); });
  sheet_(t).appendRow(toArr_(t, o));
}
function rowIndex_(t, id) {
  var sh = sheet_(t), last = sh.getLastRow(); if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function update_(t, id, patch) {
  var idx = rowIndex_(t, id); if (idx < 0) throw httpErr_('Rekod tidak ditemui.', 404);
  var sh = sheet_(t), cols = T[t], range = sh.getRange(idx, 1, 1, cols.length), cur = range.getValues()[0], o = {};
  cols.forEach(function (c, i) { o[c] = cur[i]; });
  Object.keys(patch).forEach(function (k) { if (cols.indexOf(k) >= 0 && patch[k] !== undefined) { if (typeof patch[k] === 'string' && patch[k].length > MAX_CELL_CHARS) throw httpErr_('Nilai terlalu besar untuk disimpan (' + k + '). Gunakan gambar yang lebih kecil.', 400); o[k] = patch[k]; } });
  range.setValues([toArr_(t, o)]);
  var out = {}; cols.forEach(function (c) { out[c] = NUMERIC[c] && o[c] !== '' ? Number(o[c]) : o[c]; });
  return out;
}
function delete_(t, id) { var idx = rowIndex_(t, id); if (idx > 0) sheet_(t).deleteRow(idx); }
function deleteWhere_(t, col, val) {
  var sh = sheet_(t), last = sh.getLastRow(); if (last < 2) return;
  var ci = T[t].indexOf(col), vals = sh.getRange(2, 1, last - 1, T[t].length).getValues();
  for (var i = vals.length - 1; i >= 0; i--) if (vals[i][ci] === val) sh.deleteRow(i + 2);
}
function clean_(t, o) { var r = {}; T[t].forEach(function (c) { if (o[c] !== undefined) r[c] = o[c]; }); return r; }   // whitelist columns only

// =====================================================================
// Helpers: auth, misc
// =====================================================================

function session_(token) {
  var id = token && CacheService.getScriptCache().get('tok:' + token);
  if (!id) throw httpErr_('Sesi tamat. Sila log masuk semula.', 401);
  var user = find_('users', id);
  if (!user || user.status !== 'Active') throw httpErr_('Akaun tidak aktif.', 401);
  var lecturer = rows_('lecturers').filter(function (l) { return l.user_id === user.id; })[0] || null;
  return { user: user, lecturer: lecturer };
}
function needAdmin_(ctx) { if (ctx.user.role !== 'admin') throw httpErr_('Untuk pentadbir sahaja.', 403); }
function nextStatus_(toGrade, cur) {
  var seq = ['draf', 'fakulti', 'pendaftar', 'saringan', 'penilai', 'pemilih', 'lpu', 'syarahan', 'berjaya'].filter(function (s) {
    if (s === 'penilai') return ['DS14', 'VK7', 'VK6', 'VK5'].indexOf(toGrade) >= 0;        // DS13: tiada Penilai Luar (§3.5.1)
    if (s === 'syarahan') return ['VK7', 'VK6', 'VK5'].indexOf(toGrade) >= 0;              // Syarahan Ilmiah / Perdana hanya jawatan Profesor
    return true;
  });
  var i = seq.indexOf(cur); return i >= 0 && i < seq.length - 1 ? seq[i + 1] : cur;
}
function promoEvent_(app, actor, role, action, from, to, note) {
  insert_('promotion_events', { id: uid_('pev'), application_id: app.id, lecturer_id: app.lecturer_id, at: now_(), actor: actor, actor_role: role, action: action, from_status: from, to_status: to, note: note });
}
function assertOwnsDoc_(docId, lid) { var d = find_('documents', docId); if (!d || d.lecturer_id !== lid) throw httpErr_('Dokumen sokongan tidak sah.', 400); }
function safeUser_(u) { var o = {}; Object.keys(u).forEach(function (k) { if (k !== 'password_hash' && k !== 'salt') o[k] = u[k]; }); return o; }
function hash_(salt, pw) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pw, Utilities.Charset.UTF_8)
    .map(function (b) { return ((b < 0 ? b + 256 : b) + 256).toString(16).slice(1); }).join('');
}
function uid_(p) { return p + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function now_() { return new Date().toISOString(); }
function log_(lid, msg) {
  insert_('activity_log', { id: uid_('act'), lecturer_id: lid, message: msg, created_at: now_() });
  var sh = sheet_('activity_log'); if (sh.getLastRow() > 801) sh.deleteRows(2, sh.getLastRow() - 801);   // keep the feed bounded
}
function folder_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('DRIVE_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ } }
  var f = DriveApp.createFolder(DRIVE_FOLDER_NAME); props.setProperty('DRIVE_FOLDER_ID', f.getId()); return f;
}
function trashFile_(ref) { if (ref) { try { DriveApp.getFileById(ref).setTrashed(true); } catch (e) { /* already gone */ } } }
function httpErr_(msg, code) { var e = new Error(msg); e.publicMessage = msg; e.code = code; return e; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
