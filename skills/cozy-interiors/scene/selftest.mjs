#!/usr/bin/env node
import { globalPkg } from './needs.mjs';
// node selftest.mjs [asset ...] [--variants=3] → lays out every asset (or the named ones) in a few dealt variants on a bare floor and asks the geometry core (geom/parts.mjs, Node only, no page) which assets have a part passing right through another (20 mm)
// (a magazine through the sling of its rack, a book through a shelf board). Each finding names the asset and the parts; fix the asset, never one home.
import fs from 'node:fs';
import os from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Home } from './compose.mjs';
import { ASSETS } from './src/library/meta.js';
import { picture } from './src/library/variants.js';
// Picture art stays inside its frame: draw every form at wide, tall and square sizes against a recording kit, and look at every line point.
{
  const rec = []; const node = () => new Proxy(function () {}, { get: (_, k) => (k === 'then' ? undefined : node()), apply: () => node() });
  const kit = new Proxy({}, { get: (_, k) => (k === 'lines' ? (pts) => { rec.push(...pts); return node(); } : k === 'merge' ? () => node() : k === 'THREE' ? node() : () => node()) });
  let bad = 0, n = 0;
  for (const [w, h] of [[1100, 500], [1400, 450], [800, 600], [600, 800], [500, 500], [300, 400], [400, 1200]]) for (const form of Array.from({ length: 4 + ASSETS.picture.variants }, (_, k) => k)) for (const seed of [2, 9]) {
    rec.length = 0; picture(kit, { form, w, h, seed }); n++;
    const out = rec.filter(([x, y]) => Math.abs(x) > w / 2 - 28 + 0.5 || y < 28 - 0.5 || y > h - 28 + 0.5);
    if (out.length) { bad++; console.log(`[art] picture form ${form} ${w}x${h} seed ${seed}: ${out.length} line point(s) outside the frame, first at x ${Math.round(out[0][0])} y ${Math.round(out[0][1])}`); }
  }
  console.log(`${bad} picture variant(s) with lines outside the frame, of ${n} checked`);
}
import { createKit } from './src/kitchen3d.js';
import { REGISTRY } from './src/library/index.js';
// Two runs in line share one worktop: the end where they meet draws no outline (no seam mark). A run with abutEnd has no outline segment on its end plane; without the flag it has one.
{
  const kit = createKit(), mods = [{ w: 600, kind: 'doors' }, { w: 600, kind: 'doors' }], ends = (abutEnd) => {
    const g = REGISTRY.baseRun(kit, { modules: mods, abutEnd }); let n = 0;
    g.traverse((o) => { if (o.userData.kitLine && o.geometry?.attributes?.instanceStart ) { const A = o.geometry.attributes.instanceStart, B = o.geometry.attributes.instanceEnd; for (let k = 0; k < A.count; k++) if (Math.abs(A.getX(k) - 1200) < 0.5 && Math.abs(B.getX(k) - 1200) < 0.5 && Math.min(A.getY(k), B.getY(k)) > 880) n++; } });
    return n;
  };
  const on = ends(false), off = ends(true);
  console.log(off < on && off === 0 ? `worktop seam: ok (${on} end-outline segments without the flag, ${off} with it)` : `[seam] a run with abutEnd still draws its worktop end outline (${off} segments, ${on} without the flag)`);
}
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), K = Number((args.find((a) => a.startsWith('--variants=')) || '--variants=3').split('=')[1]), named = args.filter((a) => !a.startsWith('--'));
const list = (named.length ? named : Object.keys(ASSETS)).filter((a) => ASSETS[a] && !['baseRun', 'wallRun', 'pendantLamp'].includes(a));
const H = new Home({ seed: 11, floor: 'plain' }), area = H.area('t', 'T', { rect: [0, 0, 60000, 60000] });
let i = 0; const where = {};
for (const a of list) for (let k = 0; k < K; k++) {
  const id = `${a}-${k}`, col = i % 12, row = Math.floor(i / 12); i++;
  try { area.put(id, a, [2000 + col * 3000, 2000 + row * 3000], 0, { group: 'g', y: ASSETS[a].y === 'top' ? 800 : a === 'picture' ? 900 : 0, mount: a === 'picture' ? 'wall' : ASSETS[a].mount === 'on' ? 'floor' : ASSETS[a].mount === 'wall' || ASSETS[a].mount === 'ceiling' || ASSETS[a].mount === 'lines' ? 'floor' : undefined }); } catch (e) { console.log(`skipped ${id}: ${e.message.slice(0, 80)}`); }
}
const dir = fs.mkdtempSync(join(os.tmpdir(), 'selftest-')), json = join(dir, 'sheet.json');
H.write(json, fs);
const { checkParts } = await import('./geom/parts.mjs');
console.log(`coverage: parts test: ${K} variants of each of ${list.length} of ${Object.keys(ASSETS).length} assets (left out: baseRun, wallRun, pendantLamp${named.length ? '; only the named assets' : ''}); params beyond those variants are not sampled`);
const found = await checkParts(json);
console.log(found.map((f) => `[parts] ${f.text}`).join('\n') || 'no part passes 20 mm into another'); console.log(`${found.length} asset variant(s) with parts through each other, of ${i} checked`);
// z-fight: two faces of different parts that face the same way within 2 mm of one plane flicker (geom/zfight.mjs). Every asset variant is checked, not only pictures.
{ const { checkZfight } = await import('./geom/zfight.mjs'), zf = await checkZfight(json); console.log(zf.map((f) => `[zfight] ${f.text}`).join('\n') || 'no two faces of one asset share a plane'); console.log(`${zf.length} asset variant(s) with faces that z-fight, of ${i} checked`); }
// report only: assets that read as one flat slab in front view (2 depth planes or fewer, at least 250 x 250 mm): geom/slabs.mjs. Not a failure; a list to look at.
{ const { slabReport } = await import('./geom/slabs.mjs'), rows = await slabReport(json), by = new Map(); for (const r of rows.filter((q) => q.slab)) (by.get(r.asset) || by.set(r.asset, []).get(r.asset)).push(r); console.log([...by].map(([a, l]) => `[slab] ${a}: ${l[0].planes} depth plane(s) in front view, ${l[0].w} x ${l[0].h} mm`).join('\n') || 'no asset reads as a flat slab'); console.log(`${by.size} asset(s) read as flat slabs (report only)`); }

// Every small thing the roll can deal on a flat top stands still for a second of gravity (Rapier, geom/settle.mjs): a thing that tips, slides or turns is named. --no-settle skips it.
if (!args.includes('--no-settle')) {
  const small = list.filter((a) => { const z = ASSETS[a].size, m = ASSETS[a]; return m.mount === 'on' && m.y === 'top' && Math.max(z[0], z[1]) <= 650 && z[2] <= 600 && !/Cloth|Throw|Runner|Rug|runner|rug|cushion|Cushion|drape/.test(a); });
  const H2 = new Home({ seed: 11, floor: 'plain' }), a2 = H2.area('t', 'T', { rect: [0, 0, 60000, 60000] }); let n = 0;
  for (const a of small) for (let k = 0; k < K; k++) { const cx = 2000 + (n % 10) * 2200, cz = 2000 + Math.floor(n / 10) * 2200; n++;
    try { a2.put(`top-${n}`, 'table', [cx, cz], 0, { group: 'g', params: { w: 1200, d: 800, h: 750, form: 'legs' } }); a2.put(`${a}-${k}`, a, [cx, cz], 0, { group: 'g', y: 750, mount: 'on', params: { seed: 11 + k * 17 } }); } catch (e) { console.log(`settle skipped ${a}-${k}: ${e.message}`); } }
  const j2 = join(dir, 'settle.json'); H2.write(j2, fs);
  const { checkScene } = await import('./geom/index.mjs'), res = await checkScene(j2, { settle: true, parts: false });
  const moved = res.findings.filter((f) => f.rule === 'moves' && !/^top-/.test(f.id));
  console.log(moved.map((f) => `[settle] ${f.text}`).join('\n') || 'every small thing stands still'); console.log(`${moved.length} of ${n} small thing variant(s) move on a flat top (${small.length} assets)`);
}

// Chair kinds keep their real overall width (references/objects/chairs/*/notes.md): each armchair shape at the smallest and largest width the space deals, and each dining chair form, measured on the built geometry.
{
  const { CHAIR_FIT } = await import('./src/library/meta.js'), { dealParams } = await import('./src/library/space.js'), kk = createKit(), T = kk.THREE;
  const LIM = { wing: [560, 720], lounge: [600, 770], rocking: [480, 640], beanbag: [800, 1000], sling: [610, 800] }, bad = [];
  const width = (m) => { m.updateMatrixWorld(true); const b = new T.Box3().setFromObject(m); return [b.max.x - b.min.x, b.max.z - b.min.z]; };
  for (const [shape, [lo, hi]] of Object.entries(LIM)) for (const wv of [0, 5000]) {
    const p = dealParams({ S: { seed: 3 }, decks: {} }, 'armchair', { shape, w: wv || 1, d: 1 }), [w] = width(REGISTRY.armchair(kk, p));
    if (w < lo || w > hi) bad.push(`armchair ${shape} (w ${p.w}): overall ${Math.round(w)} mm wide, notes say ${lo}-${hi}`);
  }
  for (const form of ['ladder', 'spindle', 'bentwood', 'upholstered']) { const [w] = width(REGISTRY.chair(kk, { form })); if (w > 560) bad.push(`dining chair ${form}: overall ${Math.round(w)} mm wide, notes say about 420-460 seat, 560 at most`); }
  console.log(bad.map((x) => `[chair-width] ${x}`).join('\n') || 'every chair kind keeps its real width'); console.log(`${bad.length} chair width problem(s)`);
}

const { TASKLAMP_POSES } = await import('./src/library/officeset.js');
// Jointed lamps offer named poses only (never free angles), and in every pose the shade's opening points down at the desk: the light from its rim hits the surface 20-700 mm in front of the foot, and the shade hangs at least 150 mm above it.
{
  const kk = createKit(), bad = []; let n = 0;
  for (const form of ['arm', 'gooseneck']) for (const shade of ['cone', 'dome']) for (const pose of TASKLAMP_POSES) {
    n++; const o = REGISTRY.taskLamp(kk, { form, shade, pose }), h = o.userData.head; if (!h) { bad.push(`taskLamp ${form}/${shade}/${pose}: no head data`); continue; }
    const t = h.at[1] / -h.dir[1], hit = h.at[2] + h.dir[2] * t;
    if (h.dir[1] > -0.5 || h.at[1] < 150 || hit < 20 || hit > 700) bad.push(`taskLamp ${form}/${shade}/${pose}: the shade opening at height ${Math.round(h.at[1])} points ${Math.round(Math.asin(-h.dir[1]) * 57.3)}° down and lights the desk ${Math.round(hit)} mm in front of the foot`);
  }
  console.log(bad.map((x) => `[pose] ${x}`).join('\n') || 'every task lamp pose points its shade down at the desk'); console.log(`${bad.length} lamp pose problem(s) of ${n} poses`);
}

// The parts that make an asset recognisable exist as real geometry (tagged userData.part, built with every part kept apart): a standing photo has its frame, its print, a stand-leg and leans back 10-15 degrees, the leg's foot as low as the frame's lowest edge; a task lamp has a base, arms or a neck, and a shade.
{
  const kk = createKit(); kk.keepParts = true; const T = kk.THREE, bad = [];
  const tris = (o) => { let n = 0; o.traverse((m) => { if (m.isMesh && m.geometry?.attributes?.position) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); return n; };
  const find = (root, name) => { const out = []; root.traverse((o) => { if (o.userData?.part === name) out.push(o); }); return out; };
  const low = (o) => { o.updateMatrixWorld(true); return new T.Box3().setFromObject(o).min.y; };
  for (const form of [0, 1, 2]) for (const tilt of [10, 12, 14]) {
    const o = REGISTRY.photoFrame(kk, { form, tilt, w: 180, h: 230 }), miss = ['frame', 'print', 'leg'].filter((n) => !find(o, n).some((m) => tris(m) >= 12)), fr = find(o, 'tilted')[0], lean = fr ? Math.abs(fr.rotation.x) * 57.2958 : 0, leg = find(o, 'leg')[0];
    if (miss.length) bad.push(`photoFrame form ${form}: missing ${miss.join(', ')}`);
    if (fr && (lean < 10 - 0.1 || lean > 15 + 0.1)) bad.push(`photoFrame form ${form} tilt ${tilt}: leans ${lean.toFixed(1)}°, 10-15 expected`);
    if (leg && Math.abs(low(leg) - low(find(o, 'frame')[0])) > 4) bad.push(`photoFrame form ${form}: the leg's foot is ${Math.round(low(leg) - low(find(o, 'frame')[0]))} mm off the frame's lowest edge: it would not stand`);
  }
  for (const form of ['arm', 'gooseneck']) for (const shade of ['cone', 'dome']) for (const pose of TASKLAMP_POSES) {
    const o = REGISTRY.taskLamp(kk, { form, shade, pose }), need = ['base', 'shade', form === 'arm' ? 'arms' : 'neck'], miss = need.filter((n) => !find(o, n).some((m) => tris(m) >= 12));
    if (miss.length) bad.push(`taskLamp ${form}/${shade}/${pose}: missing ${miss.join(', ')}`);
  }
  console.log(bad.map((x) => `[parts-present] ${x}`).join('\n') || 'standing photos and task lamps have the parts that make them recognisable'); console.log(`${bad.length} missing-part problem(s)`);
}

// Every painting x colour mode stays readable at home-view size (150 px wide): the toned image (library/paintTone.js, run as is in a browser page) must not turn into a dark smudge or a pale blank: mean brightness 100-215 of 255, and the 5th-95th percentile spread at least 80. Needs Playwright; skipped without it.
{
  const CHROMA = [Number(process.env.CHROMA_MIN || 10), Number(process.env.CHROMA_MAX || 45)], EDGES = Number(process.env.EDGES || 0.08), STEPS = Number(process.env.STEPS || 4), { PAINTINGS } = await import('./src/library/paintings.js'), { createRequire } = await import('node:module'), { execSync } = await import('node:child_process'), bad = [], rows = [];
  let chromium; try { ({ chromium } = globalPkg('playwright', true)); } catch { console.log('painting tone: skipped (no Playwright)'); }
  if (chromium) {
    const code = fs.readFileSync(join(here, 'src/library/paintTone.js'), 'utf8').replace(/^export /gm, ''), browser = await chromium.launch(), page = await browser.newPage();
    await page.setContent('<canvas id=c></canvas>'); await page.addScriptTag({ content: code + `
      window.measure = async (src, pw, ph, mode, W = 150) => { const img = new Image(); img.src = src; await img.decode(); H = Math.round(W * ph / pw), c = document.getElementById('c'); c.width = W; c.height = H; const q = c.getContext('2d', { willReadFrequently: true }); q.fillStyle = 'rgb(244,243,238)'; q.fillRect(0, 0, W, H); q.drawImage(img, 0, 0, W, H); adapt(q, 0, 0, W, H, mode); const D = q.getImageData(0, 0, W, H); return { ...toneStats(D), ...structStats(D) }; };` });
    for (const P of PAINTINGS) for (const mode of ['pastel', 'keep', 'soft', 'ink', 'sepia']) {
      const t = await page.evaluate(([src, w, h, m]) => window.measure(src, w, h, m), [P.src, P.w, P.h, mode]), u = await page.evaluate(([src, w, h, m]) => window.measure(src, w, h, m, 70), [P.src, P.w, P.h, mode]); rows.push(`${P.name.split(',')[1]?.trim() || P.name} ${mode}: mean ${Math.round(t.mean)}, p5 ${t.p5}, p95 ${t.p95}, chroma ${t.chroma.toFixed(1)}; at 70 px: mean ${Math.round(u.mean)}, edges ${(u.edges * 100).toFixed(0)}%, steps ${u.steps}`);
      if (u.mean < 100 || u.mean > 215 || u.edges < EDGES || u.steps < STEPS) bad.push(`${P.name} in ${mode} at 70 px wide: mean ${Math.round(u.mean)}, edges ${(u.edges * 100).toFixed(0)}% (${(EDGES * 100).toFixed(0)}% at least), tonal steps ${u.steps} (${STEPS} at least): it does not read in a home view`);
      if (mode === 'pastel' && (t.chroma < CHROMA[0] || t.chroma > CHROMA[1])) bad.push(`${P.name} in the default colour (pastel): chroma ${t.chroma.toFixed(1)} (${CHROMA[0]} to ${CHROMA[1]}): it reads as ${t.chroma < CHROMA[0] ? 'grey, not a very soft colour' : 'loud, not very soft'}`);
      if (t.mean < 100 || t.mean > 215 || t.p95 - t.p5 < 80) bad.push(`${P.name} in ${mode}: mean ${Math.round(t.mean)}, spread ${t.p95 - t.p5} (p5 ${t.p5}, p95 ${t.p95}): it reads as a ${t.mean < 100 ? 'dark smudge' : t.mean > 215 ? 'pale blank' : 'flat patch'}`);
    }
    await browser.close(); if (args.includes('--tones')) console.log(rows.join('\n'));
    console.log(bad.map((x) => `[painting-tone] ${x}`).join('\n') || `every painting x mode reads at home-view size (${rows.length} checked)`); console.log(`${bad.length} painting tone problem(s)`);
    if (!args.includes('--no-render')) {   // the same paintings in the rendered scene, on a wall seen at 65 degrees at home-view size: mipmaps, anisotropy, shading and angle included (tests/cozy-interiors/assets/oblique.mjs)
      const root = join(here, '../../../tests/cozy-interiors/assets'); let txt = '';
      try { execSync(`node ${join(root, 'assets.spec.mjs')}`, { env: { ...process.env, ONLY: 'pic' }, stdio: 'ignore' }); txt = execSync(`node ${join(root, 'oblique.mjs')}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { txt = String(e.stdout || '') + String(e.stderr || ''); }
      console.log(txt.split('\n').filter((l) => /painting-oblique|oblique painting|PAGE ERROR|rror/.test(l)).join('\n') || 'oblique painting test: no result');
    }
  }
}

// Round 6 item 5 (Paul: paintings grey): a picture whose spec sets no colour comes out in the default colour (a colour mode, never ink or sepia, whatever its seed), at every form and seed. Measured on the built picture (userData.tone); the chroma of the default tone is checked in the block above.
{
  (await import('./geom/load.mjs')).installDocument(); const kk = createKit(), bad = []; let n = 0;
  for (let f = 4; f < 4 + ASSETS.picture.variants; f++) for (const seed of [undefined, 1, 2, 3, 29]) { const o = REGISTRY.picture(kk, { form: f, w: 400, h: 500, ...(seed === undefined ? {} : { seed }) }); n++; if (o.userData.tone !== 'pastel') bad.push(`picture form ${f} seed ${seed ?? 'unset'}: tone ${o.userData.tone}, the default is pastel (very soft colour)`); }
  console.log(bad.map((x) => `[painting-colour] ${x}`).join('\n') || 'every painting without a colour in its spec is drawn in the default very soft colour'); console.log(`${bad.length} grey-by-default painting(s) of ${n}`);
}

// Round 6 item 4 (Paul: an odd triangle on the bed; lead: two folds read as slabs, not as the duvet): the turned-back corner of an unmade duvet is the duvet itself, one cloth. The duvet has no separate piece on it, and over the turned part (the triangle the corner folds onto) it rises at most two cloth thicknesses (2 x 7 mm) plus 6 mm of rumple above the same duvet with turn 0. The old plate-and-rod flap was a second piece, 80 mm high.
{
  (await import('./geom/load.mjs')).installDocument(); const kk = createKit(), bad = []; let n = 0;
  const top = (dv, w, turn) => { const hx = (w - 20) / 2, head = -560, V = new kk.THREE.Vector3(); let y = -1e9; dv.traverse((m) => { const A = m.geometry?.attributes?.position; if (!A) return; for (let i = 0; i < A.count; i++) { V.fromBufferAttribute(A, i).applyMatrix4(m.matrixWorld); const s = (hx - V.x) + (V.z - head); if (s >= turn && V.x >= hx - turn && V.x <= hx && V.z <= head + turn && V.z >= head) y = Math.max(y, V.y); } }); return y; };
  for (let seed = 1; seed <= 12; seed++) for (const w of [1400, 1600, 1800]) {
    const o = { w: w - 20, head: -560, foot: 1040, sagL: 110, sagR: 400, sagFoot: 250, seed }, dv = REGISTRY.duvetCloth(kk, { ...o, turn: 720 }), ref = REGISTRY.duvetCloth(kk, { ...o, turn: 0 }); n++;
    dv.updateMatrixWorld(true); ref.updateMatrixWorld(true);
    if (dv.children.length > 1) bad.push(`unmade duvet w ${w} seed ${seed}: ${dv.children.length - 1} separate piece(s) lie on the duvet: the turned-back corner is the duvet's own cloth`);
    const rise = top(dv, w, 720) - top(ref, w, 720); if (rise > 20) bad.push(`unmade duvet w ${w} seed ${seed}: the turned corner stands ${Math.round(rise)} mm above the duvet under it (20 at most, two cloth thicknesses and a little rumple): it reads as a block, not a fold`);
  }
  console.log(bad.map((x) => `[duvet] ${x}`).join('\n') || 'every unmade duvet turns its corner back as its own cloth, thin, no separate piece'); console.log(`${bad.length} duvet fold problem(s) of ${n} duvets`);
}

// Round 6 item 6 (Paul: the fridge needs sticky notes, magnets and a photo): every fridge form carries notes, free magnets and the photo, the photo a textured plane on the door (kitchen/fridge.js fridgeSigns records what it drew in userData.signs).
{
  (await import('./geom/load.mjs')).installDocument(); const kk = createKit(), bad = [];
  for (let f = 0; f < ASSETS.fridge.variants; f++) {
    const o = REGISTRY.fridge(kk, { form: f }), sg = o.userData.signs || {}; let maps = 0; o.traverse((m) => { if (m.material?.map) maps++; });
    if (!(sg.notes >= 3 && sg.magnets >= 3 && sg.photo >= 1 && maps >= 1)) bad.push(`fridge form ${f}: ${sg.notes || 0} notes, ${sg.magnets || 0} magnets, ${sg.photo || 0} photo (${maps} textured plane(s)): a fridge door carries 3 notes, 3 magnets and a photo at least`);
  }
  console.log(bad.map((x) => `[fridge-signs] ${x}`).join('\n') || 'every fridge form carries notes, magnets and a photo'); console.log(`${bad.length} fridge without signs of life`);
}

// A painting's frame follows the painting: the mat margins on the four sides differ by at most 1.5 x (the bottom may be a little deeper), at wide, tall and square boxes. Measured on the built picture (userData.fit), not on the spec.
{
  (await import('./geom/load.mjs')).installDocument(); const kk = createKit(), bad = []; let n = 0;
  for (const [w, h] of [[1100, 500], [1400, 450], [800, 600], [600, 800], [500, 500], [300, 400], [400, 1200]]) for (let f = 4; f < 4 + ASSETS.picture.variants; f++) {
    const o = REGISTRY.picture(kk, { form: f, w, h, seed: 1 }), m = o.userData.fit?.margins; n++;
    if (!m) { bad.push(`picture form ${f} ${w}x${h}: no margins recorded`); continue; }
    const hi = Math.max(...m), lo = Math.min(...m);
    if (hi / lo > 1.5) bad.push(`picture form ${f} ${w}x${h}: mat margins ${m.map(Math.round).join('/')} (left/right/top/bottom) differ by ${(hi / lo).toFixed(2)} x`);
  }
  console.log(bad.map((x) => `[mat-margins] ${x}`).join('\n') || 'every painting sits in a frame with even mat margins'); console.log(`${bad.length} uneven-margin problem(s) of ${n} pictures`);
}
