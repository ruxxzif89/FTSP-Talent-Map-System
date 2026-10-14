// Enjin semakan kelayakan kenaikan pangkat. Tulen: tiada DOM / penyimpanan. Input = rekod pensyarah; output = penjelasan bahasa biasa.
import {
  RULES, NEXT_GRADE, COMPONENT, COMPONENTS, GENERAL_CONDITIONS, PENALTY_MONTHS, CONSULT_KIND_OK, ACTIVITY_KINDS, fieldIdx, isExternalGrant,
  gradeLabel, lampiranPublication, lampiranResearch, lampiranConsult,
} from './guideline.js';

const num = (v) => Number(v) || 0;
export const rm = (n) => 'RM' + Math.round(num(n)).toLocaleString('en-US');
const yr = (v) => { const m = String(v || '').match(/(\d{4})/); return m ? +m[1] : 0; };
const isYa = (v) => String(v || '').toLowerCase() === 'ya';
const plural = (n, one) => `${n} ${one}`;

// ---------- tarikh ----------
const utc = (d) => { const x = d instanceof Date ? d : new Date(d); return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())); };
export function addMonths(date, months) { const d = utc(date); const day = d.getUTCDate(); const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1)); const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate(); r.setUTCDate(Math.min(day, last)); return r; }
export const addDays = (date, n) => { const d = utc(date); d.setUTCDate(d.getUTCDate() + n); return d; };
export const iso = (d) => utc(d).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);

// ---------- Tatatertib: tempoh tidak layak (§2.3.5–2.3.8) ----------
// Setiap hukuman → [tarikh, tarikh + tempoh - 1 hari]. Hukuman berlainan pertuduhan yang bertindih digabungkan.
export function disciplineBlocks(records, today = new Date()) {
  const periods = [];
  const byCase = new Map();
  for (const r of records || []) {
    const months = PENALTY_MONTHS[r.penalty];
    if (!months || !r.date) continue;
    const from = utc(r.date), to = addDays(addMonths(from, months), -1);
    const key = r.case_no || r.id;
    const cur = byCase.get(key);
    if (!cur || to > cur.to) byCase.set(key, { from, to, penalty: r.penalty, case_no: r.case_no, months }); // satu pertuduhan, beberapa hukuman → ambil yang lebih berat (§2.3.7)
  }
  const list = [...byCase.values()].sort((a, b) => a.from - b.from);
  const merged = []; // §2.3.8: hukuman kes lain semasa tempoh masih berjalan → sehingga keseluruhan tamat
  for (const p of list) {
    const last = merged[merged.length - 1];
    if (last && p.from <= addDays(last.to, 0)) { if (p.to > last.to) last.to = p.to; last.parts.push(p); } else merged.push({ from: p.from, to: p.to, parts: [p] });
  }
  const t = utc(today);
  const active = merged.find((m) => t >= m.from && t <= m.to) || null;
  return { periods: merged, active, blockedNow: !!active, eligibleFrom: active ? addDays(active.to, 1) : null };
}

// ---------- Tetingkap aktiviti ----------
export function windowStart(lec, key) {
  if (key === 'grade_since') return yr(lec.grade_since);
  if (key === 'appointed_on') return yr(lec.appointed_on);
  if (key === 'vk7_since') return yr(lec.vk7_since) || (lec.grade === 'VK7' ? yr(lec.grade_since) : 0);
  return 0;
}

// ---------- Konteks pengiraan ----------
function makeCtx(lec, T, start, f) {
  const mine = (t) => (T[t] || []).filter((r) => r.lecturer_id === lec.id);
  const inWin = (y) => !start || yr(y) >= start;
  const acts = mine('activities').filter((a) => inWin(a.year));
  const kindRows = (...k) => acts.filter((a) => k.includes(a.kind));
  const utamaRole = (a) => String(a.role || '').includes('Utama');
  const grad = (a) => isYa(a.graduated);

  // penyeliaan
  const sv = {
    phdMain: kindRows('sv_phd').filter((a) => utamaRole(a) && grad(a)),
    phdCo: kindRows('sv_phd').filter((a) => !utamaRole(a) && grad(a)),
    mscRes: kindRows('sv_msc_res').filter((a) => utamaRole(a) && grad(a)),
    kk: kindRows('sv_msc_kk').filter((a) => utamaRole(a) && grad(a)),
    psm: kindRows('sv_psm').filter(grad),
    postdoc: kindRows('sv_postdoc'),
    kkInvolved: kindRows('sv_msc_kk'),
    resInvolved: kindRows('sv_msc_res', 'sv_phd'),
  };

  // penerbitan (hanya yang "Diterbitkan")
  const pubs = mine('publications').filter((p) => inWin(p.year) && p.status === 'Diterbitkan');
  const utamaPub = (p) => String(p.author_role || '').startsWith('Penulis Utama');
  const scopusMain = pubs.filter((p) => p.type === 'Artikel Jurnal' && p.indexing === 'SCOPUS' && utamaPub(p));
  const equiv = []; // {pub, units, why}
  let zul = 0;
  for (const p of pubs) {
    if (!utamaPub(p)) continue;
    if (p.type === 'Artikel Jurnal' && p.indexing === 'WoS / ISI') equiv.push({ pub: p, units: 2, why: '1 artikel WoS/ISI = 2 SCOPUS' });
    else if (p.type === 'Artikel Jurnal' && p.indexing !== 'SCOPUS' && /zulfaqar/i.test(p.venue || '') && zul < 5) { zul++; equiv.push({ pub: p, units: 1, why: '1 artikel Zulfaqar = 1 SCOPUS (maks. 5)' }); }
    else if (p.type === 'Bab dalam Buku') equiv.push({ pub: p, units: 1, why: '1 bab buku = 1 SCOPUS' });
    else if (p.type === 'Buku') equiv.push({ pub: p, units: 3, why: '1 buku = 3 SCOPUS' });
    else if (p.type === 'Kertas Polisi Antarabangsa') equiv.push({ pub: p, units: 2, why: '1 kertas polisi antarabangsa = 2 SCOPUS' });
    else if (p.type === 'Kertas Polisi Kebangsaan') equiv.push({ pub: p, units: 1, why: '1 kertas polisi kebangsaan = 1 SCOPUS' });
  }
  const popular = pubs.filter((p) => p.type === 'Penulisan Popular' && utamaPub(p)).length;
  const popUnits = Math.floor(popular / 10);
  const coPubs = pubs.filter((p) => !utamaPub(p) && ((p.type === 'Artikel Jurnal' && ['SCOPUS', 'WoS / ISI'].includes(p.indexing)) || ['Buku', 'Bab dalam Buku'].includes(p.type) || (p.type === 'Prosiding Persidangan' && p.indexing === 'SCOPUS')));

  // penyelidikan
  const projects = mine('research').filter((r) => inWin(r.year) && r.status !== 'Dirancang' && isYa(r.registered_ppi));
  const led = projects.filter((r) => r.role === 'Ketua Penyelidik');
  const member = projects.filter((r) => r.role === 'Ahli');

  // perundingan (hanya yang dikira + berdaftar PPI)
  const consults = mine('consultancy').filter((c) => inWin(c.year) && (!c.kind || c.kind === CONSULT_KIND_OK) && isYa(c.registered_ppi));
  const consUtama = consults.filter((c) => c.role === 'Perunding Utama');

  return {
    lec, start, f, sv, scopusMain, equiv, popUnits, popular, coPubs, led, member, consults, consUtama,
    teachRows: kindRows('ajar_semester').filter((a) => isYa(a.workload_met)),
    leads: kindRows('kp_ajk', 'kp_pengerusi', 'kp_pentadbiran', 'kp_pelajar'),
    recs: kindRows(...Object.keys(ACTIVITY_KINDS).filter((k) => k.startsWith('ik_'))),
  };
}

// ---------- Penilaian daun ----------
const res = (met, pct, extra) => ({ met, pct: Math.max(0, Math.min(1, pct)), ...extra });
const ratio = (have, need) => (need <= 0 ? 1 : Math.min(1, have / need));
const sug = (entity, kind, text) => ({ entity, kind, text });

const LEAVES = {
  teach(n, c) {
    const sems = new Set(c.teachRows.map((a) => a.semester || a.year)).size;
    const blended = c.teachRows.filter((a) => isYa(a.blended)).length;
    const label = n.sems <= 1 ? 'Memenuhi beban tugas pengajaran minimum dan aktif dalam pengajaran teradun (blended)' : `Memenuhi beban tugas pengajaran selama 3 tahun (${n.sems} semester) dan aktif dalam pengajaran teradun`;
    const met = sems >= n.sems && blended >= 1;
    return res(met, (ratio(sems, n.sems) + (blended >= 1 ? 1 : 0)) / 2, {
      label, detail: `${sems} semester dicatat${n.sems > 1 ? ` daripada ${n.sems}` : ''}; ${blended} kursus teradun`,
      gap: !met ? [sems < n.sems ? `Tambah ${n.sems - sems} semester beban tugas pengajaran` : null, blended < 1 ? 'Catat sekurang-kurangnya 1 kursus yang menggunakan pengajaran teradun' : null].filter(Boolean).join('; ') : '', suggest: sug('activities', 'ajar_semester', 'Tambah semester pengajaran'),
    });
  },
  svPsm(n, c) { const h = c.sv.psm.length; return res(h >= n.n, ratio(h, n.n), { label: `Selesai menyelia ${n.n} pelajar Projek Sarjana Muda`, detail: `${h} daripada ${n.n}`, gap: h < n.n ? `Tambah ${n.n - h} pelajar Projek Sarjana Muda (selesai)` : '', suggest: sug('activities', 'sv_psm', 'Tambah penyeliaan Projek Sarjana Muda') }); },
  svInvolved(n, c) { const h = c.sv.kkInvolved.length; return res(h >= n.n, ratio(h, n.n), { label: n.label, detail: `${h} daripada ${n.n}`, gap: h < n.n ? `Tambah ${n.n - h} pelajar Sarjana (Kerja Kursus)` : '', suggest: sug('activities', 'sv_msc_kk', 'Tambah penyeliaan Sarjana (Kerja Kursus)') }); },
  svInvolvedAny(n, c) { const h = c.sv.resInvolved.length; return res(h >= n.n, ratio(h, n.n), { label: n.label, detail: `${h} daripada ${n.n}`, gap: h < n.n ? 'Tambah 1 pelajar Sarjana / PhD (Penyelidikan)' : '', suggest: sug('activities', 'sv_msc_res', 'Tambah penyeliaan Sarjana (Penyelidikan)') }); },
  svVec(n, c) {
    const r = n.vec; const P = c.sv.phdMain.length, Pc = c.sv.phdCo.length, M = c.sv.mscRes.length, K = c.sv.kk.length;
    const phdSurplus = Math.max(0, P - (r.phdMain || 0));
    const coAvail = Pc + phdSurplus;
    const kkAvail = K + 3 * Math.max(0, M - (r.mscRes || 0)) + 3 * Math.max(0, coAvail - (r.phdCo || 0)); // §6.7.3: 1 Sarjana Penyelidikan = 3 Kerja Kursus; 1 PhD bersama = 3 Kerja Kursus
    const parts = []; const labelParts = []; const gaps = [];
    const add = (key, need, have, name) => { if (!need) return; parts.push(ratio(have, need)); labelParts.push(`${need} ${name}`); if (have < need) gaps.push(`${need - have} ${name}`); };
    add('phdMain', r.phdMain, P, 'pelajar PhD (penyelia utama, bergraduat)');
    add('phdCo', r.phdCo, coAvail, 'pelajar PhD (penyelia bersama / setara, bergraduat)');
    add('mscRes', r.mscRes, M, 'pelajar Sarjana Penyelidikan (penyelia utama, bergraduat)');
    add('kk', r.kk, kkAvail, 'pelajar Sarjana Kerja Kursus (bergraduat)');
    const met = parts.every((p) => p >= 1);
    const have = [`PhD utama ${P}`, r.phdCo ? `PhD bersama ${Pc}` : null, r.mscRes ? `Sarjana Penyelidikan ${M}` : null, r.kk ? `Kerja Kursus ${K}${kkAvail > K ? ` (+setara ${kkAvail - K})` : ''}` : null].filter(Boolean).join(', ');
    return res(met, parts.reduce((a, b) => a + b, 0) / parts.length, { label: labelParts.join(' + '), detail: `Anda ada: ${have}`, gap: gaps.length ? 'Tambah ' + gaps.join(' dan ') : '', suggest: sug('activities', 'sv_phd', 'Tambah penyeliaan pelajar') });
  },
  svPostdoc(n, c) { const h = c.sv.postdoc.length; return res(h >= n.n, ratio(h, n.n), { label: 'Penyelia utama kepada seorang Post-Doktoral', detail: `${h} daripada ${n.n}`, gap: h < n.n ? 'Tambah penyeliaan Post-Doktoral' : '', suggest: sug('activities', 'sv_postdoc', 'Tambah penyeliaan Post-Doktoral') }); },
  grantTotal(n, c) {
    const pool = n.role === 'led' ? c.led : [...c.led, ...c.member];
    const used = pool.filter((r) => num(r.amount) >= (n.per || 0) && num(r.amount) > 0);
    const have = used.reduce((a, r) => a + num(r.amount), 0);
    return res(have >= n.total, ratio(have, n.total), {
      label: `Jumlah nilai geran ${n.role === 'led' ? 'sebagai Ketua Penyelidik' : 'sebagai Penyelidik Utama / Bersama'} sekurang-kurangnya ${rm(n.total)}${n.per ? ` (setiap geran sekurang-kurangnya ${rm(n.per)})` : ''}`,
      detail: `${rm(have)} daripada ${rm(n.total)}`, gap: have < n.total ? `Tambah nilai geran sebanyak ${rm(n.total - have)}` : '', suggest: sug('research', null, 'Tambah projek penyelidikan'),
    });
  },
  grantLed(n, c) {
    const h = c.led.length, e = c.led.filter((r) => isExternalGrant(r.grant_source)).length;
    const met = h >= n.n && e >= (n.ext || 0);
    return res(met, (ratio(h, n.n) + ratio(e, n.ext || 0)) / 2, {
      label: `Mengetuai sekurang-kurangnya ${n.n} projek penyelidikan${n.ext ? `, ${n.ext} daripadanya geran luar` : ''}`, detail: `${h} projek diketuai${n.ext ? `, ${e} geran luar` : ''}`,
      gap: !met ? [h < n.n ? `Ketuai ${n.n - h} lagi projek` : null, e < (n.ext || 0) ? `${(n.ext || 0) - e} lagi mesti geran luar` : null].filter(Boolean).join('; ') : '', suggest: sug('research', null, 'Tambah projek penyelidikan'),
    });
  },
  grantMember(n, c) { const h = c.member.length; return res(h >= n.n, ratio(h, n.n), { label: `Terlibat dengan ${n.n} projek penyelidikan sebagai Penyelidik Bersama`, detail: `${h} daripada ${n.n}`, gap: h < n.n ? `Libatkan diri dalam ${n.n - h} lagi projek` : '', suggest: sug('research', null, 'Tambah projek penyelidikan') }); },
  hIndex(n, c) { const h = num(c.lec.scopus_h_index); return res(h >= n.n, ratio(h, n.n), { label: `H-indeks SCOPUS sekurang-kurangnya ${n.n}`, detail: `H-indeks anda: ${h}`, gap: h < n.n ? `H-indeks perlu naik ${n.n - h} lagi (kemas kini dalam Profil jika sudah meningkat)` : '', suggest: sug('profile', null, 'Kemas kini H-indeks') }); },
  scopusMain(n, c) {
    const pure = c.scopusMain.length; const eqUnits = c.equiv.reduce((a, e) => a + e.units, 0) + c.popUnits; const h = pure + eqUnits;
    return res(h >= n.n, ratio(h, n.n), { label: `Sekurang-kurangnya ${n.n} artikel jurnal SCOPUS (penulis utama / corresponding)`, detail: `${pure} artikel SCOPUS${eqUnits ? ` + ${eqUnits} setara (buku, bab, WoS, dsb.)` : ''} = ${h}`, gap: h < n.n ? `Tambah ${n.n - h} artikel SCOPUS (penulis utama)` : '', suggest: sug('publications', null, 'Tambah penerbitan') });
  },
  scopusPlus(n, c) {
    const pure = c.scopusMain.length; const others = Math.max(0, pure - n.n) + c.equiv.length + c.popUnits + c.coPubs.length;
    const met = pure >= n.n && others >= n.others;
    return res(met, (ratio(pure, n.n) + ratio(others, n.others)) / 2, { label: `${n.n} artikel SCOPUS (penulis utama) DAN ${n.others} penerbitan setara / sebagai penulis bersama`, detail: `${pure} artikel SCOPUS; ${others} penerbitan setara / bersama`, gap: !met ? [pure < n.n ? `${n.n - pure} lagi artikel SCOPUS (utama)` : null, others < n.others ? `${n.others - others} lagi penerbitan setara / penulis bersama` : null].filter(Boolean).join('; ') : '', suggest: sug('publications', null, 'Tambah penerbitan') });
  },
  recog(n, c) {
    let rows = c.recs.filter((a) => n.kinds.includes(a.kind));
    if (n.levels) rows = rows.filter((a) => n.levels.includes(a.level));
    const h = rows.length; const intl = rows.filter((a) => a.level === 'Antarabangsa').length;
    const met = h >= n.n && intl >= (n.minIntl || 0);
    return res(met, (ratio(h, n.n) + (n.minIntl ? ratio(intl, n.minIntl) : 1)) / (n.minIntl ? 2 : 1), { label: n.label, detail: `${h} daripada ${n.n}${n.minIntl ? ` (${intl} antarabangsa)` : ''}`, gap: !met ? `Tambah ${Math.max(n.n - h, 0) || n.minIntl - intl} rekod` : '', suggest: sug('activities', n.kinds[0], 'Tambah pengiktirafan akademik') });
  },
  lead(n, c) {
    const rows = c.leads.filter((a) => n.kinds.includes(a.kind) && (!n.levels || n.levels.includes(a.level) || a.kind === 'kp_pelajar'));
    const h = rows.length; return res(h >= n.n, ratio(h, n.n), { label: n.label, detail: `${h} daripada ${n.n}`, gap: h < n.n ? `Tambah ${n.n - h} penglibatan` : '', suggest: sug('activities', n.kinds[0], 'Tambah kepimpinan / khidmat') });
  },
  adminTerms(n, c) { const h = c.leads.filter((a) => a.kind === 'kp_pentadbiran').reduce((a, r) => a + (num(r.terms) || 1), 0); return res(h >= n.n, ratio(h, n.n), { label: `Pernah memegang sekurang-kurangnya ${n.n} penggal jawatan pentadbiran di UPNM`, detail: `${h} penggal`, gap: h < n.n ? `Tambah ${n.n - h} penggal jawatan pentadbiran` : '', suggest: sug('activities', 'kp_pentadbiran', 'Tambah jawatan pentadbiran') }); },
  consultCount(n, c) {
    const h = c.consults.length, u = c.consUtama.length; const met = h >= n.n && u >= n.utama;
    return res(met, (ratio(h, n.n) + ratio(u, n.utama)) / 2, { label: `${n.n} projek perundingan dalam bidang kepakaran, sekurang-kurangnya ${n.utama} sebagai Perunding Utama`, detail: `${h} projek, ${u} sebagai Perunding Utama`, gap: !met ? [h < n.n ? `${n.n - h} lagi projek` : null, u < n.utama ? `${n.utama - u} lagi sebagai Perunding Utama` : null].filter(Boolean).join('; ') : '', suggest: sug('consultancy', null, 'Tambah perundingan') });
  },
  consultValue(n, c) {
    const u = c.consUtama.length; const v = c.consUtama.reduce((a, r) => a + num(r.amount), 0); const met = u >= n.utamaN && v >= n.value;
    return res(met, (ratio(u, n.utamaN) + ratio(v, n.value)) / 2, { label: `${n.utamaN} projek sebagai Perunding Utama bernilai keseluruhan sekurang-kurangnya ${rm(n.value)}`, detail: `${u} projek utama bernilai ${rm(v)}`, gap: !met ? [u < n.utamaN ? `${n.utamaN - u} lagi projek utama` : null, v < n.value ? `nilai kurang ${rm(n.value - v)}` : null].filter(Boolean).join('; ') : '', suggest: sug('consultancy', null, 'Tambah perundingan') });
  },
  flagSyarahanPerdana(n, c) { const a = isYa(c.lec.syarahan_perdana), b = isYa(c.lec.monograf); return res(a && b, (a + b) / 2, { label: 'Telah menyampaikan Syarahan Perdana dan menghasilkan Monograf semasa di Gred VK7', detail: `Syarahan Perdana: ${a ? 'Ya' : 'Belum'}; Monograf: ${b ? 'Ya' : 'Belum'}`, gap: !(a && b) ? 'Syarahan Perdana dan Monograf perlu direkodkan oleh Pejabat Pendaftar' : '', suggest: null }); },
};

function evalNode(node, c) {
  if (node.type === 'leaf') { const fn = LEAVES[node.kind]; if (!fn) throw new Error('Peraturan tidak dikenali: ' + node.kind); return { type: 'leaf', ...fn(node, c) }; }
  const kids = node.kids.map((k) => evalNode(k, c));
  if (node.type === 'all') return { type: 'all', label: node.label, met: kids.every((k) => k.met), pct: kids.reduce((a, k) => a + k.pct, 0) / kids.length, kids };
  const best = [...kids].sort((a, b) => (b.met - a.met) || (b.pct - a.pct))[0];
  return { type: 'any', label: node.label, met: kids.some((k) => k.met), pct: best ? best.pct : 0, kids, best };
}
// Kumpul "apa yang kurang" daripada cabang terbaik sahaja.
function collectGaps(n, out = []) {
  if (n.met) return out;
  if (n.type === 'leaf') { if (n.gap) out.push({ text: n.gap, suggest: n.suggest, label: n.label }); return out; }
  if (n.type === 'any') { if (n.best) collectGaps(n.best, out); return out; }
  n.kids.forEach((k) => collectGaps(k, out));
  return out;
}

// ---------- Syarat umum yang boleh disemak sistem ----------
export function generalChecks(lec, T, toGrade, today = new Date()) {
  const mine = (t) => (T[t] || []).filter((r) => r.lecturer_id === lec.id);
  const out = [];
  const defs = Object.fromEntries(GENERAL_CONDITIONS.map((g) => [g.key, g]));
  const push = (key, status, detail) => { const d = defs[key]; if (d.onlyTo && !d.onlyTo.includes(toGrade)) return; out.push({ key, label: d.label, ref: d.ref, help: d.help, by: d.by, status, detail }); };
  push('confirmed', lec.confirmed_on ? (utc(lec.confirmed_on) <= utc(today) ? 'ok' : 'fail') : 'fail', lec.confirmed_on ? `Disahkan pada ${lec.confirmed_on}` : 'Tarikh pengesahan belum direkodkan (hubungi Pejabat Pendaftar)');
  push('permanent', !lec.employment || lec.employment === 'Tetap' ? 'ok' : 'fail', lec.employment ? `Jenis lantikan: ${lec.employment}` : 'Dianggap lantikan tetap');
  const scores = mine('lppt_scores').sort((a, b) => num(b.year) - num(a.year)).slice(0, 3);
  const avg = scores.length ? scores.reduce((a, s) => a + num(s.score), 0) / scores.length : 0;
  push('lppt', scores.length >= 3 && avg >= 80 ? 'ok' : 'fail', scores.length ? `Purata ${avg.toFixed(1)}% bagi ${scores.length} tahun (${scores.map((s) => `${s.year}: ${s.score}%`).join(', ')})${scores.length < 3 ? ' — perlu 3 tahun' : ''}` : 'Markah LPPT belum direkodkan');
  const disc = disciplineBlocks(mine('disciplinary'), today);
  push('discipline', disc.blockedNow ? 'fail' : 'ok', disc.blockedNow ? `Tidak layak sehingga ${iso(disc.active.to)} (boleh dipertimbangkan semula mulai ${iso(disc.eligibleFrom)})` : (mine('disciplinary').length ? 'Tempoh hukuman lepas telah tamat' : 'Tiada rekod hukuman'));
  if (toGrade === 'DS13') {
    const yrsGrade = lec.grade_since ? (utc(today) - utc(lec.grade_since)) / (365.25 * 864e5) : 0;
    const yrsServe = lec.appointed_on ? (utc(today) - utc(lec.appointed_on)) / (365.25 * 864e5) : 0;
    let st = 'fail', d;
    if (isYa(lec.has_phd)) { st = 'ok'; d = 'Memiliki PhD (layak dipertimbangkan jika syarat wajib dipenuhi)'; }
    else if (isYa(lec.has_prof_qual)) { st = yrsServe >= 10 ? 'ok' : 'fail'; d = `Tiada PhD tetapi ada kelayakan profesional: perlu 10 tahun perkhidmatan (anda ${yrsServe.toFixed(1)} tahun)`; }
    else { st = yrsGrade >= 12 ? 'ok' : 'fail'; d = `Tiada PhD: perlu 12 tahun di Gred DS11 (anda ${yrsGrade.toFixed(1)} tahun)`; }
    push('service', st, d);
  }
  for (const k of ['asset', 'sprm', 'loan', 'dean', 'kesepakaran']) push(k, 'info', 'Disahkan oleh ' + (defs[k].by === 'pejabat' ? 'Pejabat Pendaftar' : 'Fakulti') + ' semasa proses permohonan');
  return out;
}

// ---------- Fungsi utama ----------
export function evaluate(lec, T, opts = {}) {
  const today = opts.today || new Date();
  const from = lec.grade; const to = opts.to || NEXT_GRADE[from];
  if (!from || !GRADES_OK(from)) return { ok: false, reason: 'no_grade', message: 'Gred semasa anda belum ditetapkan oleh Pentadbir (Maklumat Perkhidmatan).' };
  if (!to || !RULES[to]) return { ok: false, reason: 'top', message: 'Anda sudah berada di gred tertinggi dalam laluan ini.' };
  const field = opts.field || lec.field || 'Sains & Teknologi';
  const f = fieldIdx(field);
  const rule = RULES[to](f);
  const start = windowStart(lec, rule.windowKey);
  const ctx = makeCtx(lec, T, start, f);
  const comps = Object.entries(rule.components).map(([key, node]) => {
    const r = evalNode(node, ctx); const meta = COMPONENT[key] || { label: key, icon: 'file' };
    const status = r.met ? 'met' : r.pct >= 0.5 ? 'partial' : 'unmet';
    return { key, label: meta.label, icon: meta.icon, help: meta.help, node: r, status, pct: r.pct, gaps: collectGaps(r) };
  });
  const general = generalChecks(lec, T, to, today);
  const sysFail = general.filter((g) => g.status === 'fail');
  const met = comps.filter((c) => c.status === 'met').length;
  const pct = comps.reduce((a, c) => a + c.pct, 0) / comps.length;
  const ready = met === comps.length && sysFail.length === 0;
  const verdict = ready ? 'ready' : met === comps.length ? 'conditions' : (pct >= 0.85 || (met >= comps.length - 1 && pct >= 0.7)) ? 'near' : 'far';
  const verdictText = { ready: 'Bersedia untuk memohon', conditions: 'Kriteria dipenuhi — syarat umum belum lengkap', near: 'Hampir bersedia', far: 'Belum bersedia' }[verdict];
  return {
    ok: true, from, to, field, fieldIdx: f, window: { start, note: rule.windowNote, key: rule.windowKey }, after: rule.after || '', components: comps, general,
    summary: { metCount: met, total: comps.length, pct, ready, verdict, verdictText, sysFail: sysFail.length },
    gaps: comps.flatMap((c) => c.gaps.map((g) => ({ ...g, comp: c.key, compLabel: c.label }))),
  };
}
const GRADES_OK = (g) => !!NEXT_GRADE[g] || g === 'VK5';

// Ringkasan pantas untuk senarai pensyarah (pentadbir)
export function quickReadiness(lec, T, today) {
  try { const r = evaluate(lec, T, { today }); return r.ok ? { ok: true, pct: r.summary.pct, verdict: r.summary.verdict, text: r.summary.verdictText, to: r.to, met: r.summary.metCount, total: r.summary.total } : { ok: false, text: r.message }; } catch (e) { return { ok: false, text: 'Tidak dapat dikira' }; }
}

// ---------- Lampiran 1 Bahagian B: kumpul aktiviti mengikut komponen & kod ----------
export function compileLampiran(lec, T, startYear = 0) {
  const mine = (t) => (T[t] || []).filter((r) => r.lecturer_id === lec.id && (!startYear || yr(r.year || r.issue_date || r.date) >= startYear));
  const sections = [
    { key: 'pengajaran', label: 'PENGAJARAN', rows: [] }, { key: 'penyeliaan', label: 'PENYELIAAN', rows: [] }, { key: 'penyelidikan', label: 'PENYELIDIKAN', rows: [] },
    { key: 'penerbitan', label: 'PENERBITAN', rows: [] }, { key: 'pengiktirafan', label: 'PENGIKTIRAFAN AKADEMIK', rows: [] }, { key: 'kepimpinan', label: 'KEPIMPINAN AKADEMIK, KHIDMAT KEPADA UNIVERSITI DAN MASYARAKAT', rows: [] }, { key: 'perundingan', label: 'PERUNDINGAN', rows: [] },
  ];
  const by = Object.fromEntries(sections.map((s) => [s.key, s]));
  for (const a of mine('activities')) { const k = ACTIVITY_KINDS[a.kind]; if (!k) continue; (by[k.comp] || by.kepimpinan).rows.push({ code: k.lampiran, title: a.title || a.student || k.label, extra: [k.label, a.role, a.level, a.graduated === 'Ya' ? 'Bergraduat' : '', a.semester].filter(Boolean).join(' · '), year: a.year }); }
  for (const r of mine('research')) by.penyelidikan.rows.push({ code: lampiranResearch(r), title: r.title, extra: [r.role, r.grant_source, r.amount ? rm(r.amount) : '', r.status].filter(Boolean).join(' · '), year: r.year });
  for (const p of mine('publications')) by.penerbitan.rows.push({ code: lampiranPublication(p), title: p.title, extra: [p.type, p.venue, p.indexing, p.author_role, p.status].filter(Boolean).join(' · '), year: p.year });
  for (const c of mine('consultancy')) by.perundingan.rows.push({ code: lampiranConsult(c), title: c.project, extra: [c.role, c.client, c.amount ? rm(c.amount) : 'tanpa kewangan'].filter(Boolean).join(' · '), year: c.year });
  if (num(lec.scopus_h_index)) by.penerbitan.rows.push({ code: 'C33', title: 'H-indeks SCOPUS', extra: String(lec.scopus_h_index), year: '' });
  for (const s of sections) s.rows.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }) || num(b.year) - num(a.year));
  return sections;
}
export { gradeLabel };
