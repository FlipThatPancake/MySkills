// Round 6 (plan thread): a way through or a window keeps its zone and walking strip; that floor counts as the room's extent (rectfit, floorcover, emptyfloor).
const room = (Home, openings) => {
  const H = new Home({ seed: 5, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 6000, 1400] }), back = a.back(6000, openings);
  a.view({ target: [3000, 700, 700], az: 20, el: 15 });
  for (const [i, x] of [700, 1900, 3100].entries()) back.place('sb' + i, 'sideboard', x, { group: 'g' + i, params: { w: 1100 } });
  return H;
};
export const fixtures = [
  { name: 'good-rect-past-the-furniture-is-the-walkway-to-an-arch', from: 'round 6 plan thread: the plan cuts each wall for a way through and pushes the group aside; the zone and the walking strip in front of an arch are part of the room, so the rect does not reach too far past the furniture', kind: 'good', counts: ['rectfit'],
    build({ Home }) { return room(Home, [{ kind: 'arch', x: 4800, width: 1000, height: 2100 }]); } },
  { name: 'rect-past-the-furniture-away-from-any-way-through', from: 'round 6 plan thread: the same empty floor with the arch beside the furniture (its strip ends 1500 mm short of the rect) stays red', kind: 'bug', expect: { rules: ['rectfit'], ids: ['past the furniture'] },
    build({ Home }) { return room(Home, [{ kind: 'arch', x: 3900, width: 1000, height: 2100 }]); } },
];

const small = (Home, openings) => {
  const H = new Home({ seed: 5, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 4800, 900] }), back = a.back(4800, openings);
  a.view({ target: [2400, 600, 500], az: 0, el: 30 });
  for (const [i, x] of [700, 1900, 3100].entries()) back.place('sb' + i, 'sideboard', x, { group: 'g' + i, params: { w: 1100 } });
  return H;
};
fixtures.push(
  { name: 'good-bare-floor-is-the-walkway-to-an-arch', from: 'round 6 plan thread: the floor in front of an arch is the way through, not an empty patch (emptyfloor and floorcover count the strip)', kind: 'good', counts: ['emptyfloor', 'floorcover'],
    build({ Home }) { return small(Home, [{ kind: 'arch', x: 4200, width: 1000, height: 2100 }]); } },
  { name: 'bare-floor-with-no-way-through-over-it', from: 'round 6 plan thread: the same room with nothing on its right (no way through) keeps the emptyfloor alarm', kind: 'bug', expect: { rules: ['emptyfloor'], ids: ['largest patch of floor'] },
    build({ Home }) { return small(Home, []); } },
);
