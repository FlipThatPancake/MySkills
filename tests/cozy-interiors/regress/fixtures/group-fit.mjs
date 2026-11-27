// Round 6 (tools run j): groups that stood a piece into a wall, an opening or another piece: the pantry unit over the run's end, a fridge group off its slot, a desk chair under its desk
const room = (Home, openings = [], seed = 5) => {
  const H = new Home({ seed, floor: 'plain', detached: true }), a = H.area('t', 'T', { rect: [0, 0, 6000, 4500] }), back = a.back(6000, openings); a.left(4500, []); a.right(4500, []);
  a.view({ target: [3000, 700, 1200], az: 20, el: 18 });
  return { H, a, back };
};
export const fixtures = [
  { name: 'good-pantry-unit-stands-clear-of-the-run', from: 'round 6 tools run j: the pantry wardrobe stood 150 mm into the run it follows (and the group needs said 2200 against 3420 built, so it also reached walls)', kind: 'good', counts: ['penetrates', 'path', 'swing'],
    build({ Home }) { const { H, a } = room(Home); a.group('tall pantry wall', { slot: 'back:right', hero: true }); return H; } },
  { name: 'good-fridge-and-trolley-stay-in-their-slot', from: 'round 6 tools run j: the fridge stood at the slot middle and the trolley beside it, so the group stuck out of the slot into the corner (trolley 25 mm inside the wall); the group now slides into its bare stretch', kind: 'good', counts: ['penetrates', 'wall'],
    build({ Home }) { const { H, a } = room(Home); a.group('tall unit or fridge with a trolley beside it', { slot: 'back:left', hero: true }); return H; } },
  { name: 'good-desk-chair-stands-clear-of-the-desk', from: 'round 6 tools run j: the desk chair stood 17 to 82 mm inside the desk', kind: 'good', counts: ['penetrates', 'sunk'],
    build({ Home }) { const { H, a } = room(Home, [], 13); a.group('desk under a window', { slot: 'back:middle', hero: true }); return H; } },
];
