// The one measure of a wall slot. compose.mjs (a.slots(), a.group({ slot })) and roll.mjs (the roll's slot deal) both call it, so the deal and the built shell cannot disagree.
//   a wall is cut where an opening stands (its zone), where a piece already stands on the floor, and the bare stretches in between are what a group can use;
//   a slot is a third of the wall (left, middle, right as the camera sees it); a group of `width` fits when one bare stretch holds it with its middle in that third.
import { STYLE, DEFAULTS } from './src/openings.js';
export const THIRD = ['left', 'middle', 'right'];
export const openingWidth = (o) => o.width ?? STYLE[o.style]?.width ?? DEFAULTS[o.kind]?.width ?? 800;   // what the shell builds: the opening's own width, else its style's, else its kind's
export const zone = (o) => { const w = openingWidth(o); return o.kind === 'window' ? w / 2 + 300 : o.kind === 'door' ? w / 2 + 450 : o.kind === 'arch' ? w / 2 + 150 : w / 2 + 100; };   // a window keeps its curtain, a door its swing, an arch its casing clear
export const bareStretches = (len, cuts) => { const bare = []; let at = 0; for (const c of [...cuts].sort((p, q) => p.a - q.a)) { if (c.a > at) bare.push([at, Math.min(c.a, len)]); at = Math.max(at, c.b); } if (at < len) bare.push([at, len]); return bare; };
// `inWindow`: a group that stands in or under a window (a window seat, a sofa under a window) is not cut by the windows; it is centred on one when it can be
export const thirdSlot = (len, cuts, i, width, windows = []) => {
  const bare = bareStretches(len, cuts), lo = i * len / 3, hi = (i + 1) * len / 3, mid = (lo + hi) / 2; let best = null;
  for (const [a, b] of bare) { if (b - a < width) continue; const m0 = Math.max(a + width / 2, lo), m1 = Math.min(b - width / 2, hi); if (m0 > m1) continue; const want = windows.find((x) => x >= m0 && x <= m1) ?? mid, xc = Math.round(Math.min(Math.max(want, m0), m1) / 10) * 10; if (!best || Math.abs(xc - mid) < Math.abs(best.xc - mid)) best = { xc, stretch: [Math.round(a), Math.round(b)] }; }
  const here = bare.filter(([a, b]) => b > lo && a < hi).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
  return { range: [Math.round(lo), Math.round(hi)], bare: here.map(([a, b]) => [Math.round(a), Math.round(b)]), widest: Math.round(Math.max(0, ...here.map(([a, b]) => Math.min(b, hi) - Math.max(a, lo)))), best: best ? [best.xc - width / 2, best.xc + width / 2].map(Math.round) : null, xc: best ? best.xc : null, stretch: best?.stretch || null };
};
// 'window:*' is the wall that holds a window, else the second wall: walls is [{ id, window: boolean }] in the order the shell builds them (back first)
export const slotWall = (walls) => (walls.find((w) => w.window) || walls[1] || walls[0]);
