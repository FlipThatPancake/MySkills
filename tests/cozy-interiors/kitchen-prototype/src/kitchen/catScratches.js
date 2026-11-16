// @js:kitchen-catScratches — cat scratches on the return's outer end panel (z = 1500 facing the room): groups of
// 3-4 claw marks 40-90 mm long, 6-8 mm apart and slightly bowed, 120-420 mm above the floor. Faintest line, a hair proud of the panel, so they show only up close.
// Lines only (no fill), so the scene checks skip it. Kitchen millimetres: scene.json places it at the origin.
export function catScratches(kit) {
  const scratch = [], PZ = 1500.8;
  const groups = [[170, 330, 0.25, 4], [214, 250, 0.1, 3], [330, 410, -0.2, 4], [372, 200, 0.04, 3]];   // x, top y, lean (rad), strokes
  groups.forEach(([gx, gy, lean, n], gi) => {
    for (let k = 0; k < n; k++) {
      const len = 40 + ((gi * 3 + k * 5) % 6) * 9, bow = 2 + ((gi + k) % 3), x0 = gx + k * (6 + (k % 2)) - n * 3.5;
      let prev = null;
      for (let i = 0; i <= 6; i++) {
        const t = i / 6, p = [x0 + Math.sin(lean) * len * t + Math.sin(t * Math.PI) * bow, gy - Math.cos(lean) * len * t, PZ];
        if (prev) scratch.push(prev, p);
        prev = p;
      }
    }
  });

  return kit.group().add(kit.lines(scratch, 'faint'));
}
