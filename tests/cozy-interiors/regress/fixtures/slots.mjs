// Round 6 slots (compose a.slots(), a.group(phrase, { slot }), wall.place(id, asset, 'right')): a group goes where the shell says there is room; a slot with no room refuses with the free ones named.
const room = (Home, entries = true) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] });
  const back = a.back(6000, [{ kind: 'window', x: 2000, width: 1200, height: 1200, sill: 900 }]), left = a.left(4500, entries ? [{ kind: 'arch', x: 2200, width: 1000, height: 2100, to: 'x' }] : []); a.right(4500, entries ? [{ kind: 'door', x: 1200, width: 900, height: 2100, to: 'y' }] : [{ kind: 'window', x: 1500, width: 1000, height: 1200, sill: 900 }]);
  a.view({ target: [3000, 600, 800], az: 20, el: 18 });
  return { H, a, back, left };
};
export const fixtures = [
  { name: 'slot-over-an-arch-is-refused', from: 'round 6 slots: the left wall\'s middle third holds an arch with its zone, so under 600 mm is bare; a group asked for that slot is refused and the free slots are named', kind: 'bug', refuses: 'the recipe needs', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { a } = room(Home); a.group('sideboard or dresser with a still life and a picture', { slot: 'left:middle' }); } },
  { name: 'slot-on-the-corridor-is-refused', from: 'round 6 slots: the middle of the floor lies on the line between the arch and the door (900 mm corridor), so a floor group asked for it is refused', kind: 'bug', refuses: 'corridor between the area\'s entries', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { a } = room(Home); a.group('island or table with two stools', { slot: 'floor:middle:middle' }); } },
  { name: 'place-slot-on-another-wall-is-refused', from: 'round 6 slots: wall.place takes a slot of its own wall; a slot named for another wall is refused', kind: 'bug', refuses: 'on another wall', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { back } = room(Home); back.place('pic', 'picture', 'left:middle', { y: 1400, group: 'art' }); } },
  { name: 'slot-narrower-than-the-recipe-is-refused', from: 'round 6 tools thread: back:left holds 1100 mm of bare wall beside the window curtain zone, the sideboard recipe needs 1200, so it would sink into the corner wall; the slot is refused and the slots that fit are named', kind: 'bug', refuses: 'the recipe needs', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { a } = room(Home); a.group('sideboard or dresser with a still life and a picture', { slot: 'back:left' }); } },
  { name: 'good-groups-in-free-slots', from: 'round 6 slots: a sideboard group on the back wall\'s right third and a table group on the floor\'s back-middle band, both through slot names, stay green', kind: 'good', counts: ['placement'],
    build({ Home }) { const { H, a } = room(Home, false); a.group('sideboard or dresser with a still life and a picture', { slot: 'back:right' }); a.group('island or table with two stools', { slot: 'floor:middle:middle' }); return H; } },
];
