// @js:kitchen-counterOven — freestanding toaster-oven style appliance, 450 x 300 x 350 mm, standing on its feet at y = 0.
export function counterOven(kit) {
  const g = kit.group();
  const T = Math.PI * 2;

  // Body and feet
  g.add(kit.rbox(0, 20, 0, 450, 280, 350, 20));
  for (const [x, z] of [[45, -45], [405, -45], [45, -305], [405, -305]]) g.add(kit.cyl(x, 0, z, 16, 20, { rTop: 13, seg: 20 }));
  g.add(kit.cyl(70, 60, -350, 6, 30, { axis: 'z', seg: 16 }));   // power cord stub

  // Door (front plane z = 2), 3 mm gap to the control strip
  g.add(kit.box(12, 32, 2, 328, 256, 10));
  // Window: four frame bars (front z = 4) round a glass pane sunk behind them (front z = 3)
  const fx = 40, fy = 55, fw = 272, fh = 170, b = 6;
  g.add(kit.box(fx, fy, 4, fw, b, 4));
  g.add(kit.box(fx, fy + fh - b, 4, fw, b, 4));
  g.add(kit.box(fx, fy + b, 4, b, fh - 2 * b, 4));
  g.add(kit.box(fx + fw - b, fy + b, 4, b, fh - 2 * b, 4));
  g.add(kit.box(fx + b, fy + b, 3, fw - 2 * b, fh - 2 * b, 3));
  // Diagonal glints on the glass
  const gz = 3.3;
  g.add(kit.lines([
    [fx + 40, fy + 40, gz], [fx + 110, fy + fh - 40, gz],
    [fx + 62, fy + 40, gz], [fx + 132, fy + fh - 40, gz]
  ]));

  // Bar handle standing 20 mm out on two posts
  const hy = 255;
  g.add(kit.cyl(70, hy, 17, 4, 15, { axis: 'z', seg: 16 }));
  g.add(kit.cyl(282, hy, 17, 4, 15, { axis: 'z', seg: 16 }));
  g.add(kit.cyl(58, hy, 17, 5, 236, { axis: 'x', seg: 20 }));

  // Control strip
  g.add(kit.box(343, 32, 2, 95, 256, 6));
  const kx = 390;
  for (const ky of [225, 150]) {
    g.add(kit.cyl(kx, ky, 18, 21, 16, { axis: 'z', seg: 24 }));
    // pointer line on the knob face, and scale ticks on the strip
    g.add(kit.lines([[kx, ky + 4, 18.4], [kx, ky + 19, 18.4]]));
    const t = [];
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * 1.25 - (i / 6) * Math.PI * 1.5;
      t.push([kx + Math.cos(a) * 27, ky + Math.sin(a) * 27, 8.4], [kx + Math.cos(a) * 33, ky + Math.sin(a) * 33, 8.4]);
    }
    g.add(kit.lines(t));
  }
  g.add(kit.cyl(kx, 82, 14, 10, 12, { axis: 'z', seg: 20 }));   // small button
  g.add(kit.lines([[355, 114, 8.4], [425, 114, 8.4]]));        // divider groove

  return kit.merge(g);
}
