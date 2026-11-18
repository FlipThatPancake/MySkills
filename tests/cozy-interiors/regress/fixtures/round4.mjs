import { room } from './common.mjs';
// Round 4 false alarms (round-4/a): checks that compared pieces of one area with another area's walls or bounds.
// Two areas side by side: a (x 0 to 5000) and b (placed at x 5000), b's left wall standing where a ends.
const two = (Home, sash) => {
  const H = new Home({ seed: 5, floor: 'plain' }), a = H.area('a', 'A', { rect: [0, 0, 5000, 4000] }), b = H.area('b', 'B', { O: [5000, 0], rect: [0, 0, 5000, 4000] });
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
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'right', arms: 'none', back: 'loose' } }); a.seatSoft('sofa', { cushions: 2, throw: 'drape', tone: 'accent', group: 'seat' }); return H; } },
  { name: 'good-seatsoft-on-a-sofa-with-a-left-chaise', from: 'round 4 tester: the chaise on the left end', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'left', arms: 'rolled', back: 'tight' } }); a.seatSoft('sofa', { cushions: 2, throw: 'band', tone: 'accent', group: 'seat' }); return H; } },
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
      bug('roll-accent-on-not-in-tone', 'round 4 mistake 4: accentOn names the runner and no runner has tone accent', { accentOn: 'runner' }, 'puts the accent on the runner', (a) => a.put('rn', 'runner', [3000, 1800], 90, { group: 'seat', params: { w: 700, l: 2000, form: 'stripe', tone: 'lo' } })),
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
    build({ Home }) { const { H, back } = room(Home); back.place('sh', 'openShelf', 2000, { group: 'g' }); back.place('pic', 'picture', 2760, { group: 'g', y: 1100, params: { w: 600, h: 500 } }); return H; } },
  { name: 'good-open-shelf-and-picture-well-apart', from: 'round 4 G2b: the same two pieces 600 mm apart', kind: 'good', counts: ['placement-4'],
    build({ Home }) { const { H, back } = room(Home); back.place('sh', 'openShelf', 1500, { group: 'g' }); back.place('pic', 'picture', 3400, { group: 'g', y: 1250, params: { w: 600, h: 500 } }); return H; } },
);
