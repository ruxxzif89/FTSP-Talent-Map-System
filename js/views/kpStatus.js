// Status permohonan (pensyarah): carta proses, apa berlaku sekarang, garis masa, rayuan.
import * as api from '../api.js';
import { store, myLecturer } from '../api.js';
import { html, mount, $, icon, toast, fmtDate, openDrawer, confirmDialog } from '../util.js';
import { pageHead, fieldHtml, readForm, busy } from './_ui.js';
import { helpBtn } from '../help.js';
import { STEP, STATUS_LABEL, gradeLabel, APPEAL_DAYS } from '../promotion/guideline.js';
import { appealInfo } from '../promotion/workflow.js';
import { stepper, timeline, statusBadge } from './kpShared.js';
import { openLampiran } from './lampiran.js';

const OUTCOME = {
  tidak_berjaya: ['Permohonan tidak berjaya', 'Anda akan dimaklumkan melalui surat. Jika terkilan, anda boleh merayu secara bertulis dalam tempoh 30 hari.'],
  rayuan: ['Rayuan sedang disemak', 'Jawatankuasa Rayuan sedang menimbang rayuan anda. Keputusan mereka adalah muktamad.'],
  rayuan_berjaya: ['Rayuan berjaya', 'Jawatankuasa Rayuan meluluskan rayuan anda. Urus Setia akan menghubungi anda mengenai langkah seterusnya.'],
  rayuan_ditolak: ['Rayuan ditolak', 'Keputusan Jawatankuasa Rayuan adalah muktamad.'],
  berjaya: ['Tahniah — berjaya!', 'Surat tawaran kenaikan pangkat dikeluarkan oleh Urus Setia.'],
  ditarik_balik: ['Kenaikan pangkat ditarik balik', 'Berlaku kesilapan fakta. Anda telah / akan diberi peluang menjelaskan.'],
};

export async function render(root, { id }) {
  const lec = myLecturer();
  const app = store.promotion_applications.find((a) => a.id === id && a.lecturer_id === lec.id);
  if (!app) { mount(root, html`<div class="empty card">${icon('alert', 36)}<h3>Permohonan tidak ditemui</h3><p><a class="btn primary" href="#/kp" style="margin-top:14px">Kembali</a></p></div>`); return; }
  const events = store.promotion_events.filter((e) => e.application_id === id);
  const st = STEP[app.status]; const out = OUTCOME[app.status]; const ap = appealInfo(app);
  const days = Math.max(0, Math.floor((Date.now() - new Date(app.step_since || app.updated_at)) / 864e5));

  mount(root, html`
    ${pageHead(`Permohonan ke ${gradeLabel(app.to_grade)}`, `${gradeLabel(app.from_grade)} → ${gradeLabel(app.to_grade)}`, html`<a class="btn ghost" href="#/kp">${icon('back', 18)} Kembali</a><button class="btn ghost" id="pv">${icon('print', 18)} Borang</button>`, '', 'kp')}
    <section class="card"><h3>Carta proses ${helpBtn('kp_stepper')}</h3>${stepper(app, events)}</section>
    <div class="kp-cols" style="margin-top:18px">
      <div class="stack">
        ${out ? html`<section class="card cur-card"><h3>${out[0]} ${statusBadge(app.status)}</h3><p class="muted">${out[1]}</p>${ap.can ? html`<div class="row" style="margin-top:14px"><button class="btn primary" id="ap">${icon('edit', 18)} Hantar rayuan</button><span class="small">Baki masa merayu: <b>${ap.daysLeft} hari</b> (sehingga ${fmtDate(ap.deadline)}) ${helpBtn('kp_appeal')}</span></div>` : app.status === 'tidak_berjaya' ? html`<p class="small faint" style="margin-top:10px">Tempoh ${APPEAL_DAYS} hari untuk merayu telah tamat.</p>` : ''}${app.appeal_reason ? html`<p class="small" style="margin-top:10px"><b>Alasan rayuan anda:</b> ${app.appeal_reason}</p>` : ''}</section>`
          : app.status === 'draf' ? html`<section class="card cur-card"><h3>Draf permohonan</h3><p class="muted">Permohonan ini belum dihantar. Teruskan untuk melengkapkannya.</p><div class="row" style="margin-top:12px"><a class="btn primary" href="#/kp/mohon">${icon('arrow', 18)} Teruskan permohonan</a></div></section>`
          : html`<section class="card cur-card"><h3>Sekarang: ${st ? st.title : STATUS_LABEL[app.status]}</h3><div class="who">${st ? st.who.map((w) => html`<span class="pill-who">${icon('user', 14)} ${w}</span>`) : ''}</div><p class="muted" style="margin-top:10px">${st ? st.what : ''}</p><p class="small faint" style="margin-top:8px">Berada di langkah ini selama ${days} hari. ${st ? 'Rujukan: ' + st.ref : ''}</p><div class="sandbox-flag" style="margin-top:12px">${icon('info', 18)} Tiada tindakan diperlukan daripada anda sekarang. Kami akan memaklumkan jika dokumen tambahan diperlukan.</div></section>`}
      </div>
      <section class="card"><h3>Garis masa</h3>${timeline(events)}</section>
    </div>`);

  $('#pv', root).onclick = () => openLampiran(lec, app);
  const apb = $('#ap', root);
  if (apb) apb.onclick = () => openDrawer({
    title: 'Hantar rayuan',
    body: html`<form class="form" id="af" novalidate><p class="muted">Nyatakan alasan rayuan anda dengan jelas dan sertakan fakta baharu jika ada. Rayuan dihantar secara bertulis melalui Ketua Jabatan. Keputusan Jawatankuasa Rayuan adalah muktamad.</p>${fieldHtml({ name: 'reason', label: 'Alasan rayuan', type: 'textarea', required: true, minlen: 20, help: 'kp_appeal' }, '')}<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv">Hantar rayuan</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      $('#af', el).onsubmit = async (e) => {
        e.preventDefault(); const { values, ok } = readForm(e.target, [{ name: 'reason', label: 'Alasan', type: 'textarea', required: true, minlen: 20 }]); if (!ok) return;
        const b = $('#sv', el); busy(b, true);
        try { await api.promoAppeal(app.id, values.reason); toast('Rayuan telah dihantar.'); close(); window.dispatchEvent(new HashChangeEvent('hashchange')); }
        catch (er) { toast(er.message, 'err'); busy(b, false, 'Hantar rayuan'); }
      };
    },
  });
}
