// Round 6 (tools thread, run i): a floor slot counts what already stands as taken. The hero bed stands first; the floor group takes the floor the bed leaves, or the slot is refused.
const room = (Home) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true }), a = H.area('t', 'T', { rect: [0, 0, 5200, 5800] }), back = a.back(5200, []); a.left(5800, []); a.right(5800, []);
  a.view({ target: [2600, 600, 1800], az: 20, el: 18 });
  return { H, a, back };
};
export const fixtures = [
  { name: 'good-floor-group-stands-clear-of-the-bed', from: 'round 6 tools run i: a bedroom floor group (armchair, coffee table, side table, lamp) was built on the bed in 47 seeds; a floor slot now counts the bed as taken and the group stands where its own footprint is clear', kind: 'good', counts: ['penetrates', 'sunk'],
    build({ Home }) { const { H, a } = room(Home); a.group('bed with a bedside table each side, headboard on a wall without a window', { slot: 'back:middle', hero: true }); a.group('armchair with a floor lamp and a side table', { slot: 'floor:middle' }); return H; } },
  { name: 'floor-slot-with-no-clear-place-is-refused', from: 'round 6 tools run i: a floor group whose footprint cannot clear what stands is refused, not built on top of it', kind: 'bug', refuses: 'leaves no place', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const H = new Home({ seed: 5, floor: 'plain', detached: true }), a = H.area('t', 'T', { rect: [0, 0, 3600, 3300] }); a.back(3600, []); a.left(3300, []); a.right(3300, []); a.view({ target: [1800, 600, 1400], az: 20, el: 18 }); a.group('bed with a bedside table each side, headboard on a wall without a window', { slot: 'back:middle', hero: true }); a.group('armchair with a floor lamp and a side table', { slot: 'floor:back' }); return H; } },
];
