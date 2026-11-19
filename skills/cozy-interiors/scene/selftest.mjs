#!/usr/bin/env node
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
  for (const [w, h] of [[1100, 500], [1400, 450], [800, 600], [600, 800], [500, 500], [300, 400], [400, 1200]]) for (const form of Array.from({ length: ASSETS.picture.variants }, (_, k) => k)) for (const seed of [2, 9]) {
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
  try { area.put(id, a, [2000 + col * 3000, 2000 + row * 3000], 0, { group: 'g', y: ASSETS[a].y === 'top' ? 800 : 0, mount: ASSETS[a].mount === 'on' ? 'floor' : ASSETS[a].mount === 'wall' || ASSETS[a].mount === 'ceiling' || ASSETS[a].mount === 'lines' ? 'floor' : undefined }); } catch (e) { console.log(`skipped ${id}: ${e.message.slice(0, 80)}`); }
}
const dir = fs.mkdtempSync(join(os.tmpdir(), 'selftest-')), json = join(dir, 'sheet.json');
H.write(json, fs);
const { checkParts } = await import('./geom/parts.mjs');
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
