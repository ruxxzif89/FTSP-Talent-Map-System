// Sumber rujukan tunggal untuk model data.
// Nama jadual/lajur ialah snake_case dan relasional (id + *_id sebagai kunci asing) supaya
// bentuk yang sama boleh dipindahkan terus ke MySQL (lihat docs/schema.sql dan backend/Code.gs).
//
// Konvensyen bahasa: SEMUA teks yang dipaparkan kepada pengguna dalam Bahasa Malaysia.
// Kod teknikal yang digunakan oleh logik sistem (role: admin|lecturer, status akaun: Active|Inactive)
// kekal sebagai kod dan diterjemah ketika paparan melalui ROLE_LABEL / ACCOUNT_STATUS_LABEL.

export const LEVELS = ['Asas', 'Pertengahan', 'Mahir', 'Pakar'];
export const DEPARTMENTS = ['Sains Komputer', 'Teknologi Maklumat', 'Matematik', 'Kejuruteraan', 'Lain-lain'];
export const POSITIONS = ['Profesor', 'Profesor Madya', 'Pensyarah Kanan', 'Pensyarah', 'Tutor'];

export const ROLE_LABEL = { admin: 'Pentadbir', lecturer: 'Pensyarah' };
export const ACCOUNT_STATUS_LABEL = { Active: 'Aktif', Inactive: 'Tidak Aktif' };

export const TABLES = [
  'users', 'lecturers', 'expertise_categories', 'expertise', 'research', 'publications',
  'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log',
];
// Jadual yang rekodnya dimiliki oleh seorang pensyarah (kunci asing lecturer_id).
export const OWNED = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log'];

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
    ],
  },
  publications: {
    table: 'publications', icon: 'book', tint: 'purple', singular: 'Penerbitan', plural: 'Penerbitan', mine: 'Penerbitan Saya',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Tajuk' }, { key: 'type', label: 'Jenis' }, { key: 'venue', label: 'Jurnal / Penerbit' },
      { key: 'year', label: 'Tahun', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Tajuk Penerbitan', type: 'text', required: true },
      { name: 'type', label: 'Jenis Penerbitan', type: 'select', options: ['Artikel Jurnal', 'Kertas Persidangan', 'Buku', 'Bab Buku', 'Paten', 'Laporan Teknikal'], required: true },
      { name: 'venue', label: 'Jurnal / Penerbit', type: 'text', required: true },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: ['Diterbitkan', 'Dalam Percetakan', 'Dalam Semakan', 'Draf'], required: true },
      { name: 'doi', label: 'DOI / Pautan (Pilihan)', type: 'url', placeholder: 'https://doi.org/…' },
      { name: 'document_id', label: 'Muat Naik Dokumen', type: 'file', docType: 'Penerbitan' },
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
      { name: 'role', label: 'Peranan', type: 'select', options: ['Ketua Projek', 'Perunding', 'Penyelidik Bersama', 'Penasihat', 'Jurulatih'], required: true },
      { name: 'year', label: 'Tahun', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_PROJEK, required: true },
      { name: 'description', label: 'Penerangan (Pilihan)', type: 'textarea' },
      { name: 'document_id', label: 'Dokumen Sokongan', type: 'file', docType: 'Laporan' },
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

export const ENTITY_ORDER = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents'];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
