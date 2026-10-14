// Butiran permohonan (pentadbir): SATU langkah semasa, siapa yang bertindak, apa yang disemak, dan butang keputusan.
import * as api from '../api.js';
import { store, lecturerOf } from '../api.js';
import { html, mount, $, $$, icon, toast, avatar, fmtDate, openDrawer, confirmDialog } from '../util.js';
import { pageHead, fieldHtml, readForm, busy } from './_ui.js';
import { helpBtn } from '../help.js';
import { evaluate } from '../promotion/engine.js';
import { STEP, STATUS_LABEL, gradeLabel, needsExternalAssessors, ASSESSOR_RULES } from '../promotion/guideline.js';
import { actButtons, ACTOR_ROLES, isInProcess, appealInfo } from '../promotion/workflow.js';
import { stepper, timeline, statusBadge, componentCard, generalList } from './kpShared.js';
import { openLampiran } from './lampiran.js';

const lastStep = (app) => actButtons(app).some((b) => b.act === 'lulus' && b.label.startsWith('Selesai'));

export async function render(root, { id }) {
  const draw = () => {
    const app = store.promotion_applications.find((a) => a.id === id);
    if (!app) { mount(root, html`<div class="empty card">${icon('alert', 36)}<h3>Permohonan tidak ditemui</h3><p><a class="btn primary" href="#/kp-admin" style="margin-top:14px">Kembali</a></p></div>`); return; }
    const lec = lecturerOf(app.lecturer_id);
    const events = store.promotion_events.filter((e) => e.application_id === id);
    const asr = store.promotion_assessors.filter((x) => x.application_id === id);
    const ev = evaluate(lec, store, { to: app.to_grade, field: app.field });
    const st = STEP[app.status]; const checks = JSON.parse(app.checks || '{}');
    const btns = actButtons(app); const roles = ACTOR_ROLES[app.status] || ['Pentadbir'];
    const ap = appealInfo(app);

    let action;
    if (app.status === 'draf') action = html`<section class="card cur-card"><h3>Draf — belum dihantar oleh calon</h3><p class="muted">Calon masih menyediakan permohonan. Anda boleh menghantarnya bagi pihak calon jika dokumen telah lengkap, atau membuangnya.</p><div class="row" style="margin-top:12px"><button class="btn primary" id="sub">${icon('check', 18)} Hantar bagi pihak calon</button><button class="btn ghost" id="del">${icon('trash', 18)} Buang draf</button></div></section>`;
    else if (btns.length) action = html`<section class="card cur-card" aria-label="Langkah semasa">
      <h3>Langkah semasa: ${st ? st.title : STATUS_LABEL[app.status]} ${statusBadge(app.status)}</h3>
      <div class="who">${(st ? st.who : []).map((w) => html`<span class="pill-who">${icon('user', 14)} ${w}</span>`)}</div>
      <p class="muted" style="margin-top:10px">${st ? st.what : ''}</p><p class="small faint">${st ? 'Rujukan: ' + st.ref : ''}</p>
      ${st && st.checks && st.checks.length ? html`<div style="margin-top:14px"><b class="small">Semak dahulu: ${helpBtn('kp_act')}</b>${st.checks.map((c) => html`<div class="chk-row"><input type="checkbox" id="c_${c.key}" data-chk="${c.key}" ${checks[`${app.status}.${c.key}`] ? 'checked' : ''}><label for="c_${c.key}">${c.label}</label>${helpBtn(c.help)}</div>`)}</div>` : ''}
      <div class="fld" style="margin-top:12px"><div class="lbl-row"><label for="as">Bertindak sebagai</label>${helpBtn('kp_as')}</div><select class="input" id="as">${roles.map((r) => html`<option>${r}</option>`)}</select></div>
      ${lastStep(app) ? html`<div class="fld" style="margin-top:12px"><label for="eff">Tarikh berkuat kuasa kenaikan pangkat</label><input class="input" type="date" id="eff"></div>` : ''}
      <div class="fld" style="margin-top:12px"><label for="note">Catatan (pilihan)</label><textarea class="input" id="note" rows="2" placeholder="cth. Mesyuarat Jawatankuasa Kesepakaran bil. 3/2026"></textarea></div>
      <div class="act-grid">${btns.map((b) => html`<button class="btn ${b.tone === 'primary' ? 'primary' : b.tone === 'danger' ? 'danger' : 'ghost'}" data-act="${b.act}">${icon(b.tone === 'primary' ? 'check' : b.tone === 'danger' ? 'x' : 'back', 18)} ${b.label}</button>`)}</div>
      ${app.status === 'rayuan' && app.appeal_reason ? html`<p class="small" style="margin-top:12px"><b>Alasan rayuan calon:</b> ${app.appeal_reason}</p>` : ''}</section>`;
    else action = html`<section class="card cur-card"><h3>${STATUS_LABEL[app.status]} ${statusBadge(app.status)}</h3><p class="muted">${app.status === 'tidak_berjaya' ? (ap.can ? `Calon masih boleh merayu — baki ${ap.daysLeft} hari (hingga ${fmtDate(ap.deadline)}).` : 'Tempoh merayu 30 hari telah tamat.') : app.status === 'rayuan_berjaya' ? 'Rayuan diluluskan. Proses diteruskan oleh Urus Setia.' : 'Tiada tindakan lanjut.'}</p>${app.decision_date ? html`<p class="small faint">Tarikh keputusan: ${fmtDate(app.decision_date)}${app.effective_date ? ' · Berkuat kuasa: ' + fmtDate(app.effective_date) : ''}</p>` : ''}<div class="row" style="margin-top:10px"><button class="btn ghost sm" id="del">${icon('trash', 15)} Padam rekod permohonan</button></div></section>`;

    const sel = ev.ok ? ev.summary : null;
    mount(root, html`
      ${pageHead(lec.full_name, `${gradeLabel(app.from_grade)} → ${gradeLabel(app.to_grade)}`, html`<a class="btn ghost" href="#/kp-admin">${icon('back', 18)} Papan kerja</a><button class="btn ghost" id="pv">${icon('print', 18)} Borang</button><a class="btn ghost" href="#/lecturer/${lec.id}">${icon('user', 18)} Profil</a>`, '', 'kp_detail')}
      <section class="card"><h3>Carta proses ${helpBtn('kp_stepper')}</h3>${stepper(app, events)}</section>
      <div class="kp-cols" style="margin-top:18px">
        <div class="stack">${action}
          <section class="card"><h3>Kesediaan calon mengikut rekod ${sel ? html`<span class="badge ${sel.ready ? 'ok' : 'warn'}">${sel.verdictText}</span>` : ''}</h3>${sel ? html`<div class="stack" style="gap:8px">${ev.components.map((c) => html`<div class="row between"><span>${c.label}</span><span class="badge ${{ met: 'ok', partial: 'warn', unmet: 'danger' }[c.status]}">${{ met: 'Dipenuhi', partial: 'Sebahagian', unmet: 'Belum' }[c.status]}</span></div>`)}</div><button class="btn outline sm" id="det" style="margin-top:12px">Lihat butiran penuh</button>` : html`<p class="muted">${ev.message}</p>`}</section>
        </div>
        <div class="stack">
          ${needsExternalAssessors(app.to_grade) ? assessorPanel(app, asr) : ''}
          <section class="card"><h3>Garis masa</h3>${timeline(events)}</section>
        </div>
      </div>`);

    $('#pv', root).onclick = () => openLampiran(lec, app);
    const det = $('#det', root); if (det) det.onclick = () => openDrawer({ title: 'Butiran kesediaan', wide: true, body: html`<div class="stack">${ev.components.map((c) => componentCard(c, { links: false }))}<section class="card"><h3>Syarat umum</h3>${generalList(ev.general)}</section></div>` });
    const del = $('#del', root); if (del) del.onclick = async () => { if (await confirmDialog({ title: 'Padam permohonan?', message: 'Permohonan dan garis masanya akan dipadam kekal.' })) { try { await api.promoRemove(app.id); toast('Permohonan dipadam.'); location.hash = '#/kp-admin'; } catch (e) { toast(e.message, 'err'); } } };
    const sub = $('#sub', root); if (sub) sub.onclick = async () => { busy(sub, true); try { await api.promoSubmit(app.id, true); toast('Permohonan dihantar bagi pihak calon.'); draw(); } catch (e) { toast(e.message, 'err'); busy(sub, false, 'Hantar bagi pihak calon'); } };
    $$('[data-act]', root).forEach((b) => (b.onclick = async () => {
      const act = b.dataset.act; const checksSel = Object.fromEntries($$('[data-chk]', root).map((c) => [c.dataset.chk, c.checked]));
      if ((act === 'lulus' || act === 'rayuan_berjaya') && Object.values(checksSel).some((v) => !v)) { toast('Sila tandakan semua item semakan dahulu.', 'err'); const f = $$('[data-chk]', root).find((c) => !c.checked); f && f.focus(); return; }
      if (['gagal', 'kembali', 'tarik_balik', 'rayuan_tolak'].includes(act) && !(await confirmDialog({ title: 'Sahkan tindakan', message: b.textContent.trim(), confirm: 'Ya, teruskan', danger: act !== 'kembali' }))) return;
      b.disabled = true;
      try { const eff = $('#eff', root); await api.promoAct(app.id, { act, note: $('#note', root).value, as: $('#as', root).value, checks: checksSel, effective: eff ? eff.value : '' }); toast('Tindakan direkodkan.'); draw(); }
      catch (e) { toast(e.message, 'err'); b.disabled = false; }
    }));
    root.querySelector('#asr-add') && (root.querySelector('#asr-add').onclick = () => assessorForm(app, null, draw));
    $$('[data-asr]', root).forEach((b) => (b.onclick = () => assessorForm(app, store.promotion_assessors.find((x) => x.id === b.dataset.asr), draw)));
  };
  draw();
}

function assessorPanel(app, list) {
  const min = ASSESSOR_RULES.hIndexMin[app.field] || 10;
  const got = list.filter((x) => x.status === 'Laporan diterima').length;
  const chip = (x) => { const c = JSON.parse(x.checks || '{}'); const bad = ASSESSOR_RULES.checks.filter((k) => c[k.key] !== 'Ya').length + (Number(x.h_index) < min ? 1 : 0); return bad ? html`<span class="badge warn">${bad} kriteria tidak dipenuhi</span>` : html`<span class="badge ok">Layak</span>`; };
  return html`<section class="card"><h3>Penilai Luar ${helpBtn('kp_assessor_add')}<span class="badge ${got >= 3 ? 'ok' : 'mute'}">${got} / ${ASSESSOR_RULES.needed} laporan</span></h3>
    ${list.length ? html`<div class="stack" style="gap:8px">${list.map((x) => html`<div class="todo" style="padding:10px 12px"><div class="tx"><b>${x.name}</b><span>${x.institution} · ${x.country} · H-indeks ${x.h_index}</span></div>${chip(x)}<span class="badge ${x.status === 'Laporan diterima' ? 'ok' : x.status === 'Ditolak' ? 'danger' : 'info'}">${x.status}</span><button class="icon-btn" data-asr="${x.id}" aria-label="Kemas kini ${x.name}">${icon('edit', 17)}</button></div>`)}</div>` : html`<p class="muted small">Belum ada penilai dicalonkan. Fakulti mencalonkan 5; 3 dipilih.</p>`}
    <button class="btn outline sm" id="asr-add" style="margin-top:12px">${icon('plus', 15)} Calonkan penilai</button><p class="small faint" style="margin-top:8px">H-indeks minimum penilai: ${min} (${app.field}). Honorarium: ${ASSESSOR_RULES.honorarium['Dalam Negara']} dalam negara / ${ASSESSOR_RULES.honorarium['Luar Negara']} luar negara.</p></section>`;
}

function assessorForm(app, row, done) {
  const c = row ? JSON.parse(row.checks || '{}') : {};
  const F = [
    { name: 'name', label: 'Nama penilai', type: 'text', required: true }, { name: 'institution', label: 'Institusi', type: 'text', required: true },
    { name: 'country', label: 'Lokasi', type: 'select', options: ['Dalam Negara', 'Luar Negara'], required: true }, { name: 'position', label: 'Jawatan', type: 'text', placeholder: 'cth. Profesor' },
    { name: 'h_index', label: 'H-Index SCOPUS', type: 'number', min: 0, required: true, help: 'as_h' },
    ...ASSESSOR_RULES.checks.map((k) => ({ name: 'chk_' + k.key, label: k.label + ' — memenuhi?', type: 'select', options: ['Ya', 'Tidak'], required: true, help: k.help })),
    { name: 'status', label: 'Status', type: 'select', options: ['Dicalonkan', 'Dipilih', 'Laporan diterima', 'Ditolak'], required: true },
    { name: 'recommendation', label: 'Syor penilai', type: 'select', options: ['Menyokong', 'Menyokong dengan syarat', 'Tidak menyokong'] },
    { name: 'report_note', label: 'Ringkasan laporan', type: 'textarea' },
  ];
  const val = (f) => (row ? (f.name.startsWith('chk_') ? c[f.name.slice(4)] : row[f.name]) ?? '' : f.name === 'status' ? 'Dicalonkan' : '');
  openDrawer({
    title: row ? 'Kemas kini penilai' : 'Calonkan Penilai Luar',
    body: html`<form class="form" id="af" novalidate>${F.map((f) => fieldHtml(f, val(f)))}<div class="form-actions">${row ? html`<button type="button" class="btn danger" data-del>Padam</button>` : ''}<button type="button" class="btn ghost" data-cancel>Batal</button><button class="btn primary" id="sv">Simpan</button></div></form>`,
    onMount: (el, close) => {
      $('[data-cancel]', el).onclick = close;
      const d = $('[data-del]', el); if (d) d.onclick = async () => { await api.remove('promotion_assessors', row.id); toast('Penilai dipadam.'); close(); done(); };
      $('#af', el).onsubmit = async (e) => {
        e.preventDefault(); const { values, ok } = readForm(e.target, F); if (!ok) return;
        const checks = {}; ASSESSOR_RULES.checks.forEach((k) => { checks[k.key] = values['chk_' + k.key]; delete values['chk_' + k.key]; });
        const b = $('#sv', el); busy(b, true);
        try {
          const data = { ...values, checks: JSON.stringify(checks) };
          if (row) await api.update('promotion_assessors', row.id, data); else await api.create('promotion_assessors', { ...data, application_id: app.id, lecturer_id: app.lecturer_id });
          toast('Penilai disimpan.'); close(); done();
        } catch (er) { toast(er.message, 'err'); busy(b, false, 'Simpan'); }
      };
    },
  });
}
