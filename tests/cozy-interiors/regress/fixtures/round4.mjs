import { room } from './common.mjs';
// Round 4 false alarms (round-4/a): checks that compared pieces of one area with another area's walls or bounds.
// Two areas side by side: a (x 0 to 5000) and b (placed at x 5000), b's left wall standing where a ends.
const two = (Home, sash) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true }), a = H.area('a', 'A', { rect: [0, 0, 5000, 4000] }), b = H.area('b', 'B', { O: [5000, 0], rect: [0, 0, 5000, 4000] });
  const ab = a.back(5000); const bl = b.left(4000, [{ kind: 'window', x: 1500, width: 1200, height: 1200, sill: 900, ...(sash ? { sash } : {}) }]); b.back(5000);
  a.view({ target: [2500, 700, 2000], az: 20, el: 15 }); b.view({ target: [2500, 700, 2000], az: 20, el: 15 });
  return { H, a, b, bl, ab };
};
export const fixtures = [
  { name: 'good-sill-ignores-a-tall-piece-of-the-next-area', from: 'round 4 tester: a fridge of the next area stands behind the bedroom-left wall plane and was reported as standing in front of its window (the sill rule had no own-area test)', kind: 'good',
    build({ Home }) { const { H, a, b } = two(Home); a.put('fridge', 'fridge', [4500, 2500], 90, { group: 'g' }); b.table('bt', { at: [3000, 2200], w: 1600, d: 900, chairs: 2, group: 'table set', hero: true }); return H; } },
  { name: 'good-floorcover-in-an-area-placed-away-from-the-origin', from: 'round 4 tester: floorcover converted world bounds to world again, so an area at O = [17450, 0] read 0% cover', kind: 'good', counts: ['floorcover'],
    build({ Home }) { const { H, b } = two(Home); b.table('bt', { at: [3000, 2000], w: 1600, d: 900, chairs: 2, group: 'table set', hero: true }); return H; } },
];
fixtures.push(
  { name: 'good-sofa-with-its-default-chaise', from: 'round 4 tester: a sofa with the default chaise was flagged by the seat rule until chaise: none', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true }); a.coffeeTable('ct', 'sofa', { group: 'seat' }); return H; } },
  { name: 'good-fixed-window-where-the-roll-needs-no-open-window', from: 'round 4 tester: sash: fixed was refused (the window rule wants something in the sweep) although the area has only floor-bound living things', kind: 'good',
    build({ Home }) { const { H, b } = two(Home, 'fixed'); b.put('sofa', 'sofa', [2500, 3300], 180, { group: 'seat', hero: true }); b.alive([{ kind: 'cat' }]); return H; } },
  { name: 'good-seatsoft-on-a-sofa-with-a-chaise', from: 'round 4 tester: a sofa dealt a chaise got cushions in front of the seats (sunk in the rug, leaning on nothing) and a throw that slid off; the cushions belong on the seats beside the chaise', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'right', arms: 'none', back: 'loose' } }); a.seatSoft('sofa', { cushions: 2, throw: 'drape', tone: 'mid', group: 'seat' }); return H; } },
  { name: 'good-seatsoft-on-a-sofa-with-a-left-chaise', from: 'round 4 tester: the chaise on the left end', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'left', arms: 'rolled', back: 'tight' } }); a.seatSoft('sofa', { cushions: 2, throw: 'band', tone: 'mid', group: 'seat' }); return H; } },
  { name: 'good-sofa-with-a-chaise-backs-onto-its-wall', from: 'round 4 tester: the seating rule measured the back of a sofa from the middle of its box, which a chaise pushes 200 mm forward, so the back read 405 mm from the wall', kind: 'good',
    build({ Home }) { const { H, ab } = two(Home); ab.place('sofa', 'sofa', 2500, { group: 'seat', hero: true, params: { seats: 3, chaise: 'right', arms: 'none', back: 'loose' } }); return H; } },
  { name: 'sill-message-names-what-to-change-for-a-bench', from: 'round 4 tester: pair window (sill 450) plus a bench: the sill message told a bench owner to lower a bed headboard; it now names the sill to raise or the piece height', kind: 'bug', expect: { rules: ['sill'], ids: ['raise the window'] },
    build({ Home }) { const { H, a, back } = room(Home, { openings: [{ kind: 'window', x: 3000, width: 1400, height: 1500, sill: 450, sash: 'fixed' }] }); a.put('bench', 'bench', [3000, 250], 0, { group: 'g' }); return H; } },
  ...(() => {   // G2: every roll field that names a thing is in the scene, or a.skip says why
    const R = (a) => ({ seed: 1, areas: { t: { hero: 'a sofa', accents: [], signs: [], pieces: [], plantAt: [], passages: [], groups: ['sofa with a rug and coffee table (the hero group, on the left of the home view)'], still: [], ...a } } });
    const sofa = (a, x = 1500) => a.put('sofa', 'sofa', [x, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'none' } });
    const bug = (name, from, roll, id, extra) => ({ name, from, kind: 'bug', expect: { rules: ['rolled'], ids: [id] }, build({ Home }) { const { H, a } = room(Home); H.roll(R(roll)); sofa(a); extra?.(a); return H; } });
    return [
      bug('roll-accent-dropped', 'round 4 mistake 4: the roll names a fruit bowl as an accent and the area has none, with no a.skip', { accents: ['fruit bowl'] }, 'accent "fruit bowl"'),
      bug('roll-foreground-dropped', 'round 4 mistake 4: the roll names a footstool as the foreground piece', { foreground: 'footstool' }, 'foreground piece "footstool"'),
      bug('roll-piece-dropped', 'round 4 mistake 4: the roll lists a curtain at a window as a piece', { pieces: ['curtain at a window'] }, 'piece "curtain at a window"'),
      bug('roll-sign-dropped', 'round 4 mistake 4: the roll deals sofa scratches as a sign', { signs: ['sofa scratches'] }, 'sign "sofa scratches"'),
      bug('roll-named-extra-dropped', 'round 4 mistake 4: the roll deals a laundry hamper (hamper) among the extras', { more: ['laundry hamper (hamper)'], named: undefined }, 'extra "laundry hamper'),
      bug('roll-hero-lacks-its-rug', 'round 4 mistake 4: the roll hero is a sofa with a rug and a coffee table and the hero group holds no rug', { hero: 'sofa with a rug and coffee table' }, 'hero "sofa with a rug and coffee table" needs rug'),
      bug('roll-group-not-built', 'round 4 mistake 4: the roll deals a bench group with a blanket and a basket and a chest group stands there instead (the count still matched)', { groups: ['sofa with a rug and coffee table (the hero group, on the left of the home view)', 'bench at a wall with a blanket and a basket, on the back wall, right third'] }, 'group "bench at a wall with a blanket and a basket" is not in the scene', (a) => a.put('chest', 'sideboard', [4500, 300], 0, { group: 'chest' })),
      bug('roll-hero-on-the-wrong-side', 'round 4 mistake 4: the roll puts the hero group on the right of the home view and it stands on the left', { side: 'right' }, 'puts the hero group on the right', (a) => a.put('chest', 'sideboard', [4800, 300], 0, { group: 'chest' })),
      { name: 'good-roll-fields-skipped-with-a-reason', from: 'a roll thing left out says why with a.skip, whatever field names it', kind: 'good',
        build({ Home }) { const { H, a } = room(Home); H.roll(R({ accents: ['fruit bowl'], foreground: 'footstool', signs: ['sofa scratches'], pieces: ['curtain at a window'] })); a.skip('fruitBowl', 'the hob is the subject here'); a.skip('footstool', 'no room'); a.skip('scratches', 'sofa is new'); a.skip('curtain', 'the window is bare glass'); a.put('sofa', 'sofa', [1500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'none' } }); return H; } },
    ];
  })(),
  { name: 'swing-reaches-a-reading-chair-under-the-sill', from: 'round 4 tester: a pair window (sill 650) over a reading chair: its sweep reaches the chair (guard: the swing rule covers chairs under a sill)', kind: 'bug', expect: { rules: ['swing'], ids: ['t-rc'] },
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'window', x: 3000, width: 1100, height: 1500, sill: 650, style: 'pair' }] }); a.put('rc', 'readingChair', [3000, 480], 0, { group: 'g', hero: true }); a.put('fs', 'footstool', [3000, 1100], 0, { group: 'g' }); return H; } },
);
// G3 composition rules
{
  const isl = (a, x, z) => a.put('isl', 'baseRun', [x, z], 0, { group: 'island', params: { depth: 600, finishedBack: true, modules: [{ w: 900, kind: 'doors' }, { w: 900, kind: 'drawers', n: 3 }] } });
  const three = (back) => { for (const [i, x] of [700, 1900, 3100].entries()) back.place('sb' + i, 'sideboard', x, { group: 'g' + i, params: { w: 1100 } }); };
  fixtures.push(
    { name: 'composition-bare-floor-over-40-percent', from: 'round 4 G3: a rect whose largest furniture-free patch is more than 40% of it', kind: 'bug', expect: { rules: ['emptyfloor'], ids: ['largest patch of floor'] },
      build({ Home }) { const { H, back } = room(Home); three(back); return H; } },
    { name: 'good-composition-furniture-spread-over-the-rect', from: 'round 4 G3: a small rect whose floor is used', kind: 'good', counts: ['emptyfloor', 'rectfit'],
      build({ Home }) { const { H, a, back } = room(Home, { W: 2800, D: 3000 }); back.place('sb', 'sideboard', 1900, { group: 'g', hero: true, params: { w: 1400 } }); a.table('bt', { at: [900, 1900], w: 1400, d: 800, chairs: 2, group: 'g3' }); return H; } },
    { name: 'composition-rect-much-larger-than-the-furniture', from: 'round 4 G3: compose asks for the smallest rect that holds the groups; here it reaches 2 m past the furniture', kind: 'bug', expect: { rules: ['rectfit'], ids: ['past the furniture'] },
      build({ Home }) { const { H, back } = room(Home); three(back); return H; } },
    { name: 'wall-art-hidden-behind-the-bed-top', from: 'round 4 G3: a picture hung 137 mm behind the headboard top, so the bed hides its lower edge', kind: 'bug', expect: { rules: ['artbehind'], ids: ['t-pic'] },
      build({ Home }) { const { H, a, back } = room(Home); a.put('bed', 'bed', [3000, 1100], 0, { group: 'g', hero: true }); back.place('pic', 'picture', 3000, { group: 'g', y: 1150, params: { w: 700, h: 500 } }); return H; } },
    { name: 'opening-against-a-wall-corner', from: 'round 4 G3: a window with 0 mm beside it in a corner', kind: 'bug', expect: { rules: ['cornerop'], ids: ['mm from the wall corner'] },
      build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'window', x: 600, width: 1200, height: 1200, sill: 900, sash: 'fixed' }] }); a.left(4000, []); a.put('sb', 'sideboard', [3000, 300], 0, { group: 'g', hero: true }); return H; } },
    { name: 'chair-too-close-to-an-island-behind-it', from: 'round 4 G3: a chair 145 mm from an island, so it can not be pulled out', kind: 'bug', expect: { rules: ['chairback'], ids: ['chair'] },
      build({ Home }) { const { H, a } = room(Home); a.table('bt', { at: [3000, 2300], w: 1600, d: 900, chairs: 2, group: 'g', hero: true }); isl(a, 3000, 3300); return H; } },
    { name: 'rug-edge-meets-an-island', from: 'round 4 G3: a rug 64 mm from an island', kind: 'bug', expect: { rules: ['rugrun'], ids: ['t-rug'] },
      build({ Home }) { const { H, a } = room(Home); isl(a, 3000, 1000); a.put('rug', 'rug', [3000, 1850], 0, { group: 'g', params: { w: 2400, d: 1500 } }); a.put('c1', 'chestOfDrawers', [5500, 300], 0, { group: 'g2' }); a.put('c2', 'chestOfDrawers', [700, 300], 0, { group: 'g3' }); return H; } },
    { name: 'footstool-beyond-the-low-table', from: 'round 4 G3: a footstool beyond the coffee table, not in front of the chair', kind: 'bug', expect: { rules: ['footstool'], ids: ['t-fs'] },
      build({ Home }) { const { H, a } = room(Home); a.put('sofa', 'sofa', [3000, 600], 0, { group: 'g', hero: true, params: { seats: 3, chaise: 'none' } }); a.coffeeTable('ct', 'sofa', { group: 'g' }); a.put('fs', 'footstool', [3000, 2900], 0, { group: 'g' }); return H; } },
    { name: 'good-footstool-at-the-sofa-front', from: 'round 4 G3: a footstool in front of the sofa', kind: 'good', counts: ['footstool'],
      build({ Home }) { const { H, a } = room(Home); a.put('sofa', 'sofa', [3000, 600], 0, { group: 'g', hero: true, params: { seats: 3, chaise: 'none' } }); a.put('fs', 'footstool', [3000, 1300], 0, { group: 'g' }); return H; } },
  );
}
fixtures.push(
  { name: 'open-shelf-beside-a-picture-at-shelf-height', from: 'round 4 G2b: the left-wall open shelf with jars stands next to the bench picture and crosses it in the home view; rule 4 read a name list that left openShelf out', kind: 'bug', expect: { rules: ['placement-4'], ids: ['mm from'] },
    build({ Home }) { const { H, back } = room(Home); back.place('sh', 'openShelf', 2000, { group: 'g' }); back.place('pic', 'picture', 2760, { overlap: true, group: 'g', y: 1100, params: { w: 600, h: 500 } }); return H; } },
  { name: 'good-open-shelf-and-picture-well-apart', from: 'round 4 G2b: the same two pieces 600 mm apart', kind: 'good', counts: ['placement-4'],
    build({ Home }) { const { H, back } = room(Home); back.place('sh', 'openShelf', 1500, { group: 'g' }); back.place('pic', 'picture', 3400, { group: 'g', y: 1250, params: { w: 600, h: 500 } }); return H; } },
);
// G4: the two sides of a bed are a pair
{
  const bed = (a, p1, p2) => { a.put('bed', 'bed', [3000, 1100], 0, { group: 'g', hero: true }); for (const [id, x, p] of [['n1', 1950, p1], ['n2', 4050, p2]]) { a.put(id, 'bedsideTable', [x, 350], 0, { group: 'g' }); a.put('l' + id, 'bedsideLamp', [x, 350], 0, { group: 'g', y: 520, mount: 'on', ...(p ? { params: p } : {}) }); } };
  fixtures.push(
    { name: 'pair-bedside-lamps-differ-either-side-of-a-bed', from: 'round 4 mistake 7: the two bedside lamps of one bed were dealt different shades and bases', kind: 'bug', expect: { rules: ['lights'], ids: ['ln2'] },
      build({ Home }) { const { H, a } = room(Home); bed(a, { shade: 'drum', base: 'gourd' }, { shade: 'globe', base: 'tripod' }); return H; } },
    { name: 'good-bedside-lamps-of-one-pair-match', from: 'round 4 G4: params pair gives both sides one deal', kind: 'good', counts: ['pair', 'lights'],
      build({ Home }) { const { H, a } = room(Home); bed(a, { pair: 'bed' }, { pair: 'bed' }); return H; } },
  );
}
// G5: a passage has two ends
{
  const homeOf = (Home, connect) => {
    const H = new Home({ seed: 5, floor: 'plain' }), a = H.area('a', 'A', { rect: [0, 0, 5000, 4000] });
    a.back(5000); a.right(4000, [{ kind: 'arch', x: 2000, width: 1200, to: 'b', beyond: false, depth: 200 }]);
    const b = H.area('b', 'B', { rect: [0, 0, 4000, 4000], ...(connect ? { passage: { from: 'a', wall: 'right', x: 2000, via: { wall: 'left', x: 1500 } } } : { O: [8000, 0] }) });
    b.back(4000); b.left(4000, [{ kind: 'arch', x: 1500, width: 1200, to: 'a', beyond: false, depth: 200 }]);
    a.view({ target: [2500, 700, 2000], az: 20, el: 15 }); b.view({ target: [2000, 700, 2000], az: 20, el: 15 });
    a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true }); b.put('sofa', 'sofa', [2800, 600], 0, { group: 'bed', hero: true });
    return H;
  };
  fixtures.push(
    { name: 'passage-leads-across-a-gap', from: 'round 4 mistake 8: the arch of one area opens 3 m from the arch of the area it leads to, so the glide crosses nothing', kind: 'bug', expect: { rules: ['plan'], ids: ['leads to b'] },
      build({ Home }) { return homeOf(Home, false); } },
    { name: 'good-passage-with-both-ends-on-one-spot', from: 'round 4 G5: area b placed by its passage: the two arches stand on one spot', kind: 'good', counts: ['plan'],
      build({ Home }) { return homeOf(Home, true); } },
  );
}
// G6: compose refuses a piece that lands inside another on the same wall
fixtures.push(
  { name: 'compose-refuses-a-piece-landing-inside-another', from: 'round 4 confusion 3: back.place put a picture and a shelf on the same spot of one wall after a mix-up about which way x runs', kind: 'bug', refuses: 'lands inside', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { H, back } = room(Home); back.place('sh', 'openShelf', 2000, { group: 'g' }); back.place('sh2', 'openShelf', 2100, { group: 'g' }); return H; } },
  { name: 'good-compose-allows-a-picture-above-a-sideboard', from: 'round 4 G6: a piece above another on the same wall is fine', kind: 'good', counts: ['placement-4'],
    build({ Home }) { const { H, back } = room(Home); back.place('sb', 'sideboard', 2000, { group: 'g', params: { w: 1400 } }); back.place('pic', 'picture', 2000, { group: 'g', y: 1250, params: { w: 900, h: 600 } }); return H; } },
);
// U10: one type per light in a room
fixtures.push(
  { name: 'lights-sconces-of-one-room-differ', from: 'round 4 U10: the two wall sconces of the bedroom were a cone and a globe, one swing arm and one short', kind: 'bug', expect: { rules: ['lights'], ids: ['s2'] },
    build({ Home }) { const { H, a, back } = room(Home); a.put('bed', 'bed', [3000, 1100], 0, { group: 'g', hero: true }); back.place('s1', 'wallSconce', 1900, { group: 'g', params: { arm: 'swing', shade: 'cone' } }); back.place('s2', 'wallSconce', 4100, { group: 'g', params: { arm: 'short', shade: 'globe' } }); return H; } },
  { name: 'good-lights-dealt-by-compose-match', from: 'round 4 U10: compose gives every sconce of an area the first one form', kind: 'good', counts: ['lights'],
    build({ Home }) { const { H, a, back } = room(Home); a.put('bed', 'bed', [3000, 1100], 0, { group: 'g', hero: true }); a.put('n1', 'bedsideTable', [1950, 350], 0, { group: 'g' }); a.put('n2', 'bedsideTable', [4050, 350], 0, { group: 'g' }); back.place('s1', 'wallSconce', 1900, { group: 'g' }); back.place('s2', 'wallSconce', 4100, { group: 'g' }); return H; } },
);
// U7 / U8
{
  const win = { kind: 'window', x: 1100, width: 1200, height: 1200, sill: 900, sash: 'out' };
  fixtures.push(
    { name: 'tall-piece-beside-a-window-round-the-corner', from: 'round 4 U7: a wardrobe on the left wall stands against the corner and covers the bedroom window on the back wall', kind: 'bug', expect: { rules: ['cornerop'], ids: ['a tall piece stands'] },
      build({ Home }) { const { H, a } = room(Home, { openings: [win] }); const left = a.left(4000, []); left.place('wd', 'wardrobe', 3400, { group: 'g', hero: true }); return H; } },
    { name: 'good-tall-piece-far-from-the-window-corner', from: 'round 4 U7: the same wardrobe at the front of the left wall', kind: 'good', counts: ['cornerop'],
      build({ Home }) { const { H, a } = room(Home, { openings: [win] }); const left = a.left(4000, []); left.place('wd', 'wardrobe', 800, { group: 'g', hero: true, anywhere: true }); return H; } },
    { name: 'wall-art-too-low-over-a-sideboard', from: 'round 4 U8: a picture 50 mm above the sideboard top is half hidden behind it in angled views', kind: 'bug', expect: { rules: ['artbehind'], ids: ['t-pic'] },
      build({ Home }) { const { H, back } = room(Home); back.place('sb', 'sideboard', 3000, { group: 'g', params: { w: 1400 } }); back.place('pic', 'picture', 3000, { group: 'g', y: 850, params: { w: 900, h: 500 } }); return H; } },
    { name: 'good-art-without-y-hangs-above-the-piece-below', from: 'round 4 U8: compose hangs art given no y 200 mm above the piece under it', kind: 'good', counts: ['artbehind'],
      build({ Home }) { const { H, back } = room(Home); back.place('sb', 'sideboard', 3000, { group: 'g', params: { w: 1400 } }); back.place('pic', 'picture', 3000, { group: 'g', params: { w: 900, h: 650 } }); return H; } },
    { name: 'plant-in-front-of-a-chest-of-drawers', from: 'round 4 U9: a floor plant stands in the front zone of the bedroom chest, so a drawer cannot open', kind: 'bug', expect: { rules: ['path'], ids: ['t-fp'] },
      build({ Home }) { const { H, a, back } = room(Home); back.place('ch', 'chestOfDrawers', 3000, { group: 'g', hero: true }); a.put('fp', 'floorPlant', [3000, 750], 0, { group: 'g' }); return H; } },
  );
}
// U11: a bedroom window has a curtain
{
  const bedroom = (Home, curtain, blind) => { const H = new Home({ seed: 5, floor: 'boards' }), a = H.area('bedroom', 'Bedroom', { rect: [0, 0, 6000, 4000] }), back = a.back(6000, [{ kind: 'window', x: 4500, width: 1400, height: 1400, sill: 900, sash: 'out' }]); a.view({ target: [3000, 700, 2000], az: 20, el: 15 }); a.put('sofa', 'sofa', [1300, 600], 0, { group: 'g', hero: true }); if (curtain) back.place('cu', 'curtain', 4500, { group: 'g' }); if (blind) back.place('bl', 'blind', 4500, { group: 'g', y: 900, params: { w: 1700, h: 1400 } }); return H; };
  fixtures.push(
    { name: 'bedroom-window-without-a-curtain', from: 'round 4 U11: the bedroom window had no curtain or blind', kind: 'bug', expect: { rules: ['curtain'], ids: ['bedroom window'] }, build({ Home }) { return bedroom(Home, false); } },
    { name: 'good-bedroom-window-with-a-blind', from: 'round 4 U11: a blind covers the bedroom window as well as a curtain does', kind: 'good', counts: ['curtain'], build({ Home }) { return bedroom(Home, false, true); } },
    { name: 'good-bedroom-window-with-a-curtain', from: 'round 4 U11: the same bedroom with a curtain', kind: 'good', counts: ['curtain'], build({ Home }) { return bedroom(Home, true); } },
  );
}
// the user, Nov 18: nothing driven by wind moves where no window opens; one mover is enough
{
  const homeW = (Home, sash) => { const { H, a, back } = room(Home, { openings: [{ kind: 'window', x: 4500, width: 1400, height: 1400, sill: 900, sash }] }); a.put('sofa', 'sofa', [1300, 600], 0, { group: 'g', hero: true }); back.place('cu', 'curtain', 4500, { group: 'g' }); return H; };
  fixtures.push(
    { name: 'wind-mover-in-an-area-without-an-open-window', from: 'the user, Nov 18: a wind-stirred plant in an area whose only window is fixed', kind: 'bug', expect: { rules: ['windmover'], ids: ['driven by wind'] }, build({ Home }) { return homeW(Home, 'fixed'); }, patch(S) { S.areas[0].motion = [{ kind: 'wind' }]; } },
    { name: 'good-cat-alone-where-no-window-opens', from: 'the user, Nov 18: one mover that needs no wind is enough', kind: 'good', counts: ['windmover'], build({ Home }) { return homeW(Home, 'fixed'); }, patch(S) { S.areas[0].motion = [{ kind: 'cat' }]; } },
  );
}
