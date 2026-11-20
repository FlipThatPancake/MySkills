// @js:motion-wind — a breeze from the area's open window that moves the leaves of the plants near it. A rolled `wind` entry needs an open window and a leafy plant within 1.5 m of it
// (rules.js WIND_REACH): the roll deals it only where the area has a sill plant, and the build reports an error when none stands that close, so it can never count as a mover without one.
// Plants with their own blade update (kitchen/plant.js: userData.gust and windUpdate) run that. Every other plant bends its foliage: each vertex above the pot shifts downwind by its
// height above the rim squared, so the tips move 5 to 8 degrees (a plant's own number) and the pot stays put; a light flutter rides on the swell. A hanging plant (asset hangingPlant,
// or mounted from the ceiling) swings from its hook instead. The plant builder owns plant geometry; this file only moves its vertices, and puts them back exactly at rest.
// A gust series is 2 or 3 swells of 1.5 to 2.5 s with short lulls, then 4 to 8 s of calm. Nothing moves while the window is shut.
import { PLANT_ASSETS as PLANTS, WIND_REACH } from './rules.js';
const ss = (x) => x * x * (3 - 2 * x);
export default {
  build(ctx) {
    const { T, rnd, via, objects } = ctx;
    if (!via) return { error: 'wind: no open window to blow in from', update() {} };
    const dist = (o) => { const c = o.box.getCenter(new T.Vector3()); return Math.hypot(c.x - via.centre[0], c.z - via.centre[1]); };
    const plants = objects.filter((o) => PLANTS.includes(o.asset) && dist(o) <= WIND_REACH);
    if (!plants.length) return { error: `wind: no leafy plant within ${WIND_REACH} mm of the open window (${via.id}): put the plant on its sill, or deal no wind`, update() {} };
    for (const p of plants) {
      p.a = 0; p.v = 0; p.d = dist(p); p.k = Math.min(1, 1.15 - p.d / 3000); p.delay = Math.min(0.3, p.d / 8000); p.own = !!p.g.userData.windUpdate;
      p.theta = (5 + rnd(0, 3)) * Math.PI / 180; p.ph = rnd(0, 6); p.hang = p.asset === 'hangingPlant' || p.g.userData.scene?.mount === 'ceiling';
      if (p.own) continue;
      const seen = new Map(), parts = [];
      p.g.traverse((o) => {
        const geo = o.geometry; if (!geo || !geo.attributes) return; o.frustumCulled = false;
        for (const name of ['position', 'instanceStart', 'instanceEnd']) {
          const at = geo.attributes[name]; if (!at) continue;
          const il = !!at.isInterleavedBufferAttribute, arr = il ? at.data.array : at.array, stride = il ? at.data.stride : at.itemSize, off = il ? at.offset : 0;
          if (!seen.has(arr)) seen.set(arr, { orig: arr.slice(), offs: new Set() }); const s = seen.get(arr); if (s.offs.has(off)) continue; s.offs.add(off);
          parts.push({ arr, stride, off, orig: s.orig, flag: il ? at.data : at });
        }
      });
      let lo = 1e9, hi = -1e9;
      for (const q of parts) for (let i = q.off; i + 2 < q.orig.length; i += q.stride) { const y = q.orig[i + 1]; if (y < lo) lo = y; if (y > hi) hi = y; }
      p.parts = parts; p.lo = p.hang ? lo : lo + 0.3 * (hi - lo); p.hi = hi; if (p.hang) { p.hi = hi; p.lo = lo; }
      const dl = new T.Vector3(via.n[0], 0, via.n[1]).applyQuaternion(p.g.quaternion.clone().invert()); p.dx = dl.x; p.dz = dl.z;
    }
    const n = new T.Vector3(via.n[0], 0, via.n[1]);
    let clock = 0, keys = [[0, 0]], start = -99, end = -99, next = 1 + rnd(0, 1.5);
    const level = (t) => { if (t <= 0 || t >= keys[keys.length - 1][0]) return 0; let i = 1; while (keys[i][0] < t) i++; const [t0, l0] = keys[i - 1], [t1, l1] = keys[i]; return l0 + (l1 - l0) * ss((t - t0) / (t1 - t0)); };
    const gust = () => {
      const m = rnd() < 0.5 ? 2 : 3; let t = 0, peak = 0.75 + rnd(0, 0.25); keys = [[0, 0]];
      for (let i = 0; i < m; i++) { t += rnd(1.5, 2.5); keys.push([t, peak]); if (i < m - 1) { t += rnd(1.5, 2.5); keys.push([t, peak * 0.25]); t += rnd(0.5, 1.5); keys.push([t, peak * 0.25]); peak = Math.min(1, peak * rnd(1.1, 1.3)); } else { t += rnd(1.5, 2.5); keys.push([t, 0]); } }
      start = clock; end = clock + t; next = end + rnd(4, 8);
    };
    const bend = (p, a, lvl) => {   // a: the spring's bend 0..1, lvl: the wind level for the flutter
      const span = Math.max(1, p.hi - p.lo), sin = Math.sin(p.theta), flut = 0.012 * lvl;
      for (const q of p.parts) {
        const { arr, stride, off, orig } = q;
        for (let i = off; i + 2 < orig.length; i += stride) {
          const x = orig[i], y = orig[i + 1], z = orig[i + 2], h = Math.min(1, Math.max(0, p.hang ? (p.hi - y) / span : (y - p.lo) / span));
          if (!h) { arr[i] = x; arr[i + 1] = y; arr[i + 2] = z; continue; }
          const d = span * (a * sin * h * h + flut * h * Math.sin(9 * clock + 0.02 * (x + z) + p.ph));
          arr[i] = x + p.dx * d; arr[i + 1] = y; arr[i + 2] = z + p.dz * d;
        }
        q.flag.needsUpdate = true;
      }
    };
    return {
      plants,
      update(dt) {
        const open = via.open() > 0.02;
        clock += dt;
        if (open && clock >= next) gust();
        for (const p of plants) {
          if (p.own) { if (open) p.g.userData.windUpdate(dt); continue; }
          const lv = open ? level(clock - start - p.delay) : 0, target = p.k * lv, steps = Math.ceil(dt / (1 / 120)), h = dt / steps;
          for (let s = 0; s < steps; s++) { p.v += (60 * (target - p.a) - 11 * p.v) * h; p.a += p.v * h; }
          const rest = Math.abs(p.a) < 1e-4 && Math.abs(p.v) < 1e-3 && lv === 0;
          if (rest) { if (p.a || p.moved) { p.a = p.v = 0; p.moved = false; bend(p, 0, 0); } continue; }
          p.moved = true; bend(p, p.a, lv);
        }
      },
    };
  },
};
