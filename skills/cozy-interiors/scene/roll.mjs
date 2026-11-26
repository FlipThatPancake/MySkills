#!/usr/bin/env node
// node roll.mjs [seed] [area kinds...] → rolls the choices for a new home from tables.json (one table, edit it to widen the variety) and prints them with the seed; the same seed gives the same picks.
// Kinds: kitchen, dining, living, bedroom, reading-corner, hallway, home-office (default: kitchen dining living). Example: node roll.mjs 12 kitchen reading-corner.
// A kitchen's shape is picked first (uniformly), then a backing that suits it (an L or a U needs a square corner); kitchen.shapeNotes in tables.json says what each shape is.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dealOpenPlan } from './openplan.mjs';
import { dealMotion } from './motion-roll.mjs';
import { planHome, wallLoad, SIZES } from './plan.mjs';
import { groupNeeds } from './groups.mjs';
import { THIRD, thirdSlot, slotWall } from './slotmath.mjs';
import { zone, floorBox, floorSpot, rectCut } from './slotmath.mjs';
import { STYLE, DEFAULTS } from './src/openings.js';
const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tables.json'), 'utf8'));
export const KINDS = Object.keys(T).filter((k) => T[k]?.hero && T[k]?.openings);   // an area kind has a hero and openings ('names' has a hero table but is no area)

// the deal must not break the checks or contradict itself (rollstats.mjs counts every case): nothing twice in one area, one lamp, the cutting board once, a plant corner counts as the floor plant
const ONCE = /^(vase|candlesticks)$/;
function consistent(a, id, home) {   // home: the assets of this home already dealt once (a vase or a picture is dealt to one area only, so no two rooms repeat it)
  const t = T.stillLife[id], used = new Set(), asset = (x) => (x.match(/\(([A-Za-z]+)\)\s*$/) || [])[1];
  const lampGroup = (a.groups || []).find((g) => /\blamp\b/.test(g));
  if (lampGroup) a.light = /floor lamp/.test(lampGroup) ? 'floor lamp' : 'table lamp';   // a group that stands its own lamp is the area's light
  for (const [i, st] of (a.still || []).entries()) {
    const pool = (t.tops.find((q) => q.id === st.top) || { things: [] }).things;
    const ok = (y, res) => !(ONCE.test(asset(y) || '') && home.has(asset(y))) && !(asset(y) === 'readingLamp' && a.light) && !(asset(y) === 'cuttingBoard' && a.board) && !used.has(asset(y)) && !res.some((r) => asset(r) === asset(y)), res = [];
    for (const x of st.things) { if (ok(x, res)) res.push(x); else { const y = pool.find((q) => ok(q, res) && !st.things.some((r) => asset(r) === asset(q))); if (y) res.push(y); } }
    st.things = res;
    for (const x of st.things) { used.add(asset(x)); if (ONCE.test(asset(x) || '')) home.add(asset(x)); }
  }
  { const SL = T.stillLife[id]; if (SL && a.wallArr && /\(picture\)/.test(a.wallArr)) { if (home.has('picture')) { const alt = SL.wall.filter((q) => !/\(picture\)/.test(q)); if (alt.length) a.wallArr = alt[(a.wallArr.length + id.length) % alt.length]; } if (/\(picture\)/.test(a.wallArr)) home.add('picture'); } }   // a wall arrangement with a picture is dealt to one area only
  if ((a.still || []).some((st) => st.things.some((w) => /\(bedsideLamp\)/.test(w)))) a.more = (a.more || []).filter((w) => !/\(wallSconce\)/.test(w));
  { const SL = T.stillLife[id]; if (SL && a.wallArr && /\(wallSconce\)/.test(a.wallArr) && (a.still || []).some((st) => st.things.some((w) => /\(bedsideLamp\)/.test(w)))) { const alt = SL.wall.filter((q) => !/\(wallSconce\)/.test(q)); if (alt.length) a.wallArr = alt[(a.wallArr.length + id.length) % alt.length]; } }   // round 4 G4: a bedside lamp is the light of each side, so the wall holds no sconce as well
  { const L = T.groups?.list[id] || [], lampAt = (a.groups || []).map((g, k) => (/\blamp\b/.test(g) ? k : -1)).filter((k) => k >= 0);   // two groups that both stand a lamp: the later one is another group of the list
    const fl = (k) => { const n = groupNeeds(groupPhrase(a.groups[k])) || {}; return n.float && !n.window && !n.second && n.wall !== 'solid' && !n.door; }, keep = lampAt[0] === 0 ? 0 : (lampAt.find(fl) ?? lampAt[0]);   // the hero keeps its lamp; else the lamp group that can stand on the floor does, the area needs one
    for (const k of lampAt.filter((q) => q !== keep)) { const at = a.groups[k].lastIndexOf(', on the '), place = at < 0 ? '' : a.groups[k].slice(at + 2), needFloat = fl(k) && !a.groups.some((g, j) => j !== k && fl(j)), ok = (q) => !/\blamp\b/.test(q) && !a.groups.some((g) => g.startsWith(q)), pick = (needFloat && L.find((q) => ok(q) && (groupNeeds(q) || {}).float)) || L.find(ok); if (pick) a.groups[k] = place ? `${pick}, ${place}` : pick; } }
  if ((a.groups || []).some((g) => /floor plant/.test(g)) && !a.plantAt.includes('floor')) { a.plantAt = [...a.plantAt, 'floor']; a.plants = a.plantAt.length; }
}

// round 6 item 12: the checks' variety rules are about the whole home, so the roll applies them to the whole home too. A basket, pouf, trolley, crate, stool or footstool stays in one area (three at most); any other small piece that stands on a surface (a mug, a jug, a fruit bowl) comes twice at most. A slot over the cap takes the next phrase of its own pool that keeps every cap. rollstats.mjs proves it over many seeds.
export const ONE_AREA = new Set(['basket', 'pouf', 'trolley', 'crate', 'stepStool', 'footstool', 'stool', 'bench']);   // round 6 B15: a bench only in the hallway
export const STAMP_SKIP = /^(tablecloth|tableRunner|cloth|cushion|benchCushion|floorCushion|books|openBook|scuff|leaf|pendantLamp|pan|hob|hood|plate|cup|saltPepper|foldedThrow|teaTowel|curtain|heightChart|cuttingBoard|cat|picture|mirror)$/;
export const SMALL_ON = new Set(['jug', 'mug', 'vase', 'candlesticks', 'fruitBowl', 'jars', 'herbs', 'mokaPot', 'keyBowl', 'breadBasket', 'glassesBook', 'kettle', 'teaSet', 'globe']);
export function phraseAssets(t) {   // the assets a phrase names for certain (one choice only): its bracket name, or the single-choice parts of its tables.json names entry
  const br = (t.match(/\(([A-Za-z, ]+)\)\s*$/) || [])[1];
  if (br) return br.split(',').map((x) => x.trim());
  const m = T.names.things[t] ?? T.names.groups[t] ?? T.names.hero[t];
  return m ? m.split('+').filter((p) => !p.includes('|')) : [];
}
// the slot names of a group's place: <wall>:<third> (wall = back | left | right | window, third = left | middle | right); the hero group takes the back wall's third on its side of the home view
export const SLOTS = { 'on the back wall, left third': 'back:left', 'on the back wall, right third': 'back:right', 'on the window wall or the second wall': 'window:middle', 'on the open floor': 'floor:middle', 'on the open floor, front': 'floor:front', 'on the open floor, back': 'floor:back', 'on the back wall, middle third': 'back:middle', 'on the window wall, left third': 'window:left', 'on the window wall, right third': 'window:right' };
// a dealt group text without its place: the phrase a.group takes
export const groupPhrase = (g) => g.replace(/ \(the hero group[^)]*\)$/, '').replace(/, on the .*$/, '');
export function groupSlot(g, two = true) { const h = g.match(/the hero group, on the (left|right) of the home view/); if (h) return `${two ? (() => { const n = groupNeeds(g.replace(/ \(the hero group.*\)$/, '')); return n?.second ? 'second' : n?.window ? 'window' : 'back'; })() : 'back'}:${h[1]}`; const at = g.lastIndexOf(', on the '); return at < 0 ? null : SLOTS[g.slice(at + 2)] ?? null; }
const prov = { worktop: /./, table: /table|island/, sideboard: /sideboard|dresser/, 'coffee table': /coffee table/, 'side table': /side table/, 'bedside table': /^bed /, 'chest of drawers': /chest of drawers/, shelf: /shelf|bookcase|window seat|bookshelf/, console: /console/, desk: /desk/ };   // the furniture a still life stands on -> the dealt group that provides it
// each group to a slot that suits its needs and exists in the shell its backing builds; a still life only for a top that one of the groups stands.
// After the plan the deal measures a slot exactly as a.slots() does (slotmath.mjs thirdSlot, one function): the plan's windows at their x with the shell's widths, the plan's ways through, and the groups already dealt to that wall.
// the shell the plan will build for one area, measured by slotmath.mjs (the measure a.slots() uses): fit(slot, group) says whether a bare stretch holds the group there, stand(slot, group) takes that stretch for it
function shellFor(out, id) {
  const a = out.areas[id], bk = T.backing.find((x) => x.id === a.backing) || {}, two = bk.walls === 2, second = two ? bk.second : null, PA = out.plan?.areas?.[id], links = (out.plan?.links || []).filter((l) => l.kind !== 'open');
  const at = (g) => g.lastIndexOf(', on the '), base = (g) => groupPhrase(g), nd = (g) => groupNeeds(base(g)) || {};
  const wallLen = { back: PA?.fit[0], ...(second ? { [second]: PA?.fit[1] } : {}) }, winsOn = (wn) => (PA?.windows || []).filter((q) => q.wall === wn && q.x != null);
  const winWall = slotWall([{ id: 'back', window: winsOn('back').length > 0 }, ...(second ? [{ id: second, window: winsOn(second).length > 0 }] : [])]).id, wallOf = (v) => (v.startsWith('back:') ? 'back' : v.startsWith('second:') ? second : winWall), taken = {};
  const reserved = [];   // what the groups dealt so far hold of the floor: { r: [x0, z0, x1, z1], wall } in the area's own frame; a floor group stands clear of them (slotmath.mjs floorSpot) and a wall group along another wall is cut where they reach into its depth (rectCut)
  const frame = (wn) => { const [W, D] = PA?.fit || [0, 0]; return wn === 'back' ? [(x) => x, (x, z) => z] : wn === 'left' ? [(x, z) => D - z, (x) => x] : [(x, z) => z, (x) => W - x]; };
  const crossCuts = (wn, n) => { if (!PA || !wn) return []; const [ox, off] = frame(wn); return reserved.filter((q) => q.wall !== wn).map((q) => rectCut(q.r, ox, off)).filter((c) => c.offMin < (n.d || 600) + 50 && c.offMax > -50).map((c) => ({ a: c.a - 50, b: c.b + 50 })); };   // the wall's own pieces are cut by `taken`
  const cutsOf = (wn, n) => [...links.filter((l) => (l.a === id && l.aWall === wn) || (l.b === id && l.bWall === wn)).map((l) => { const o = { kind: l.kind, width: l.width || 1000 }, x = (l.a === id ? l.aF : l.bF) * wallLen[wn]; return { a: x - zone(o), b: x + zone(o) }; }),
    ...(n.window ? [] : winsOn(wn).map((q) => { const w = STYLE[q.style]?.width ?? DEFAULTS.window.width; return { a: q.x - (w / 2 + 300), b: q.x + (w / 2 + 300) }; })), ...(taken[wn] || []), ...crossCuts(wn, n)];
  const slot = (v, g) => { const n = nd(g), wn = wallOf(v); return thirdSlot(wallLen[wn], cutsOf(wn, n), THIRD.indexOf(v.split(':')[1]), Math.max(600, n.w || 600), n.window ? winsOn(wn).map((q) => q.x) : []); };
  const rect = PA ? [0, 0, PA.fit[0], PA.fit[1]] : null;   // what the wall groups dealt so far hold of the floor: a floor group stands where its own footprint is clear (slotmath.mjs floorSpot, the measure a.group({ slot: 'floor:..' }) uses)
  const footprint = (v, g) => { const r = slot(v, g), n = nd(g), w = n.w || 600, d = n.d || 600, wn = wallOf(v), [W, D] = PA.fit; if (!r.best || !wn) return null; return wn === 'back' ? [r.xc - w / 2, 0, r.xc + w / 2, d] : wn === 'left' ? [0, D - (r.xc + w / 2), d, D - (r.xc - w / 2)] : [W - d, r.xc - w / 2, W, r.xc + w / 2]; };
  const floorAt = (v, g) => { const [, band, third] = v.split(':'), n = nd(g); return floorSpot(rect, floorBox(rect, band, third || 'all'), reserved.map((q) => q.r), n.w || 600, n.d || 600); };
  const fit = (v, g) => { if (!PA) return true; if (v.startsWith('floor:')) return !!floorAt(v, g); const wn = wallOf(v); return !!wn && !!wallLen[wn] && !!slot(v, g).best; };   // a.slots(): a bare stretch as wide as the recipe, its middle in the third; a floor slot: a clear place for the group's footprint
  const stand = (v, g) => { if (!PA) return; if (v.startsWith('floor:')) { const at = floorAt(v, g), n = nd(g), w = n.w || 600, d = n.d || 600; if (at) reserved.push({ r: [at[0] - w / 2, Math.max(at[1] - d / 2, 900), at[0] + w / 2, Math.max(at[1] - d / 2, 900) + d], wall: 'floor' }); return; } const r = slot(v, g), w = nd(g).w || 600; if (r.best) { (taken[wallOf(v)] ||= []).push({ a: r.xc - w / 2 - 50, b: r.xc + w / 2 + 50 }); const f = footprint(v, g); if (f) reserved.push({ r: f, wall: wallOf(v) }); } };
  return { fit, stand, two, PA };
}
// per group of an area: does the dealt slot hold the group, in the order the groups stand (the roll's own measure, for rollstats)
export function slotFits(out, id) { const a = out.areas[id], sh = shellFor(out, id); return (a.groups || []).map((g, k) => { const v = a.groupSlots[k], ok = sh.fit(v, g); sh.stand(v, g); return ok; }); }
function dealSlots(out, kinds) {
  for (const id of kinds) { const a = out.areas[id]; if (!a.groups) continue;
    const at = (g) => g.lastIndexOf(', on the '), base = (g) => groupPhrase(g), say = (sl) => Object.entries(SLOTS).find(([, v]) => v === sl)[0], nd = (g) => groupNeeds(base(g)) || {}, { fit, stand, two, PA } = shellFor(out, id);
    const allowed = (g, strict = true) => { const n = nd(g); return Object.values(SLOTS).filter((v) => (n.free ? v.startsWith('floor:') : !v.startsWith('floor:')) && (two || !/^(window|second):/.test(v)) && (!strict || fit(v, g)) && (n.second ? v.startsWith('second:') : n.window ? (two ? v.startsWith('window:') : v.startsWith('back:')) : !n.window) && (n.wall !== 'solid' || n.second || !v.startsWith('window:'))); };
    const heroSides = (g) => { const h = groupSlot(g, two), [pre, side] = h.split(':'); return [h, `${pre}:middle`, `${pre}:${side === 'left' ? 'right' : 'left'}`, ...(two && !nd(g).free && pre !== 'second' ? ['second:left', 'second:right', 'second:middle'] : [])]; };   // its own wall first, then the second wall
    // every area gets one group on its open floor: a free group (island, table) already is; else the first group that can float (groups.mjs FLOATS), the hero first
    const fk = a.groups.findIndex((g) => nd(g).free) >= 0 ? -1 : a.groups.findIndex((g) => nd(g).float && !nd(g).window && !nd(g).second && nd(g).wall !== 'solid' && !nd(g).door);
    if (fk > 0 && !/, on the open floor(, front|, back)?$/.test(a.groups[fk])) a.groups[fk] = base(a.groups[fk]) + ', ' + say('floor:middle');
    const used = new Set(), hero = a.groups[0], hs = heroSides(hero), hv = fk === 0 ? 'floor:middle' : hs.find((v) => fit(v, hero)) || hs[0]; used.add(hv); stand(hv, hero);   // the hero keeps its side of the home view; when its third has no bare stretch it takes the next third of the same wall
    const order = a.groups.map((g, k) => k).slice(1).sort((x, y) => (nd(a.groups[x]).free ? 1 : 0) - (nd(a.groups[y]).free ? 1 : 0) || allowed(a.groups[x]).length - allowed(a.groups[y]).length);   // the wall groups first, the groups that stand free on the floor after them: the floor is what the walls leave   // the most constrained group chooses first
    const dropped = [];
    for (const k of order) { const g = a.groups[k], ok = allowed(g), cur = groupSlot(g, two); if (k === fk) continue; const sl = ok.includes(cur) && !used.has(cur) ? cur : ok.find((v) => !used.has(v)); if (!sl) { if (PA) { dropped.push(k); continue; } const rel = allowed(g, false).find((v) => !used.has(v)) || cur; if (rel && rel !== cur) a.groups[k] = base(g) + ', ' + say(rel); used.add(rel); continue; }
      if (sl !== cur && at(g) >= 0) a.groups[k] = base(g) + ', ' + say(sl); else if (at(g) < 0) a.groups[k] = base(g) + ', ' + say(sl); used.add(sl); stand(sl, g); }
    if (fk > 0) { const g = a.groups[fk], v = ['floor:middle', 'floor:front', 'floor:back'].find((q) => fit(q, g)); if (v) { a.groups[fk] = base(g) + ', ' + say(v); used.add(v); stand(v, g); } else dropped.push(fk); }   // the floor group takes what the hero and the wall groups left of the floor, or is left out
    for (const k of dropped.sort((x, y) => y - x)) a.groups.splice(k, 1);   // a group no bare stretch can hold, on either wall or the floor: left out of the deal
    { const fl = (g) => (groupSlot(g, two) || '').startsWith('floor:'); const rest = a.groups.slice(1); a.groups = [a.groups[0], ...rest.filter((g) => !fl(g)), ...rest.filter(fl)]; }   // built in this order (a.group places them one after the other): the hero, the wall groups, then the groups on the open floor, so each stands where the ones before left room
    a.groupSlots = a.groups.map((g) => groupSlot(g, two)); a.groupSlots[0] = a.heroSlot = hv;   // the hero's own slot (it may have moved off its side of the home view to a bare stretch)
    a.still = (a.still || []).filter((st) => a.groups.some((g) => (prov[st.top] || /./).test(base(g)))); }   // a still life only for a top that one of the groups stands (round 6 stage harness)
}
// after the plan: a wall holds its groups, its windows and outside doors, and the ways through (plan.mjs wallLoad). A wall that cannot: the group that asks most of it moves to the other wall when that wall has room, else it is left out
function fitWalls(out, kinds) {
  for (const id of kinds) { const a = out.areas[id], PA = out.plan?.areas?.[id]; if (!a.groups || !PA) continue;
    const bk = T.backing.find((x) => x.id === a.backing) || {}, two = bk.walls === 2, walls = ['back', ...(two ? [bk.second] : [])], links = out.plan.links.filter((l) => l.kind !== 'open'), kind = id.replace(/\d+$/, '');
    const len = (w) => (w === 'back' ? PA.fit[0] : PA.fit[1]), ways = (w) => links.filter((l) => (l.a === id && l.aWall === w) || (l.b === id && l.bWall === w)).length;
    const short = (w) => wallLoad(a, kind, w, ways(w)) - len(w) > 1, winSide = (a.openings || []).some((o) => o.kind === 'window' && o.on === 'second') || !(a.openings || []).some((o) => o.kind === 'window'), onSide = (v) => two && (v.startsWith('second:') || (v.startsWith('window:') && winSide)), wallOf = (k) => (a.groupSlots[k].startsWith('floor:') ? null : onSide(a.groupSlots[k]) ? bk.second : 'back');   // the plan's own reading of a slot (plan.mjs needLists)
    const at = (g) => g.lastIndexOf(', on the '), base = (g) => groupPhrase(g), say = (sl) => Object.entries(SLOTS).find(([, v]) => v === sl)[0];
    const sync = () => { a.groupSlots = a.groups.map((g) => groupSlot(g, two)); if (a.heroSlot) a.groupSlots[0] = a.heroSlot; };
    sync();
    for (let guard = 0; guard < 8; guard++) { const wall = walls.find((w) => short(w) && a.groups.some((g, k) => k > 0 && wallOf(k) === w && !(groupNeeds(base(g)) || {}).free)); if (!wall) break;   // a wall short for the hero and its openings alone is the plan's to size
      const cand = a.groups.map((g, k) => k).filter((k) => k > 0 && wallOf(k) === wall && !(groupNeeds(base(a.groups[k])) || {}).free).sort((x, y) => (groupNeeds(base(a.groups[y])).w || 0) - (groupNeeds(base(a.groups[x])).w || 0));
      if (!cand.length) break; const k = cand[0], n = groupNeeds(base(a.groups[k])) || {}, was = a.groups[k], other = walls.find((w) => w !== wall);
      let moved = false;
      if (other && !n.window && !n.second && n.wall !== 'solid' || (other && wall !== 'back' && !n.window && !n.second)) {   // a group that wants the window wall or a solid wall stays where its need is met
        const free = Object.values(SLOTS).filter((v) => !v.startsWith('floor:') && (other === 'back' ? v.startsWith('back:') : onSide(v)) && !a.groupSlots.includes(v));
        for (const v of free) { a.groups[k] = base(was) + ', ' + say(v); sync(); if (!short(other) && !short(wall) && slotFits(out, id)[k]) { moved = true; break; } }
        if (!moved) { a.groups[k] = was; sync(); } }
      if (!moved) { a.groups.splice(k, 1); sync(); }
    }

    a.still = (a.still || []).filter((st) => a.groups.some((g) => (prov[st.top] || /./).test(base(g))));
  }
}
function homeCaps(out, kinds, describe) {
  const count = {}, areasOf = {};   // asset -> number of slots, asset -> areas that hold it
  const stampable = (as) => ONE_AREA.has(as) || (!STAMP_SKIP.test(as) && SMALL_ON.has(as));
  const over = (as, id, extra = 0) => { if (!stampable(as)) return false; const n = (count[as] || 0) + 1 + extra, ar = new Set(areasOf[as] || []); ar.add(id); return ONE_AREA.has(as) ? (ar.size > 1 && n > 1) || n > 3 : n > 2; };
  const add = (as, id) => { if (!stampable(as)) return; count[as] = (count[as] || 0) + 1; (areasOf[as] ||= new Set()).add(id); };
  const bad = (t, id) => { const l = phraseAssets(t); return l.some((as) => over(as, id, l.filter((q) => q === as).length - 1)); };
  const same = (x, y) => phraseAssets(x).join() === phraseAssets(y).join();
  const onceElsewhere = (as, id) => ONCE.test(as) && kinds.some((q) => q !== id && (out.areas[q].still || []).some((st) => st.things.some((w) => phraseAssets(w).includes(as))));
  for (const id of kinds) {
    const a = out.areas[id], t = T[id], hasSconce = () => /wallSconce/.test(JSON.stringify([a.wallArr, a.more, a.accents])), hasBedside = () => (a.still || []).some((st) => st.things.some((w) => /\(bedsideLamp\)/.test(w)));
    const mineAs = new Set(), slot = (get, set, pool, keep = () => true) => { const cur = get(); if (phraseAssets(cur).length && phraseAssets(cur).every((x) => mineAs.has(x))) return;   /* the area already holds that asset: one object satisfies both phrases (a mug sign and a mug on a table) */ if (bad(cur, id)) { const alt = pool.find((q) => keep(q) && !bad(q, id)); if (alt) set(alt); } phraseAssets(get()).forEach((as) => { add(as, id); mineAs.add(as); }); };
    for (const st of a.still || []) { const pool = (T.stillLife[id].tops.find((q) => q.id === st.top) || { things: [] }).things; for (let k = 0; k < st.things.length; k++) slot(() => st.things[k], (v) => { st.things[k] = v; }, pool, (q) => { const as = phraseAssets(q); return !(a.still || []).some((o) => o.things.some((r) => same(r, q))) && !as.some((x) => onceElsewhere(x, id)) && !(as.includes('readingLamp') && a.light) && !(as.includes('cuttingBoard') && a.board) && !(as.includes('bedsideLamp') && hasSconce()); }); }
    for (let k = 0; k < a.accents.length; k++) slot(() => a.accents[k], (v) => { a.accents[k] = v; }, t.accents, (q) => !a.accents.includes(q));
    if (a.foreground) slot(() => a.foreground, (v) => { a.foreground = v; }, [...t.foreground, ...(t.foregroundSwap || [])]);   // foregroundSwap: only homeCaps may swap these in, so the deal's draws stay
    for (let k = 0; k < (a.more || []).length; k++) slot(() => a.more[k], (v) => { a.more[k] = v; }, t.more || [], (q) => !a.more.includes(q) && !a.accents.includes(q) && !(/\(wallSconce\)/.test(q) && hasBedside()));
    { const taken = new Set(kinds.flatMap((q) => out.areas[q].signs || [])); for (let k = 0; k < (a.signs || []).length; k++) slot(() => a.signs[k], (v) => { taken.delete(a.signs[k]); a.signs[k] = v; taken.add(v); }, T.signs.filter((x) => x.in.includes(id)).map((x) => x.id), (q) => !taken.has(q));
      for (let k = a.signs.length - 1; k >= 0 && a.signs.length > 2; k--) if (!phraseAssets(a.signs[k]).every((x) => mineAs.has(x) && count[x] <= 2) && bad(a.signs[k], id)) a.signs.splice(k, 1); }   /* no sign is left to swap in: the area keeps two */
    for (let k = 1; k < (a.groups || []).length; k++) { const g = a.groups[k], at = g.lastIndexOf(', on the '), place = at < 0 ? '' : g.slice(at), base = at < 0 ? g : g.slice(0, at), lampy = /\blamp\b/.test(base); slot(() => base, (v) => { a.groups[k] = v + place; }, T.groups.list[id] || [], (q) => !a.groups.some((o) => o.startsWith(q)) && /\blamp\b/.test(q) === lampy); }
    if ((a.groups || []).some((g) => /floor plant/.test(g)) && !a.plantAt.includes('floor')) { a.plantAt = [...a.plantAt, 'floor']; a.plants = a.plantAt.length; }
  }
  for (const id of kinds) out.areas[id].say = describe(id, out.areas[id]);
}
export function roll(seed, kinds = ['kitchen', 'dining', 'living'], opts = {}) {   // opts: { rooms: [[ids sharing one open room]], touch: [[a, b]] } (the CLI: kitchen+dining+living hallway --touch=hallway:living)
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let s2 = (seed ^ 0x9e3779b9) >>> 0;   // a second stream deals the `more` extras, so the older picks stay the same when a table gains phrases
  const rnd2 = () => { s2 = (s2 + 0x6d2b79f5) >>> 0; let t = s2; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const some2 = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd2() * c.length), 1)[0]); return out; };
  let s3 = (seed ^ 0x85ebca6b) >>> 0;   // a third stream deals plant places, and the foreground piece, so the older picks stay the same
  const rnd3 = () => { s3 = (s3 + 0x6d2b79f5) >>> 0; let t = s3; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick3 = (a) => a[Math.floor(rnd3() * a.length)], some3 = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd3() * c.length), 1)[0]); return o; };
  let s4 = (seed ^ 0xc2b2ae35) >>> 0;   // a fourth stream deals each area's light, so no older pick moves
  const rnd4 = () => { s4 = (s4 + 0x6d2b79f5) >>> 0; let t = s4; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const light = (kind) => { const l = T.lights[kind] || T.lights.living, tot = l.reduce((a, x) => a + x.w, 0); let q = rnd4() * tot; for (const x of l) { q -= x.w; if (q < 0) return x.id; } return l[0].id; };
  let s5 = (seed ^ 0x27d4eb2f) >>> 0;   // a fifth stream deals each window's style, so no older pick moves
  const rnd5 = () => { s5 = (s5 + 0x6d2b79f5) >>> 0; let t = s5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let s6 = (seed ^ 0x165667b1) >>> 0;   // a sixth stream deals the still lifes and wall arrangements, so no older pick moves
  const rnd6 = () => { s6 = (s6 + 0x6d2b79f5) >>> 0; let t = s6; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick6 = (a) => a[Math.floor(rnd6() * a.length)], some6 = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd6() * c.length), 1)[0]); return o; };
  let s7 = (seed ^ 0x7f4a7c15) >>> 0;   // a seventh stream deals each area's extra shootable groups, so no older pick moves
  const rnd7 = () => { s7 = (s7 + 0x6d2b79f5) >>> 0; let t = s7; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const some7 = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd7() * c.length), 1)[0]); return o; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const winStyle = (kind, special) => { let pool = T.windows.filter((x) => special || ['sash', 'picture', 'pair'].includes(x.style)); const fresh = pool.filter((x) => x.style === 'sash' || !usedWin.has(x.style)); if (fresh.length) pool = fresh; const l = pool.map((x) => ({ x, w: x.weight[kind] ?? x.weight.default })); let q = rnd5() * l.reduce((a, y) => a + y.w, 0); for (const y of l) { q -= y.w; if (q < 0) return y.x; } return l[0].x; };
  const some = (a, n) => { const c = a.slice(), out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
  const usedOnce = new Set();
  const out = { seed, floor: pick(T.floor), use: 'plantAt: place each plant at those places (one floor plant at most). foreground: the near-camera piece of the shots. groups: build every listed group (a few pieces under one group name, at the place named) and make each the subject of one tour shot; the hero group counts as the first. Soft things: a.seatSoft(id, { tone }), a.table(id, { cloth: true }). still: put each thing on its top with a.onTop; wallArr: hang it on the longest bare wall stretch. side: the hero group sits on that side of the home view. See compose.mjs.', areas: {} }, used = new Set(), usedAcc = new Set(), ONE = ['basket', 'pouf', 'trolley'], usedBack = new Set(), usedWin = new Set(); let sideNow = rnd6() < 0.5 ? 'left' : 'right';   // signs dealt so far: none repeats in a home; a basket, pouf or trolley appears in one area of a home at most (check-home's variety rule)
  const describe = (id, a) => {   // the choices of one area in plain words
    const b = T.backing.find((x) => x.id === a.backing);
    const wall = (on) => (on === 'second' ? `the ${b.second} wall` : 'the back wall'), shape2 = b.walls === 1 ? 'one backing wall' : `two backing walls at ${b.angle} degrees, the second wall on the ${b.second}`;
    return `${id}: ${a.hero}; ${shape2}; ${a.openings.map((o) => `${o.kind === 'arch' ? 'arch ' + (a.passages[a.openings.filter((q) => q.kind === 'arch').indexOf(o)] || 'round') : o.style ? ({ picture: 'picture window', pair: 'tall pair of casements', bay: 'bay window', wall: 'window wall', french: 'french glass doors', slider: 'sliding glass doors' }[o.style]) : o.kind} on ${wall(o.on)}`).join(', ')}; accents: ${a.accents.join(', ')}${a.more.length ? `, ${a.more.join(', ')}` : ''}; plants: ${a.plantAt.map((x) => T.plantPlaces.find((p) => p.id === x).say).join('; ')}; ${a.still ? 'still life: ' + a.still.map((x) => x.say + ' holds ' + x.things.join(' and ')).join('; ') + '; wall arrangement: ' + a.wallArr + '; ' : ''}hero group on the ${a.side} of the home view; foreground piece: ${a.foreground}; light: ${a.light}; ${a.board ? 'cutting board: ' + T.boardPlaces.find((p) => p.id === a.board).say + '; ' : ''}${a.above ? 'above the run: ' + a.above + '; ' : ''}pieces: ${(a.pieces || []).join(', ') || 'as the hero needs'}; signs of life: ${a.signs.join(', ')}`;   // the choices in plain words
  };
  for (const id of kinds) {
    if (!KINDS.includes(id)) throw new Error(`unknown area kind "${id}"; known: ${KINDS.join(', ')}`);
    const t = T[id], shape = id === 'kitchen' ? pick(t.shape) : null;
    const W = T.backingWeights[shape === 'L' || shape === 'U' ? 'cornerShapes' : 'freeShapes'], bag = T.backing.flatMap((x) => Array(W[x.id] || 0).fill(x)); let b0 = pick(bag); { const fresh = bag.filter((x) => !usedBack.has(x.id)); if (usedBack.has(b0.id) && fresh.length) b0 = fresh[Math.floor(rnd6() * fresh.length)]; } const b = b0; usedBack.add(b.id);   // weighted so the backings come up evenly overall; a backing already used in this home is swapped for a fresh one (own stream, so no other pick moves)
    const a = { backing: b.id, hero: pick(t.hero), openings: pick(t.openings.filter((o) => b.walls === 2 || o.every((x) => x.on === 'first'))).map((o) => ({ ...o, on: b.walls === 1 ? 'first' : o.on })), accents: some(t.accents, 3 + Math.floor(rnd() * 3)), plants: pick(T.plants) };
    if (id === 'bedroom' && a.openings.some((o) => o.kind === 'window' && o.on === 'first')) { if (b.walls !== 2) a.backing = T.backing.find((x) => x.walls === 2).id; a.hero = 'bed with its headboard on the second wall (the back wall holds the window)'; }   // round 6 item 8: a headboard never stands under a window
    { let special = false; a.openings = a.openings.map((o) => { if (o.kind !== 'window') return o; const fixed = o.sash === 'fixed' || o.sash === 'out' || /sink/.test(a.hero); if (fixed) return o; const st = winStyle(id, !special); if (st.style === 'sash') return o; usedWin.add(st.style); if (st.style === 'picture' || st.style === 'pair') return { ...o, style: st.style }; special = true; const { sash, ...rest } = o; return { ...rest, ...(st.kind ? { kind: st.kind } : {}), style: st.style }; }); }   // a window wall or glass door is the area's one big opening: the other openings stay plain
    { const hn = groupNeeds(a.hero); if (hn && !hn.free && !hn.window && !hn.second) a.openings = a.openings.map((o) => (o.kind === 'window' && o.on === 'first' && (o.style === 'wall' || o.style === 'bay') ? { ...o, style: 'picture' } : o)); }   // a hero that stands at the back wall keeps a bare stretch there (hero-slot-without-stretch): a window wall or bay would take the whole wall, so that window is a picture window
    { const hn = groupNeeds(a.hero), win = a.openings.find((o) => o.kind === 'window' && o.on === 'first' && o.style !== 'wall' && o.style !== 'bay'), cap = SIZES[id.replace(/\d+$/, '')];   // round 6 (oversized rooms): a window beside a hero and its neighbour on the back wall made the plan grow that wall (kitchen 6000 -> 8100 mm); the window goes to the second wall when the hero's wall would pass the kind's largest cell
      if (hn && !hn.free && !hn.second && win && cap && b.walls !== 0 && hn.w + 1600 + (({ sash: 1500, picture: 2100, pair: 1100 })[win.style] || 1500) + 600 > cap[0]) { const two = b.walls === 2 ? b : pick3(T.backing.filter((x) => x.walls === 2 && x.angle === 90)); a.backing = two.id; a.openings = a.openings.map((o) => (o === win ? { ...o, on: 'second' } : o)); } }
    a.accents = a.accents.map((x) => { if (!(ONE.includes(x) && usedAcc.has(x))) return x; const spare = t.accents.filter((y) => !a.accents.includes(y) && !(ONE.includes(y) && usedAcc.has(y))); return spare.length ? spare[Math.floor(rnd2() * spare.length)] : x; });   // a basket, pouf or trolley already dealt to another area is swapped for a spare accent (from the seed itself, so no other pick moves)
    a.accents.forEach((x) => { if (ONE.includes(x)) usedAcc.add(x); });
    a.more = some2(t.more || [], 1 + Math.floor(rnd2() * 2));
    a.plantAt = some3(T.plantPlaces.filter((x) => x.in.includes(id)), a.plants).map((x) => x.id); a.plants = a.plantAt.length;   // where each plant lives: distinct places, so at most one floor plant
    if (a.plantAt.includes('sill') && !a.openings.some((o) => o.kind === 'window' && !['wall', 'bay'].includes(o.style))) { const alt = T.plantPlaces.filter((x) => x.in.includes(id) && x.id !== 'sill' && !a.plantAt.includes(x.id)).map((x) => x.id)[0]; a.plantAt = a.plantAt.flatMap((p) => (p !== 'sill' ? [p] : alt ? [alt] : [])); a.plants = a.plantAt.length; }   // round 4 G6: a pot on a sill needs a window with a ledge at pot height (a window wall or a bay has none)
    a.passages = a.openings.filter((o) => o.kind === 'arch').map(() => { return pick3(T.passages).style; });   // each arch's style (a counter style, pass or widepass, is a hatch with a ledge: put the counter or worktop under it)
    if (id === 'kitchen') a.board = pick3(T.boardPlaces).id;
    if (id === 'kitchen') { a.above = pick6(t.above); a.produce = pick6(t.produce); a.accents = a.accents.map((x) => x === 'basket of vegetables' ? a.produce : x); if (a.foreground === 'basket of vegetables') a.foreground = a.produce; if (!a.accents.concat(a.foreground).some((x) => /vegetables|crate/.test(x))) a.produce = null; }   // the run always gets something above it, and a produce basket or crate is named by form   // where the cutting board is
    { const SL = T.stillLife[id]; if (SL) { a.still = SL.tops.map((tp) => ({ top: tp.id, say: tp.say, things: some6(tp.things, 2 + Math.floor(rnd6() * 2)).slice(0, 2) })); a.wallArr = pick6(SL.wall); } }   // 2 things for each waist-high top (the draw of 2 or 3 stays, so no later pick moves; one centrepiece and one small item is the tabletop rule) and one wall arrangement
    a.side = sideNow; sideNow = sideNow === 'left' ? 'right' : 'left';   // the side of the home view the hero group sits on: it alternates from area to area, so a home is not all one-sided
    { const G = T.groups, L = G?.list[id]; if (L) { const pl = some7(G.places, 2), gr = some7(L, 2); { const fl = (p) => { const n = groupNeeds(p.replace(/ \(the hero group[^)]*\)$/, '')) || {}; return (n.float || n.free) && !n.window && !n.second && n.wall !== 'solid' && !n.door; }; if (![a.hero, ...gr].some(fl)) { const alt = L.filter((p) => fl(p) && !gr.includes(p)); if (alt.length) gr[gr.length - 1] = alt[a.hero.length % alt.length]; } }   /* every area can put one group out on its floor (groups.mjs FLOATS, or a free one) */ a.groups = [`${a.hero} (the hero group, on the ${a.side} of the home view)`, ...gr.map((g, i) => `${g}, ${pl[i].say}`)]; } }   // at least three shootable groups, each a compact subject for one tour shot, on different walls so the shots can differ by 25 degrees (tables.json groups)
    a.light = light(id);   // the area's one light (a pendant over the table, island or chair in most kitchens, dining areas and reading corners)
    consistent(a, id, usedOnce);
    a.foreground = pick3(t.foreground);   // the near-camera piece comes from the area's own use
    a.signs = some(T.signs.filter((x) => x.in.includes(id) && !used.has(x.id)), 2 + Math.floor(rnd() * 2)); a.signs.forEach((x) => used.add(x.id)); a.signs = a.signs.map((x) => x.id);
    if (t.pieces) a.pieces = t.pieces;
    if (/bedroom/.test(id) && a.openings.some((o) => o.kind === 'window') && !(a.pieces || []).some((p) => /curtain|blind/.test(p))) a.pieces = [...(a.pieces || []), (seed * 7 + id.length) % 3 === 0 ? 'window blind, roller or roman, drawn part way (blind)' : 'curtain at a window'];   // round 4 U11: a bedroom window always gets a curtain or, one time in three, a blind
    if (shape) { a.shape = shape; a.shapeNote = t.shapeNotes[shape]; }
    a.say = describe(id, a);
    out.areas[id] = a;
  }
  homeCaps(out, kinds, describe);   // round 6 item 12: what the checks allow across the whole home (variety: one area per basket, pouf, trolley, stool..., two of any small piece)
  dealSlots(out, kinds);   // item C and round 6: the slot of each group, and the still lifes whose top a group stands (again after the plan: it can change an area's backing)
  dealMotion(out, seed);
  { const dropCat = (a) => { a.accents = (a.accents || []).filter((x) => !/^cat\b/.test(x)); a.say = a.say.replace(/accents: cat, /, 'accents: ').replace(/(accents: [^;]*?), cat(?=[,;])/, '$1'); };   // round 6 T9: a home has one cat; the motion roll's cat is the one (it keeps its own area), else the first area that dealt a cat accent
    const motionCat = Object.keys(out.areas).find((id) => (out.areas[id].motion || []).some((m) => m.kind === 'cat')); let kept = motionCat != null;
    for (const [id, a] of Object.entries(out.areas)) if ((a.accents || []).some((x) => /^cat\b/.test(x))) { if (kept && id !== motionCat) dropCat(a); else if (kept && id === motionCat) dropCat(a); else kept = true; } }
   // living things (motion-roll.mjs): 2 or 3 kinds per area, from tables.json motion; its own random stream, so no older pick moves
  const open = (opts.rooms || []).filter((r) => r.length > 1); if (open.length > 1) throw new Error('roll: one open room per home (kitchen+dining+living); the other areas are rooms of their own');
  dealOpenPlan(out, seed, kinds, describe, opts.rooms ? (open[0] || []) : null);   // open plan (openplan.mjs): about 2 homes in 5 with two joinable areas, or the room the agent named; its own random stream, so no older pick moves
  if (kinds.length > 1) for (const a of Object.values(out.areas)) a.passages = (a.passages || []).map((st) => (T.passages.find((q) => q.style === st)?.counter ? 'cased' : st));   // an arch is a way through in a home with a plan: a counter hatch is not walked through
  for (let k = 0; ; k++) {   // the house plan (plan.mjs): rooms and what touches; an area with no free wall takes a corner backing
    try { out.plan = planHome(out, seed, kinds, opts); break; }
    catch (e) { if (!e.needBacking || k > 2) throw e; for (const id of e.needBacking) { const a = out.areas[id], b = pick3(T.backing.filter((x) => x.walls === 2 && x.angle === 90)); a.backing = b.id; a.openings = a.openings.map((o) => ({ ...o })); if (id === 'bedroom' && a.openings.some((o) => o.kind === 'window' && o.on === 'first')) a.hero = 'bed with its headboard on the second wall (the back wall holds the window)'; a.say = describe(id, a); } }
  }
  dealSlots(out, kinds);
  fitWalls(out, kinds);
  if (out.openPlan) out.openPlan.behind = [];   // every area outside the open room is linked by the plan
  for (const id of kinds) { out.areas[id].say = describe(id, out.areas[id]); }
  for (const id of kinds) out.areas[id].say += ` | plan: view az ${out.plan.areas[id].az}, cell ${out.plan.areas[id].fit.join(' x ')} (the deal needs ${out.plan.areas[id].need.w} x ${out.plan.areas[id].need.d})`;
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('roll.mjs')) {
  const args = process.argv.slice(2), seed = /^\d+$/.test(args[0] || '') ? Number(args.shift()) : Math.floor(Math.random() * 1e6), touch = args.filter((x) => x.startsWith('--touch=')).flatMap((x) => x.slice(8).split(',').map((q) => q.split(':'))), words = args.filter((x) => !x.startsWith('--')), rooms = words.map((w) => w.split('+')), opts = words.some((w) => w.includes('+')) || args.includes('--rooms') ? { rooms, touch } : { touch };
  try { console.log(JSON.stringify(roll(seed, words.length ? rooms.flat() : undefined, opts), null, 1)); } catch (e) { console.error(e.message); process.exit(1); }
}
