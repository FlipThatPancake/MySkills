// compose.mjs — helpers for laying a home out in each area's own frame, then writing scene.json. A spec is a small script: scenes/seed-<n>.spec.mjs writes scenes/seed-<n>.json (the helpers are below).
// Everything is millimetres. An area has a local frame: x to the right, z toward the viewer, its backing wall along z = 0 (see the walls below). The areas stand in one house plan (plan.mjs; roll.mjs prints it): H.roll(roll) hands it over and H.area places each area from it (the root at the origin, an open-room area by H.join, any other back to back with the wall it is entered by, with the arch or door compose puts in both walls). An area with no place is refused; `a.view` takes its azimuth from the plan; GAP stays only for hand-placed fixtures.
//   const H = new Home({ seed, floor: 'auto' (boards, sometimes tiles) | 'tiles' | 'boards' | 'plain' (rare));
//   const a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 6600, 4200] });      // rect: [x0, z0, x1, z1] of the floor the area owns (its bounds); psi turns the whole area 90, 180 or -90 degrees; O sets its place by hand
//   Walls (the room is in front of each one). Openings are { kind: 'window' | 'door' | 'arch', x, width, height, sill, sash: 'fixed', hinge: 'l' | 'r', to: <area id>, ... }; x is the opening's middle, measured from the wall's LEFT end as you see it from the room:
//   const back = a.back(6600, [openings]);            // along the back, z = 0, from x = 0 to the right
//   const left = a.left(4200, [openings], angle);     // meeting the back's left end; angle 90 (default) or 120 between the two walls; its left end is the front one
//   const right = a.right(4200, [openings], angle);   // meeting the back's right end; its left end is the back one
//   Wall x, in one sentence: seen from inside the room, x counts from the wall's left end to its right end, so it runs left to right on the back wall, from the front corner to the back corner on the left wall, and from the back corner to the front corner on the right wall.
//        x grows ->       back                 plan from above, the room inside:
//        (left wall)  +------------------+  (right wall)
//       x grows  ^    |                  |   x grows
//       front->back   |       room       |   back->front  v
//                     +------------------+  front (open to the viewer)
//   Placing on a wall (xc is where the middle of the thing is along the wall, measured like an opening's x; the distance out from the wall comes from the asset, see assets.mjs):
//   back.place('fridge', 'fridge', 5100);   back.place('sofa', 'sofa', 3200, { y: 7, lift: 7, params: { seats: 2 } });   back.place('pic', 'picture', 2000, { y: 1400 });   onSill: back.onSill('herbs', 'plant', 2400, { params })  a pot or small thing on a window's sill (xc inside a window of that wall; it stands at the sill + 30 mm, its front inside the 110 mm lip);   options: y, turn (added to facing out from the wall), params, off (override), group, hero, shadow
//   A cabinet run with slots:  const R = a.run(back, 'run', 1650, [modules], { group: 'run' });  R.on('hob', 'hob');  R.on('hob', 'hood');  R.on('hob', 'pan');  R.on('sink', 'kettle');  (the thing goes on the middle of that module)
//   A table set:  const T = a.table('dining', { at: [2800, 2800], r: 650 | w: 1700, d: 900, chairs: 4, chairForm: 'ladder'|'spindle'|'bentwood'|'upholstered' (dealt per table if left out), rug: true, cloth: false | true });  T.over('pendantLamp');  T.on('vase')
//   What roll.mjs deals, and how a spec uses it:  plantAt (distinct places: sill (wall.onSill), shelf, worktop, hanging, floor; one floor plant at most) -> place each plant there;  foreground (the near-camera piece, from the area's own use) -> put it by the shot's near edge;
//   Soft things:  a.seatSoft('sofa', { tone: 'lo' | 'mid', throw: 'drape' | 'band' | false, group })  one leaning cushion per seat end and a throw dropped on the arm or folded across the seat (armchairs get one cushion);  a.table(id, { cloth: true }) puts a cloth shaped to the table.
//   a.still(topId, phrases) / a.wallArr(phrase, { wall, xc, over }): the dealt still lifes and wall arrangements as built pieces (arrange.mjs).
//   a.group(phrase, { wall, xc | at, seed, pieces: { slot: { asset, params, skip } }, hero }): builds a roll group phrase as one arrangement that passes the checks (groups.mjs lists the phrases and slots).
//   a.slots(need): prints the places (need: a width in mm or a group phrase lists only the wall slots that hold it) a group can take: wall slots '<wall>:<third>' (back | left | right | window; left | middle | right as the camera sees them) with their bare stretches, and floor slots 'floor:<band>[:<third>]' (back | middle | front) clear of the entries' corridors. a.group(phrase, { slot: 'back:right' }) and wall.place(id, asset, 'right') take a name; a slot with no room refuses and names the free ones.
//   a.dims(id): { w, d, h, asset, params, at } of a placed piece (at: world x, y, z).
//   a.topOf(id): the height of the top of something placed (its dealt h included), for y of a thing that stands on it.
//   Things on one top:  a.onTop('desk', [{ id, asset, params }, ...], { at: 'back' | 'centre' | 'front', margin: 50 })  spaces them along the top, every footprint inside its edge (refuses when they do not fit); use it instead of placing by fractions.
//   Living things:  a.alive(roll.areas[id].motion)  (after the walls: the roll's 2 or 3 kinds; refuses one whose needs the walls do not meet, e.g. a flier with no open window).  See src/motion/index.js.
//   Anywhere:  a.put(id, asset, [x, z], turn, { y, mount, group, hero, params, ... })  (the object's own origin at [x, z]; see assets.mjs).  a.view({ target, az, el }), a.shot(name, from, look, fov, group, core?)
// Every object has a `group` (its run, table set, seating group or wall arrangement) and hero: true marks the area's main piece.
import { ASSETS, SPACE } from './src/library/meta.js';
import { dealParams } from './src/library/space.js';
import { dropCloth, heightField } from './src/cloth.js';
import { createKit } from './src/kitchen3d.js';
import { restOn as geomRestOn, fits as geomFits, topAt } from './geom/place.mjs';
import { SOFT, OVERHANG_TOL, BAND } from './geom/kinds.mjs';
import { REGISTRY } from './src/library/index.js';
import { PAINTINGS } from './src/library/paintings.js';
import { fitFrame } from './src/library/artPlane.js';
import { joinAreas, seamLine, zoneList } from './openplan.mjs';
import { matePose, wallGeo, LINK_WIDTH, WALL_T } from './plan.mjs';
import { checkAlive, pickVia, MOTION } from './motion-roll.mjs';
import { sliderClear, ventZone, VENT_STYLES } from './src/motion/rules.js';
import { installDocument } from './geom/load.mjs';
import { group as runGroup, groupNeeds } from './groups.mjs';
import { STYLE, DEFAULTS } from './src/openings.js';
import { THIRD, zone, thirdSlot, slotWall, rectCut, floorBox, floorSpot, FLOOR_BANDS, FLOOR_THIRDS } from './slotmath.mjs';
import { still as runStill, wallArr as runWallArr } from './arrange.mjs';
installDocument();   // the Node canvas stand-in (geom/load.mjs), so a.onTop and the textures work in a plain Node spec
const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, r0 = (v) => Math.round(v * 10) / 10;
export const GAP = 3000;
const headLine = (o, head) => o.kind !== 'window' || o.feature || ['picture', 'pair', 'wall', 'bay'].includes(o.style) ? o : o.sill != null && o.height == null ? { ...o, height: head - o.sill } : o.height != null && o.sill == null ? { ...o, sill: head - o.height } : o;   // windows on one wall share a head height: a sill alone fixes the height, a height alone fixes the sill
export class Home {
  constructor({ seed, floor = 'auto', height = 2700, head = 2100, detached = false, blockerFade = true, shadowFade = true, supportFade = true, passageView = true, portalClip = true, keepHomeView = true, wallHang = true }) { this.blockerFade = blockerFade; this.supportFade = supportFade; this.passageView = passageView; this.portalClip = portalClip; this.keepHomeView = keepHomeView; this.wallHang = wallHang; this.shadowFade = shadowFade; this.detached = detached;   /* a regression fixture only: areas placed by hand with no way between them */ this.head = head;   /* the head height of plain windows: a window given a sill or a height gets the other from it */ if (floor === 'auto') floor = seed % 5 === 3 ? 'tiles' : 'boards'; this.linkX = {}; this.S = { units: 'mm', seed, home: { height, floor: { style: floor, seed }, tiles: { origin: [0, 0] }, walls: [], objects: [] }, areas: [] }; this.list = []; }
  // passage: { from: 'living', wall: 'right', x: 2100, via: { wall: 'left', x: 1500 } } places this area behind the arch the area `from` has on that wall (x along the wall, as in its openings), turned and moved so its own arch (on via.wall at via.x) stands on the same spot, the two rooms back to back: the glide then crosses a doorway, not a gap. Both areas give the arch to: <the other area>; check-home 'passage' compares the two ends.
  area(id, name, { O, psi = 0, rect, passage }) {
    const pl = this.plan?.areas?.[id];
    if (this.plan && !pl) throw new Error(`area('${id}') is not in the house plan (areas: ${Object.keys(this.plan.areas).join(', ')}): roll it together with the others (node roll.mjs <seed> ${[...Object.keys(this.plan.areas), id].join(' ')})`);
    if (pl && !O && !passage) {   // the plan places the area: the root at the origin, an area joined to an open room by H.join, any other back to back with the wall it is entered by
      if (!rect) throw new Error(`area('${id}'): give a rect (the plan's cell is ${pl.fit.join(' x ')} mm)`);
      if (rect[0] !== 0 || rect[1] !== 0 || rect[2] > pl.fit[0] + 1 || rect[3] > pl.fit[1] + 1) throw new Error(`area('${id}'): the rect ${JSON.stringify(rect)} must start at [0, 0] and fit the plan's cell ${pl.fit.join(' x ')} mm (the plan stood the neighbours by it)`);
      if (pl.mate) {
        const l = this.plan.links.find((q) => q.id === pl.via), key = `${l.id}:${l.a}`, x = this.linkX[key];
        if (x === undefined) throw new Error(`area('${id}'): its way in comes from '${pl.mate.from}', whose ${pl.mate.wall} wall is not built yet: build '${pl.mate.from}' first (the plan's order: ${this.plan.order.join(', ')})`);
        const len = wallGeo(pl.mate.via.wall, rect[2], rect[3]).len, vx = Math.round(l.bF * len / 10) * 10; this.linkX[`${l.id}:${id}`] = vx;
        passage = { from: pl.mate.from, wall: pl.mate.wall, x, via: { wall: pl.mate.via.wall, x: vx } };
      } else if (!pl.parent) O = [0, 0];
    }
    if (passage && !O) { const A = this.list.find((q) => q.id === passage.from), W = A && this.S.home.walls.find((w) => w.id === `${A.id}-${passage.wall}`); if (!W) throw new Error(`area('${id}'): passage.from '${passage.from}' has no ${passage.wall} wall yet (build that area's walls first)`);
      const len = Math.hypot(W.to[0] - W.from[0], W.to[1] - W.from[1]), ua = [(W.to[0] - W.from[0]) / len, (W.to[1] - W.from[1]) / len], pa = [W.from[0] + ua[0] * (len - passage.x), W.from[1] + ua[1] * (len - passage.x)], na = [ua[1], -ua[0]];   // a wall runs from its far end to the corner; the room stands on its right-hand side
      const via = passage.via || {}; if (!['back', 'left', 'right'].includes(via.wall)) throw new Error(`area('${id}'): passage.via.wall must be back, left or right`);
      const m = matePose(rect, via, pa, na); psi = m.psi; O = m.O; }
    const a = new Area(this, id, name, O || [0, 0], psi, rect);
    if (!O) { if (this.list.length) a.unplaced = true; const prev = this.list[this.list.length - 1], b = a.worldBounds(), x0 = prev ? Math.max(...this.list.map((q) => q.worldBounds().x1)) + GAP : 0; a.O = [r0(x0 - b.x0), r0(-b.z0)]; }
    this.list.push(a); return a;
  }
  // the whole roll: H.roll(rollJson) keeps what roll.mjs dealt (still-life assets, groups, plant places, passages), so the check 'rolled' can compare every dealt thing with the scene; a.skip(what, 'why') leaves one out: an asset name, 'groups', 'passage', or a plant place (sill, shelf, worktop, hanging, floor)
  roll(json) {
    const R = typeof json === 'string' ? JSON.parse(json) : json, home = this.S.home, asset = (x) => (x.match(/\(([A-Za-z]+)\)\s*$/) || [])[1], areas = {};
    for (const [id, a] of Object.entries(R.areas || {})) areas[id] = { doorOpen: Math.max(0, ...(a.openings || []).filter((o) => o.kind === 'door' && !o.style).map((o) => o.open || 0)), still: (a.still || []).flatMap((st) => st.things.map(asset).filter(Boolean)), groups: (a.groups || []).length, plantAt: a.plantAt || [], passages: (a.passages || []).length, heroWindow: !!groupNeeds(a.hero || '')?.window, hero: a.hero || '', side: a.side || null, accents: a.accents || [], foreground: a.foreground || null, signs: a.signs || [], pieces: a.pieces || [], named: [a.above, a.wallArr, a.produce, ...(a.more || [])].filter(Boolean), groupTexts: (a.groups || []).map((g) => g.replace(/ \(the hero group.*\)$/, '').replace(/, on the [^,]*(, [a-z ]*third)?$/, '')) };
    home.roll = { seed: R.seed, behind: R.openPlan?.behind || [], areas };
    if (R.openPlan?.floor) this.floorZones(R.openPlan.floor);   // one floor across the open room; its kitchen part may be tiles
    if (R.plan) { this.plan = R.plan; home.roll.plan = { ...(R.plan.noSpread ? { noSpread: true } : {}), entry: R.plan.entry, links: R.plan.links.map((l) => ({ id: l.id, a: l.a, b: l.b, kind: l.kind, tree: l.tree })), areas: Object.fromEntries(Object.entries(R.plan.areas || {}).map(([id, a]) => [id, { fit: a.fit, need: a.need }])) }; }   // the house plan (plan.mjs): compose places each area from it
    return this;
  }
  join(a, b, o) { return joinAreas(this, a, b, o); }   // open plan: b joins a on one floor (openplan.mjs): H.join(a, b, { layout: 'row' | 'corner', share: 0 to 1000 mm })
  floorZones(styles) { this.zoneStyles = styles; }   // open plan floor change: H.floorZones({ kitchen: 'tiles', dining: 'boards', living: 'boards' }) (openplan.mjs)
  sign(areaId, kind) { (this.signs ||= {})[areaId] = [...(this.signs[areaId] || []), kind]; }
  // what the page walks: every way through as a world point and the direction of travel, and the order the arrow keys follow
  planOut() {
    const links = [], wall = (id, w) => this.S.home.walls.find((q) => q.id === `${id}-${w}`);
    for (const l of this.plan?.links || []) {
      if (l.kind === 'open') { const G = (this.groups || []).find((g) => g.seams.some((q) => q.a === l.a && q.b === l.b)), sm = G?.seams.find((q) => q.a === l.a && q.b === l.b); if (!sm) continue; const sl = seamLine(this, sm); links.push({ a: l.a, b: l.b, kind: 'open', p: [r0((sl.p0[0] + sl.p1[0]) / 2), r0((sl.p0[1] + sl.p1[1]) / 2)], d: sl.normal.map((v) => r0(v)) }); continue; }
      const W = wall(l.a, l.aWall), x = this.linkX[`${l.id}:${l.a}`]; if (!W || x === undefined || (this.skippedLinks || []).includes(l.id)) continue;
      const len = Math.hypot(W.to[0] - W.from[0], W.to[1] - W.from[1]), ua = [(W.to[0] - W.from[0]) / len, (W.to[1] - W.from[1]) / len];
      links.push({ a: l.a, b: l.b, kind: l.kind, p: [r0(W.from[0] + ua[0] * (len - x)), r0(W.from[1] + ua[1] * (len - x))], d: [r0(-ua[1]), r0(ua[0])] });   // a wall's room stands on its right-hand side [ua[1], -ua[0]], so travel out of it is the other way
    }
    return links.length || this.plan ? { root: this.plan?.root, walk: this.plan?.walk, links } : undefined;
  }
  // the openings the plan puts in an area's wall: each way through the plan dealt (arch or door) stands at the same spot on both sides; compose fixes the parent's end when its wall is built and takes the child's from the mate
  planOpenings(a, wall, len, given, from, to) {
    const out = [];
    for (const l of this.plan?.links || []) { if (l.kind === 'open') continue;
      const end = l.a === a.id && l.aWall === wall ? 'a' : l.b === a.id && l.bWall === wall ? 'b' : null; if (!end) continue;
      const key = `${l.id}:${a.id}`, other = end === 'a' ? l.b : l.a; let x = this.linkX[key];
      if (x === undefined) {
        const partner = this.linkX[`${l.id}:${other}`], po = this.S.home.walls.find((w) => w.id === `${other}-${end === 'a' ? l.bWall : l.aWall}`);
        if (partner !== undefined && po) {   // a loop: the other end stands; this one lines up with it
          const pl = Math.hypot(po.to[0] - po.from[0], po.to[1] - po.from[1]), ua = [(po.to[0] - po.from[0]) / pl, (po.to[1] - po.from[1]) / pl], pt = [po.from[0] + ua[0] * (pl - partner), po.from[1] + ua[1] * (pl - partner)], me = Math.hypot(to[0] - from[0], to[1] - from[1]), um = [(to[0] - from[0]) / me, (to[1] - from[1]) / me], t = (pt[0] - from[0]) * um[0] + (pt[1] - from[1]) * um[1], off = Math.abs(Math.abs((pt[0] - from[0]) * -um[1] + (pt[1] - from[1]) * um[0]) - WALL_T);   // the other wall stands one slab away
          x = Math.round((me - t) / 10) * 10; if (off > 200 || x < l.width / 2 + 300 || x > me - l.width / 2 - 300) { console.log(off > 200 ? `plan: the loop way ${l.a} | ${l.b} is left out: the two walls no longer meet (${Math.round(off)} mm out of line); use the planned rect sizes to keep it` : `plan: the loop way ${l.a} | ${l.b} is left out: where the two walls meet it would stand at x ${x} of this ${Math.round(me)} mm wall, too near an end for a ${l.width} mm way (it needs ${Math.round(l.width / 2 + 300)} to ${Math.round(me - l.width / 2 - 300)}); use the planned rect sizes to keep it`); (this.skippedLinks ||= []).push(l.id); continue; }
        } else x = Math.round((end === 'a' ? l.aF : l.bF) * len / 10) * 10;
        this.linkX[key] = x; }
      const hit = given.find((g) => g.kind !== 'window' ? Math.abs(g.x - x) < ((g.width || 1000) + l.width) / 2 + 300 : Math.abs(g.x - x) < ((g.width || 1200) + l.width) / 2 + 300);
      if (hit) throw new Error(`${a.id}-${wall}: the plan's ${l.kind} to ${other} stands at x ${x} (${l.width} wide); your ${hit.kind} at x ${hit.x} is too close: keep 300 mm clear beside it and move yours`);
      out.push({ kind: l.kind, ...(l.kind === 'arch' && l.style ? { style: l.style } : {}), x, width: l.width, to: other });
    }
    return out;
  }
  write(file, fs) {
    for (const a of this.list) if (a.unplaced && !this.detached) throw new Error(`area '${a.id}' has no place: the plan puts it ${this.plan ? `(H.join it to its neighbour in the open room, or use the plan's order: ${this.plan.order.join(', ')})` : 'by H.roll(...) of a roll with a plan, or by passage / O / H.join'}`);
    for (const l of this.plan?.links || []) if (l.kind !== 'open' && !(this.skippedLinks || []).includes(l.id)) for (const [id, w] of [[l.a, l.aWall], [l.b, l.bWall]]) if (this.linkX[`${l.id}:${id}`] === undefined) throw new Error(`the plan's way ${l.a} | ${l.b} needs the ${w} wall of '${id}': build it (a.${w}(...)) and give '${id}' its rect`);
    { const fp = this.list.map((a) => { const [x0, z0, x1, z1] = a.rect, q = [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].map((p) => a.P(p)); return { a, x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), z0: Math.min(...q.map((p) => p[1])), z1: Math.max(...q.map((p) => p[1])) }; });
      for (let i = 0; i < fp.length; i++) for (let j = i + 1; j < fp.length; j++) { const A = fp[i], B = fp[j]; if (A.a.planGroup && A.a.planGroup === B.a.planGroup) continue; const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oz = Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0); if (ox > 100 && oz > 100) throw new Error(`areas '${A.a.id}' and '${B.a.id}' overlap by ${Math.round(ox)} x ${Math.round(oz)} mm and are not in one open room: shrink a rect (the plan keeps rooms apart; see the plan's cells)`); } }
    for (const l of this.plan?.links || []) if ((this.skippedLinks || []).includes(l.id)) for (const [id, w, o] of [[l.a, l.aWall, l.b], [l.b, l.bWall, l.a]]) { const W = this.S.home.walls.find((q) => q.id === `${id}-${w}`); if (W) W.openings = W.openings.filter((q) => q.to !== o); }   // a loop left out at one end is left out at both
    if (this.S.home.roll?.plan && this.skippedLinks) this.S.home.roll.plan.links = this.S.home.roll.plan.links.filter((l) => !this.skippedLinks.includes(l.id));
    this.S.home.plan = this.planOut(); if (this.detached) this.S.home.detached = true; if (!this.blockerFade) this.S.home.blockerFade = false; if (!this.shadowFade) this.S.home.shadowFade = false; if (!this.supportFade) this.S.home.supportFade = false; if (!this.passageView) this.S.home.passageView = false; if (!this.portalClip) this.S.home.portalClip = false; if (!this.keepHomeView) this.S.home.keepHomeView = false; if (!this.wallHang) this.S.home.wallHang = false;   // a regression fixture only: the fade of what blocks the view switched off
    for (const a of this.list) { const objs = this.S.home.objects.filter((o) => o.id.startsWith(a.id + '-')), runs = objs.filter((o) => o.asset === 'baseRun').map((r) => { const W = (r.params?.modules || []).reduce((q, m) => q + (m.w || 0), 0), D = r.params?.depth || 600, t = rad(r.turn || 0), P = (lx, lz) => [r.at[0] + lx * Math.cos(t) + lz * Math.sin(t), r.at[2] - lx * Math.sin(t) + lz * Math.cos(t)], c = [P(0, 0), P(W, 0), P(0, -D), P(W, -D)]; return { x0: Math.min(...c.map((q) => q[0])), x1: Math.max(...c.map((q) => q[0])), z0: Math.min(...c.map((q) => q[1])), z1: Math.max(...c.map((q) => q[1])) }; });
      const bar = objs.filter((o) => o.asset === 'stool' && runs.some((r) => Math.hypot(Math.max(r.x0 - o.at[0], o.at[0] - r.x1, 0), Math.max(r.z0 - o.at[2], o.at[2] - r.z1, 0)) <= 500)); if (bar.length) { for (const o of bar) { if ((o.params?.form ?? 0) !== 0 || (o.params?.h ?? 650) !== 650) console.log(`${o.id}: a stool at a run or island is a counter-height bar stool (form 0, seat 650): it was form ${o.params?.form ?? 0}, seat ${o.params?.h ?? 650}`); o.params = { ...(o.params || {}), form: 0, h: 650 }; } } }   // stools within 500 of a run or island (their middle, the check measures 400 from their edge): one form, counter height
    for (const a of this.list) { const own = this.S.home.objects.filter((o) => o.area === a.id || o.id.startsWith(a.id + '-')).filter((o) => (o.mount || ASSETS[o.asset]?.mount) === 'floor' && !/^(curtain|scuff|leaf|rug|heightChart|baseRun|wallRun)$/.test(o.asset)); if (!own.length) continue;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const o of own) { let sz; try { sz = sizeOf(o.asset, o.params || {}); } catch { continue; } const t = rad((o.turn || 0) + a.psi), hx = Math.abs(Math.cos(t)) * sz.w / 2 + Math.abs(Math.sin(t)) * sz.d / 2, hz = Math.abs(Math.sin(t)) * sz.w / 2 + Math.abs(Math.cos(t)) * sz.d / 2; x0 = Math.min(x0, o.at[0] - hx); x1 = Math.max(x1, o.at[0] + hx); z0 = Math.min(z0, o.at[2] - hz); z1 = Math.max(z1, o.at[2] + hz); }
      const b = a.worldBounds(); console.log(`area ${a.id}: the free-standing floor pieces (no runs) fit in ${Math.round(x1 - x0)} x ${Math.round(z1 - z0)} mm (about); the rect is ${Math.round(b.x1 - b.x0)} x ${Math.round(b.z1 - b.z0)} mm: a rect much larger than its groups reads as an empty room`); }   // the smallest rect that holds the placed groups, next to the declared one
    this.S.areas = this.list.map((a) => a.out()); { const z = zoneList(this); if (z) this.S.home.floor.zones = z.map(({ area, ...q }) => q); } if (this.groups) this.S.groups = this.groups.map((g) => ({ id: g.id, areas: g.areas, seams: g.seams.map((q) => seamLine(this, q)) })); if (this.signs) for (const [a, k] of Object.entries(this.signs)) console.log(`signs ${a}: ${k.join(', ')}`); fs.writeFileSync(file, JSON.stringify(this.S, null, 1)); return this.S; }
}
const pickForm = (h, asset, params) => {   // the next form of an asset that has several (started from the seed); an explicit params.form stays
  if (!ASSETS[asset].variants || params?.form !== undefined) return params;
  const c = (h.counts ||= {}), V = ASSETS[asset].variants; return { ...(params || {}), form: (ASSETS[asset].formFrom || 0) + (c[asset] = (c[asset] ?? h.S.seed % V) + 1) % V };   // formFrom: the first dealt form (a picture deals only the classic paintings, forms 4 and up)
};
const LIGHTS = /^(bedsideLamp|wallSconce|pendantLamp|tableLamp|taskLamp|readingLamp|floorLamp)$/;
const vary = (h, asset, params, areaId = '') => {
  if (LIGHTS.test(asset) && params?.pair === undefined) params = { ...(params || {}), pair: '*' };   // round 4 U10: one type per light in an area: every bedside lamp, sconce or pendant of the area takes the first one's form
  if (params?.pair !== undefined && params.pair !== false) { const { pair, ...rest } = params, m = (h.pairs ||= {}), k = `${areaId}/${pair}/${asset}`; return m[k] ? { ...m[k], ...rest } : (m[k] = vary(h, asset, { ...rest, pair: false }, areaId)); }
  if (params && 'pair' in params) { const { pair, ...rest } = params; params = rest; }   // params.pair: the two sides of a bed or sofa name one pair and take one seed (the first deal), so their forms and finishes match
  let p = pickForm(h, asset, params);
  const named = ['rug', 'table', 'sideboard', 'bench'].includes(asset) ? [...new Set(SPACE[asset]?.form)] : null;   // named forms (rug, table, sideboard, bench): the next one in turn, so two of them in a home differ
  if (named && asset !== 'chair' && p?.form === undefined) { const c = (h.counts ||= {}); p = { ...(p || {}), form: named[(c['f-' + asset] = (c['f-' + asset] ?? h.S.seed) + 1) % named.length] }; }
  if (asset === 'basket' && p?.form === 2 && !/bed|bath/.test(areaId)) p = { ...p, form: h.S.seed % 2 };   // the tall lidded hamper is laundry: a bedroom or bathroom thing
  return dealParams(h, asset, p);
};   // a form for assets with forms, then every unset parameter of the asset's space, from the home's seed
const sizeOf = (asset, params = {}) => {
  const m = ASSETS[asset]; if (!m) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
  let [w, d, h] = m.size;
  if (params.r) w = d = 2 * params.r; else { w = params.w ?? w; d = params.d ?? params.depth ?? d; }
  if (asset === 'baseRun' || asset === 'wallRun') w = params.length ?? (params.modules || []).reduce((s, x) => s + x.w, 0);
  if (m.formSizes && params.form !== undefined) [w, d, h] = m.formSizes[params.form];
  if (asset === 'bed') { w = (params.w ?? 1600) + (params.frame === 'platform' ? 260 : 60); d = (params.l ?? 2100) + (params.frame === 'platform' ? 100 : 0); h = 300 + (params.head ?? 1000); /* round 6 item 15: the dealt headboard, not the asset's default 1300 */ }
  return { w, d, h, m };
};
class Area {
  constructor(h, id, name, O, psi, rect) { Object.assign(this, { h, id, name, O, psi, rect, cam: {}, shots: [], backLen: 0, top: 2500 }); }
  get c() { return Math.cos(rad(this.psi)); } get s() { return Math.sin(rad(this.psi)); }
  P([x, z]) { return [r0(this.O[0] + x * this.c - z * this.s), r0(this.O[1] + x * this.s + z * this.c)]; }
  P3([x, y, z]) { const p = this.P([x, z]); return [p[0], y, p[1]]; }
  worldBounds() {   // the floor the area owns, grown to hold its own walls (an angled wall reaches past the rect)
    const [x0, z0, x1, z1] = this.rect, q = [[x0, z0], [x1, z1], [x0, z1], [x1, z0]].map((p) => this.P(p));
    for (const W of this.h.S.home.walls) if (W.id.startsWith(this.id + '-')) q.push(W.from, W.to);
    return { x0: Math.min(...q.map((p) => p[0])), x1: Math.max(...q.map((p) => p[0])), z0: Math.min(...q.map((p) => p[1])), z1: Math.max(...q.map((p) => p[1])) };
  }
  // ---- walls
  back(len, openings = [], at = [0, 0]) { this.backLen = len; this.backAt = at; return this.wall('back', at, 0, len, openings); }
  left(len, openings = [], angle = 90) { const k = 180 - angle, to = this.backAt || [0, 0]; return this.wall('left', [to[0] - Math.cos(rad(-k)) * len, to[1] - Math.sin(rad(-k)) * len], -k, len, openings); }
  right(len, openings = [], angle = 90) { const k = 180 - angle, b = this.backAt || [0, 0]; return this.wall('right', [b[0] + this.backLen, b[1]], k, len, openings); }
  floorWall(at, len, depth) {   // a line on the open floor that a wall group can stand along: a group floating in the room is the same recipe against a wall that is not there (nothing is built for it)
    const [x0, z0] = this.rect, z = Math.max(at[1] - depth / 2, z0 + 900); return this.wall(`float${this._float = (this._float || 0) + 1}`, [at[0] - len / 2, z], 0, len, [], true);
  }
  wall(id, [x, z], phi, len, openings = [], virtual = false) {
    const p = this, to = p.P([x, z]), ph = rad(phi + p.psi), r = [Math.cos(ph), Math.sin(ph)];
    const from = [r0(to[0] + r[0] * len), r0(to[1] + r[1] * len)];
    if (!virtual) openings = [...openings, ...p.h.planOpenings(p, id, len, openings, from, to)];
    if (!virtual) p.h.S.home.walls.push({ id: `${p.id}-${id}`, from, to, openings: openings.map(({ x: ox, ...o }) => ({ ...headLine(o, p.h.head), at: len - ox })) });
    let taken = [];
    const F = {
      id, len, phi, openings, get taken() { return taken; },
      at: (ox, off = 0) => [x + Math.cos(rad(phi)) * ox - Math.sin(rad(phi)) * off, z + Math.sin(rad(phi)) * ox + Math.cos(rad(phi)) * off],   // the local point
      put(oid, asset, ox, off, { turn = 0, ...o } = {}) { return p.put(oid, asset, F.at(ox, off), -phi + turn, o); },   // turn is added to the facing out from the wall (it never reaches the object as its own `turn`)   // low level: the object's origin at ox along, off out
      onSill(oid, asset, xc, o = {}) {   // a pot or small thing on a window's sill: xc is its middle along the wall (it must lie within a window of this wall); stands at the sill's height + 30 mm
        const W = openings.find((q) => q.kind === 'window' && Math.abs(q.x - xc) <= q.width / 2 - 40); if (!W) throw new Error(`onSill('${oid}'): xc ${xc} is not over a window of this wall`);
        if (W.sash === undefined && !['picture', 'wall', 'bay'].includes(W.style)) { W.sash = 'out'; const wo = p.h.S.home.walls.find((w) => w.id === `${p.id}-${id}`)?.openings.find((q) => Math.abs(q.at - (len - W.x)) < 1); if (wo) wo.sash = 'out'; console.log(`onSill('${oid}'): the window on ${p.id}-${id} at ${W.x} opened inward and would sweep the pot: it now opens outward (sash: 'out'); say sash: 'fixed' to keep it shut`); }   // a pot on an inward window's sill: the window opens outward instead of being fixed
        if (VENT_STYLES.includes(W.style) && W.sash !== 'fixed' && W.sash !== 'out') { const [z0, z1] = ventZone(W), lo = W.x - z1 - 110, hi = W.x - z0 + 110;   // the vent leaf swings inward over its own width: nothing stands under it (a pot 220 mm wide)
          if (xc > lo && xc < hi) throw new Error(`onSill('${oid}'): the window's vent leaf swings into the room over x ${Math.round(lo + 110)} to ${Math.round(hi - 110)} and would sweep a pot at ${xc}; stand it beside the vent (x below ${Math.round(lo)} or above ${Math.round(hi)}), or give the window sash: 'out' or 'fixed'`); }
        const prm = vary(p.h, asset, o.params, p.id), pd = Math.min(sizeOf(asset, prm).d, o.potD ?? 100);   // the pot, not the leaves: a plant's footprint counts its spread, the sill carries only the pot (potD, 100 mm unless said)
        return F.place(oid, asset, xc, { ...o, params: prm, y: (W.sill ?? 1000) + 30, mount: 'on', onSill: true, off: o.off ?? 110 - pd / 2 + 15 });   // the pot's front stands 15 mm past the sill's front lip so its leaves clear the sash (the sill reaches 110 mm into the room): centred on the free depth, not on the lip
      },
      dress(oid, kind, at, o = {}) {   // round 6 B7, B13: hang a blind or curtain ON an opening of this wall: F.dress('bblind', 'blind', opening) or F.dress('lcurt', 'curtain', 1700); `at` is the opening object from this wall's list, its x, or its index (left out when the wall has one candidate). It takes the opening's middle, width and height: nothing is guessed by hand
        if (kind !== 'blind' && kind !== 'curtain') throw new Error(`dress('${oid}'): kind is 'blind' or 'curtain', not '${kind}'`);
        const cand = openings.filter((q) => (kind === 'blind' ? q.kind === 'window' : q.kind === 'window' || (q.kind === 'door' && (q.style === 'slider' || q.style === 'french' || !q.to)))), W = typeof at === 'number' && at < openings.length && !openings.some((q) => q.x === at) ? openings[at] : typeof at === 'number' ? openings.find((q) => q.x === at) : at ?? (cand.length === 1 ? cand[0] : undefined);
        if (!W || !openings.includes(W)) throw new Error(`dress('${oid}', '${kind}'): name the opening it hangs on (an opening of this wall, its x or its index): ${cand.map((q) => `${q.kind} at x ${q.x}`).join('; ') || 'this wall has no ' + (kind === 'blind' ? 'window' : 'window or door')}`);
        const D = DEFAULTS[W.kind] || {}, SD = STYLE[W.style] || {}, hw = W.width ?? SD.width ?? D.width ?? 900, sill = W.sill ?? SD.sill ?? D.sill ?? 0, ht = W.height ?? (W.sill != null && W.kind === 'window' ? p.h.head - W.sill : null) ?? SD.height ?? D.height ?? 1100;
        if (kind === 'blind') return F.place(oid, 'blind', W.x, { overlap: true, ...o, y: sill, params: { ...o.params, w: o.params?.w ?? hw + 160, h: o.params?.h ?? ht } });   // the blind's end brackets stand 14 mm outside its width: 80 mm more each side clears the window's casing; the blind's origin is the window's bottom: its h is the window's height, so its top stands 50 mm over the head
        const w = o.params?.w ?? hw + 300, h = o.params?.h ?? Math.min(2300, sill + ht + 200);   // a curtain reaches 150 past each side of the opening; its rail stands 200 over the head
        return F.place(oid, 'curtain', W.x, { overlap: true, ...o, params: { panels: 2, ...o.params, w, h } });
      },
      place(oid, asset, xc, o = {}) {   // by the asset's own origin and size: xc is its middle along the wall, or a slot name from a.slots() ('right', 'middle', 'back:left')
        if (typeof xc === 'string') xc = p.slotOnWall(F, xc, oid, sizeOf(asset, o.params || {}).w);
        if (asset === 'windowSeat') { const W = openings.find((q) => q.kind === 'window' && Math.abs(q.x - xc) <= q.width / 2 + 300); if (W) { const h = o.params?.h ?? Math.min(480, Math.max(400, (W.sill ?? 1000) - 130)); o = { ...o, params: { ...o.params, h, pillowMax: (W.sill ?? 1000) - (h + 70) - 30 }, }; } }   // under a window the seat is as tall as the sill allows (its cushion top within 100 of the sill: a sill of 530-610 fits h 400-480; a higher sill leaves a gap the placement check names)
        o = { ...o, params: vary(p.h, asset, o.params, p.id) }; const { w, d, h, m } = sizeOf(asset, o.params), mount = o.mount || m.mount; if (o.y === undefined && m.y === 'top') throw new Error(`place('${oid}', '${asset}'): give y, the height of the surface it stands on in mm (for example y: 520 on a bedside table, 740 on a desk)`); let y = o.y ?? (typeof m.y === 'number' ? m.y : 0); if (o.y === undefined && /^(picture|galleryWall|mirror)$/.test(asset)) { const top = Math.max(0, ...taken.filter((t) => t.y[0] < 60 && Math.min(t.x[1], xc + w / 2) - Math.max(t.x[0], xc - w / 2) > 50).map((t) => t.y[1])); y = top > 0 ? top + 150 : Math.round(1500 - (h ?? 800) / 2); }   /* round 4 U8: art with no y hangs 150 mm above the piece below it; on open wall its middle stands at 1500 (placement rule 2) */
        const backOf = () => { const kit = (p.h.kit ||= createKit()), key = asset + JSON.stringify(o.params || {}), cache = (p.h.backCache ||= {}); if (cache[key] === undefined) { const g = REGISTRY[asset](kit, { ...(o.params || {}) }); g.updateMatrixWorld(true); cache[key] = Math.max(0, -new kit.THREE.Box3().setFromObject(g).min.z); } return cache[key]; };   // the model's own back, measured: a cornice or a rolled arm stands further out than the table size says
        const sillWin = (asset === 'curtain' || asset === 'blind') && o.off === undefined ? openings.find((q) => q.kind === 'window' && (q.sill ?? 1000) >= 300 && Math.abs(q.x - xc) <= (q.width + w) / 2) : null;   // a curtain at a sill window hangs in front of the sill's lip (the sill reaches 110 mm into the room): the curtain model's back stands 60 mm out of its origin, so 60 mm off the wall puts it 10 mm past the lip
        const off = o.off ?? (sillWin ? (asset === 'blind' ? 0 : 60) : m.origin === 'centre' ? Math.max(d / 2, backOf()) : m.origin === 'front-left' ? (o.depth ?? d) : m.origin === 'front-centre' ? (o.depth ?? 600) : 0);
        if ((id === 'left' || id === 'right') && mount === 'floor' && (h ?? 0) > 1500 && !o.anywhere) { const gapBack = id === 'left' ? len - (xc + w / 2) : xc - w / 2; if (gapBack > 1000) throw new Error(`place('${oid}', '${asset}', ${xc}): a piece over 1500 tall on a side wall stands at its far end (within 1000 mm of the back wall: xc ${id === 'left' ? len - 1000 - w / 2 : 1000 + w / 2} ${id === 'left' ? 'or more' : 'or less'}): in the middle of the side wall it hides what stands behind it from the home view (pass anywhere: true to place it there on purpose)`); }   // round 6 E4: tall pieces go to the far end of a side wall
        if (!virtual && !o.anywhere && !['curtain', 'blind'].includes(asset)) { const ext = Math.abs((o.turn || 0) % 180) === 90 ? d : w, past = Math.max(-(xc - ext / 2), xc + ext / 2 - len); if (past > 100) { if (ext > len) throw new Error(`place('${oid}', '${asset}', ${xc}): the piece is ${Math.round(ext)} mm wide and the wall runs 0 to ${len}: it cannot stand on this wall`); const to = xc - ext / 2 < 0 ? ext / 2 : len - ext / 2; console.log(`place('${oid}', '${asset}'): xc ${xc} reached ${Math.round(past)} mm past the end of the wall (0 to ${len}); pulled back to ${Math.round(to)} so it stands inside it (anywhere: true keeps the spot)`); xc = Math.round(to); } }   // round 6 B9: place refuses a spot past a wall's end (a hanging plant at the very end of a 2200 wall stood half in the corner wall)
        { const bx = [xc - w / 2, xc + w / 2], by = [y ?? 0, (y ?? 0) + (h ?? 0)], bd = [Math.max(0, off - (m.origin === 'centre' ? d / 2 : 0)), Math.max(0, off - (m.origin === 'centre' ? d / 2 : 0)) + d]; (taken ||= []);   // round 4 G6: a piece never lands inside another on the same wall
          const hit = taken.find((t) => Math.min(t.x[1], bx[1]) - Math.max(t.x[0], bx[0]) > 30 && Math.min(t.y[1], by[1]) - Math.max(t.y[0], by[0]) > 30 && Math.min(t.d[1], bd[1]) - Math.max(t.d[0], bd[0]) > 30);
          if (hit && !o.overlap) throw new Error(`place('${oid}', '${asset}', ${xc}): lands inside '${hit.id}' (${hit.asset}) on the same wall: x ${Math.round(hit.x[0])} to ${Math.round(hit.x[1])} is taken at that height; move it along the wall or give it a y above it (x runs as the plan in the header shows)`);
          taken.push({ id: oid, asset, x: bx, y: by, d: bd }); }
        const ox = m.origin === 'front-left' ? xc - w / 2 : xc;
        if (asset === 'curtain') (p.h.curtainRecs ||= []).push({ area: p.id, wall: `${p.id}-${id}`, id: `${p.id}-${oid}`, xc });   // motion: alive() checks that no panel stands across the way a flier comes in
        const res = F.put(oid, asset, ox, off, { ...o, y, mount });
        return res;
      },
    };
    if (!virtual) (p.walls ||= {})[id] = F;
    return F;
  }
  put(id, asset, [x, z], turn = 0, { y = 0, mount, group, hero, params, ...rest } = {}) {
    if (!ASSETS[asset]) throw new Error(`unknown asset "${asset}"; node assets.mjs lists them`);
    if (asset === 'picture' && (mount || ASSETS[asset].mount) !== 'wall') throw new Error(`object "${id}": a picture hangs on a wall; a photo that stands on a chest or shelf is the photoFrame asset (it has a stand-leg)`);   // round 6 item 10
    if (!group) throw new Error(`object "${id}" needs a group (its run, table set, seating group ...)`);
    params = vary(this.h, asset, params, this.id);
    const SIGN = { mug: 'mug', openBook: 'book face down', scuff: 'scuffed floor', leaf: 'fallen leaf', heightChart: 'height chart', foldedThrow: 'folded throw', cloth: 'cloth dropped', shoes: 'shoes askew', tablecloth: 'tablecloth', tableRunner: 'table runner', scratches: 'sofa scratches', glassesBook: 'glasses on book', clothesChair: 'clothes on chair' };
    if (SIGN[asset]) this.h.sign(this.id, SIGN[asset]); if (params?.ajar) this.h.sign(this.id, 'drawer ajar'); if (asset === 'bed' && params?.duvet === 'unmade') this.h.sign(this.id, 'unmade bed'); if (asset === 'cushion' && params?.crease === 'soft') this.h.sign(this.id, 'pillow creased');
    const [wx, wz] = this.P([x, z]);
    this.h.S.home.objects.push({ id: `${this.id}-${id}`, asset, at: [wx, y, wz], ...(turn - this.psi ? { turn: r0(turn - this.psi) } : {}), mount: mount || ASSETS[asset].mount, ...(params ? { params } : {}), group: `${this.id}:${group}`, ...(hero ? { hero: true } : {}), area: this.id, ...rest });
  }
  thingTris(asset, params) {   // a thing's triangles in its own frame (origin at its placed point), for geom.restOn / geom.fits
    const kit = (this.h.kit ||= createKit()), g = REGISTRY[asset](kit, { ...(params || {}) }), tris = [], a = new kit.THREE.Vector3(), b = new kit.THREE.Vector3(), c = new kit.THREE.Vector3(); g.updateMatrixWorld(true);
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; const p = o.geometry.attributes.position, ix = o.geometry.index;
      for (let t = 0, n = ix ? ix.count : p.count; t < n; t += 3) { const [i, j, k] = ix ? [ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)] : [t, t + 1, t + 2]; a.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(p, j).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld); tris.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]); } });
    return tris;
  }
  // the geometry core decides the height and the overhang: the thing's base must rest on real surface (at least 85% of it), else the call refuses
  settleOn(label, id, asset, tris, params, [px, pz], turn) {
    const thing = this.thingTris(asset, params), y = geomRestOn(tris, thing, [px, pz], turn), share = geomFits(tris, thing, [px, pz], turn, { tol: SOFT.test(asset) ? BAND.soft : BAND.hard });
    if (share < 1 - OVERHANG_TOL) throw new Error(`${label}('${id}'): only ${Math.round(share * 100)}% of the ${asset} base would lie over the surface (it needs ${Math.round(100 - 100 * OVERHANG_TOL)}%): move it inward (at or dx/dz), or use a smaller piece`);
    return Math.round(y);
  }
  targetTris(label, targetId) {   // the triangles of a placed thing in this area's frame, for resting things on it
    const T = (this.h.kit ||= createKit()).THREE, tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`);
    if (!tgt) throw new Error(`${label}('${targetId}'): place the target first`);
    const mk = (o, rot) => { const g = REGISTRY[o.asset](this.h.kit, { ...(o.params || {}) }); g.rotation.y = rot * Math.PI / 180; g.position.set(...o.at); g.updateMatrixWorld(true); return g; };
    const tg = mk(tgt, tgt.turn || 0), cm = new T.Matrix4().compose(new T.Vector3(...this.P([0, 0]).flatMap((v, i) => i ? [0, v] : [v])), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -rad(this.psi)), new T.Vector3(1, 1, 1)), inv = cm.clone().invert(), boxes = [], bb = new T.Box3();
    const tris = [], va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), all = new T.Box3();
    tg.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || this.h.kit.hulls.includes(o.material) || o.material === this.h.kit.depth) return; const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), g = o.geometry, p = g.attributes.position, ix = g.index;
      for (let t = 0, n = ix ? ix.count : p.count; t < n; t += 3) { const [a, b, cc] = ix ? [ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)] : [t, t + 1, t + 2]; va.fromBufferAttribute(p, a).applyMatrix4(m); vb.fromBufferAttribute(p, b).applyMatrix4(m); vc.fromBufferAttribute(p, cc).applyMatrix4(m); tris.push([va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z]); all.expandByPoint(va).expandByPoint(vb).expandByPoint(vc); } });
    return { T, tris, all };
  }
  // a cloth dropped onto a placed thing and frozen (verlet, at spec time): a.drapeOver('throw', 'sofa', { w: 1300, d: 900, at: [x, z] (area frame) or dx/dz from the target's middle, spin (deg), tone, group, rear (mm hung behind the ridge of the thing: a coat over a chair back; use d about twice that, wave 0, bridge 440), wave (mm of start ripple; 0 keeps the cloth its full size, the default 40 lets it bunch), bridge (mm: the cloth spans gaps this narrow, e.g. 440 for a slatted chair back) })
  drapeOver(id, targetId, { w = 1200, d = 900, at, dx = 0, dz = 0, spin = 0, tone = 'lo', group, thick = 6, seed, nx = 26, ny = 26, mount = 'on', y = 0, bridge = 0, wave, rear } = {}) {
    const { T, tris, all } = this.targetTris('drapeOver', targetId), hf0 = heightField(tris, 20, bridge);
    const c = all.getCenter(new T.Vector3());
    let hang = {};   // rear: the cloth is hung over the highest ridge of the thing (a chair back): `rear` mm hang behind it, the rest falls toward the middle
    if (rear) {
      const top = hf0.top, hb = new T.Box3(); for (const t of tris) if (Math.max(t[1], t[4], t[7]) >= top - 60) for (let k = 0; k < 9; k += 3) hb.expandByPoint(new T.Vector3(t[k], t[k + 1], t[k + 2]));
      const rc = hb.getCenter(new T.Vector3()); let ux = rc.x - c.x, uz = rc.z - c.z; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const out = Math.abs(ux) * (all.max.x - all.min.x) / 2 + Math.abs(uz) * (all.max.z - all.min.z) / 2 + 14 - ((rc.x - c.x) * ux + (rc.z - c.z) * uz);   // from the ridge to just clear of the whole thing
      hang = { boxes: [[hb.min.x, Math.max(0, hb.min.y), hb.min.z, hb.max.x, hb.max.y, hb.max.z]], at: [rc.x, rc.z], init: (u, v) => {
        const t = (v + d / 2) - rear;
        if (t < 0) { const e = out * Math.min(1, -t / 60); return [rc.x + ux * e - uz * u, top + 8 + t, rc.z + uz * e + ux * u]; }
        const px = rc.x - ux * (10 + t * 0.6) - uz * u, pz = rc.z - uz * (10 + t * 0.6) + ux * u;
        return [px, Math.max(hf0(px, pz) + 12, top + 8 - t * 1.2), pz];
      } };
    }
    const res = dropCloth({ height: hf0, at: at || [c.x + dx, c.z + dz], w, d, nx, ny, ...hang, ...(wave === undefined ? {} : { wave }), spin: rad(spin), seed: seed ?? this.h.S.seed + id.length });
    { const hh = res.pts.filter((_, i) => i % 3 === 1); if (!rear && hh.filter((v) => v > 150).length < hh.length * 0.5) throw new Error(`drapeOver('${id}'): the cloth slid off '${targetId}' onto the floor: put it nearer the middle of the seat or bed (dx/dz), or make it larger`); }
    { const hf = res.pts.filter((_, i) => i % 3 === 1), tops = hf0; if (Math.max(...hf) > tops.top + 40) throw new Error(`drapeOver('${id}'): the cloth rests ${Math.round(Math.max(...hf) - tops.top)} mm above the top of '${targetId}': move it (at or dx/dz) onto the seat, arm or bed, not the back`); }
    this.put(id, 'cloth', [0, 0], 0, { group, y, mount, params: { nx, ny, pts: res.pts, thick, tone } });
  }
  // round 6 B19: a pan or moka pot that lands over a hob moves to the nearest free burner centre (the check 'overhangs' wants it within 60 mm): the burners are at (225|675, -200|-440) from the hob's front-left origin (src/kitchen/hob.js), in this area's frame
  burnerSnap(asset, [px, pz], used = []) {
    if (!/^(mokaPot|pan)$/.test(asset)) return [px, pz];
    const c = Math.cos(rad(this.psi)), s = Math.sin(rad(this.psi)); let best = null;
    used = [...used, ...this.h.S.home.objects.filter((q) => /^(mokaPot|pan)$/.test(q.asset) && q.area === this.id).map((q) => { const X = q.at[0] - this.O[0], Z = q.at[2] - this.O[1]; return [X * c + Z * s, -X * s + Z * c]; })];   // a pot already on a burner keeps it
    for (const h of this.h.S.home.objects.filter((q) => q.asset === 'hob' && q.area === this.id)) {
      const th = rad(h.turn || 0);
      for (const [x, z] of [[225, -200], [675, -200], [225, -440], [675, -440]]) { const X = h.at[0] + x * Math.cos(th) + z * Math.sin(th) - this.O[0], Z = h.at[2] - x * Math.sin(th) + z * Math.cos(th) - this.O[1], q = [X * c + Z * s, -X * s + Z * c], d = Math.hypot(q[0] - px, q[1] - pz); if (d < 350 && !used.some((u) => Math.hypot(u[0] - q[0], u[1] - q[1]) < 150) && (!best || d < best.d)) best = { d, q }; }
    }
    return best ? best.q.map(Math.round) : [px, pz];
  }
  // spaced things on one top: a.onTop('desk', [{ id: 'lamp', asset: 'lamp' }, { id: 'books', asset: 'bookStack', params }, ...], { at: 'back' | 'centre' | 'front', margin: 50, group, turn })
  // lays the things in a row along the longer side of the top, in the order given, with equal gaps of at least `margin` mm between them and the edges, every footprint inside the edge; 'back' is the side nearer the area's back wall (lower z). It refuses with the length it needs when they do not fit.
  onTop(surfaceId, things, { at = 'centre', margin = 50, group, turn = 0 } = {}) {
    const { tris, all } = this.targetTris('onTop', surfaceId), x0 = all.min.x, x1 = all.max.x, z0 = all.min.z, z1 = all.max.z, alongX = (x1 - x0) >= (z1 - z0), L = alongX ? x1 - x0 : z1 - z0, W = alongX ? z1 - z0 : x1 - x0;
    const grp = group || this.h.S.home.objects.find((q) => q.id === `${this.id}-${surfaceId}`)?.group.split(':')[1];
    const items = things.map((t) => { const params = vary(this.h, t.asset, t.params, this.id), { w, d } = sizeOf(t.asset, params); return { ...t, params, a: alongX ? w : d, b: alongX ? d : w }; });
    const need = items.reduce((q, i) => q + i.a, 0) + (items.length + 1) * margin;
    if (need > L) throw new Error(`onTop('${surfaceId}'): the things need ${Math.round(need)} mm along the top and it is ${Math.round(L)} mm long: drop one or use a smaller piece`);
    const deep = items.find((i) => i.b + 2 * margin > W); if (deep) throw new Error(`onTop('${surfaceId}'): '${deep.id}' is ${Math.round(deep.b)} mm deep and the top is ${Math.round(W)} mm: it would hang over the edge`);
    const gap = (L - items.reduce((q, i) => q + i.a, 0)) / (items.length + 1); let p = (alongX ? x0 : z0) + gap; const taken0 = [];
    for (const i of items) {
      const along = p + i.a / 2, perp = at === 'back' ? (alongX ? z0 : x0) + margin + i.b / 2 : at === 'front' ? (alongX ? z1 : x1) - margin - i.b / 2 : (alongX ? (z0 + z1) / 2 : (x0 + x1) / 2), [px, pz] = alongX ? [along, perp] : [perp, along];
      const [bx, bz] = this.burnerSnap(i.asset, [px, pz], taken0), snapped = bx !== px || bz !== pz, y = snapped ? 940 : this.settleOn('onTop', i.id, i.asset, tris, i.params, [bx, bz], i.turn ?? turn);   // on a burner it stands on the grate: 940, as R.on(hob, pan) puts it
      taken0.push([bx, bz]);
      this.put(i.id, i.asset, [bx, bz], i.turn ?? turn, { y, mount: 'on', group: i.group || grp, params: i.params, ...(i.hero ? { hero: true } : {}) });
      p += i.a + gap;
    }
  }
  // a folded throw laid across a placed thing: layers stacked like a folded blanket, resting on the highest point under it. a.bandOn('throw', 'bed', { w: 1500, d: 380, at: [x, z] or dx/dz, layers: 3, tone, group })
  bandOn(id, targetId, { w = 1400, d = 380, at, dx = 0, dz = 0, layers = 3, tone = 'lo', group, spin = 0 } = {}) {
    const { tris, all, T } = this.targetTris('bandOn', targetId), f = heightField(tris), c = all.getCenter(new T.Vector3()), p0 = at || [c.x + dx, c.z + dz], sr = rad(spin), cs = Math.cos(sr), sn = Math.sin(sr);
    const flat = (q) => { const hs = []; for (let a = -w / 2; a <= w / 2; a += 40) for (let b = -d / 2; b <= d / 2; b += 40) hs.push(f(q[0] + a * cs + b * sn, q[1] - a * sn + b * cs)); const top = Math.max(...hs); return { top, share: top > 0 ? hs.filter((h) => h > top - 30).length / hs.length : 0 }; };   // the share of the throw's footprint that rests on the highest flat patch
    let p = p0, best = flat(p0);
    if (best.share < 1 - OVERHANG_TOL) { const R = Math.max(w, d), cand = []; for (let a = -R; a <= R; a += 40) for (let b = -R; b <= R; b += 40) cand.push([p0[0] + a, p0[1] + b, Math.hypot(a, b)]); cand.sort((u, v) => u[2] - v[2]); const hit = cand.find((q) => flat(q).share >= 1 - OVERHANG_TOL); if (!hit) throw new Error(`bandOn('${id}', '${targetId}'): no flat patch under a ${w} x ${d} throw carries 85% of it; make it smaller or lay it elsewhere`); p = [hit[0], hit[1]]; best = flat(p); console.log(`bandOn('${id}'): moved ${Math.round(Math.hypot(p[0] - p0[0], p[1] - p0[1]))} mm so ${Math.round(best.share * 100)}% of the throw rests on a flat patch of ${targetId}`); }
    this.put(id, 'foldedThrow', p, spin, { group, y: Math.round(best.top), mount: 'on', params: { w, d, layers, tone } });
  }
  // a light hung over a placed thing, an island above all: a.over('island', 'pendantLamp', { dx, dz, group }) hangs the shade's rim 825 above the top (750 to 900 is the rule), over the middle of the piece
  over(targetId, asset = 'pendantLamp', { dx = 0, dz = 0, ...o } = {}) {
    const tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`); if (!tgt) throw new Error(`over('${targetId}'): place it first`);
    const { all, T } = this.targetTris('over', targetId), c = all.getCenter(new T.Vector3()), top = tgt.asset === 'baseRun' ? (tgt.params?.top || 900) : this.topOf(targetId);
    this.put(`${targetId}-${asset}`, asset, [c.x + dx, c.z + dz], 0, { mount: 'ceiling', group: o.group || tgt.group, ...o, params: { rim: top + 825, ...o.params } });
  }
  // a coffee table in front of a sofa: a.coffeeTable('ct', 'sofa', { w: 1100, d: 550, gap: 400, group, params }). It stands gap mm (400 to 450) from the seat front, in front of the seats and never in the chaise's way: its side keeps a 420 mm walkway from the chaise, and it narrows (to 700 at least) to do so
  coffeeTable(id, sofaId, { w = 1100, d = 550, gap = 400, group, params = {} } = {}) {
    const tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${sofaId}`); if (!tgt) throw new Error(`coffeeTable('${id}'): place '${sofaId}' first`);
    const T = (this.h.kit ||= createKit()).THREE, g0 = REGISTRY[tgt.asset](this.h.kit, { ...(tgt.params || {}) }); g0.updateMatrixWorld(true);
    const lb = new T.Box3().setFromObject(g0), tn = (tgt.turn || 0) + this.psi, th = rad(tn), W = lb.max.x - lb.min.x, cx = (lb.min.x + lb.max.x) / 2, cz = (lb.min.z + lb.max.z) / 2;
    const { tris, all } = this.targetTris('coffeeTable', sofaId), c = all.getCenter(new T.Vector3()), org = [c.x - (cx * Math.cos(th) + cz * Math.sin(th)), c.z - (-cx * Math.sin(th) + cz * Math.cos(th))], f = heightField(tris);
    const toArea = (lx, lz) => [org[0] + lx * Math.cos(th) + lz * Math.sin(th), org[1] - lx * Math.sin(th) + lz * Math.cos(th)];
    const cols = []; for (let lx = lb.min.x + 25; lx < lb.max.x; lx += 50) { let front = lb.min.z; for (let lz = lb.max.z; lz > lb.min.z; lz -= 25) { const [ax, az] = toArea(lx, lz); if (f(ax, az) > 150) { front = lz; break; } } cols.push([lx, front]); }
    const fronts = cols.map((q) => q[1]).sort((a, b) => a - b), main = fronts[Math.floor(fronts.length / 2)], plain = cols.filter((q) => q[0] && q[1] <= main + 150), ch = cols.filter((q) => q[1] > main + 150);
    let a0 = Math.min(...plain.map((q) => q[0])) - 25, a1 = Math.max(...plain.map((q) => q[0])) + 25, note = '';
    if (ch.length) { const cl = ch.reduce((m, q) => m + q[0], 0) / ch.length > cx ? 'right' : 'left'; if (cl === 'right') a1 -= 0; const lo = Math.min(...ch.map((q) => q[0])) - 25, hi = Math.max(...ch.map((q) => q[0])) + 25; if (cl === 'right') a1 = Math.min(a1, lo - 420); else a0 = Math.max(a0, hi + 420); note = `; the chaise is on the ${cl}: it keeps 420 mm clear of it`; }
    const avail = a1 - a0; if (avail < 700) throw new Error(`coffeeTable('${id}'): only ${Math.round(avail)} mm of seat front is left clear of the chaise (700 at least): use a smaller sofa or a side table`);
    const ww = Math.min(w, Math.round(avail)), lx = (a0 + a1) / 2, [px, pz] = toArea(lx, main + gap + d / 2);
    if (ww < w || note) console.log(`coffeeTable('${id}'): ${ww} x ${d} mm, ${gap} mm in front of the seats${note}`);
    this.put(id, 'coffeeTable', [px, pz], tn, { group: group || tgt.group, params: { w: ww, d, ...params } });
  }
  // the soft things of a seat in one call: a.seatSoft('sofa', { cushions: 2, throw: 'drape' | 'band' | false, tone: 'lo' | 'mid', group }). Cushions lean on the back, one per seat end (a sofa: seats - 1, at least 1; an armchair: 1); the throw drops onto the arm end ('drape', frozen cloth) or lies folded across the seat ('band').
  seatSoft(targetId, { cushions, throw: thr = 'drape', tone = 'lo', throwTone = tone, group } = {}) {
    const tgt = this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`); if (!tgt) throw new Error(`seatSoft('${targetId}'): place it first`);
    const T = (this.h.kit ||= createKit()).THREE, g0 = REGISTRY[tgt.asset](this.h.kit, { ...(tgt.params || {}) }); g0.updateMatrixWorld(true);
    const lb = new T.Box3().setFromObject(g0), tn = (tgt.turn || 0) + this.psi, th = rad(tn), W = lb.max.x - lb.min.x, D = lb.max.z - lb.min.z, cx = (lb.min.x + lb.max.x) / 2, cz = (lb.min.z + lb.max.z) / 2;
    const { tris, all } = this.targetTris('seatSoft', targetId), c = all.getCenter(new T.Vector3()), org = [c.x - (cx * Math.cos(th) + cz * Math.sin(th)), c.z - (-cx * Math.sin(th) + cz * Math.cos(th))];   // the object's origin in the area's frame, from where its parts really stand
    const toArea = (lx, lz) => [org[0] + lx * Math.cos(th) + lz * Math.sin(th), org[1] - lx * Math.sin(th) + lz * Math.cos(th)], f = heightField(tris), zo = lb.min.z + 480;
    const seats = tgt.params?.seats || (tgt.asset === 'armchair' ? 1 : 2), n = cushions ?? (tgt.asset === 'armchair' ? 1 : Math.max(1, seats - 1)), grp = group || tgt.group;
    const inset = 330 + ({ rolled: 100, flared: 60 }[tgt.params?.arms] || 0);   // a rolled or flared arm is wider: the end cushion stands inside it
    const cushion = this.thingTris('cushion', { w: 400, h: 320, thick: 130, lean: 17, tone }), cl = Math.min(...cushion.map((t) => Math.min(t[1], t[4], t[7])));
    const rim = []; { const seen = new Set(); for (const t of cushion) for (let k = 0; k < 9; k += 3) { if (t[k + 1] < cl + 140) continue; const key = `${Math.round(t[k] / 15)},${Math.round(t[k + 1] / 15)},${Math.round(t[k + 2] / 15)}`; if (!seen.has(key)) { seen.add(key); rim.push([t[k], t[k + 1], t[k + 2]]); } } }   // the cushion's upper vertices, thinned: the ones that can meet the backrest
    const against = (px, pz, turn) => { const c = Math.cos(rad(turn)), sn = Math.sin(rad(turn)), y = geomRestOn(tris, cushion, [px, pz], turn); if (y < 150) return false; for (const v of rim) { const vy = v[1] + y, h = f(px + v[0] * c + v[2] * sn, pz - v[0] * sn + v[2] * c); if (h > vy - 1) return true; } return false; };   // an upper vertex that lies inside the back: the cushion touches the backrest
    const chS = tgt.asset === 'sofa' ? ({ left: -1, right: 1 }[tgt.params?.chaise] || 0) : 0, cw = (W - 400) / seats, lo = cx - (W / 2 - inset) + (chS === -1 ? cw + 150 : 0), hi = cx + (W / 2 - inset) - (chS === 1 ? cw : 0);   // a chaise end has no back: the cushions stand on the seats beside it
    for (let i = 0; i < n; i++) { const lx = n === 1 ? (tgt.asset === 'armchair' ? cx : hi) : lo + i * (hi - lo) / (n - 1), turn = tn + (i % 2 ? -6 : 8), lean = 17 + 4 * (i % 2);
      let lz = chS ? -lb.min.z - 20 : lb.max.z - 100, found = false; for (; lz >= lb.min.z; lz -= 10) { const [qx, qz] = toArea(lx, lz); if (against(qx, qz, turn)) { found = true; lz += 10; break; } }   // slide the cushion back from the front until its top meets the backrest, then step off 10 mm (with a chaise it starts at the seats' front, not the chaise's)
      if (!found) { lz = zo; console.log(`seatSoft('${targetId}'): cushion${i + 1} finds no back to lean on; it rests on the seat`); }
      const [px, pz] = toArea(lx, lz), prm = vary(this.h, 'cushion', { w: 400, h: 320, thick: 130, lean, tone }, this.id), y = Math.round(geomRestOn(tris, this.thingTris('cushion', prm), [px, pz], turn));   // the dealt piping and pattern change the shape a little: rest the real one
      this.put(`${targetId}-cushion${i + 1}`, 'cushion', [px, pz], turn, { group: grp, y, mount: 'on', params: prm }); }
    let bandAt = null; if (chS && thr) { thr = 'band'; bandAt = toArea(cx + chS * (W / 2 - 200 - cw / 2), (tgt.params?.d ?? 900) / 2 + 370); }   // the throw lies folded on the chaise: a drape would slide off its low seat
    if (thr === 'drape') {   // over the arm: hangs on the outer side, falls onto the seat on the inner side (a seat with no arm takes a small folded throw instead)
      const aw = tgt.asset === 'armchair' ? 170 : 200, [hx, hz] = toArea(cx - (W / 2 - aw / 2), zo + 200), [sx, sz] = toArea(cx - (W / 2 - aw - 260), zo + 200), hA = f(hx, hz), hS = f(sx, sz);
      if (hA - hS >= 80) { const prm = { aw, drop: Math.round(hA - hS), d: 560, lay: 140, tone: throwTone, seed: this.h.S.seed % 9 + 1 }; this.put(`${targetId}-throw`, 'armThrow', [hx, hz], tn, { group: grp, y: Math.round(hA), mount: 'on', params: prm }); }
      else { console.log(`seatSoft('${targetId}'): no arm to hang a throw on; folded on the seat instead`); thr = 'band'; }
    }
    if (thr === 'band') { const [bx, bz] = bandAt || toArea(cx + (W / 2 - 520), zo + 330); try { this.bandOn(`${targetId}-throw`, targetId, { w: chS ? Math.min(450, cw - 100) : 450, d: 300, at: [bx, bz], spin: tn, tone: throwTone, group: grp }); } catch (e) { console.log(`seatSoft('${targetId}'): no throw laid: ${e.message}`); } }
  }
  // ---- a cabinet run with slots: R.on('hob', 'pan') puts a pan on the middle of the first hob module
  run(F, id, left, modules, o = {}) {
    const { group = 'run', depth = 600, hero, ...params } = o, mods = [], p = this; let x = left;
    for (const m of modules) { mods.push({ ...m, xc: x + m.w / 2 }); x += m.w; }
    const length = x - left;
    const abut = (this._runEnds ||= []).find((q) => q.F === F && Math.abs(q.end - left) < 3 && q.depth === depth && q.top === (params.top || 900) && params.ownsTop !== false && !params.joins);   // a run starting where another in line ends: neither draws its end of the worktop outline
    F.put(id, 'baseRun', left, depth, { group, hero, params: { ...params, depth, modules, ...(abut ? { abutStart: true } : {}) } });
    if (abut) { const po = this.h.S.home.objects.find((o) => o.id === `${this.id}-${abut.id}`); if (po) po.params = { ...po.params, abutEnd: true }; }
    if (params.ownsTop !== false && !params.joins) this._runEnds.push({ F, id, end: left + length, depth, top: params.top || 900 });
    if (modules.some((m) => m.ajar)) this.h.sign(this.id, 'drawer ajar');   // a module { kind: 'drawers', ajar: 0.4 } leaves its top drawer pulled out 0.4 of its travel
    let n = 0;
    return {
      length, left, depth, mods, F,
      mod: (kind, nth = 0) => { const m = mods.filter((q) => q.kind === kind)[nth]; if (!m) throw new Error(`run "${id}" has no ${kind} module #${nth}`); return m; },
      on(kind, asset, oo = {}) {
        if (kind === 'sink' && !['hob', 'hood'].includes(asset) && ASSETS[asset].mount !== 'wall') {   // the basin takes the sink module's top: a thing goes on the worktop beside it (the next module that is not a hob), else the call refuses
          const i = mods.findIndex((q) => q.kind === 'sink' && mods.filter((r) => r.kind === 'sink').indexOf(q) === (oo.nth || 0)), nb = [mods[i - 1], mods[i + 1]].filter((q) => q && !['hob', 'sink'].includes(q.kind));
          if (!nb.length) throw new Error(`R.on('sink', '${asset}'): the basin fills the sink module and no flat module stands beside it: put it on another module (R.on('doors' | 'drawers' | 'filler', ...))`);
          nb.sort((p, q) => (p.used || 0) - (q.used || 0)); return this.on(nb[0].kind, asset, { ...oo, nth: mods.filter((q) => q.kind === nb[0].kind).indexOf(nb[0]) });   // the emptier neighbour first
        }
        const m = this.mod(kind, oo.nth || 0); m.used = (m.used || 0) + 1; const meta = ASSETS[asset], top = params.top || 900, wall = meta.mount === 'wall';
        let dx0 = oo.dx || 0;
        const onBurner = asset === 'pan' || (asset === 'mokaPot' && kind === 'hob');   // round 6 B19: a pot stands centred on a burner of the hob (src/kitchen/hob.js: x 225|675, 200|440 behind the front of its 900 mm, centred on the module)
        if (!wall && !['hob', 'hood'].includes(asset) && !onBurner) {   // a second or third thing on one module slides along the worktop to a free stretch (never on top of the first); the call refuses when the module is full
          const aw = sizeOf(asset, oo.params).w, items = (m.items ||= []), clash = (x) => items.some((q) => Math.abs(x - q.x) < (aw + q.w) / 2 + 20);
          if (oo.dx === undefined) { const xs = []; for (let x = -m.w / 2 + aw / 2 + 20; x <= m.w / 2 - aw / 2 - 20; x += 20) xs.push(x); xs.sort((p, q) => Math.abs(p) - Math.abs(q)); const fx = xs.find((x) => !clash(x)); if (fx === undefined) throw new Error(`R.on('${kind}', '${asset}'): the ${kind} module (${m.w} mm) has no free stretch for a ${Math.round(aw)} mm piece: put it on another module`); dx0 = fx; }
          else if (clash(dx0)) throw new Error(`R.on('${kind}', '${asset}', { dx: ${dx0} }): it would stand on another piece of that module: change dx or the module`);
          items.push({ x: dx0, w: aw });
        }
        const xc = m.xc + dx0, oid = oo.id || `${id}-${asset}${n++ || ''}`;
        const o2 = { group, ...oo, params: oo.params }; delete o2.nth; delete o2.dx; delete o2.id;
        if (asset === 'hob' || asset === 'hood') return F.place(oid, asset, xc, { ...o2, depth });
        if (onBurner) { const [bx, bz] = [[225, 200], [-225, 200], [225, 440], [-225, 440]][(m.burner = (m.burner ?? -1) + 1) % 4]; return F.place(oid, asset, xc + bx, { ...o2, y: o2.y ?? 940, off: depth - bz, turn: o2.turn ?? (asset === 'pan' ? -35 : 0) }); }
        const bk = meta.backed && (vary(p.h, asset, o2.params, p.id).form ?? (meta.backed.byDefault ? meta.backed.form : null)) === meta.backed.form ? meta.backed.off : undefined;   // a board leaning on the wall stands against it
        return F.place(oid, asset, xc, { ...o2, y: o2.y ?? top, off: o2.off ?? bk ?? depth * 0.55, ...(wall ? { off: 0, y: o2.y ?? meta.y } : {}) });
      },
    };
  }
  // ---- a table set: a table (round with r, or w x d) with chairs, a rug under it and slots over / on it
  table(id, { at, r, w = 1600, d = 900, chairs = 4, rug = true, cloth = false, group = 'table set', hero = true, h = 750, chairForm } = {}) {
    const round = !!r, p = this, TW = round ? 2 * r : w, TD = round ? 2 * r : d;
    if (rug) p.put(`${id}-rug`, 'rug', at, 0, { group, params: { w: TW + 1400, d: TD + 1400, ...(round ? { form: 'round' } : {}) } });   // (rug form: round for a round table, else dealt; it reaches 700 mm past the top on every side, so a pulled-out chair keeps its back legs on it)
    p.put(id, round ? 'roundTable' : 'table', at, 0, { ...(rug ? { y: 7, lift: 7 } : {}), group, hero, params: round ? { r, h } : { w, d, h } });
    if (cloth) p.put(`${id}-cloth`, 'tablecloth', at, 0, { y: h + (rug ? 7 : 0), mount: 'on', group, params: { ...(round ? { r } : { w: w + 90, d: d + 90 }), drop: round ? 260 : 300 } });   // cloth: true: a cloth whose shape follows the table (round skirt, or a rectangle that hangs over the long sides)
    const spots = round ? [[0, -1], [1, 0], [0, 1], [-1, 0]].slice(0, Math.min(4, chairs)).map(([a, b]) => [a * (r + 230), b * (r + 230)])
      : (() => { const per = Math.ceil(chairs / 2), out = []; for (let i = 0; i < per; i++) for (const s of [-1, 1]) { if (out.length < chairs) out.push([(i - (per - 1) / 2) * (w / per), s * (d / 2 + 310)]); } return out; })();
    const cnt = (this.h.counts ||= {}), nx = cnt.tableSet = (cnt.tableSet ?? this.h.S.seed % 4) + 1, cf = chairForm || ['ladder', 'spindle', 'bentwood', 'upholstered'][nx % 4];   // one chair form for the whole set
    spots.forEach(([dx, dz], i) => { const q = [at[0] + dx, at[1] + dz]; p.put(`${id}-chair-${i + 1}`, 'chair', q, deg(Math.atan2(at[0] + (round ? 0 : dx) - q[0], at[1] - q[1])), { ...(rug ? { y: 7, lift: 7 } : {}), group, params: { form: cf } }); });   /* no rug of its own: on the floor, and lifted only if the spec puts a rug under it */
    return {
      at, over: (asset = 'pendantLamp', { dx = 0, dz = 0, ...o } = {}) => p.put(`${id}-${asset}`, asset, [at[0] + dx, at[1] + dz], 0, { mount: 'ceiling', group, ...o, params: { rim: h + 825, ...o.params } }),   // the shade rim hangs 825 above the table top (750-900 is the rule) unless rim is given   // dx / dz slide it off the table's middle (up to a third of the table's length) to clear a window in the home view
      on: (asset, o = {}) => p.put(`${id}-${asset}`, asset, [at[0] + (o.dx || 0), at[1] + (o.dz || 0)], 0, { y: h + (rug ? 7 : 0), mount: 'on', group, ...o }),
    };
  }
  // what the roll named: a.rolled('vase', 'candlesticks') lists the assets the roll dealt to this area; a.skip('vase', 'why') says one is left out (the check 'rolled' wants every rolled asset present or skipped)
  rolled(...assets) { const r = ((this.h.S.home.rolled ||= {})[this.id] ||= { rolled: [], skipped: [] }); r.rolled.push(...assets.flat()); }
  dress(opening, kind, oid, o = {}) {   // a.dress(window, 'blind', 'bblind'): hang a blind or curtain on that opening (the object from a wall's opening list), whichever wall of this area holds it
    const F = Object.values(this.walls || {}).find((w) => w.openings.includes(opening)); if (!F) throw new Error(`dress('${oid}'): that opening is not on a wall of ${this.id}: pass an object from the openings list of one of its walls`);
    return F.dress(oid, kind, opening, o);
  }
  skip(asset, why) { if (!why) throw new Error(`skip('${asset}'): say why it is left out`); const r = ((this.h.S.home.rolled ||= {})[this.id] ||= { rolled: [], skipped: [] }); r.skipped.push({ asset, why }); }
  still(topId, phrases, opts = {}) { return runStill(this, topId, phrases, opts); }   // the dealt things of one still life on a placed top, see arrange.mjs
  wallArr(phrase, opts = {}) { return runWallArr(this, phrase, opts); }   // one dealt wall arrangement (art over a piece, a shelf, a rail, hooks), see arrange.mjs
  // ---- slots: the places a group can take, read off the shell (walls, openings) and the home view's frame. a.slots() prints them; a.group(phrase, { slot: 'back:right' }) and wall.place(id, asset, 'right') take a name.
  //   wall slots  '<wall>:<third>' (wall: back | left | right | window; third: left | middle | right, along the wall's x as the camera sees it): the third of the wall's length, cut to its bare stretches (between corners, openings with their curtain / swing zones, and pieces already standing on it); free when 600 mm or more is bare
  //   floor slots 'floor:<band>' or 'floor:<band>:<third>' (band: back | middle | front, 30 / 40 / 30 percent of the depth; third: left | middle | right): free when the corridors between the area's entries cover under 40 percent of the box; `at` is the box's middle kept 1400 mm off the back wall and 1000 mm off the front edge, 1100 mm off the sides, so a free-standing group's own clearance holds
  slotTable(width = 600, o = {}) {   // width: how much bare wall a group needs (mm); 600 when none is given; o.inWindow: windows do not cut it (a window seat); the measure itself is slotmath.mjs, shared with the roll
    const T = { wall: {}, floor: {} }, [x0, z0, x1, z1] = this.rect;
    const ent0 = Object.values(this.walls || {}).flatMap((F) => F.openings.filter((q) => q.to && q.kind !== 'window').map((q) => F.at(q.x, 900))), segs0 = []; for (let i = 0; i < ent0.length; i++) for (let j = i + 1; j < ent0.length; j++) segs0.push([ent0[i], ent0[j]]);
    // where a piece of this depth on the wall F would stand within 450 mm of a corridor between two ways through (check 'path' 4a keeps 900 mm of floor clear along it): those stretches of wall are cut
    const corridorCuts = (F) => { if (!segs0.length) return []; const dep = Math.min(o.depth || 600, 1500), o0 = F.at(0, 0), u = F.at(1, 0), nn = F.at(0, 1), loc = (p) => [(p[0] - o0[0]) * (u[0] - o0[0]) + (p[1] - o0[1]) * (u[1] - o0[1]), (p[0] - o0[0]) * (nn[0] - o0[0]) + (p[1] - o0[1]) * (nn[1] - o0[1])], pts = [];
      for (const [a, b] of segs0) { const A = loc(a), B = loc(b), n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 100)); for (let k = 0; k <= n; k++) pts.push([A[0] + (B[0] - A[0]) * k / n, A[1] + (B[1] - A[1]) * k / n]); }
      const out = []; let cur = null; for (let x = 0; x <= F.len; x += 50) { const hit = pts.some(([px, pz]) => Math.hypot(Math.max(x - 25 - px, 0, px - x - 25), Math.max(-pz, 0, pz - dep)) < 450); if (hit) { if (!cur) cur = { a: x - 25, b: x + 25, why: 'the corridor between two ways through' }; else cur.b = x + 25; } else if (cur) { out.push(cur); cur = null; } } if (cur) out.push(cur); return out; };
    for (const [wid, F] of Object.entries(this.walls || {})) {
      const cut = [...F.openings.filter((q) => !(o.inWindow && q.kind === 'window')).map((q) => ({ a: q.x - zone(q), b: q.x + zone(q), why: `${q.kind}${q.to ? ' to ' + q.to : ''} at ${Math.round(q.x)}` })), ...F.taken.filter((t) => t.y[0] < 300).map((t) => ({ a: t.x[0] - 50, b: t.x[1] + 50, why: `${t.id} on the floor` })), ...corridorCuts(F), ...(this.reserved || []).filter((q) => q.wall !== wid).map((q) => { const o0 = F.at(0, 0), u = F.at(1, 0), nn = F.at(0, 1), c = rectCut(q.r, (x, z) => (x - o0[0]) * (u[0] - o0[0]) + (z - o0[1]) * (u[1] - o0[1]), (x, z) => (x - o0[0]) * (nn[0] - o0[0]) + (z - o0[1]) * (nn[1] - o0[1])); return c.offMin < (o.depth || 600) + 50 && c.offMax > -50 ? { a: c.a - 50, b: c.b + 50, why: `the floor a group on another wall holds` } : null; }).filter(Boolean)].sort((p, q) => p.a - q.a);
      for (let i = 0; i < 3; i++) { const v = thirdSlot(F.len, cut, i, width, o.inWindow ? F.openings.filter((q) => q.kind === 'window').map((q) => q.x) : []); T.wall[`${wid}:${THIRD[i]}`] = { wall: F, ...v, cut: cut.filter((c) => c.b > v.range[0] && c.a < v.range[1]).map((c) => c.why) }; }
    }
    const D = z1 - z0, W = x1 - x0, segs = [], ent = Object.values(this.walls || {}).flatMap((F) => F.openings.filter((o) => o.to && o.kind !== 'window').map((o) => F.at(o.x, 900)));
    for (let i = 0; i < ent.length; i++) for (let j = i + 1; j < ent.length; j++) segs.push([ent[i], ent[j]]);
    const near = (p) => segs.some(([a, b]) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz) < 450; });
    for (const bn of Object.keys(FLOOR_BANDS)) for (const tn of Object.keys(FLOOR_THIRDS)) {
      const box = floorBox(this.rect, bn, tn); let n = 0, k = 0;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { k++; if (segs.length && near([box[0] + (i + 0.5) * (box[2] - box[0]) / 8, box[1] + (j + 0.5) * (box[3] - box[1]) / 8])) n++; }
      const spot = floorSpot(this.rect, box, (this.reserved || []).map((q) => q.r), width, o.depth || 600);   // a piece already placed on that floor takes it: the group stands where its own footprint is clear, or the slot is not free
      T.floor[tn === 'all' ? `floor:${bn}` : `floor:${bn}:${tn}`] = { box, at: spot || floorSpot(this.rect, box, [], width, o.depth || 600), corridor: Math.round(100 * n / k), free: n / k < 0.4 && !!spot, ...(spot ? {} : { taken: true }) };
    }
    return T;
  }
  slots(need, quiet = false) {   // need: a width in mm, a group phrase (its recipe's needs.w), or { width }: list only the wall slots that fit it
    const width = this.widthFor(need), T = this.slotTable(width), L = [`slots ${this.id}${need ? ` that fit ${width} mm` : ''} (left, middle, right as the camera sees them; mm in the area's own frame):`];
    for (const [k, v] of Object.entries(T.wall)) { if (need && !v.best) continue; L.push(`  ${k.padEnd(14)} x ${v.range[0]}-${v.range[1]}  ${v.best ? `free: middle at ${v.xc} (bare stretch ${v.stretch.join('-')}; bare in this third ${v.bare.map((b) => b.join('-')).join(', ')})` : `not free: ${v.widest} mm bare in this third at most, ${width} needed`}${v.cut.length ? `   [${v.cut.join('; ')}]` : ''}`); }
    for (const [k, v] of Object.entries(T.floor)) L.push(`  ${k.padEnd(20)} box ${v.box.join(', ')}  ${v.free ? 'free' : 'not free'}${v.corridor ? ` (corridor over ${v.corridor}%)` : ''}`);
    if (!quiet) console.log(L.join('\n'));
    return T;
  }
  widthFor(need) { if (!need) return 600; if (typeof need === 'number') return need; if (typeof need === 'object') return need.width || 600; const n = groupNeeds(String(need).replace(/ \(the hero group[^)]*\)/, '').replace(/, on the .*$/, '')); return n?.w || 600; }   // a phrase may carry the roll's own suffix ("..., on the back wall, right third")
  resolveSlot(name, what = 'a group', width = 600, o = {}) {
    const T = this.slotTable(width, o); let key = name;
    if (name.startsWith('second')) { const w = Object.values(this.walls || {})[1]; if (!w) throw new Error(`slot '${name}' for ${what}: this area has one wall, no second wall`); key = `${w.id}:${name.split(':')[1] || 'middle'}`; }
    else if (name.startsWith('window')) { const w = slotWall(Object.values(this.walls || {}).map((F) => ({ id: F.id, window: F.openings.some((q) => q.kind === 'window') }))); key = `${w?.id}:${name.split(':')[1] || 'middle'}`; }
    const v = T.wall[key] || T.floor[key]; if (!v) throw new Error(`slot '${name}' for ${what}: no such slot; the names are ${Object.keys(T.wall).concat(Object.keys(T.floor)).join(', ')} (a.slots() prints them)`);
    const fits = Object.entries(T.wall).filter(([, q]) => q.best).map(([k2]) => k2).join(', ') || 'none';
    if (v.wall) { if (!v.best) throw new Error(`slot '${name}' for ${what}: ${width > 600 ? `the bare wall in that third is ${v.widest} mm at most and the recipe needs ${width}` : `under 600 mm of the wall is bare there`} (${v.cut.join('; ') || 'a corner'}); wall slots that fit now: ${fits}`); return { wall: v.wall, xc: v.xc, stretch: v.stretch }; }
    if (v.taken) throw new Error(`slot '${name}' for ${what}: what already stands on the floor leaves no place there for a group ${width} x ${o.depth || 600} mm (the groups placed first keep their floor: place the hero first); free floor slots now: ${Object.entries(T.floor).filter(([, q]) => q.free).map(([k2]) => k2).join(', ')}`);
    if (!v.free) throw new Error(`slot '${name}' for ${what}: the corridor between the area's entries covers ${v.corridor}% of it; free floor slots now: ${Object.entries(T.floor).filter(([, q]) => q.free).map(([k2]) => k2).join(', ')}`);
    return { at: v.at };
  }
  slotOnWall(F, name, what, width = 600) {   // a slot name given to wall.place or as xc: the third (or 'back:right' with this wall's own name) as a number along the wall
    const third = name.includes(':') ? name : `${F.id}:${name}`; if (!third.startsWith(F.id + ':')) throw new Error(`place('${what}'): slot '${name}' is on another wall than '${F.id}'`);
    return this.resolveSlot(third, what, width).xc;
  }
  // a hero refused at its dealt slot is never dropped: it tries the other slots of its kind (nearest first, then the other walls), then its smaller form (a recipe with needs.wc builds compact), and only then refuses
  heroFallback(slot, phrase, nd, so) {
    const floor = String(slot).startsWith('floor:'), forms = [{ compact: false, width: this.widthFor(phrase) }]; if (nd.wc) forms.push({ compact: true, width: nd.wc });
    for (const f of forms) { const T = this.slotTable(f.width, so), names = Object.entries(floor ? T.floor : T.wall).filter(([, q]) => (floor ? q.free : q.best)).map(([n]) => n).filter((n) => n !== slot || f.compact), key = (n) => (n.split(':')[0] === String(slot).split(':')[0] ? 0 : 1000) + Math.abs(['left', 'middle', 'right'].indexOf(n.split(':')[1]) - ['left', 'middle', 'right'].indexOf(String(slot).split(':')[1] || 'middle'));
      for (const n of names.sort((p, q) => key(p) - key(q))) { try { const r = this.resolveSlot(n, phrase, f.width, so), w = f.width, d = nd.d || 600, pts = r.wall ? [r.wall.at(r.xc - w / 2, 0), r.wall.at(r.xc + w / 2, 0), r.wall.at(r.xc - w / 2, d), r.wall.at(r.xc + w / 2, d)] : [[r.at[0] - w / 2, r.at[1] - d / 2], [r.at[0] + w / 2, r.at[1] - d / 2], [r.at[0] - w / 2, r.at[1] + d / 2], [r.at[0] + w / 2, r.at[1] + d / 2]]; if (this.zoneClash(pts)) continue; return { r, slot: n, compact: f.compact }; } catch (e) { /* the next slot */ } } }
    return null; }
  // does a footprint (four area points) stand in the straight-ahead zone of an arch or door on any wall (500 mm each side, 1500 deep for a door, 2400 for an arch)? A slot on another wall than the dealt one may stand in the zone of an opening on the first wall
  zoneClash(pts) {
    for (const F of Object.values(this.walls || {})) for (const q of F.openings || []) { if (q.kind === 'window' || q.sill > 0 || /pass$/.test(q.style || '')) continue; const o0 = F.at(0, 0), u1 = F.at(1, 0), n1 = F.at(0, 1), t = pts.map(([x, y]) => [(x - o0[0]) * (u1[0] - o0[0]) + (y - o0[1]) * (u1[1] - o0[1]), (x - o0[0]) * (n1[0] - o0[0]) + (y - o0[1]) * (n1[1] - o0[1])]); if (Math.max(...t.map((p) => p[0])) - (q.x - 500) > 20 && (q.x + 500) - Math.min(...t.map((p) => p[0])) > 20 && Math.min(...t.map((p) => p[1])) < (q.kind === 'arch' ? 2400 : 1500) - 20 && Math.max(...t.map((p) => p[1])) > 20) return true; }
    return false; }
  group(phrase, opts = {}) { let stretch = null; const bare = String(phrase).replace(/ \(the hero group[^)]*\)/, '').replace(/, on the .*$/, ''), nd = groupNeeds(bare) || {};
    if (opts.slot) { const { slot, ...rest } = opts, so = { inWindow: !!nd.window, depth: nd.d }; let r; try { r = this.resolveSlot(slot, phrase, this.widthFor(phrase), so); } catch (e) { const fb = opts.hero ? this.heroFallback(slot, phrase, nd, so) : null; if (!fb) throw e; r = fb.r; if (fb.compact) rest.compact = true; (this.h.heroMoves ||= []).push({ area: this.id, phrase, from: slot, to: fb.slot, compact: !!fb.compact }); } opts = r.wall ? { ...rest, wall: r.wall, xc: r.xc } : { ...rest, at: r.at }; stretch = r.stretch; } else if (typeof opts.xc === 'string' && opts.wall) opts = { ...opts, xc: this.slotOnWall(opts.wall, opts.xc, phrase, this.widthFor(phrase)) };
    const nTaken = opts.wall ? opts.wall.taken.length : 0, res = runGroup(this, phrase, opts); if (opts.wall && stretch && !nd.free) this.fitStretch(opts.wall, res.ids, stretch, nTaken);
    const fslid = !opts.wall && opts.at && !nd.free ? this.clearPathsFloor(res.ids) : 0;
    const slid = opts.wall && !nd.free ? this.clearPaths(opts.wall, res.ids, stretch, nTaken) || 0 : 0;
    const w = (opts.compact && nd.wc) || nd.w || 600, d = nd.d || 600, [rx0, rz0, rx1, rz1] = this.rect;   // the floor a group stands on is reserved: a later floor group stands where its own footprint is clear (slotmath.mjs floorSpot)
    if (opts.wall && !nd.free) { const F = opts.wall, xc = (opts.xc ?? 0) + slid, pts = [F.at(xc - w / 2, 0), F.at(xc + w / 2, 0), F.at(xc - w / 2, d), F.at(xc + w / 2, d)]; (this.reserved ||= []).push({ r: [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1]))], wall: F.id }); }
    else if (opts.at) { const at = fslid ? [opts.at[0] + fslid[0], opts.at[1] + fslid[1]] : opts.at; (this.reserved ||= []).push({ r: nd.float && !nd.free ? [at[0] - w / 2, Math.max(at[1] - d / 2, rz0 + 900), at[0] + w / 2, Math.max(at[1] - d / 2, rz0 + 900) + d] : [at[0] - w / 2, at[1] - d / 2, at[0] + w / 2, at[1] + d / 2], wall: 'floor' }); }
    return res; }   // one roll group phrase as a built arrangement, see groups.mjs
  // a.blocking(roll.areas[id], { tries: 3, pick, quiet }) → { chosen, candidates }: the area's dealt groups placed as `tries` layouts, the best kept (framework item 2; `await` it: the geometry core scores in Node, no browser).
  //   0 is the layout as the roll dealt it (its slots, the recipe seed); the others keep the hero's slot and move every other group to another free slot of its kind (wall or floor) and step the recipe seed (which furniture, which side the lamp stands).
  //   Score, lowest wins, compared in this order: physical faults, then the other blocking findings (placement, runner, path, casing), then the other stage 1-4 findings the geometry core names (empty floor, rug reach, seats facing), then pieces a recipe left out. A tie keeps the lower layout, so the roll's own choice stays when nothing is better.
  //   The page-side rules (hidden, frame fill) are not in the score; check-home still runs them. pick: n keeps layout n whatever the scores.
  async blocking(ra, { tries = 3, pick, quiet = false } = {}) {
    const groups = ra?.groups || [], dealt = ra?.groupSlots || []; if (!groups.length) return { chosen: null, candidates: [] };
    const { groupPhrase } = await import('./roll.mjs'), { checkScene } = await import('./geom/index.mjs'), { blocks, PHYSICAL, ruleStage, makeCtx } = await import('./stages.mjs'), h = this.h, log = (...x) => { if (!quiet) console.log(...x); };
    const phrases = groups.map(groupPhrase), isFloor = (v) => String(v).startsWith('floor:');
    const snap = () => ({ n: h.S.home.objects.length, counts: { ...(h.counts || {}) }, signs: h.signs ? JSON.stringify(h.signs) : null, taken: Object.values(this.walls || {}).map((F) => [F, F.taken.length]), reserved: this.reserved ? this.reserved.length : null, rolled: JSON.stringify(h.S.home.rolled ?? null), pairs: { ...(h.pairs || {}) }, curtains: (h.curtainRecs || []).length, decks: Object.fromEntries(Object.entries(h.decks || {}).map(([k, v]) => [k, typeof v === 'function' ? [v, v.get()] : [...v]])) });
    const back = (z) => { h.S.home.objects.length = z.n; h.counts = { ...z.counts }; h.signs = z.signs ? JSON.parse(z.signs) : h.signs; for (const [F, n] of z.taken) F.taken.length = n; if (z.reserved == null) delete this.reserved; else this.reserved.length = z.reserved; h.S.home.rolled = JSON.parse(z.rolled) ?? h.S.home.rolled; h.pairs = { ...z.pairs }; if (h.curtainRecs) h.curtainRecs.length = z.curtains; h.decks = Object.fromEntries(Object.entries(z.decks).map(([k, v]) => { if (Array.isArray(v) && typeof v[0] === 'function') { v[0].set(v[1]); return [k, v[0]]; } return [k, [...v]]; })); };
    const place = (c) => {   // layout c: { slots, seed } → { ids, left, fails }
      const out = { ids: [], left: [], fails: [], slots: [] };
      groups.forEach((g, k) => {
        let slot = dealt[k]; const nd = groupNeeds(phrases[k]) || {};
        if (c > 0 && k > 0) {
          const T = this.slotTable(this.widthFor(phrases[k]), { inWindow: !!nd.window, depth: nd.d }), floor = isFloor(dealt[k]);
          const fit = floor ? Object.entries(T.floor).filter(([, q]) => q.free).map(([n]) => n) : Object.entries(T.wall).filter(([, q]) => q.best).map(([n]) => n);
          if (fit.length) { const at = Math.max(0, fit.indexOf(dealt[k])); slot = fit[(at + c) % fit.length]; }
        }
        out.slots.push(slot);
        try { const r = this.group(phrases[k], { slot, hero: k === 0, ...(c > 0 ? { seed: (h.S.seed ?? 1) + c } : {}) }); out.ids.push(...r.ids); if (r.left?.length) out.left.push(...r.left.map((l) => `${phrases[k]}: ${l}`)); }
        catch (e) { out.fails.push(`${phrases[k]} at ${slot}: ${String(e.message).split('\n')[0].slice(0, 140)}`); }
      });
      return out;
    };
    const score = async (res) => {
      if (res.fails.length) return { ok: false, tuple: [1e6, 0, 0, 0], why: res.fails[0] };
      this.liftOnRugs(); this.liftOnCloths();
      const objs = h.S.home.objects.filter((o) => o.area === this.id), mine = new Set(objs.map((o) => o.id));
      const S = { ...h.S, home: JSON.parse(JSON.stringify({ ...h.S.home, objects: objs })), areas: [] }   /* a copy: buildHome adds defaults (an opening's height) to what it is given */, assetOf = Object.fromEntries(objs.map((o) => [o.id, o.asset ?? o.scene?.asset])), ctx = makeCtx(assetOf);
      const r = await checkScene(S, { settle: false, parts: false }), fs = r.findings.filter((f) => !/^note-/.test(f.rule) && (!f.id || mine.has(f.id)));
      const t = [fs.filter((f) => PHYSICAL.has(f.rule)).length, fs.filter((f) => blocks(f.rule) && !PHYSICAL.has(f.rule)).length, fs.filter((f) => !blocks(f.rule) && ruleStage({ rule: f.rule, what: f.text }, ctx) <= 4).length, res.left.length];
      return { ok: true, tuple: t, why: fs.slice(0, 2).map((f) => `[${f.rule}] ${String(f.text).slice(0, 90)}`).join(' | ') };
    };
    const base = snap(), cands = [];
    for (let c = 0; c < Math.max(1, tries); c++) { const res = place(c), sc = await score(res); cands.push({ index: c, slots: res.slots, ...sc }); back(base); }
    const cmp = (a, b) => { for (let i = 0; i < 4; i++) if (a.tuple[i] !== b.tuple[i]) return a.tuple[i] - b.tuple[i]; return a.index - b.index; };
    const best = pick != null ? cands[pick] : [...cands.filter((q) => q.ok)].sort(cmp)[0];
    if (!best) { log(`blocking ${this.id}: no layout builds, so the dealt one stands as far as it goes: ${cands.map((q) => `${q.index}: ${q.why}`).join('; ')}`); const r0 = place(0); return { chosen: 0, candidates: cands, ids: r0.ids, left: r0.left, fails: r0.fails }; }   // what a plain a.group loop would leave: the pieces that did build, and what failed
    for (const q of cands) log(`blocking ${this.id} layout ${q.index}${q === best ? ' (kept)' : ''}: ${q.ok ? `physical ${q.tuple[0]}, blocking ${q.tuple[1]}, stage 1-4 ${q.tuple[2]}, left out ${q.tuple[3]}` : 'does not build'}  slots ${q.slots.join(' / ')}${q.why && q.ok ? `   ${q.why}` : q.ok ? '' : ': ' + q.why}`);
    const res = place(best.index); if (res.fails.length) throw new Error(`a.blocking('${this.id}'): layout ${best.index} failed on the rebuild: ${res.fails[0]}`);
    return { chosen: best.index, candidates: cands, ids: res.ids, left: res.left, fails: [] };
  }
  // a floor group (a slot 'floor:...') stands clear of every arch and door zone of this area (check 'path' 4), as a wall group does: where a piece stands in a zone, the group slides across the floor to the nearest spot where none does, inside the area and off the floor already reserved
  clearPathsFloor(ids) {
    const walls = Object.values(this.walls || {}), zs = []; for (const F of walls) for (const q of F.openings || []) { if (q.kind === 'window' || q.sill > 0 || /pass$/.test(q.style || '')) continue; const o0 = F.at(0, 0), u1 = F.at(1, 0), n1 = F.at(0, 1); zs.push({ q, o0, ux: u1[0] - o0[0], uz: u1[1] - o0[1], nx: n1[0] - o0[0], nz: n1[1] - o0[1], d1: q.kind === 'arch' ? 2400 : 1500 }); }
    if (!zs.length) return 0;
    const pts = [], all = []; for (const id of ids) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) continue; let b; try { b = this.boxOf(id); } catch { continue; } const c = [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]]; all.push(...c); if (o.asset !== 'rug' && b.y0 <= 50) pts.push(c); }
    if (!pts.length) return 0;
    const bad = (dx, dz) => zs.some((z) => pts.some((c) => { const t = c.map(([x, y]) => [(x + dx - z.o0[0]) * z.ux + (y + dz - z.o0[1]) * z.uz, (x + dx - z.o0[0]) * z.nx + (y + dz - z.o0[1]) * z.nz]), t0 = Math.min(...t.map((q) => q[0])), t1 = Math.max(...t.map((q) => q[0])), d0 = Math.min(...t.map((q) => q[1])), d1 = Math.max(...t.map((q) => q[1])); return t1 - (z.q.x - 500) > 20 && (z.q.x + 500) - t0 > 20 && d0 < z.d1 - 20 && d1 > 20; }));
    if (!bad(0, 0)) return 0;
    const [rx0, rz0, rx1, rz1] = this.rect, X = all.map((q) => q[0]), Z = all.map((q) => q[1]), x0 = Math.min(...X), x1 = Math.max(...X), z0 = Math.min(...Z), z1 = Math.max(...Z), res = this.reserved || [];
    const fits = (dx, dz) => x0 + dx >= rx0 + 100 && x1 + dx <= rx1 - 100 && z0 + dz >= rz0 + 100 && z1 + dz <= rz1 - 100 && !res.some(({ r }) => x1 + dx > r[0] + 20 && x0 + dx < r[2] - 20 && z1 + dz > r[1] + 20 && z0 + dz < r[3] - 20);
    const cands = []; for (let i = -30; i <= 30; i++) for (let j = -30; j <= 30; j++) if (i || j) cands.push([i * 100, j * 100]); cands.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
    for (const [dx, dz] of cands) { if (!fits(dx, dz) || bad(dx, dz)) continue;
      const w0 = this.P([0, 0]), wd = this.P([dx, dz]), ddx = wd[0] - w0[0], ddz = wd[1] - w0[1];
      for (const id of ids) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (o) o.at = [r0(o.at[0] + ddx), o.at[1], r0(o.at[2] + ddz)]; }
      return [dx, dz]; }
    return 0;
  }
  // a group on a wall stands clear of the straight-ahead zone of an arch or door on that wall (check 'path' 4: 1000 mm wide, 1500 deep, 2400 for an arch): where a piece stands in it, the group slides along the wall to the nearest place where none does (within the slot's stretch, else the wall; it stays off pieces already standing)
  clearPaths(F, ids, stretch, nTaken) {
    const ops = (F.openings || []).filter((q) => q.kind !== 'window' && !(q.sill > 0) && !/pass$/.test(q.style || '')); if (!ops.length) return;
    const o0 = F.at(0, 0), u1 = F.at(1, 0), n1 = F.at(0, 1), ux = u1[0] - o0[0], uz = u1[1] - o0[1], nx = n1[0] - o0[0], nz = n1[1] - o0[1];
    const bs = [], ext = []; for (const id of ids) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) continue; let b; try { b = this.boxOf(id); } catch { continue; }
      const c = [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]].map(([x, z]) => [(x - o0[0]) * ux + (z - o0[1]) * uz, (x - o0[0]) * nx + (z - o0[1]) * nz]); ext.push(Math.min(...c.map((q) => q[0])), Math.max(...c.map((q) => q[0]))); if (o.asset === 'rug' || b.y0 > 50) continue; bs.push({ t0: Math.min(...c.map((q) => q[0])), t1: Math.max(...c.map((q) => q[0])), d0: Math.min(...c.map((q) => q[1])), d1: Math.max(...c.map((q) => q[1])) }); }
    if (!bs.length) return;
    const zones = ops.map((q) => ({ x0: q.x - 500, x1: q.x + 500, d1: q.kind === 'arch' ? 2400 : 1500 })), bad = (dl) => bs.some((b) => zones.some((z) => b.t1 + dl - z.x0 > 20 && z.x1 - (b.t0 + dl) > 20 && b.d0 < z.d1 - 20 && b.d1 > 20));
    if (!bad(0)) return;
    const lo = Math.min(...ext), hi = Math.max(...ext), mine = F.taken.slice(nTaken), others = F.taken.slice(0, nTaken);
    const [la, lb] = stretch && hi - lo <= stretch[1] - stretch[0] + 1 ? stretch : [100, F.len - 100];
    for (let k = 1; k <= 60; k++) for (const dl of [k * 50, -k * 50]) {
      if (lo + dl < la - 1 || hi + dl > lb + 1 || bad(dl) || (F.openings || []).some((q) => q.kind !== 'window' && hi + dl > q.x - zone(q) - 200 && lo + dl < q.x + zone(q) + 200)) continue;
      if (others.some((t) => t.x && t.x[1] > lo + dl + 20 && t.x[0] < hi + dl - 20 && !(t.x[1] > lo && t.x[0] < hi))) continue;
      const wd = this.P([o0[0] + ux * dl, o0[1] + uz * dl]), w0 = this.P(o0), dx = wd[0] - w0[0], dz = wd[1] - w0[1];
      for (const id of ids) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (o) o.at = [r0(o.at[0] + dx), o.at[1], r0(o.at[2] + dz)]; }
      for (const t of mine) t.x = [t.x[0] + dl, t.x[1] + dl]; return dl;
    }
  }
  fitStretch(F, ids, [sa, sb], nTaken) {   // a recipe may stand its pieces off its middle (a fridge, then a trolley beside it): the group slides along the wall into the bare stretch its slot found, so no piece stands in a corner or an opening's zone
    const o0 = F.at(0, 0), u1 = F.at(1, 0); let lo = 1e9, hi = -1e9;
    for (const id of ids) { let b; try { b = this.boxOf(id); } catch { continue; } const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) continue; for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]]) { const t = (x - o0[0]) * (u1[0] - o0[0]) + (z - o0[1]) * (u1[1] - o0[1]); lo = Math.min(lo, t); hi = Math.max(hi, t); } }
    if (lo > hi) return; let dl = 0; if (lo < sa) dl = sa - lo; else if (hi > sb) dl = sb - hi; if (!dl || hi - lo > sb - sa + 1 || Math.abs(dl) > 1500) return;
    const wd = this.P([o0[0] + (u1[0] - o0[0]) * dl, o0[1] + (u1[1] - o0[1]) * dl]), w0 = this.P(o0), dx = wd[0] - w0[0], dz = wd[1] - w0[1];
    for (const id of ids) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (o) { o.at = [r0(o.at[0] + dx), o.at[1], r0(o.at[2] + dz)]; } }
    for (const t of F.taken.slice(nTaken)) { t.x = [t.x[0] + dl, t.x[1] + dl]; }
  }
  dims(id) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) throw new Error(`dims('${id}'): place it first`); const { w, d, h } = sizeOf(o.asset, o.params || {}); return { w, d, h, asset: o.asset, params: o.params || {}, at: o.at }; }   // the placed piece's dealt size in mm (what a group recipe measures its picture or lamp against)
  // the params a.put / place would deal for an asset (its form, its space), so a caller can measure the piece before it stands: a.dealt('picture', { w, h })
  sizeFor(asset, params) { return sizeOf(asset, this.dealt(asset, params)); }   // the size an asset would have with these params (w, d, h in mm), before it is placed
  dealt(asset, params) { return vary(this.h, asset, params, this.id); }
  // the height of a picture's real frame bottom above its y: a painting keeps its own proportions, centred in the w x h box asked for
  frameLift(params) { const f = params?.form ?? 0; if (f < 4) return 0; const P = PAINTINGS[(f - 4) % PAINTINGS.length], fr = fitFrame(P, params.w ?? 600, params.h ?? 800); return Math.round(((params.h ?? 800) - fr.H) / 2); }
  // the measured box of a placed (non-painted) piece in this area's frame: { x0, x1, y0, y1 }
  boxOf(id) { const { all } = this.targetTris('boxOf', id); return { x0: all.min.x, x1: all.max.x, y0: all.min.y, y1: all.max.y, z0: all.min.z, z1: all.max.z }; }
  // slides a placed wall piece along its wall until the middle of its measured box stands over the middle of another placed piece: a.centreOn(id, otherId)
  centreOn(id, otherId) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`), b = this.boxOf(id), c = this.boxOf(otherId), ax = (b.x1 - b.x0) >= (b.z1 - b.z0) ? 'x' : 'z', d = (c[ax + '0'] + c[ax + '1']) / 2 - (b[ax + '0'] + b[ax + '1']) / 2, p0 = this.P([0, 0]), p1 = this.P(ax === 'x' ? [d, 0] : [0, d]); o.at[0] = Math.round(o.at[0] + p1[0] - p0[0]); o.at[2] = Math.round(o.at[2] + p1[1] - p0[1]); return d; }
  // moves a placed wall piece up or down until its real bottom (or middle) stands where asked: a.hangTo(id, { bottom } | { middle })
  hangTo(id, { bottom, middle }) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) throw new Error(`hangTo('${id}'): place it first`); const b = this.boxOf(id), now = middle !== undefined ? (b.y0 + b.y1) / 2 : b.y0; o.at[1] = Math.round(o.at[1] + ((middle ?? bottom) - now)); return o.at[1]; }
  topOf(id) { const o = this.h.S.home.objects.find((q) => q.id === `${this.id}-${id}`); if (!o) throw new Error(`topOf('${id}'): place it first`); const { tris, all, T } = this.targetTris('topOf', id), c = all.getCenter(new T.Vector3()), y = heightField(tris)(c.x, c.z); return y > 0 ? Math.round(y) : o.at[1] + (o.params?.h ?? ASSETS[o.asset].size[2]); }   // the height of the top of a placed thing, measured on its real parts under its middle: stand something on it with y: a.topOf('side-table')
  view({ target, az = this.h.plan?.areas?.[this.id]?.az ?? 20, el = 15, dist, fit = 'objects' }) { this.cam = { target: this.P3(target), az: az - this.psi, el, fit, ...(dist ? { dist } : {}) }; }
  shot(name, from, look, fov = 30, subject, core) { this.shots.push({ name, from: this.P3(from), look: this.P3(look), fov, ...(subject ? { subject: `${this.id}:${subject}` } : {}), ...(core?.length ? { core } : {}) }); }   // core: the pieces of a group too wide for one camera that the shot frames (fitshots names them: C.core(area, name))
  // a shot that looks across a separator into the neighbouring area `to` of the same open-plan home: the glimpse rules let `to` show in it (the subject still stands in this area)
  across(name, from, look, fov, subject, to) { this.shot(name, from, look, fov, subject); this.shots[this.shots.length - 1].across = to; }
  // anything standing on a rug is lifted by its thickness (7 mm), so legs rest on the pile and not in it: done for every floor piece whose middle lies on a rug of this area
  liftOnRugs() {
    const objs = this.h.S.home.objects.filter((o) => o.area === this.id), rugs = objs.filter((o) => o.asset === 'rug');
    for (const o of objs) {
      if (o.asset === 'rug' || (o.mount || ASSETS[o.asset].mount) !== 'floor' || o.at[1] >= 7 || ['curtain', 'scuff', 'leaf', 'heightChart', 'baseRun', 'wallRun', 'fridge'].includes(o.asset)) continue;
      if (rugs.some((r) => { const { w, d } = sizeOf('rug', r.params), t = rad(r.turn || 0), dx = o.at[0] - r.at[0], dz = o.at[2] - r.at[2], lx = dx * Math.cos(t) - dz * Math.sin(t), lz = dx * Math.sin(t) + dz * Math.cos(t); return r.params?.form === 'round' ? Math.hypot(lx, lz) < Math.min(w, d) / 2 : Math.abs(lx) < w / 2 && Math.abs(lz) < d / 2; })) { o.at[1] = 7; if (o.lift === undefined) o.lift = 7; const { w: ow, d: od } = sizeOf(o.asset, o.params), to = rad(o.turn || 0); for (const q of objs) { if (q === o || q.mount !== 'on' || q.at[1] < 20) continue; const dx = q.at[0] - o.at[0], dz = q.at[2] - o.at[2], lx = dx * Math.cos(to) - dz * Math.sin(to), lz = dx * Math.sin(to) + dz * Math.cos(to); if (Math.abs(lx) < ow / 2 && Math.abs(lz) < od / 2) q.at[1] += 7; } }   // what stands on it rises with it
    }
  }
  // a small thing resting on the highest surface under it: a.restOn('cat', 'cat', 'seat', { dx, dz | at, turn, params, group }): a cat on a seat, a cushion on a chair, a book on a pile
  restOn(id, asset, targetId, { at, dx = 0, dz = 0, turn = 0, params, group } = {}) {
    const { tris, all, T } = this.targetTris('restOn', targetId), c = all.getCenter(new T.Vector3()), p = at || [c.x + dx, c.z + dz], pr = vary(this.h, asset, params, this.id), { w, d } = sizeOf(asset, pr);
    const y = this.settleOn('restOn', id, asset, tris, pr, p, turn);
    this.put(id, asset, p, turn, { y, mount: 'on', group: group || this.h.S.home.objects.find((q) => q.id === `${this.id}-${targetId}`)?.group.split(':')[1], params: pr });
  }
  // things on a tablecloth rise by the cloth's thickness (16 mm), so their bases rest on the cloth, not in it: every `on` piece whose middle lies over a cloth's table top and whose base is at the cloth's base height
  liftOnCloths() {
    const objs = this.h.S.home.objects.filter((o) => o.area === this.id), done = new Set();
    for (const c of objs.filter((o) => o.asset === 'tablecloth')) for (const q of objs) {
      if (q === c || q.mount !== 'on' || q.asset === 'tablecloth' || Math.abs(q.at[1] - c.at[1]) > 3 || done.has(q)) continue;
      const dx = q.at[0] - c.at[0], dz = q.at[2] - c.at[2], r = c.params?.r;
      if (r ? Math.hypot(dx, dz) < r : Math.abs(dx) < ((c.params?.w ?? 1600) - 90) / 2 && Math.abs(dz) < ((c.params?.d ?? 900) - 90) / 2) { q.at[1] += 16; done.add(q); }
    }
  }
  alive(list) { if (list.some((e) => e.kind === 'paw')) for (const c of this.h.S.home.objects.filter((o) => o.area === this.id && o.asset === 'curtain')) if ((c.params?.w ?? 1500) < 1370) c.params = { ...c.params, w: 1370 };   // a paw needs a panel (22% of w) of 300 mm or more to hide a cat
    { const asked = this.h.S.home.roll?.areas[this.id]?.doorOpen || 0, got = Math.max(0, ...this.h.S.home.walls.filter((w) => w.id.startsWith(this.id + '-')).flatMap((w) => w.openings || []).filter((o) => o.kind === 'door' && !o.style).map((o) => o.open ?? 0));   // the roll made a plain door the way in ("door standing open N degrees (open: N)"): the spec must hang it that far open
      if (asked && got < asked) throw new Error(`alive('${this.id}'): the roll's way in is a door standing open ${asked} degrees, and the door here is open ${got}: give the door open: ${asked} (or the window or arch the roll did not ask for)`); }
  checkAlive(this.id, this.h.S.home.walls.filter((w) => w.id.startsWith(this.id + '-')), list); const ws = this.h.S.home.walls.filter((w) => w.id.startsWith(this.id + '-')); this.motion = list.map(({ kind }) => { const k = MOTION.kinds[kind]; return { kind, needs: k.needs, ...(k.needs.includes('openWindow') || k.needs.includes('openWay') ? { via: pickVia(ws, k.flies) } : {}) }; });
    for (const e of this.motion) if (e.via && MOTION.kinds[e.kind].flies) {   // a curtain panel across the way in blocks a flier: the middle 500 mm of the opening stays clear (a curtain hangs beside it)
      const W = ws.find((w) => w.id === e.via[0]), op = W?.openings[e.via[1]]; if (!W || !op) continue;
      const len = Math.hypot(W.to[0] - W.from[0], W.to[1] - W.from[1]), xv = len - op.at - (op.kind === 'door' && op.style === 'slider' ? sliderClear(op).off : 0);
      for (const r of (this.h.curtainRecs || []).filter((r) => r.wall === W.id)) {
        const c = this.h.S.home.objects.find((o) => o.id === r.id), w = c?.params?.w ?? 1500, pw = w * 0.22, panels = c?.params?.panels ?? 2;
        const spans = [[r.xc - w / 2 - 40, r.xc - w / 2 - 40 + pw], ...(panels > 1 ? [[r.xc + w / 2 + 40 - pw, r.xc + w / 2 + 40]] : [])];
        if (spans.some(([a, b]) => b > xv - 250 && a < xv + 250)) throw new Error(`alive('${this.id}'): "${e.kind}" comes in through ${e.via[0]} at x ${Math.round(xv)}, and a panel of curtain '${r.id.slice(this.id.length + 1)}' (x ${spans.map(([a, b]) => `${Math.round(a)} to ${Math.round(b)}`).join(' and ')}) hangs across it; a curtain stands beside the opening: move it along the wall, widen it (w) or give it panels 1 on the far side`);
      }
    }
    return this; }   // living things (roll's `motion`; src/motion/index.js)
  out() { this.liftOnRugs(); this.liftOnCloths(); const b = this.worldBounds(); return { id: this.id, name: this.name, ...(this.motion?.length ? { motion: this.motion } : {}), ...(this.planGroup ? { group: this.planGroup } : {}), O: this.O, psi: this.psi, bounds: { ...b, top: this.top }, camera: { home: this.cam, shots: this.shots } }; }
}
export const facing = (from, to) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));   // the turn that makes an object at `from` face `to`, in local x/z
