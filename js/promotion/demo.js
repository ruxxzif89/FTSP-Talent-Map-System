// Data demo (fiksyen, dalam ingatan) untuk "Demo Berpandu". Tulen: boleh diuji dengan Node. Tidak menyentuh rekod sebenar.
export const DEMO_ID = 'demo';
export const demoLecturer = () => ({
  id: DEMO_ID, full_name: 'Dr. Aina Sofea binti Rahman', staff_id: 'DEMO-001', department: 'Sains Komputer', position: 'Pensyarah',
  grade: 'DS11', grade_since: '2019-03-01', appointed_on: '2019-03-01', confirmed_on: '2020-03-01', field: 'Sains & Teknologi', has_phd: 'Ya', has_prof_qual: 'Tidak', employment: 'Tetap', scopus_h_index: 4,
});

let n = 0;
const rid = () => 'd' + ++n;
const A = (o) => ({ id: rid(), lecturer_id: DEMO_ID, ...o });

// Kilang rekod: setiap satu mewakili tindakan "Tambah rekod" yang pengguna lakukan dalam sistem sebenar.
export const ADD = {
  teach: { label: 'Catat semester pengajaran (beban tugas dipenuhi, ada pengajaran teradun)', table: 'activities', rows: () => [A({ kind: 'ajar_semester', year: 2024, semester: '2024/2025 Sem 1', workload_met: 'Ya', blended: 'Ya' })] },
  psm: { label: 'Catat 5 pelajar Projek Sarjana Muda yang telah bergraduat', table: 'activities', rows: () => ['Hana', 'Imran', 'Jasmin', 'Khairul', 'Lina'].map((s, i) => A({ kind: 'sv_psm', year: 2021 + (i % 4), student: s, graduated: 'Ya' })) },
  grant: { label: 'Tambah geran dalam UPNM bernilai RM12,000 (diketuai, berdaftar PPI)', table: 'research', rows: () => [A({ title: 'Pengesanan Anomali Rangkaian Pertahanan', area: 'Keselamatan Siber', category: 'Penyelidikan Gunaan', year: 2022, status: 'Selesai', role: 'Ketua Penyelidik', grant_source: 'Universiti (Geran Dalam)', amount: 12000, registered_ppi: 'Ya' })] },
  jkUni: { label: 'Tambah 2 keahlian jawatankuasa Universiti / Fakulti', table: 'activities', rows: () => [A({ kind: 'kp_ajk', year: 2022, title: 'JK Kurikulum Fakulti', level: 'Fakulti / Pusat / Akademi' }), A({ kind: 'kp_ajk', year: 2023, title: 'JK Penyelidikan Universiti', level: 'Universiti' })] },
  jkNat: { label: 'Tambah 1 keahlian jawatankuasa peringkat kebangsaan', table: 'activities', rows: () => [A({ kind: 'kp_ajk', year: 2023, title: 'Panel Teknikal Kebangsaan Keselamatan Siber', level: 'Kebangsaan' })] },
  scopus: { label: 'Tambah 1 artikel jurnal SCOPUS (penulis utama, diterbitkan)', table: 'publications', rows: () => [A({ title: 'Lightweight Intrusion Detection for Tactical Networks', type: 'Artikel Jurnal', venue: 'Journal of Defence Technology', year: 2023, status: 'Diterbitkan', indexing: 'SCOPUS', author_role: 'Penulis Utama / Corresponding' })] },
  lppt: { label: 'Masukkan markah LPPT 3 tahun (85%, 88%, 90%)', table: 'lppt_scores', rows: () => [[2022, 85], [2023, 88], [2024, 90]].map(([y, s]) => A({ year: y, score: s })) },
};

// Keadaan permulaan "hampir bersedia": semua selesai kecuali artikel SCOPUS dan keahlian kebangsaan.
export const SETUP_NEAR = ['teach', 'psm', 'grant', 'jkUni', 'lppt'];
export const emptyTables = () => ({ activities: [], research: [], publications: [], consultancy: [], lppt_scores: [], disciplinary: [] });
export function build(keys) { const T = emptyTables(); keys.forEach((k) => T[ADD[k].table].push(...ADD[k].rows())); return T; }
export function apply(T, key) { T[ADD[key].table].push(...ADD[key].rows()); }
