// Open-plan tour shots (round 3): a neighbouring area may show only BEHIND the subject of a shot, never in front of it, and never as the subject. Rule in scene/openshot.mjs, reported by check-openplan as `open-shot`.
// A row home of two areas: a kitchen with an island at the seam, a dining area with a table set beyond it.
const home = (Home) => {
  const H = new Home({ seed: 87, floor: 'tiles' }), k = H.area('kitchen', 'Kitchen', { rect: [0, 0, 4800, 4000] });
  const kb = k.back(4800, [{ kind: 'window', x: 1450, width: 1000, height: 1100, sill: 1000, sash: 'fixed' }]);
  k.run(kb, 'run', 800, [{ w: 800, kind: 'sink' }, { w: 600, kind: 'drawers', n: 3 }, { w: 900, kind: 'hob' }], { group: 'cooking', hero: true });
  kb.place('fridge', 'fridge', 340, { group: 'cooking', params: { form: 1 } });
  k.put('island', 'baseRun', [4100, 1200], -90, { group: 'island', sep: 'island', params: { depth: 600, finishedBack: true, modules: [{ w: 600, kind: 'doors' }, { w: 600, kind: 'drawers', n: 3 }, { w: 800, kind: 'doors' }] } });
  k.put('stool1', 'stool', [5030, 1900], 0, { group: 'island', params: { form: 1 } }); k.put('stool2', 'stool', [5030, 2600], 0, { group: 'island', params: { form: 2 } });
  k.view({ target: [2400, 800, 1800], az: 6, el: 13 });
  const d = H.area('dining', 'Dining', { rect: [0, 0, 4400, 4800] }); H.join(k, d, { layout: 'row', share: 750, separators: ['island'] });
  d.back(4400, [{ kind: 'window', x: 3500, width: 1200, height: 1200, sill: 900 }]);
  d.put('rug', 'rug', [2700, 2600], 0, { group: 'dining rug', params: { w: 2500, d: 2500, form: 'round', fringe: 'ends', border: 40 } });
  d.table('dining', { at: [2700, 2600], r: 700, chairs: 4, rug: false, group: 'table set', hero: true });
  d.view({ target: [2300, 800, 2000], az: 7, el: 14 });
  H.floorZones({ kitchen: 'tiles', dining: 'tiles' });
  return H;
};
export const fixtures = [
  { name: 'good-across-island-shot', from: 'open-plan tour shot: the island is the subject, the dining area shows behind it (farther than the island)', kind: 'good',
    build({ Home }) { const H = home(Home); H.list[0].shot('island', [800, 1100, 3300], [4300, 600, 1700], 34, 'island'); return H; } },
  { name: 'shot-neighbour-in-front-of-subject', from: 'round 3 lead: a dining piece stands between the camera and the island (the camera is on the dining side)', kind: 'bug', expect: { rules: ['open-shot'], ids: [] },
    build({ Home }) { const H = home(Home); H.list[0].shot('island', [6700, 1100, 3400], [3800, 600, 1400], 34, 'island'); return H; } },
  { name: 'shot-subject-is-neighbour', from: 'round 3 lead: a kitchen shot whose subject group belongs to the dining area', kind: 'bug', expect: { rules: ['open-shot'], ids: [] },
    build({ Home }) { const H = home(Home); H.list[0].shot('table', [800, 1100, 3300], [6200, 600, 2600], 34, 'island'); return H; },
    patch(S) { S.areas.find((a) => a.id === 'kitchen').camera.shots[0].subject = 'dining:table set'; } },
];
