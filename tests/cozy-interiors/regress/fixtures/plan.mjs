import { roll } from '../../../../skills/cozy-interiors/scene/roll.mjs';
// Round 6 house plan: a home of four areas laid out by the plan stays green; the same areas in a row (no way between them) are the round-5 replay (replays.mjs).
const homeOf = (Home, seed, rooms, touch) => {
  const R = roll(seed, rooms.flat(), { rooms, touch }), H = new Home({ seed }), made = {}; H.roll({ seed, plan: R.plan, openPlan: R.openPlan, areas: {} });   // the plan only: the fixture does not furnish the areas
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
