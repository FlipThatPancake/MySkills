// check-openplan.mjs — the open-plan rules of check-home (it calls openPlanIssues(page, sceneFile, { quick }) at the end; nothing here runs for a home without `groups`).
// Layout: joined bounds touch or overlap by 1000 mm at most; back walls meet end to end; no wall on a seam; a walkway of 900 mm or more across every seam; an island keeps 1000 to 1250 mm from the kitchen run.
// Separators: each one the spec named (H.join(..., { separators })) stands within 800 mm of its seam (an object with `sep: '<kind>'`; a rug by its edge); at least one is furniture.
// Glimpse (home view and every shot, needs renders): a neighbour's pixels touch one side edge only and take at most 25% of the frame's width; none covers the hero or the shot's subject; an area two steps away does not show.
// Glide: nothing switches on or off while the camera glides between areas of one group.
import { readFileSync } from 'node:fs';
import { FURNITURE, SEAM_REACH, WALKWAY, ISLAND_GAP, GLIMPSE } from './openplan.mjs';
const near = (a, b, d = 40) => Math.hypot(a[0] - b[0], a[1] - b[1]) < d;
export async function openPlanIssues(page, sceneFile, { quick = false } = {}) {
  const S = JSON.parse(readFileSync(sceneFile, 'utf8')), out = [];
  if (!S.groups?.length) return out;
  const walls = S.home.walls, area = Object.fromEntries(S.areas.map((a) => [a.id, a]));
  // ---- layout, from the scene's numbers
  for (const G of S.groups) for (const q of G.seams) {
    const A = area[q.a], B = area[q.b], tag = `${q.a} | ${q.b}`;
    const ov = overlapAlong(q, A.bounds, B.bounds);
    if (ov < -5) out.push({ rule: 'open-layout', what: `${tag}: the two floors leave a gap of ${Math.round(-ov)} mm (join them: touch or overlap)` });
    if (ov > 1000 + 5) out.push({ rule: 'open-layout', what: `${tag}: the two floors overlap by ${Math.round(ov)} mm (1000 at most)` });
    const wa = walls.filter((w) => w.id.startsWith(q.a + '-')), wb = walls.filter((w) => w.id.startsWith(q.b + '-'));
    const back = (list, id) => list.find((w) => w.id === id + '-back');
    const ba = q.layout === 'row' ? back(wa, q.a) : wa.find((w) => w.id === q.a + '-right'), bb = back(wb, q.b);
    if (!ba || !bb || !near(ba.from, bb.to, 5)) out.push({ rule: 'open-layout', what: `${tag}: the back walls do not meet end to end (${q.layout === 'row' ? q.a + ' back' : q.a + ' right wall'} ends at ${ba ? ba.from : '?'}, ${q.b} back starts at ${bb ? bb.to : '?'})` });
    // no wall stands on a seam: a wall of either area that crosses the seam line, other than the back wall running on through it
    for (const w of [...wa, ...wb]) { if (w === ba || w === bb) continue; if (cross(w.from, w.to, q.p0, q.p1)) out.push({ rule: 'open-layout', what: `${tag}: ${w.id} stands on the seam: drop that side wall (only an outer end may have one)` }); }
  }
  for (const G of S.groups) for (const q of G.seams) if (!q.kinds?.some((k) => FURNITURE.includes(k))) out.push({ rule: 'open-separator', what: `${q.a} | ${q.b}: no furniture separator named (island, peninsula, sofaBack or openShelf): H.join(..., { separators: [...] })` });
  // ---- boxes, in the page
  const data = await page.evaluate((groups) => {
    const { home, kit } = window.cozyScene, T = kit.THREE, objs = home.objects, res = { boxes: {}, issues: [] };
    for (const [id, g] of Object.entries(objs)) {
      g.updateMatrixWorld(true); const b = new T.Box3(), bb = new T.Box3();
      g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.userData.lines || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
      if (!b.isEmpty()) { const s = g.userData.scene; res.boxes[id] = { min: b.min.toArray(), max: b.max.toArray(), asset: s.asset, area: s.area, sep: s.sep || null, mount: s.mount, y: s.at[1] }; }
    }
    return res;
  }, S.groups);
  const B = data.boxes, FLOOR = (b) => b.mount === 'floor' && b.max[1] - b.min[1] > 150 && !['rug', 'curtain', 'scuff', 'leaf', 'cat'].includes(b.asset);
  const distSeg = (b, p0, p1) => { const c = [(b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2], e = [p1[0] - p0[0], p1[1] - p0[1]], L2 = e[0] * e[0] + e[1] * e[1], t = Math.max(0, Math.min(1, ((c[0] - p0[0]) * e[0] + (c[1] - p0[1]) * e[1]) / L2)), q = [p0[0] + e[0] * t, p0[1] + e[1] * t];
    // the box's nearest corner or edge point to the seam line (corners are enough for a box this size)
    const pts = [[b.min[0], b.min[2]], [b.max[0], b.min[2]], [b.min[0], b.max[2]], [b.max[0], b.max[2]], c]; return Math.min(...pts.map((p) => { const tt = Math.max(0, Math.min(1, ((p[0] - p0[0]) * e[0] + (p[1] - p0[1]) * e[1]) / L2)); return Math.hypot(p[0] - (p0[0] + e[0] * tt), p[1] - (p0[1] + e[1] * tt)); })); };
  for (const G of S.groups) for (const q of G.seams) {
    const tag = `${q.a} | ${q.b}`, len = Math.hypot(q.p1[0] - q.p0[0], q.p1[1] - q.p0[1]), ex = [(q.p1[0] - q.p0[0]) / len, (q.p1[1] - q.p0[1]) / len];
    // separators: each named kind has a piece within SEAM_REACH of the seam
    for (const k of q.kinds || []) {
      if (['floorChange', 'halfWall'].includes(k)) continue;   // checked below
      const ok = Object.values(B).some((b) => (k === 'rug' ? b.asset === 'rug' && !!b.sep : b.sep === k) && (k === 'rug' || distSeg(b, q.p0, q.p1) <= SEAM_REACH) && (k !== 'rug' || distSeg(b, q.p0, q.p1) <= 0.5 * Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) + SEAM_REACH));
      if (!ok) out.push({ rule: 'open-separator', what: `${tag}: the separator "${k}" the roll dealt does not stand within ${SEAM_REACH} mm of the seam: place a piece with sep: '${k}' by the seam` });
    }
    // walkway: along the seam line, the stretch free of floor furniture (within 300 mm of the line) is at least WALKWAY mm
    const blocked = Object.values(B).filter((b) => FLOOR(b) && distSeg(b, q.p0, q.p1) < 300).map((b) => { const ts = [[b.min[0], b.min[2]], [b.max[0], b.min[2]], [b.min[0], b.max[2]], [b.max[0], b.max[2]]].map((p) => (p[0] - q.p0[0]) * ex[0] + (p[1] - q.p0[1]) * ex[1]); return [Math.min(...ts), Math.max(...ts)]; }).sort((a, b) => a[0] - b[0]);
    let gap = 0, at = 0; for (const [a, b] of [...blocked, [len, len]]) { gap = Math.max(gap, a - at); at = Math.max(at, b); }
    if (gap < WALKWAY) out.push({ rule: 'open-walkway', what: `${tag}: the widest free stretch across the seam is ${Math.round(gap)} mm (${WALKWAY} at least): move furniture off the seam` });
    // island clearance: nothing nearer than ISLAND_GAP[0] to the kitchen's runs, and not further than ISLAND_GAP[1] + 50 (it should serve the run)
    for (const [id, b] of Object.entries(B)) {
      if (!(b.sep === 'island')) continue;
      const runs = Object.entries(B).filter(([i, r]) => i !== id && r.area === b.area && ['baseRun', 'fridge'].includes(r.asset)), d = runs.length ? Math.min(...runs.map(([, r]) => rectGap(b, r))) : null;
      if (d !== null && d < ISLAND_GAP[0] - 5) out.push({ rule: 'open-island', what: `${id} is ${Math.round(d)} mm from the nearest run (${ISLAND_GAP[0]} to ${ISLAND_GAP[1]} mm clear)` });
      if (d !== null && d > ISLAND_GAP[1] + 150) out.push({ rule: 'open-island', what: `${id} is ${Math.round(d)} mm from the nearest run: too far to serve it (${ISLAND_GAP[0]} to ${ISLAND_GAP[1]} mm)` });
    }
  }
  // ---- floor change: the zones of the two areas differ, and a furniture separator stands by the line
  for (const G of S.groups) for (const q of G.seams) if (q.kinds?.includes('floorChange')) {
    const Z = S.home.floor?.zones || [], mid = (b) => [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2], at = (id) => { const c = mid(area[id].bounds); return Z.find((z) => c[0] >= z.rect[0] && c[0] <= z.rect[2] && c[1] >= z.rect[1] && c[1] <= z.rect[3]); }, za = at(q.a), zb = at(q.b);
    if (!za || !zb || za.style === zb.style) out.push({ rule: 'open-floor', what: `${q.a} | ${q.b}: floorChange dealt, but the two areas have the same floor style (H.floorZones({ ${q.a}: 'tiles', ${q.b}: 'boards' }))` });
    const fur = Object.values(B).some((b) => FURNITURE.includes(b.sep || '') && distSeg(b, q.p0, q.p1) <= 500);
    if (!fur) out.push({ rule: 'open-floor', what: `${q.a} | ${q.b}: the floor changes on the seam line, but no furniture separator stands within 500 mm of it` });
  }
  // ---- glide: nothing switches on or off between areas of one group
  for (const G of S.groups) for (let i = 0; i + 1 < G.areas.length; i++) {
    const r = await page.evaluate(([a, b]) => {
      const c = window.cozyScene, vis = () => [...Object.values(c.home.objects).map((o) => o.visible ? 1 : 0), ...c.home.walls.map((w) => w.node.visible ? 1 : 0)].join('');
      c.setArea(a, true); const v0 = vis(); c.startGlide(b, true); const bad = [];
      for (const k of [0.1, 0.3, 0.5, 0.7, 0.9]) { c.glideAt(k); if (vis() !== v0) bad.push(k); }
      c.glideAt(1); const v1 = vis(); return { bad, same: v0 === v1 };
    }, [G.areas[i], G.areas[i + 1]]);
    if (r.bad.length || !r.same) out.push({ rule: 'open-glide', what: `${G.areas[i]} -> ${G.areas[i + 1]}: pieces switch on or off during the glide (at ${r.bad.join(', ') || 'the end'})` });
  }
  // ---- glimpse: renders. Each neighbour's pixels (the frame with the group drawn, against the frame with that neighbour hidden) stay at one side edge, within 25% of the width, off the hero / subject; a middle area may show one neighbour at each edge
  if (!quick) for (const G of S.groups) for (const id of G.areas) {
    const idx = G.areas.indexOf(id), views = [{ name: 'home view', shot: null }, ...(area[id].camera?.shots || []).map((s, i) => ({ name: `shot "${s.name}"`, shot: i, subject: s.subject, across: s.across }))];
    for (const v of views) {
      const r = await glimpse(page, id, G.areas, idx, v);
      if (r.far > 150) out.push({ rule: 'open-glimpse', what: `${id} ${v.name}: ${r.far} pixels of an area two steps away show: aim away from it` });
      for (const n of r.each) {
        if (v.across === n.id) continue;   // an across-the-seam shot looks into this neighbour on purpose
        const t = `${id} ${v.name}, ${n.id}`;
        if (n.left > 40 && n.right > 40) out.push({ rule: 'open-glimpse', what: `${t}: shows at both side edges (one side only)` });
        if (Math.max(n.reachL, n.reachR) > GLIMPSE * 1.02) out.push({ rule: 'open-glimpse', what: `${t}: takes ${(100 * Math.max(n.reachL, n.reachR)).toFixed(0)}% of the frame's width (${GLIMPSE * 100}% at most): turn the view away or move it` });
        if (n.mid > 80) out.push({ rule: 'open-glimpse', what: `${t}: ${n.mid} pixels in the middle of the frame (a neighbour touches a side edge only)` });
        if (n.cover > 0.02) out.push({ rule: 'open-glimpse', what: `${t}: covers ${(100 * n.cover).toFixed(0)}% of the ${v.shot === null ? 'hero' : 'subject'}` });
      }
    }
  }
  // ---- light: with the light baked, the floor's brightness on both sides of a seam differs by a few percent at most (one floor sheet per group)
  if (!quick) for (const G of S.groups) for (const q of G.seams) {
    const r = await lightAcross(page, q, Object.values(B).filter((b) => b.mount !== 'wall' && b.mount !== 'lines' && b.mount !== 'ceiling' && b.asset !== 'rug').map((b) => [b.min[0], b.min[2], b.max[0], b.max[2]]));
    if (r === null) continue;
    if (r > 8) out.push({ rule: 'open-light', what: `${q.a} | ${q.b}: the floor is ${(100 * r / 255).toFixed(1)}% brighter on one side of the seam (under 3%): the light bake shows a step` });
  }
  return out;
}
// the mean floor brightness 300 to 900 mm either side of a seam, from a top-down frame of the baked page with every object hidden
async function lightAcross(page, q, feet) {   // feet: footprints of the objects; a sample point within 900 mm of one is skipped (the baked contact shadows reach that far) (its contact shadow is no step)
  const url = page.url().replace(/\?check.*$/, ''), ctx = await page.context().browser().newContext(), p2 = await ctx.newPage(); await p2.setViewportSize({ width: 1200, height: 750 });
  try {
    await p2.goto(url, { timeout: 180000 }); await p2.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 240000 });
    await p2.evaluate(() => { const c = window.cozyScene; c.setArea(c.areaIds[0], true); c.controls.enabled = false; c.tour.update = () => false; for (const g of Object.values(c.objects)) { g.visible = false; g.userData.tick = null; g.userData.update = null; } for (const w of c.home.walls) w.node.visible = false; });
    const mid = [(q.p0[0] + q.p1[0]) / 2, (q.p0[1] + q.p1[1]) / 2], len = Math.hypot(q.p1[0] - q.p0[0], q.p1[1] - q.p0[1]), n = q.normal;
    await p2.evaluate(([mid, len]) => { const c = window.cozyScene; c.camera.fov = 30; c.camera.up.set(0, 0, -1); c.camera.position.set(mid[0], len * 2.2 + 3000, mid[1]); if (c.controls.target) c.controls.target.set(mid[0], 0, mid[1]); c.camera.lookAt(mid[0], 0, mid[1]); c.camera.updateProjectionMatrix(); c.camera.updateMatrixWorld(true); }, [mid, len]);
    await p2.waitForTimeout(500);
    const png = (await p2.screenshot()).toString("base64");
    return await p2.evaluate(async ([png, q, n, feet]) => {
      const c = window.cozyScene, T = c.kit.THREE, im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + png; }), cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const lum = (wx, wz) => { const v = new T.Vector3(wx, 0, wz).project(c.camera), px = (v.x + 1) / 2 * im.width, py = (1 - v.y) / 2 * im.height, d = x.getImageData(Math.max(0, px - 6), Math.max(0, py - 6), 12, 12).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return s / (d.length / 4); };
      const e = [q.p1[0] - q.p0[0], q.p1[1] - q.p0[1]], L = Math.hypot(...e); let sa = 0, sb = 0, k = 0;
      const free = (px, pz) => !feet.some((f) => px > f[0] - 900 && px < f[2] + 900 && pz > f[1] - 900 && pz < f[3] + 900);
      for (let i = 1; i < 20; i++) for (const off of [300, 500, 700, 900]) { const bx = q.p0[0] + e[0] * i / 20, bz = q.p0[1] + e[1] * i / 20, ax = bx - n[0] * off, az = bz - n[1] * off, cx = bx + n[0] * off, cz = bz + n[1] * off; if (!free(ax, az) || !free(cx, cz)) continue; sa += lum(ax, az); sb += lum(cx, cz); k++; }
      return k < 4 ? null : Math.abs(sa - sb) / k;
    }, [png, q, n, feet]);
  } finally { await ctx.close(); }
}
// one view of area `id`: per neighbour, counts of its pixels at the left edge, the right edge and the middle
async function glimpse(page, id, group, idx, v) {
  await page.evaluate(() => { window.__op = false; });
  const set = (hide) => page.evaluate(([id, group, hide, v]) => {
    const c = window.cozyScene, areaOfWall = (w) => c.areaIds.find((q) => (w.id || '').startsWith(q + '-'));
    if (!window.__op) { c.setArea(id, true); if (v.shot !== null) { const s = c.areas[id].camera.shots[v.shot]; c.controls.minDistance = 10; c.at(s.from, s.look); c.camera.fov = s.fov || 30; c.camera.updateProjectionMatrix(); } window.__op = true; for (const g of Object.values(c.objects)) { g.userData.tick = null; g.userData.update = null; } c.tour.update = () => false; }
    const gone = hide.concat(c.areaIds.filter((q) => !group.includes(q)));   // areas outside the group are never drawn at rest
    for (const g of Object.values(c.objects)) g.visible = !gone.includes(g.userData.scene.area);
    for (const w of c.home.walls) w.node.visible = !gone.includes(areaOfWall(w));
  }, [id, group, hide, v]);
  const snap = async (hide) => { await set(hide); await page.waitForTimeout(250); return (await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 690 } })).toString('base64'); };
  const nbrs = group.filter((q, i) => Math.abs(i - idx) === 1), twoAway = group.filter((q, i) => Math.abs(i - idx) >= 2);
  const full = await snap([]), full2 = await snap([]), noFar = twoAway.length ? await snap(twoAway) : full, hid = [];
  for (const n of nbrs) hid.push(await snap([n]));
  const rect = await page.evaluate(([id, v]) => {   // the hero's or the subject's rectangle in pixels
    const c = window.cozyScene, T = c.kit.THREE, ids = Object.keys(c.objects).filter((k) => { const s = c.objects[k].userData.scene; return s.area === id && (v.shot === null ? s.hero : v.subject && s.group === v.subject); });
    if (!ids.length) return null; const b = new T.Box3(); for (const k of ids) b.union(new T.Box3().setFromObject(c.objects[k]));
    const xs = [], ys = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = new T.Vector3(x, y, z).project(c.camera); xs.push((p.x + 1) / 2 * 1200); ys.push((1 - p.y) / 2 * 750); }
    return [Math.max(0, Math.min(...xs)), Math.max(0, Math.min(...ys)), Math.min(1200, Math.max(...xs)), Math.min(690, Math.max(...ys))];
  }, [id, v]);
  return page.evaluate(async ([full, full2, far, hid, nbrs, rect]) => {
    const load = (d) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + d; }), px = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
    const [A, A2, F] = (await Promise.all([full, full2, far].map(load))).map(px), Hs = (await Promise.all(hid.map(load))).map(px), W = 1200, Hh = 690, diff = (P, Q, o) => Math.abs(P[o] - Q[o]) + Math.abs(P[o + 1] - Q[o + 1]) + Math.abs(P[o + 2] - Q[o + 2]);
    let nFar = 0; const each = nbrs.map((id) => ({ id, left: 0, right: 0, mid: 0, cover: 0, colsL: new Array(W).fill(0), colsR: new Array(W).fill(0) })), area = rect ? Math.max(1, (rect[2] - rect[0]) * (rect[3] - rect[1])) : 0;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4; if (diff(A, A2, o) > 12) continue;   // what moves by itself is not a neighbour
      if (diff(A, F, o) > 12) nFar++;
      each.forEach((e, k) => { if (diff(A, Hs[k], o) <= 18) return; if (x < W * 0.25) e.left++; else if (x >= W * 0.75) e.right++; else e.mid++; if (x < W / 2) e.colsL[x]++; else e.colsR[x]++; if (rect && x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3]) e.cover++; });
    }
    for (const e of each) { let rl = 0, xr = W; for (let x = 0; x < W / 2; x++) if (e.colsL[x] >= 6) rl = Math.max(rl, (x + 1) / W); for (let x = W - 1; x >= W / 2; x--) if (e.colsR[x] >= 6) xr = x; e.reachL = rl; e.reachR = (W - xr) / W; e.cover = area ? e.cover / area : 0; delete e.colsL; delete e.colsR; }
    return { far: nFar, each };
  }, [full, full2, noFar, hid, nbrs, rect]);
}
function overlapAlong(q, a, b) {   // how far the two floors overlap across the seam (negative: a gap)
  const n = q.normal, A = a, B = b, proj = (bb, sgn) => { const xs = [bb.x0, bb.x1], zs = [bb.z0, bb.z1], v = []; for (const x of xs) for (const z of zs) v.push(x * n[0] + z * n[1]); return sgn > 0 ? Math.max(...v) : Math.min(...v); };
  return proj(A, 1) - proj(B, -1);   // a's far edge along the seam's normal minus b's near edge
}
function rectGap(a, b) { const dx = Math.max(a.min[0] - b.max[0], b.min[0] - a.max[0], 0), dz = Math.max(a.min[2] - b.max[2], b.min[2] - a.max[2], 0); return Math.hypot(dx, dz); }
function cross(p, q, a, b) {   // segment p-q crosses segment a-b strictly inside both (a shared end does not count)
  const d = (u, v, w) => (v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]), d1 = d(a, b, p), d2 = d(a, b, q), d3 = d(p, q, a), d4 = d(p, q, b);
  return d1 * d2 < -1e-6 && d3 * d4 < -1e-6;
}
