// node assets/oblique.mjs [assets.json] [outdir] → every painting x colour mode on a wall, seen at 65 degrees at home-view size (about 70 px wide, like the left wall of a home view), measured in the rendered pixels:
// mean brightness 100-215, share of edge pixels, number of tonal steps (library/paintTone.js toneStats/structStats). A painting that smears or turns grey at that angle fails. Needs Playwright and esbuild (global). Prints rows; exit 1 on a failure.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2] || join(here, 'assets.json')), out = resolve(process.argv[3] || join(here, 'oblique-out')), AZ = Number(process.env.AZ || 65), EDGES = Number(process.env.EDGES || 0.06), STEPS = Number(process.env.STEPS || 4);
mkdirSync(out, { recursive: true });
execSync(`node ${join(here, '../../../skills/cozy-interiors/scene/build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const tone = readFileSync(join(here, '../../../skills/cozy-interiors/scene/src/library/paintTone.js'), 'utf8').replace(/^export /gm, '');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 700, height: 700 } }), meas = await browser.newPage();
await meas.addScriptTag({ content: tone });
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e)));
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
await page.evaluate(() => window.cozyScene.setArea('sheet', true));
const S = JSON.parse(readFileSync(scene, 'utf8')), bad = []; let n = 0;
for (const o of S.home.objects) {
  if (o.asset !== 'picture' || !/^sheet-pic\d/.test(o.id)) continue;
  const key = o.id.replace(/^sheet-/, ''), [x, y0, z] = o.at;
  const r = await page.evaluate(async ([id, az]) => {
    const C = window.cozyScene, T = C.kit.THREE, g = C.home.objects[id], b = new T.Box3().setFromObject(g), cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2, z = b.max.z;
    C.controls.minDistance = 10; C.controls.minAzimuthAngle = -Infinity; C.controls.maxAzimuthAngle = Infinity; C.controls.minPolarAngle = 0; C.controls.maxPolarAngle = Math.PI;
    C.look(6000, az, 8, [cx, cy, z]); const c = C.camera; c.fov = 28; c.updateProjectionMatrix(); c.updateMatrixWorld(); await new Promise((r) => setTimeout(r, 900));
    const ins = 74, pts = [[b.min.x + ins, b.min.y + ins], [b.max.x - ins, b.min.y + ins], [b.min.x + ins, b.max.y - ins], [b.max.x - ins, b.max.y - ins]].map(([px, py]) => { const v = new T.Vector3(px, py, z).project(c); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
    return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])) };
  }, [o.id, AZ]);
  const png = await page.screenshot({ path: join(out, key + `-az${AZ}.png`), timeout: 120000 });
  const s = await meas.evaluate(async ([b64, r]) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const x = Math.max(0, Math.round(r.x0)), y = Math.max(0, Math.round(r.y0)), w = Math.max(4, Math.round(r.x1 - r.x0)), h = Math.max(4, Math.round(r.y1 - r.y0)), c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d', { willReadFrequently: true }); q.drawImage(img, x, y, w, h, 0, 0, w, h); const D = q.getImageData(0, 0, w, h); return { ...toneStats(D), ...structStats(D), w, h }; }, [png.toString('base64'), r]);
  n++; console.log(`${key} at ${AZ} deg: ${s.w}x${s.h} px, mean ${Math.round(s.mean)}, edges ${(s.edges * 100).toFixed(0)}%, steps ${s.steps}`);
  if (s.mean < 100 || s.mean > 215 || s.edges < EDGES || s.steps < STEPS) bad.push(`${key}: at ${AZ} degrees, ${s.w} px wide: mean ${Math.round(s.mean)}, edges ${(s.edges * 100).toFixed(0)}% (${EDGES * 100}% at least), tonal steps ${s.steps} (${STEPS} at least): it smears or greys out in a home view`);
}
await browser.close();
console.log(bad.map((b) => `[painting-oblique] ${b}`).join('\n') || `every painting x mode reads at ${AZ} degrees (${n} checked)`); console.log(`${bad.length} oblique painting problem(s)`);
process.exit(bad.length ? 1 : 0);
