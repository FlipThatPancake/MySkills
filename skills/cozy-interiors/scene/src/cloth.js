// @js:cloth — a small cloth dropped onto boxes and frozen. Pure numbers (no three.js), so compose.mjs runs it at spec time and scene.json keeps the resulting grid.
// A heightfield `height(x, z)` (with .top) can stand in for boxes: the top surface of a merged piece of furniture.
// dropCloth({ boxes: [[x0, y0, z0, x1, y1, z1]], at: [x, z], w, d, nx, ny, seed, steps }) -> { nx, ny, pts: flat [x, y, z] in mm } in the boxes' frame. x spans w, z spans d.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function dropCloth({ boxes = [], height = null, at, w, d, nx = 26, ny = 26, seed = 1, steps = 420, margin = 9, spin = 0 }) {
  const R = rng(seed * 104729 + 7), n = nx * ny, P = new Float64Array(n * 3), Q = new Float64Array(n * 3), top = Math.max(0, height?.top || 0, ...boxes.map((b) => b[4]));
  const ca = Math.cos(spin), sa = Math.sin(spin), id = (i, j) => j * nx + i;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const u = (i / (nx - 1) - 0.5) * w, v = (j / (ny - 1) - 0.5) * d, k = id(i, j) * 3;
    P[k] = at[0] + u * ca - v * sa + (R() - 0.5) * 4; P[k + 1] = top + 120 + (R() - 0.5) * 30 + 40 * Math.sin(i * 0.7 + j * 0.4); P[k + 2] = at[1] + u * sa + v * ca + (R() - 0.5) * 4;
    Q[k] = P[k]; Q[k + 1] = P[k + 1]; Q[k + 2] = P[k + 2];
  }
  const cons = [];   // [a, b, rest]: structural, shear and bend links
  const link = (i0, j0, i1, j1) => { if (i1 < 0 || j1 < 0 || i1 >= nx || j1 >= ny) return; const a = id(i0, j0) * 3, b = id(i1, j1) * 3; cons.push([a, b, Math.hypot(P[a] - P[b], P[a + 2] - P[b + 2])]); };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { link(i, j, i + 1, j); link(i, j, i, j + 1); link(i, j, i + 1, j + 1); link(i, j, i + 1, j - 1); link(i, j, i + 2, j); link(i, j, i, j + 2); }
  const g = 1.2;   // mm per step squared: slow enough that nothing tunnels through a box
  for (let s = 0; s < steps; s++) {
    for (let k = 0; k < n * 3; k += 3) {
      const vx = (P[k] - Q[k]) * 0.985, vy = (P[k + 1] - Q[k + 1]) * 0.985, vz = (P[k + 2] - Q[k + 2]) * 0.985;
      Q[k] = P[k]; Q[k + 1] = P[k + 1]; Q[k + 2] = P[k + 2];
      P[k] += vx; P[k + 1] += vy - g; P[k + 2] += vz;
    }
    for (let it = 0; it < 7; it++) {
      for (const [a, b, rest] of cons) {
        const dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2], L = Math.hypot(dx, dy, dz) || 1e-6, f = (L - rest) / L * 0.5;
        P[a] += dx * f; P[a + 1] += dy * f; P[a + 2] += dz * f; P[b] -= dx * f; P[b + 1] -= dy * f; P[b + 2] -= dz * f;
      }
      for (let k = 0; k < n * 3; k += 3) {
        if (P[k + 1] < 5) { P[k + 1] = 5; Q[k] += (P[k] - Q[k]) * 0.5; Q[k + 2] += (P[k + 2] - Q[k + 2]) * 0.5; }
        if (height) { const hh = height(P[k], P[k + 2]) + margin; if (hh > margin && P[k + 1] < hh) { P[k + 1] = hh; Q[k] += (P[k] - Q[k]) * 0.35; Q[k + 2] += (P[k + 2] - Q[k + 2]) * 0.35; Q[k + 1] = P[k + 1]; } }
        for (const b of boxes) {
          const x0 = b[0] - margin, y0 = b[1] - margin, z0 = b[2] - margin, x1 = b[3] + margin, y1 = b[4] + margin, z1 = b[5] + margin;
          if (P[k] <= x0 || P[k] >= x1 || P[k + 1] <= y0 || P[k + 1] >= y1 || P[k + 2] <= z0 || P[k + 2] >= z1) continue;
          const pen = [P[k] - x0, x1 - P[k], P[k + 1] - y0, y1 - P[k + 1], P[k + 2] - z0, z1 - P[k + 2]]; let m = 0; for (let q = 1; q < 6; q++) if (pen[q] < pen[m]) m = q;
          const ax = m >> 1, sgn = m % 2 ? 1 : -1, val = [x0, x1, y0, y1, z0, z1][m]; P[k + ax] = val;
          for (let o = 0; o < 3; o++) if (o !== ax) Q[k + o] += (P[k + o] - Q[k + o]) * 0.35;   // friction: it grips what it lands on
          Q[k + ax] = P[k + ax] - sgn * 0 ;
        }
      }
    }
  }
  return { nx, ny, pts: Array.from(P, (v) => Math.round(v)) };
}

// A heightfield from triangles: the highest surface at each 20 mm cell, sampled inside the triangles; lookup is the nearest cell (0 where nothing stands).
export function heightField(tris, cell = 20) {
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const t of tris) for (let k = 0; k < 9; k += 3) { x0 = Math.min(x0, t[k]); x1 = Math.max(x1, t[k]); z0 = Math.min(z0, t[k + 2]); z1 = Math.max(z1, t[k + 2]); }
  const W = Math.ceil((x1 - x0) / cell) + 2, D = Math.ceil((z1 - z0) / cell) + 2, H = new Float32Array(W * D); let top = 0;
  for (const t of tris) {
    const ax = t[0], ay = t[1], az = t[2], bx = t[3], by = t[4], bz = t[5], cx = t[6], cy = t[7], cz = t[8], den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(den) < 1e-6) continue;
    const i0 = Math.floor((Math.min(ax, bx, cx) - x0) / cell), i1 = Math.ceil((Math.max(ax, bx, cx) - x0) / cell), j0 = Math.floor((Math.min(az, bz, cz) - z0) / cell), j1 = Math.ceil((Math.max(az, bz, cz) - z0) / cell);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = x0 + i * cell, z = z0 + j * cell, u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den, w = 1 - u - v, e = -0.15;
      if (u < e || v < e || w < e) continue; const y = u * ay + v * by + w * cy; if (y > H[j * W + i]) { H[j * W + i] = y; if (y > top) top = y; }
    }
  }
  for (let pass = 0; pass < 2; pass++) { const B = H.slice(); for (let j = 1; j < D - 1; j++) for (let i = 1; i < W - 1; i++) { const k = j * W + i; if (B[k] > 0) H[k] = (B[k] * 4 + B[k - 1] + B[k + 1] + B[k - W] + B[k + W]) / 8; } }   // soften the steps between cells
  const f = (x, z) => { const fx = (x - x0) / cell, fz = (z - z0) / cell, i = Math.floor(fx), j = Math.floor(fz); if (i < 0 || j < 0 || i >= W - 1 || j >= D - 1) return 0; const tx = fx - i, tz = fz - j, k = j * W + i; return (H[k] * (1 - tx) + H[k + 1] * tx) * (1 - tz) + (H[k + W] * (1 - tx) + H[k + W + 1] * tx) * tz; };
  f.top = top; return f;
}
