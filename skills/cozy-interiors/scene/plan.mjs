// plan.mjs — the house plan: roll.mjs calls planHome() and prints the result; compose.mjs places every area from it (matePose is shared).
// An area is a view, and you look away from where you come in. The plan lays the areas out in one floor plan (never shown whole) from what connects: rooms (areas that share one open floor)
// and which areas touch. It places the areas by mating walls: the wall an area is entered by stands back to back with a wall of an area already placed, with an arch or door where the two meet.
// Each area's view azimuth comes from where it is entered, so the camera turns by whatever the plan's shape gives, large or small, and never slides along a row.
//   roll.plan = { say, map, order, root, walk, areas: { id: { room, fit: [w, d], parent, via, az, entry, mate } }, links: [{ id, a, b, kind: 'arch' | 'door' | 'open', style, width, aWall, aX, bWall, bX, tree }] }
//   areas[id].need = { w, d, why }: the smallest rect the area's deal fits in (roomNeeds below); `fit` is the cell the plan cut, 5 to 30% above it.
//   aX / bX: where the opening's middle stands along each wall (mm at the planned size, measured like an opening's x); `mate` is the passage argument for compose; `fit` the largest rect the area may have.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupNeeds } from './groups.mjs';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8'));
const D2R = Math.PI / 180, r0 = (v) => Math.round(v * 10) / 10;
export const SIZES = { kitchen: [6600, 5200], dining: [7200, 4800], living: [8400, 5000], bedroom: [5600, 4600], hallway: [6200, 3000], 'reading-corner': [4000, 3600], 'home-office': [4800, 3800] };   // the largest rect each kind of area may have (mm); the plan deals a cell up to 15% smaller
export const LINK_WIDTH = { door: 900, round: 1100, cased: 1000, portal: 1300, pocket: 900 };
const EDGE = 700, SPACE = 1200, TOUCH = 1500, GAP = 80;   // a link's middle keeps EDGE from a wall's end and its width + SPACE from another link; two walls meet over TOUCH mm at least; two cells may not overlap by more than GAP
export const normPsi = (p) => { p = ((p % 360) + 360) % 360; return p > 180 ? p - 360 : p; };
export const wallGeo = (wall, w, d) => ({ back: { len: w, at: (x) => [x, 0], inward: [0, 1] }, left: { len: d, at: (x) => [0, d - x], inward: [1, 0] }, right: { len: d, at: (x) => [w, x], inward: [-1, 0] } })[wall];   // an area's walls in its own frame (x along the wall as an opening's x is measured: left to right on the back wall, front to back on the left wall, back to front on the right wall)
export const toWorld = (pose, [x, z]) => { const c = Math.cos(pose.psi * D2R), s = Math.sin(pose.psi * D2R); return [pose.O[0] + x * c - z * s, pose.O[1] + x * s + z * c]; };
export const dirWorld = (pose, [x, z]) => { const c = Math.cos(pose.psi * D2R), s = Math.sin(pose.psi * D2R); return [x * c - z * s, x * s + z * c]; };
// the pose that stands an area back to back with a wall: its wall `via.wall` at via.x meets the world point pw, whose room (the other side) faces nIn
export function matePose(rect, via, pw, nIn) {
  const [rx0, rz0, rx1, rz1] = rect, g = wallGeo(via.wall, rx1 - rx0, rz1 - rz0); if (!g) throw new Error(`matePose: via.wall must be back, left or right (got ${via.wall})`);
  const a = g.at(via.x), q = [rx0 + a[0], rz0 + a[1]], ang = (v) => Math.atan2(v[1], v[0]) / D2R;
  const psi = normPsi(Math.round((ang([-nIn[0], -nIn[1]]) - ang(g.inward)) / 90) * 90), c = Math.cos(psi * D2R), s = Math.sin(psi * D2R);
  return { psi, O: [r0(pw[0] - (q[0] * c - q[1] * s)), r0(pw[1] - (q[0] * s + q[1] * c))] };
}
const foot = (pose, [x0, z0, x1, z1]) => { const q = [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].map((p) => toWorld(pose, p)); return { x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), z0: Math.min(...q.map((p) => p[1])), z1: Math.max(...q.map((p) => p[1])) }; };
const overlap = (a, b) => ({ x: Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), z: Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) });
const mkRnd = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const shuffled = (a, rnd) => { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };

// which of an area's walls a link may use: the back wall, and the second wall of a 90 degree corner; a wall with a sliding or french door is blocked, a plain dealt door or arch on it becomes the link's opening, and one with a window is a poor choice (it is used less, and the spec keeps its windows clear of the opening), and a counter-style passage is not walked through
export function linkWalls(roll) {
  const b = T.backing.find((x) => x.id === roll.backing), name = { first: 'back', second: b.second }, out = {};
  for (const w of ['back', ...(b.walls === 2 && b.angle === 90 ? [b.second] : [])]) out[w] = { blocked: false, arch: null, door: false };
  (roll.openings || []).forEach((o) => { const w = name[o.on]; if (!out[w]) return; if (o.kind === 'door') { if (o.style) out[w].blocked = true; else out[w].door = true; } else if (o.kind === 'window') { out[w].windowed = true; if (o.style === 'wall' || o.style === 'bay') { out[w].blocked = true; out[w].hard = true; } } });   // a window wall or a bay takes the whole wall (tables.json: no other opening beside it)   // a plain dealt door is the link's door; a slider or french door is the outside
  let k = 0; for (const o of roll.openings || []) { if (o.kind !== 'arch') continue; const w = name[o.on], st = (roll.passages || [])[k++]; if (out[w] && !out[w].blocked) { if (T.passages.find((p) => p.style === st)?.counter) out[w].blocked = true; else out[w].arch = st; } }   // a dealt arch on the wall is the link's opening
  return out;
}

// ---- which rooms touch: a small table, not random links (verdict item 5). Depth from the front door runs hallway (entry), then the shared rooms, then the private ones.
export const ZONE = { hallway: 'entry', kitchen: 'shared', dining: 'shared', living: 'shared', 'reading-corner': 'shared', bedroom: 'private', 'home-office': 'private' };
export const LIKES = [['kitchen', 'dining'], ['dining', 'living'], ['hallway', 'living'], ['hallway', 'bedroom'], ['reading-corner', 'living']];   // pairs of kinds that are glad to touch
export const DISLIKES = [['bedroom', 'kitchen'], ['home-office', 'kitchen']];   // pairs that are not given a way through unless asked for
const KIND = (id) => id.replace(/\d+$/, ''), inPairs = (list, a, b) => list.some(([x, y]) => (x === KIND(a) && y === KIND(b)) || (x === KIND(b) && y === KIND(a)));
export const likes = (a, b) => inPairs(LIKES, a, b), dislikes = (a, b) => inPairs(DISLIKES, a, b);
// the shared rooms that can be reached from the front door only through a private room (ids: area ids, pairs: [[a, b], ...] ways, entry: the front door's area)
export function privateGate(ids, pairs, entry) {
  const adj = Object.fromEntries(ids.map((i) => [i, []])); for (const [a, b] of pairs) { adj[a]?.push(b); adj[b]?.push(a); }
  const seen = new Set([entry]), todo = [entry]; while (todo.length) { const n = todo.pop(); for (const m of adj[n] || []) if (!seen.has(m) && ZONE[KIND(m)] !== 'private') { seen.add(m); todo.push(m); } }   // walks through entry and shared rooms only
  return ids.filter((i) => ZONE[KIND(i)] === 'shared' && !seen.has(i));
}

// ---- room size from the deal: the smallest rect that holds what the roll dealt to an area (its hero, its groups, the way in), so the plan cuts each cell from the deal and not from a table of sizes
// back wall = the hero and the groups dealt to 'back:left' / 'back:right', side wall = the groups dealt to 'window:middle'; free-standing pieces (tables, an island) need floor: their depth, clearance behind and a strip in front.
const GAPW = 300, MARGIN = 250, FRONT = 700, BACKCLEAR = 900;   // between two pieces on a wall, from a corner, the near strip kept clear, between a wall and a free-standing table
const HERO = [   // the hero group's own footprint (mm): on the back wall (w along it, d out from it), or free-standing on the floor (free: true)
  [/bed with its headboard on the second wall/, { w: 2400, d: 3000 }], [/bed/, { w: 3000, d: 2400 }],
  [/long table/, { w: 3200, d: 2000, free: true }], [/round table/, { w: 2800, d: 2800, free: true }], [/breakfast table/, { w: 1800, d: 1600, free: true }], [/sideboard with a big mirror/, { w: 2000, d: 500 }],
  [/sofa with an armchair/, { w: 4200, d: 2400 }], [/sofa/, { w: 3200, d: 2400 }], [/shelf wall/, { w: 3000, d: 1200 }], [/two armchairs/, { w: 2600, d: 1200 }],
  [/reading chair/, { w: 1800, d: 1200 }], [/daybed/, { w: 2400, d: 1000 }], [/window seat/, { w: 2000, d: 700 }],
  [/coat hooks over a bench/, { w: 1600, d: 600 }], [/console/, { w: 1200, d: 450 }], [/shoe rack/, { w: 1000, d: 450 }], [/coat stand and a runner/, { w: 1300, d: 1900 }],
  [/writing desk/, { w: 1500, d: 900 }], [/desk/, { w: 1800, d: 900 }],
  [/range hood|pantry|open shelves|window over the sink/, { w: 3600, d: 700 }],
];
const KITCHEN_SHAPE = { straight: [0, 0], galley: [0, 1850], L: [0, 2000], U: [400, 2300], peninsula: [0, 1700], island: [0, 2800] };   // what a kitchen shape adds beyond the back run: [more width, more depth]
const MINSIZE = { hallway: [3000, 2200] }, MINDEF = [3600, 3000];   // no cell is smaller than this, whatever the deal: a thin strip reads as a corridor, not as a room's picture
const WINW = { sash: 1500, picture: 2100, pair: 1100 };   // the width the plan keeps for a dealt window by style (tables.json windows); a window wall or a bay takes its whole wall, and no way through shares that wall
const WINEDGE = 1000, WINCLEAR = 1200;   // a window keeps 1000 mm from a corner (a way through beside the corner leaves the 1200 mm the openings rule asks for) and 1200 mm of clear wall to a way through or another window (check-home openings)
const stripPhrase = (g) => g.replace(/ \(the hero group[^)]*\)/, '').replace(/, on the .*$/, '');
export function roomNeeds(a, kind, links = 0) {
  const why = [], hero = HERO.find(([re]) => re.test(a.hero || ''))?.[1] || { w: 2200, d: 900 }, back = [], side = [], free = [];
  const add = (name, n, slot) => { const spot = n.free ? free : /^window/.test(slot || '') ? side : back; spot.push({ name, ...n }); };
  const heroSlot = (a.groupSlots || [])[0] || 'back:left'; let hd = hero;
  if (kind === 'kitchen') { const [dw, dd] = KITCHEN_SHAPE[a.shape || 'straight'] || [0, 0]; hd = { ...hero, w: hero.w + dw, d: hero.d + dd, free: false }; }
  if (hd.free) free.push({ name: `hero (${a.hero})`, ...hd }); else add(`hero (${a.hero})`, hd, heroSlot);
  (a.groups || []).forEach((g, i) => { if (i === 0) return; const n = groupNeeds(stripPhrase(g)) || { w: 1200, d: 500 }; add(stripPhrase(g).split(/[,:]/)[0], n, (a.groupSlots || [])[i]); });
  const run = (L) => L.reduce((t, q) => t + q.w, 0) + Math.max(0, L.length - 1) * GAPW + 2 * MARGIN;
  const backD = Math.max(0, ...back.map((q) => q.d)), sideRun = side.length ? run(side) + backD * 0.5 : 0, freeD = Math.max(0, ...free.map((q) => q.d)), freeW = Math.max(0, ...free.map((q) => q.w));
  let w = Math.max(run(back), freeW + 2 * 1100), d = Math.max(sideRun, backD + (free.length ? BACKCLEAR + freeD + FRONT : FRONT + 600));
  w += 0; d += 1100 * Math.max(0, links - 1);   // every further way through needs its own stretch of wall
  why.push(`back wall ${Math.round(run(back))} (${back.map((q) => `${q.name} ${q.w}`).join(' + ') || 'nothing'} + gaps), side wall ${Math.round(sideRun)} (${side.map((q) => `${q.name} ${q.w}`).join(' + ') || 'nothing'}), floor ${free.length ? `${BACKCLEAR} + ${freeD} + ${FRONT} for ${free.map((q) => q.name).join(', ')}` : 'the near strip only'}${links > 1 ? `, ${links - 1} more way(s) through` : ''}`);
  { const [mw, md] = MINSIZE[kind] || MINDEF; w = Math.max(w, mw); d = Math.max(d, md); }
  // the ways through need wall beside the walls' own windows: each way goes to the wall that must grow least, one after the other
  { const b = T.backing.find((x) => x.id === a.backing), name = { first: 'back', second: b.second }, lw = Object.entries(linkWalls(a)).filter(([, q]) => !q.blocked).map(([wall]) => wall), want = Math.max(links, 2), cnt = Object.fromEntries(lw.map((q) => [q, 0])), dim = { back: w, left: d, right: d };
    const req = (wall, n) => { const ws = (a.openings || []).filter((o) => o.kind === 'window' && name[o.on] === wall).map((o) => (o.style === 'wall' || o.style === 'bay' ? 0 : WINW[o.style] || 1500)), sum = ws.reduce((t, v) => t + v, 0); return sum + (sum ? 2 * WINCLEAR : 0) + n * LINK_WIDTH.round + (n - 1) * SPACE + 2 * EDGE; };
    const grow = (wall, n) => Math.max(0, req(wall, n) - dim[wall]);
    if (lw.length) { for (let k = 0; k < want; k++) { const pick = lw.map((q) => ({ q, inc: grow(q, cnt[q] + 1) - (cnt[q] ? grow(q, cnt[q]) : 0) })).sort((p, q) => p.inc - q.inc)[0]; cnt[pick.q]++; }
      for (const wall of lw) if (cnt[wall] && grow(wall, cnt[wall]) > 0) { const v = req(wall, cnt[wall]); if (wall === 'back') w = v; else d = v; why.push(`${wall} wall grown to ${v} for its window(s) and ${cnt[wall]} way(s) through`); } } }
  return { w: Math.round(w / 100) * 100, d: Math.round(d / 100) * 100, why: why.join('; ') };
}

export function planHome(out, seed, kinds, opts = {}) {
  const roll = out.areas, ids = kinds.slice(), OP = out.openPlan, chain = OP?.chain || [];
  const rooms = []; { const seen = new Set(); if (chain.length) { rooms.push(chain.slice()); chain.forEach((c) => seen.add(c)); } for (const id of ids) if (!seen.has(id)) rooms.push([id]); }
  const roomOf = Object.fromEntries(rooms.flatMap((r, i) => r.map((id) => [id, i])));
  const required = (opts.touch || []).map(([a, b]) => { for (const x of [a, b]) if (!ids.includes(x)) throw new Error(`plan: --touch names "${x}", which is not one of the areas (${ids.join(', ')})`); if (a === b) throw new Error(`plan: --touch ${a}:${b} joins an area to itself`); return [a, b]; });
  const rootId = chain[0] || ids.find((id) => KIND(id) === 'hallway') || ids[0];   // the front door's area first (a hallway), unless an open room comes first
  const needBacking = ids.filter((id) => roomOf[id] !== roomOf[rootId] || !chain.includes(id)).filter((id) => !Object.keys(linkWalls(roll[id])).some((w) => !linkWalls(roll[id])[w].blocked) && !chain.includes(id));
  if (needBacking.length && !opts.noRebacking) { const e = new Error(`plan: ${needBacking.join(', ')} have no wall free of outside doors`); e.needBacking = needBacking; throw e; }
  const cap = (id) => { const [w, d] = (SIZES[id.replace(/\d+$/, '')] || SIZES.living).map((v) => v * 0.85); return Object.entries(linkWalls(roll[id])).filter(([, q]) => !q.blocked).reduce((n, [k]) => n + Math.max(0, Math.floor(((k === 'back' ? w : d) - 2 * EDGE + SPACE) / (1100 + SPACE))), 0); };
  { const deg = {}; for (const [a, b] of required) { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; }
    const short = Object.keys(deg).filter((id) => !chain.includes(id) && cap(id) < deg[id]), fix = short.filter((id) => T.backing.find((x) => x.id === roll[id].backing).walls === 1 && !opts.noRebacking);
    if (fix.length) { const e = new Error(`plan: ${fix.join(', ')} need a second wall`); e.needBacking = fix; throw e; }
    if (short.length) throw new Error(`plan: ${short.map((id) => `${id} touches ${deg[id]} areas but its free walls (no outside door) hold ${cap(id)} way(s) through`).join('; ')}: ask for fewer touches there`); }
  const degree = {}; for (const [a, b] of required) { degree[a] = (degree[a] || 0) + 1; degree[b] = (degree[b] || 0) + 1; }
  for (const id of ids) if (KIND(id) === 'hallway') degree[id] = Math.max(degree[id] || 0, Math.min(3, ids.length - 1));   // the hallway is the hub of a home: it keeps wall for up to three ways
  const need = Object.fromEntries(ids.map((id) => [id, roomNeeds(roll[id], id.replace(/\d+$/, ''), degree[id] || 0)]));   // the smallest rect each area's deal fits in
  const best = { tries: 0 };
  const entryId = ids.find((id) => KIND(id) === 'hallway') || rootId, asked = (a, b) => required.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const validWays = (links, attempt) => {
    if (opts.noLikes) return true;   // a regression fixture only: the likes table switched off, so a home that breaks it can be built and the checks shown to catch it
    if (privateGate(ids, links.map((l) => [l.a, l.b]), entryId).length) return false;   // a private room is the only way to a shared one
    if (ids.length > 2 && attempt < 100) for (const l of links) if (dislikes(l.a, l.b) && !asked(l.a, l.b)) return false;   // bedroom-kitchen, office-kitchen: not unless asked (a home whose walls leave no other way lets it through after 300 tries)
    return true;
  };
  for (let attempt = 0; attempt < 2400; attempt++) {   // the first 600 tries at the sizes dealt; a crowded home then grows its cells (to 112%, then 125%: more wall for the ways through) before it gives up
    const res = tryPlan(attempt); best.tries = attempt + 1; if (res) return finish(res);
  }
  if (!required.length && !opts.noRebacking && !opts.rebacked) { const e = new Error('plan: no floor plan; the single-wall areas take a corner'); e.needBacking = ids.filter((id) => { const b = T.backing.find((x) => x.id === roll[id].backing); const stuck = chain.length && chain.every((c) => !Object.values(linkWalls(roll[c])).some((q) => !q.blocked)); return (!chain.includes(id) || stuck) && (b.walls === 1 || (b.walls === 2 && b.angle !== 90)); }); if (e.needBacking.length) throw e; }   // a one-wall or wide-angle area has one wall for ways through: it takes a square corner
  throw new Error(`plan: no floor plan found in ${best.tries} tries${required.length ? ` for the touches ${required.map((q) => q.join(':')).join(', ')}: ask for fewer touches or give an area a second wall` : ''}`);

  function tryPlan(attempt) {
    const rnd = mkRnd((seed ^ 0x51ed270b) + attempt * 7919), size = {}, kind = (id) => id.replace(/\d+$/, '');
    for (const id of ids) { const cap = SIZES[kind(id)] || SIZES.living, nd = [need[id].w, need[id].d], shrink = attempt < 600 ? 1 : attempt < 1200 ? 1.12 : 1.25, f = (k) => Math.round(Math.max(Math.min(nd[k] * (1.05 + 0.25 * rnd()), cap[k] * 1.1), nd[k]) * shrink / 100) * 100; size[id] = [f(0), f(1)]; }   // from the deal: the need with 5 to 30% to spare, never above the table's largest (plus 10%) unless the deal needs more
    const placed = {}, links = [], used = {}, order = [];
    const winUsed = {}, winOf = {};   // the dealt windows, each stood on its wall first; the ways through keep clear of them (winUsed[id][wall] = [[lo, hi], ...])
    for (const id of ids) {
      const b = T.backing.find((x) => x.id === roll[id].backing), name = { first: 'back', second: b.second };
      for (const o of roll[id].openings || []) {
        if (o.kind !== 'window') continue; const w = name[o.on]; if (!w) continue;
        const wl = wallGeo(w, ...size[id]).len, st = o.style || 'sash', W = st === 'wall' ? wl - 2 * WINEDGE : st === 'bay' ? 2400 : Math.min(WINW[st] || 1500, wl - 2 * WINEDGE);
        const lo = WINEDGE + W / 2, hi = wl - WINEDGE - W / 2; if (hi < lo) { (winOf[id] ||= []).push({ wall: w, style: st, width: Math.round(W), x: null, why: 'the wall is too short for it' }); continue; }
        let x = null; for (let k = 0; k < 12 && x === null; k++) { const c = st === 'wall' || st === 'bay' ? Math.round(wl / 2) : Math.round((lo + rnd() * (hi - lo)) / 50) * 50; if (!((winUsed[id]?.[w]) || []).some(([a, z]) => c + W / 2 + WINCLEAR > a && c - W / 2 - WINCLEAR < z)) x = c; }
        if (x === null) { (winOf[id] ||= []).push({ wall: w, style: st, width: Math.round(W), x: null, why: 'no room on the wall beside the other window (a bay or a window wall takes its wall)' }); continue; }   // the roll dealt two windows one wall cannot hold: the plan says so and the spec places the second where it can
        ((winUsed[id] ||= {})[w] ||= []).push([x - W / 2, x + W / 2]); (winOf[id] ||= []).push({ wall: w, style: st, width: Math.round(W), x });
      }
    }   // used[id][wall] = [[lo, hi], ...] along the wall
    const relax = attempt >= 900, wc = {}, walls = (id) => (wc[id] ||= relax ? Object.fromEntries(Object.entries(linkWalls(roll[id])).map(([w, q]) => [w, q.blocked && !q.hard ? { ...q, blocked: false, drop: true } : q])) : linkWalls(roll[id])),   // a crowded home that no cells can hold (every wall short or taken) takes the walls an outside door or hatch holds: that dealt opening is dropped, and the plan says so
       wlen = (id, w) => wallGeo(w, ...size[id]).len;
    const free = (id, w, x, wd) => { const len = wlen(id, w); if (x - wd / 2 < EDGE || x + wd / 2 > len - EDGE) return false; if (((winUsed[id]?.[w]) || []).some(([lo, hi]) => x + wd / 2 + WINCLEAR > lo && x - wd / 2 - WINCLEAR < hi)) return false; return !((used[id]?.[w]) || []).some(([lo, hi]) => x + wd / 2 + SPACE > lo && x - wd / 2 - SPACE < hi); };
    const take = (id, w, x, wd) => { ((used[id] ||= {})[w] ||= []).push([x - wd / 2, x + wd / 2]); };
    const putArea = (id, pose, rect = [0, 0, ...size[id]]) => { placed[id] = { id, pose, rect, foot: foot(pose, rect) }; order.push(id); };
    // the open room: its areas in one chain, as H.join lays them (compose.mjs / openplan.mjs)
    if (chain.length) {
      const sh = (i) => OP.seams[i].overlap; let pose = { O: [0, 0], psi: 0 }; putArea(chain[0], pose);
      for (let i = 1; i < chain.length; i++) { const [wa, da] = size[chain[i - 1]], corner = OP.layout === 'corner' && i - 1 === OP.turn, share = sh(i - 1);
        pose = corner ? { O: toWorld(pose, [wa, da - share]), psi: normPsi(pose.psi + 90) } : { O: toWorld(pose, [wa, 0]), psi: pose.psi };
        putArea(chain[i], pose, corner ? [0, 0, ...size[chain[i]]] : [-share, 0, size[chain[i]][0], size[chain[i]][1]]);
        links.push({ a: chain[i - 1], b: chain[i], kind: 'open', share, tree: true }); }
    } else putArea(rootId, { O: [0, 0], psi: 0 });
    const linkedPair = (a, b) => links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
    const forceKind = (qU, qV) => { const q = [qU, qV].find((x) => x.door) , a = [qU, qV].find((x) => x.arch); if (qU.door && qV.arch || qU.arch && qV.door) return { kind: 'arch', style: (qU.arch || qV.arch), merged: true }; return q ? { kind: 'door', style: null } : a ? { kind: 'arch', style: a.arch } : pickKind(null); };
    const pickKind = (arch) => { if (arch) return { kind: 'arch', style: arch }; if (rnd() < 0.4) return { kind: 'door', style: null }; const pool = T.passages.filter((p) => !p.counter), p = pool[Math.floor(rnd() * pool.length)]; return { kind: 'arch', style: p.style }; };
    const clear = (id, pose, rect) => { const f = foot(pose, rect); return Object.values(placed).every((q) => { const o = overlap(f, q.foot); return !(o.x > GAP && o.z > GAP); }); };
    const spot = (id, w, wd) => { const len = wlen(id, w), at = []; for (let x = Math.ceil((EDGE + wd / 2) / 50) * 50; x <= len - EDGE - wd / 2; x += 50) if (free(id, w, x, wd)) at.push(x); return at.length ? at[Math.floor(rnd() * at.length)] : null; };   // every place on the wall where the way fits (clear of the windows and of other ways), one of them at random
    const attach = (u, v) => {   // v (not placed) takes a wall back to back with a wall of u
      for (let k = 0; k < 40; k++) {
        const wu = Object.entries(walls(u)).filter(([w, q]) => !q.blocked), wv = Object.entries(walls(v)).filter(([w, q]) => !q.blocked); if (!wu.length || !wv.length) return false;
        const pickU = wu.flatMap(([w, q]) => Array(q.windowed ? 1 : 4).fill([w, q])), [wU, qU] = pickU[Math.floor(rnd() * pickU.length)], pickV = wv.flatMap(([w, q]) => Array((w === 'back' ? 1 : 3) * (q.windowed ? 1 : 4)).fill([w, q])), [wV, qV] = pickV[Math.floor(rnd() * pickV.length)];
        if (qU.windowed && qV.windowed && attempt < 100) continue;   // (a crowded home lets it through after 100 tries) two windows back to back would open into each other
        const kd = forceKind(qU, qV); if (!kd) continue; const wd = LINK_WIDTH[kd.style || 'door'], xu = spot(u, wU, wd), xv = spot(v, wV, wd); if (xu === null || xv === null) continue;
        const gU = wallGeo(wU, ...size[u]), pw = toWorld(placed[u].pose, [gU.at(xu)[0] + placed[u].rect[0] * 0, gU.at(xu)[1]]), nU = dirWorld(placed[u].pose, gU.inward);
        const pose = matePose([0, 0, ...size[v]], { wall: wV, x: xv }, pw, nU); if (!clear(v, pose, [0, 0, ...size[v]])) continue;
        if (loopHome && k < 34) { placed[v] = { id: v, pose, rect: [0, 0, ...size[v]], foot: foot(pose, [0, 0, ...size[v]]) }; const hit = Object.keys(placed).some((w) => w !== v && w !== u && roomOf[w] !== roomOf[v] && touch(v, w, true)); delete placed[v]; if (!hit) continue; }   // a home that wants a loop: this spot is one where the new area's wall also meets another
        take(u, wU, xu, wd); take(v, wV, xv, wd); const cu = qU.door ? 'door' : qU.arch ? 'arch' : qU.drop ? 'drop' : null, cv = qV.door ? 'door' : qV.arch ? 'arch' : qV.drop ? 'drop' : null; qU.door = qV.door = false; qU.arch = qV.arch = null; qU.drop = qV.drop = false; putArea(v, pose); links.push({ a: u, b: v, ...kd, useA: cu && [wU, cu], useB: cv && [wV, cv], width: wd, aWall: wU, aX: xu, bWall: wV, bX: xv, tree: true }); return true; }
      return false; };
    const touch = (u, v, dry = false) => {   // two areas already placed whose walls happen to stand back to back: a link between them
      const cand = [];
      for (const [wU, qU] of Object.entries(walls(u))) for (const [wV, qV] of Object.entries(walls(v))) { if (qU.blocked || qV.blocked || (qU.windowed && qV.windowed && attempt < 100)) continue;
        const gU = wallGeo(wU, ...size[u]), gV = wallGeo(wV, ...size[v]), U = placed[u], V = placed[v], a0 = toWorld(U.pose, gU.at(0)), a1 = toWorld(U.pose, gU.at(gU.len)), b0 = toWorld(V.pose, gV.at(0)), b1 = toWorld(V.pose, gV.at(gV.len)), nU = dirWorld(U.pose, gU.inward), nV = dirWorld(V.pose, gV.inward);
        if (Math.abs(nU[0] + nV[0]) > 0.01 || Math.abs(nU[1] + nV[1]) > 0.01) continue;   // facing apart
        const t = [-nU[1], nU[0]], off = (p) => (p[0] - a0[0]) * nU[0] + (p[1] - a0[1]) * nU[1]; if (Math.abs(off(b0)) > GAP || Math.abs(off(b1)) > GAP) continue;   // one line
        const along = (p) => (p[0] - a0[0]) * t[0] + (p[1] - a0[1]) * t[1], uLo = 0, uHi = Math.abs(along(a1)), [vLo, vHi] = [along(b0), along(b1)].sort((x, y) => x - y), lo = Math.max(uLo, vLo), hi = Math.min(uHi, vHi); if (hi - lo < TOUCH) continue;
        for (let k = 0; k < 8; k++) { const s = lo + EDGE + rnd() * (hi - lo - 2 * EDGE), p = [a0[0] + t[0] * s * Math.sign(along(a1) || 1), a0[1] + t[1] * s * Math.sign(along(a1) || 1)], xu = Math.round(Math.hypot(p[0] - a0[0], p[1] - a0[1]) / 50) * 50, xv = Math.round(Math.hypot(p[0] - b0[0], p[1] - b0[1]) / 50) * 50, kd = forceKind(qU, qV); if (!kd) continue; const wd = LINK_WIDTH[kd.style || 'door'];
          if (free(u, wU, xu, wd) && free(v, wV, xv, wd)) { cand.push({ wU, wV, xu, xv, kd, wd, cu: qU.door ? [wU, 'door'] : qU.arch ? [wU, 'arch'] : null, cv: qV.door ? [wV, 'door'] : qV.arch ? [wV, 'arch'] : null }); break; } } }
      if (!cand.length) return false; if (dry) return true; const c = cand[Math.floor(rnd() * cand.length)]; for (const q of [walls(u)[c.wU], walls(v)[c.wV]]) { q.door = false; q.arch = null; } take(u, c.wU, c.xu, c.wd); take(v, c.wV, c.xv, c.wd); links.push({ a: u, b: v, ...c.kd, useA: c.cu, useB: c.cv, width: c.wd, aWall: c.wU, aX: c.xu, bWall: c.wV, bX: c.xv, tree: false }); return true; };
    // the roots first: every area of the open room is placed; then the rest, one at a time, joined to what stands (the touches asked for first)
    const loopHome = rnd() < 0.6;   // some homes get a second way round
    const todo = new Set(ids.filter((id) => !placed[id])), pend = required.slice();
    const wt = (id) => (/hallway/.test(id) ? 3 : 1);
    while (todo.size) {
      const e = pend.find(([a, b]) => (a in placed) !== (b in placed));
      if (e) { const [u, v] = e[0] in placed ? e : [e[1], e[0]]; if (!attach(u, v)) return null; todo.delete(v); pend.splice(pend.indexOf(e), 1); continue; }
      const rank = (id) => ({ entry: 0, shared: 1, private: 2 })[ZONE[KIND(id)]] ?? 1, first = Math.min(...[...todo].map(rank)), pool = [...todo].filter((id) => rank(id) === first), v = pool[Math.floor(rnd() * pool.length)];   // the entry, then the shared rooms, then the private ones are joined to the house
      const open = Object.keys(placed).filter((q) => rank(v) === 2 || rank(q) < 2 || q === entryId), base = open.length ? open : Object.keys(placed), cands = base.flatMap((q) => Array(wt(q) * (likes(q, v) ? 8 : dislikes(q, v) ? 1 : 2)).fill(q)), tryOrder = shuffled(cands, rnd); let ok = false;   // a shared room is not hung off a private one
      for (const u of [...new Set([...tryOrder, ...shuffled(Object.keys(placed), rnd)])]) if (attach(u, v)) { ok = true; break; } if (!ok) return null; todo.delete(v);   // the liked and non-private parents first, then any
    }
    for (const [a, b] of pend) if (!linkedPair(a, b) && !touch(a, b)) return null;   // a touch asked for between two areas that already stand: their walls must meet
    let extra = 0; for (const [a, b] of shuffled(ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b])), rnd)) { if (extra >= (loopHome ? 2 : 1) || roomOf[a] === roomOf[b] || linkedPair(a, b) || (dislikes(a, b) && ids.length > 2)) continue; if (rnd() < (loopHome ? 0.9 : 0.3) && touch(a, b)) extra++; }   // walls that meet by chance may give a second way round
    if (!validWays(links, attempt)) return null;   // the likes table: nothing but the front door's shared rooms stand between it and the shared rooms, and no unwanted pair is joined
    return { placed, links, order, size, winOf };
  }

  function finish({ placed, links, order, size, winOf }) {
    const rnd = mkRnd((seed ^ 0x2545f491) >>> 0), areas = {}, linkId = (l) => `${l.a}-${l.b}`;
    links.forEach((l) => { l.id = linkId(l); if (l.kind !== 'open') { l.aF = Math.round(l.aX / wallGeo(l.aWall, ...size[l.a]).len * 1e5) / 1e5; l.bF = Math.round(l.bX / wallGeo(l.bWall, ...size[l.b]).len * 1e5) / 1e5; } });
    for (const id of order) areas[id] = { room: roomOf[id], fit: size[id], need: need[id], windows: winOf[id] || [], parent: null, via: null, entry: null };
    for (const l of links) { if (!l.tree) continue; const c = areas[l.b]; c.parent = l.a; c.via = l.id; c.entry = l.kind === 'open' ? { kind: 'open', share: l.share } : { wall: l.bWall, x: l.bX, f: l.bF }; if (l.tree && l.kind !== 'open') c.mate = { from: l.a, wall: l.aWall, aF: l.aF, via: { wall: l.bWall, f: l.bF } }; }
    // each area looks away from where it is entered: the view azimuth (in the area's own frame; 0 is the front, positive toward its right) comes from the entry point
    const az = {}, clamp = (v, m) => Math.max(-m, Math.min(m, v));
    for (const id of order) { const [w, d] = size[id], e = areas[id].entry, c = [w * 0.5, d * 0.4];
      let ep = e && e.wall ? wallGeo(e.wall, w, d).at(e.x) : e ? [-(e.share || 0) / 2 - w * 0.1, d * 0.5] : null, v = ep ? [ep[0] - c[0], ep[1] - c[1]] : [0, 0], raw = Math.atan2(v[0], Math.max(v[1], 0.3 * Math.hypot(...v) || 1)) / D2R, a = clamp(raw * 0.7, 50);
      if (Math.abs(a) < 14) a = (rnd() < 0.5 ? -1 : 1) * (14 + rnd() * 14); az[id] = Math.round(a); }
    // neighbours never share a heading: the camera turns at least 30 degrees between two areas that connect (the world azimuth is the area's own minus its turn)
    for (const id of order) { const A = areas[id]; if (!A.parent) continue; const world = (q, v) => v - placed[q].pose.psi, diff = (p, q, v) => { const dd = Math.abs((((world(q, v) - world(p, az[p])) % 360) + 540) % 360 - 180); return dd; };
      if (A.entry?.kind === 'open' && placed[A.parent].pose.psi === placed[id].pose.psi && rnd() < 0.6) { const g = 10 + Math.round(rnd() * 30), sg = rnd() < 0.5 ? -1 : 1, base = az[A.parent]; az[id] = Math.abs(base + sg * g) <= 50 ? base + sg * g : base - sg * g; continue; }   // neighbours in one row room often share the room's long back wall and each look at their own part of it: a small turn (10 to 40 degrees), made a walk by the curved glide
      if (diff(A.parent, id, az[id]) < 30) { const opts = [-az[id], 28, -28, 40, -40].filter((v) => diff(A.parent, id, v) >= 30); if (opts.length) az[id] = opts[0]; } }
    for (const id of order) areas[id].az = az[id];
    const adj = {}; links.forEach((l) => { (adj[l.a] ||= []).push(l.b); (adj[l.b] ||= []).push(l.a); });
    const walk = [], seen = new Set(); const dfs = (id) => { seen.add(id); walk.push(id); for (const n of (adj[id] || [])) if (!seen.has(n)) dfs(n); }; dfs(order[0]);
    const bk = (id) => T.backing.find((x) => x.id === roll[id].backing), nameOf = (id, w) => (w === 'back' ? 'first' : 'second');
    for (const l of links) for (const [id, u] of [[l.a, l.useA], [l.b, l.useB]]) { if (!u) continue; const a = roll[id], [w, kind0] = u, on = nameOf(id, w); let kind = kind0, i = (a.openings || []).findIndex((o) => kind === 'drop' ? o.on === on && o.kind !== 'window' && (o.kind === 'arch' || o.style) : o.kind === kind && o.on === on && !o.style); if (i < 0) continue; const was = kind === 'drop' ? a.openings[i].kind : kind, dropped = kind === 'drop'; kind = was;
      if (kind === 'arch') { const k = a.openings.slice(0, i).filter((o) => o.kind === 'arch').length; (a.passages || []).splice(k, 1); } a.openings.splice(i, 1); (a.consumed ||= []).push(`${dropped ? 'the dealt ' + kind + ' (outside door or hatch) on the ' + w + ' wall was dropped: the plan needs the wall for the way to ' + (id === l.a ? l.b : l.a) : kind + ' on the ' + w + ' wall (now the way to ' + (id === l.a ? l.b : l.a) + ')'}`); }
    const plan = { root: order[0], order, walk, areas, links, rooms: rooms.map((r) => r.slice()), tries: best.tries, entry: entryId, likesMet: links.filter((l) => likes(l.a, l.b)).map((l) => `${l.a}|${l.b}`), dislikesMet: links.filter((l) => dislikes(l.a, l.b)).map((l) => `${l.a}|${l.b}`) };
    plan.map = mapText(placed, links, size);
    plan.say = sayOf(plan, size); { const drops = ids.flatMap((id) => (roll[id].consumed || []).filter((c) => /was dropped/.test(c)).map((c) => `${id}: ${c}`)); if (drops.length) plan.say += `\nDropped to make room (this home was too crowded for its walls): ${drops.join('; ')}.`; }
    plan.world = Object.fromEntries(order.map((id) => [id, { pose: placed[id].pose, foot: placed[id].foot }]));   // the planned poses (compose works from its own, with the real rects)
    return plan;
  }
}

// a small text map: one letter per area, # where a way through stands (never drawn by the page)
export function mapText(placed, links, size) {
  const ids = Object.keys(placed), E = ids.map((id) => placed[id].foot), x0 = Math.min(...E.map((f) => f.x0)), x1 = Math.max(...E.map((f) => f.x1)), z0 = Math.min(...E.map((f) => f.z0)), z1 = Math.max(...E.map((f) => f.z1));
  const cw = Math.max(400, Math.ceil((x1 - x0) / 90 / 100) * 100), ch = cw * 2, cols = Math.ceil((x1 - x0) / cw), rows = Math.ceil((z1 - z0) / ch), g = Array.from({ length: rows }, () => Array(cols).fill('.'));
  const letter = {}; for (const id of ids) { let L = id[0].toUpperCase(), k = 0; while (Object.values(letter).includes(L)) L = (id[++k] || String(k)).toUpperCase(); letter[id] = L; }
  for (const id of ids) { const f = placed[id].foot; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const cx = x0 + (c + 0.5) * cw, cz = z0 + (r + 0.5) * ch; if (cx > f.x0 && cx < f.x1 && cz > f.z0 && cz < f.z1) g[r][c] = g[r][c] === '.' ? letter[id] : letter[id].toLowerCase(); } }
  for (const l of links) { if (l.kind === 'open') continue; const U = placed[l.a], gU = wallGeo(l.aWall, ...size[l.a]), p = toWorld(U.pose, gU.at(l.aX)), c = Math.min(cols - 1, Math.max(0, Math.floor((p[0] - x0) / cw))), r = Math.min(rows - 1, Math.max(0, Math.floor((p[1] - z0) / ch))); g[r][c] = '#'; }
  return g.map((row) => row.join('')).join('\n') + `\n(one letter per area, # = a way through; one column is ${cw} mm, one row ${ch} mm; the page never shows this)`;
}
function sayOf(plan, size) {
  const L = (l) => l.kind === 'open' ? `${l.a} and ${l.b} share one floor (open plan)` : `${l.a} | ${l.b}: ${l.kind === 'arch' ? (l.style || 'round') + ' arch' : 'door'}, ${l.aWall} wall of ${l.a} at ${l.aX} mm, ${l.bWall} wall of ${l.b} at ${l.bX} mm${l.merged ? ' (a dealt door on one side and a dealt arch on the other became this one way: build neither separately)' : ''}`;
  return `HOUSE PLAN (never shown whole: it only places the areas and decides where the camera comes in from)\n${plan.map}\nBuild the areas in this order: ${plan.order.join(', ')}. Each rect starts at [0, 0] and is the size of its cell, cut from what the roll dealt (the smallest rect the deal fits in, with 5 to 30% to spare): ${plan.order.map((id) => `${id} ${size[id][0]} x ${size[id][1]}`).join('; ')}.\nWhat each deal needs: ${plan.order.map((id) => `${id} ${plan.areas[id].need.w} x ${plan.areas[id].need.d} (${plan.areas[id].need.why})`).join('; ')}.\n` +
    `Dealt windows (stand each at its x, measured like an opening's x, so no way through lands on it): ${plan.order.flatMap((id) => plan.areas[id].windows.map((q) => `${id} ${q.wall} wall: ${q.style} ${q.width} wide ${q.x === null ? `(no x: ${q.why})` : `at x ${q.x}`}`)).join('; ') || 'none'}.\n` +
    `Ways through (compose puts these openings in the walls itself; keep 1200 mm of clear wall beside each, and a smaller rect moves the opening along with the wall): ${plan.links.map(L).join('; ')}.\nView azimuth (a.view leaves az out and takes it from the plan): ${plan.order.map((id) => `${id} ${plan.areas[id].az}`).join(', ')}. Each area looks away from where it is entered.`;
}

// ---- the CLI: node plan.mjs <seed> kitchen+dining+living hallway bedroom --touch=hallway:living,hallway:bedroom  (the same as roll.mjs, printing the plan only)
if (process.argv[1] && /(^|\/)plan\.mjs$/.test(process.argv[1])) {
  import('./roll.mjs').then(({ roll }) => {   // not awaited: roll.mjs imports this file, so waiting for it here would never finish
    const args = process.argv.slice(2), seed = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : Math.floor(Math.random() * 1e6);
    try { const r = roll(seed, args); console.log(r.plan.say); } catch (e) { console.error(e.message); process.exit(1); }
  });
}
