// Komponen paparan Kenaikan Pangkat yang dikongsi: hab pensyarah, butiran pentadbir dan demo.
import { html, raw, icon, fmtDate } from '../util.js';
import { helpBtn } from '../help.js';
import { GRADES, GRADE, COMPONENT, STATUS_LABEL, stepsFor, gradeLabel } from '../promotion/guideline.js';

export const suggestHref = (s) => (!s ? '' : s.entity === 'profile' ? '#/profile' : `#/${s.entity}?add=1${s.kind ? '&kind=' + encodeURIComponent(s.kind) : ''}`);

export const verdictTone = { ready: 'ok', conditions: 'info', near: 'warn', far: 'mute' };

// ---------- cincin kesediaan ----------
export function ring(pct, sub = 'kesediaan') {
  const r = 54, c = 2 * Math.PI * r, p = Math.round(pct * 100);
  return html`<div class="ring" role="img" aria-label="Kesediaan ${p} peratus"><svg width="132" height="132" viewBox="0 0 132 132"><circle class="bg" cx="66" cy="66" r="${r}" fill="none" stroke-width="12"/><circle class="fg" cx="66" cy="66" r="${r}" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg><b><span>${p}%<small>${sub}</small></span></b></div>`;
}

// ---------- tangga gred ----------
export function ladder(from, to) {
  const fi = GRADES.findIndex((g) => g.code === from), ti = GRADES.findIndex((g) => g.code === to);
  return html`<div class="ladder" role="list" aria-label="Laluan gred">${GRADES.map((g, i) => html`<div class="rung ${i < fi ? 'past' : i === fi ? 'now' : i === ti ? 'target' : ''}" role="listitem"><span class="dot">${i < fi ? icon('check', 16) : g.short}</span><small>${g.name}${i === fi ? html`<br>(anda di sini)` : i === ti ? html`<br>(sasaran)` : ''}</small></div>`)}</div>`;
}

// ---------- senarai kriteria (daripada pokok peraturan) ----------
function items(n, links) {
  if (n.type === 'leaf') {
    return [html`<li><span class="m ${n.met ? 'y' : 'n'}">${n.met ? icon('check', 13) : ''}</span><span>${n.label}<span class="d">${n.detail}</span>${!n.met && n.gap ? html`<span class="g">Perlu: ${n.gap}${links && n.suggest ? html` · <a href="${suggestHref(n.suggest)}">${n.suggest.text}</a>` : ''}</span>` : ''}</span></li>`];
  }
  if (n.type === 'all') return n.kids.flatMap((k) => items(k, links));
  const others = n.kids.filter((k) => k !== n.best);
  return [html`<li style="display:block"><div class="or-box"><b>${n.label || 'Pilih satu'}${helpBtn('or_branch')}</b>${critList(n.best, links)}${others.length ? html`<details class="alt"><summary>Lihat ${others.length} cara lain yang dibenarkan</summary><div class="stack" style="gap:10px;margin-top:6px">${others.map((k) => critList(k, links))}</div></details>` : ''}</div></li>`];
}
export const critList = (n, links = true) => html`<ul class="crit">${items(n, links)}</ul>`;

export function componentCard(c, { links = true } = {}) {
  const tone = { met: 'ok', partial: 'warn', unmet: 'danger' }[c.status], txt = { met: 'Dipenuhi', partial: 'Sebahagian', unmet: 'Belum' }[c.status];
  return html`<section class="card comp" aria-label="${c.label}"><div class="comp-head"><span class="ci ${c.status}">${icon(c.icon || 'file', 22)}</span><h4>${c.label}${c.help ? helpBtn(c.help, c.label) : ''}</h4><span class="badge ${tone}">${txt}</span></div><div class="bar-mini ${c.status === 'met' ? 'ok' : ''}" role="progressbar" aria-valuenow="${Math.round(c.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.round(c.pct * 100)}%"></i></div>${critList(c.node, links)}</section>`;
}

export function generalList(general) {
  const ic = { ok: 'check', fail: 'x', info: 'info' };
  return html`<div>${general.map((g) => html`<div class="gc"><span class="si ${g.status}">${icon(ic[g.status], 15)}</span><div><b>${g.label}${helpBtn(g.help, g.label)}</b><small>${g.detail}</small><small>${g.ref}</small></div></div>`)}</div>`;
}

// ---------- status & carta proses ----------
export const statusTone = (s) => ({ draf: 'mute', berjaya: 'ok', rayuan_berjaya: 'ok', tidak_berjaya: 'danger', rayuan_ditolak: 'danger', ditarik_balik: 'danger', rayuan: 'warn' }[s] || 'info');
export const statusBadge = (s) => html`<span class="badge ${statusTone(s)}">${STATUS_LABEL[s] || s}</span>`;

export function stepper(app, events = []) {
  const steps = stepsFor(app.to_grade);
  const idx = steps.findIndex((s) => s.id === app.status);
  const done = app.status === 'berjaya' || app.status === 'rayuan_berjaya';
  const failEv = [...events].filter((e) => e.action === 'gagal' || e.action === 'tarik_balik').sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
  const failAt = !done && idx < 0 && failEv ? steps.findIndex((s) => s.id === failEv.from_status) : -1;
  return html`<div class="stepper" role="list" aria-label="Carta proses permohonan">${steps.map((s, i) => {
    const isDone = done || (idx >= 0 && i < idx) || (failAt >= 0 && i < failAt);
    const cur = !done && ((idx >= 0 && i === idx) || (failAt >= 0 && i === failAt));
    return html`<div class="stp ${isDone ? 'done' : ''} ${cur ? 'cur' : ''} ${cur && failAt >= 0 ? 'fail' : ''}" role="listitem" ${cur ? raw('aria-current="step"') : ''}><span class="dot">${isDone ? icon("check", 15) : cur && failAt >= 0 ? icon("x", 15) : i + 1}</span><span>${s.short}</span></div>`;
  })}</div>`;
}

export function timeline(events) {
  if (!events.length) return html`<p class="muted small">Belum ada peristiwa.</p>`;
  const lab = { hantar: 'Dihantar', lulus: 'Diluluskan', kembali: 'Dikembalikan', gagal: 'Tidak berjaya', rayuan: 'Rayuan dihantar', rayuan_berjaya: 'Rayuan berjaya', rayuan_tolak: 'Rayuan ditolak', tarik_balik: 'Ditarik balik', draf: 'Draf' };
  return html`<ol class="tl">${[...events].sort((a, b) => String(b.at).localeCompare(String(a.at))).map((e) => html`<li><b>${lab[e.action] || e.action}</b> — ${STATUS_LABEL[e.from_status] || e.from_status} → ${STATUS_LABEL[e.to_status] || e.to_status}${e.note ? html`<br><span class="muted">${e.note}</span>` : ''}<small>${fmtDate(e.at)} · ${e.actor}${e.actor_role ? ' (' + e.actor_role + ')' : ''}</small></li>`)}</ol>`;
}

export { GRADE, COMPONENT, gradeLabel };
