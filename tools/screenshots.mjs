// Tangkap skrin sistem sebenar (mod sandbox ?backend=local) melalui Edge headless + CDP.
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const BASE = 'http://localhost:5173/?backend=local';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const prof = mkdtempSync(join(tmpdir(), 'edge-prof-'));
const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

let list;
for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.find((t) => t.type === 'page')) break; } catch { /* esperar */ } await sleep(200); }
const target = list.find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) console.log('EVAL ERR', r.result.exceptionDetails.exception?.description?.slice(0, 200)); return r.result?.result?.value; };
const metrics = (w, h, mobile = false, dpr = 1.25) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
const go = async (hash, wait = 1800) => { await send('Page.navigate', { url: BASE + hash }); await sleep(wait); };
const shot = async (name, q = 82) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: q }); writeFileSync(join(OUT, name + '.jpg'), Buffer.from(r.result.data, 'base64')); console.log('shot', name); };
const hashTo = async (h, wait = 1500) => { await ev(`location.hash='${h}'`); await sleep(wait); };
const login = async (u, p) => { await ev(`for(let i=0;i<40&&!document.querySelector('#u');i++) await new Promise(r=>setTimeout(r,200)); document.querySelector('#u').value='${u}'; document.querySelector('#p').value='${p}'; document.querySelector('#go').click(); for(let i=0;i<60&&!document.querySelector('#shell');i++) await new Promise(r=>setTimeout(r,200));`); await sleep(1200); };
const logout = async () => { await ev(`document.querySelector('#uchip').click(); await new Promise(r=>setTimeout(r,250)); document.querySelector('[data-do=logout]').click();`); await sleep(1200); };

await send('Page.enable'); await send('Runtime.enable');
await metrics(1600, 900);

// 1. log masuk (sebelum log masuk, tunggu adegan Three.js)
await go('#/login', 4500); await shot('01-login');

// admin + muat 100 pensyarah contoh
await login('admin', 'admin');
await hashTo('#/dashboard', 4500); await shot('03-dashboard-admin');
await ev(`document.querySelector('#gx').scrollIntoView({block:'start'}); `); await sleep(700); await shot('04-dashboard-galaksi');
await ev(`window.scrollTo(0, document.body.scrollHeight)`); await sleep(700); await shot('05-dashboard-carta');

await hashTo('#/talent', 1800);
await ev(`const q=document.querySelector('#q'); q.value='forensik'; q.dispatchEvent(new Event('input',{bubbles:true}));`); await sleep(1000); await shot('06-talent-kad');
await ev(`document.querySelector('#q').value=''; document.querySelector('#q').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-view="3d"]').click();`); await sleep(5000); await shot('07-talent-3d');

await hashTo('#/lecturers', 1500); await shot('08-pensyarah');
await ev(`[...document.querySelectorAll('tbody a')].find(a=>a.textContent.includes('Aisyah')).click();`); await sleep(1600); await shot('09-profil-pensyarah');

await hashTo('#/publications', 1500);
await ev(`document.querySelector('#add').click();`); await sleep(700);
await ev(`document.querySelector('#sv').click();`); await sleep(500); await shot('10-borang-pengesahan');

await hashTo('#/users', 1500); await shot('11-urus-pengguna');
await hashTo('#/stats', 1800); await shot('12-statistik');
await hashTo('#/reports', 1500); await shot('13-laporan');

// pensyarah
await logout(); await login('aisyah', 'Lecturer@123');
await hashTo('#/dashboard', 1800); await shot('14-dashboard-pensyarah');
await hashTo('#/profile', 1500); await shot('15-profil-saya');
await hashTo('#/certifications', 1500); await shot('16-pensijilan');

// mudah alih
await metrics(390, 844, true, 2);
await hashTo('#/dashboard', 1800); await shot('17-mobile-dashboard', 85);
await ev(`document.querySelector('#menu').click();`); await sleep(600); await shot('18-mobile-menu', 85);

ws.close(); try { execSync('taskkill /PID ' + proc.pid + ' /T /F', { stdio: 'ignore' }); } catch { /* sudah tamat */ }
console.log('selesai');
process.exit(0);
