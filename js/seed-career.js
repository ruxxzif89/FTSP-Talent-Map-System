// Data contoh kenaikan pangkat — ditambah SELEPAS penjana asas (js/seed.js) supaya data asas tidak berubah.
// Memberi: maklumat perkhidmatan, LPPT, tatatertib, aktiviti akademik, medan baharu pada penyelidikan/penerbitan/perundingan,
// serta beberapa permohonan pada pelbagai langkah (termasuk empat watak demo yang ditetapkan).
import { NEXT_GRADE, GRANT_SOURCES, CONSULT_KIND_OK, stepsFor, APPEAL_DAYS, isProfessorGrade } from './promotion/guideline.js';

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const NOW = new Date();
const Y = NOW.getFullYear();
const dstr = (d) => new Date(d).toISOString().slice(0, 10);
const daysAgo = (n) => dstr(new Date(NOW.getTime() - n * 864e5));
const yearsAgo = (n, m = 1, d = 1) => `${Y - n}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const RANK = { DS11: 1, DS13: 2, DS14: 3, VK7: 4, VK6: 5 };
const POS_GRADE = { Pensyarah: 'DS11', 'Pensyarah Kanan': 'DS13', 'Profesor Madya': 'DS14', Profesor: 'VK7' };
const SCOPUS_TITLES = ['Pendekatan Pembelajaran Mesin untuk', 'Model Selamat bagi', 'Kajian Perbandingan', 'Rangka Kerja Pengesanan', 'Analisis Prestasi'];
const OUTSIDE = [['Prof. Dr. Lee Chong Wei', 'Universiti Malaya', 'Dalam Negara', 'Profesor', 22], ['Prof. Dr. Azlan Shah', 'Universiti Kebangsaan Malaysia', 'Dalam Negara', 'Profesor', 18], ['Prof. Dr. Rajesh Kumar', 'National University of Singapore', 'Luar Negara', 'Profesor', 31], ['Prof. Dr. Noraini Hashim', 'Universiti Sains Malaysia', 'Dalam Negara', 'Profesor', 15], ['Prof. Dr. Ahmad Tarmizi', 'Universiti Teknologi Malaysia', 'Dalam Negara', 'Profesor', 12], ['Prof. Dr. Helen Wright', 'University of Melbourne', 'Luar Negara', 'Profesor', 27]];

export function addCareerData(out, { id, iso, prefix = '' }) {
  const r = rng(777);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const stamp = (d) => ({ created_at: iso(d), updated_at: iso(Math.max(0, d - 2)) });
  const T = (name) => out[name] || (out[name] = []);
  ['activities', 'lppt_scores', 'disciplinary', 'promotion_applications', 'promotion_events', 'promotion_assessors'].forEach(T);
  const byUser = Object.fromEntries(out.users.map((u) => [u.username, u]));
  const lecOf = (uname) => out.lecturers.find((l) => l.user_id === (byUser[uname] || {}).id);

  const act = (lid, kind, o = {}) => T('activities').push({ id: id('act'), lecturer_id: lid, kind, title: '', year: Y - 1, level: '', role: '', student: '', graduated: '', semester: '', workload_met: '', blended: '', score: '', terms: '', document_id: '', ...stamp(int(5, 120)), ...o });
  const research = (lid, o) => out.research.push({ id: id('res'), lecturer_id: lid, title: `${pick(SCOPUS_TITLES)} ${pick(['IoT', 'Pertahanan Siber', 'Data Raya', 'Sistem Autonomi'])}`, area: '', category: 'Penyelidikan Gunaan', year: Y - int(1, 6), status: 'Selesai', description: '', document_id: '', role: 'Ketua Penyelidik', grant_source: pick(GRANT_SOURCES), amount: 30000, registered_ppi: 'Ya', ...stamp(int(5, 200)), ...o });
  const pub = (lid, o) => out.publications.push({ id: id('pub'), lecturer_id: lid, title: `${pick(SCOPUS_TITLES)} ${pick(['Keselamatan Siber', 'Forensik Digital', 'Rangkaian Pintar', 'Analitik Pertahanan'])}`, type: 'Artikel Jurnal', venue: pick(['IEEE Access', 'Computers & Security', 'Jurnal Teknologi']), year: Y - int(1, 6), status: 'Diterbitkan', doi: '', document_id: '', indexing: 'SCOPUS', author_role: 'Penulis Utama / Corresponding', ...stamp(int(5, 200)), ...o });
  const cons = (lid, o) => out.consultancy.push({ id: id('con'), lecturer_id: lid, project: `Nasihat Teknikal bagi ${pick(['Sistem Kerajaan', 'Infrastruktur Kritikal', 'Rantaian Bekalan'])}`, client: pick(['Angkatan Tentera Malaysia', 'CyberSecurity Malaysia', 'Kementerian Pertahanan']), role: 'Perunding Utama', year: Y - int(1, 6), status: 'Selesai', description: '', document_id: '', amount: 20000, kind: CONSULT_KIND_OK, registered_ppi: 'Ya', ...stamp(int(5, 200)), ...o });
  const lppt = (lid, scores) => scores.forEach((s, k) => T('lppt_scores').push({ id: id('lpt'), lecturer_id: lid, year: Y - 1 - k, score: s, ...stamp(100) }));
  const sem = (k) => `${Y - 1 - Math.floor(k / 2)}/${Y - Math.floor(k / 2)} Sem ${(k % 2) + 1}`;

  // 1) Tukar nilai lama kepada nilai baharu + isi medan baharu pada rekod sedia ada
  const typeMap = { 'Kertas Persidangan': 'Prosiding Persidangan', 'Bab Buku': 'Bab dalam Buku' };
  out.publications.forEach((p) => { p.type = typeMap[p.type] || p.type; p.indexing = p.indexing || pick(['SCOPUS', 'SCOPUS', 'WoS / ISI', 'Berindeks lain', 'Tidak berindeks']); p.author_role = p.author_role || (r() < 0.65 ? 'Penulis Utama / Corresponding' : 'Penulis Bersama'); });
  out.research.forEach((x) => { x.role = x.role || (r() < 0.7 ? 'Ketua Penyelidik' : 'Ahli'); x.grant_source = x.grant_source || pick(GRANT_SOURCES); x.amount = x.amount || pick([8000, 15000, 30000, 60000, 120000]); x.registered_ppi = x.registered_ppi || 'Ya'; });
  out.consultancy.forEach((c) => { const old = c.role; c.role = old === 'Ketua Projek' || old === 'Perunding Utama' ? 'Perunding Utama' : 'Perunding Bersama'; c.amount = c.amount || pick([0, 10000, 25000, 60000]); c.kind = c.kind || CONSULT_KIND_OK; c.registered_ppi = c.registered_ppi || 'Ya'; });

  // 2) Setiap pensyarah: perkhidmatan + aktiviti mengikut kekananan
  out.lecturers.forEach((l, idx) => {
    const g = POS_GRADE[l.position];
    if (!g) { Object.assign(l, { grade: '', grade_since: '', appointed_on: yearsAgo(int(1, 5)), confirmed_on: '', vk7_since: '', field: 'Sains & Teknologi', has_phd: 'Tidak', has_prof_qual: 'Tidak', employment: 'Tetap', scopus_h_index: 0, syarahan_perdana: 'Tidak', monograf: 'Tidak' }); return; }
    const grade = g === 'VK7' && r() < 0.3 ? 'VK6' : g; const rk = RANK[grade];
    const sinceYears = { DS11: int(2, 12), DS13: int(2, 7), DS14: int(2, 7), VK7: int(3, 8), VK6: int(1, 4) }[grade];
    const appointedYears = sinceYears + { DS11: int(0, 2), DS13: int(3, 8), DS14: int(3, 8), VK7: int(4, 8), VK6: int(5, 9) }[grade];
    Object.assign(l, { grade, grade_since: yearsAgo(sinceYears, int(1, 9), int(1, 25)), appointed_on: yearsAgo(appointedYears, int(1, 9), int(1, 25)), confirmed_on: yearsAgo(appointedYears - 1, int(1, 9), int(1, 25)), vk7_since: grade === 'VK6' ? yearsAgo(sinceYears + int(2, 5)) : grade === 'VK7' ? yearsAgo(sinceYears) : '',
      field: l.department === 'Lain-lain' ? 'Sains Sosial' : 'Sains & Teknologi', has_phd: r() < 0.9 ? 'Ya' : 'Tidak', has_prof_qual: 'Tidak', employment: 'Tetap', scopus_h_index: int([0, 1, 3, 6, 10][rk - 1], [3, 5, 8, 14, 18][rk - 1]), syarahan_perdana: grade === 'VK6' ? 'Ya' : 'Tidak', monograf: grade === 'VK6' ? 'Ya' : 'Tidak' });
    const lid = l.id;
    lppt(lid, [int(80, 95), int(80, 95), int(r() < 0.12 ? 72 : 80, 95)]);
    // pengajaran
    const sems = rk === 1 ? int(1, 4) : (r() < 0.5 ? 6 : int(1, 5));
    for (let k = 0; k < sems; k++) act(lid, 'ajar_semester', { semester: sem(k), year: Y - 1 - Math.floor(k / 2), workload_met: 'Ya', blended: r() < 0.7 ? 'Ya' : 'Tidak', score: (3.6 + r() * 1.3).toFixed(1) });
    // penyeliaan
    const svN = (kind, n, o = {}) => { for (let k = 0; k < n; k++) act(lid, kind, { student: `Pelajar ${String.fromCharCode(65 + (k % 26))}. ${pick(['Ali', 'Siti', 'Lim', 'Raj', 'Aina'])}`, role: o.role || 'Penyelia Utama', graduated: o.grad === false ? 'Tidak' : 'Ya', year: Y - int(1, 6), title: 'Tesis berkaitan ' + pick(['keselamatan siber', 'analitik data', 'rangkaian IoT']) }); };
    if (rk === 1) { svN('sv_psm', int(0, 4)); svN('sv_msc_kk', int(0, 2), { role: 'Penyelia Bersama' }); }
    else if (rk === 2) { svN('sv_psm', int(2, 7)); svN('sv_msc_kk', int(0, 3)); svN('sv_msc_res', int(0, 2)); svN('sv_phd', int(0, 1), { role: 'Penyelia Bersama' }); }
    else if (rk === 3) { svN('sv_phd', int(0, 1)); svN('sv_msc_res', int(0, 3)); svN('sv_msc_kk', int(0, 3)); svN('sv_phd', int(0, 1), { role: 'Penyelia Bersama' }); }
    else { svN('sv_phd', int(0, 3)); svN('sv_msc_res', int(1, 4)); svN('sv_msc_kk', int(0, 3)); svN('sv_postdoc', rk >= 5 ? int(0, 1) : 0); }
    // pengiktirafan
    const recN = (kind, n, level) => { for (let k = 0; k < n; k++) act(lid, kind, { title: pick(['Jurnal Teknologi', 'Computers & Security', 'IEEE Access', 'Pertanika JST']), level: level || pick(['Kebangsaan', 'Antarabangsa']), year: Y - int(0, 5) }); };
    if (rk >= 2) recN('ik_penilai_jurnal', int(0, rk)); if (rk >= 3) { recN('ik_editor', int(0, 1)); recN('ik_mooc', int(0, 1)); recN('ik_ucaptama', int(0, rk - 1), pick(['Kebangsaan', 'Antarabangsa'])); recN('ik_tesis', int(0, rk)); recN('ik_penilai_kp', int(0, 2)); }
    // kepimpinan
    for (let k = 0, n = int(0, 2 + rk); k < n; k++) act(lid, 'kp_ajk', { title: pick(['Jawatankuasa Kurikulum', 'Jawatankuasa Penyelidikan', 'Jawatankuasa Disiplin Pelajar']), level: pick(['Universiti', 'Fakulti / Pusat / Akademi']), year: Y - int(0, 5) });
    for (let k = 0, n = int(0, rk - 1); k < n; k++) act(lid, 'kp_ajk', { title: pick(['Panel Dasar Siber Negara', 'Majlis Teknologi Pertahanan']), level: pick(['Kebangsaan', 'Antarabangsa']), year: Y - int(0, 5) });
    if (rk >= 3) for (let k = 0, n = int(0, rk - 1); k < n; k++) act(lid, 'kp_pengerusi', { title: 'Jawatankuasa Teknikal Kebangsaan', level: 'Kebangsaan', year: Y - int(0, 5) });
    if (rk >= 3) act(lid, 'kp_pentadbiran', { title: pick(['Timbalan Dekan', 'Ketua Jabatan']), terms: int(1, 3), year: Y - int(1, 5) });
    for (let k = 0, n = int(0, 3); k < n; k++) act(lid, 'kp_pelajar', { title: pick(['Pertandingan Kejohanan Siber', 'Program Keusahawanan Pelajar', 'Mobiliti Pelajar Antarabangsa']), year: Y - int(0, 4) });
    // penyelidikan, penerbitan, perundingan tambahan
    const nGrant = [int(0, 2), int(1, 3), int(2, 5), int(3, 7), int(6, 10)][rk - 1];
    for (let k = 0; k < nGrant; k++) research(lid, { amount: pick([8000, 15000, 25000, 40000, 70000]) * Math.max(1, Math.floor(rk / 2)), role: r() < 0.8 ? 'Ketua Penyelidik' : 'Ahli' });
    const nPub = [int(0, 3), int(2, 9), int(5, 14), int(12, 30), int(24, 50)][rk - 1];
    for (let k = 0; k < nPub; k++) pub(lid, {});
    for (let k = 0, n = int(0, Math.max(1, rk - 1)); k < n; k++) pub(lid, { type: pick(['Bab dalam Buku', 'Buku', 'Kertas Polisi Kebangsaan']), indexing: 'Tidak berindeks' });
    for (let k = 0, n = int(0, rk); k < n; k++) pub(lid, { author_role: 'Penulis Bersama' });
    const nCons = [int(0, 1), int(0, 3), int(2, 5), int(3, 8), int(5, 10)][rk - 1];
    for (let k = 0; k < nCons; k++) cons(lid, { role: r() < 0.6 ? 'Perunding Utama' : 'Perunding Bersama', amount: pick([0, 15000, 30000, 60000, 90000]) });
  });

  // 3) Tatatertib (2 contoh): seorang masih dalam tempoh, seorang sudah tamat
  const withGrade = out.lecturers.filter((l) => l.grade);
  if (withGrade[8]) T('disciplinary').push({ id: id('dis'), lecturer_id: withGrade[8].id, case_no: 'TT/2026/014', penalty: 'Amaran', date: daysAgo(120), note: 'Contoh: amaran 12 bulan — tidak layak sehingga tempoh tamat.', ...stamp(120) });
  if (withGrade[9]) T('disciplinary').push({ id: id('dis'), lecturer_id: withGrade[9].id, case_no: 'TT/2022/003', penalty: 'Denda', date: yearsAgo(3), note: 'Contoh: denda 18 bulan — sudah tamat.', ...stamp(900) });

  // 4) Watak demo yang ditetapkan (selepas penjanaan rawak supaya angka tepat)
  const reset = (lid) => { ['activities', 'lppt_scores'].forEach((t) => { out[t] = out[t].filter((x) => x.lecturer_id !== lid); }); ['research', 'publications', 'consultancy'].forEach((t) => { out[t] = out[t].filter((x) => x.lecturer_id !== lid); }); };
  const serve = (l, o) => Object.assign(l, o);

  // Dr. Aisyah — DS13 → DS14: HAMPIR bersedia (4 komponen perlu sedikit tambahan)
  const ais = lecOf('aisyah');
  if (ais) {
    reset(ais.id); serve(ais, { grade: 'DS13', grade_since: yearsAgo(5, 3, 1), appointed_on: yearsAgo(11, 2, 1), confirmed_on: yearsAgo(10, 2, 1), vk7_since: '', field: 'Sains & Teknologi', has_phd: 'Ya', employment: 'Tetap', scopus_h_index: 3, syarahan_perdana: 'Tidak', monograf: 'Tidak' });
    lppt(ais.id, [88, 86, 84]);
    for (let k = 0; k < 6; k++) act(ais.id, 'ajar_semester', { semester: sem(k), year: Y - 1 - Math.floor(k / 2), workload_met: 'Ya', blended: k % 2 ? 'Ya' : 'Tidak', score: (4.1 + (k % 3) * 0.2).toFixed(1) });
    act(ais.id, 'sv_msc_res', { student: 'Nurul Huda', role: 'Penyelia Utama', graduated: 'Ya', year: Y - 2, title: 'Pengesanan ancaman IoT dengan pembelajaran mesin' });
    act(ais.id, 'sv_msc_kk', { student: 'Amir Hakim', role: 'Penyelia Utama', graduated: 'Ya', year: Y - 2 });
    act(ais.id, 'sv_msc_kk', { student: 'Wong Mei Yee', role: 'Penyelia Utama', graduated: 'Ya', year: Y - 1 });          // 1 KK lagi diperlukan (1 Sarjana Penyelidikan + 3 KK)
    [['Penilai artikel — Computers & Security', 'Antarabangsa'], ['Penilai artikel — IEEE Access', 'Antarabangsa'], ['Penilai artikel — Jurnal Teknologi', 'Kebangsaan']].forEach(([t, lv]) => act(ais.id, 'ik_penilai_jurnal', { title: t, level: lv, year: Y - 1 }));
    act(ais.id, 'kp_ajk', { title: 'Panel Dasar Keselamatan Siber Negara', level: 'Kebangsaan', year: Y - 1 });
    [['Jawatankuasa Kurikulum FSTP', 'Fakulti / Pusat / Akademi'], ['Jawatankuasa Penyelidikan UPNM', 'Universiti']].forEach(([t, lv]) => act(ais.id, 'kp_ajk', { title: t, level: lv, year: Y - 2 }));
    research(ais.id, { title: 'Model Pengesanan Ancaman Siber untuk Persekitaran IoT', amount: 45000, grant_source: 'Kementerian (KPT)', year: Y - 3 });
    research(ais.id, { title: 'Kerangka Forensik Digital untuk Pertahanan', amount: 35000, grant_source: 'Industri', year: Y - 2 });
    research(ais.id, { title: 'Analitik Insiden Siber ATM', amount: 10000, grant_source: 'Universiti (Geran Dalam)', year: Y - 1 }); // jumlah RM90,000 (perlu RM100,000)
    for (let k = 0; k < 8; k++) pub(ais.id, { title: `Rangka Kerja ${['Pengesanan Anomali', 'Perisikan Ancaman', 'Forensik Memori', 'Keselamatan IoT'][k % 4]} (${k + 1})`, year: Y - 1 - (k % 4) });     // 8 SCOPUS utama (perlu 10)
    pub(ais.id, { title: 'Kajian Selari Keselamatan Awan', author_role: 'Penulis Bersama', year: Y - 2 });
    cons(ais.id, { project: 'Audit Keupayaan Siber Angkatan Tentera', role: 'Perunding Utama', amount: 22000, year: Y - 2 });
    cons(ais.id, { project: 'Penilaian Keselamatan Infrastruktur Kritikal', role: 'Perunding Bersama', amount: 15000, year: Y - 1 });
    cons(ais.id, { project: 'Nasihat Teknikal Pusat Operasi Siber', role: 'Perunding Bersama', amount: 0, year: Y - 1 });   // 3 projek, hanya 1 Utama (perlu 2)
  }
  // Dr. Farhana — DS13 → DS14: BERSEDIA sepenuhnya
  const far = lecOf('farhana');
  if (far) {
    reset(far.id); serve(far, { grade: 'DS13', grade_since: yearsAgo(6), appointed_on: yearsAgo(12), confirmed_on: yearsAgo(11), field: 'Sains & Teknologi', has_phd: 'Ya', employment: 'Tetap', scopus_h_index: 5 });
    lppt(far.id, [92, 90, 89]);
    for (let k = 0; k < 6; k++) act(far.id, 'ajar_semester', { semester: sem(k), year: Y - 1 - Math.floor(k / 2), workload_met: 'Ya', blended: 'Ya', score: '4.5' });
    act(far.id, 'sv_phd', { student: 'Zainal Abidin', role: 'Penyelia Utama', graduated: 'Ya', year: Y - 1, title: 'Pengesanan serangan APT' });
    [['Penilai — Computers & Security', 'Antarabangsa'], ['Penilai — IEEE Access', 'Antarabangsa'], ['Penilai — Pertanika JST', 'Kebangsaan']].forEach(([t, lv]) => act(far.id, 'ik_penilai_jurnal', { title: t, level: lv, year: Y - 1 }));
    act(far.id, 'kp_ajk', { title: 'Jawatankuasa Teknikal Siber Kebangsaan', level: 'Kebangsaan', year: Y - 1 });
    for (let k = 0; k < 3; k++) research(far.id, { amount: 50000, grant_source: k ? 'Industri' : 'Kementerian (KPT)', year: Y - 1 - k });
    for (let k = 0; k < 11; k++) pub(far.id, { year: Y - 1 - (k % 5) });
    cons(far.id, { role: 'Perunding Utama', amount: 30000, year: Y - 2 }); cons(far.id, { role: 'Perunding Utama', amount: 25000, year: Y - 1 }); cons(far.id, { role: 'Perunding Bersama', amount: 0, year: Y - 1 });
  }
  // Dr. Ahmad — DS11 → DS13: BERSEDIA
  const ahm = lecOf('ahmadz');
  if (ahm) {
    reset(ahm.id); serve(ahm, { grade: 'DS11', grade_since: yearsAgo(4), appointed_on: yearsAgo(4), confirmed_on: yearsAgo(3), field: 'Sains & Teknologi', has_phd: 'Ya', employment: 'Tetap', scopus_h_index: 2 });
    lppt(ahm.id, [86, 85, 83]);
    act(ahm.id, 'ajar_semester', { semester: sem(0), year: Y - 1, workload_met: 'Ya', blended: 'Ya', score: '4.2' });
    for (let k = 0; k < 5; k++) act(ahm.id, 'sv_psm', { student: `Pelajar PSM ${k + 1}`, graduated: 'Ya', year: Y - 1 - (k % 3) });
    act(ahm.id, 'kp_ajk', { title: 'Jawatankuasa Kurikulum', level: 'Fakulti / Pusat / Akademi', year: Y - 1 }); act(ahm.id, 'kp_ajk', { title: 'Jawatankuasa Keselamatan Makmal', level: 'Universiti', year: Y - 1 }); act(ahm.id, 'kp_ajk', { title: 'Jawatankuasa Kerja Siber Kebangsaan', level: 'Kebangsaan', year: Y - 1 });
    research(ahm.id, { amount: 12000, grant_source: 'Universiti (Geran Dalam)', year: Y - 2 }); pub(ahm.id, { year: Y - 1 });
  }
  // Prof. Dr. Harun — VK7 → VK6 (jauh daripada kriteria; menunjukkan paparan "belum bersedia")
  const har = lecOf('harun');
  if (har) serve(har, { grade: 'VK7', grade_since: yearsAgo(3), vk7_since: yearsAgo(3), appointed_on: yearsAgo(15), confirmed_on: yearsAgo(14), has_phd: 'Ya', employment: 'Tetap', scopus_h_index: 9, field: 'Sains & Teknologi' });

  // 5) Permohonan contoh pada pelbagai langkah (untuk papan kerja pentadbir)
  const apps = [];
  const mkApp = (l, status, o = {}) => {
    const from = l.grade, to = NEXT_GRADE[from]; if (!to) return null;
    const seq = stepsFor(to).map((s) => s.id);
    const created = o.created ?? 40;
    const a = { id: id('prm'), lecturer_id: l.id, from_grade: from, to_grade: to, field: l.field, status, step_since: daysAgo(o.since ?? 5), submitted_at: status === 'draf' ? '' : daysAgo(created), decision_date: o.decision || '', effective_date: o.effective || '',
      qualifications: `${Y - 14} | Ijazah Doktor Falsafah | Sains Komputer | Universiti Malaya\n${Y - 18} | Ijazah Sarjana Muda Sains Komputer | Sains Komputer | UPNM`, work_history: `${yearsAgo(10).slice(0, 4)} | Pensyarah | UPNM | ${Y - Number(yearsAgo(10).slice(0, 4))} tahun`, thesis_title: 'Pendekatan pembelajaran mesin untuk keselamatan siber', note_candidate: '', checks: '{}', appeal_reason: o.appeal || '', ...stamp(created) };
    const checks = {}; const ev = [];
    const addEv = (day, actor, role, action, f, t, note = '') => ev.push({ id: id('pev'), application_id: a.id, lecturer_id: l.id, at: new Date(NOW.getTime() - day * 864e5).toISOString(), actor, actor_role: role, action, from_status: f, to_status: t, note });
    if (status !== 'draf') {
      addEv(created, l.full_name, 'Calon', 'hantar', 'draf', 'fakulti', 'Permohonan dihantar.');
      const reach = status === 'tidak_berjaya' || status.startsWith('rayuan') ? (o.failAt || 'saringan') : status === 'berjaya' ? 'berjaya' : status;
      const stop = seq.indexOf(reach);
      let day = created;
      for (let i = 0; i < Math.max(stop, 0); i++) {
        day = Math.max(0, day - int(3, 8)); const s = seq[i]; const nx = seq[i + 1];
        if (s === 'draf') continue;
        addEv(day, pick(['Puan Rohana (Urus Setia)', 'Dekan FSTP', 'Setiausaha JK']), { fakulti: 'Dekan / JK Kesepakaran', pendaftar: 'Urus Setia', saringan: 'JK Saringan', penilai: 'Urus Setia', pemilih: 'JK Pemilih', lpu: 'LPU', syarahan: 'Calon' }[s] || 'Pentadbir', 'lulus', s, nx, '');
        (require_checks[s] || []).forEach((k) => { checks[`${s}.${k}`] = daysAgo(day); });
      }
      if (status === 'tidak_berjaya' || status.startsWith('rayuan')) addEv(o.since ?? 10, 'Setiausaha JK', 'JK Saringan', 'gagal', o.failAt || 'saringan', 'tidak_berjaya', 'Belum memenuhi kriteria minimum untuk dibawa ke temuduga.');
      if (status.startsWith('rayuan')) addEv(Math.max(0, (o.since ?? 10) - 3), l.full_name, 'Calon', 'rayuan', 'tidak_berjaya', 'rayuan', o.appeal || '');
    }
    a.checks = JSON.stringify(checks);
    out.promotion_applications.push(a); out.promotion_events.push(...ev); apps.push(a);
    return a;
  };
  const require_checks = { fakulti: ['lengkap', 'dean', 'kesepakaran', 'minit'], pendaftar: ['asset', 'sprm', 'loan', 'beban'], saringan: ['layak'], penilai: ['tiga', 'laporan'], pemilih: ['temuduga', 'pilih'], lpu: ['lpu'], syarahan: ['syarahan'] };

  const gl = (g) => withGrade.filter((l) => l.grade === g && !['aisyah', 'harun', 'farhana', 'ahmadz'].includes((out.users.find((u) => u.id === l.user_id) || {}).username));
  const ds11 = gl('DS11'), ds13 = gl('DS13'), ds14 = gl('DS14'), vk7 = gl('VK7');
  if (far) mkApp(far, 'pendaftar', { created: 18, since: 3 });                                   // Farhana: sedang disemak Pejabat Pendaftar
  if (ahm) mkApp(ahm, 'saringan', { created: 30, since: 6 });                                   // Ahmad: di Jawatankuasa Saringan
  if (ds13[0]) { mkApp(ds13[0], 'penilai', { created: 70, since: 12 }); }                       // DS13→DS14: menunggu Penilai Luar
  if (ds13[1]) mkApp(ds13[1], 'fakulti', { created: 6, since: 4 });                             // baru dihantar
  if (ds11[0]) mkApp(ds11[0], 'berjaya', { created: 140, since: 25, decision: daysAgo(25), effective: daysAgo(10) });
  if (ds11[1]) mkApp(ds11[1], 'tidak_berjaya', { created: 60, since: 8, failAt: 'saringan', decision: daysAgo(8) });   // masih dalam tempoh rayuan 30 hari
  if (ds11[2]) mkApp(ds11[2], 'rayuan', { created: 90, since: 20, failAt: 'saringan', decision: daysAgo(26), appeal: 'Saya bersetuju dengan kriteria tetapi dua penyeliaan Kerja Kursus saya belum dikira. Mohon semakan semula.' });
  if (ds14[0]) mkApp(ds14[0], 'lpu', { created: 120, since: 7 });                                // Profesor Madya → Profesor (VK7): di LPU
  if (vk7[0]) mkApp(vk7[0], 'draf', { created: 2, since: 2 });                                  // draf
  if (ds13[2]) mkApp(ds13[2], 'pemilih', { created: 100, since: 5 });

  // Penilai Luar bagi permohonan di langkah "penilai"
  const penilaiApp = apps.find((a) => a.status === 'penilai');
  if (penilaiApp) OUTSIDE.slice(0, 5).forEach(([name, inst, country, pos, h], k) => T('promotion_assessors').push({ id: id('asr'), application_id: penilaiApp.id, lecturer_id: penilaiApp.lecturer_id, name, institution: inst, country, position: pos, h_index: h, checks: JSON.stringify({ sameInst: 'Ya', neverUpnm: 'Ya', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' }), status: k < 2 ? 'Laporan diterima' : k < 3 ? 'Dipilih' : 'Dicalonkan', recommendation: k < 2 ? 'Menyokong' : '', report_note: k < 2 ? 'Calon menunjukkan rekod penyelidikan dan penerbitan yang kukuh dalam bidang keselamatan siber.' : '', ...stamp(40) }));
  return out;
}
