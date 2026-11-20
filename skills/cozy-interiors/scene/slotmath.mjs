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
  for (const [a, b] of bare) { if (b - a < width - 1) continue; const m0 = Math.max(a + width / 2, lo), m1 = Math.min(b - width / 2, hi); if (m0 > m1 + 1) continue; const want = windows.find((x) => x >= m0 && x <= m1) ?? mid, xc = Math.round(Math.min(Math.max(want, m0), m1) / 10) * 10; if (!best || Math.abs(xc - mid) < Math.abs(best.xc - mid)) best = { xc, stretch: [Math.round(a), Math.round(b)] }; }
  const here = bare.filter(([a, b]) => b > lo && a < hi).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
  return { range: [Math.round(lo), Math.round(hi)], bare: here.map(([a, b]) => [Math.round(a), Math.round(b)]), widest: Math.round(Math.max(0, ...here.map(([a, b]) => Math.min(b, hi) - Math.max(a, lo)))), best: best ? [best.xc - width / 2, best.xc + width / 2].map(Math.round) : null, xc: best ? best.xc : null, stretch: best?.stretch || null };
};
// 'window:*' is the wall that holds a window, else the second wall: walls is [{ id, window: boolean }] in the order the shell builds them (back first)
export const slotWall = (walls) => (walls.find((w) => w.window) || walls[1] || walls[0]);

// the open floor: a floor slot is a band (back | middle | front: 30 / 40 / 30 percent of the depth) and a third (left | middle | right) of the room's rect [x0, z0, x1, z1]
export const FLOOR_BANDS = { back: [0, 0.3], middle: [0.3, 0.7], front: [0.7, 1] }, FLOOR_THIRDS = { all: [0, 1], left: [0, 1 / 3], middle: [1 / 3, 2 / 3], right: [2 / 3, 1] };
export const floorBox = (rect, band, third = 'all') => { const [x0, z0, x1, z1] = rect, W = x1 - x0, D = z1 - z0, [d0, d1] = FLOOR_BANDS[band], [w0, w1] = FLOOR_THIRDS[third]; return [Math.round(x0 + W * w0), Math.round(z0 + D * d0), Math.round(x0 + W * w1), Math.round(z0 + D * d1)]; };
// where a group of w x d (a floating group stands d out from a line 900 mm off the back wall or more) can stand in a floor slot's box without lying over what already stands (`reserved`: [x0, z0, x1, z1] rects of the groups already placed, 650 mm kept clear: placement-9 wants 600 to walk between).
// The box's middle (kept 1400 mm off the back wall, 1000 off the front edge, 1100 off the sides) is the place when it is clear; else the nearest clear place inside the box; null when none
export const floorSpot = (rect, box, reserved, w, d) => {
  const [x0, z0, x1, z1] = rect, mid = [Math.round(Math.max(Math.min((box[0] + box[2]) / 2, x1 - 1100), x0 + 1100) / 10) * 10, Math.round(Math.max(Math.min((box[1] + box[3]) / 2, z1 - 1000), z0 + 1400) / 10) * 10];
  const span = (at) => { const top = Math.max(at[1] - d / 2, z0 + 900); return [at[0] - w / 2, top, at[0] + w / 2, top + d]; }, clear = (at) => { const r = span(at); return !reserved.some((q) => r[0] < q[2] + 650 && r[2] > q[0] - 650 && r[1] < q[3] + 650 && r[3] > q[1] - 650); };
  if (clear(mid)) return mid;
  let best = null;
  for (let x = box[0]; x <= box[2]; x += 100) for (let z = box[1]; z <= box[3]; z += 100) { const at = [x, z], r = span(at); if (r[0] < x0 + 100 || r[2] > x1 - 100 || r[3] > z1 - 100 || !clear(at)) continue; const dd = Math.hypot(x - mid[0], z - mid[1]); if (!best || dd < best[0]) best = [dd, at]; }
  return best ? best[1] : null;
};

// what a group already placed holds of the floor, seen from a wall: the rect's corners in the wall's own frame (ox along it, off out from it), so a wall group standing along another wall is cut where that rect reaches into its depth
export const rectCut = (r, ox, off) => { const c = [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]], X = c.map(([x, z]) => ox(x, z)), O = c.map(([x, z]) => off(x, z)); return { a: Math.min(...X), b: Math.max(...X), offMin: Math.min(...O), offMax: Math.max(...O) }; };
