// @js:home-floor — floor boards and tiles drawn like pencil: broken seams, short faint joints, sparse grain, and a fade by how close the lines bunch on screen (no moire at any camera).
// floorLines(kit, { style, bb, M, tone, seed, board, angle, cell, origin }) -> { object, update(camera) }. tone(p) is 0 (full) .. 1 (melted into the backdrop), as for the old seam lines.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const SEAM = 0, JOINT = 1, GRAIN = 2, INK = 1;   // INK: the heaviest a floor stroke gets (furniture lines are 1)

// open-plan floor zones: clip: [x0, z0, x1, z1] keeps only the lines inside that cell (cut clean at its edge); except: cells whose lines are left out (the default floor skips the zones); edge: [[x, z], [x, z]] a straight divider drawn where two zones meet.
export function floorLines(kit, { style, bb, M, tone, seed = 1, board = 140, angle = 0, cell = 600, origin, clip, except = [], edge }) {
  const R = rng(seed * 7919 + 13), segs = [];   // { a, b, ia, ib, kind, sp }: end points [x, z], ink at each end, kind, the spacing it belongs to
  const cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2, ext = Math.hypot(bb.x1 - bb.x0, bb.z1 - bb.z0) / 2 + M;
  const ca = Math.cos(angle), sa = Math.sin(angle), P = (u, v) => [cx + ca * u - sa * v, cz + sa * u + ca * v];
  const inside = (p, c) => p[0] >= c[0] && p[0] <= c[2] && p[1] >= c[1] && p[1] <= c[3];
  const add = (a, b, ia, ib, kind, sp) => {
    if (clip) { let t0 = 0, t1 = 1; const d = [b[0] - a[0], b[1] - a[1]]; for (const [p, q, lo, hi] of [[d[0], a[0], clip[0], clip[2]], [d[1], a[1], clip[1], clip[3]]]) { if (Math.abs(p) < 1e-9) { if (q < lo || q > hi) return; } else { let u = (lo - q) / p, v = (hi - q) / p; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); } } if (t1 - t0 < 1e-6) return; const a2 = [a[0] + d[0] * t0, a[1] + d[1] * t0], b2 = [a[0] + d[0] * t1, a[1] + d[1] * t1], i0 = ia + (ib - ia) * t0, i1 = ia + (ib - ia) * t1; a = a2; b = b2; ia = i0; ib = i1; }
    else if (except.length && except.some((c) => inside([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c))) return;
    const ta = 1 - tone([a[0], 0, a[1]]), tb = 1 - tone([b[0], 0, b[1]]); ia *= ta; ib *= tb; if (ia < 0.03 && ib < 0.03) return; segs.push({ a, b, ia, ib, kind, sp }); };
  // a pencil stroke from p to q in pieces whose weight swells in the middle and wobbles
  const stroke = (p, q, ink, kind, sp, n = 4) => { const w = []; for (let i = 0; i <= n; i++) w.push(ink * (0.5 + 0.5 * Math.sin(Math.PI * i / n)) * (0.8 + 0.2 * R())); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; add([p[0] + (q[0] - p[0]) * t0, p[1] + (q[1] - p[1]) * t0], [p[0] + (q[0] - p[0]) * t1, p[1] + (q[1] - p[1]) * t1], w[i], w[i + 1], kind, sp); } };
  // a long line as dashes with gaps (about a third missing)
  const broken = (a, b, sp, ink) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len]; let s = -R() * 600; while (s < len) { const dl = 250 + R() * 850, e = Math.min(len, s + dl), s0 = Math.max(0, s); if (e > s0 + 40) stroke([a[0] + d[0] * s0, a[1] + d[1] * s0], [a[0] + d[0] * e, a[1] + d[1] * e], ink * (0.55 + 0.45 * R()), SEAM, sp, Math.max(2, Math.round((e - s0) / 220))); s += dl + (R() < 0.3 ? 200 + R() * 500 : 50 + R() * 250); } };
  if (style === 'boards') {
    let prev = [];   // joints of the previous row, so neighbours stay 300 mm apart and never repeat
    const rows = Math.ceil(ext / board);
    for (let r = -rows; r < rows; r++) {
      const v0 = r * board, v1 = v0 + board, joints = []; let u = -ext - R() * 1200;
      while (u < ext) { let L = 900 + R() * 1500, tries = 0; while (tries++ < 24 && prev.some((j) => Math.abs(u + L - j) < 300)) L = 900 + R() * 1500; u += L; joints.push(u); }
      broken(P(-ext, v1), P(ext, v1), board, 1);
      let s = -ext;
      for (const j of joints) {
        if (R() < 0.85) { const o = (R() - 0.5) * 0.1 * board; stroke(P(j, v0 + board * 0.16 + o), P(j, v1 - board * 0.16 + o), 0.5, JOINT, board, 2); }
        if (R() < 0.2) { for (let k = 0, m = 2 + Math.floor(R() * 2); k < m; k++) { const vv = v0 + board * (0.2 + 0.6 * R()), a = s + 80 + R() * Math.max(10, j - s - 700), l = 150 + R() * 400; stroke(P(a, vv), P(Math.min(j - 40, a + l), vv + (R() - 0.5) * 6), 0.4, GRAIN, board, 3); }
          if (R() < 0.4) { const kx = s + 150 + R() * Math.max(10, j - s - 300), kv = v0 + board * (0.35 + 0.3 * R()); for (let q = 0; q < 10; q++) { const t0 = q / 10 * 6.2832, t1 = (q + 1) / 10 * 6.2832; add(P(kx + Math.cos(t0) * 16, kv + Math.sin(t0) * 6), P(kx + Math.cos(t1) * 16, kv + Math.sin(t1) * 6), 0.4, 0.4, GRAIN, board); } } }
        s = j;
      }
      prev = joints;
    }
  } else if (style === 'tiles') {
    const org = origin || [bb.x0, bb.z0];
    for (let z = org[1] + Math.ceil((bb.z0 - M - org[1]) / cell) * cell; z <= bb.z1 + M; z += cell) broken([bb.x0 - M, z], [bb.x1 + M, z], cell, 1);
    for (let x = org[0] + Math.ceil((bb.x0 - M - org[0]) / cell) * cell; x <= bb.x1 + M; x += cell) broken([x, bb.z0 - M], [x, bb.z1 + M], cell, 1);
  }
  if (edge) { const [a, b] = edge, len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(2, Math.round(len / 500)); for (let i = 0; i < k; i++) stroke([a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k], [a[0] + (b[0] - a[0]) * (i + 1) / k, a[1] + (b[1] - a[1]) * (i + 1) / k], 1, SEAM, 1200, 2); }   // the divider: a clean straight line
  const n = segs.length, pos = new Float32Array(n * 6);
  segs.forEach((g, i) => pos.set([g.a[0], -2, g.a[1], g.b[0], -2, g.b[1]], i * 6));
  const set = kit.strokeSet(pos.length ? pos : new Float32Array(6)), mid = segs.map((g) => [(g.a[0] + g.b[0]) / 2, (g.a[1] + g.b[1]) / 2]);
  let last = null;
  const update = (camera) => {
    if (!n) return;
    const cp = camera.position, key = `${cp.x | 0},${cp.y | 0},${cp.z | 0},${camera.fov},${typeof innerHeight === 'number' ? innerHeight : 800}`;
    if (key === last) return; last = key;
    const f = (typeof innerHeight === 'number' ? innerHeight : 800) / (2 * Math.tan(camera.fov * Math.PI / 360)), [ir, ig, ib] = set.ink, [br, bg, bb2] = set.back, c = set.colors;
    for (let i = 0; i < n; i++) {
      const g = segs[i], dx = mid[i][0] - cp.x, dy = -cp.y, dz = mid[i][1] - cp.z, dist = Math.hypot(dx, dy, dz) || 1, px = g.sp * f * Math.abs(dy) / dist / dist;
      let k = sm(2.5, 9, px);
      if (g.kind === GRAIN) k *= 1 - sm(2500, 6000, dist);
      else if (g.kind === JOINT) k *= 0.9;
      for (let e = 0; e < 2; e++) { const a = Math.min(1, (e ? g.ib : g.ia) * INK * k), o = i * 6 + e * 3; c[o] = br + (ir - br) * a; c[o + 1] = bg + (ig - bg) * a; c[o + 2] = bb2 + (ib - bb2) * a; }
    }
    set.commit();
  };
  return { object: set.line, update };
}
