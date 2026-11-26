// check-openplan.mjs — the open-plan rules of check-home (it calls openPlanIssues(page, sceneFile, { quick }) at the end; nothing here runs for a home without `groups`).
import { nbrRule } from './openshot.mjs';
// Layout: joined bounds touch or overlap by 1000 mm at most; back walls meet end to end; no wall on a seam; a walkway of 900 mm or more across every seam; an island keeps 1000 to 1250 mm from the kitchen run.
// Separators: each one the spec named (H.join(..., { separators })) stands within 800 mm of its seam (an object with `sep: '<kind>'`; a rug by its edge); at least one is furniture.
// Tour shots (geometry, openshot.mjs): a neighbouring area shows only behind the shot's subject, never in front of it, and is never the subject (rule open-shot).
// Glimpse (home view only, needs renders): a neighbour's pixels touch one side edge only and take at most 25% of the frame's width; none covers the hero or the shot's subject; an area two steps away does not show.
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
      // seats at an island or peninsula are counter stools (seat about 650 mm), never a dining chair: a chair beside it that serves no table
      for (const [ci, c] of Object.entries(B)) if (['chair', 'deskChair', 'armchair'].includes(c.asset) && rectGap(b, c) < 450 && !Object.values(B).some((t) => ['table', 'roundTable', 'desk'].includes(t.asset) && rectGap(t, c) < 600)) out.push({ rule: 'open-island-seat', what: `${ci} is a ${c.asset} at ${id}: seats at an island or peninsula are counter stools (stool, seat about 650 mm)` });
    }
  }
  const zonesDiffer = (q) => { const Z = S.home.floor?.zones || [], mid = (b) => [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2], at = (id) => { const c = mid(area[id].bounds); return Z.find((z) => c[0] >= z.rect[0] && c[0] <= z.rect[2] && c[1] >= z.rect[1] && c[1] <= z.rect[3]); }, a = at(q.a), b = at(q.b); return !!(a && b && a.style !== b.style); };   // an open room keeps one floor; where the kitchen part is tiles the change is checked like a dealt floorChange
  // ---- floor change: the zones of the two areas differ, and a furniture separator stands by the line
  for (const G of S.groups) for (const q of G.seams) if (q.kinds?.includes('floorChange') || zonesDiffer(q)) {
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
  // ---- tour shots: a neighbour may show only BEHIND the subject (openshot.mjs), and the subject belongs to this area
  for (const G of S.groups) for (const id of G.areas) for (const [i, sh] of (area[id].camera?.shots || []).entries()) {
    if (sh.subject && !sh.subject.startsWith(id + ':')) { out.push({ rule: 'open-shot', what: `${id} shot "${sh.name}": its subject "${sh.subject}" belongs to another area: a neighbour is never the subject of a tour shot` }); continue; }
    const bad = await page.evaluate(([id, i, group, src]) => {
      const c = window.cozyScene, T = c.kit.THREE, rule = new Function('return ' + src)(), sh = c.areas[id].camera.shots[i];
      c.setArea(id, true); c.controls.minDistance = 10; c.at(sh.from, sh.look); c.camera.fov = sh.fov || 30; c.camera.updateProjectionMatrix(); c.camera.updateMatrixWorld(true);
      const box = (k) => new T.Box3().setFromObject(c.objects[k]), keys = Object.keys(c.objects), ar = (k) => c.objects[k].userData.scene.area;
      const hero = keys.filter((k) => ar(k) === id && (sh.subject ? c.objects[k].userData.scene.group === sh.subject : c.objects[k].userData.scene.hero));
      if (!hero.length) return null;
      const nb = keys.filter((k) => ar(k) !== id && group.includes(ar(k))).map((k) => ({ id: k, box: box(k) }));
      return rule(T, c.camera, hero.map(box), nb);
    }, [id, i, G.areas, nbrRule.toString()]);
    if (bad) out.push({ rule: 'open-shot', what: `${id} shot "${sh.name}": ${bad} (a neighbouring area) stands in front of the subject: a neighbour may show only behind the subject, never in front of it` });
  }
  // ---- glimpse: renders. Each neighbour's pixels (the frame with the group drawn, against the frame with that neighbour hidden) stay at one side edge, within 25% of the width, off the hero / subject; a middle area may show one neighbour at each edge
  if (!quick) await page.evaluate(() => window.cozyScene.loop(false));   // renders are drawn on demand (cozyScene.draw): the live loop and page screenshots cost seconds a frame in software GL
  if (!quick) for (const G of S.groups) for (const id of G.areas) {
    const idx = G.areas.indexOf(id), views = [{ name: 'home view', shot: null }, ...(area[id].camera?.shots || []).map((s, i) => ({ name: `shot "${s.name}"`, shot: i, subject: s.subject, across: s.across }))];
    for (const v of views) {
      const t0 = Date.now(), r = await glimpse(page, id, G.areas, idx, v); if (process.argv.includes('--time')) console.error(`[time]   glimpse ${id} ${v.name}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      if (r.far > 150) out.push({ rule: 'open-glimpse', what: `${id} ${v.name}: ${r.far} pixels of an area two steps away show: aim away from it` });
      for (const n of r.each) {
        if (v.shot !== null) continue;   // a tour shot follows the behind-the-subject rule above, not the home-view glimpse
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
    const t0 = Date.now(), r = await lightAcross(page, q, Object.values(B).filter((b) => b.mount !== 'wall' && b.mount !== 'lines' && b.mount !== 'ceiling' && b.asset !== 'rug').map((b) => [b.min[0], b.min[2], b.max[0], b.max[2]]));
    if (process.argv.includes('--time')) console.error(`[time]   light across ${q.a} | ${q.b}: ${((Date.now() - t0) / 1000).toFixed(1)} s (brightness step ${r === null ? "not measured: " + (await page.evaluate(() => window.__lightK)) + " free samples, 4 needed" : r.toFixed(2)})`);
    if (r === null) continue;
    if (r > 8) out.push({ rule: 'open-light', what: `${q.a} | ${q.b}: the floor is ${(100 * r / 255).toFixed(1)}% brighter on one side of the seam (under 3%): the light bake shows a step` });
  }
  await closeLightPage(page); if (!quick) await page.evaluate(() => window.cozyScene.loop(true));   // the live loop stays stopped while the second page loads: two software-GL pages drawing at once each take several times as long
  return out;
}
// the seam light frame is drawn on the checked page itself (a second page took a minute to load and draw next to the first): its objects, walls and camera are saved first and put back at the end of openPlanIssues
const lightPage = async (page) => { await page.evaluate(() => { if (window.__lightSave) return; const c = window.cozyScene; window.__lightSave = { vis: Object.values(c.objects).map((g) => [g, g.visible]), walls: c.home.walls.map((w) => [w.node, w.node.visible]), up: c.camera.up.clone(), fov: c.camera.fov, area: c.area, ctl: c.controls.enabled }; }); return page; };
const closeLightPage = (page) => page.evaluate(() => { const S = window.__lightSave; if (!S) return; for (const [g, v] of S.vis) g.visible = v; for (const [n, v] of S.walls) n.visible = v; const c = window.cozyScene; c.camera.up.copy(S.up); c.camera.fov = S.fov; c.controls.enabled = S.ctl; c.camera.updateProjectionMatrix(); c.setArea(S.area, true); window.__lightSave = null; });
// the mean floor brightness 300 to 900 mm either side of a seam, from a top-down frame of the baked page with every object hidden
async function lightAcross(page, q, feet) {   // feet: footprints of the objects; a sample point within 900 mm of one is skipped (the baked contact shadows reach that far) (its contact shadow is no step)
  const p2 = await lightPage(page);   // the checked page itself, state saved once
  try {
    await p2.evaluate(() => { const c = window.cozyScene; c.setArea(c.areaIds[0], true); c.controls.enabled = false; c.tour.update = () => false; for (const g of Object.values(c.objects)) { g.visible = false; g.userData.tick = null; g.userData.update = null; } for (const w of c.home.walls) w.node.visible = false; });
    const mid = [(q.p0[0] + q.p1[0]) / 2, (q.p0[1] + q.p1[1]) / 2], len = Math.hypot(q.p1[0] - q.p0[0], q.p1[1] - q.p0[1]), n = q.normal;
    await p2.evaluate(([mid, len]) => { const c = window.cozyScene; c.camera.fov = 30; c.camera.up.set(0, 0, -1); c.camera.position.set(mid[0], len * 2.2 + 3000, mid[1]); if (c.controls.target) c.controls.target.set(mid[0], 0, mid[1]); c.camera.lookAt(mid[0], 0, mid[1]); c.camera.updateProjectionMatrix(); c.camera.updateMatrixWorld(true); }, [mid, len]);
    const png = await p2.evaluate(() => { const c = window.cozyScene; c.advance(1); return c.draw().toDataURL('image/png').split(',')[1]; });
    return await p2.evaluate(async ([png, q, n, feet]) => {
      const c = window.cozyScene, T = c.kit.THREE, im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + png; }), cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const lum = (wx, wz) => { const v = new T.Vector3(wx, 0, wz).project(c.camera), px = (v.x + 1) / 2 * im.width, py = (1 - v.y) / 2 * im.height, d = x.getImageData(Math.max(0, px - 6), Math.max(0, py - 6), 12, 12).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return s / (d.length / 4); };
      const e = [q.p1[0] - q.p0[0], q.p1[1] - q.p0[1]], L = Math.hypot(...e); let sa = 0, sb = 0, k = 0;
      const free = (px, pz) => !feet.some((f) => px > f[0] - 900 && px < f[2] + 900 && pz > f[1] - 900 && pz < f[3] + 900);
      for (let i = 1; i < 20; i++) for (const off of [300, 500, 700, 900]) { const bx = q.p0[0] + e[0] * i / 20, bz = q.p0[1] + e[1] * i / 20, ax = bx - n[0] * off, az = bz - n[1] * off, cx = bx + n[0] * off, cz = bz + n[1] * off; if (!free(ax, az) || !free(cx, cz)) continue; sa += lum(ax, az); sb += lum(cx, cz); k++; }
      window.__lightK = k; return k < 4 ? null : Math.abs(sa - sb) / k;
    }, [png, q, n, feet]);
  } finally { /* state is put back by closeLightPage(page) */ }
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
  const snap = async (hide) => { await set(hide); return page.evaluate(() => { const c = window.cozyScene; c.advance(0.5); const cv = c.draw(), w = cv.width, h = Math.round(cv.height * 690 / 750), k = document.createElement('canvas'); k.width = w; k.height = h; k.getContext('2d').drawImage(cv, 0, 0, w, h, 0, 0, w, h); return k.toDataURL('image/png').split(',')[1]; }); };   // one frame, the top 690 of 750 rows
  const nbrs = group.filter((q, i) => Math.abs(i - idx) === 1), twoAway = group.filter((q, i) => Math.abs(i - idx) >= 2);
  const full = await snap([]), full2 = full, noFar = twoAway.length ? await snap(twoAway) : full, hid = [];
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

// ---- the glide through the house plan, for every move the arrow keys and the area buttons make (rule 'glide'): sampled at k = 0.1 to 0.9, the camera never stands inside a solid wall, the view centre is never behind a wall that is not fading, and the move turns the view and leaves the straight line (a pure sideways slide fails)
const OPEN_TOP = { arch: 2250, door: 2100 };
const segDist = (p, a, b) => { const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2)) : 0; return Math.hypot(p[0] - a[0] - t * (b[0] - a[0]), p[1] - a[1] - t * (b[1] - a[1])); };
const MAX_PITCH = 60, CORRIDOR_HALF = 450, GLIDE_MAX_SPEED = 9000;   // the glide walks the corridor of check-home 4a (a 900 mm strip kept clear), so furniture may stand 450 mm off its line; the speed is mm per second (src/glidepath.js: the average is 5000 and the ease puts the middle at 1.5 times that)
export async function glideIssues(page, sceneFile) {
  const S = JSON.parse(readFileSync(sceneFile, 'utf8')), out = [], P = S.home.plan; if (!P?.links?.length) return out;
  const H = S.home.height || 2700, walls = S.home.walls.map((w) => { const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), u = [(w.to[0] - w.from[0]) / len, (w.to[1] - w.from[1]) / len]; return { id: w.id, from: w.from, to: w.to, len, u, n: [u[1], -u[0]], gaps: (w.openings || []).filter((o) => OPEN_TOP[o.kind]).map((o) => ({ lo: o.at - (o.width || 1000) / 2, hi: o.at + (o.width || 1000) / 2, top: OPEN_TOP[o.kind] })) }; });
  const gapAt = (W, p, y) => { const at = (p[0] - W.from[0]) * W.u[0] + (p[1] - W.from[1]) * W.u[1]; return W.gaps.some((g) => at >= g.lo && at <= g.hi && y < g.top); };
  const checked = new Set(), moves = []; const seen = new Set(); for (const l of P.links) { for (const [a, b] of [[l.a, l.b], [l.b, l.a]]) if (!seen.has(a + b)) { seen.add(a + b); moves.push([a, b]); } }
  for (let i = 0; i + 1 < (P.walk || []).length; i++) { const k = P.walk[i] + P.walk[i + 1]; if (!seen.has(k)) { seen.add(k); moves.push([P.walk[i], P.walk[i + 1]]); } }
  for (const [a, b] of moves) {
    const s = await page.evaluate(([a, b]) => { const c = window.cozyScene; c.setArea(a, true); c.startGlide(b, true); const r = []; for (const k of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) { c.glideAt(k); c.home.update(c.camera, c.controls.target); const T = c.kit.THREE; c.camera.updateMatrixWorld(true); const fur = (c.__fur ||= Object.entries(c.home.objects).filter(([, o]) => o.userData.scene?.mount === 'floor' && !['rug', 'curtain'].includes(o.userData.scene.asset)).map(([id, o]) => { o.updateMatrixWorld(true); const bx = new T.Box3(), bb = new T.Box3(); o.traverse((m) => { if (!m.isMesh || m.isLineSegments2 || m.userData.lines || m.material.isMeshBasicMaterial) return; m.geometry.computeBoundingBox(); bx.union(bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); }); return { id, bx }; }).filter((f) => !f.bx.isEmpty()));
      let near = 1e9, nearId = '', fill = 0, fillId = ''; for (const f of fur) { const d = f.bx.distanceToPoint(c.camera.position); if (d < near) { near = d; nearId = f.id; } const xs = [], ys = []; let front = true; for (const x of [f.bx.min.x, f.bx.max.x]) for (const y of [f.bx.min.y, f.bx.max.y]) for (const z of [f.bx.min.z, f.bx.max.z]) { const v = new T.Vector3(x, y, z).project(c.camera); const w = new T.Vector3(x, y, z).applyMatrix4(c.camera.matrixWorldInverse).z; if (w >= 0) front = false; xs.push(v.x); ys.push(v.y); } if (!front) { if (d < 1000) { const px = [], py = []; for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) for (let k2 = 0; k2 <= 6; k2++) { const q = new T.Vector3(f.bx.min.x + (f.bx.max.x - f.bx.min.x) * i / 6, f.bx.min.y + (f.bx.max.y - f.bx.min.y) * j / 6, f.bx.min.z + (f.bx.max.z - f.bx.min.z) * k2 / 6), w2 = q.clone().applyMatrix4(c.camera.matrixWorldInverse).z; if (w2 >= -50) continue; const v2 = q.project(c.camera); px.push(v2.x); py.push(v2.y); }   /* a box beside or round the camera: only the part in front of it can be in the frame */ const fr2 = px.length ? Math.max(0, Math.min(1, Math.max(...px)) - Math.max(-1, Math.min(...px))) * Math.max(0, Math.min(1, Math.max(...py)) - Math.max(-1, Math.min(...py))) / 4 : 0; if (fr2 > fill) { fill = fr2; fillId = f.id; } } continue; } const fr = Math.max(0, Math.min(1, Math.max(...xs)) - Math.max(-1, Math.min(...xs))) * Math.max(0, Math.min(1, Math.max(...ys)) - Math.max(-1, Math.min(...ys))) / 4; if (fr > fill) { fill = fr; fillId = f.id; } }
let veil = 0, veilId = ''; { const top = c.home.height || 2700, cp = c.camera.position, rays = []; for (let i = 0; i < 16; i++) for (let jj = 0; jj < 10; jj++) rays.push(new T.Vector3((i + 0.5) / 8 - 1, (jj + 0.5) / 5 - 1, 0.5).unproject(c.camera).sub(cp).normalize());   // 160 rays through the frame
        for (const w of c.home.walls) { const v = (w.goal ?? w.vis.value); if (v < 0.05 || v > 0.95 || !w.node.visible) continue; const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), ux = (w.to[0] - w.from[0]) / len, uz = (w.to[1] - w.from[1]) / len, nx = uz, nz = -ux; let hit = 0; for (const r of rays) { const den = r.x * nx + r.z * nz; if (Math.abs(den) < 1e-9) continue; const t = ((w.from[0] - cp.x) * nx + (w.from[1] - cp.z) * nz) / den; if (t <= 0) continue; const x = cp.x + r.x * t, y = cp.y + r.y * t, z = cp.z + r.z * t, al = (x - w.from[0]) * ux + (z - w.from[1]) * uz; if (al >= 0 && al <= len && y >= 0 && y <= top) hit++; } if (hit / rays.length > veil) { veil = hit / rays.length; veilId = w.id + ' (fade ' + v.toFixed(2) + ', camera ' + Math.round((cp.x - w.to[0]) * nx + (cp.z - w.to[1]) * nz) + ' mm from its plane)'; } } }
            const dids = Object.keys(c.home.objects).filter((i) => i.startsWith(b + '-')); let dIn = 0; for (const i of dids) { const o = c.home.objects[i]; o.updateMatrixWorld(true); const v = new T.Vector3().setFromMatrixPosition(o.matrixWorld).project(c.camera); if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1) dIn++; } r.push({ k, dest: dids.length ? dIn / dids.length : 1, dn: dids.length, secs: c.glide ? c.glide.secs : 1.6, p: c.camera.position.toArray(), t: c.controls.target.toArray(), fade: c.home.walls.map((w) => (w.goal ?? w.vis.value)), near, nearId, fill, fillId, veil, veilId, hung: c.home.blockers.filter((b) => b.wall && b.wall.goal === 0 && b.goal > 0.5).map((b) => b.id + ' on ' + b.wall.id), shade: c.home.blockers.filter((b) => b.sv.value > (b.cur ?? 1) + 0.02).map((b) => b.id) }); if (k === 1) break; } return r; }, [a, b]);
    const bad = [], tag = `${a} -> ${b}`; if (process.env.GDEBUG) console.log('GD', tag, JSON.stringify(s.slice(0, +(process.env.GDEBUG) || 3).map((q) => [q.k, Math.round(q.dest * 100), q.fill.toFixed(2), q.p.map(Math.round), q.t.map(Math.round)])));
    for (const q of s.slice(1, -1)) {
      for (const W of walls) {
        if (q.p[1] < H && segDist([q.p[0], q.p[2]], W.from, W.to) < 60 && !gapAt(W, [q.p[0], q.p[2]], q.p[1])) { bad.push(`the camera stands inside ${W.id} at k ${q.k}`); break; }
        const side = (p) => (p[0] - W.from[0]) * W.n[0] + (p[2] - W.from[1]) * W.n[1];   // the room is on the +n side; a wall fades once the camera is past it
        if (side(q.p) > 150 && side(q.t) < -150) { const t = side(q.p) / (side(q.p) - side(q.t)), x = [q.p[0] + (q.t[0] - q.p[0]) * t, q.p[2] + (q.t[2] - q.p[2]) * t], y = q.p[1] + (q.t[1] - q.p[1]) * t, along = (x[0] - W.from[0]) * W.u[0] + (x[1] - W.from[1]) * W.u[1]; if (along > 0 && along < W.len && y < H && !gapAt(W, x, y) && q.fade[walls.indexOf(W)] > 0.5) { bad.push(`${W.id} stands between the camera and the view centre at k ${q.k} and is not fading`); break; } }
      }
      if (!bad.length && q.near < CORRIDOR_HALF) bad.push(`the camera comes within ${Math.round(q.near)} mm of ${q.nearId} at k ${q.k} (keep ${CORRIDOR_HALF} mm from furniture, half of the 900 mm corridor check-home rule path keeps clear between the entries; high over the rest)`);
      if (!bad.length && q.k >= 0.5 && q.k <= 0.6 && q.dest < 0.15 && q.dn >= 6) bad.push(`only ${Math.round(q.dest * 100)}% of ${b}'s pieces are in the frame at k ${q.k} (a mid-move frame shows the room being entered: 15% at least)`);
      if (!bad.length && q.fill > (q.k < 0.9 ? 0.3 : 0.4) && !(q.p[1] > H && q.dest >= 0.5)) bad.push(`${q.fillId} fills ${Math.round(q.fill * 100)}% of the frame at k ${q.k} (the move flies over it: keep the camera further off or higher; above the wall tops the destination's share in the frame decides, 50% of its pieces at least)`);
      if (!bad.length && q.shade.length) bad.push(`the contact shadow of ${q.shade[0]} is drawn while the piece is faded at k ${q.k}`);
      if (!bad.length && q.hung.length) bad.push(`${q.hung[0]} is drawn while its wall is faded out (a piece on a wall fades with its wall) at k ${q.k}`);
      if (!bad.length && q.veil > 1 / 3) bad.push(`${q.veilId} stands part-faded over ${Math.round(q.veil * 100)}% of the frame at k ${q.k} (a milky veil: a wall the camera is about to pass must fade out completely over a short distance)`);
      if (bad.length) break;
    }
    if (!bad.length && s[0].veil > 1 / 3) bad.push(`${s[0].veilId} stands part-faded over ${Math.round(s[0].veil * 100)}% of the frame at k 0 (a milky veil)`);
    if (!bad.length && !checked.has(a)) {   // k = 0 is the start area's at-rest home view: the same camera and the same things drawn, walls at the same fade (pixels are not compared: the at-rest view sways a little)
      checked.add(a);
      const st = await page.evaluate(([a, b]) => { const c = window.cozyScene, snap = () => { c.home.update(c.camera, c.controls.target, false, true); return { p: c.camera.position.toArray(), t: c.controls.target.toArray(), o: Object.entries(c.home.objects).filter(([, o]) => o.visible).map(([i]) => i).join(), w: c.home.walls.map((w) => (w.node.visible ? 1 : 0) + ':' + (w.goal ?? w.vis.value).toFixed(2) + ':' + (w.plane ? (w.plane.visible ? 1 : 0) : '')).join() }; }; c.setArea(a, true); const rest = snap(); c.setArea(a, true); c.startGlide(b, true); c.glideAt(0); return { rest, g0: snap() }; }, [a, b]);
      const dp = Math.max(...st.rest.p.map((v, i) => Math.abs(v - st.g0.p[i])), ...st.rest.t.map((v, i) => Math.abs(v - st.g0.t[i])));
      if (dp > 5 || st.rest.o !== st.g0.o || st.rest.w !== st.g0.w) bad.push(`k 0 differs from the at-rest view of ${a} (${dp > 5 ? 'the camera is ' + Math.round(dp) + ' mm off' : st.rest.o !== st.g0.o ? 'other things are drawn' : 'walls are faded differently: ' + st.rest.w.split(',').map((x, i) => x === st.g0.w.split(',')[i] ? null : `wall ${i} ${x} vs ${st.g0.w.split(',')[i]}`).filter(Boolean).join('; ')}): the move must start from the home view itself`); }
    if (process.env.GDEBUG) console.log('BAD', tag, JSON.stringify(bad));
    if (bad.length) out.push({ rule: 'glide', what: `${tag}: ${bad[0]}` });
    const head = (q) => Math.atan2(q.t[0] - q.p[0], q.t[2] - q.p[2]) * 180 / Math.PI, h0 = head(s[0]), turn = Math.max(...s.map((q) => Math.abs((((head(q) - h0) % 360) + 540) % 360 - 180))), A = s[0].p, B = s[s.length - 1].p, chord = Math.hypot(B[0] - A[0], B[2] - A[2]) || 1, dev = Math.max(...s.map((q) => Math.abs((q.p[0] - A[0]) * (B[2] - A[2]) - (q.p[2] - A[2]) * (B[0] - A[0])) / chord));
    {   // round 6 (B3, "rapid move, close-up, pull away, close-up"): the camera moves at an even, calm speed and keeps about the distance to what it looks at (a short close-up at an opening is fine, a swoop is not)
      const secs = s[0].secs, step = (q, i) => Math.hypot(...q.p.map((v, j) => v - s[i].p[j])) / ((q.k - s[i].k) * secs), spd = Math.max(...s.slice(1).map((q, i) => step(q, i))), dist = s.map((q) => Math.hypot(...q.t.map((v, j) => v - q.p[j]))), d0 = dist[0], d1 = dist[dist.length - 1], lo = Math.min(...dist), hi = Math.max(...dist);
      const pitch = Math.max(...s.slice(1, -1).map((q) => Math.asin((q.p[1] - q.t[1]) / (Math.hypot(...q.t.map((v, j) => v - q.p[j])) || 1)) * 180 / Math.PI)), why = pitch > MAX_PITCH ? `the camera looks down at ${Math.round(pitch)} degrees (${MAX_PITCH} at most: a mid-move frame reads as looking into a room, not down on a plan, which the page never shows)` : Math.max(d0, d1) > 30000 ? '' : spd > GLIDE_MAX_SPEED ? `the camera rushes at ${Math.round(spd)} mm/s over ${Math.round(secs * 10) / 10} s (${GLIDE_MAX_SPEED} at most: a longer move takes longer)` : lo < 0.15 * Math.min(d0, d1) ? `the camera comes to ${Math.round(lo)} mm of what it looks at (the views stand ${Math.round(d0)} and ${Math.round(d1)} mm off): a close-up in the middle of the move` : hi > 3 * Math.max(d0, d1) ? `the camera pulls away to ${Math.round(hi)} mm from what it looks at (the views stand ${Math.round(d0)} and ${Math.round(d1)} mm off)` : '';
      if (why) out.push({ rule: 'glide', what: `${tag}: ${why}` }); }
    if (turn < 20 && dev < 0.08 * chord) out.push({ rule: 'glide', what: `${tag}: a pure sideways slide (the view turns ${Math.round(turn)} degrees and the camera keeps to one line): the plan should turn the neighbours apart (different walls back them, or a different entry)` });
  }
  return out;
}

// ---- orbit: what stands between the camera and its target fades out (rule 'orbit'). In every area's home view the camera swings about 80 degrees either way at a few heights; a sample fails when an unfaded object (not the subject group, not the thing looked at) is hit by the ray from the camera to the view centre, or when a piece of the subject group fades at rest.
export async function orbitIssues(page, sceneFile) {
  const S = JSON.parse(readFileSync(sceneFile, 'utf8')), out = [];
  for (const A of S.areas || []) {
    const bad = await page.evaluate((id) => {
      const c = window.cozyScene, T = c.kit.THREE; c.setArea(id, true); const tg = c.controls.target.clone(), off = c.camera.position.clone().sub(tg), dist = off.length(), az0 = Math.atan2(off.x, off.z) * 180 / Math.PI, el0 = Math.asin(off.y / dist) * 180 / Math.PI, res = [];
      const B = c.home.blockers, viaWall = (b) => { for (let q = b, n = 0; q && n < 8; q = q.onB, n++) if (q.wall && q.wall.goal === 0) return true; return false; }, ray = new T.Raycaster(), meshes = (g) => { const m = []; g.traverse((o) => { if (o.isMesh && !o.isLineSegments2 && o.material && !o.material.isMeshBasicMaterial && o.visible) m.push(o); }); return m; };
      c.camera.updateMatrixWorld(true); c.sync(); c.home.update(c.camera, c.controls.target, true, true);   // the home view itself: every piece of the area's groups is drawn at full opacity (a piece hung on a wall that fades with it is the wall's)
      for (const b of B) if (b.grp && b.area === id && (b.cur ?? 1) < 0.98 && !viaWall(b)) { res.push(`${b.id} is drawn at ${Math.round(100 * (b.cur ?? 1))}% in the home view: the home view fades no piece of the area's own groups (the camera line passes through it: move the view target or the piece)`); break; }
      for (const b of B) if (b.g.userData.scene && b.g.userData.scene.area === id && b.g.userData.scene.mount === 'wall' && !b.wall) { res.push(`${b.id} is hung on a wall but no wall was found for it (it would stay when the wall fades)`); break; }
      for (const d of [-80, -40, 0, 40, 80]) for (const el of [Math.max(8, el0 - 8), el0 + 14, el0 + 32]) {
        c.look(dist, az0 + d, el, tg.toArray()); c.camera.updateMatrixWorld(true); c.sync(); c.home.update(c.camera, c.controls.target, true, true);   // instant: each fade has settled, so what is drawn equals where it is heading
        const P = c.camera.position, dir = tg.clone().sub(P), L = dir.length(); ray.set(P, dir.normalize());
        for (const b of B) { if (b.main && b.goal < 1 && !viaWall(b)) { res.push(`a piece of the subject group (${b.id}) fades at az ${Math.round(az0 + d)}, el ${Math.round(el)}`); break; } }
        for (const b of B) if (b.sv.value > (b.cur ?? 1) + 0.02) { res.push(`the contact shadow of ${b.id} is drawn (${b.sv.value.toFixed(2)}) while the piece is faded (${(b.cur ?? 1).toFixed(2)}) at az ${Math.round(az0 + d)}, el ${Math.round(el)}`); break; }
        if (res.length) break;
        for (const b of B) { if (b.goal < 0.5 || b.main || !b.g.userData.scene || b.g.userData.scene.area !== id || new T.Box3().setFromObject(b.g).expandByScalar(100).containsPoint(tg)) continue; const hit = ray.intersectObjects(meshes(b.g), false)[0]; if (hit && hit.distance < L - 300) { res.push(`${b.id} stands unfaded between the camera and the view centre at az ${Math.round(az0 + d)}, el ${Math.round(el)} (it is ${Math.round(hit.distance)} mm out of ${Math.round(L)})`); break; } }
        for (const b of B) if (b.wall && b.wall.goal === 0 && b.goal > 0.5 && (b.cur ?? 1) > 0.5) { res.push(`${b.id} hangs in the air at az ${Math.round(az0 + d)}, el ${Math.round(el)}: the wall ${b.wall.id} it hangs on is faded out and it is not`); break; }   // a piece hung on a wall goes with the wall (home.js B.wall)
        for (const b of B) if (b.onB && b.goal > 0.5 && b.onB.goal === 0 && (b.cur ?? 1) > 0.5) { res.push(`${b.id} hangs in the air at az ${Math.round(az0 + d)}, el ${Math.round(el)}: ${b.onB.id}, which it stands on, is faded out and it is not`); break; }   // a faded table takes what stands on it along (home.js supportOf)
        if (res.length) break;
        // a neighbouring room shows only through a door's or arch's outline (portal mask, area-run.js): the picture with the neighbour drawn and the picture without it may differ inside the openings only; a difference elsewhere is the neighbour showing through a window or past a wall's end
        if (c.portal.size) {
          const W0 = 160, H0 = 100, cv = document.createElement('canvas'); cv.width = W0; cv.height = H0; const x2 = cv.getContext('2d', { willReadFrequently: true }), grab = () => { x2.drawImage(c.draw(), 0, 0, W0, H0); return x2.getImageData(0, 0, W0, H0).data.slice(); };
          const A1 = grab(), saved = [], hide = [];
          for (const o of Object.values(c.home.objects)) if (c.portal.has(o.userData.scene.area)) hide.push(o);
          for (const w of c.home.walls) if (c.portal.has(c.orderArea(w)) && !w.walk.length) hide.push(w.node);
          for (const o of hide) { saved.push(o.visible); o.visible = false; }
          const A2 = grab(); hide.forEach((o, i) => { o.visible = saved[i]; });
          const rects = []; c.scene.traverse((o) => { if (o.name !== 'portal-mask') return; for (let q = o; q; q = q.parent) if (!q.visible) return; const b = new T.Box3().setFromObject(o); let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const xx of [b.min.x, b.max.x]) for (const yy of [b.min.y, b.max.y]) for (const zz of [b.min.z, b.max.z]) { const v = new T.Vector3(xx, yy, zz).project(c.camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } rects.push([(x0 + 1) / 2 * W0 - 8, (1 - y1) / 2 * H0 - 8, (x1 + 1) / 2 * W0 + 8, (1 - y0) / 2 * H0 + 8]); });
          let bad = 0; for (let i = 0; i < W0 * H0; i++) { const px = i % W0, py = (i / W0) | 0; if (Math.abs(A1[i * 4] - A2[i * 4]) + Math.abs(A1[i * 4 + 1] - A2[i * 4 + 1]) + Math.abs(A1[i * 4 + 2] - A2[i * 4 + 2]) > 30 && !rects.some((r) => px >= r[0] && px <= r[2] && py >= r[1] && py <= r[3])) bad++; }
          if (bad > 25) { res.push(`the room behind a way through shows outside the opening (${bad} px of ${W0 * H0} differ with it switched off; through a window or past a wall's end) at az ${Math.round(az0 + d)}, el ${Math.round(el)}: it must show through the door or arch only (portal mask, area-run.js)`); break; } }
        if (res.length) break;
        // through the arches and doors: the first room beyond each (src/area-run.js sync) must fill the opening from every angle of the orbit where the camera stands on this side; a ray through the opening that meets nothing above the floor shows empty white
        c.sync(); c.home.group.updateMatrixWorld(true);
        for (const l of (c.S.home.plan?.links || [])) { if (l.kind === 'open' || (l.a !== id && l.b !== id)) continue;
          const dir = l.a === id ? 1 : -1, side = ((P.x - l.p[0]) * l.d[0] + (P.z - l.p[1]) * l.d[1]) * dir; if (side > -100) continue;   // the camera is past the way's plane: the room behind it is not drawn (and the area is seen from beyond)
          const ms = []; c.scene.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || !o.material) return; for (let q = o; q; q = q.parent) if (!q.visible) return; if (o.material.transparent && o.material.opacity < 0.5) return; ms.push(o); });
          const px = -l.d[1], pz = l.d[0]; let miss = 0, n = 0;
          for (const u of [-350, -175, 0, 175, 350]) for (const y of [700, 1100, 1500, 1800]) { const S = new T.Vector3(l.p[0] + px * u, y, l.p[1] + pz * u), r = S.clone().sub(P), dl = r.length(); ray.set(P, r.normalize()); n++;
            if (!ray.intersectObjects(ms, false).some((h) => h.distance > dl + 80 && (h.point.y > 300 || r.y < 0))) miss++; }
          const nb = l.a === id ? l.b : l.a; if (!l.shows?.[nb] || miss / n > 0.75) { res.push(`through the ${l.kind} to ${nb} the view shows empty white (${l.shows?.[nb] ? '' : 'the room behind is not drawn; '}${miss} of ${n} sight lines through the opening meet nothing) at az ${Math.round(az0 + d)}, el ${Math.round(el)}: draw the first room behind the way through (area-run.js sync)`); break; } }
        if (res.length) break;
      }
      c.setArea(id, true); return res;
    }, A.id);
    for (const w of bad) out.push({ rule: 'orbit', what: `${A.id}: ${w}` });
  }
  return out;
}
