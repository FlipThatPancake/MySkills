// @js:kitchen-fridge — side-by-side fridge-freezer, 910 x 2250 x 700 mm. Doors stand at z = 0, the carcass 2 mm behind.
export function fridge(kit) {
  const g = kit.group();
  const W = 910, H = 2250, D = 700, MID = W / 2, GAP = 3;

  // Recessed plinth strip, then the rounded carcass (front plane z = -2, flat top at y = H).
  g.add(kit.box(25, 0, -25, W - 50, 40, D - 45));
  g.add(kit.rbox(0, 40, -2, W, H - 40, D - 2, 25));

  // Two doors: 2 mm proud, flush with the carcass sides, light-toned, 3 mm gap between them.
  const door = (x0, x1) => kit.rbox(x0, 42, 0, x1 - x0, 2246 - 42, 22, 8, { tone: 'lo' });
  g.add(door(0, MID - GAP / 2));      // flush with the body's sides, so its silhouette is the body's mid line
  g.add(door(MID + GAP / 2, W));

  // Seam line down the gap between the doors, seen through the gap.
  g.add(kit.lines([[MID, 42, -21, ], [MID, 2246, -21]]));

  // Tall vertical bar handles near the seam, 30 mm proud, two posts each.
  const handle = (x) => {
    const r = 9, y0 = 800, y1 = 1700;
    g.add(kit.cyl(x, y0, 30 - r, r, y1 - y0));
    [y0 + 40, y1 - 40].forEach(y => g.add(kit.cyl(x, y, 30 - r, 6, 22, { axis: 'z' })));
  };
  handle(MID - 40);
  handle(MID + 40);

  // Plain control panel on the left door: a 1 mm raised rounded plate, no content.
  g.add(kit.rbox(225 - 70, 1500 - 45, 1, 140, 90, 2, 12, { tone: 'lo' }));

  // The family's fridge door: magnets, sticky notes and a photo on the right door, left of the handles' reach (x > 520), at eye height.
  const T = kit.THREE, lo = { tone: 'lo' };
  // A flat outline [x, y] extruded `h` mm, standing on the door with its bottom at z.
  const shape = (pts, x, y, z, h, rotZ = 0) => {
    const sh = new T.Shape(pts.map(([px, py]) => new T.Vector2(px, py)));
    const m = kit.solid(new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }), x, y, z, lo);
    m.rotation.z = rotZ; return m;
  };
  const star = (r) => { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; p.push([Math.cos(a) * q, Math.sin(a) * q]); } return p; };
  const house = (w) => [[-w / 2, -w / 2], [w / 2, -w / 2], [w / 2, w * 0.1], [0, w * 0.62], [-w / 2, w * 0.1]];
  const round = (p, x, y, r) => p.add(kit.cyl(x, y, 7, r, 7, { axis: 'z', seg: 24, ...lo }));
  const holder = (p, kind, x, y, r) => {   // the magnet that holds a note or the photo, by kind
    if (kind === 'square') p.add(kit.rbox(x - r, y - r, 7.5, 2 * r, 2 * r, 7, 6, lo));
    else if (kind === 'star') p.add(shape(star(r * 1.25), x, y, 0.5, 7));
    else if (kind === 'house') p.add(shape(house(r * 1.9), x, y, 0.5, 7));
    else round(p, x, y, r);
  };
  // free magnets: round, round, square, berry, house, star, two letters
  round(g, 575, 1735, 26); round(g, 850, 1245, 22);
  g.add(kit.rbox(790, 1685, 0, 48, 48, 8, 10, lo));
  const berry = kit.solid(new T.SphereGeometry(28, 20, 16), 835, 1620, 8, { smooth: true, ...lo });
  berry.scale.set(1, 1.1, 0.45); g.add(berry);
  g.add(kit.cyl(835, 1646, 12, 4.5, 14, { seg: 8, ...lo }));
  g.add(shape(house(56), 585, 1010, 0, 8));
  g.add(shape(star(34), 835, 985, 0, 8, 0.2));
  const letter = (x, y, strokes) => {   // a round magnet with a letter drawn on it
    round(g, x, y, 26);
    g.add(kit.lines(strokes.flatMap((st) => st.slice(1).map((p, i) => [[x + st[i][0], y + st[i][1], 7.6], [x + p[0], y + p[1], 7.6]]).flat()), 'mid'));
  };
  letter(690, 1010, [[[-11, -13], [0, 14], [11, -13]], [[-6, -3], [6, -3]]]);                 // A
  letter(715, 1735, [[[-9, -13], [-9, 14]], [[10, 14], [-9, 0], [10, -13]]]);                  // K

  // sticky notes, 100 x 100 mm, each a sheet 1 mm thick that curls off the door along one edge; scribbles, a magnet at the top
  const scribble = (n, seed) => { const pts = []; for (let i = 0; i < n; i++) { const y = 28 - i * 11, len = 26 + ((i * 7 + seed * 5) % 5) * 8; pts.push([-38, y, 1.4], [-38 + Math.min(len, 76), y + ((i + seed) % 3 - 1) * 1.5, 1.4]); } return pts; };
  const sticky = (x, y, rot, curl, kind, seed) => {
    const sheet = new T.PlaneGeometry(100, 100, 1, 12), P = sheet.attributes.position;
    for (let i = 0; i < P.count; i++) { const d = Math.max(0, -P.getY(i) - 50 + curl) / 24; P.setZ(i, 1 + 16 * d * d); P.setY(i, P.getY(i) + 4 * d * d); }
    sheet.computeVertexNormals();
    const note = kit.group();
    note.add(kit.solid(sheet, 0, 0, 0, { smoothShade: true, tone: 'lo' }));
    note.add(kit.lines(scribble(5 + seed % 2, seed)));
    holder(note, kind, 0, 38, 14);
    note.position.set(x, y, 0); note.rotation.z = rot;
    g.add(note);
  };
  sticky(595, 1300, 0.09, 18, 'round', 1);
  sticky(830, 1430, -0.12, 8, 'square', 2);
  sticky(715, 1215, 0.04, 24, 'star', 3);
  sticky(840, 1130, -0.07, 14, 'round', 4);

  // the family photo: a white-bordered print, 150 x 100 mm, held by a magnet at a slight angle
  const photo = kit.group();
  photo.add(kit.rbox(-75, -50, 2.5, 150, 100, 2.5, 3, lo));
  holder(photo, 'house', 0, 47, 15);
  photo.position.set(700, 1565, 0); photo.rotation.z = 0.05;
  g.add(photo);

  const out = kit.merge(g);
  // the print's picture (a drawing, not a fill): a plane on the border, added after the merge
  const cv = document.createElement('canvas'); cv.width = 536; cv.height = 344;
  const q = cv.getContext('2d');
  q.fillStyle = '#f2f4f3'; q.fillRect(0, 0, 536, 344);
  q.fillStyle = '#e6eae8'; q.fillRect(0, 262, 536, 82);
  q.strokeStyle = '#8a8a8f'; q.lineWidth = 4; q.lineCap = q.lineJoin = 'round'; q.fillStyle = '#ffffff';
  const person = (x, base, hh, bw, skirt) => {   // a head and a body, drawn like the kitchen: grey line, white fill
    q.beginPath(); q.arc(x, base - hh * 0.86, hh * 0.15, 0, 7); q.fill(); q.stroke();
    q.beginPath();
    if (skirt) { q.moveTo(x - bw * 0.35, base - hh * 0.66); q.lineTo(x + bw * 0.35, base - hh * 0.66); q.lineTo(x + bw * 0.6, base - hh * 0.28); q.lineTo(x - bw * 0.6, base - hh * 0.28); }
    else { q.rect(x - bw / 2, base - hh * 0.66, bw, hh * 0.4); }
    q.closePath(); q.fill(); q.stroke();
    q.beginPath(); q.moveTo(x - bw * 0.2, base - hh * 0.28); q.lineTo(x - bw * 0.2, base); q.moveTo(x + bw * 0.2, base - hh * 0.28); q.lineTo(x + bw * 0.2, base); q.stroke();
  };
  person(170, 296, 190, 70, false); person(260, 296, 180, 66, true);
  person(345, 296, 112, 44, true); person(400, 296, 96, 40, false);
  q.beginPath(); q.ellipse(468, 284, 22, 12, 0, 0, 7); q.fill(); q.stroke();                       // the cat
  q.beginPath(); q.arc(486, 270, 9, 0, 7); q.fill(); q.stroke();
  q.beginPath(); q.moveTo(480, 262); q.lineTo(482, 253); q.lineTo(487, 261); q.moveTo(489, 262); q.lineTo(493, 254); q.lineTo(495, 264); q.stroke();
  q.beginPath(); q.moveTo(446, 282); q.quadraticCurveTo(430, 268, 438, 254); q.stroke();
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const pic = new T.Mesh(new T.PlaneGeometry(134, 86), mat);
  pic.renderOrder = 1;
  pic.onBeforeRender = () => { mat.opacity = kit.fill.uniforms.uOpacity.value; };
  pic.position.set(700 + 0.0, 1565 - 2, 2.9); pic.rotation.z = 0.05;
  out.add(pic);
  return out;
}
