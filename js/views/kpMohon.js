// Wizard permohonan (empat langkah ringkas): Maklumat → Kelayakan → Aktiviti → Hantar.
import * as api from '../api.js';
import { store, myLecturer } from '../api.js';
import { html, mount, $, icon, toast, confirmDialog } from '../util.js';
import { pageHead, fieldHtml, readForm, busy } from './_ui.js';
import { helpBtn } from '../help.js';
import { evaluate, compileLampiran, windowStart } from '../promotion/engine.js';
import { gradeLabel, RULES, STEP, stepsFor } from '../promotion/guideline.js';
import { ACTIVE_STATUSES } from '../promotion/workflow.js';
import { componentCard, generalList, ring } from './kpShared.js';
import { openLampiran } from './lampiran.js';

const FIELDS = [
  { name: 'qualifications', label: 'Kelayakan akademik (cth. PhD Sains Komputer, UKM, 2019)', type: 'textarea' },
  { name: 'work_history', label: 'Pengalaman bekerja', type: 'textarea' },
  { name: 'thesis_title', label: 'Tajuk tesis PhD / Sarjana (jika ada)', type: 'text' },
  { name: 'note_candidate', label: 'Catatan kepada Fakulti (pilihan)', type: 'textarea' },
];
const TITLES = ['Maklumat anda', 'Semak kelayakan', 'Aktiviti anda', 'Hantar'];

export async function render(root) {
  const lec = myLecturer();
  const ev = evaluate(lec, store, { today: new Date() });
  if (!ev.ok) { location.hash = '#/kp'; return; }
  const running = store.promotion_applications.find((a) => a.lecturer_id === lec.id && ACTIVE_STATUSES.includes(a.status) && a.status !== 'draf');
  if (running) { location.hash = '#/kp/' + running.id; return; }
  let draft = store.promotion_applications.find((a) => a.lecturer_id === lec.id && a.status === 'draf');
  if (!draft) { try { draft = await api.promoSave({}); } catch (e) { toast(e.message, 'err'); location.hash = '#/kp'; return; } }
  let step = 0;

  const start = (() => { try { return windowStart(lec, RULES[ev.to](0).windowKey); } catch { return 0; } })();
  const draw = () => {
    const s = ev.summary;
    const stepper = html`<div class="wiz-steps" aria-label="Langkah permohonan">${TITLES.map((t, i) => html`<div class="w ${i === step ? 'cur' : i < step ? 'done' : ''}" ${i === step ? html`aria-current="step"` : ''}><b>${i < step ? icon('check', 14) : i + 1}</b>${t}</div>`)}</div>`;
    let body;
    if (step === 0) body = html`<section class="card"><h3>Maklumat anda</h3><p class="small muted" style="margin:-6px 0 14px">Ruang ini akan dicetak dalam borang. Anda boleh kosongkan dan lengkapkan kemudian — draf disimpan.</p><form class="form" id="wf" novalidate>${FIELDS.map((f) => fieldHtml(f, draft[f.name] || ''))}</form></section>`;
    else if (step === 1) body = html`<section class="card"><h3>Semak kelayakan ${helpBtn('verdict')}</h3><div class="row" style="gap:20px;margin-bottom:12px"><div style="background:var(--navy);border-radius:16px;padding:6px">${ring(s.pct)}</div><div><b style="font-size:18px">${s.verdictText}</b><p class="muted">${s.metCount} daripada ${s.total} bahagian dipenuhi bagi ${gradeLabel(ev.to)}.</p></div></div>
      ${s.ready ? html`<p class="badge ok" style="padding:6px 14px">Semua kriteria wajib dipenuhi</p>` : html`<div class="sandbox-flag">${icon('alert', 18)} Beberapa kriteria belum dipenuhi. Anda masih boleh menghantar, tetapi Fakulti mungkin tidak memperakukan permohonan ini. Disyorkan melengkapkan rekod dahulu.</div>`}
      <div class="grid" style="margin-top:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr))">${ev.components.map((c) => componentCard(c, { links: false }))}</div><div style="margin-top:14px">${generalList(ev.general)}</div></section>`;
    else if (step === 2) {
      const secs = compileLampiran(lec, store, start).filter((x) => x.rows.length);
      body = html`<section class="card"><h3>Aktiviti anda (dikumpul secara automatik)</h3><p class="small muted" style="margin:-6px 0 12px">Sistem mengumpul rekod dari halaman Aktiviti, Penyelidikan, Penerbitan dan Konsultansi anda mengikut kod Lampiran 1 — anda tidak perlu menaip semula. ${start ? `Hanya aktiviti mulai ${start} dikira.` : ''}</p>
        ${secs.map((x) => html`<div style="margin-bottom:12px"><b>${x.label}</b> <span class="badge mute">${x.rows.length} rekod</span><div class="small muted">${x.rows.slice(0, 4).map((r) => `${r.code}: ${r.title}`).join(' · ')}${x.rows.length > 4 ? ` · dan ${x.rows.length - 4} lagi` : ''}</div></div>`)}
        <button class="btn outline" id="pv">${icon('eye', 18)} Pratonton borang lengkap</button></section>`;
    } else {
      const next = stepsFor(ev.to).filter((x) => !['draf', 'berjaya'].includes(x.id));
      body = html`<section class="card"><h3>Hantar permohonan</h3>
        <p class="muted">Selepas dihantar, permohonan anda akan melalui langkah-langkah berikut. Anda tidak boleh mengubahnya selepas dihantar.</p>
        <ol class="steps-list" style="margin:12px 0">${next.map((x) => html`<li><b>${x.title}</b> — ${x.who.join(', ')}</li>`)}</ol>
        <label class="chk-row"><input type="checkbox" id="ack"><span>Saya mengaku bahawa semua maklumat adalah benar dan boleh dibuktikan. ${helpBtn('kp_start')}</span></label></section>`;
    }
    mount(root, html`${pageHead('Permohonan Kenaikan Pangkat', `${gradeLabel(ev.from)} → ${gradeLabel(ev.to)}`, html`<a class="btn ghost" href="#/kp">${icon('back', 18)} Kembali</a>`, '', 'kp_mohon')}${stepper}${body}
      <div class="row between" style="margin-top:18px"><div class="row"><button class="btn ghost" id="bk" ${step === 0 ? 'disabled' : ''}>${icon('back', 18)} Sebelumnya</button><button class="btn ghost" id="del" title="Padam draf ini">${icon('trash', 18)} Buang draf</button></div>${step < 3 ? html`<button class="btn primary" id="nx">Seterusnya ${icon('arrow', 18)}</button>` : html`<button class="btn primary" id="send">${icon('check', 18)} Hantar kepada Fakulti</button>`}</div>`);
    $('#bk', root).onclick = async () => { await save(); step--; draw(); };
    $('#del', root).onclick = async () => { if (await confirmDialog({ title: 'Buang draf?', message: 'Draf permohonan ini akan dipadam.' })) { await api.promoRemove(draft.id); location.hash = '#/kp'; } };
    const nx = $('#nx', root); if (nx) nx.onclick = async () => { await save(); step++; draw(); };
    const pv = $('#pv', root); if (pv) pv.onclick = () => openLampiran(lec, draft);
    const send = $('#send', root); if (send) send.onclick = async () => {
      if (!$('#ack', root).checked) { toast('Sila tandakan pengakuan dahulu.', 'err'); $('#ack', root).focus(); return; }
      busy(send, true);
      try { const r = await api.promoSubmit(draft.id, true); toast('Permohonan telah dihantar kepada Fakulti.'); location.hash = '#/kp/' + r.id; }
      catch (e) { toast(e.message, 'err'); busy(send, false, 'Hantar kepada Fakulti'); }
    };
  };
  async function save() {
    const f = $('#wf', root); if (!f) return;
    const { values, ok } = readForm(f, FIELDS); if (!ok) return;
    try { draft = await api.promoSave({ id: draft.id, ...values }); } catch (e) { toast(e.message, 'err'); }
  }
  draw();
}
