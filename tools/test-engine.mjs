// Ujian unit enjin kenaikan pangkat: node tools/test-engine.mjs
// Setiap ujian merujuk perenggan Garis Panduan yang diuji.
import { evaluate, disciplineBlocks, iso, addMonths } from '../js/promotion/engine.js';
import { RULES, stepsFor, nextStepId } from '../js/promotion/guideline.js';

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('  ok  ', name); } catch (e) { fail++; console.log('  GAGAL', name, '\n       ', e.message); } };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || ''} dijangka ${b}, dapat ${a}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'dijangka benar'); };

const ID = 'L1';
const lec = (o = {}) => ({ id: ID, grade: 'DS13', grade_since: '2018-01-01', appointed_on: '2012-01-01', confirmed_on: '2013-01-01', field: 'Sains & Teknologi', has_phd: 'Ya', employment: 'Tetap', scopus_h_index: 3, ...o });
let n = 0; const id = () => 'r' + ++n;
const rows = (arr, extra = {}) => arr.map((r) => ({ id: id(), lecturer_id: ID, ...extra, ...r }));
const act = (kind, o = {}) => ({ kind, year: 2023, ...o });
const pub = (o = {}) => ({ type: 'Artikel Jurnal', indexing: 'SCOPUS', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023, venue: 'X', ...o });
const grant = (o = {}) => ({ role: 'Ketua Penyelidik', grant_source: 'Industri', amount: 150000, registered_ppi: 'Ya', status: 'Selesai', year: 2022, ...o });
const lppt = rows([{ year: 2023, score: 85 }, { year: 2022, score: 82 }, { year: 2021, score: 81 }]);

console.log('Tatatertib (§2.3.5–2.3.8)');
t('contoh Garis Panduan: amaran 20 Jan 2009 + turun gaji 4 Feb 2009 → tidak layak hingga 3 Feb 2012', () => {
  const b = disciplineBlocks([{ id: 'a', case_no: 'K1', penalty: 'Amaran', date: '2009-01-20' }, { id: 'b', case_no: 'K2', penalty: 'Turun Gaji', date: '2009-02-04' }], new Date('2010-06-01'));
  eq(b.periods.length, 1, 'bilangan tempoh'); eq(iso(b.periods[0].from), '2009-01-20'); eq(iso(b.periods[0].to), '2012-02-03'); ok(b.blockedNow, 'sedang tidak layak pada 2010-06');
});
t('amaran sahaja: 12 bulan berakhir 19 Jan 2010', () => { const b = disciplineBlocks([{ id: 'a', penalty: 'Amaran', date: '2009-01-20' }], new Date('2010-01-20')); eq(iso(b.periods[0].to), '2010-01-19'); ok(!b.blockedNow); });
t('satu pertuduhan: amaran + denda → ambil yang lebih berat (denda 18 bulan) (§2.3.7)', () => {
  const b = disciplineBlocks([{ id: 'a', case_no: 'K1', penalty: 'Amaran', date: '2020-03-01' }, { id: 'b', case_no: 'K1', penalty: 'Denda', date: '2020-03-01' }], new Date('2020-04-01'));
  eq(iso(b.periods[0].to), '2021-08-31');
});
t('akhir bulan: 31 Ogos + 6 bulan tidak melimpah', () => eq(iso(addMonths('2020-08-31', 6)), '2021-02-28'));

console.log('Syarat wajib DS13 (§6.2)');
const ds13 = () => ({
  activities: rows([act('ajar_semester', { semester: '2022/23 S1', workload_met: 'Ya', blended: 'Ya' }), act('sv_psm', { graduated: 'Ya' }), act('sv_psm', { graduated: 'Ya' }), act('sv_psm', { graduated: 'Ya' }), act('sv_psm', { graduated: 'Ya' }), act('sv_psm', { graduated: 'Ya' }), act('kp_ajk', { level: 'Universiti' }), act('kp_ajk', { level: 'Fakulti / Pusat / Akademi' }), act('kp_ajk', { level: 'Kebangsaan' })]),
  research: rows([grant({ amount: 10000 })]), publications: rows([pub()]), lppt_scores: lppt, disciplinary: [],
});
t('semua kriteria DS13 dipenuhi → bersedia', () => { const r = evaluate(lec(), ds13(), { today: new Date('2025-01-01') }); ok(r.ok); eq(r.to, 'DS14' === r.to ? 'DS14' : 'DS14'); });
t('DS13 (dari DS11): semua dipenuhi', () => { const r = evaluate(lec({ grade: 'DS11' }), ds13(), { today: new Date('2025-01-01') }); eq(r.to, 'DS13'); eq(r.summary.metCount, r.summary.total, 'komponen dipenuhi'); ok(r.summary.ready, 'bersedia'); });
t('grant RM7,000 (S&T) lawan RM5,000 (Sosial)', () => {
  const T = ds13(); T.research = rows([grant({ amount: 6000 })]);
  const st = evaluate(lec({ grade: 'DS11' }), T, { today: new Date('2025-01-01') }); const ss = evaluate(lec({ grade: 'DS11', field: 'Sains Sosial' }), T, { today: new Date('2025-01-01') });
  eq(st.components.find((c) => c.key === 'penyelidikan').status === 'met', false, 'S&T RM6,000 < RM7,000'); eq(ss.components.find((c) => c.key === 'penyelidikan').status, 'met', 'Sosial RM6,000 ≥ RM5,000');
});
t('aktiviti sebelum tetingkap (sebelum masuk DS11) tidak dikira (§6.2 nota b)', () => {
  const T = ds13(); T.publications = rows([pub({ year: 2015 })]);
  const r = evaluate(lec({ grade: 'DS11', grade_since: '2018-01-01' }), T, { today: new Date('2025-01-01') });
  eq(r.components.find((c) => c.key === 'penerbitan').status === 'met', false);
});
t('tanpa PhD: perlu 12 tahun di DS11 (§6.2 nota c); dengan kelayakan profesional 10 tahun (nota e)', () => {
  const a = evaluate(lec({ grade: 'DS11', has_phd: 'Tidak', grade_since: '2018-01-01' }), ds13(), { today: new Date('2025-01-01') }); eq(a.general.find((g) => g.key === 'service').status, 'fail');
  const b = evaluate(lec({ grade: 'DS11', has_phd: 'Tidak', grade_since: '2010-01-01' }), ds13(), { today: new Date('2025-01-01') }); eq(b.general.find((g) => g.key === 'service').status, 'ok');
  const c = evaluate(lec({ grade: 'DS11', has_phd: 'Tidak', has_prof_qual: 'Ya', appointed_on: '2013-01-01' }), ds13(), { today: new Date('2025-01-01') }); eq(c.general.find((g) => g.key === 'service').status, 'ok');
});

console.log('Syarat wajib DS14 (§6.3) — penyeliaan, kesetaraan, penerbitan');
const base14 = () => ({ activities: [], research: [], publications: [], consultancy: [], lppt_scores: lppt, disciplinary: [] });
t('penyeliaan: 1 Sarjana Penyelidikan + 3 Kerja Kursus dipenuhi dengan 2 Sarjana Penyelidikan (1 = 3 KK, §6.7.3)', () => {
  const T = base14(); T.activities = rows([act('sv_msc_res', { role: 'Penyelia Utama', graduated: 'Ya' }), act('sv_msc_res', { role: 'Penyelia Utama', graduated: 'Ya' })]);
  const r = evaluate(lec({ grade: 'DS13' }), T, { today: new Date('2025-01-01') }); eq(r.components.find((c) => c.key === 'penyeliaan').status, 'met');
});
t('penyeliaan: 3 Kerja Kursus TIDAK boleh menggantikan Sarjana Penyelidikan (tidak boleh sebaliknya)', () => {
  const T = base14(); T.activities = rows([...Array(6)].map(() => act('sv_msc_kk', { role: 'Penyelia Utama', graduated: 'Ya' })));
  const r = evaluate(lec({ grade: 'DS13' }), T, { today: new Date('2025-01-01') }); ok(r.components.find((c) => c.key === 'penyeliaan').status !== 'met');
});
t('penyeliaan: 1 PhD (utama) sahaja memenuhi DS14', () => { const T = base14(); T.activities = rows([act('sv_phd', { role: 'Penyelia Utama', graduated: 'Ya' })]); eq(evaluate(lec(), T, { today: new Date('2025-01-01') }).components.find((c) => c.key === 'penyeliaan').status, 'met'); });
t('penyeliaan: pelajar belum bergraduat tidak dikira (DS14)', () => { const T = base14(); T.activities = rows([act('sv_phd', { role: 'Penyelia Utama', graduated: 'Tidak' })]); ok(evaluate(lec(), T, { today: new Date('2025-01-01') }).components.find((c) => c.key === 'penyeliaan').status !== 'met'); });
t('penerbitan DS14 S&T: 10 SCOPUS ATAU 6 + 4 setara', () => {
  const T = base14(); T.publications = rows([...Array(6)].map(() => pub()));
  let r = evaluate(lec({ scopus_h_index: 3 }), T, { today: new Date('2025-01-01') }); ok(r.components.find((c) => c.key === 'penerbitan').status !== 'met', '6 SCOPUS sahaja tidak cukup');
  T.publications.push(...rows([{ type: 'Buku', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023 }, { type: 'Bab dalam Buku', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023 }, { type: 'Bab dalam Buku', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023 }, { type: 'Bab dalam Buku', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023 }]));
  r = evaluate(lec({ scopus_h_index: 3 }), T, { today: new Date('2025-01-01') }); eq(r.components.find((c) => c.key === 'penerbitan').status, 'met', '6 SCOPUS + 4 setara');
});
t('penerbitan: 1 buku = 3 SCOPUS membantu mencapai 10', () => {
  const T = base14(); T.publications = rows([...Array(7)].map(() => pub()).concat([{ type: 'Buku', author_role: 'Penulis Utama / Corresponding', status: 'Diterbitkan', year: 2023 }]));
  eq(evaluate(lec({ scopus_h_index: 3 }), T, { today: new Date('2025-01-01') }).components.find((c) => c.key === 'penerbitan').status, 'met');
});
t('penerbitan: H-indeks tidak mencukupi menggagalkan komponen walau artikel banyak', () => {
  const T = base14(); T.publications = rows([...Array(12)].map(() => pub()));
  ok(evaluate(lec({ scopus_h_index: 1 }), T, { today: new Date('2025-01-01') }).components.find((c) => c.key === 'penerbitan').status !== 'met');
});
t('perundingan: tidak dikira jika jenis dikecualikan atau tidak berdaftar PPI (§2.1(v))', () => {
  const T = base14(); const c = (o) => ({ project: 'P', role: 'Perunding Utama', kind: 'Perundingan dalam bidang kepakaran', registered_ppi: 'Ya', amount: 30000, year: 2023, ...o });
  T.consultancy = rows([c({}), c({ kind: 'Penceramah jemputan / kursus dalaman UPNM (tidak dikira)' }), c({ registered_ppi: 'Tidak' })]);
  const r = evaluate(lec(), T, { today: new Date('2025-01-01') }); const node = r.components.find((x) => x.key === 'kepimpinan').node;
  const consult = node.kids.find((k) => k.type === 'any' && k.kids.some((x) => x.kind === 'consultValue' || x.label?.includes('perundingan')));
  ok(consult, 'nod perundingan'); ok(consult.kids.find((k) => k.label.includes('Perunding Utama bernilai')).met, '1 projek utama ≥ RM20,000 dikira (hanya 1 sah)');
});

console.log('Laluan & proses (§5)');
t('DS13 melangkau Penilai Luar; DS14 tidak', () => { ok(!stepsFor('DS13').some((s) => s.id === 'penilai')); ok(stepsFor('DS14').some((s) => s.id === 'penilai')); });
t('Syarahan hanya untuk jawatan Profesor (VK7/VK6/VK5)', () => { ok(!stepsFor('DS14').some((s) => s.id === 'syarahan')); ok(stepsFor('VK7').some((s) => s.id === 'syarahan')); });
t('turutan langkah DS13', () => { eq(nextStepId('DS13', 'saringan'), 'pemilih'); eq(nextStepId('DS14', 'saringan'), 'penilai'); eq(nextStepId('VK7', 'lpu'), 'syarahan'); eq(nextStepId('DS14', 'lpu'), 'berjaya'); });
t('semua peraturan gred x bidang boleh dibina', () => { for (const g of Object.keys(RULES)) for (const f of [0, 1, 2]) { const r = RULES[g](f); ok(Object.keys(r.components).length >= 5, `${g}/${f}`); } });

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
