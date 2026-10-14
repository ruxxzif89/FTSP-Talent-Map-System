// Papan kerja Kenaikan Pangkat (pentadbir): apa yang menunggu tindakan, semua permohonan, dan calon berpotensi.
import * as api from '../api.js';
import { store, lecturerOf } from '../api.js';
import { html, mount, $, $$, icon, toast, avatar, fmtDate } from '../util.js';
import { pageHead, dataTable, searchBox, debounce } from './_ui.js';
import { helpBtn } from '../help.js';
import { quickReadiness } from '../promotion/engine.js';
import { gradeLabel, NEXT_GRADE, STEP, GRADE } from '../promotion/guideline.js';
import { ACTIVE_STATUSES } from '../promotion/workflow.js';
import { statusBadge, verdictTone } from './kpShared.js';

const inProcess = (a) => ACTIVE_STATUSES.includes(a.status) && a.status !== 'draf';
const daysAt = (a) => Math.max(0, Math.floor((Date.now() - new Date(a.step_since || a.updated_at)) / 864e5));

export async function render(root) {
  let tab = 'act';
  const apps = () => store.promotion_applications;
  const year = new Date().getFullYear();
  const k = { act: apps().filter(inProcess).length, draf: apps().filter((a) => a.status === 'draf').length, ok: apps().filter((a) => ['berjaya', 'rayuan_berjaya'].includes(a.status) && String(a.decision_date || '').startsWith(year)).length, no: apps().filter((a) => ['tidak_berjaya', 'rayuan_ditolak'].includes(a.status)).length };

  mount(root, html`
    ${pageHead('Papan Kerja Kenaikan Pangkat', 'Satu tempat untuk melihat semua permohonan dan apa yang perlu dibuat seterusnya.', html`<a class="btn ghost" href="#/panduan">${icon('book', 18)} Panduan</a><a class="btn ghost" href="#/demo-kp">${icon('star', 18)} Demo berpandu</a>`, '', 'kp_admin')}
    <div class="kpi-row"><div class="kpi ${k.act ? 'hot' : ''}"><b>${k.act}</b><span>Perlu tindakan</span></div><div class="kpi"><b>${k.draf}</b><span>Draf calon</span></div><div class="kpi"><b>${k.ok}</b><span>Berjaya tahun ${year}</span></div><div class="kpi"><b>${k.no}</b><span>Tidak berjaya</span></div></div>
    <div class="row between" style="margin-bottom:12px"><div class="seg" role="group" aria-label="Paparan"><button data-t="act" aria-pressed="true">Perlu tindakan</button><button data-t="all" aria-pressed="false">Semua permohonan</button><button data-t="cand" aria-pressed="false">Calon berpotensi</button></div>${searchBox('q', 'Cari nama pensyarah…')}</div>
    <div id="tbl"></div>`);

  const nameCell = (r) => { const l = lecturerOf(r.lecturer_id); return l ? html`<a class="row" style="gap:8px;flex-wrap:nowrap;color:inherit;white-space:nowrap" href="#/kp-admin/${r.id}">${avatar(l, 28)}<span>${l.full_name}</span></a>` : '—'; };
  const appCols = [
    { label: 'Calon', render: nameCell, sort: (r) => (lecturerOf(r.lecturer_id) || {}).full_name || '' },
    { label: 'Laluan', render: (r) => html`${GRADE[r.from_grade] ? GRADE[r.from_grade].short : r.from_grade} → <b>${GRADE[r.to_grade] ? GRADE[r.to_grade].short : r.to_grade}</b>`, sort: (r) => r.to_grade },
    { label: 'Langkah', render: (r) => statusBadge(r.status), sort: (r) => r.status },
    { label: 'Hari di langkah', render: (r) => (inProcess(r) ? html`${daysAt(r)} hari${daysAt(r) > 14 ? html` <span class="badge warn">Lama</span>` : ''}` : '—'), sort: (r) => daysAt(r) },
    { label: 'Dihantar', render: (r) => fmtDate(r.submitted_at), sort: (r) => r.submitted_at || '' },
  ];
  // calon berpotensi dikira sekali (agak berat): hanya apabila tab dibuka
  let cands = null;
  const candidates = () => {
    if (cands) return cands;
    const busy = new Set(apps().filter((a) => ACTIVE_STATUSES.includes(a.status)).map((a) => a.lecturer_id));
    cands = store.lecturers.filter((l) => l.grade && NEXT_GRADE[l.grade] && !busy.has(l.id)).map((l) => ({ id: l.id, lecturer_id: l.id, q: quickReadiness(l, store, new Date()) })).filter((c) => c.q.ok);
    return cands;
  };
  const candCols = [
    { label: 'Pensyarah', render: (r) => { const l = lecturerOf(r.lecturer_id); return html`<a class="row" style="gap:8px;flex-wrap:nowrap;color:inherit;white-space:nowrap" href="#/lecturer/${l.id}">${avatar(l, 28)}<span>${l.full_name}</span></a>`; }, sort: (r) => (lecturerOf(r.lecturer_id) || {}).full_name },
    { label: 'Laluan', render: (r) => html`${lecturerOf(r.lecturer_id).grade} → <b>${r.q.to}</b>` },
    { label: 'Kesediaan', render: (r) => html`<div class="row" style="gap:8px;flex-wrap:nowrap"><div class="bar-mini ${r.q.verdict === 'ready' ? 'ok' : ''}" style="width:90px"><i style="width:${Math.round(r.q.pct * 100)}%"></i></div><b>${Math.round(r.q.pct * 100)}%</b></div>`, sort: (r) => r.q.pct },
    { label: 'Status', render: (r) => html`<span class="badge ${verdictTone[r.q.verdict]}">${r.q.text}</span>`, sort: (r) => r.q.pct },
  ];
  const rowsFor = () => (tab === 'act' ? apps().filter(inProcess) : tab === 'all' ? apps() : candidates().filter((c) => ['ready', 'conditions', 'near'].includes(c.q.verdict)).sort((a, b) => b.q.pct - a.q.pct));
  const tbl = dataTable($('#tbl', root), {
    columns: appCols, rows: rowsFor, searchText: (r) => (lecturerOf(r.lecturer_id) || {}).full_name || '',
    actions: (r) => (tab === 'cand' ? html`<button class="btn outline sm" data-new="${r.lecturer_id}">${icon('plus', 15)} Cipta draf</button>` : html`<a class="btn ${inProcess(r) ? 'primary' : 'ghost'} sm" href="#/kp-admin/${r.id}">${inProcess(r) ? 'Tindakan' : 'Buka'}</a>`),
    empty: { title: tab === 'act' ? 'Tiada permohonan menunggu tindakan' : tab === 'cand' ? 'Tiada calon hampir bersedia' : 'Belum ada permohonan', text: tab === 'cand' ? 'Calon yang memenuhi sekurang-kurangnya ~85% kriteria akan dipaparkan di sini.' : 'Apabila pensyarah menghantar permohonan, ia akan muncul di sini.' },
  });
  // tukar lajur mengikut tab: dataTable menerima `columns` tetap, jadi bina semula
  const setTab = (t) => {
    tab = t; $$('[data-t]', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === t));
    const host = $('#tbl', root); host.replaceWith(Object.assign(document.createElement('div'), { id: 'tbl' }));
    const h2 = $('#tbl', root);
    const ct = dataTable(h2, { columns: t === 'cand' ? candCols : appCols, rows: rowsFor, searchText: (r) => (lecturerOf(r.lecturer_id) || {}).full_name || '', actions: tbl_actions(t), empty: { title: t === 'act' ? 'Tiada permohonan menunggu tindakan' : t === 'cand' ? 'Tiada calon hampir bersedia' : 'Belum ada permohonan', text: t === 'cand' ? 'Calon yang memenuhi sekurang-kurangnya ~85% kriteria akan dipaparkan di sini.' : 'Apabila pensyarah menghantar permohonan, ia akan muncul di sini.' } });
    cur = ct; $('#q', root).value = '';
  };
  const tbl_actions = (t) => (r) => (t === 'cand' ? html`<button class="btn outline sm" data-new="${r.lecturer_id}">${icon('plus', 15)} Cipta draf</button>${helpBtn('kp_candidates')}` : html`<a class="btn ${inProcess(r) ? 'primary' : 'ghost'} sm" href="#/kp-admin/${r.id}">${inProcess(r) ? 'Tindakan' : 'Buka'}</a>`);
  let cur = tbl;
  $$('[data-t]', root).forEach((b) => (b.onclick = () => setTab(b.dataset.t)));
  $('#q', root).oninput = debounce((e) => cur.search(e.target.value));
  const onClick = async (e) => {
    const b = e.target.closest('[data-new]'); if (!b) return;
    b.disabled = true;
    try { const a = await api.promoSave({ lecturer_id: b.dataset.new }); toast('Draf dicipta untuk calon.'); location.hash = '#/kp-admin/' + a.id; } catch (er) { toast(er.message, 'err'); b.disabled = false; }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
