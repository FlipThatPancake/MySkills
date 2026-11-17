// @js:kitchen-cuttingBoard — a 300 x 460 x 20 cutting board. form leaning (back on the wall, the old way) | flat (lying on a worktop or table: 460 wide, 300 deep, with a loaf, a knife and a cut cucumber on it) | hanging (upright flat to the wall on its hole) | stacked (two lying on each other, the top one turned a little). Origin: its bottom-left-front corner before the lean.
export function cuttingBoard(kit, { form = 'leaning' } = {}) {
  const lo = { tone: 'lo' }, T = kit.THREE, g = kit.group();
  const board = (w, d, y, spin = 0, hole = false) => { const b = kit.group(); b.add(kit.rbox(-w / 2, y, d / 2, w, 20, d, 8)); if (hole) b.add(kit.cyl(w / 2 - 50, y + 10, 0, 22, 6, { axis: 'y', seg: 20, tone: 'mid' })); b.rotation.y = spin; return b; };
  if (form === 'flat' || form === 'stacked') {
    const under = form === 'stacked' ? 24 : 0;
    if (under) g.add(board(460, 300, 0, 0));
    g.add(board(under ? 430 : 460, under ? 290 : 300, under, under ? 0.18 : 0, !under));
    if (!under) {
      const top = 20;
      const loaf = kit.group(); loaf.add(kit.rbox(-110, top, 55, 220, 70, 110, 30)); loaf.position.set(-70, 0, 20); g.add(loaf);
      const ln = []; for (const k of [-70, -35, 0, 35, 70]) ln.push([k - 70 - 10, top + 62, -42 + 10], [k - 70 + 10, top + 70, 42 - 10 + 20]);   // slashes across the crust
      g.add(kit.lines(ln.map(([x, y, z]) => [x, y, z - 10]), 'lo'));
      const kn = kit.group(); kn.add(kit.rbox(-130, top, 9, 170, 3, 18, 4, lo)); kn.add(kit.rbox(40, top, 10, 100, 14, 20, 6)); kn.rotation.y = 0.35; kn.position.set(110, 0, -70); g.add(kn);   // a blade and a handle
      for (let i = 0; i < 4; i++) g.add(kit.cyl(100 + i * 36, top, 70 + i * 4, 24, 12 - i, { seg: 14, ...lo }));   // slices of cucumber
    }
  } else if (form === 'hanging') {   // upright and flat to the wall, a hole at the top, a cord loop over a hook
    g.add(kit.rbox(0, 0, 20, 300, 460, 20, 24, lo)); g.add(kit.cyl(150, 405, 12, 22, 6, { axis: 'z', seg: 24, ...lo }));
    g.add(kit.lines([[150, 405, 24], [150, 470, 24], [150, 470, 4]], 'mid'));
  } else {
    const b = kit.group(); b.add(kit.rbox(0, 0, 0, 300, 460, 20, 24, lo)); b.add(kit.cyl(150, 405, 12, 22, 6, { axis: 'z', seg: 24, ...lo }));
    b.rotation.x = -0.2; b.position.y = 20 * Math.sin(0.2) + 0.5; g.add(b);   // leans back against the wall (its back-bottom edge would sink 4 mm into the worktop, so it is lifted by that)
  }
  return kit.merge(g);
}
