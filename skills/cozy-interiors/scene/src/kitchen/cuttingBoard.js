// @js:kitchen-cuttingBoard — a 300 x 460 x 20 cutting board leaning back on the wall. Origin: its bottom-left-front corner before the lean.
export function cuttingBoard(kit) {
  const lo = { tone: 'lo' };
  const board = kit.group();
  board.add(kit.rbox(0, 0, 0, 300, 460, 20, 24, lo));
  board.add(kit.cyl(150, 405, 12, 22, 6, { axis: 'z', seg: 24, ...lo }));   // hanging hole
  board.rotation.x = -0.2;   // leans back against the wall
  const g = kit.group();
  g.add(board);
  return kit.merge(g);
}
