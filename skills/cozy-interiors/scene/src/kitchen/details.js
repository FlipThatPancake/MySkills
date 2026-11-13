// @js:kitchen-details — the 4× detail pass: small real parts, so the big faces still have something true on them up close.
// Each is its own scene object (scene.json, "detail": true), so the checks measure it and the Settings switch can hide it.
const ring = (cx, cy, z, r, n = 32) => {   // a circle of line segments, flat on a wall (x, y), at depth z
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], [cx + Math.cos(b) * r, cy + Math.sin(b) * r, z]); }
  return p;
};

// A double wall socket, 146 x 86 mm, 9 mm proud of the wall. Origin: its bottom-left corner on the wall.
export function socket(kit) {
  const g = kit.group(), lo = { tone: 'lo' }, D = 9;
  g.add(kit.rbox(0, 0, D, 146, 86, D, 8, lo));
  const L = [];
  for (const cx of [40, 106]) {
    L.push(...ring(cx, 43, D + 0.4, 24));                                  // the round recess
    L.push(...ring(cx - 9.5, 43, D + 0.4, 2.4, 10), ...ring(cx + 9.5, 43, D + 0.4, 2.4, 10));   // two pin holes
  }
  L.push([73, 8, D + 0.4], [73, 78, D + 0.4]);                             // the seam between the two faces
  g.add(kit.lines(L));
  return kit.merge(g);
}

// A light switch, 86 x 86 mm with a rocker. Origin: its bottom-left corner on the wall.
export function lightSwitch(kit) {
  const g = kit.group(), lo = { tone: 'lo' }, D = 9;
  g.add(kit.rbox(0, 0, D, 86, 86, D, 8, lo));
  g.add(kit.rbox(23, 18, D + 4, 40, 50, 4, 4, lo));                        // the rocker
  g.add(kit.lines([[30, 43, D + 4.4], [56, 43, D + 4.4]]));                // its split line
  return kit.merge(g);
}

// The fridge's two front levelling feet, under the carcass corners, in front of the recessed plinth. Origin: the fridge's own origin.
export function fridgeFeet(kit) {
  const g = kit.group(), lo = { tone: 'lo', seg: 16 };
  for (const x of [40, 870]) {
    g.add(kit.cyl(x, 0, -14, 11, 6, lo));                                  // the pad on the floor
    g.add(kit.cyl(x, 6, -14, 6, 34, lo));                                  // the threaded stem up to the carcass
  }
  return kit.merge(g);
}
