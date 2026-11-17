// Shared helper for regression fixtures: one bare room (plain floor, a back wall along z = 0, a home view) so a fixture is only the few things that show its bug.
// Object ids come out as `t-<id>` (area "t"). Coordinates are mm in the area frame: x along the back wall, z out into the room, y up.
export const room = (Home, { seed = 5, W = 6000, D = 4000, openings = [] } = {}) => {
  const H = new Home({ seed, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, W, D] }), back = a.back(W, openings);
  a.view({ target: [W / 2, 700, D / 2], az: 20, el: 15 });
  return { H, a, back };
};
// a kitchen run on the back wall, from x = 500: modules given as kinds with widths
export const run = (a, back, kinds) => a.run(back, 'run', 500, kinds.map(([kind, w]) => ({ kind, w })), { group: 'run' });
