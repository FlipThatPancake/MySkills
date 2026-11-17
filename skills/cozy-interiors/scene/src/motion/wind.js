// @js:motion-wind — a breeze from the area's open window that moves its plants. A rolled `wind` entry needs an open window and a plant.
// Plants with their own blade update (kitchen/plant.js: userData.gust and windUpdate) run that; every other plant leans a little away from the window and eases back, by turning
// the whole plant about its foot (at most 2.2 degrees: an upright plant's tip moves about 35 mm). The plant builder owns plant geometry; this file only moves it.
// A gust series is 2 or 3 swells of 1.5 to 2.5 s with short lulls, then 4 to 8 s of calm. Nothing moves while the window is shut.
import { PLANT_ASSETS as PLANTS } from './rules.js';
const ss = (x) => x * x * (3 - 2 * x);
export default {
  build(ctx) {
    const { T, rnd, via, objects } = ctx, plants = objects.filter((o) => PLANTS.includes(o.asset));
    if (!plants.length) return { error: 'wind: no plant in this area', update() {} };
    const n = via ? new T.Vector3(via.n[0], 0, via.n[1]) : new T.Vector3(0, 0, 1), up = new T.Vector3(0, 1, 0), axis = new T.Vector3().crossVectors(up, n).normalize();
    for (const p of plants) {
      p.q0 = p.g.quaternion.clone(); p.a = 0; p.v = 0; p.tilt = new T.Quaternion();
      const d = via ? Math.hypot(p.box.getCenter(new T.Vector3()).x - via.centre[0], p.box.getCenter(new T.Vector3()).z - via.centre[1]) : 2000;
      p.k = Math.min(1, Math.max(0.3, 1.2 - d / 4000)); p.delay = Math.min(0.4, d / 8000); p.own = !!p.g.userData.windUpdate;
    }
    let clock = 0, keys = [[0, 0]], start = -99, end = -99, next = 1 + rnd(0, 1.5);
    const level = (t) => { if (t <= 0 || t >= keys[keys.length - 1][0]) return 0; let i = 1; while (keys[i][0] < t) i++; const [t0, l0] = keys[i - 1], [t1, l1] = keys[i]; return l0 + (l1 - l0) * ss((t - t0) / (t1 - t0)); };
    const gust = () => {
      const m = rnd() < 0.5 ? 2 : 3; let t = 0, peak = 0.7 + rnd(0, 0.2); keys = [[0, 0]];
      for (let i = 0; i < m; i++) { t += rnd(1.5, 2.5); keys.push([t, peak]); if (i < m - 1) { t += rnd(1.5, 2.5); keys.push([t, peak * 0.25]); t += rnd(0.5, 1.5); keys.push([t, peak * 0.25]); peak = Math.min(1, peak * rnd(1.1, 1.3)); } else { t += rnd(1.5, 2.5); keys.push([t, 0]); } }
      start = clock; end = clock + t; next = end + rnd(4, 8);
    };
    return {
      plants,
      update(dt) {
        const open = !via || via.open() > 0.02;
        clock += dt;
        if (open && clock >= next) gust();
        for (const p of plants) {
          if (p.own) { if (open) p.g.userData.windUpdate(dt); continue; }
          const w = open ? level(clock - start - p.delay) : 0, target = 0.038 * p.k * w, h = dt / Math.ceil(dt / (1 / 120));
          for (let s = 0; s < Math.ceil(dt / (1 / 120)); s++) { p.v += (90 * (target - p.a) - 12 * p.v) * h; p.a += p.v * h; }
          if (Math.abs(p.a) < 1e-5 && Math.abs(p.v) < 1e-4) { p.a = p.v = 0; }
          p.g.quaternion.copy(p.tilt.setFromAxisAngle(axis, p.a)).multiply(p.q0); p.g.updateMatrixWorld(true);
        }
      },
    };
  },
};
