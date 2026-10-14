import * as api from '../api.js';
import { html, mount, $, icon, logo } from '../util.js';
import { CONFIG } from '../config.js';
import { helpBtn } from '../help.js';

export async function render(root) {
  mount(root, html`
    <div class="login">
      <canvas id="bg" aria-hidden="true"></canvas>
      <section class="hero">
        <div>${logo(72)}</div>
        <h1>PETA<br>BAKAT FSTP</h1>
        <p class="sub">Sistem pemetaan bakat berasaskan web untuk pensyarah FSTP — satu tempat untuk merekod, mengemas kini dan menemui kepakaran.</p>
        <ul><li>${icon('link', 22)} Hubungkan kepakaran</li><li>${icon('search', 22)} Temui bakat</li><li>${icon('users', 22)} Bina kolaborasi</li></ul>
      </section>
      <section class="panel">
        <form class="box form" id="lf" novalidate>
          <div><h2>Selamat Datang</h2><p class="sub">Log masuk ke akaun anda</p></div>
          <div class="err-box" id="err" role="alert" hidden></div>
          <div class="fld"><label for="u">Nama Pengguna / E-mel</label><input class="input" id="u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
          <div class="fld"><label for="p">Kata Laluan</label><div class="pw"><input class="input" id="p" name="password" type="password" autocomplete="current-password" required><button type="button" class="icon-btn eye" id="eye" aria-label="Tunjuk kata laluan" aria-pressed="false" style="color:var(--ink-3)">${icon('eye', 20)}</button></div></div>
          <div class="checks"><label><input type="checkbox" id="rem" checked> Ingat saya</label>${helpBtn('remember_me')}</div>
          <button class="btn primary" id="go" type="submit" style="width:100%">Log Masuk</button>
          ${CONFIG.backend === 'local' ? html`<div class="demo"><b>Akaun demo</b> (data demo setempat)<br>
            <button type="button" data-fill="admin|admin">Pentadbir</button> · <button type="button" data-fill="aisyah|Lecturer@123">Pensyarah (Dr. Aisyah)</button></div>` : ''}

        </form>
      </section>
    </div>`);
  const f = $('#lf'), err = $('#err'), go = $('#go');
  $('#eye').onclick = (e) => { const p = $('#p'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', show); e.currentTarget.setAttribute('aria-label', show ? 'Sembunyi kata laluan' : 'Tunjuk kata laluan'); e.currentTarget.innerHTML = icon(show ? 'eyeoff' : 'eye', 20).s; };
  root.querySelectorAll('[data-fill]').forEach((b) => (b.onclick = () => { const [u, p] = b.dataset.fill.split('|'); $('#u').value = u; $('#p').value = p; $('#u').focus(); }));
  f.onsubmit = async (e) => {
    e.preventDefault(); err.hidden = true;
    const u = $('#u').value.trim(), p = $('#p').value;
    if (!u || !p) { err.textContent = 'Masukkan nama pengguna dan kata laluan anda.'; err.hidden = false; (u ? $('#p') : $('#u')).focus(); return; }
    go.disabled = true; go.innerHTML = '<span class="spin"></span> Sedang log masuk…';
    try { await api.login(u, p, $('#rem').checked); location.hash = '#/dashboard'; }
    catch (ex) { err.textContent = ex.message; err.hidden = false; go.disabled = false; go.textContent = 'Log Masuk'; $('#p').select(); }
  };
  let stop = () => {};
  import('../three/login-scene.js').then((m) => { if ($('#bg')) stop = m.startNetwork($('#bg')); }).catch(() => { $('.login').style.background = 'radial-gradient(circle at 30% 30%,#12306a,#050d20)'; });
  return () => stop();
}
