// Pengetahuan "Garis Panduan Kenaikan Pangkat Staf Akademik UPNM (Edisi 2025, LPU 28 Ogos 2025)" yang dikodkan sebagai DATA.
// Fail ini tulen (tiada DOM) supaya enjin boleh diuji dengan Node. Rujukan "Perenggan " ialah nombor perenggan dalam Garis Panduan.
// Jika angka dalam Garis Panduan dipinda, UBAH DI SINI SAHAJA — enjin, UI dan borang cetak akan mengikut.

// ---------- Gred dan laluan (Perenggan 1.3) ----------
export const GRADES = [
  { code: 'DS11', name: 'Pensyarah Universiti', short: 'DS11' },
  { code: 'DS13', name: 'Pensyarah Kanan', short: 'DS13' },
  { code: 'DS14', name: 'Profesor Madya', short: 'DS14' },
  { code: 'VK7', name: 'Profesor (Gred Khas C)', short: 'VK7' },
  { code: 'VK6', name: 'Profesor (Gred Khas B)', short: 'VK6' },
  { code: 'VK5', name: 'Profesor (Gred Khas A)', short: 'VK5' },
];
export const GRADE = Object.fromEntries(GRADES.map((g) => [g.code, g]));
export const NEXT_GRADE = { DS11: 'DS13', DS13: 'DS14', DS14: 'VK7', VK7: 'VK6', VK6: 'VK5' };
export const isProfessorGrade = (g) => ['VK7', 'VK6', 'VK5'].includes(g);       // jawatan Profesor → Jawatankuasa Pemilih Profesor, LPU pertimbangan
export const needsExternalAssessors = (g) => ['DS14', 'VK7', 'VK6', 'VK5'].includes(g); // Perenggan 3.5.1–3.5.4: DS13 tidak perlu
export const gradeLabel = (c) => (GRADE[c] ? `${GRADE[c].name} (${GRADE[c].short})` : c || '—');

// ---------- Bidang (Perenggan 2.1(y)) ----------
export const FIELDS = ['Sains & Teknologi', 'Sains Sosial', 'Klinikal'];
export const fieldIdx = (f) => (f === 'Sains Sosial' ? 1 : f === 'Klinikal' ? 2 : 0);

// ---------- Peringkat & geran (Perenggan 6.3 nota b–c) ----------
export const PERINGKAT = ['Antarabangsa', 'Kebangsaan', 'Negeri', 'Universiti', 'Fakulti / Pusat / Akademi'];
export const GRANT_SOURCES = ['Universiti (Geran Dalam)', 'Kementerian (KPT)', 'Agensi Kerajaan', 'Industri', 'Antarabangsa'];
export const isExternalGrant = (s) => !!s && s !== GRANT_SOURCES[0] && GRANT_SOURCES.includes(s); // Geran Luar = industri, KPT, agensi kerajaan, antarabangsa

// ---------- Perundingan (Perenggan 2.1(v)) ----------
export const CONSULT_KIND_OK = 'Perundingan dalam bidang kepakaran';
export const CONSULT_KINDS = [
  CONSULT_KIND_OK,
  'Peserta / pembentang / ucaptama persidangan (tidak dikira)',
  'Penceramah jemputan / kursus dalaman UPNM (tidak dikira)',
  'Pemeriksa tesis / projek / kertas soalan (tidak dikira)',
  'Penilai kenaikan pangkat / program (tidak dikira)',
  'Penyunting jurnal (tidak dikira)',
  'Tenaga pengajar program eksekutif / pesisir (tidak dikira)',
  'Hakim / juri pertandingan (tidak dikira)',
  'Lantikan dalaman UPNM (tidak dikira)',
];
export const CONSULT_ROLES = ['Perunding Utama', 'Perunding Bersama'];

// ---------- Tatatertib (Perenggan 2.3.5–2.3.8) ----------
export const PENALTY_MONTHS = { Amaran: 12, Denda: 18, 'Lucut Hak Emolumen': 24, 'Tangguh Pergerakan Gaji': 30, 'Turun Gaji': 36, 'Turun Pangkat': 48 };
export const PENALTIES = Object.keys(PENALTY_MONTHS);

// ---------- Penerbitan: klasifikasi & kesetaraan (Perenggan 6.7.1–6.7.2) ----------
export const PUB_TYPES = ['Artikel Jurnal', 'Prosiding Persidangan', 'Buku', 'Bab dalam Buku', 'Terjemahan / Suntingan Buku', 'Laporan Teknikal', 'Kertas Polisi Antarabangsa', 'Kertas Polisi Kebangsaan', 'Penulisan Ilmiah dalam Media', 'Penulisan Popular', 'Modul / Modul Dalam Talian', 'Karya Kreatif', 'Paten', 'Lain-lain'];
export const PUB_INDEXING = ['SCOPUS', 'WoS / ISI', 'Berindeks lain', 'Tidak berindeks'];
export const AUTHOR_ROLES = ['Penulis Utama / Corresponding', 'Penulis Bersama'];

// ---------- Kod lampiran & jenis aktiviti (Lampiran 1: Bahagian B) ----------
export const COMPONENTS = [
  { key: 'pengajaran', label: 'Pengajaran', icon: 'cap', help: 'comp_pengajaran' },
  { key: 'penyeliaan', label: 'Penyeliaan', icon: 'users', help: 'comp_penyeliaan' },
  { key: 'penyelidikan', label: 'Penyelidikan', icon: 'flask', help: 'comp_penyelidikan' },
  { key: 'penerbitan', label: 'Penerbitan', icon: 'book', help: 'comp_penerbitan' },
  { key: 'pengiktirafan', label: 'Pengiktirafan Akademik', icon: 'award', help: 'comp_pengiktirafan' },
  { key: 'kepimpinan', label: 'Kepimpinan, Khidmat & Perundingan', icon: 'briefcase', help: 'comp_kepimpinan' },
];
export const COMPONENT = Object.fromEntries([...COMPONENTS, { key: 'syarahan', label: 'Syarahan Perdana & Monograf', icon: 'star', help: 'comp_syarahan' }].map((c) => [c.key, c]));

// Jenis "Aktiviti Akademik" yang dicatat pensyarah. `fields` = medan yang dipaparkan dalam borang (selebihnya disembunyikan).
export const ACTIVITY_KINDS = {
  ajar_semester: { group: 'Pengajaran', label: 'Beban tugas pengajaran (satu semester)', lampiran: 'A1–A9', fields: ['semester', 'workload_met', 'blended', 'score'], comp: 'pengajaran' },
  sv_phd: { group: 'Penyeliaan', label: 'Penyeliaan pelajar PhD', lampiran: 'A10 / A12', fields: ['student', 'role', 'graduated', 'title'], comp: 'penyeliaan' },
  sv_msc_res: { group: 'Penyeliaan', label: 'Penyeliaan pelajar Sarjana (Penyelidikan)', lampiran: 'A11 / A13', fields: ['student', 'role', 'graduated', 'title'], comp: 'penyeliaan' },
  sv_msc_kk: { group: 'Penyeliaan', label: 'Penyeliaan pelajar Sarjana (Kerja Kursus)', lampiran: 'A14', fields: ['student', 'role', 'graduated', 'title'], comp: 'penyeliaan' },
  sv_msc_klin: { group: 'Penyeliaan', label: 'Penyeliaan pelajar Sarjana (Klinikal)', lampiran: 'A14', fields: ['student', 'role', 'graduated', 'title'], comp: 'penyeliaan' },
  sv_psm: { group: 'Penyeliaan', label: 'Penyeliaan Projek Sarjana Muda', lampiran: 'E14', fields: ['student', 'graduated', 'title'], comp: 'penyeliaan' },
  sv_postdoc: { group: 'Penyeliaan', label: 'Penyeliaan Post-Doktoral', lampiran: 'E18', fields: ['student', 'title'], comp: 'penyeliaan' },
  ik_editor: { group: 'Pengiktirafan Akademik', label: 'Editor jurnal berindeks', lampiran: 'D21–D22', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_editor_scopus: { group: 'Pengiktirafan Akademik', label: 'Editor jurnal SCOPUS', lampiran: 'D21–D22', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_penilai_jurnal: { group: 'Pengiktirafan Akademik', label: 'Penilai artikel jurnal berindeks', lampiran: 'D23–D24', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_penilai_buku: { group: 'Pengiktirafan Akademik', label: 'Penilai manuskrip buku / bab buku', lampiran: 'D23–D24', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_penilai_kp: { group: 'Pengiktirafan Akademik', label: 'Penilai luar kenaikan pangkat Profesor / Profesor Madya', lampiran: 'D15–D18', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_tesis: { group: 'Pengiktirafan Akademik', label: 'Pemeriksa luar tesis', lampiran: 'D29–D32', fields: ['student', 'title', 'level'], comp: 'pengiktirafan' },
  ik_klinikal: { group: 'Pengiktirafan Akademik', label: 'Pemeriksa klinikal luar', lampiran: 'D33', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_ucaptama: { group: 'Pengiktirafan Akademik', label: 'Ucaptama (keynote speaker)', lampiran: 'D34–D35', fields: ['title', 'level'], comp: 'pengiktirafan' },
  ik_mooc: { group: 'Pengiktirafan Akademik', label: 'MOOC (sebagai ketua) yang digunapakai untuk pengajaran', lampiran: 'D36', fields: ['title'], comp: 'pengiktirafan' },
  ik_micro: { group: 'Pengiktirafan Akademik', label: 'Micro-credential (sebagai ketua) yang digunapakai untuk pengajaran', lampiran: 'D37', fields: ['title'], comp: 'pengiktirafan' },
  kp_ajk: { group: 'Kepimpinan & Khidmat', label: 'Ahli jawatankuasa', lampiran: 'E28–E35', fields: ['title', 'level'], comp: 'kepimpinan' },
  kp_pengerusi: { group: 'Kepimpinan & Khidmat', label: 'Pengerusi jawatankuasa', lampiran: 'E28–E35', fields: ['title', 'level'], comp: 'kepimpinan' },
  kp_pentadbiran: { group: 'Kepimpinan & Khidmat', label: 'Jawatan pentadbiran di UPNM (bilangan penggal)', lampiran: 'E27', fields: ['title', 'terms'], comp: 'kepimpinan' },
  kp_pelajar: { group: 'Kepimpinan & Khidmat', label: 'Ketua program pembangunan pelajar', lampiran: 'E40', fields: ['title'], comp: 'kepimpinan' },
};
export const ACTIVITY_GROUPS = ['Pengajaran', 'Penyeliaan', 'Pengiktirafan Akademik', 'Kepimpinan & Khidmat'];
export const activityKindLabels = () => Object.entries(ACTIVITY_KINDS).map(([k, v]) => [k, `${v.group} — ${v.label}`]);

// ---------- Peraturan syarat wajib minimum (Perenggan 6.2–6.6) ----------
// Nod peraturan: ALL (DAN), ANY (ATAU) atau daun. Enjin (engine.js) menafsirkannya.
const ALL = (label, ...kids) => ({ type: 'all', label, kids });
const ANY = (label, ...kids) => ({ type: 'any', label, kids });
const L = (kind, p = {}) => ({ type: 'leaf', kind, ...p });
const pick = (v, f) => (Array.isArray(v) ? v[Math.min(f, v.length - 1)] : v); // [S&T, Sosial, Klinikal]

const teach = (sems) => L('teach', { sems, ref: 'Perenggan 6.2–6.6 Pengajaran' });
const sv = (vec) => L('svVec', { vec });
const grantTotal = (total, per, role = 'led') => L('grantTotal', { total, per, role });
const grantLed = (n, ext) => L('grantLed', { n, ext });
const hIdx = (n) => L('hIndex', { n });
const scopus = (n) => L('scopusMain', { n });
const scopusPlus = (n, others) => L('scopusPlus', { n, others });
const recog = (kinds, n, p = {}) => L('recog', { kinds, n, ...p });
const lead = (kinds, levels, n, label) => L('lead', { kinds, levels, n, label });
const consult = (n, utama, utamaN, value) => ANY('Perundingan (pilih satu)', L('consultCount', { n, utama }), L('consultValue', { utamaN, value }));

const KB = ['Antarabangsa', 'Kebangsaan']; // peringkat kebangsaan / antarabangsa

// Setiap peraturan dikembalikan sebagai { windowKey, components: { key: node } } bagi indeks bidang f (0=S&T, 1=Sosial, 2=Klinikal).
export const RULES = {
  // Perenggan 6.2 — Pensyarah Kanan (DS13). Aktiviti dinilai ketika di DS11 sahaja (nota b).
  DS13: (f) => ({
    windowKey: 'grade_since',
    windowNote: 'Hanya aktiviti ketika anda di Gred DS11 dikira (Perenggan 6.2 nota b).',
    components: {
      pengajaran: teach(1),
      penyeliaan: ANY('Penyeliaan (pilih satu)', L('svPsm', { n: 5 }), L('svInvolved', { n: 3, label: 'Terlibat menyelia 3 pelajar Sarjana (Kerja Kursus)' }), L('svInvolvedAny', { kinds: ['sv_msc_res', 'sv_phd'], n: 1, label: 'Terlibat menyelia 1 pelajar Sarjana / PhD (Penyelidikan)' })),
      penyelidikan: ALL('Penyelidikan', grantTotal(pick([7000, 5000], f), 0, 'any'), ANY('Projek penyelidikan (pilih satu)', L('grantLed', { n: 1, ext: 0 }), L('grantMember', { n: 2 }))),
      penerbitan: scopus(1),
      kepimpinan: ALL('Kepimpinan & khidmat', lead(['kp_ajk', 'kp_pengerusi'], ['Universiti', 'Fakulti / Pusat / Akademi'], 2, 'Sekurang-kurangnya 2 penglibatan sebagai ahli jawatankuasa peringkat Universiti / Fakulti / Pusat / Akademi'), lead(['kp_ajk', 'kp_pengerusi'], KB, 1, 'Sekurang-kurangnya 1 keahlian peringkat kebangsaan / antarabangsa')),
    },
  }),
  // Perenggan 6.3 — Profesor Madya (DS14). Dikira secara kumulatif sejak dilantik di UPNM (nota a).
  DS14: (f) => ({
    windowKey: 'appointed_on',
    windowNote: 'Dikira secara kumulatif sejak tarikh lantikan anda di UPNM (Perenggan 6.3 nota a).',
    components: {
      pengajaran: teach(6),
      penyeliaan: ANY('Penyeliaan (pilih satu)', sv({ phdMain: 1 }), sv({ mscRes: 2 }), sv({ mscRes: 1, phdCo: 1 }), sv({ mscRes: 1, kk: 3 })),
      penyelidikan: ALL('Penyelidikan', grantTotal(pick([100000, 50000, 100000], f), pick([20000, 5000, 20000], f)), grantLed(pick([3, 2, 3], f), 1)),
      penerbitan: ALL('Penerbitan', hIdx(pick([3, 2, 3], f)), ANY('Artikel SCOPUS (pilih satu)', scopus(pick([10, 8, 10], f)), scopusPlus(6, 4))),
      pengiktirafan: recogAny(f, { editor: 1, penilaiJurnal: 3, penilaiBuku: 1, mooc: 1, micro: 10, ucaptama: 0, penilaiKP: 0, tesis: 0, klinikal: 1 }),
      kepimpinan: ALL('Kepimpinan, khidmat & perundingan', ANY('Jawatankuasa / program pelajar (pilih satu)', lead(['kp_ajk', 'kp_pengerusi'], KB, 1, '1 keahlian jawatankuasa peringkat kebangsaan / antarabangsa'), lead(['kp_pelajar'], PERINGKAT, 2, 'Ketua 2 program pembangunan pelajar')), consult(3, 2, 1, 20000)),
    },
  }),
  // Perenggan 6.4 — Profesor Gred Khas C (VK7)
  VK7: (f) => ({
    windowKey: 'appointed_on',
    windowNote: 'Dikira secara kumulatif sejak tarikh lantikan anda di UPNM (Perenggan 6.4 nota b).',
    components: {
      pengajaran: teach(6),
      penyeliaan: ANY('Penyeliaan (pilih satu)', sv({ phdMain: 1, mscRes: 2 }), sv({ phdMain: 2 }), sv({ phdMain: 1, mscRes: 1, kk: 3 })),
      penyelidikan: ALL('Penyelidikan', grantTotal(pick([250000, 150000, 250000], f), pick([20000, 5000, 20000], f)), grantLed(5, 3)),
      penerbitan: ALL('Penerbitan', hIdx(pick([6, 4, 6], f)), ANY('Artikel SCOPUS (pilih satu)', scopus(pick([30, 20, 15], f)), scopusPlus(pick([15, 15, 10], f), pick([15, 5, 5], f)))),
      pengiktirafan: recogAny(f, { editor: 1, penilaiJurnal: 5, penilaiBuku: 2, mooc: 2, micro: 20, ucaptama: 2, penilaiKP: 2, tesis: [3, 3, 0], klinikal: 3 }),
      kepimpinan: ALL('Kepimpinan, khidmat & perundingan', ANY('Jawatankuasa / program pelajar (pilih satu)', lead(['kp_pengerusi'], KB, 1, '1 jawatan pengerusi peringkat kebangsaan / antarabangsa'), lead(['kp_ajk'], KB, 2, '2 keahlian jawatankuasa peringkat kebangsaan / antarabangsa'), lead(['kp_pelajar'], PERINGKAT, 4, 'Ketua 4 program pembangunan pelajar')), consult(5, 3, 2, 50000)),
    },
    after: 'Syarahan Ilmiah wajib selepas berjaya temuduga; pelantikan VK7 hanya disahkan untuk pergerakan gaji selepas syarahan (Perenggan 2.1(z), 6.4).',
  }),
  // Perenggan 6.5 — Profesor Gred Khas B (VK6). Kumulatif dari VK7.
  VK6: (f) => ({
    windowKey: 'vk7_since',
    windowNote: 'Dikira secara kumulatif sejak anda berada di Gred VK7 (Perenggan 6.5 nota b).',
    components: {
      pengajaran: teach(6),
      penyeliaan: ANY('Penyeliaan (pilih satu)', sv({ phdMain: 4, mscRes: 4 }), sv({ phdMain: 6 }), sv({ phdMain: 3, mscRes: 6 }), f === 2 ? sv({ phdMain: 2, phdCo: 1, mscRes: 5, kk: 3 }) : sv({ phdMain: 3, mscRes: 5, kk: 3 })),
      penyelidikan: ALL('Penyelidikan', grantTotal(pick([640000, 400000, 640000], f), pick([20000, 5000, 20000], f)), grantLed(8, 5)),
      penerbitan: ALL('Penerbitan', hIdx(pick([10, 7, 10], f)), ANY('Artikel SCOPUS (pilih satu)', scopus(pick([45, 35, 23], f)), scopusPlus(pick([23, 23, 18], f), pick([22, 12, 5], f)))),
      pengiktirafan: recogAny(f, { editor: 2, penilaiJurnal: 10, penilaiBuku: 4, mooc: 4, micro: 40, ucaptama: 4, penilaiKP: 3, tesis: [6, 6, 3], klinikal: 4 }),
      kepimpinan: ALL('Kepimpinan, khidmat & perundingan', L('adminTerms', { n: 1 }), ANY('Jawatankuasa (pilih satu)', lead(['kp_pengerusi'], KB, 2, '2 jawatan pengerusi peringkat kebangsaan / antarabangsa'), lead(['kp_ajk'], KB, 4, '4 keahlian jawatankuasa peringkat kebangsaan / antarabangsa')), consult(7, 5, 3, 100000)),
      syarahan: L('flagSyarahanPerdana'),
    },
  }),
  // Perenggan 6.6 — Profesor Gred Khas A (VK5). Kumulatif dari VK7.
  VK5: (f) => ({
    windowKey: 'vk7_since',
    windowNote: 'Dikira secara kumulatif sejak anda berada di Gred VK7 (Perenggan 6.6 nota b).',
    components: {
      pengajaran: teach(6),
      penyeliaan: ALL('Penyeliaan', ANY('Penyeliaan (pilih satu)', sv({ phdMain: 7, mscRes: 7 }), sv({ phdMain: 11 }), f === 2 ? sv({ phdMain: 4, phdCo: 3, mscRes: 6, kk: 3 }) : sv({ phdMain: 7, mscRes: 6, kk: 3 })), L('svPostdoc', { n: 1 })),
      penyelidikan: ALL('Penyelidikan', grantTotal(pick([1000000, 600000, 1000000], f), pick([20000, 5000, 20000], f)), grantLed(10, 7)),
      penerbitan: ALL('Penerbitan', hIdx(pick([15, 11, 15], f)), ANY('Artikel SCOPUS (pilih satu)', scopus(pick([60, 50, 30], f)), scopusPlus(pick([30, 30, 25], f), pick([30, 20, 5], f)))),
      pengiktirafan: recogAny(f, { editor: 4, editorScopus: true, penilaiJurnal: 15, penilaiBuku: 6, mooc: 8, micro: 80, ucaptama: 4, ucaptamaIntl: 2, penilaiKP: 6, tesis: [12, 12, 6], klinikal: 8 }),
      kepimpinan: ALL('Kepimpinan, khidmat & perundingan', L('adminTerms', { n: 2 }), ANY('Jawatankuasa (pilih satu)', lead(['kp_pengerusi'], KB, 4, '4 jawatan pengerusi peringkat kebangsaan / antarabangsa'), lead(['kp_ajk'], KB, 8, '8 keahlian jawatankuasa peringkat kebangsaan / antarabangsa')), consult(9, 7, 4, 200000)),
    },
  }),
};

// Pilihan "pengiktirafan akademik": pelbagai laluan ATAU (Perenggan 6.3–6.6). Nilai 0 / tiada = laluan itu tidak wujud bagi gred / bidang tersebut.
function recogAny(f, n) {
  const alts = [];
  const tesis = Array.isArray(n.tesis) ? n.tesis[f] : n.tesis;
  if (n.ucaptama) alts.push(recog(['ik_ucaptama'], n.ucaptama, { label: `${n.ucaptama} ucaptama peringkat kebangsaan / antarabangsa${n.ucaptamaIntl ? ` (sekurang-kurangnya ${n.ucaptamaIntl} antarabangsa)` : ''}`, levels: KB, minIntl: n.ucaptamaIntl || 0 }));
  if (n.editor) alts.push(recog(n.editorScopus ? ['ik_editor_scopus'] : ['ik_editor', 'ik_editor_scopus'], n.editor, { label: `${n.editor} editor jurnal ${n.editorScopus ? 'SCOPUS' : 'berindeks'}` }));
  if (n.penilaiJurnal) alts.push(recog(['ik_penilai_jurnal'], n.penilaiJurnal, { label: `${n.penilaiJurnal} penilai artikel jurnal berindeks` }));
  if (n.penilaiBuku) alts.push(recog(['ik_penilai_buku'], n.penilaiBuku, { label: `${n.penilaiBuku} penilai manuskrip buku / bab buku` }));
  if (n.penilaiKP) alts.push(recog(['ik_penilai_kp'], n.penilaiKP, { label: `${n.penilaiKP} penilai kenaikan pangkat Profesor Madya / Profesor` }));
  if (tesis) alts.push(recog(['ik_tesis'], tesis, { label: `${tesis} pemeriksa luar tesis` }));
  if (n.klinikal && f === 2) alts.push(recog(['ik_klinikal'], n.klinikal, { label: `${n.klinikal} pemeriksa klinikal luar` }));
  if (n.mooc) alts.push(recog(['ik_mooc'], n.mooc, { label: `${n.mooc} MOOC sebagai ketua` }));
  if (n.micro) alts.push(recog(['ik_micro'], n.micro, { label: `${n.micro} micro-credential sebagai ketua` }));
  return ANY('Pengiktirafan akademik (pilih satu)', ...alts);
}

// ---------- Syarat Umum (Perenggan 2.3.1–2.3.2) — disemak oleh Fakulti / Pejabat Pendaftar ----------
export const GENERAL_CONDITIONS = [
  { key: 'confirmed', label: 'Telah disahkan dalam perkhidmatan', ref: 'Perenggan 2.3.1(a)', help: 'gc_confirmed', by: 'sistem' },
  { key: 'permanent', label: 'Lantikan tetap', ref: 'Perenggan 2.3.4(b)', help: 'gc_permanent', by: 'sistem' },
  { key: 'lppt', label: 'Purata markah LPPT 3 tahun terkini sekurang-kurangnya 80%', ref: 'Perenggan 2.3.2(a)', help: 'gc_lppt', by: 'sistem' },
  { key: 'discipline', label: 'Bebas daripada hukuman tatatertib', ref: 'Perenggan 2.3.1(d), 2.3.5', help: 'gc_discipline', by: 'sistem' },
  { key: 'service', label: 'Tempoh perkhidmatan / kelayakan akademik mencukupi', ref: 'Perenggan 6.2 nota (c)–(e)', help: 'gc_service', by: 'sistem', onlyTo: ['DS13'] },
  { key: 'asset', label: 'Telah mengisytiharkan harta', ref: 'Perenggan 2.3.1(e)', help: 'gc_asset', by: 'pejabat' },
  { key: 'sprm', label: 'Lulus tapisan keutuhan SPRM', ref: 'Perenggan 2.3.1(f)', help: 'gc_sprm', by: 'pejabat' },
  { key: 'loan', label: 'Bebas daripada senarai peminjam pendidikan tegar', ref: 'Perenggan 2.3.1(g)', help: 'gc_loan', by: 'pejabat' },
  { key: 'dean', label: 'Diperakukan oleh Dekan / Pengarah', ref: 'Perenggan 2.3.1(c)', help: 'gc_dean', by: 'fakulti' },
  { key: 'kesepakaran', label: 'Diperakukan oleh Jawatankuasa Kesepakaran Fakulti', ref: 'Perenggan 2.3.1(c)', help: 'gc_kesepakaran', by: 'fakulti' },
];

// ---------- Proses & carta alir (Perenggan 5) ----------
// Setiap langkah: siapa bertindak, apa yang berlaku (bahasa biasa) dan perkara yang disemak oleh pentadbir.
export const STEPS = [
  { id: 'draf', no: 1, short: 'Sediakan', title: 'Calon menyediakan permohonan', who: ['Calon'], ref: 'Perenggan 5.2.1', what: 'Calon mengisi maklumat, memastikan semua syarat wajib dipenuhi dan melampirkan bukti, kemudian menghantar kepada Fakulti.', checks: [] },
  { id: 'fakulti', no: 2, short: 'Fakulti', title: 'Semakan Fakulti', who: ['Pentadbir Fakulti', 'Dekan / Pengarah', 'Jawatankuasa Kesepakaran'], ref: 'Perenggan 3.2, 3.3, 4.3, 5.2.2', what: 'Pentadbir menyemak kelengkapan; Dekan mengesahkan borang; Jawatankuasa Kesepakaran menilai permohonan (Lampiran 2) dan hanya memperakukan calon yang benar-benar layak. Bagi Profesor Madya / Profesor, Jawatankuasa mencalonkan 5 Penilai Luar.', checks: [
    { key: 'lengkap', label: 'Permohonan dan dokumen sokongan lengkap', help: 'chk_lengkap' },
    { key: 'dean', label: 'Dekan / Pengarah telah mengesahkan borang permohonan dan senarai semak', help: 'chk_dean' },
    { key: 'kesepakaran', label: 'Jawatankuasa Kesepakaran memperakukan calon (Lampiran 2)', help: 'chk_kesepakaran' },
    { key: 'minit', label: 'Minit mesyuarat Jawatankuasa Kesepakaran disertakan', help: 'chk_minit' },
  ] },
  { id: 'pendaftar', no: 3, short: 'Pendaftar', title: 'Semakan Pejabat Pendaftar', who: ['Urus Setia (Bahagian Pengurusan Sumber Manusia)'], ref: 'Perenggan 3.4, 5.2.2', what: 'Urus Setia memastikan dokumen lengkap dan mengesahkan setiap syarat umum dipenuhi sebelum dibawa ke Jawatankuasa Saringan.', checks: [
    { key: 'asset', label: 'Surat kelulusan pengisytiharan harta diterima', help: 'gc_asset' },
    { key: 'sprm', label: 'Borang tapisan keutuhan SPRM diterima dan lulus', help: 'gc_sprm' },
    { key: 'loan', label: 'Calon bebas daripada senarai peminjam pendidikan tegar', help: 'gc_loan' },
    { key: 'beban', label: 'Beban tugas akademik dan penilaian pengajaran (3 tahun / 6 semester) disertakan', help: 'chk_beban' },
  ] },
  { id: 'saringan', no: 4, short: 'Saringan', title: 'Saringan — layak ke temuduga?', who: ['Jawatankuasa Saringan'], ref: 'Perenggan 4.2, 5.3.2', what: 'Jawatankuasa Saringan menilai permohonan dan memutuskan sama ada calon layak dibawa ke sesi temuduga. Calon yang gagal dimaklumkan melalui surat.', checks: [
    { key: 'layak', label: 'Calon memenuhi syarat skim dan kriteria minimum untuk ke temuduga', help: 'chk_layak' },
  ] },
  { id: 'penilai', no: 5, short: 'Penilai Luar', title: 'Laporan Penilai Luar', who: ['Urus Setia', 'Penilai Luar'], ref: 'Perenggan 3.5, 5.3.2', what: 'Hanya untuk Profesor Madya dan Profesor: tiga (3) Penilai Luar bergred lebih tinggi menyerahkan laporan penilaian. Calon Pensyarah Kanan (DS13) melangkau langkah ini.', checks: [
    { key: 'tiga', label: 'Tiga (3) Penilai Luar telah dipilih dan memenuhi kriteria pemilihan', help: 'chk_tiga' },
    { key: 'laporan', label: 'Ketiga-tiga laporan Penilai Luar telah diterima', help: 'chk_laporan' },
  ], skipFor: (g) => !needsExternalAssessors(g) },
  { id: 'pemilih', no: 6, short: 'Pemilih', title: 'Temuduga & Jawatankuasa Pemilih', who: ['Jawatankuasa Pemilih Kenaikan Pangkat'], ref: 'Perenggan 4.1, 5.3.2', what: 'Calon dipanggil temuduga. Jawatankuasa Pemilih bersidang dan memilih calon yang layak dinaikkan pangkat (Profesor: dipengerusikan Naib Canselor; selain Profesor: Timbalan Naib Canselor Akademik & Antarabangsa).', checks: [
    { key: 'temuduga', label: 'Temuduga telah dijalankan', help: 'chk_temuduga' },
    { key: 'pilih', label: 'Jawatankuasa Pemilih memilih calon', help: 'chk_pilih' },
  ] },
  { id: 'lpu', no: 7, short: 'LPU', title: 'Kelulusan / Pemakluman LPU', who: ['Lembaga Pengarah Universiti (LPU)'], ref: 'Perenggan 5.3.3', what: 'Jawatan selain Profesor: dibawa ke mesyuarat LPU untuk pemakluman. Jawatan Profesor: dibawa ke LPU untuk pertimbangan dan kelulusan.', checks: [
    { key: 'lpu', label: 'Perkara telah dibawa ke mesyuarat LPU', help: 'chk_lpu' },
  ] },
  { id: 'syarahan', no: 8, short: 'Syarahan', title: 'Syarahan Ilmiah / Perdana', who: ['Calon'], ref: 'Perenggan 2.1(z), 5.3.3', what: 'Hanya untuk jawatan Profesor: VK7 menyampaikan Syarahan Ilmiah; VK6 / VK5 menyampaikan Syarahan Perdana. Selepas itu surat tawaran dikeluarkan.', checks: [
    { key: 'syarahan', label: 'Syarahan telah disampaikan', help: 'chk_syarahan' },
  ], skipFor: (g) => !isProfessorGrade(g) },
  { id: 'berjaya', no: 9, short: 'Selesai', title: 'Berjaya — surat tawaran dikeluarkan', who: ['Urus Setia'], ref: 'Perenggan 3.4(iii), 5.3.3', what: 'Surat tawaran kenaikan pangkat dikeluarkan kepada calon.', checks: [], final: true },
];
export const STEP = Object.fromEntries(STEPS.map((s) => [s.id, s]));
// Urutan langkah sebenar bagi sesuatu gred sasaran (melangkau yang tidak berkaitan).
export const stepsFor = (toGrade) => STEPS.filter((s) => !(s.skipFor && s.skipFor(toGrade)));
export const nextStepId = (toGrade, cur) => { const seq = stepsFor(toGrade).map((s) => s.id); const i = seq.indexOf(cur); return i >= 0 && i < seq.length - 1 ? seq[i + 1] : null; };

export const STATUS_LABEL = {
  draf: 'Draf', fakulti: 'Semakan Fakulti', pendaftar: 'Semakan Pejabat Pendaftar', saringan: 'Saringan', penilai: 'Penilai Luar', pemilih: 'Temuduga & Pemilih', lpu: 'Kelulusan LPU', syarahan: 'Syarahan', berjaya: 'Berjaya',
  tidak_berjaya: 'Tidak berjaya', rayuan: 'Rayuan sedang disemak', rayuan_berjaya: 'Rayuan berjaya', rayuan_ditolak: 'Rayuan ditolak (muktamad)', ditarik_balik: 'Kenaikan pangkat ditarik balik',
};
export const APPEAL_DAYS = 30; // Perenggan 2.7.2.1

// ---------- Penilai Luar (Perenggan 3.5) ----------
export const ASSESSOR_RULES = {
  needed: 3, nominated: 5, honorarium: { 'Dalam Negara': 'RM300', 'Luar Negara': 'USD100' },
  hIndexMin: { 'Sains & Teknologi': 10, Klinikal: 10, 'Sains Sosial': 7 }, // Perenggan 3.5.8(ii)
  checks: [
    { key: 'sameInst', label: 'Bukan dari institusi yang sama dengan calon semasa tempoh pengajian calon', help: 'as_sameInst' },
    { key: 'neverUpnm', label: 'Tidak pernah berkhidmat di UPNM dalam tempoh yang sama dengan calon', help: 'as_neverUpnm' },
    { key: 'neverSuper', label: 'Tidak pernah menjadi penyelia tesis / disertasi calon', help: 'as_neverSuper' },
    { key: 'noRelation', label: 'Bukan rakan / bekas rakan setugas calon atau pasangan penyelia tesis calon', help: 'as_noRelation' },
    { key: 'institution', label: 'Daripada institusi pengajian tinggi setaraf UPNM atau lebih tinggi', help: 'as_institution' },
  ],
};

// ---------- Jawatankuasa (Perenggan 4) — untuk paparan rujukan ----------
export const COMMITTEES = [
  { name: 'Jawatankuasa Kesepakaran Fakulti / Pusat / Akademi', chair: 'Dekan / Pengarah', members: '3 Profesor (dilantik TNC Akademik & Antarabangsa), 2 pensyarah setara/lebih tinggi dalam bidang calon, 1 wakil pengurusan fakulti', ref: 'Perenggan 4.3', role: 'Menilai dan hanya memperakukan calon yang benar-benar layak; menamakan Penilai Luar.' },
  { name: 'Jawatankuasa Saringan (selain Profesor)', chair: 'TNC (Hal Ehwal Pelajar & Alumni / Penyelidikan & Inovasi)', members: 'Dekan/Pengarah berkenaan, 2 wakil Profesor dalam Senat, Bendahari', ref: 'Perenggan 4.2.2', role: 'Memperakukan calon yang layak ke temuduga dan memberi ulasan terperinci.' },
  { name: 'Jawatankuasa Saringan (Profesor)', chair: 'TNC (Akademik & Antarabangsa)', members: 'Semua TNC, Dekan/Pengarah berkenaan, 2 wakil Profesor dalam Senat, Bendahari', ref: 'Perenggan 4.2.1', role: 'Sama seperti di atas, bagi jawatan Profesor.' },
  { name: 'Jawatankuasa Pemilih (selain Profesor)', chair: 'TNC (Akademik & Antarabangsa)', members: '2 ahli Senat, Dekan/Pengarah berkenaan', ref: 'Perenggan 4.1.2', role: 'Menimbang, memperaku dan meluluskan kenaikan pangkat; menetapkan gaji permulaan.' },
  { name: 'Jawatankuasa Pemilih (Profesor)', chair: 'Naib Canselor', members: '2 ahli Lembaga Pengarah, 2 ahli Senat, Dekan/Pengarah berkenaan', ref: 'Perenggan 4.1.1', role: 'Memperakukan kenaikan pangkat ke jawatan Profesor.' },
  { name: 'Jawatankuasa Rayuan', chair: 'Seorang daripada 4 ahli akademik berwibawa', members: 'Dilantik ad-hoc oleh Naib Canselor; berkecuali daripada proses Pemilih', ref: 'Perenggan 4.4', role: 'Menimbang rayuan calon. Keputusan muktamad.' },
];

// ---------- Soalan lazim (Panduan) — bahasa biasa ----------
export const FAQ = [
  { q: 'Apakah itu kenaikan pangkat staf akademik?', a: 'Peningkatan secara hakiki daripada satu gred ke gred yang lebih tinggi dalam skim yang sama, dengan kelulusan Lembaga / Jawatankuasa Pemilih (Perenggan 2.1(i)). Ia bukan berdasarkan kekosongan jawatan (1.6).', ref: 'Perenggan 1.6, 2.1' },
  { q: 'Siapa yang layak memohon?', a: 'Calon yang disahkan dalam perkhidmatan, lantikan tetap, purata LPPT 3 tahun terkini sekurang-kurangnya 80%, bebas hukuman tatatertib, telah mengisytiharkan harta, lulus tapisan SPRM, bebas senarai peminjam pendidikan tegar, diperakukan Dekan dan Jawatankuasa Kesepakaran, serta memenuhi syarat wajib minimum bagi gred yang dipohon.', ref: 'Perenggan 2.3' },
  { q: 'Apakah laluan gred yang dilindungi sistem ini?', a: 'Pensyarah Universiti DS11 → Pensyarah Kanan DS13 → Profesor Madya DS14 → Profesor VK7 → VK6 → VK5. (Guru Bahasa dan Pensyarah Perubatan "time-based" ada dalam Garis Panduan tetapi belum disokong dalam sistem ini.)', ref: 'Perenggan 1.3' },
  { q: 'Aktiviti manakah yang dikira?', a: 'Bagi DS13, hanya aktiviti ketika di Gred DS11. Bagi DS14 dan VK7, kumulatif sejak lantikan di UPNM. Bagi VK6 dan VK5, kumulatif sejak di Gred VK7. Penyeliaan, penyelidikan, penerbitan dan perundingan mesti berdaftar di bawah Pusat Pengurusan Penyelidikan dan Inovasi (PPI).', ref: 'Perenggan 6.2–6.6 nota' },
  { q: 'Apakah beza Geran Dalam dan Geran Luar?', a: 'Geran Dalam ialah geran UPNM yang peruntukannya diluluskan PPI. Geran Luar ialah geran industri, Kementerian Pendidikan Tinggi (KPT), agensi kerajaan dan antarabangsa.', ref: 'Perenggan 6.3 nota (b)–(c)' },
  { q: 'Apakah yang dikira sebagai perundingan?', a: 'Khidmat dalam bidang kepakaran untuk menyelesaikan masalah pihak yang melantik, berdaftar di bawah PPI, sama ada berkewangan atau tidak. TIDAK dikira: peserta/pembentang persidangan, penceramah jemputan, pemeriksa tesis, penilai kenaikan pangkat, penyunting jurnal, tenaga pengajar program eksekutif, hakim/juri, dan semua lantikan dalaman UPNM.', ref: 'Perenggan 2.1(v)' },
  { q: 'Bagaimana penerbitan bukan artikel SCOPUS dikira?', a: '1 bab buku (penulis utama, penerbit bertauliah) = 1 artikel SCOPUS; 1 buku = 3; 1 artikel WoS/ISI (utama) = 2; 1 artikel Zulfaqar (utama) = 1 (maksimum 5); 1 kertas polisi antarabangsa = 2, kebangsaan = 1; 10 penulisan popular = 1.', ref: 'Perenggan 6.7.1–6.7.2' },
  { q: 'Bagaimana penyeliaan disetarakan?', a: '1 pelajar Sarjana (Penyelidikan) bergraduat = 3 pelajar Sarjana (Kerja Kursus). 1 PhD (penyelia bersama) = 3 Sarjana (Kerja Kursus). 1 PhD (penyelia utama) = 3 Sarjana Klinikal. Tidak boleh sebaliknya.', ref: 'Perenggan 6.7.3' },
  { q: 'Berapa lama tempoh tidak layak jika pernah dihukum tatatertib?', a: 'Amaran 12 bulan, Denda 18, Lucut Hak Emolumen 24, Tangguh Pergerakan Gaji 30, Turun Gaji 36, Turun Pangkat 48 — dikira dari tarikh hukuman. Jika beberapa hukuman bertindih, tempoh berakhir apabila keseluruhannya tamat. Gunakan Kalkulator di bawah.', ref: 'Perenggan 2.3.5–2.3.8' },
  { q: 'Siapa Penilai Luar dan berapa orang diperlukan?', a: 'Hanya untuk Profesor Madya dan Profesor: 3 penilai bergred lebih tinggi (dalam / luar negara) daripada 5 yang dicalonkan Fakulti. Mesti H-Index SCOPUS sekurang-kurangnya 10 (Sains & Teknologi / Klinikal) atau 7 (Sains Sosial), bukan dari institusi sama, tidak pernah berkhidmat di UPNM, bukan penyelia tesis atau rakan setugas calon. Honorarium RM300 (dalam negara) / USD100 (luar negara).', ref: 'Perenggan 3.5' },
  { q: 'Apa yang berlaku jika permohonan tidak berjaya?', a: 'Calon dimaklumkan melalui surat. Calon yang terkilan boleh merayu secara bertulis dalam tempoh 30 hari dari tarikh keputusan dimaklumkan, melalui Ketua Jabatan. Keputusan Jawatankuasa Rayuan adalah muktamad.', ref: 'Perenggan 2.7–2.8' },
  { q: 'Bolehkah kenaikan pangkat ditarik balik?', a: 'Ya, jika terdapat kesilapan fakta yang dimaklumkan kemudian. Penyiasatan dibuat dan calon diberi peluang menjelaskan. Keputusan dimaklumkan melalui Ketua Jabatan.', ref: 'Perenggan 2.6' },
  { q: 'Apakah Syarahan Ilmiah dan Syarahan Perdana?', a: 'Syarat tambahan jawatan Profesor. Syarahan Ilmiah: VK7, selepas berjaya temuduga; gaji hanya bergerak selepas syarahan. Syarahan Perdana: VK6 / VK5; VK6 juga memerlukan Monograf yang dihasilkan ketika di VK7.', ref: 'Perenggan 2.1(z), 6.5' },
];

// ---------- Teks bantuan jenis penerbitan / lampiran ----------
export function lampiranPublication(p) {
  const utama = (p.author_role || '').startsWith('Penulis Utama');
  const ix = p.indexing || '';
  const t = p.type || '';
  if (t === 'Artikel Jurnal') { if (ix === 'WoS / ISI') return utama ? 'C1' : 'C2'; if (ix === 'SCOPUS') return utama ? 'C3' : 'C4'; return utama ? 'C5' : 'C6'; }
  if (t === 'Buku') return utama ? 'C7' : 'C8';
  if (t === 'Bab dalam Buku') return utama ? 'C9' : 'C10';
  if (t === 'Terjemahan / Suntingan Buku') return 'C11–C12';
  if (t === 'Prosiding Persidangan') { if (ix === 'SCOPUS') return utama ? 'C13' : 'C14'; if (ix === 'Tidak berindeks') return utama ? 'C17' : 'C18'; return utama ? 'C15' : 'C16'; }
  if (t === 'Laporan Teknikal') return utama ? 'C19' : 'C20';
  if (t.startsWith('Kertas Polisi')) return utama ? 'C21' : 'C22';
  if (t === 'Penulisan Ilmiah dalam Media') return utama ? 'C23' : 'C24';
  if (t === 'Penulisan Popular') return utama ? 'C25' : 'C26';
  if (t.startsWith('Modul')) return utama ? 'C27' : 'C28';
  if (t === 'Karya Kreatif') return utama ? 'C29' : 'C30';
  return 'C31';
}
export function lampiranResearch(r) {
  const led = r.role === 'Ketua Penyelidik';
  const s = r.grant_source || '';
  if (s.startsWith('Antarabangsa')) return led ? 'B5' : 'B6';
  if (s === 'Industri') return led ? 'B7' : 'B8';
  if (s.startsWith('Kementerian')) return led ? 'B9' : 'B10';
  if (s.startsWith('Universiti')) return led ? 'B11' : 'B12';
  return led ? 'B1' : 'B2';
}
export function lampiranConsult(c) {
  const fin = Number(c.amount) > 0;
  const utama = c.role === 'Perunding Utama';
  return fin ? (utama ? 'E42' : 'E43') : (utama ? 'E45' : 'E46');
}
