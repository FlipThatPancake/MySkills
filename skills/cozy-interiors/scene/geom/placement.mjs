// placement rules: where a thing belongs relative to the others (art over furniture, coffee table distance, kitchen zones, bed on its wall...). Numbers are mm and come from references/placement.md (via test/rounds/placement/checks.md, rules 1-17).
// They read the built home (geom/load.mjs): each object's plan box from its real parts, its facing from the scene turn (0 faces +z, 180 faces -z), the walls and their openings.
// Findings are { rule: 'placement-<n>', id, other?, text }: one line each, naming the piece to move. Left out: 18 and 19 (soft, by eye), the pendant's width (a default pendantLamp is 0.19 of a 1600 table), sink zones (the sink is a run module, not an object).
const FURN_TOP = /^(sofa|daybed|console|sideboard|chestOfDrawers|bed|desk|bedsideTable|bench|windowSeat|table|coffeeTable|sideTable|baseRun)$/;
const UNDER_MIRROR_OK = /^(console|chestOfDrawers|sideboard|baseRun|woodStove)$/, UNDER_MIRROR_BAD = /^(sofa|bed|armchair|readingChair|desk|daybed)$/;
const SEATS = /^(sofa|armchair|readingChair|daybed)$/, LARGE = /^(sofa|armchair|readingChair|bed|table|roundTable|desk|sideboard|chestOfDrawers|shelf|console|wardrobe|daybed|glazedCabinet)$/;
const ART = /^(picture|galleryWall|mirror)$/, WALLPIECE = /^(picture|galleryWall|mirror|wallShelf|wallClock|wallCalendar|pinboard|coatHooks|readShelf)$/;
const HOB_THINGS = /^(pan|potRail|utensilCrock|spiceRack|ovenGlove|mokaPot)$/, HOOKS = /^(coatHooks|hungHat|hungBag)$/;
const rad = (d) => (d || 0) * Math.PI / 180, gapOf = (a, b) => Math.hypot(Math.max(a.x0 - b.x1, b.x0 - a.x1, 0), Math.max(a.z0 - b.z1, b.z0 - a.z1, 0));

export function placementRules(L, S = {}) {
  const out = [], O = [];
  for (const o of L.objects) {
    if (!o.parts.length) continue;
    const bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 };
    for (const p of o.parts) { if (p.kind === 'flat' && !/mirror|picture/.test(o.asset)) continue; bb.x0 = Math.min(bb.x0, p.box.mn[0]); bb.y0 = Math.min(bb.y0, p.box.mn[1]); bb.z0 = Math.min(bb.z0, p.box.mn[2]); bb.x1 = Math.max(bb.x1, p.box.mx[0]); bb.y1 = Math.max(bb.y1, p.box.mx[1]); bb.z1 = Math.max(bb.z1, p.box.mx[2]); }
    if (bb.x0 > bb.x1) continue;
    const t = rad(o.scene?.turn), f = [Math.sin(t), Math.cos(t)];
    const lowP = o.parts.filter((p) => p.box.mn[1] < bb.y0 + 20 && p.kind !== 'flat'), base = lowP.length ? { x0: Math.min(...lowP.map((p) => p.box.mn[0])), x1: Math.max(...lowP.map((p) => p.box.mx[0])), z0: Math.min(...lowP.map((p) => p.box.mn[2])), z1: Math.max(...lowP.map((p) => p.box.mx[2])) } : bb;   // what it stands on (a vase's stems spread far wider than its foot)
    const tp = o.parts.filter((p) => p.box.mx[1] > bb.y1 - 4 && p.box.mx[0] - p.box.mn[0] >= 150 && p.box.mx[2] - p.box.mn[2] >= 150), top = tp.length ? { x0: Math.min(...tp.map((p) => p.box.mn[0])), x1: Math.max(...tp.map((p) => p.box.mx[0])), z0: Math.min(...tp.map((p) => p.box.mn[2])), z1: Math.max(...tp.map((p) => p.box.mx[2])), y1: bb.y1 } : bb;   // the flat top itself (a drawer pulled out or a lip does not count)
    O.push({ top, base, id: o.id, asset: o.asset, mount: o.mount, area: o.area, sc: o.scene || {}, bb, cx: (bb.x0 + bb.x1) / 2, cz: (bb.z0 + bb.z1) / 2, f, wall: o.mount === 'wall', obj: o });
  }
  const A = (re) => O.filter((o) => re.test(o.asset)), inArea = (a, b) => !a.area || !b.area || a.area === b.area;
  const walls = (L.walls || []).map((w) => { const len = w.len ?? Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), u = [(w.to[0] - w.from[0]) / len, (w.to[1] - w.from[1]) / len]; return { ...w, len, u, n: [u[1], -u[0]] }; });
  const wallDist = (x, z) => Math.min(...walls.map((w) => { const dx = x - w.from[0], dz = z - w.from[1], s = dx * w.u[0] + dz * w.u[1], d = Math.abs(dx * w.n[0] + dz * w.n[1]); return s >= -200 && s <= w.len + 200 ? d : 1e9; }), 1e9);
  const wins = []; for (const w of walls) for (const [s0, s1, y0, y1] of w.holes || []) wins.push({ wall: w, x: w.from[0] + w.u[0] * (s0 + s1) / 2, z: w.from[1] + w.u[1] * (s0 + s1) / 2, s0, s1, y0, y1, door: y0 < 100 });
  const along = (o) => (o.bb.x1 - o.bb.x0 >= o.bb.z1 - o.bb.z0 ? 'x' : 'z'), len = (o, ax) => o.bb[ax + '1'] - o.bb[ax + '0'], mid = (o, ax) => (o.bb[ax + '0'] + o.bb[ax + '1']) / 2;
  const push = (n, o, text, other) => out.push({ rule: `placement-${n}`, id: o.id, ...(other ? { other: other.id } : {}), text: `${o.id} (${o.asset}): ${text}` });
  const pushC = (rule, o, text) => out.push({ rule, id: o.id, text: `${o.id} (${o.asset}): ${text}` });

  // furniture under a wall piece: a piece of furniture with its top within 700 below the piece and the piece's middle in front of / over it
  const under = (w) => O.filter((f) => !f.wall && f.mount !== 'on' && FURN_TOP.test(f.asset) && inArea(w, f) && w.bb.y0 - f.bb.y1 > -450 && w.bb.y0 - f.bb.y1 < 700 && w.cx > f.bb.x0 - 450 && w.cx < f.bb.x1 + 450 && w.cz > f.bb.z0 - 450 && w.cz < f.bb.z1 + 450 && gapOf({ x0: w.bb.x0, x1: w.bb.x1, z0: w.bb.z0, z1: w.bb.z1 }, f.bb) < 450);
  for (const w of O.filter((o) => ART.test(o.asset))) {   // round 4 G3: art hides behind the piece in front of it: its bottom stays 100 mm above that piece's top
    const ax = along(w); for (const f of under(w)) { const gap = w.bb.y0 - f.bb.y1, ov = Math.min(w.bb[ax + '1'], f.bb[ax + '1']) - Math.max(w.bb[ax + '0'], f.bb[ax + '0']); if (gap < 100 && ov > 50 && (/^bed$/.test(f.asset) || gap < 0)) pushC('artbehind', w, `its bottom is ${Math.round(gap)} mm above the top of ${f.id} (${f.asset}) in front of it (100 at least): hang it higher, so the piece does not hide it`); }
  }
  for (const w of O.filter((o) => ART.test(o.asset))) {
    const U = under(w).filter((f) => w.bb.y0 - f.bb.y1 < 400);
    if (/mirror/.test(w.asset)) { const bad = U.find((f) => UNDER_MIRROR_BAD.test(f.asset)) || under(w).find((f) => UNDER_MIRROR_BAD.test(f.asset)); if (bad) push(3, w, `a mirror over a ${bad.asset} (put it over a console, chest, sideboard or basin, in a hallway or beside a window, or lean one on the floor)`, bad); }
    if (U.length) {
      const f = U.sort((a, b) => b.bb.y1 - a.bb.y1)[0], ax = along(w), gap = w.bb.y0 - f.bb.y1, ratio = len(w, ax) / Math.max(1, len(f, ax)), off = Math.abs(mid(w, ax) - mid(f, ax)) / Math.max(1, len(f, ax)), hi = /mirror/.test(w.asset) ? 0.9 : 0.8;
      if (!/^bed$/.test(f.asset) && !(/mirror/.test(w.asset) && UNDER_MIRROR_BAD.test(f.asset))) {
        const why = []; if (gap < 150 || gap > 250) why.push(`its bottom is ${Math.round(gap)} above the ${f.asset} top (150-250)`); if (ratio < 0.5 || ratio > hi) why.push(`it is ${ratio.toFixed(2)} of the ${f.asset}'s width (0.5-${hi})`); if (off > 0.1) why.push(`its middle is ${Math.round(off * 100)}% of the width off the ${f.asset}'s middle (10% at most)`);
        if (why.length) push(1, w, `over the ${f.asset}: ${why.join('; ')}`, f);
      }
    } else if (/^(picture|galleryWall)$/.test(w.asset)) { const m = (w.bb.y0 + w.bb.y1) / 2; if (m < 1400 || m > 1600) push(2, w, `on open wall its middle is at ${Math.round(m)} (1400-1600): move it to eye level, or over a piece of furniture`); }
  }
  // 4. wall pieces keep 100 apart in elevation from each other and from window, door and passage frames
  const WP = O.filter((o) => o.wall && !/^(wallRun|hood|curtain|curtainRail|pelmet|windowSeat)$/.test(o.asset));   // round 4 G2b: every wall-mounted piece, not a name list
  const planeOf = (o) => walls.find((w) => { const dx = o.cx - w.from[0], dz = o.cz - w.from[1], s = dx * w.u[0] + dz * w.u[1], d = Math.abs(dx * w.n[0] + dz * w.n[1]); return d < 160 && s > -50 && s < w.len + 50; });
  for (let i = 0; i < WP.length; i++) {
    const a = WP[i], wa = planeOf(a); if (!wa) continue;
    const loc = (o) => { const xs = [o.bb.x0, o.bb.x1].flatMap((x) => [o.bb.z0, o.bb.z1].map((z) => (x - wa.from[0]) * wa.u[0] + (z - wa.from[1]) * wa.u[1])); return { s0: Math.min(...xs), s1: Math.max(...xs), y0: o.bb.y0, y1: o.bb.y1 }; };
    const ra = loc(a);
    for (let j = i + 1; j < WP.length; j++) { const b = WP[j]; if (planeOf(b) !== wa || !inArea(a, b)) continue; const rb = loc(b), g = Math.hypot(Math.max(ra.s0 - rb.s1, rb.s0 - ra.s1, 0), Math.max(ra.y0 - rb.y1, rb.y0 - ra.y1, 0)); const jut = (o) => { const ns = [o.bb.x0, o.bb.x1].flatMap((x) => [o.bb.z0, o.bb.z1].map((z) => (x - wa.from[0]) * wa.n[0] + (z - wa.from[1]) * wa.n[1])); return Math.max(...ns) - Math.min(...ns); }, flat = (o) => jut(o) <= 150, need = (jut(a) > 150 && flat(b)) || (jut(b) > 150 && flat(a)) ? 200 : 100; if (g < need) push(4, a, `${Math.round(g)} mm from ${b.id} on the same wall (${need} apart in elevation${need === 200 ? ': a piece that sticks out keeps 200 mm from a flat one' : ''}): move one`, b); }
    for (const h of wa.holes || []) { const g = Math.hypot(Math.max(ra.s0 - h[1], h[0] - ra.s1, 0), Math.max(ra.y0 - h[3], h[2] - ra.y1, 0)); if (g < 100) push(4, a, `${Math.round(g)} mm from a ${h[2] < 100 ? 'door' : 'window'} frame on ${wa.id} (100 apart in elevation): move it along the wall`); }
  }
  // 5. hooks at 1500-1800
  for (const h of A(HOOKS)) { const y = h.sc.at?.[1] ?? h.bb.y1; if (y < 1500 || y > 1800) push(5, h, `hooks at ${Math.round(y)} (1500-1800): hang them at 1600`); }

  // 6. a seat faces another seat, a table, a window, a stove, a shelf wall, or the home-view camera
  const cams = (S.areas || []).reduce((m, a) => (a.camera?.home ? { ...m, [a.id]: a.camera.home } : m), {});
  const targets = (s) => [...O.filter((o) => o !== s && (SEATS.test(o.asset) || /^(table|roundTable|coffeeTable|woodStove|shelf|desk)$/.test(o.asset)) && inArea(s, o)).map((o) => [o.cx, o.cz]), ...wins.filter((w) => !w.door).map((w) => [w.x, w.z])];
  for (const s of A(/^(armchair|readingChair)$/)) {
    const ok = (dir) => dir[0] * s.f[0] + dir[1] * s.f[1] > Math.cos(rad(60)) * Math.hypot(...dir) && Math.hypot(...dir) > 1;
    let good = targets(s).some(([x, z]) => ok([x - s.cx, z - s.cz]));
    const cam = cams[s.area]; if (!good && cam) { const az = rad(cam.az || 0), c = [Math.sin(az), Math.cos(az)]; good = s.f[0] * c[0] + s.f[1] * c[1] > Math.cos(rad(100)); }
    if (!good) push(6, s, `its front faces nothing (another seat, the table it serves, a window, a stove, a shelf wall or the view): turn it`);
  }
  // 7. coffee table 350-500 from the sofa front, length 0.5-0.75 of the sofa's
  for (const c of A(/^coffeeTable$/)) for (const s of A(/^sofa$/).filter((s) => inArea(s, c))) {
    const fz = s.f, sd = [fz[1], -fz[0]], proj = (b, v) => [b.x0, b.x1].flatMap((x) => [b.z0, b.z1].map((z) => x * v[0] + z * v[1])), sf = proj(s.bb, fz), cf = proj(c.bb, fz), ss = proj(s.bb, sd), cs = proj(c.bb, sd);
    const gap = Math.min(...cf) - Math.max(...sf), sideGap = Math.max(Math.min(...ss) - Math.max(...cs), Math.min(...cs) - Math.max(...ss)); if (sideGap > 0 || gap < -100 || gap > 1500) continue;
    const ratio = (Math.max(...cs) - Math.min(...cs)) / (Math.max(...ss) - Math.min(...ss)), why = []; if (gap < 350 || gap > 500) why.push(`${Math.round(gap)} mm from the sofa front (350-500)`); if (ratio < 0.45 || ratio > 0.8) why.push(`${ratio.toFixed(2)} of the sofa's length (0.5-0.75)`);
    if (why.length) push(7, c, why.join('; '), s);
  }
  // 8. a side table beside a seat (within 150 of its side)
  for (const t of A(/^sideTable$/)) { const seats = O.filter((s) => (SEATS.test(s.asset) || s.asset === 'windowSeat') && inArea(s, t)); if (!seats.length) continue; const near = seats.some((s) => { const sd = [s.f[1], -s.f[0]], pr = (b) => [b.x0, b.x1].flatMap((x) => [b.z0, b.z1].map((z) => x * sd[0] + z * sd[1])), p1 = pr(s.bb), p2 = pr(t.bb), side = Math.max(Math.min(...p1) - Math.max(...p2), Math.min(...p2) - Math.max(...p1)), fw = (b) => [b.x0, b.x1].flatMap((x) => [b.z0, b.z1].map((z) => x * s.f[0] + z * s.f[1])), f1 = fw(s.bb), f2 = fw(t.bb), depth = Math.min(Math.max(...f1), Math.max(...f2)) - Math.max(Math.min(...f1), Math.min(...f2)); return side <= 150 && depth > 0; }); if (!near) push(8, t, `no seat has it within 150 mm of its side: stand it at the arm of the sofa or chair it serves`); }
  // 9. large floor pieces stand grouped (100 or less) or walkable (600 or more) apart
  const big = A(LARGE).filter((o) => !o.wall);
  for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) { const a = big[i], b = big[j]; if (!inArea(a, b)) continue; const g = gapOf(a.bb, b.bb); if (g > 100 && g < 600) push(9, a, `${Math.round(g)} mm from ${b.id} (100 or less to group them, 600 or more to walk between; 750-900 is best)`, b); }
  // 10. a floor lamp within 600 of the seat it serves, beside or behind it
  for (const l of A(/^(floorLamp|readingLamp)$/)) { const seats = O.filter((s) => SEATS.test(s.asset) && inArea(s, l)); if (!seats.length) continue; const ok = seats.some((s) => { const g = gapOf(l.bb, s.bb), fw = (l.cx - s.cx) * s.f[0] + (l.cz - s.cz) * s.f[1], frontEdge = Math.max(...[s.bb.x0, s.bb.x1].flatMap((x) => [s.bb.z0, s.bb.z1].map((z) => (x - s.cx) * s.f[0] + (z - s.cz) * s.f[1]))); return g <= 600 && fw <= frontEdge + 200; }); if (!ok) push(10, l, `no seat has it within 600 mm, beside or behind it: stand it beside the seat it lights`); }
  // 11. a pendant: bottom 750-900 over a table, 2000 or more over open floor
  for (const p of A(/^(pendantLamp|pendantForm)$/)) { const tb = O.find((t) => /^(table|roundTable|baseRun)$/.test(t.asset) && inArea(t, p) && p.cx > t.bb.x0 - 50 && p.cx < t.bb.x1 + 50 && p.cz > t.bb.z0 - 50 && p.cz < t.bb.z1 + 50); if (tb) { const top = tb.asset === 'baseRun' ? (tb.sc.params?.top || 900) : tb.bb.y1, h = p.bb.y0 - top; if (h < 750 || h > 900) push(11, p, `its bottom is ${Math.round(h)} over the ${tb.asset} top (750-900): set rim to ${Math.round(top + 825)}`, tb); } else if (p.bb.y0 < 2000 && p.bb.y0 > 0) push(11, p, `over open floor its bottom is at ${Math.round(p.bb.y0)} (2000 or more)`); }

  // kitchen: runs by module
  const runs = O.filter((o) => o.asset === 'baseRun').map((r) => { const mods = r.sc.params?.modules || [], a = r.bb.x1 - r.bb.x0 >= r.bb.z1 - r.bb.z0; let x = r.sc.at[0]; const iv = []; if (Math.abs(Math.sin(rad(r.sc.turn))) < 0.01) for (const m of mods) { iv.push({ ...m, a: x, b: x + m.w }); x += m.w; } return { r, iv, flip: Math.abs(Math.cos(rad(r.sc.turn)) + 1) < 0.01 }; });
  // 12. hob things within 1000 of the hob (horizontal)
  for (const h of A(/^hob$/)) for (const t of O.filter((o) => HOB_THINGS.test(o.asset) && inArea(o, h))) { const d = Math.hypot(t.cx - h.cx, t.cz - h.cz); if (d > 1000) push(12, t, `${Math.round(d)} mm from the hob (1000 at most): keep it by the hob`, h); }
  // 13. clear worktop beside the sink (600 + 400) and the hob (300 each side); a run end counts as a side
  for (const { r, iv } of runs) {
    if (!iv.length) continue; const top = r.bb.y1, things = O.filter((o) => o.mount === 'on' && !/^(hob|sink|hood|tap|cuttingBoard)$/.test(o.asset) && o.bb.y0 > top - 40 && o.bb.y0 < top + 40 && o.bb.y1 - o.bb.y0 > 50 && o.bb.z0 < r.bb.z1 && o.bb.z1 > r.bb.z0 && inArea(o, r));
    const free = (a, b) => { let n = b - a; for (const t of things) n -= Math.max(0, Math.min(b, t.bb.x1) - Math.max(a, t.bb.x0)); return Math.max(0, n); };
    const flat = (m) => !['hob', 'sink', 'tall', 'blind'].includes(m.kind), side = (i, dir) => { let n = 0; for (let k = i + dir; k >= 0 && k < iv.length && flat(iv[k]); k += dir) n += free(iv[k].a, iv[k].b); return (i + dir < 0 || i + dir >= iv.length) ? Infinity : n; };
    iv.forEach((m, i) => { if (m.kind === 'sink') { const l = side(i, -1), rr = side(i, 1), big = Math.max(l, rr), small = Math.min(l, rr); if (big < 600 || small < 400) push(13, r, `the sink has ${Math.min(l, 9999)} clear worktop on one side and ${Math.min(rr, 9999)} on the other (600 and 400 needed; a run end counts): add a doors or drawers module beside it`); } if (m.kind === 'hob') { const l = side(i, -1), rr = side(i, 1); if (l < 300 || rr < 300) push(13, r, `the hob has ${Math.min(l, 9999)} clear worktop on one side and ${Math.min(rr, 9999)} on the other (300 each side needed): add a doors or drawers module beside it`); } });
  }
  // 14. pans and the moka pot stand on the hob
  const hobs = A(/^hob$/); for (const p of A(/^(pan|mokaPot)$/)) { if (!hobs.some((h) => inArea(h, p))) continue; if (!hobs.some((h) => p.cx > h.bb.x0 - 40 && p.cx < h.bb.x1 + 40 && p.cz > h.bb.z0 - 40 && p.cz < h.bb.z1 + 40)) push(14, p, `a ${p.asset} not on the hob: stand it on the hob`); }
  // 15. a window behind the sitter (within 45 degrees of straight back) fails
  for (const c of A(/^deskChair$/)) for (const w of wins.filter((w) => !w.door)) { const v = [w.x - c.cx, w.z - c.cz], d = Math.hypot(...v); if (d < 1 || d > 5000) continue; const back = -(v[0] * c.f[0] + v[1] * c.f[1]) / d; if (back > Math.cos(rad(45))) { push(15, c, `the window on ${w.wall.id} is behind the sitter (glare on the screen): turn the desk so the window is beside or in front`); break; } }
  // 16. a bed: headboard within 50 of a wall, a nightstand each side within 100
  for (const b of A(/^bed$/)) {
    const hx = b.cx - b.f[0] * 0, hz = b.cz; const headX = b.cx - b.f[0] * ((Math.abs(b.f[0]) > 0.5 ? len(b, 'x') : len(b, 'z')) / 2), headZ = b.cz - b.f[1] * ((Math.abs(b.f[1]) > 0.5 ? len(b, 'z') : len(b, 'x')) / 2);
    const wd = wallDist(headX, headZ); if (wd > 50) push(16, b, `the headboard is ${Math.round(wd)} from the nearest wall (50 at most): back the bed onto a wall`);
    const sd = [b.f[1], -b.f[0]]; for (const sgn of [-1, 1]) { const px = b.cx + sd[0] * sgn * ((Math.abs(sd[0]) > 0.5 ? len(b, 'x') : len(b, 'z')) / 2 + 400), pz = b.cz + sd[1] * sgn * ((Math.abs(sd[1]) > 0.5 ? len(b, 'z') : len(b, 'x')) / 2 + 400); if (wallDist(px, pz) < 450) continue; const ns = A(/^bedsideTable$/).find((n) => gapOf(n.bb, b.bb) <= 100 && ((n.cx - b.cx) * sd[0] + (n.cz - b.cz) * sd[1]) * sgn > 0); if (!ns) push(16, b, `no bedside table within 100 on its ${sgn > 0 ? 'right' : 'left'} side`); }
  }
  // 17a. an island (a run standing off the walls) keeps 1000 clear from the run it works with; 17b. a sofa back keeps 900 clear of an island
  const islands = runs.filter(({ r }) => ![wallDist(r.bb.x0, r.cz), wallDist(r.bb.x1, r.cz), wallDist(r.cx, r.bb.z0), wallDist(r.cx, r.bb.z1)].some((d) => d < 150)).map((q) => q.r);   // an island has a wall within 150 of none of its sides
  for (const i of islands) for (const o of O.filter((o) => /^(baseRun|fridge)$/.test(o.asset) && o !== i && inArea(o, i))) { const g = gapOf(i.bb, o.bb); if (g < 1000) push('17a', i, `${Math.round(g)} mm of floor between the island and ${o.id} (1000-1200 on a working side): move it out`, o); }
  for (const s of A(/^sofa$/)) for (const i of islands.concat(A(/^(table|roundTable)$/))) { if (!inArea(s, i)) continue; const back = (i.cx - s.cx) * -s.f[0] + (i.cz - s.cz) * -s.f[1]; if (back <= 0) continue; const g = gapOf(s.bb, i.bb); if (g < 900) push('17b', s, `its back is ${Math.round(g)} mm from ${i.id} (900 or more behind a sofa that divides the area): move one`, i); }
  // 17. small things on tops stay 20 inside the top's edge and 10 apart
  const TOPS = /^(desk|console|sideboard|chestOfDrawers|bedsideTable|table|coffeeTable|sideTable|bench)$/;
  for (const o of O.filter((o) => o.mount === 'on' && !/^(tablecloth|tableRunner|cloth|rug|benchCushion|cushion|pendantLamp|duvetCloth|scuff|leaf)$/.test(o.asset))) {
    const s = O.find((t) => TOPS.test(t.asset) && inArea(t, o) && Math.abs(t.bb.y1 - o.bb.y0) < 25 && o.cx > t.top.x0 && o.cx < t.top.x1 && o.cz > t.top.z0 && o.cz < t.top.z1); if (!s) continue;
    const tb = s.top, m = { l: o.base.x0 - tb.x0, r: tb.x1 - o.base.x1, f: o.base.z0 - tb.z0, b: tb.z1 - o.base.z1 }, wallSide = { l: wallDist(tb.x0, s.cz) < 60, r: wallDist(tb.x1, s.cz) < 60, f: wallDist(s.cx, tb.z0) < 60, b: wallDist(s.cx, tb.z1) < 60 };
    for (const k of Object.keys(m)) if (!wallSide[k] && m[k] < 20) { push(17, o, `${Math.round(m[k])} mm inside the edge of ${s.id} (20 at least): move it in`, s); break; }
  }
  // window seat: its top within about 100 of the sill, so the wall above is not left bare
  for (const s of A(/^windowSeat$/)) { const w = wins.filter((w) => !w.door).map((w) => ({ w, d: Math.hypot(w.x - s.cx, w.z - s.cz) })).sort((a, b) => a.d - b.d)[0]; if (!w || w.d > 1500) continue; const gap = w.w.y0 - ((s.sc.params?.h ?? 440) + 70);   if (gap > 100) push('seat-sill', s, `its top is ${Math.round(gap)} below the window sill (100 at most): make the seat taller or the sill lower`); }

  // round 3 E2, composition by numbers: floor cover, the fridge by the run's end, the hero by its window, a seat that faces something
  for (const ar of S.areas || []) {
    const b = ar.bounds, mine = O.filter((o) => o.area === ar.id); if (!b) continue; const few = mine.filter((o) => !o.wall).length < 3;
    // floorcover: what stands on the floor (footprints and rugs) is at least about 25% of the area's rect
    const flo = mine.filter((o) => !o.wall && o.mount !== 'on' && o.bb.y0 < 60 && !/^(scuff|leaf|curtain|cat|heightChart)$/.test(o.asset)); let cells = 0, hit = 0;
    for (let x = b.x0 + 50; x < b.x1; x += 100) for (let z = b.z0 + 50; z < b.z1; z += 100) { cells++; const wx = x, wz = z; if (flo.some((o) => wx >= o.bb.x0 && wx <= o.bb.x1 && wz >= o.bb.z0 && wz <= o.bb.z1)) hit++; }
    if (!few && cells && hit / cells < 0.25) out.push({ rule: 'floorcover', id: mine[0].id, text: `${ar.id}: furniture and rugs cover ${Math.round(100 * hit / cells)}% of the ${Math.round((b.x1 - b.x0))} x ${Math.round(b.z1 - b.z0)} floor (25% at least): bring the groups together, add a rug or a piece, or make the rect smaller` });
    // fridge: within 1200 of an end of the run it belongs to
    const runs = mine.filter((o) => o.asset === 'baseRun'), fr = mine.filter((o) => o.asset === 'fridge');
    if (runs.length && fr.length) { const rx0 = Math.min(...runs.map((r) => r.bb.x0)), rx1 = Math.max(...runs.map((r) => r.bb.x1)), rz0 = Math.min(...runs.map((r) => r.bb.z0)), rz1 = Math.max(...runs.map((r) => r.bb.z1)), ax = rx1 - rx0 >= rz1 - rz0 ? 'x' : 'z', [r0, r1] = ax === 'x' ? [rx0, rx1] : [rz0, rz1];
      for (const f of fr) { const f0 = f.bb[ax + '0'], f1 = f.bb[ax + '1'], d = Math.min(Math.abs(f0 - r0), Math.abs(f1 - r0), Math.abs(f0 - r1), Math.abs(f1 - r1)), inside = f0 > r0 && f1 < r1 ? d : f1 < r0 ? r0 - f1 : f0 > r1 ? f0 - r1 : 0; if (inside > 1200) pushC('fridge', f, `${Math.round(inside)} mm from the nearest end of the run (1200 at most): stand it at an end of the run, or the run's cooking and washing zones are cut off from it`); } }
    // round 4 G3: the largest bare patch, a rect no more than 1 m bigger than its things, a rug clear of runs, a footstool at a seat, a chair with room behind it
    { const furn = mine.filter((o) => !o.wall && o.mount !== 'on' && o.bb.y0 < 200 && o.bb.y1 > 150 && !/^(rug|runner|scuff|leaf|curtain|cat|heightChart|cushion|foldedThrow|pouf|basket|stool|footstool)$/.test(o.asset) && !HOOKS.test(o.asset));
      const nx = Math.floor((b.x1 - b.x0) / 100), nz = Math.floor((b.z1 - b.z0) / 100);
      if (!few && nx > 3 && nz > 3 && furn.length) { const hts = new Array(nz).fill(0); let best = 0, bw = 0, bd = 0;   // largest empty rectangle: rows of x, a histogram along z
        for (let i = 0; i < nx; i++) { const x = b.x0 + 50 + i * 100; for (let j = 0; j < nz; j++) { const z = b.z0 + 50 + j * 100; hts[j] = furn.some((o) => x >= o.bb.x0 && x <= o.bb.x1 && z >= o.bb.z0 && z <= o.bb.z1) ? 0 : hts[j] + 1; }
          const st = []; for (let j = 0; j <= nz; j++) { const h = j < nz ? hts[j] : 0; let s = j; while (st.length && st[st.length - 1][1] >= h) { const [s0, h0] = st.pop(); if (h0 * (j - s0) > best) { best = h0 * (j - s0); bw = h0; bd = j - s0; } s = s0; } st.push([s, h]); } }
        const pct = Math.round(100 * best / (nx * nz)); if (pct > 40) pushC('emptyfloor', mine[0], `${ar.id}: the largest patch of floor with no furniture on it is ${bw * 100} x ${bd * 100} mm, ${pct}% of the ${Math.round(b.x1 - b.x0)} x ${Math.round(b.z1 - b.z0)} rect (40% at most): bring the groups nearer, put a group on that floor, or make the rect smaller`); }
      if (!few && furn.length) { const ex = { x0: Math.min(...furn.map((o) => o.bb.x0)), x1: Math.max(...furn.map((o) => o.bb.x1)), z0: Math.min(...furn.map((o) => o.bb.z0)), z1: Math.max(...furn.map((o) => o.bb.z1)) };
        const seam = (side) => (S.areas || []).some((q) => q.id !== ar.id && q.bounds && (side === 'x1' ? Math.abs(q.bounds.x0 - b.x1) < 80 : side === 'x0' ? Math.abs(q.bounds.x1 - b.x0) < 80 : side === 'z1' ? Math.abs(q.bounds.z0 - b.z1) < 80 : Math.abs(q.bounds.z1 - b.z0) < 80));
        for (const [side, gap] of [['x0', ex.x0 - b.x0], ['x1', b.x1 - ex.x1], ['z0', ex.z0 - b.z0], ['z1', b.z1 - ex.z1]]) if (gap > 1000 && !seam(side)) pushC('rectfit', mine[0], `${ar.id}: the rect reaches ${Math.round(gap)} mm past the furniture on its ${{ x0: 'left', x1: 'right', z0: 'back', z1: 'front' }[side]} (1000 at most; the smallest rect that holds the groups is x ${Math.round(ex.x0 - 500)} to ${Math.round(ex.x1 + 500)}, z ${Math.round(ex.z0 - 500)} to ${Math.round(ex.z1 + 500)} with 500 mm of floor around them): make the rect smaller`); } }
    for (const r of mine.filter((o) => o.asset === 'rug')) for (const s of mine.filter((o) => (o.asset === 'baseRun' || o.asset === 'fridge') && o.bb.y1 > 600)) if (gapOf(r.bb, s.bb) < 100) pushC('rugrun', r, `its edge is ${Math.round(gapOf(r.bb, s.bb))} mm from the ${s.asset} ${s.id} (100 at least; a rug does not run under or touch a run, an island or a fridge): shorten the rug`);
    for (const f of mine.filter((o) => o.asset === 'footstool')) { const ok = mine.some((s) => SEATS.test(s.asset) && gapOf(f.bb, s.bb) <= 300 && (f.cx - s.cx) * s.f[0] + (f.cz - s.cz) * s.f[1] > 0); if (!ok) pushC('footstool', f, `it stands more than 300 mm from the front of every seat (or behind one): put it in front of the chair or sofa it belongs to`); }
    for (const ch of mine.filter((o) => o.asset === 'chair' && mine.some((t) => /^(table|roundTable|desk)$/.test(t.asset) && gapOf(o.bb, t.bb) <= 300))) {   // the room behind a chair at a table: 600 mm, 750 when a run or island is behind it
      const fx = ch.f[0], fz = ch.f[1], rad2 = Math.max(...[[ch.bb.x0, ch.bb.z0], [ch.bb.x0, ch.bb.z1], [ch.bb.x1, ch.bb.z0], [ch.bb.x1, ch.bb.z1]].map(([x, z]) => (x - ch.cx) * -fx + (z - ch.cz) * -fz)), hw = 220;
      const solids = mine.filter((s) => s !== ch && !s.wall && s.mount !== 'on' && /^(baseRun|fridge|wardrobe|sideboard|glazedCabinet|shelf|bed|sofa|console|chestOfDrawers|woodStove|desk|table|roundTable)$/.test(s.asset) && s.bb.y1 > 600);
      let free = 750, hitBy = null; for (let d = 0; d <= 750 && !hitBy; d += 25) for (const t of [-hw, 0, hw]) { const px = ch.cx - fx * (rad2 + d) + fz * t, pz = ch.cz - fz * (rad2 + d) - fx * t, s = solids.find((q) => px >= q.bb.x0 && px <= q.bb.x1 && pz >= q.bb.z0 && pz <= q.bb.z1 && !(/^(table|roundTable|desk)$/.test(q.asset) && gapOf(ch.bb, q.bb) <= 300)); if (s) { free = d; hitBy = s; break; } }
      const need = hitBy && /^(baseRun|fridge)$/.test(hitBy.asset) ? 750 : 600; if (hitBy && free < need) pushC('chairback', ch, `only ${free} mm of room behind it before ${hitBy.id} (${need} at least${need === 750 ? ': a walkway beside a run' : ''}): move the table or the ${hitBy.asset}, or the chair can not be pulled out`); }
    // stools at a run or island: counter height (seat 600 to 700) and one form
    { const st = mine.filter((o) => o.asset === 'stool' && runs.some((r) => gapOf(o.bb, r.bb) <= 400)); const forms = new Set(st.map((o) => o.sc?.params?.form ?? 0));
      for (const o of st) if (o.bb.y1 < 600 || o.bb.y1 > 720) pushC('stoolheight', o, `its seat is ${Math.round(o.bb.y1)} mm high at a counter (600 to 700): use the bar stool (form 0, h 650)`);
      if (forms.size > 1) pushC('stoolheight', st[0], `the stools at the counter come in ${forms.size} forms (${[...forms].join(', ')}): use one`); }
    // rugreach: a rug under a table reaches 700 mm (650 at least) past the top on every side, or the table has none
    for (const tb of mine.filter((o) => /^(table|roundTable)$/.test(o.asset))) for (const rg of mine.filter((o) => o.asset === 'rug' && tb.cx > o.bb.x0 && tb.cx < o.bb.x1 && tb.cz > o.bb.z0 && tb.cz < o.bb.z1)) { const m = Math.min(tb.bb.x0 - rg.bb.x0, rg.bb.x1 - tb.bb.x1, tb.bb.z0 - rg.bb.z0, rg.bb.z1 - tb.bb.z1); if (m < 650) pushC('rugreach', rg, `it reaches ${Math.round(m)} mm past the top of ${tb.id} (700 on every side, 650 at least): a pulled-out chair leaves it; grow the rug or take it away`); }
    // herowin: a hero the roll puts by a window stands within 1000 of that wall and overlaps the window's width
    const ra = S.roll?.areas?.[ar.id];
    if (ra?.heroWindow && !(S.rolled?.[ar.id]?.skipped || []).some((q) => q.asset === 'hero by the window')) for (const h of mine.filter((o) => o.sc?.hero && !o.wall && /^(table|roundTable|sofa|armchair|readingChair|daybed|windowSeat|bed|desk)$/.test(o.asset))) { const ok = wins.some((w) => !w.door && (w.wall.id || '').startsWith(ar.id + '-') && (() => { const lo = [h.bb.x0, h.bb.z0], hi = [h.bb.x1, h.bb.z1], sA = [lo, hi, [lo[0], hi[1]], [hi[0], lo[1]]].map(([x, z]) => (x - w.wall.from[0]) * w.wall.u[0] + (z - w.wall.from[1]) * w.wall.u[1]), dA = [lo, hi, [lo[0], hi[1]], [hi[0], lo[1]]].map(([x, z]) => Math.abs((x - w.wall.from[0]) * w.wall.n[0] + (z - w.wall.from[1]) * w.wall.n[1])); return Math.min(...dA) <= 1000 && Math.min(Math.max(...sA), w.s1) - Math.max(Math.min(...sA), w.s0) > 0; })()); if (!ok) pushC('herowin', h, `the roll puts the hero by the window: stand it within 1000 of that wall, in line with the window (a hero elsewhere needs a.skip('hero by the window', 'why'))`); }
    // seatface: a sofa or chair faces a table, another seat, a window or the stove within 2500
    for (const sx of mine.filter((o) => SEATS.test(o.asset) && !o.wall)) {
      const targets = [...mine.filter((o) => o !== sx && /^(table|roundTable|coffeeTable|desk|woodStove|sofa|armchair|readingChair|daybed|bed|baseRun)$/.test(o.asset)).map((o) => ({ x: o.cx, z: o.cz, bb: o.bb })), ...wins.filter((w) => !w.door && (w.wall.id || '').startsWith(ar.id + '-')).map((w) => ({ x: w.x, z: w.z, bb: { x0: w.x, x1: w.x, z0: w.z, z1: w.z } }))];
      const ok = targets.some((t) => { const g = gapOf(sx.bb, t.bb), dx = t.x - sx.cx, dz = t.z - sx.cz, dl = Math.hypot(dx, dz) || 1; return g <= 2500 && (dx * sx.f[0] + dz * sx.f[1]) / dl > Math.cos(rad(70)); });
      if (!ok) pushC('seatface', sx, `it faces nothing within 2500 (a table, another seat, a window or the stove): turn it toward one`);
    }
  }
  // round 4 G3: an opening keeps 300 mm from a wall corner (the two walls of one area meet there)
  { const areaOfWall = (w) => String(w.id || '').replace(/-[^-]*$/, ''), same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 5;
    for (const w of walls) { const mates = walls.filter((q) => q !== w && areaOfWall(q) === areaOfWall(w)), cornerAt = (pt) => mates.some((q) => same(q.from, pt) || same(q.to, pt));
      for (const [s0, s1] of w.holes || []) { const kind = (w.openings || []).find((q) => Math.abs((w.len - q.at) - (s0 + s1) / 2) < 5 || Math.abs(q.at - (s0 + s1) / 2) < 5)?.kind || 'opening';
        if (s0 < 300 && cornerAt(w.from)) out.push({ rule: 'cornerop', id: w.id, text: `${w.id}: the ${kind} stands ${Math.round(s0)} mm from the wall corner (300 at least): move it along the wall` });
        if (w.len - s1 < 300 && cornerAt(w.to)) out.push({ rule: 'cornerop', id: w.id, text: `${w.id}: the ${kind} stands ${Math.round(w.len - s1)} mm from the wall corner (300 at least): move it along the wall` }); } } }
  return out;
}
