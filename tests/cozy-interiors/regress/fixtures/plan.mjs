import { roll, slotFits } from '../../../../skills/cozy-interiors/scene/roll.mjs';
// Round 6 house plan: a home of four areas laid out by the plan stays green; the same areas in a row (no way between them) are the round-5 replay (replays.mjs).
const homeOf = (Home, seed, rooms, touch, shrink = 1, noLikes = false, windows = null, piece = null, beside = null) => {   // windows: 'plan' stands each dealt window at the plan's x; 'on-link' stands one on the way through
  const R = rooms ? roll(seed, rooms.flat(), { rooms, touch, noLikes: noLikes === true, noSpread: noLikes === 'nospread' }) : roll(seed, touch), H = new Home({ seed }), made = {}; H.roll({ seed, plan: R.plan, openPlan: R.openPlan, areas: {} });   // the plan only: the fixture does not furnish the areas
  for (const id of R.plan.order) {
    const pa = R.plan.areas[id], [w, d] = pa.fit.map((v) => Math.round(v * shrink)), a = H.area(id, id, { rect: [0, 0, w, d] });
    if (pa.entry?.kind === 'open') { const i = R.openPlan.chain.indexOf(id); H.join(made[pa.parent], a, { layout: R.openPlan.layout === 'corner' && i - 1 === R.openPlan.turn ? 'corner' : 'row', share: R.openPlan.seams[i - 1].overlap }); }
    const wins = (wall) => windows === 'plan' ? pa.windows.filter((q) => q.wall === wall && q.x !== null).map((q) => ({ kind: 'window', x: q.x, width: q.width, height: 1200, sill: 900, style: 'picture' })) : windows === 'beside' ? ((ls) => { const len = wall === 'back' ? w : d, at = ls.map((l) => (l.a === id ? l.aX : l.bX)); if (!at.length) return []; const xs = []; for (let x = 1000; x <= len - 1000; x += 50) if (at.every((q) => Math.abs(q - x) >= 2450)) xs.push(x); xs.sort((p, q) => Math.min(...at.map((r) => Math.abs(r - p))) - Math.min(...at.map((r) => Math.abs(r - q)))); return xs.length ? [{ kind: 'window', x: xs[0], width: 1500, height: 1200, sill: 900 }] : []; })(R.plan.links.filter((l) => l.kind !== 'open' && ((l.a === id && l.aWall === wall) || (l.b === id && l.bWall === wall)))) : windows === 'on-link' && !wall.done ? R.plan.links.filter((l) => l.kind !== 'open' && ((l.a === id && l.aWall === wall) || (l.b === id && l.bWall === wall))).slice(0, 1).map((l) => ({ kind: 'window', x: l.a === id ? l.aX : l.bX, width: 1500, height: 1200, sill: 900 })) : [];
    const Fb = a.back(w, wins('back')), Fl = a.left(d, wins('left')), Fr = a.right(d, wins('right')); if (piece) for (const [F, len, n] of [[Fb, w, 'b'], [Fl, d, 'l'], [Fr, d, 'r']]) { const wall = { b: 'back', l: 'left', r: 'right' }[n], at = R.plan.links.filter((l) => l.kind !== 'open' && ((l.a === id && l.aWall === wall) || (l.b === id && l.bWall === wall))).map((l) => (l.a === id ? l.aX : l.bX)), xs = []; for (let x = 1000; x <= len - 1000; x += 100) if (at.every((q) => Math.abs(q - x) > 1800)) xs.push(x); if (beside !== null && at.length) xs.splice(0, xs.length, ...[at[0] + beside, at[0] - beside].filter((x) => x > 400 && x < len - 400)); xs.sort((p, q) => Math.abs(p - len / 2) - Math.abs(q - len / 2)); if (xs.length && at.length && (beside === null || n === 'b')) F.place(`${id}-${n}-sb`, piece, xs[0], { group: 'furn' }); }; a.view({ target: [w / 2, 700, d / 2], el: 18 }); made[id] = a;
  }
  return H;
};
export const fixtures = [
  { name: 'room-smaller-than-the-deal-needs', from: 'round 6 (room size from the deal): every area is built at 55% of the cell the plan cut from what the roll dealt, so the dealt groups cannot fit; the plan rule names what the deal needs', kind: 'bug', expect: { rules: ['plan'], ids: ['the deal needs'] },
    build({ Home }) { return homeOf(Home, 7, [['kitchen'], ['living'], ['bedroom']], [['kitchen', 'living'], ['living', 'bedroom']], 0.55); } },
  { name: 'kitchen-only-through-the-bedroom', from: 'round 6 likes table (verdict item 5): the hallway opens on the bedroom and the kitchen opens only on the bedroom, so a private room is the only way from the front door to a shared one', kind: 'bug', expect: { rules: ['plan'], ids: ['kitchen'] },
    build({ Home }) { return homeOf(Home, 2, [['hallway'], ['bedroom'], ['kitchen']], [['hallway', 'bedroom'], ['bedroom', 'kitchen']], 1, true); } },
  { name: 'good-kitchen-through-the-living-room', from: 'round 6 likes table: hallway to living, living to kitchen, bedroom off the hallway: every shared room is reached without crossing the bedroom', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 11, [['hallway'], ['living'], ['kitchen'], ['bedroom']], [['hallway', 'living'], ['living', 'kitchen'], ['hallway', 'bedroom']]); } },
  { name: 'window-stood-on-the-way-through-is-refused', from: 'round 6 tools thread: the dealt window and the plan\'s way through landed on one short wall; here a window is stood where the way through is, and the build refuses it (the plan now keeps the dealt windows clear and prints each one\'s x)', kind: 'bug', refuses: 'too close', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { return homeOf(Home, 5, [['hallway'], ['living'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, 'on-link'); } },
  { name: 'window-on-a-wall-with-a-neighbour-behind-it', from: 'round 6 tester (T7): a window stands on a wall the plan opened to a neighbour; the sash shows the neighbour, which stands right behind it (a window 2.2 m beside the way through, clear of it)', kind: 'bug', expect: { rules: ['plan'], ids: ['behind it'] },
    build({ Home }) { return homeOf(Home, 13, [['hallway'], ['living'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, 'beside'); } },
  { name: 'good-windows-at-the-plans-x-beside-the-ways-through', from: 'round 6 tools thread: every dealt window stands at the x the plan gave it, with the ways through clear beside it; the home builds and stays green', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 10, [['hallway'], ['living'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, 'plan'); } },
  { name: 'good-mated-areas-keep-a-wall-slab-between-them', from: 'round 6 tester (T2): an area mated back to back with its parent stood its wall line on the parent\'s, so each 200 mm slab stood in the other room and every piece on the shared wall fired "200 mm inside a wall"; the mate now leaves the slab\'s thickness between the two wall lines (red before the fix: 200 and 250 mm penetrates on the sideboards)', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 12, [['living'], ['dining'], ['hallway'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, null, 'sideboard'); } },
  { name: 'good-plan-with-a-loop', from: 'round 6 (loops on purpose): four areas in four rooms whose plan has a second way round (two cells grown or stood so their side walls meet one slab apart); every way through is built, none left out', kind: 'good', counts: ['plan'],   // planned with noSpread: with the spread rule on the plan no longer makes loops here, and this home is a strip
    build({ Home }) { const R = roll(15, ['hallway', 'living', 'dining', 'bedroom'], { rooms: [['hallway'], ['living'], ['dining'], ['bedroom']], noSpread: true }); if (!R.plan.links.some((l) => !l.tree && l.kind !== 'open')) throw new Error('seed 15 no longer plans a loop: pick another seed'); return homeOf(Home, 15, [['hallway'], ['living'], ['dining'], ['bedroom']], [], 1, 'nospread'); } },
  { name: 'good-hero-keeps-a-bare-stretch-on-its-wall', from: 'round 6 (rollstats hero-slot-without-stretch): a dining table dealt to the back wall while a window wall took the whole wall; the roll now deals a picture window there and the plan keeps the hero\'s third bare', kind: 'good', counts: ['plan'],
    build({ Home }) { const R = roll(1, ['kitchen', 'dining', 'living']); if (slotFits(R, 'dining')[0] === false) throw new Error('the dining hero has no bare stretch in its slot (hero-slot-without-stretch)'); return homeOf(Home, 1, [['kitchen'], ['dining'], ['living']], []); } },
  { name: 'kitchen-stretched-for-its-ways-through', from: 'round 6 (oversized rooms, seed 14): every way through lengthened the back wall of a one-wall area, so the kitchen came out 12500 x 8700 mm (109 m2) and its things stood far apart; the plan rule names the oversize', kind: 'bug', expect: { rules: ['plan'], ids: ['far more than a kitchen'] },
    build({ Home }) { const H = new Home({ seed: 14, floor: 'plain', detached: true }), a = H.area('kitchen', 'Kitchen', { rect: [0, 0, 12500, 8700] }); a.back(12500); a.left(8700); a.right(8700); a.view({ target: [6250, 700, 4350], el: 18 }); return H; } },
  { name: 'good-kitchen-ways-on-a-side-wall', from: 'round 6 (oversized rooms, seed 14): the same four areas with ways through standing on a side wall of a one-wall area, so the kitchen stays 8400 x 8400 mm and the plan rule is green', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 14, [['dining'], ['living'], ['kitchen'], ['reading-corner']], [['dining', 'living'], ['living', 'kitchen'], ['living', 'reading-corner']]); } },
  { name: 'good-plan-four-areas', from: 'round 6 house plan: living, dining, hallway and bedroom stand in one floor plan with ways through; every area reachable, none overlapping', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 1, [['living'], ['dining'], ['hallway'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']]); } },
];
// the corridor: two ways into one area stay joined by a 900 mm strip of clear floor (check-home `path`); the glide walks it
const corridor = (Home, z) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true });
  const a = H.area('a', 'A', { rect: [0, 0, 5500, 4500] }); a.back(5500, [{ kind: 'arch', x: 1000, width: 1200, to: 'b', beyond: false, depth: 200 }, { kind: 'arch', x: 4500, width: 1200, to: 'c', beyond: false, depth: 200 }]); a.left(4500); a.right(4500);
  for (const [id, x] of [['b', 1000], ['c', 4500]]) { const o = H.area(id, id.toUpperCase(), { rect: [0, 0, 3500, 3500], passage: { from: 'a', wall: 'back', x, via: { wall: 'back', x: 1750 } } }); o.back(3500, [{ kind: 'arch', x: 1750, width: 1200, to: 'a', beyond: false, depth: 200 }]); o.left(3500); o.right(3500); o.view({ target: [1750, 700, 1750], el: 18 }); }
  a.view({ target: [2750, 700, 2250], el: 18 }); a.table('t', { at: [2750, z], w: 1400, d: 800, chairs: 0, group: 'dine' });
  return H;
};
fixtures.push(
  { name: 'table-stands-in-the-corridor-between-two-arches', from: 'round 6 fly-over: a table 900 mm in front of the back wall sits on the line between the area\'s two arches, so the walk between them has to go over it', kind: 'bug', expect: { rules: ['path'], ids: ['corridor'] },
    build({ Home }) { return corridor(Home, 900); } },
  { name: 'good-corridor-between-two-arches-is-clear', from: 'round 6 fly-over: the same two arches with the table in the middle of the room, 900 mm strip clear', kind: 'good', counts: ['path'],
    build({ Home }) { return corridor(Home, 3000); } },
  { name: 'good-plan-seed-79-door-meets-arch', from: 'round 6 checks thread: seed 79 (kitchen, dining, living) had no plan in 600 tries because the kitchen\'s dealt door met the living areas\' dealt arches; the plan now merges them into one arch', kind: 'good', counts: ['plan'],
    build({ Home }) { /* the roll itself must find a plan (it throws when none fits); the scene is a clean stand-in */ roll(79, ['kitchen', 'dining', 'living']); return corridor(Home, 3000); } },
  { name: 'good-plan-seed-42-slider-on-the-only-wall', from: 'round 6 checks thread: seed 42 (home-office, hallway, kitchen) had no plan because the kitchen\'s only wall held a slider door; the kitchen takes a corner backing and the plan places it', kind: 'good', counts: ['plan'],
    build({ Home }) { return homeOf(Home, 42, null, ['home-office', 'hallway', 'kitchen']); } },
);

// T13 (round 6): the glide walks through a way in the wall; a tall cabinet 350 mm beside the way stands off to the side of the camera, not in its frame
fixtures.push(
  { name: 'glide-flies-over-a-wardrobe-beside-the-way', from: 'round 6 (T13, new path Nov 25): the camera crosses a wall high, like a crane, so it no longer comes within 450 mm of furniture; a wardrobe 900 mm beside the way still fills over 30% of the frame at k 0.1 (a large piece near the start view)', kind: 'bug', expect: { rules: ['glide'], ids: ['fills'] },
    build({ Home }) { return homeOf(Home, 10, [['hallway'], ['living'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, null, 'wardrobe', 900); } },
  { name: 'good-glide-past-a-cabinet-beside-the-way-through', from: 'round 6 tester (T13): the glide through a way passes a tall cabinet 350 mm beside it; the check read a box beside the camera as filling the whole frame (red before the fix)', kind: 'good', counts: ['glide'],
    build({ Home }) { return homeOf(Home, 10, [['hallway'], ['living'], ['bedroom']], [['hallway', 'living'], ['hallway', 'bedroom']], 1, false, null, 'glazedCabinet', 1800); } },
);

// what stands between the camera and its target fades out (home.js update; check-openplan orbitIssues): a wardrobe at the side of the room is in the way when the camera swings round; with the fade switched off the orbit check names it
const orbitRoom = (Home, blockerFade, shadowFade = true) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true, blockerFade, shadowFade }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] }); a.back(6000); a.left(4500); a.right(4500);
  a.put('sofa', 'sofa', [3000, 700], 0, { group: 'seat', hero: true, params: { seats: 3, arms: 'rolled', back: 'tight' } });
  a.put('wd', 'wardrobe', [5200, 1100], 90, { group: 'store' });
  a.view({ target: [3000, 600, 800], az: 20, el: 18 });
  return H;
};
fixtures.push(
  { name: 'orbit-blocker-stays-in-front-of-the-view', from: 'round 6 (Paul): objects between the camera and its target fade out; here the fade is switched off, so the wardrobe stays between camera and sofa when the camera swings round', kind: 'bug', expect: { rules: ['orbit'], ids: ['wd'] },
    build({ Home }) { return orbitRoom(Home, false); } },
  { name: 'orbit-faded-piece-keeps-its-contact-shadow', from: 'round 6 (lead): the faded wardrobe left its dark contact shadow on the floor, so the sofa looked as if it hovered over a dark patch; the shadow must fade with its piece (here it does not)', kind: 'bug', expect: { rules: ['orbit'], ids: ['wd'] },
    build({ Home }) { return orbitRoom(Home, true, false); } },
  { name: 'good-orbit-blocker-fades', from: 'round 6 (Paul): the same wardrobe fades out while it is in the way; the sofa (the subject) never fades', kind: 'good', counts: ['orbit'],
    build({ Home }) { return orbitRoom(Home, true); } },
);
