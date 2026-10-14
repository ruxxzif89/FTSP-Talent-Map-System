// Sumber rujukan tunggal untuk model data.
// Nama jadual/lajur ialah snake_case dan relasional (id + *_id sebagai kunci asing) supaya
// bentuk yang sama boleh dipindahkan terus ke MySQL (lihat docs/schema.sql dan backend/Code.gs).
//
// Konvensyen bahasa: SEMUA teks yang dipaparkan kepada pengguna dalam Bahasa Malaysia.
// Kod teknikal yang digunakan oleh logik sistem (role: admin|lecturer, status akaun: Active|Inactive)
// kekal sebagai kod dan diterjemah ketika paparan melalui ROLE_LABEL / ACCOUNT_STATUS_LABEL.

import { PERINGKAT, GRANT_SOURCES, PUB_TYPES, PUB_INDEXING, AUTHOR_ROLES, CONSULT_KINDS, CONSULT_ROLES, CONSULT_KIND_OK, ACTIVITY_KINDS, ACTIVITY_GROUPS, PENALTIES, FIELDS, GRADES } from './promotion/guideline.js';

export const LEVELS = ['Asas', 'Pertengahan', 'Mahir', 'Pakar'];
export const DEPARTMENTS = ['Sains Komputer', 'Teknologi Maklumat', 'Matematik', 'Kejuruteraan', 'Lain-lain'];
export const POSITIONS = ['Profesor', 'Profesor Madya', 'Pensyarah Kanan', 'Pensyarah', 'Tutor'];

export const ROLE_LABEL = { admin: 'Pentadbir', lecturer: 'Pensyarah' };
export const ACCOUNT_STATUS_LABEL = { Active: 'Aktif', Inactive: 'Tidak Aktif' };

export const TABLES = [
  'users', 'lecturers', 'expertise_categories', 'expertise', 'research', 'publications',
  'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log',
  // Modul kenaikan pangkat
  'activities', 'lppt_scores', 'disciplinary', 'promotion_applications', 'promotion_events', 'promotion_assessors',
];
// Jadual yang rekodnya dimiliki oleh seorang pensyarah (kunci asing lecturer_id).
export const OWNED = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log', 'activities', 'lppt_scores', 'disciplinary', 'promotion_applications', 'promotion_events', 'promotion_assessors'];
// Hanya pentadbir boleh menulis (pensyarah hanya membaca rekod sendiri).
export const ADMIN_WRITE = ['lppt_scores', 'disciplinary', 'promotion_assessors'];
// Tiada CRUD generik — hanya melalui tindakan khas (peraturan aliran kerja dikuatkuasakan di pelayan).
export const ACTION_ONLY = ['promotion_applications', 'promotion_events'];
// Maklumat perkhidmatan pada jadual `lecturers`: hanya pentadbir (data HR) boleh mengubah. Pensyarah boleh ubah `scopus_h_index`.
export const SERVICE_FIELDS = ['grade', 'grade_since', 'appointed_on', 'confirmed_on', 'vk7_since', 'field', 'has_phd', 'has_prof_qual', 'employment', 'syarahan_perdana', 'monograf'];
export const LECTURER_EXTRA_COLS = [...SERVICE_FIELDS, 'scopus_h_index'];
export const GRADE_OPTIONS = GRADES.map((g) => [g.code, `${g.name} (${g.short})`]);
export { FIELDS };

const PROMO_GROUP = { title: 'Untuk kenaikan pangkat (pilihan)', note: 'Isi bahagian ini jika anda merancang memohon kenaikan pangkat — sistem menggunakannya untuk mengira kelayakan anda.' };
const STATUS_PROJEK = ['Sedang Berjalan', 'Selesai', 'Dirancang'];

// Konfigurasi CRUD deklaratif: menggerakkan halaman senarai, borang, laporan dan suapan aktiviti.
// fmt: cara sel dipaparkan. field.type: text | number | date | url | textarea | select | category | file
export const ENTITIES = {
  expertise: {
    table: 'expertise', icon: 'brain', tint: 'blue', singular: 'Kepakaran', plural: 'Kepakaran', mine: 'Kepakaran Saya',
    title: (r) => r.area,
    columns: [
      { key: 'area', label: 'Kepakaran' }, { key: 'category_id', label: 'Kategori', fmt: 'category' },
      { key: 'level', label: 'Tahap', fmt: 'level' }, { key: 'years', label: 'Tahun', fmt: 'num' },
    ],
    fields: [
      { name: 'category_id', label: 'Kategori Kepakaran', type: 'category', required: true },
      { name: 'area', label: 'Bidang Kepakaran', type: 'text', required: true, placeholder: 'cth. Forensik Digital' },
      { name: 'level', label: 'Tahap Kepakaran', type: 'select', options: LEVELS, required: true },
      { name: 'years', label: 'Tahun Pengalaman', type: 'number', required: true, min: 0, max: 60 },
      { name: 'interest', label: 'Minat Penyelidikan (Pilihan)', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Sijil' },
    ],
  },
  research: {
    table: 'research', icon: 'flask', tint: 'green', singular: 'Penyelidikan', plural: 'Penyelidikan', mine: 'Penyelidikan Saya',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Tajuk' }, { key: 'area', label: 'Bidang' }, { key: 'category', label: 'Kategori' },
      { key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Tajuk Penyelidikan', type: 'text', required: true },
      { name: 'area', label: 'Bidang Penyelidikan', type: 'text', required: true },
      { name: 'category', label: 'Kategori Penyelidikan', type: 'select', options: ['Penyelidikan Asas', 'Penyelidikan Gunaan', 'Pembangunan Eksperimen', 'Penyelidikan Dasar'], required: true },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_PROJEK, required: true },
      { name: 'description', label: 'Abstrak / Penerangan', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Laporan Penyelidikan' },
      { name: 'role', label: 'Peranan anda', type: 'select', options: ['Ketua Penyelidik', 'Ahli'], group: PROMO_GROUP, help: 'f_res_role' },
      { name: 'grant_source', label: 'Sumber geran', type: 'select', options: GRANT_SOURCES, group: PROMO_GROUP, help: 'f_res_source' },
      { name: 'amount', label: 'Nilai geran (RM)', type: 'number', min: 0, group: PROMO_GROUP, help: 'f_res_amount' },
      { name: 'registered_ppi', label: 'Berdaftar di Pusat Pengurusan Penyelidikan dan Inovasi (PPI)?', type: 'select', options: ['Ya', 'Tidak'], default: 'Ya', group: PROMO_GROUP, help: 'f_ppi' },
    ],
  },
  publications: {
    table: 'publications', icon: 'book', tint: 'purple', singular: 'Penerbitan', plural: 'Penerbitan', mine: 'Penerbitan Saya',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Tajuk' }, { key: 'type', label: 'Jenis' }, { key: 'indexing', label: 'Indeks' }, { key: 'venue', label: 'Jurnal / Penerbit' },
      { key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Tajuk Penerbitan', type: 'text', required: true },
      { name: 'type', label: 'Jenis Penerbitan', type: 'select', options: PUB_TYPES, required: true, help: 'f_pub_type' },
      { name: 'venue', label: 'Jurnal / Penerbit', type: 'text', required: true },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: ['Diterbitkan', 'Dalam Percetakan', 'Dalam Semakan', 'Draf'], required: true, help: 'f_pub_status' },
      { name: 'doi', label: 'DOI / Pautan (Pilihan)', type: 'url', placeholder: 'https://doi.org/…' },
      { name: 'document_id', label: 'Muat Naik Dokumen', type: 'file', docType: 'Penerbitan' },
      { name: 'indexing', label: 'Pengindeksan', type: 'select', options: PUB_INDEXING, group: PROMO_GROUP, help: 'f_pub_index' },
      { name: 'author_role', label: 'Peranan anda sebagai penulis', type: 'select', options: AUTHOR_ROLES, group: PROMO_GROUP, help: 'f_pub_role' },
    ],
  },
  certifications: {
    table: 'certifications', icon: 'award', tint: 'amber', singular: 'Pensijilan', plural: 'Pensijilan', mine: 'Pensijilan Saya',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Pensijilan' }, { key: 'issuer', label: 'Badan Pengeluar' },
      { key: 'issue_date', label: 'Dikeluarkan', fmt: 'date' }, { key: 'expiry_date', label: 'Tamat Tempoh', fmt: 'expiry' },
    ],
    fields: [
      { name: 'name', label: 'Nama Pensijilan', type: 'text', required: true },
      { name: 'issuer', label: 'Badan Pengeluar', type: 'text', required: true },
      { name: 'issue_date', label: 'Tarikh Dikeluarkan', type: 'date', required: true },
      { name: 'expiry_date', label: 'Tarikh Tamat Tempoh', type: 'date' },
      { name: 'cert_no', label: 'Nombor Sijil (Pilihan)', type: 'text' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Sijil' },
    ],
  },
  training: {
    table: 'training', icon: 'cap', tint: 'teal', singular: 'Latihan', plural: 'Latihan', mine: 'Latihan Saya',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Latihan / Kursus' }, { key: 'organizer', label: 'Penganjur' },
      { key: 'date', label: 'Tarikh', fmt: 'date' }, { key: 'duration_days', label: 'Hari', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Nama Latihan / Kursus', type: 'text', required: true },
      { name: 'organizer', label: 'Penganjur', type: 'text', required: true },
      { name: 'date', label: 'Tarikh', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Selesai', 'Sedang Berjalan', 'Dirancang'], required: true },
      { name: 'duration_days', label: 'Tempoh (hari)', type: 'number', min: 0, max: 365 },
      { name: 'description', label: 'Penerangan (Pilihan)', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Sijil' },
    ],
  },
  consultancy: {
    table: 'consultancy', icon: 'briefcase', tint: 'rose', singular: 'Konsultansi', plural: 'Konsultansi', mine: 'Konsultansi Saya',
    title: (r) => r.project,
    columns: [
      { key: 'project', label: 'Projek' }, { key: 'client', label: 'Organisasi / Klien' },
      { key: 'role', label: 'Peranan' }, { key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'project', label: 'Nama Projek / Konsultansi', type: 'text', required: true },
      { name: 'client', label: 'Organisasi / Klien', type: 'text', required: true },
      { name: 'role', label: 'Peranan', type: 'select', options: CONSULT_ROLES, required: true, help: 'f_con_role' },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_PROJEK, required: true },
      { name: 'description', label: 'Penerangan (Pilihan)', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Laporan' },
      { name: 'kind', label: 'Adakah ini perundingan yang dikira?', type: 'select', options: CONSULT_KINDS, default: CONSULT_KIND_OK, group: PROMO_GROUP, help: 'f_con_kind' },
      { name: 'amount', label: 'Nilai perundingan (RM, kosongkan jika tiada kewangan)', type: 'number', min: 0, group: PROMO_GROUP, help: 'f_con_amount' },
      { name: 'registered_ppi', label: 'Berdaftar di PPI?', type: 'select', options: ['Ya', 'Tidak'], default: 'Ya', group: PROMO_GROUP, help: 'f_ppi' },
    ],
  },
  achievements: {
    table: 'achievements', icon: 'star', tint: 'indigo', singular: 'Pencapaian', plural: 'Pencapaian', mine: 'Pencapaian Saya',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Pencapaian' }, { key: 'category', label: 'Kategori' }, { key: 'year', label: 'Tahun', fmt: 'num' },
    ],
    fields: [
      { name: 'name', label: 'Nama Pencapaian', type: 'text', required: true },
      { name: 'category', label: 'Kategori', type: 'select', options: ['Penyelidikan', 'Pengajaran', 'Inovasi', 'Perkhidmatan', 'Kepimpinan'], required: true },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'description', label: 'Penerangan (Pilihan)', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Anugerah' },
    ],
  },
  documents: {
    table: 'documents', icon: 'file', tint: 'slate', singular: 'Dokumen', plural: 'Dokumen', mine: 'Dokumen Saya',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Nama Dokumen' }, { key: 'doc_type', label: 'Jenis' },
      { key: 'created_at', label: 'Tarikh Muat Naik', fmt: 'date' }, { key: 'size', label: 'Saiz', fmt: 'size' },
    ],
    fields: [
      { name: 'doc_type', label: 'Jenis Dokumen', type: 'select', options: ['CV', 'Portfolio', 'Sijil', 'Laporan', 'Penerbitan', 'Laporan Penyelidikan', 'Anugerah', 'Lain-lain'], required: true },
      { name: 'title', label: 'Tajuk / Penerangan', type: 'text', required: true },
      { name: 'file', label: 'Fail', type: 'file', required: true, standalone: true },
    ],
  },
};

const lv = { name: 'level', label: 'Peringkat', type: 'select', options: PERINGKAT, help: 'f_act_level' };
ENTITIES.activities = {
  table: 'activities', icon: 'target', tint: 'teal', singular: 'Aktiviti', plural: 'Aktiviti Akademik', mine: 'Aktiviti Akademik Saya', helpKey: 'ent_activities',
  title: (r) => (ACTIVITY_KINDS[r.kind] ? ACTIVITY_KINDS[r.kind].label : r.kind) + (r.title ? ` — ${r.title}` : r.student ? ` — ${r.student}` : ''),
  columns: [
    { key: 'kind', label: 'Jenis aktiviti', fmt: 'actkind' }, { key: 'title', label: 'Tajuk / Nama', fmt: 'actname' }, { key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'level', label: 'Peringkat' }, { key: 'role', label: 'Peranan' },
  ],
  fields: [
    { name: 'kind', label: 'Jenis aktiviti', type: 'select', required: true, options: Object.entries(ACTIVITY_KINDS).map(([k, v]) => [k, `${v.group} — ${v.label}`]), help: 'f_act_kind' },
    { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
    { name: 'title', label: 'Tajuk / nama (cth. nama jawatankuasa, jurnal, tesis)', type: 'text', show: (v) => hasField(v, 'title') },
    { name: 'student', label: 'Nama pelajar', type: 'text', show: (v) => hasField(v, 'student') },
    { name: 'role', label: 'Peranan anda', type: 'select', options: ['Penyelia Utama', 'Penyelia Bersama'], show: (v) => hasField(v, 'role'), help: 'f_act_role' },
    { name: 'graduated', label: 'Pelajar telah bergraduat / selesai?', type: 'select', options: ['Ya', 'Tidak'], show: (v) => hasField(v, 'graduated'), help: 'f_act_grad' },
    { ...lv, show: (v) => hasField(v, 'level') },
    { name: 'semester', label: 'Semester (cth. 2024/2025 Sem 1)', type: 'text', show: (v) => hasField(v, 'semester') },
    { name: 'workload_met', label: 'Beban tugas minimum dipenuhi?', type: 'select', options: ['Ya', 'Tidak'], show: (v) => hasField(v, 'workload_met'), help: 'f_act_workload' },
    { name: 'blended', label: 'Menggunakan pengajaran teradun (blended)?', type: 'select', options: ['Ya', 'Tidak'], show: (v) => hasField(v, 'blended'), help: 'f_act_blended' },
    { name: 'score', label: 'Markah penilaian pelajar (0–5, pilihan)', type: 'number', min: 0, max: 5, show: (v) => hasField(v, 'score') },
    { name: 'terms', label: 'Bilangan penggal', type: 'number', min: 1, max: 10, show: (v) => hasField(v, 'terms'), help: 'f_act_terms' },
    { name: 'document_id', label: 'Dokumen Sokongan (bukti)', type: 'file', docType: 'Lain-lain', help: 'f_act_bukti' },
  ],
};
function hasField(v, name) { const k = ACTIVITY_KINDS[v.kind]; return !!k && k.fields.includes(name); }
ENTITIES.lppt_scores = {
  table: 'lppt_scores', icon: 'chart', tint: 'amber', singular: 'Markah LPPT', plural: 'Markah LPPT', mine: 'Markah LPPT', adminWrite: true, helpKey: 'ent_lppt',
  title: (r) => `LPPT ${r.year}`,
  columns: [{ key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'score', label: 'Markah (%)', fmt: 'num' }],
  fields: [
    { name: 'year', label: 'Tahun penilaian', type: 'number', required: true, min: 2000, max: 2100 },
    { name: 'score', label: 'Markah LPPT (%)', type: 'number', required: true, min: 0, max: 100, help: 'f_lppt' },
  ],
};
ENTITIES.disciplinary = {
  table: 'disciplinary', icon: 'alert', tint: 'rose', singular: 'Hukuman Tatatertib', plural: 'Hukuman Tatatertib', mine: 'Hukuman Tatatertib', adminWrite: true, helpKey: 'ent_disciplinary',
  title: (r) => `${r.penalty} (${r.date})`,
  columns: [{ key: 'case_no', label: 'No. kes' }, { key: 'penalty', label: 'Hukuman' }, { key: 'date', label: 'Tarikh hukuman', fmt: 'date' }, { key: 'note', label: 'Catatan' }],
  fields: [
    { name: 'case_no', label: 'No. kes (satu pertuduhan = satu nombor)', type: 'text', required: true, help: 'f_dis_case' },
    { name: 'penalty', label: 'Jenis hukuman', type: 'select', options: PENALTIES, required: true, help: 'f_dis_penalty' },
    { name: 'date', label: 'Tarikh hukuman dijatuhkan', type: 'date', required: true },
    { name: 'note', label: 'Catatan (pilihan)', type: 'textarea' },
  ],
};

export const ENTITY_ORDER = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'activities', 'documents'];
export const ADMIN_ENTITY_ORDER = ['lppt_scores', 'disciplinary'];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
