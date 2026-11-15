// @js:library-signs — small marks of use drawn as faint lines: a scuffed patch of floor, a fallen leaf, a pencil height chart. All mount 'lines': nothing solid, so they never collide.
const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
// a scuffed patch of floor: a few short faint strokes, origin the middle
export function scuff(kit, { w = 380, seed = 1 } = {}) {
  const r = seeded(seed * 97 + 11), P = [];
  for (let i = 0; i < 6; i++) { const x = (r() - 0.5) * w, z = (r() - 0.5) * w * 0.5, a = 0.35 + (r() - 0.5) * 0.3, l = 60 + r() * 130; P.push([x - Math.cos(a) * l / 2, 2, z - Math.sin(a) * l / 2], [x + Math.cos(a) * l / 2, 2, z + Math.sin(a) * l / 2]); }
  return kit.lines(P, 'lo');
}
// a fallen leaf lying flat: an outline with a midrib, origin the middle
export function leaf(kit, { l = 110, turn = 0.5 } = {}) {
  const P = [], n = 12, pt = (t) => { const w = Math.sin(Math.PI * t) * l * 0.2 * (1 - 0.35 * t); return [(t - 0.5) * l, w]; }, rot = (x, z) => [x * Math.cos(turn) - z * Math.sin(turn), x * Math.sin(turn) + z * Math.cos(turn)];
  for (let i = 0; i < n; i++) for (const s of [-1, 1]) { const a = pt(i / n), b = pt((i + 1) / n), A = rot(a[0], s * a[1]), B = rot(b[0], s * b[1]); P.push([A[0], 2, A[1]], [B[0], 2, B[1]]); }
  const a = rot(-l / 2, 0), b = rot(l / 2 * 0.9, 0); P.push([a[0], 2, a[1]], [b[0], 2, b[1]]);
  return kit.lines(P, 'green');
}
// a pencil height chart on a door frame, facing +z: a long line with a tick every 100 mm and a longer one every 500, origin at its foot
export function heightChart(kit, { h = 1300, seed = 1 } = {}) {
  const r = seeded(seed * 31 + 5), P = [[0, 0, 2], [0, h, 2]];
  for (let y = 100; y <= h; y += 100) { const l = y % 500 === 0 ? 44 : 26; P.push([0, y + (r() - 0.5) * 4, 2], [l, y + (r() - 0.5) * 4, 2]); }
  return kit.lines(P, 'lo');
}
