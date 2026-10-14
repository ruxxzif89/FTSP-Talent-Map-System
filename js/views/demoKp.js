// Demo berpandu Kenaikan Pangkat: simulasi dalam ingatan (data fiksyen) yang menggunakan ENJIN SEBENAR dan jadual peralihan sebenar.
// Tiga cerita: (A) permohonan lengkap DS11→DS13, (B) tidak berjaya lalu rayuan DS13→DS14, (C) bagaimana jika…
import { html, mount, $, $$, icon } from '../util.js';
import { pageHead } from './_ui.js';
import { helpBtn } from '../help.js';
import { evaluate } from '../promotion/engine.js';
import { STEP, gradeLabel, ASSESSOR_RULES, stepsFor, APPEAL_DAYS } from '../promotion/guideline.js';
import { actButtons, nextStatus, ACTOR_ROLES } from '../promotion/workflow.js';
import { demoLecturer, build, apply, ADD, SETUP_NEAR } from '../promotion/demo.js';
import { ring, ladder, stepper, timeline, statusBadge, verdictTone } from './kpShared.js';

const evt = (S, action, from, to, note, actor, role) => S.events.push({ id: 'e' + S.events.length, at: new Date(Date.now() - (30 - S.events.length) * 864e5).toISOString(), action, from_status: from, to_status: to, note: note || '', actor, actor_role: role });

// ---------- skrin biasa ----------
function evalStage(S, to = 'DS13') {
  const ev = evaluate(S.lec, S.T, { to });
  const s = ev.summary;
  const tone = { met: 'ok', partial: 'warn', unmet: 'danger' }, txt = { met: 'Dipenuhi', partial: 'Sebahagian', unmet: 'Belum' };
  const gaps = ev.gaps.slice(0, 4);
  return html`<div class="grid" style="grid-template-columns:auto 1fr;align-items:center;gap:22px"><div style="background:var(--navy);border-radius:18px;padding:12px;color:#fff;text-align:center">${ring(s.pct)}<div class="badge ${verdictTone[s.verdict]}" style="margin-top:8px">${s.verdictText}</div></div>
    <div class="stack" style="gap:8px">${ev.components.map((c) => html`<div class="row between pop-in"><span class="row" style="gap:8px">${icon(c.icon, 18)} ${c.label}</span><span class="badge ${tone[c.status]}">${txt[c.status]}</span></div>`)}</div></div>
    ${gaps.length ? html`<div style="margin-top:14px"><b class="small">Perkara yang perlu dilengkapkan:</b><ul class="steps-list" style="margin-top:6px">${gaps.map((g) => html`<li>${g.compLabel}: ${g.text}</li>`)}</ul></div>` : html`<p class="badge ok" style="margin-top:14px;padding:6px 14px">Semua kriteria wajib dipenuhi — sedia memohon</p>`}`;
}
function procStage(S, ticked) {
  const app = { to_grade: S.to, status: S.status };
  const st = STEP[S.status];
  const chk = st && st.checks ? st.checks : [];
  return html`${stepper(app, S.events)}${st ? html`<div class="card cur-card" style="margin-top:8px"><h3 style="margin-bottom:8px">${st.title} ${statusBadge(S.status)}</h3><div class="who">${st.who.map((w) => html`<span class="pill-who">${icon('user', 14)} ${w}</span>`)}</div><p class="muted" style="margin:10px 0">${st.what}</p>${chk.map((c) => html`<div class="chk-row"><input type="checkbox" disabled ${ticked ? 'checked' : ''}><label>${c.label}</label>${helpBtn(c.help)}</div>`)}</div>` : ''}`;
}
const resultStage = (S, title, text) => html`<div class="card cur-card" style="text-align:center;padding:30px"><h3 style="justify-content:center;font-size:22px;margin:6px 0">${title}</h3><p class="muted">${text}</p></div><section class="card" style="margin-top:14px"><h3>Garis masa</h3>${timeline(S.events)}</section>`;

// ---------- pembina cerita ----------
const base = (keys, to) => () => ({ lec: { ...demoLecturer(), full_name: 'Dr. Aina Sofea binti Rahman' }, T: build(keys), to, status: 'draf', events: [], done: new Set() });

function advance(S, act, note, as) {
  const from = S.status; const to = nextStatus(from, act, S.to);
  evt(S, act, from, to, note, 'Pentadbir (demo)', as || (ACTOR_ROLES[from] || ['Pentadbir'])[0]); S.status = to;
}
function stepScenes(to, skip = []) {
  return stepsFor(to).filter((s) => !['draf', 'berjaya'].includes(s.id) && !skip.includes(s.id)).map((s) => {
    const btn = actButtons({ status: s.id, to_grade: to }).find((b) => b.act === 'lulus');
    return {
      title: s.title, narr: s.what, ref: s.ref,
      stage: (S) => procStage(S, S.done.has('ok')),
      acts: [{ id: 'ok', label: btn.label, run: (S) => advance(S, 'lulus', '', (ACTOR_ROLES[s.id] || [])[0]) }],
      note: `Dalam sistem sebenar, pentadbir menandakan setiap item semakan dahulu, memilih peranan yang diwakili ("Bertindak sebagai") dan menekan butang keputusan. Di sini hanya butang yang sah bagi langkah ini dipaparkan.`,
    };
  });
}

const STORY_A = {
  key: 'A', title: 'A · Permohonan lengkap (DS11 → DS13)', init: base(SETUP_NEAR, 'DS13'),
  scenes: [
    { title: 'Kenali calon', narr: 'Dr. Aina Sofea ialah Pensyarah Universiti (DS11) sejak 2019. Beliau mahu naik ke Pensyarah Kanan (DS13). Bagi DS13, hanya aktiviti ketika beliau berada di Gred DS11 dikira.', ref: 'Perenggan 1.3, 6.2 nota (b)', stage: (S) => html`${ladder('DS11', 'DS13')}<div class="kv"><div><small>Jabatan</small>${S.lec.department}</div><div><small>Dilantik</small>2019</div><div><small>Kelayakan</small>PhD</div><div><small>Bidang</small>${S.lec.field}</div></div>`, commit: () => {} },
    { title: 'Sistem menyemak kesediaan', narr: 'Daripada rekod yang sudah dimasukkan (pengajaran, penyeliaan, geran, jawatankuasa, LPPT), sistem mengira setiap bahagian. Aina belum mempunyai artikel SCOPUS dan keahlian jawatankuasa peringkat kebangsaan.', ref: 'Perenggan 6.2 · Bahagian VI', stage: (S) => evalStage(S), commit: () => {} },
    { title: 'Tambah rekod yang kurang', narr: 'Aina menekan "Tambah rekod" pada kad yang kurang. Borang terbuka dengan jenis yang betul; selepas disimpan, kesediaan dikira semula serta-merta. Cuba tekan kedua-dua butang.', ref: 'Menu Penerbitan / Aktiviti Akademik',
      stage: (S) => evalStage(S),
      acts: [{ id: 'scopus', label: ADD.scopus.label, run: (S) => apply(S.T, 'scopus') }, { id: 'jkNat', label: ADD.jkNat.label, run: (S) => apply(S.T, 'jkNat') }],
      commit: (S) => { apply(S.T, 'scopus'); apply(S.T, 'jkNat'); } },
    { title: 'Mulakan permohonan', narr: 'Apabila 100%, butang utama berubah kepada "Mulakan permohonan". Wizard hanya empat langkah ringkas — Maklumat, Kelayakan, Aktiviti (dikumpul automatik mengikut kod Lampiran) dan Hantar. Aina memberi pengakuan lalu menghantar.', ref: 'Perenggan 5.2.1',
      stage: (S) => html`<div class="wiz-steps">${['Maklumat anda', 'Semak kelayakan', 'Aktiviti anda', 'Hantar'].map((t, i) => html`<div class="w ${i === 3 ? 'cur' : 'done'}"><b>${i < 3 ? icon('check', 14) : 4}</b>${t}</div>`)}</div><div class="card"><label class="chk-row"><input type="checkbox" disabled ${S.done.has('send') ? 'checked' : ''}><span>Saya mengaku bahawa semua maklumat adalah benar dan boleh dibuktikan.</span></label>${S.status !== 'draf' ? html`<p class="badge ok" style="padding:6px 14px">Permohonan telah dihantar kepada Fakulti</p>` : ''}</div>`,
      acts: [{ id: 'send', label: 'Hantar kepada Fakulti', run: (S) => { S.status = 'fakulti'; evt(S, 'hantar', 'draf', 'fakulti', 'Permohonan dihantar kepada Fakulti.', S.lec.full_name, 'Calon'); } }],
      commit: (S) => { S.status = 'fakulti'; evt(S, 'hantar', 'draf', 'fakulti', 'Permohonan dihantar kepada Fakulti.', S.lec.full_name, 'Calon'); } },
    ...stepScenes('DS13').map((s) => ({ ...s, commit: (S) => { const b = s.acts[0]; b.run(S); } })),
    { title: 'Berjaya — surat tawaran dikeluarkan', narr: 'Surat tawaran kenaikan pangkat dikeluarkan kepada calon. Seluruh proses direkodkan dalam garis masa dengan nama dan peranan setiap pelaksana.', ref: 'Perenggan 3.4(iii), 5.3.3', stage: (S) => resultStage(S, 'Tahniah, Dr. Aina!', 'Anda kini Pensyarah Kanan (DS13).'), commit: () => {} },
  ],
};
// Pastikan langkah terakhir (LPU) menamatkan dengan berjaya
STORY_A.scenes.forEach((sc) => { if (sc.title.startsWith('Kelulusan')) sc.acts[0].label = 'Selesai — keluarkan surat tawaran'; });

const NOMINEES = [
  { n: 'Prof. Dr. Hazim', i: 'Universiti Malaya', h: 22, c: { sameInst: 'Ya', neverUpnm: 'Ya', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' } },
  { n: 'Prof. Dr. Siti Marlia', i: 'UTM', h: 18, c: { sameInst: 'Ya', neverUpnm: 'Ya', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' } },
  { n: 'Prof. Dr. Alan Tay', i: 'NUS (Singapura)', h: 30, c: { sameInst: 'Ya', neverUpnm: 'Ya', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' } },
  { n: 'Prof. Madya Dr. Rosli', i: 'UKM', h: 6, c: { sameInst: 'Ya', neverUpnm: 'Ya', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' } },
  { n: 'Prof. Dr. Zainal', i: 'UPNM (bekas)', h: 25, c: { sameInst: 'Ya', neverUpnm: 'Tidak', neverSuper: 'Ya', noRelation: 'Ya', institution: 'Ya' } },
];
const assessorStage = (S, picked) => html`<div class="tbl-wrap"><table><thead><tr><th>Calon penilai</th><th>H-indeks (min. 10)</th>${ASSESSOR_RULES.checks.map((c) => html`<th>${c.label.split(' ').slice(0, 3).join(' ')}…</th>`)}<th>Keputusan</th></tr></thead><tbody>${NOMINEES.map((x) => { const bad = x.h < 10 || Object.values(x.c).some((v) => v !== 'Ya'); return html`<tr><td><b>${x.n}</b><br><small class="faint">${x.i}</small></td><td>${x.h < 10 ? html`<span class="badge danger">${x.h}</span>` : x.h}</td>${ASSESSOR_RULES.checks.map((c) => html`<td>${x.c[c.key] === 'Ya' ? icon('check', 16) : html`<span class="badge danger">Tidak</span>`}</td>`)}<td>${bad ? html`<span class="badge danger">Tidak layak</span>` : picked ? html`<span class="badge ok">Dipilih</span>` : html`<span class="badge info">Layak</span>`}</td></tr>`; })}</tbody></table></div>`;

const STORY_B = {
  key: 'B', title: 'B · Tidak berjaya, lalu rayuan (DS13 → DS14)',
  init: () => ({ lec: { ...demoLecturer(), full_name: 'Dr. Faizal bin Hamid', grade: 'DS13' }, T: build([]), to: 'DS14', status: 'fakulti', events: [{ id: 'e0', at: new Date(Date.now() - 40 * 864e5).toISOString(), action: 'hantar', from_status: 'draf', to_status: 'fakulti', note: 'Permohonan dihantar kepada Fakulti.', actor: 'Dr. Faizal bin Hamid', actor_role: 'Calon' }], done: new Set() }),
  scenes: [
    { title: 'Calon ke Profesor Madya', narr: 'Dr. Faizal (DS13) memohon ke Profesor Madya (DS14). Bagi DS14 ke atas, proses mengandungi satu langkah tambahan: laporan Penilai Luar.', ref: 'Perenggan 3.5, 5.3', stage: (S) => html`${ladder('DS13', 'DS14')}${procStage(S, false)}`, commit: () => {} },
    { title: 'Fakulti mencalonkan Penilai Luar', narr: 'Jawatankuasa Kesepakaran mencalonkan 5 penilai bergred lebih tinggi; hanya 3 dipilih. Setiap penilai mesti memenuhi semua kriteria: H-indeks SCOPUS sekurang-kurangnya 10 (Sains & Teknologi), bukan dari institusi sama, tidak pernah berkhidmat di UPNM, bukan penyelia atau rakan setugas calon.', ref: 'Perenggan 3.5.4–3.5.8', stage: (S) => assessorStage(S, S.done.has('pilih')), acts: [{ id: 'pilih', label: 'Pilih 3 penilai yang layak', run: () => {} }], commit: () => {} },
    ...stepScenes('DS14', ['pemilih', 'lpu']).filter((x) => x.title !== 'Laporan Penilai Luar').map((s) => ({ ...s, commit: (S) => s.acts[0].run(S) })),
    { title: 'Laporan Penilai Luar', narr: 'Tiga laporan penilaian diterima. Sistem tidak membenarkan calon diteruskan ke Jawatankuasa Pemilih sehingga sekurang-kurangnya 3 laporan diterima — peraturan ini dikuatkuasakan di pelayan.', ref: 'Perenggan 3.5.7, 5.3.2', stage: (S) => html`${procStage(S, S.done.has('ok'))}<p class="small faint">Penilai 1 — Menyokong · Penilai 2 — Menyokong dengan syarat · Penilai 3 — Menyokong</p>`, acts: [{ id: 'ok', label: 'Laporan Penilai Luar lengkap — teruskan', run: (S) => advance(S, 'lulus', '3 laporan diterima', 'Urus Setia') }], commit: (S) => advance(S, 'lulus', '3 laporan diterima', 'Urus Setia') },
    { title: 'Temuduga & Jawatankuasa Pemilih', narr: 'Pada kali ini Jawatankuasa Pemilih tidak memilih calon. Keputusan direkodkan dan calon dimaklumkan melalui surat.', ref: 'Perenggan 4.1, 5.3.2', stage: (S) => procStage(S, S.done.has('no')), acts: [{ id: 'no', label: 'Tidak dipilih', run: (S) => advance(S, 'gagal', 'Tidak dipilih bagi kali ini.', 'Jawatankuasa Pemilih') }], commit: (S) => advance(S, 'gagal', 'Tidak dipilih bagi kali ini.', 'Jawatankuasa Pemilih') },
    { title: 'Calon boleh merayu dalam 30 hari', narr: 'Calon yang terkilan boleh merayu secara bertulis dalam tempoh 30 hari dari tarikh keputusan. Sistem mengira baki hari dan menutup butang rayuan selepas tempoh itu. Keputusan Jawatankuasa Rayuan adalah muktamad.', ref: 'Perenggan 2.7–2.8',
      stage: (S) => html`${procStage(S, false)}<div class="card cur-card" style="margin-top:10px"><h3>Permohonan tidak berjaya ${statusBadge(S.status)}</h3><p class="muted">Baki masa merayu: <b>${APPEAL_DAYS} hari</b> ${helpBtn('kp_appeal')}</p>${S.status === 'tidak_berjaya' ? html`<div class="fld"><label>Alasan rayuan</label><textarea class="input" rows="2" disabled>Penilai tidak mengambil kira dua geran luar yang berdaftar di PPI pada tahun 2023.</textarea></div>` : ''}</div>`,
      acts: [{ id: 'appeal', label: 'Hantar rayuan', run: (S) => { evt(S, 'rayuan', 'tidak_berjaya', 'rayuan', 'Penilai tidak mengambil kira dua geran luar yang berdaftar di PPI.', 'Dr. Faizal bin Hamid', 'Calon'); S.status = 'rayuan'; } }], commit: (S) => { evt(S, 'rayuan', 'tidak_berjaya', 'rayuan', 'Penilai tidak mengambil kira dua geran luar yang berdaftar di PPI.', 'Dr. Faizal bin Hamid', 'Calon'); S.status = 'rayuan'; } },
    { title: 'Jawatankuasa Rayuan menimbang', narr: 'Jawatankuasa Rayuan ad-hoc dilantik oleh Naib Canselor dan berkecuali daripada proses Pemilih. Mereka meluluskan rayuan; proses diteruskan oleh Urus Setia.', ref: 'Perenggan 4.4', stage: (S) => resultStage(S, S.status === 'rayuan_berjaya' ? 'Rayuan berjaya' : 'Rayuan sedang disemak', S.status === 'rayuan_berjaya' ? 'Jawatankuasa Rayuan meluluskan rayuan calon.' : 'Menunggu keputusan Jawatankuasa Rayuan.'), acts: [{ id: 'ok', label: 'Jawatankuasa Rayuan meluluskan rayuan', run: (S) => advance(S, 'rayuan_berjaya', 'Rayuan diluluskan.', 'Jawatankuasa Rayuan') }], commit: (S) => advance(S, 'rayuan_berjaya', 'Rayuan diluluskan.', 'Jawatankuasa Rayuan') },
  ],
};
const WHATIF = ['teach', 'psm', 'grant', 'scopus', 'jkUni', 'jkNat'];
const STORY_C = {
  key: 'C', title: 'C · Bagaimana jika… (cuba sendiri)', init: base(['lppt'], 'DS13'),
  scenes: [
    { title: 'Mulakan dengan rekod kosong', narr: 'Calon baharu hanya mempunyai markah LPPT. Perhatikan cincin kesediaan dan senarai "perkara yang perlu dilengkapkan".', ref: 'Perenggan 2.3.2(a)', stage: (S) => evalStage(S), commit: () => {} },
    { title: 'Tambah rekod dan lihat kesan', narr: 'Tekan mana-mana butang untuk menambah rekod. Setiap tambahan dikira semula serta-merta dengan enjin yang sama seperti sistem sebenar. Lihat bagaimana bahagian bertukar daripada "Belum" kepada "Dipenuhi".', ref: 'Bahagian VI', stage: (S) => evalStage(S),
      acts: WHATIF.map((k) => ({ id: k, label: ADD[k].label, run: (S) => apply(S.T, k) })), commit: (S) => WHATIF.forEach((k) => apply(S.T, k)), multi: true },
    { title: 'Kesimpulan', narr: 'Anda tidak perlu menghafal Garis Panduan: sistem menunjukkan apa yang perlu ditambah, dan terus membawa anda ke borang yang betul melalui butang "Tambah rekod". Apabila 100%, permohonan boleh dimulakan.', ref: '—', stage: (S) => evalStage(S), commit: () => {} },
  ],
};
const STORIES = [STORY_A, STORY_B, STORY_C];

export async function render(root) {
  let si = 0, idx = 0, doneActs = new Set(), timer = null, playing = false;
  const story = () => STORIES[si];
  const stateAt = () => {
    const S = story().init(); for (let i = 0; i < idx; i++) story().scenes[i].commit(S);
    S.done = new Set(doneActs); const sc = story().scenes[idx];
    (sc.acts || []).forEach((a) => { if (doneActs.has(a.id)) a.run(S); });
    return S;
  };
  const stop = () => { playing = false; clearTimeout(timer); };
  const go = (n) => { idx = Math.max(0, Math.min(story().scenes.length - 1, n)); doneActs = new Set(); draw(); };
  function draw() {
    const sc = story().scenes[idx], S = stateAt(), total = story().scenes.length;
    const acts = sc.acts || [];
    mount(root, html`${pageHead('Demo Berpandu Kenaikan Pangkat', 'Ikuti satu permohonan dari awal hingga akhir. Data demo hanya dalam pelayar ini dan tidak menjejaskan rekod sebenar.', html`<span class="pill-who">${icon('info', 14)} Mod demo</span>`, '', 'demo_kp')}
      <div class="demo-top"><div class="seg" role="group" aria-label="Pilih cerita">${STORIES.map((s, i) => html`<button data-s="${i}" aria-pressed="${i === si}">${s.title}</button>`)}</div><div class="row"><button class="btn ghost sm" id="play">${icon(playing ? 'pause' : 'play', 15)} ${playing ? 'Jeda' : 'Main automatik'}</button><button class="btn ghost sm" id="rs">Mula semula</button></div></div>
      <div class="demo-wrap" style="margin-top:14px"><section class="demo-narr pop-in" aria-live="polite"><span class="no">Langkah ${idx + 1} / ${total}</span><h3>${sc.title}</h3><p>${sc.narr}</p>${sc.ref ? html`<span class="ref">Rujukan Garis Panduan: ${sc.ref}</span>` : ''}</section>
      <section class="card demo-stage pop-in">${sc.stage(S)}${acts.length ? html`<div class="act-grid">${acts.map((a) => html`<button class="btn ${doneActs.has(a.id) ? 'ghost' : 'primary'}" data-act="${a.id}" ${doneActs.has(a.id) ? 'disabled' : ''}>${icon(doneActs.has(a.id) ? 'check' : 'arrow', 18)} ${a.label}</button>`)}</div>` : ''}${sc.note ? html`<p class="small faint" style="margin-top:12px">${sc.note}</p>` : ''}</section>
      <div class="row between"><button class="btn ghost" id="pv" ${idx === 0 ? 'disabled' : ''}>${icon('back', 18)} Sebelumnya</button><div class="demo-dots" role="tablist" aria-label="Langkah demo">${story().scenes.map((_, i) => html`<button data-d="${i}" class="${i === idx ? 'on' : i < idx ? 'past' : ''}" aria-label="Langkah ${i + 1}"></button>`)}</div><button class="btn primary" id="nx" ${idx === total - 1 ? 'disabled' : ''}>Seterusnya ${icon('arrow', 18)}</button></div></div>`);
    $$('[data-s]', root).forEach((b) => (b.onclick = () => { stop(); si = +b.dataset.s; idx = 0; doneActs = new Set(); draw(); }));
    $$('[data-d]', root).forEach((b) => (b.onclick = () => { stop(); go(+b.dataset.d); }));
    $$('[data-act]', root).forEach((b) => (b.onclick = () => { doneActs.add(b.dataset.act); draw(); }));
    $('#pv', root).onclick = () => { stop(); go(idx - 1); };
    $('#nx', root).onclick = () => { stop(); go(idx + 1); };
    $('#rs', root).onclick = () => { stop(); go(0); };
    $('#play', root).onclick = () => { if (playing) { stop(); draw(); } else { playing = true; draw(); tick(); } };
  }
  function tick() {
    if (!playing) return;
    const sc = story().scenes[idx]; const rest = (sc.acts || []).filter((a) => !doneActs.has(a.id));
    timer = setTimeout(() => {
      if (!playing) return;
      if (rest.length) { doneActs.add(rest[0].id); draw(); tick(); }
      else if (idx < story().scenes.length - 1) { go(idx + 1); tick(); }
      else { stop(); draw(); }
    }, rest.length ? 1800 : 3600);
  }
  draw();
  return stop;
}
