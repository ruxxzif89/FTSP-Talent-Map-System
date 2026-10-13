// 3D "expertise galaxy": each category is a glowing hub; each lecturer orbits the hub of their strongest expertise
// and is tethered to every other category they also cover. Filtered-out people dim instead of vanishing.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const LV = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };

function labelSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d');
  x.font = '700 38px "Plus Jakarta Sans", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 10; x.fillStyle = color || '#fff'; x.fillText(text, 256, 48);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(4.8, 0.9, 1); return s;
}
const glow = (() => { let t; return () => t || (t = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })()); })();

export function createGalaxy(host, { lecturers, expertise, categories, onOpen, tip }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200); camera.position.set(0, 6, 26);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.minDistance = 8; controls.maxDistance = 50; controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => (controls.autoRotate = false));

  // category hubs on a fibonacci sphere
  const hubs = new Map(); const R = 11; const disposables = [];
  categories.forEach((c, i) => {
    const n = categories.length, y = 1 - ((i + 0.5) / n) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
    const p = new THREE.Vector3(Math.cos(th) * rad * R, y * R * 0.8, Math.sin(th) * rad * R);
    const col = new THREE.Color(c.color);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: col, wireframe: true }));
    core.position.copy(p); scene.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(4, 4, 1); halo.position.copy(p); scene.add(halo);
    const label = labelSprite(c.name, '#e8f0ff'); label.position.copy(p).add(new THREE.Vector3(0, 1.5, 0)); scene.add(label);
    hubs.set(c.id, { p, col, core });
    disposables.push(core.geometry, core.material, halo.material, label.material, label.material.map);
  });

  // lecturers
  const mainCat = (l) => { const e = expertise.filter((x) => x.lecturer_id === l.id).sort((a, b) => LV[b.level] - LV[a.level] || b.years - a.years); return { top: e[0], all: e }; };
  const people = []; const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  lecturers.forEach((l) => {
    const { top, all } = mainCat(l);
    const hub = top && hubs.get(top.category_id);
    const base = hub ? hub.p : new THREE.Vector3((rnd() - 0.5) * 30, (rnd() - 0.5) * 20, (rnd() - 0.5) * 30);
    const r = 1.6 + rnd() * 2.2 + (4 - (top ? LV[top.level] : 1)) * 0.25, a = rnd() * Math.PI * 2, b = Math.acos(2 * rnd() - 1);
    const pos = base.clone().add(new THREE.Vector3(r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), r * Math.cos(b)));
    people.push({ l, pos, top, cats: [...new Set(all.map((x) => x.category_id))], size: 0.28 + (top ? LV[top.level] : 0) * 0.07, color: hub ? hub.col : new THREE.Color(0x9fb0d0) });
  });
  const N = people.length;
  const posAttr = new Float32Array(N * 3), colAttr = new Float32Array(N * 3), sizeAttr = new Float32Array(N);
  people.forEach((p, i) => { posAttr.set([p.pos.x, p.pos.y, p.pos.z], i * 3); sizeAttr[i] = p.size * 2.6; });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colAttr, 3)); geo.setAttribute('size', new THREE.BufferAttribute(sizeAttr, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { map: { value: glow() }, scale: { value: 1 } },
    vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; uniform float scale; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*scale/-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC*(0.6+t.a), t.a); if(t.a<0.02) discard; }',
  });
  const points = new THREE.Points(geo, mat); scene.add(points);

  // tethers: person -> secondary category hubs
  const lp = [];
  people.forEach((p) => p.cats.forEach((cid) => { const h = hubs.get(cid); if (h && !(p.top && cid === p.top.category_id)) lp.push(p.pos, h.p); else if (h) lp.push(p.pos, h.p); }));
  const lgeo = new THREE.BufferGeometry().setFromPoints(lp);
  const lmat = new THREE.LineBasicMaterial({ color: 0x5b8def, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.LineSegments(lgeo, lmat));

  let active = null; // Set of lecturer ids highlighted
  const dim = new THREE.Color(0x2a3550);
  const paint = () => people.forEach((p, i) => { const on = !active || active.has(p.l.id); const c = on ? p.color : dim; colAttr.set([c.r, c.g, c.b], i * 3); sizeAttr[i] = p.size * 2.6 * (on ? 1 : 0.55); });
  const touch = () => { geo.attributes.color.needsUpdate = true; geo.attributes.size.needsUpdate = true; };
  paint(); touch();

  // picking (nearest projected person within 14px)
  const ray = new THREE.Raycaster(); let hover = -1; const ptr = new THREE.Vector2(); let down = null;
  const pick = (ev) => {
    const rc = renderer.domElement.getBoundingClientRect(); const mx = ev.clientX - rc.left, my = ev.clientY - rc.top; let best = -1, bd = 16;
    const v = new THREE.Vector3();
    people.forEach((p, i) => { if (active && !active.has(p.l.id)) return; v.copy(p.pos).project(camera); if (v.z > 1) return; const d = Math.hypot((v.x * 0.5 + 0.5) * rc.width - mx, (-v.y * 0.5 + 0.5) * rc.height - my); if (d < bd) { bd = d; best = i; } });
    return { i: best, mx, my };
  };
  const onMove = (ev) => { const { i, mx, my } = pick(ev); hover = i; renderer.domElement.style.cursor = i >= 0 ? 'pointer' : 'grab'; if (i >= 0) { const p = people[i]; tip.innerHTML = ''; const b = document.createElement('b'); b.textContent = p.l.full_name; const s = document.createElement('small'); s.textContent = (p.top ? p.top.area + ' · ' + p.top.level : 'No expertise yet') + ' · ' + p.l.department; tip.append(b, s); tip.style.display = 'block'; tip.style.left = Math.min(mx, host.clientWidth - 250) + 'px'; tip.style.top = my + 'px'; } else tip.style.display = 'none'; };
  const onDown = (ev) => (down = { x: ev.clientX, y: ev.clientY });
  const onUp = (ev) => { if (down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 5) { const { i } = pick(ev); if (i >= 0) onOpen(people[i].l.id); } down = null; };
  const el = renderer.domElement; el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown); el.addEventListener('pointerup', onUp); el.addEventListener('pointerleave', () => (tip.style.display = 'none'));

  const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); mat.uniforms.scale.value = h * 0.9 * renderer.getPixelRatio(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduce) controls.autoRotate = false;
  let raf = 0, running = true;
  const loop = () => { if (!running) return; controls.update(); hubs.forEach((h) => (h.core.rotation.y += 0.01)); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  const vis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; loop(); } };
  document.addEventListener('visibilitychange', vis); loop();

  return {
    setFilter(ids) { active = ids.size === lecturers.length ? null : ids; paint(); touch(); },
    dispose() {
      running = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', vis); controls.dispose();
      el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp);
      [geo, mat, lgeo, lmat, ...disposables].forEach((o) => o && o.dispose && o.dispose()); renderer.dispose(); el.remove();
    },
  };
}
