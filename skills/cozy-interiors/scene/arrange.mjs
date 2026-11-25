// arrange.mjs — stage 2 of the build: the dealt still lifes and wall arrangements, built from the roll's own phrases so the result passes the checks by its making.
//   a.still(topId, phrases, { at: 'centre' | 'back' | 'front', margin, group, prefix })
//       puts the dealt things ("jars (jars)", "mug (mug)") on a placed top: at most two, spaced along the top; the list shrinks until it fits. Returns { ids, left }.
//   a.wallArr(phrase, { wall, xc, over, group, prefix, seed })
//       builds one dealt wall arrangement ("open shelf with plates and jars (openShelf)", "picture group over the sideboard (picture)"). `over` names the furniture it hangs over (art over a sideboard,
//       a console, a desk, a sofa, a bed: width 0.5 to 0.8 of the piece, bottom 170 to 230 above its top); without `over` it hangs on open wall, its middle at 1500 (hooks at 1600, a clock at 1900).
//       Returns { ids, left }; a phrase this builder does not know is listed in `left`, not thrown.
//   node arrange.mjs lists the wall phrases it builds.
import { fileURLToPath } from 'node:url';
import { zone } from './slotmath.mjs';
import fs from 'node:fs';
import path from 'node:path';

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const round = (v, step = 10) => Math.round(v / step) * step;
const assetsOf = (phrase) => { const m = String(phrase).match(/\(([A-Za-z, ]+)\)\s*$/); return m ? m[1].split(',').map((x) => x.trim()).filter(Boolean) : []; };

export function still(a, topId, phrases, { at = 'centre', margin = 80, group, prefix } = {}) {
  const pre = prefix || `${topId}-still`, ids = [], left = [], skipped = [];
  let list = phrases.flatMap((p) => assetsOf(p).map((asset) => ({ asset, phrase: p })));
  const seen = new Set(); list = list.filter((x) => (seen.has(x.asset) ? false : (seen.add(x.asset), true)));   // one of an asset per top
  if (list.length > 2) { skipped.push(...list.slice(2).map((x) => `${x.phrase}: a top holds two things at most`)); for (const x of list.slice(2)) a.skip(x.asset, 'a top holds two things at most'); list = list.slice(0, 2); }
  const items = list.map((x, i) => ({ id: `${pre}${i}`, asset: x.asset })); if (list.some((x) => x.asset === 'vase')) margin = Math.max(margin, 150);   // a vase of branches reaches wider than its size says
  let n = items.length, done = false;
  while (n > 0 && !done) { try { a.onTop(topId, items.slice(0, n), { at, margin, ...(group ? { group } : {}) }); done = true; } catch (e) { n--; } }
  if (!done) for (const it of items) { try { a.onTop(topId, [it], { at, margin, ...(group ? { group } : {}) }); ids.push(it.id); skipped.push(`note: only ${it.asset} fits on ${topId}`); items.splice(items.indexOf(it), items.length - items.indexOf(it)); n = 0; done = true; break; } catch (e) { /* try the next one alone */ } }   // the pair does not fit: the first thing that does, alone
  if (done && ids.length === 0) ids.push(...items.slice(0, n).map((x) => x.id));
  for (const x of items.slice(n)) { skipped.push(`${x.asset}: does not fit on ${topId}`); a.skip(x.asset, `does not fit on ${topId}`); }   // the roll's other thing is left out and said so (the check 'rolled' sees the skip)
  if (!ids.length && items.length) left.push(`nothing of the dealt still life fits on ${topId}`);
  return { ids, left, skipped };
}

// wall phrase -> how to hang it: a = the asset(s), y = the bottom of the piece on open wall, mode 'art' (over furniture or at eye level), 'fixed' (own height), 'floor' (a tall cabinet), 'skip' (an opening owns it)
const WALL = [
  { re: /^window with a curtain/, mode: 'skip', why: 'the opening owns its curtain (a.curtain / pieces)' },
  { re: /coat hooks/, mode: 'fixed', a: ['coatHooks'], y: 1600, hat: true },
  { re: /glazed cabinet/, mode: 'floor', a: ['glazedCabinet'] },
  { re: /wall sconce either side of the bed/, mode: 'skip', why: 'a sconce either side of the bed is hung by the bed group (bedside lights)' },
  { re: /wall sconce by the chair/, mode: 'fixed', a: ['wallSconce'], y: 1500 },
  { re: /open shelf/, mode: 'fixed', a: ['openShelf'], y: 1300 },
  { re: /pot rail/, mode: 'fixed', a: ['potRail'], y: 1050 },
  { re: /spice rack/, mode: 'fixed', a: ['spiceRack'], y: 1250 },
  { re: /wall clock/, mode: 'fixed', a: ['wallClock'], y: 1900, towel: /tea towel/ },
  { re: /plates on the wall/, mode: 'fixed', a: ['wallPlates'], y: 1100 },
  { re: /pinboard/, mode: 'art', a: ['pinboard'], w: [600, 1000], hw: 0.7 },
  { re: /shelves with books and objects/, mode: 'fixed', a: ['readShelf'], y: 1300 },
  { re: /wall shelf/, mode: 'art', a: ['wallShelf'], shelf: true },
  { re: /gallery/, mode: 'art', a: ['galleryWall'], w: [1200, 1900], gal: true },
  { re: /mirror/, mode: 'art', a: ['mirror'], w: [450, 900], tall: 1.3 },
  { re: /picture|calendar/, mode: 'art', a: ['picture'], w: [400, 900] },
];
export const wallPhrases = () => WALL.map((r) => String(r.re));

export function wallArr(a, phrase, { wall, xc, over, group, prefix, seed } = {}) {
  const rule = WALL.find((r) => r.re.test(phrase)), ids = [], left = [], skipped = [];
  if (!rule) return { ids, left: [`${phrase}: no recipe (place the asset directly)`] };
  if (rule.mode === 'skip') return { ids, left, skipped: [`${phrase}: ${rule.why}`] };   // owned elsewhere: not a failure
  if (!wall) throw new Error(`a.wallArr: give the wall ({ wall: back, xc })`);
  const pre = prefix || `wa${hash(phrase) % 997}`, r = rngOf((seed ?? a.h.S?.seed ?? 1) + hash(pre + phrase)), grp = group;
  const HUNG = /^(picture|galleryWall|mirror|wallClock)$/;   // round 6 B14: hung art keeps 300 mm from other hung art on the wall (or lines up with it, which a free spot never does)
  const clearOfWindows = (x, half, asset = '') => {   // on open wall the arrangement stands clear of every window's span (its sash sweeps the room in front of the glass: rule sash)
    const win = (wall.openings || []).map((o) => { const z = o.kind === 'window' ? zone(o) + 20 : zone(o); return [o.x - z, o.x + z]; }),   // every opening keeps its zone clear (slotmath.zone: a window its curtain and sash, a door its swing, an arch its casing)
      len = wall.len || 6000, art = HUNG.test(asset) ? (wall.taken || []).filter((t) => HUNG.test(t.asset)) : [], ok = (q) => q - half >= 150 && q + half <= len - 150 && win.every(([a0, a1]) => q + half < a0 || q - half > a1) && art.every((t) => q + half < t.x[0] - 300 || q - half > t.x[1] + 300);
    if (ok(x)) return x; for (let d = 50; d < len; d += 50) { if (ok(x + d)) return x + d; if (ok(x - d)) return x - d; } return x; };
  const put = (suffix, asset, x0, ex) => { const x = over || typeof x0 !== 'number' ? x0 : clearOfWindows(x0, (() => { try { return a.sizeFor(asset, ex.params).w / 2; } catch (e) { return 400; } })(), asset); const id = `${pre}-${suffix}`, tryAt = (xx) => { wall.place(id, asset, xx, { ...(grp ? { group: grp } : {}), ...ex }); ids.push(id); return id; };
    try { return tryAt(x); } catch (e) {
      const msg = String(e.message || e).split('\n')[0];
      if (!over && /lands inside/.test(msg)) { let alt = []; try { alt = Object.entries(a.slotTable(Math.max(600, 2 * (() => { try { return a.sizeFor(asset, ex.params).w / 2; } catch (e4) { return 400; } })() + 100)).wall).filter(([k, v]) => k.startsWith(wall.id + ':') && v.best).map(([, v]) => v.xc).filter((q) => Math.abs(q - x) > 200); } catch (e2) { /* no slots: no other place to try */ } for (const xx of alt) { try { return tryAt(xx); } catch (e3) { /* the next free stretch */ } } }   // on open wall the arrangement moves to a bare stretch when its place is taken
      left.push(`${asset}: ${msg.slice(0, 150)}`); return null; } };
  if (rule.mode === 'floor') { put('cab', rule.a[0], xc, {}); return { ids, left, skipped }; }
  if (rule.mode === 'fixed') {
    const id = put('0', rule.a[0], xc, { y: rule.y });
    if (id && rule.hat) put('hat', 'hungHat', xc + 800, { y: rule.y + 50 });   // the hat brings its own peg: it hangs beside the rail, 100 mm clear
    if (id && rule.towel && rule.towel.test(phrase)) skipped.push('note: the tea towel hangs at the end of a run, on a wall unit or by the sink, not on this wall (a.teaTowel / the run helpers)');
    return { ids, left, skipped };
  }
  // art: over a piece of furniture, or on open wall at eye level
  let W = 1600, top = null;
  if (over) { const d = a.dims(over), bx = a.boxOf(over); W = Math.max(bx.x1 - bx.x0, bx.z1 - bx.z0, 1) ; top = /^(sofa|bed|daybed|armchair)$/.test(d.asset) ? Math.round(bx.y1) : a.topOf(over); }   // the real width of the piece, and for a seat or a bed the top of its back
  const [lo, hi] = rule.w || [500, 900];
  const w = Math.max(lo, Math.min(over ? Math.max(hi, 0.78 * W) : hi, round(over ? (0.52 + 0.24 * r()) * W : lo + (hi - lo) * r(), 50)));
  if (rule.shelf) { const ww = Math.min(900, Math.max(500, round(0.7 * W, 50))); put('0', 'wallShelf', xc, { y: (top ?? 900) + 400 + Math.round(r() * 20) * 10, params: { w: ww } }); return { ids, left, skipped }; }
  if (rule.gal) { const ww = over ? Math.max(1200, Math.min(Math.max(1900, round(0.56 * W, 50)), round(0.9 * W, 50))) : w; if (over && 0.5 * W > ww) skipped.push('note: the gallery is narrower than half its furniture'); const h = Math.round(ww * 0.72 / 10) * 10, prm = { w: ww, h, align: 'centre' }; const gid = put('0', 'galleryWall', xc, { y: over ? top + 190 : Math.round(1500 - h / 2), params: prm }); if (gid) { a.hangTo(gid, over ? { bottom: top + 190 } : { middle: 1500 }); if (over) a.centreOn(gid, over); } return { ids, left, skipped }; }
  const h = rule.tall ? Math.min(1200, round(w * rule.tall)) : round(w * (r() < 0.5 ? 0.75 : 1.2));
  const prm = rule.a[0] === 'picture' ? a.dealt('picture', { w, h: Math.min(h, 900) }) : { w, h: Math.min(h, 1200) };
  const lift = rule.a[0] === 'picture' ? a.frameLift(prm) : 0, hh = prm.h ?? h;
  const pid = put('0', rule.a[0], xc, { y: over ? Math.round(top + 170 + 60 * r()) - lift : Math.round(1500 - hh / 2) - lift, params: rule.a[0] === 'mirror' ? { w, h: Math.min(h, 1200) } : prm });
  if (pid && rule.a[0] !== 'picture') a.hangTo(pid, over ? { bottom: Math.round(top + 170 + 60 * r()) } : { middle: 1500 });   // the real bottom or middle, measured (a painted picture is hung by its frame size)
  return { ids, left, skipped };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) { for (const p of wallPhrases()) console.log(p); }
