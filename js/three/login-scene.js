// Login backdrop: a slowly rotating "talent network" — nodes (people) linked by expertise.
import * as THREE from 'three';

export function startNetwork(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return () => {}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050d20, 0.035);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const N = innerWidth < 700 ? 60 : 120;
  const pts = []; const R = 9;
  for (let i = 0; i < N; i++) { // fibonacci sphere with jitter
    const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
    const k = R * (0.75 + Math.random() * 0.4);
    pts.push(new THREE.Vector3(Math.cos(th) * rad * k, y * k, Math.sin(th) * rad * k));
  }
  const group = new THREE.Group(); scene.add(group); group.position.x = innerWidth > 860 ? -3.5 : 0;

  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const gold = new THREE.Color(0xf2b705), blue = new THREE.Color(0x5b9bff), white = new THREE.Color(0xdbe8ff);
  pts.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); const c = Math.random() < 0.12 ? gold : Math.random() < 0.5 ? blue : white; col.set([c.r, c.g, c.b], i * 3); });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(0.35, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const pm = new THREE.PointsMaterial({ size: 0.42, vertexColors: true, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  group.add(new THREE.Points(pg, pm));

  const seg = []; const maxD = 4.6;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (pts[i].distanceTo(pts[j]) < maxD) seg.push(pts[i], pts[j]);
  const lg = new THREE.BufferGeometry().setFromPoints(seg);
  const lm = new THREE.LineBasicMaterial({ color: 0x4f86e8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
  group.add(new THREE.LineSegments(lg, lm));

  // a few "pulses" travelling along edges
  const pulses = Array.from({ length: 14 }, () => { const k = Math.floor(Math.random() * (seg.length / 2)) * 2; return { a: seg[k], b: seg[k + 1], t: Math.random(), s: 0.004 + Math.random() * 0.006 }; });
  const pulseGeo = new THREE.BufferGeometry(); const pp = new Float32Array(pulses.length * 3); pulseGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pulseMat = new THREE.PointsMaterial({ size: 0.55, color: 0xf2b705, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  group.add(new THREE.Points(pulseGeo, pulseMat));

  let mx = 0, my = 0;
  const onMove = (e) => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; };
  addEventListener('pointermove', onMove);
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); group.position.x = w > 860 ? -3.5 : 0; };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, running = true, last = performance.now();
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) {
      group.rotation.y += dt * 0.07; group.rotation.x += (my * 0.15 - group.rotation.x) * 0.03;
      camera.position.x += (mx * 1.2 - camera.position.x) * 0.03;
      pulses.forEach((p, i) => { p.t += p.s; if (p.t > 1) { p.t = 0; const k = Math.floor(Math.random() * (seg.length / 2)) * 2; p.a = seg[k]; p.b = seg[k + 1]; } pp.set([p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, p.a.z + (p.b.z - p.a.z) * p.t], i * 3); });
      pulseGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const vis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', vis);
  raf = requestAnimationFrame(frame);

  return () => { // dispose everything (GPU memory is not garbage collected)
    running = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', vis);
    [pg, lg, pulseGeo, pm, lm, pulseMat, sprite].forEach((o) => o.dispose()); renderer.dispose();
  };
}
