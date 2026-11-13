// @js:kitchen-plant — a potted plant: neutral tapered pot and a fan of sage blades that bend in gusts from the window.
// Origin: the middle of the pot's foot. userData: landing (the butterfly's perch, local), gust(), update(dt).
export function plant(kit) {
  const T = kit.THREE;
  const g = kit.group(), lo = { tone: 'lo' }, cx = 0, cz = 0, cy = 0;
  g.add(kit.cyl(cx, cy, cz, 42, 95, { rTop: 58, seg: 28, ...lo }));
  const merged = kit.merge(g);
  // @js:kitchen-plant-blades — the plant: curved blades with a damped spring each, pushed by gusts from the window
  // Blades that bend. Each is a tapered strip of 8 segments (six vertices a ring, flattened) rebuilt on the CPU whenever it moves: its centre line curves by an angle that grows
  // with the square of the height along the blade, so the base stays planted and the tip moves most. Each blade has its own damped spring (stiffness and damping vary with its length:
  // long blades are softer) that the wind pushes, so it leans and returns smoothly.
  const SEG = 8, RING = 6, rnd = (() => { let r = 7; return () => { r = (r * 9301 + 49297) % 233280; return r / 233280; }; })();
  const wind = new T.Vector3(1, 0, 0.3).normalize();   // from the window in the side wall: toward +x, a little +z
  const plant = kit.group(), blades = [];
  const Y = new T.Vector3(0, 1, 0), X = new T.Vector3(1, 0, 0), Z = new T.Vector3(0, 0, 1);
  for (let i = 0; i < 9; i++) {
    const len = 170 + (i % 3) * 30, width = 15, n = (SEG + 1) * RING;
    const geo = new T.BufferGeometry(), pos = new Float32Array(n * 3), idx = [];
    for (let r = 0; r < SEG; r++) for (let k = 0; k < RING; k++) {
      const a = r * RING + k, a1 = r * RING + (k + 1) % RING, b = a + RING, b1 = a1 + RING;
      idx.push(a, a1, b1, a, b1, b);
    }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const leaf = kit.leafBlade(geo, 3 * SEG);
    leaf.rotation.order = 'YZX';
    leaf.rotation.set(0, i * 2.4, 0.28 + (i % 3) * 0.2);
    leaf.position.set(cx, cy + 95, cz);
    leaf.updateMatrix();
    const q = leaf.quaternion.clone(), wl = wind.clone().applyQuaternion(q.clone().invert());
    wl.addScaledVector(Y, -wl.dot(Y)).normalize();       // the wind seen in the blade's own frame, across its length
    const k = 120 - 35 * (len - 170) / 60 + rnd() * 15;   // stiffness: long blades are softer (soft springs: the lean is slow and smooth)
    blades.push({ leaf, geo, len, width, D: wl, a: 0, v: 0, k, c: 2 * (0.5 + rnd() * 0.15) * Math.sqrt(k),
      A: 0.25 + 0.08 * (len - 170) / 60 + rnd() * 0.02, phase: rnd() * 6.28, delay: 0, tip: new T.Vector3(), lines: leaf.userData.lines });
    plant.add(leaf);
  }
  const ARCH = 0.22, archDir = new T.Vector3(-1, 0, 0);   // each blade rests with a little curve out of its lean
  const T0 = new T.Vector3(), c0 = new T.Vector3(), s0 = new T.Vector3(), n0 = new T.Vector3(), th = new T.Vector3();
  const shape = (b) => {   // writes the blade's vertices and outline for its current bend `b.a`
    const p = b.geo.attributes.position.array, rings = [];
    c0.set(0, 0, 0);
    for (let r = 0; r <= SEG; r++) {
      const t = r / SEG, t2 = t * t;
      th.set(0, 0, 0).addScaledVector(archDir, ARCH * t2).addScaledVector(b.D, b.a * Math.pow(t, 1.5));
      const m = th.length();
      if (r > 0) { if (m > 1e-6) T0.set(0, 0, 0).addScaledVector(Y, Math.cos(m)).addScaledVector(th, Math.sin(m) / m); else T0.copy(Y); c0.addScaledVector(T0, b.len / SEG); } else T0.copy(Y);
      s0.copy(Z).addScaledVector(T0, -Z.dot(T0)).normalize();
      n0.crossVectors(T0, s0);
      const tw = 0.7 * b.a * t2 * b.D.z;   // a blade facing across the wind twists a little
      if (tw) { const cs = Math.cos(tw), sn = Math.sin(tw); const s1 = s0.clone().multiplyScalar(cs).addScaledVector(n0, sn); n0.multiplyScalar(cs).addScaledVector(s0, -sn); s0.copy(s1); }
      const rad = b.width * (1 - 0.96 * Math.pow(t, 1.1));
      for (let k = 0; k < RING; k++) {
        const ang = k / RING * Math.PI * 2, w = Math.cos(ang) * rad, h = Math.sin(ang) * rad * 0.45;
        const o = (r * RING + k) * 3;
        p[o] = c0.x + s0.x * w + n0.x * h; p[o + 1] = c0.y + s0.y * w + n0.y * h; p[o + 2] = c0.z + s0.z * w + n0.z * h;
      }
    }
    b.tip.copy(c0);
    b.geo.attributes.position.needsUpdate = true;
    b.geo.computeVertexNormals();
    const arr = b.lines.geometry.attributes.instanceStart.data.array;   // outline: the two edges and the ridge, rewritten in place
    let o = 0;
    for (const k of [0, 3, 1]) for (let r = 0; r < SEG; r++) { const a = (r * RING + k) * 3, e = a + RING * 3; arr[o++] = p[a]; arr[o++] = p[a + 1]; arr[o++] = p[a + 2]; arr[o++] = p[e]; arr[o++] = p[e + 1]; arr[o++] = p[e + 2]; }
    b.lines.geometry.attributes.instanceStart.data.needsUpdate = true;
  };
  blades.forEach(shape);
  merged.add(plant);
  merged.updateMatrixWorld(true);
  const tips = blades.map((b) => b.leaf.localToWorld(b.tip.clone()));
  const top = tips.reduce((a, b) => (b.y > a.y ? b : a));
  merged.userData.landing = [top.x, top.y + 4, top.z];
  const minX = Math.min(...tips.map((t) => t.x)), spanX = (Math.max(...tips.map((t) => t.x)) - minX) || 1;
  blades.forEach((b, i) => { b.delay = 0.18 * (tips[i].x - minX) / spanX + rnd() * 0.04; });   // window-side blades are hit first

  // Gust series from the window: 2-3 swells, each rising over 1.5-2.5 s and easing off over 1.5-2.5 s, with a short lull between them where the blades come back only part of
  // the way; the second swell is usually the stronger. After a series the blades settle and stay still for 4-8 s. A swell reaches the far blades 100-200 ms later; each blade's
  // soft spring follows the wind level, so it leans, returns smoothly and does not snap. Only a barely visible shimmer rides on the peak.
  let clock = 0, next = 1.2, start = -99, end = -99, keys = [], rest = true;
  const ss = (x) => x * x * (3 - 2 * x);
  const level = (t) => {   // the wind level (0-1) at time t into the series, eased between its keyframes
    if (t <= 0 || t >= keys[keys.length - 1][0]) return 0;
    let i = 1; while (keys[i][0] < t) i++;
    const [t0, l0] = keys[i - 1], [t1, l1] = keys[i];
    return l0 + (l1 - l0) * ss((t - t0) / (t1 - t0));
  };
  merged.userData.gust = () => {
    const n = rnd() < 0.5 ? 2 : 3;
    let t = 0, peak = 0.7 + rnd() * 0.2;
    keys = [[0, 0]];
    for (let i = 0; i < n; i++) {
      t += 1.5 + rnd(); keys.push([t, peak]);                                      // the rise
      if (i < n - 1) { t += 1.5 + rnd(); keys.push([t, peak * 0.25]); t += 0.5 + rnd(); keys.push([t, peak * 0.25]); peak = Math.min(1, peak * (1.1 + rnd() * 0.2)); }   // the fall, then the lull
      else { t += 1.5 + rnd(); keys.push([t, 0]); }
    }
    start = clock; end = clock + t; rest = false;
    next = end + 1.5 + 4 + rnd() * 4;
  };
  const STEP = 1 / 120;
  merged.userData.update = (dt) => {
    clock += dt;
    if (clock >= next) merged.userData.gust();
    if (rest) return;
    let live = clock < end + 0.4;
    for (let s = 0; s < Math.ceil(dt / STEP); s++) {
      const now = clock - dt + (s + 1) * dt / Math.ceil(dt / STEP), h = dt / Math.ceil(dt / STEP);
      for (const b of blades) {
        const w = level(now - start - b.delay);
        const target = b.A * w * (1 + 0.03 * w * Math.sin(2 * Math.PI * 7 * now + b.phase));
        b.v += (b.k * (target - b.a) - b.c * b.v) * h;
        b.a += b.v * h;
      }
    }
    for (const b of blades) { if (Math.abs(b.a) > 2e-4 || Math.abs(b.v) > 2e-3) live = true; }
    if (!live) for (const b of blades) { b.a = b.v = 0; }
    blades.forEach(shape);
    if (!live) rest = true;
  };
  return merged;
}
