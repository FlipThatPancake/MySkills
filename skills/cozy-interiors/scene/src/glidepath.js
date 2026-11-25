// @js:glidepath — the camera's walk through the house plan (pure maths, no three.js: the page and the glide check use the same curve).
// A move between areas follows the plan's ways through: the camera is pulled to eye height at each opening and looks ahead through it, and eases from one home view to the next along a smooth curve (a Catmull-Rom spline through the openings), so it turns as it walks.
// links: S.home.plan.links = [{ a, b, kind, p: [x, z] (world, mm), d: [dx, dz] (travel from a to b) }]
const rad = (d) => d * Math.PI / 180;
export const camPos = (target, dist, az, el) => { const phi = rad(90 - el), th = rad(az); return [target[0] + dist * Math.sin(phi) * Math.sin(th), target[1] + dist * Math.cos(phi), target[2] + dist * Math.sin(phi) * Math.cos(th)]; };
export function route(links, from, to) {   // the shortest chain of ways from one area to another: [{ p, d }] with d in the direction of travel
  if (!links || from === to) return [];
  const prev = { [from]: null }, q = [from];
  while (q.length) { const u = q.shift(); if (u === to) break; for (const l of links) { const [x, y, s] = l.a === u ? [l.b, 1, l] : l.b === u ? [l.a, -1, l] : [null]; if (x && !(x in prev)) { prev[x] = { u, l, s: y }; q.push(x); } } }
  if (!(to in prev)) return [];
  const out = []; for (let n = to; prev[n]; n = prev[n].u) out.unshift({ p: prev[n].l.p, d: prev[n].s > 0 ? prev[n].l.d : prev[n].l.d.map((v) => -v), kind: prev[n].l.kind });
  return out;
}
const spline = (P, u) => { const n = P.length - 1, x = Math.min(n - 1e-9, Math.max(0, u * n)), j = Math.floor(x), t = x - j, q = (k) => P[Math.min(n, Math.max(0, k))], [a, b, c, d] = [q(j - 1), q(j), q(j + 1), q(j + 2)];   // Catmull-Rom: the curve passes through every point, so it crosses each opening exactly where the plan put it
  return [0, 1, 2].map((i) => 0.5 * (2 * b[i] + (-a[i] + c[i]) * t + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * t * t + (-a[i] + 3 * b[i] - 3 * c[i] + d[i]) * t * t * t)); };
// from, to: { target, az, el, dist } (the camera's stance); eye: the camera's height at an opening
export function glidePath(from, to, ways, opts = {}) {
  opts = { eye: 1900, height: 2700, ...opts }; const eye = opts.eye;
  const p0 = camPos(from.target, from.dist, from.az, from.el), p1 = camPos(to.target, to.dist, to.az, to.el);
  // an open-plan seam is no opening in a wall: the camera passes over it. The camera walks through an opening only when its two ends lie on opposite sides of the wall (then the way is a way forward); otherwise it passes over the wall and only its aim goes through the opening
  const eyeH = Math.max(p0[1], p1[1], opts.height + 300) * 1.4, wayPt = (w) => [w.p[0], eyeH, w.p[1]], side = (w, q) => (q[0] - w.p[0]) * w.d[0] + (q[2] - w.p[1]) * w.d[1], walk = ways.filter((w, i) => w.kind !== 'open' && side(w, i ? wayPt(ways[i - 1]) : p0) < 0 && side(w, i + 1 < ways.length ? wayPt(ways[i + 1]) : p1) > 0);
  // the move leaves along the start view's own line (backing out from its aim) and arrives along the destination's (from behind its camera), so it settles into the home view instead of dropping onto it
  const behind = (st, p, f) => { const v = [p[0] - st.target[0], p[1] - st.target[1], p[2] - st.target[2]], L = Math.hypot(...v) || 1; return [p[0] + v[0] / L * f * st.dist, p[1] + v[1] / L * f * st.dist, p[2] + v[2] / L * f * st.dist]; };
  const cam = [p0, ...walk.map(wayPt), p1];   // no backing out at either end (round 6: "close-up, pull away, close-up"): the camera goes straight from the one view to the other, through the openings
  if (!walk.length && ways.length) {   // with no wall to walk through (an open room, or ends on one side of the way) the camera takes a curved path: it backs out sideways from the straight line (away from where it looks) and comes round into the next view, so a small turn still reads as a walk, not a slide
    const c = [p1[0] - p0[0], p1[2] - p0[2]], L = Math.hypot(...c) || 1, n = [-c[1] / L, c[0] / L], look = [from.target[0] - p0[0] + to.target[0] - p1[0], from.target[2] - p0[2] + to.target[2] - p1[2]], sg = n[0] * look[0] + n[1] * look[1] > 0 ? -1 : 1;
    cam.splice(1, 0, [(p0[0] + p1[0]) / 2 + n[0] * sg * 0.22 * L, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + n[1] * sg * 0.22 * L]); }
  const  aim = [from.target, to.target];   // the aim blends from the start target to the destination's own view target, so the middle frames show the room being entered. The camera crosses a wall like a crane, at the home-view height or above (the walls fade as it passes): the opening sets the route, not the height
  const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }, hi = (home) => home + 1500;
  const pos = (u) => {   // the lift eases in over the first twentieth of the path and out over the last, so a wall right beside a home view is passed over
    const q = spline(cam, u), near = walk.length ? Math.min(...walk.map((w) => Math.hypot(q[0] - w.p[0], q[2] - w.p[1]))) : 1e9, w = smooth((near - 400) / 1000) * smooth(Math.min(u, 1 - u) / 0.05);; return [q[0], q[1] + Math.max(0, hi(opts.height) - q[1]) * w, q[2]]; };
  // even speed (round 6 B3): the progress e (0 to 1) is turned into a distance along the walked line, so the camera covers equal lengths in equal times whatever the spacing of the points; secs grows with the length
  const N = 240, tab = [0]; { let q = pos(0); for (let i = 1; i <= N; i++) { const r = pos(i / N); tab.push(tab[i - 1] + Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2])); q = r; } }
  const len = tab[N] || 1, param = (e) => { const s = Math.min(1, Math.max(0, e)) * len; let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] <= s) lo = m; else hi = m; } return (lo + (tab[hi] > tab[lo] ? (s - tab[lo]) / (tab[hi] - tab[lo]) : 0)) / N; };
  // the aim blends from the start target to the destination's, and is pushed out along its own direction whenever the camera would look down steeper than 58 degrees (the move reads as looking into a room, never down on a plan the page does not show)
  const tgt = (e) => { const u = param(e), c = pos(u), k = smooth(e), t = [0, 1, 2].map((i) => from.target[i] + (to.target[i] - from.target[i]) * k), h = [t[0] - c[0], t[2] - c[2]], dy = c[1] - t[1], hl = Math.hypot(...h); if (dy <= 0 || Math.atan2(dy, hl) <= rad(MAXPITCH)) return t;
    let d = h; if (hl < 1) { const b = pos(param(Math.min(1, e + 0.03))), a = pos(param(Math.max(0, e - 0.03))); d = [b[0] - a[0], b[2] - a[2]]; } const L = Math.hypot(...d) || 1, need = dy / Math.tan(rad(MAXPITCH)); return [c[0] + d[0] / L * need, t[1], c[2] + d[1] / L * need]; };
  return { pos: (e) => pos(param(e)), tgt, ways, len, secs: glideSecs(len) };
}
const MAXPITCH = 58;
export const GLIDE_SPEED = 5000, GLIDE_MIN_S = 1.6, GLIDE_MAX_S = 6;   // mm per second on average (the ease at both ends makes the middle up to 1.5 times that), and the shortest and longest a move lasts
export const glideSecs = (len) => Math.min(GLIDE_MAX_S, Math.max(GLIDE_MIN_S, len / GLIDE_SPEED));   // a longer move takes longer, so a long way through is no faster than a short one
