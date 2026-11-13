// @js:kitchen-fruitBowl — a low bowl of fruit for the corner of the return's counter. Origin: the middle of the bowl's foot on the counter top.
// Apples of different sizes and colours (65-85 mm across), an orange and a pear, piled the way they settle: four apples round the floor of the bowl, the orange on top in the
// middle and the pear lying in the gap at the back. Every coloured fruit carries a faint painted wash (off-white showing through), like the window's painted daylight.
// `group.userData.landing` is a spot on the top fruit (local mm) where the butterfly may rest.
import { paintCanvas } from './paint.js';

export function fruitBowl(kit) {
  const T = kit.THREE, g = kit.group(), lo = { tone: 'lo' };
  // The bowl: 240 mm across, 85 mm high, a thick-lipped dish with a small foot and a thick base the fruit sits on.
  const H = 85, prof = [];
  const rOut = (y) => { const t = y / H; return 50 + 70 * (1 - (1 - t) * (1 - t)); };
  prof.push(new T.Vector2(0.01, 0), new T.Vector2(44, 0), new T.Vector2(47, 5));   // a flat foot ring, so it stands instead of rocking on a point
  for (let i = 1; i <= 10; i++) { const y = H * i / 10; prof.push(new T.Vector2(rOut(y), y)); }
  prof.push(new T.Vector2(116, H + 0.5));
  for (let i = 10; i >= 1; i--) { const y = 46 + (H - 46) * i / 10; prof.push(new T.Vector2(rOut(y) - 5, y)); }
  prof.push(new T.Vector2(0.01, 46));
  g.add(kit.solid(new T.LatheGeometry(prof, 48), 0, 0, 0, { smooth: true, tone: 'lo' }));
  const rim = [];
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, b = (i + 1) / 48 * Math.PI * 2; rim.push([Math.cos(a) * 118, H + 0.6, Math.sin(a) * 118], [Math.cos(b) * 118, H + 0.6, Math.sin(b) * 118]); }
  g.add(kit.lines(rim, 'mid'));
  // @js:kitchen-fruit — the fruit: a pear and painted apples and orange, piled in the bowl
  // the pear, off-white: a lathe bulb (its origin at the bulb's middle) with a narrow neck, lying with its neck toward +x
  const pearProf = [[0.01, 0], [18, 1], [30, 12], [34, 28], [28, 45], [19, 60], [15, 72], [11, 86], [6, 94], [0.01, 96]].map(([r, y]) => new T.Vector2(r, y - 28));
  const pear = kit.solid(new T.LatheGeometry(pearProf, 28), 0, 124, -64, { smooth: true, smoothShade: true, ...lo });
  pear.rotation.set(0.15, 0, -1.2);
  pear.scale.setScalar(0.85);
  g.add(pear);
  const merged = kit.merge(g);

  // The painted fruit are not merged: each carries its own canvas.
  // PAINT_FRUIT = false hides the colour for now: every fruit is plain off-white. Set it to true to bring the painted washes back.
  const PAINT_FRUIT = false;
  const wash = (colours, seed, strength = 0.55) => PAINT_FRUIT ? kit.paint(paintCanvas({ wash: colours, seed, strength })) : kit.fill;
  const stemC = document.createElement('canvas'); stemC.width = stemC.height = 4;
  { const q = stemC.getContext('2d'); q.fillStyle = '#cbc4b8'; q.fillRect(0, 0, 4, 4); }   // shows as a light grey-brown (the paint shader writes the texture as it is)
  const stemMat = PAINT_FRUIT ? kit.paint(stemC) : kit.fill;
  // An apple: a sphere pressed in at the top (the dimple), a little squat, with a short stem.
  const apple = (r, x, y, z, mat, tilt = 0) => {
    const geo = new T.SphereGeometry(r, 28, 20), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const rho = Math.hypot(p.getX(i), p.getZ(i)), up = Math.min(1, Math.max(0, (p.getY(i) / r - 0.3) / 0.5));
      p.setY(i, p.getY(i) * 0.93 - 0.2 * r * Math.exp(-Math.pow(rho / (0.38 * r), 2)) * up);
    }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, mat);
    kit.outline(m, { smooth: true, ...lo });
    const stem = new T.Mesh(new T.CylinderGeometry(1.5, 1.9, 12, 6), stemMat);
    stem.position.set(0, 0.74 * r, 0); stem.rotation.z = 0.25;
    m.add(kit.outline(stem, lo));
    m.position.set(x, y, z); m.rotation.z = tilt;
    return m;
  };
  const d = 58;   // the four round the floor, 90 degrees apart, each resting on the floor (floor 46 mm up) and touching its neighbours
  merged.add(apple(41, d * 0.707, 46 + 41 * 0.93, d * 0.707, wash([[214, 120, 104], [232, 176, 110], [236, 214, 128]], 3), 0.05));                  // red
  merged.add(apple(38, -d * 0.707, 46 + 38 * 0.93, d * 0.707, wash([[170, 198, 120], [198, 214, 142], [222, 224, 162]], 21), -0.08));             // green
  merged.add(apple(35, -d * 0.707, 46 + 35 * 0.93, -d * 0.707, wash([[242, 214, 122], [238, 178, 130], [246, 224, 152]], 17), 0.1));            // yellow with a blush
  merged.add(apple(32.5, d * 0.707, 46 + 32.5 * 0.93, -d * 0.707, wash([[206, 120, 98], [186, 192, 118], [226, 208, 130]], 9), -0.05));        // small, red and green
  const o = new T.Mesh(new T.SphereGeometry(33, 24, 16), wash([[236, 168, 92], [240, 196, 108], [232, 150, 84]], 7));
  o.position.set(0, 122, 0); o.scale.y = 0.97;
  merged.add(kit.outline(o, { smooth: true, ...lo }));                                                                                           // the orange, on top in the middle
  merged.userData.landing = [0, 122 + 33 * 0.97 + 8, 0];
  return merged;
}
