import { roll } from '../../../../skills/cozy-interiors/scene/roll.mjs';
// Round 6 house plan: a home of four areas laid out by the plan stays green; the same areas in a row (no way between them) are the round-5 replay (replays.mjs).
const homeOf = (Home, seed, rooms, touch) => {
  const R = rooms ? roll(seed, rooms.flat(), { rooms, touch }) : roll(seed, touch), H = new Home({ seed }), made = {}; H.roll({ seed, plan: R.plan, openPlan: R.openPlan, areas: {} });   // the plan only: the fixture does not furnish the areas
  for (const id of R.plan.order) {
    const pa = R.plan.areas[id], [w, d] = pa.fit, a = H.area(id, id, { rect: [0, 0, w, d] });
    if (pa.entry?.kind === 'open') { const i = R.openPlan.chain.indexOf(id); H.join(made[pa.parent], a, { layout: R.openPlan.layout === 'corner' && i - 1 === R.openPlan.turn ? 'corner' : 'row', share: R.openPlan.seams[i - 1].overlap }); }
    a.back(w); a.left(d); a.right(d); a.view({ target: [w / 2, 700, d / 2], el: 18 }); made[id] = a;
  }
  return H;
};
export const fixtures = [
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

// what stands between the camera and its target fades out (home.js update; check-openplan orbitIssues): a wardrobe at the side of the room is in the way when the camera swings round; with the fade switched off the orbit check names it
const orbitRoom = (Home, blockerFade) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true, blockerFade }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] }); a.back(6000); a.left(4500); a.right(4500);
  a.put('sofa', 'sofa', [3000, 700], 0, { group: 'seat', hero: true, params: { seats: 3, arms: 'rolled', back: 'tight' } });
  a.put('wd', 'wardrobe', [5200, 1100], 90, { group: 'store' });
  a.view({ target: [3000, 600, 800], az: 20, el: 18 });
  return H;
};
fixtures.push(
  { name: 'orbit-blocker-stays-in-front-of-the-view', from: 'round 6 (Paul): objects between the camera and its target fade out; here the fade is switched off, so the wardrobe stays between camera and sofa when the camera swings round', kind: 'bug', expect: { rules: ['orbit'], ids: ['wd'] },
    build({ Home }) { return orbitRoom(Home, false); } },
  { name: 'good-orbit-blocker-fades', from: 'round 6 (Paul): the same wardrobe fades out while it is in the way; the sofa (the subject) never fades', kind: 'good', counts: ['orbit'],
    build({ Home }) { return orbitRoom(Home, true); } },
);
