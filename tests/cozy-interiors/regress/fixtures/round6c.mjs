// Round 6 (lead): a free recipe is never dealt to a wall slot; a.group says so instead of crashing.
const room = (Home) => {
  const H = new Home({ seed: 5, floor: 'plain', detached: true }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] });
  const back = a.back(6000, [{ kind: 'window', x: 2000, width: 1200, height: 1200, sill: 900 }]); a.left(4500, []); a.right(4500, []);
  a.view({ target: [3000, 600, 800], az: 20, el: 18 });
  return { H, a, back };
};
export const fixtures = [
  { name: 'island-on-a-wall-slot-is-refused', from: 'round 6 (lead): the roll dealt "island or table with two stools" to a wall slot and a.group crashed with "undefined is not iterable"; it says a free group stands on the floor', kind: 'bug', refuses: 'stands free on the floor', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { a } = room(Home); a.group('island or table with two stools', { slot: 'back:right' }); } },
  { name: 'island-with-a-wall-but-no-place-is-refused', from: 'round 6 (lead): a.group of a free recipe with wall and xc only used to crash on the missing at', kind: 'bug', refuses: 'stands free on the floor', expect: { rules: ['refused'], ids: [] },
    build({ Home }) { const { a, back } = room(Home); a.group('island or table with two stools', { wall: back, xc: 3000 }); } },
];
