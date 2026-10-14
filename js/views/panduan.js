// Panduan Kenaikan Pangkat: ringkasan Garis Panduan dalam bahasa biasa, jawatankuasa, proses dan kalkulator tatatertib.
import { html, mount, $, $$, icon, fmtDate } from '../util.js';
import { pageHead, searchBox, debounce } from './_ui.js';
import { helpBtn } from '../help.js';
import { FAQ, COMMITTEES, GRADES, stepsFor, PENALTIES, PENALTY_MONTHS } from '../promotion/guideline.js';
import { disciplineBlocks, iso } from '../promotion/engine.js';

export async function render(root) {
  let tab = 'faq'; const cases = [];
  const draw = () => {
    const body = tab === 'faq' ? faq() : tab === 'proses' ? proses() : calc();
    mount(root, html`${pageHead('Panduan Kenaikan Pangkat', 'Ringkasan Garis Panduan Kenaikan Pangkat Staf Akademik UPNM dalam bahasa yang mudah.', html`<a class="btn ghost" href="#/demo-kp">${icon('star', 18)} Lihat demo berpandu</a>`, '', 'panduan')}
      <div class="seg" role="group" aria-label="Bahagian panduan" style="margin-bottom:16px"><button data-t="faq" aria-pressed="${tab === 'faq'}">Soalan lazim</button><button data-t="proses" aria-pressed="${tab === 'proses'}">Proses &amp; jawatankuasa</button><button data-t="calc" aria-pressed="${tab === 'calc'}">Kalkulator tatatertib</button></div>${body}`);
    $$('[data-t]', root).forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
    const q = $('#fq', root); if (q) q.oninput = debounce((e) => { const v = e.target.value.toLowerCase(); $$('.faq details', root).forEach((d) => (d.hidden = !!v && !d.textContent.toLowerCase().includes(v))); });
    const f = $('#cf', root); if (f) wireCalc(f);
  };
  const faq = () => html`<div style="margin-bottom:14px">${searchBox('fq', 'Cari soalan (cth. perundingan, rayuan)…')}</div><div class="faq">${FAQ.map((f) => html`<details><summary>${f.q}</summary><p>${f.a}</p><p class="small faint" style="padding-top:0">Rujukan Garis Panduan: ${f.ref}</p></details>`)}</div>`;
  const proses = () => html`
    <section class="card"><h3>Laluan gred</h3><div class="row" style="gap:8px">${GRADES.map((g, i) => html`<span class="chip">${g.name} (${g.short})</span>${i < GRADES.length - 1 ? icon('arrow', 16) : ''}`)}</div></section>
    <section class="card" style="margin-top:18px"><h3>Langkah proses (Profesor Madya / Profesor)</h3><ol class="steps-list">${stepsFor('DS14').map((s) => html`<li><b>${s.title}</b> — ${s.who.join(', ')}. <span class="faint">${s.ref}</span></li>`)}</ol><p class="small faint" style="margin-top:10px">Bagi Pensyarah Kanan (DS13), langkah Penilai Luar dan Syarahan dilangkau.</p></section>
    <section class="card" style="margin-top:18px"><h3>Jawatankuasa</h3><div class="stack">${COMMITTEES.map((c) => html`<div class="todo" style="align-items:flex-start"><div class="tx"><b>${c.name}</b><span>Pengerusi: ${c.chair}. Ahli: ${c.members}.</span><span style="display:block;margin-top:4px">${c.role}</span></div><span class="badge mute">${c.ref}</span></div>`)}</div></section>`;
  const calc = () => {
    const res = cases.length ? disciplineBlocks(cases, new Date()) : null;
    return html`<section class="card" style="max-width:760px"><h3>Kalkulator tempoh tidak layak ${helpBtn('kp_tatatertib_calc')}</h3><form class="row" id="cf" style="align-items:flex-end;gap:12px" novalidate>
      <div class="fld"><label for="cp">Hukuman</label><select class="input" id="cp">${PENALTIES.map((p) => html`<option>${p}</option>`)}</select></div>
      <div class="fld"><label for="cd">Tarikh hukuman</label><input class="input" type="date" id="cd" required></div>
      <div class="fld"><label for="cc">No. kes ${helpBtn('f_dis_case')}</label><input class="input" id="cc" value="K1" style="max-width:100px"></div>
      <button class="btn primary" type="submit">${icon('plus', 16)} Tambah</button></form>
      ${cases.length ? html`<div class="stack" style="margin-top:16px">${cases.map((c, i) => html`<div class="todo"><div class="tx"><b>${c.penalty}</b><span>${fmtDate(c.date)} · kes ${c.case_no} · ${PENALTY_MONTHS[c.penalty]} bulan</span></div><button class="icon-btn" data-rm="${i}" aria-label="Buang">${icon('trash', 17)}</button></div>`)}</div>
      <div class="card" style="margin-top:14px;background:var(--field)">${res.periods.map((p) => html`<p>Tempoh tidak layak: <b>${fmtDate(iso(p.from))}</b> hingga <b>${fmtDate(iso(p.to))}</b></p>`)}${res.blockedNow ? html`<p class="badge danger" style="margin-top:8px">Sekarang tidak layak — boleh dipertimbangkan semula mulai ${fmtDate(iso(res.eligibleFrom))}</p>` : html`<p class="badge ok" style="margin-top:8px">Tempoh hukuman telah tamat — tiada halangan sekarang</p>`}</div>` : html`<p class="muted small" style="margin-top:14px">Tambah satu atau lebih hukuman untuk melihat bila anda boleh dipertimbangkan semula. Hukuman bagi pertuduhan yang sama diberi nombor kes yang sama (diambil yang paling berat); kes berlainan yang bertindih digabungkan.</p>`}</section>`;
  };
  function wireCalc(f) {
    f.onsubmit = (e) => { e.preventDefault(); const d = $('#cd', root).value; if (!d) { $('#cd', root).focus(); return; } cases.push({ id: 'c' + cases.length, penalty: $('#cp', root).value, date: d, case_no: $('#cc', root).value || 'K' + (cases.length + 1) }); draw(); };
    $$('[data-rm]', root).forEach((b) => (b.onclick = () => { cases.splice(+b.dataset.rm, 1); draw(); }));
  }
  draw();
}
