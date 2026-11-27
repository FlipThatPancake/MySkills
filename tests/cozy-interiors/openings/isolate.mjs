#!/usr/bin/env node
// node tests/cozy-interiors/openings/isolate.mjs <scene.json> <area> [shot|home]  → which draw covers a window's outside picture.
// The picture of the first visible window goes magenta; the page is drawn with every group of draws (same material kind, render order, transparency) hidden in turn; the groups whose hiding brings magenta back hide part of it: frames and furniture in front legitimately, the paper floor when the whole picture is gone.
// Round 5 item 1: the only group that did was the one opaque flat-colour mesh with render order 0, the paper floor (home.js wallMat). Needs Playwright and esbuild (global).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url)), scene = resolve(process.argv[2] || ''), [area, shot = 'home'] = process.argv.slice(3);
if (!process.argv[2] || !area) { console.log('usage: node isolate.mjs <scene.json> <area> [shot|home]'); process.exit(1); }
execSync(`node ${join(here, '../../../skills/cozy-interiors/scene/build.mjs')} ${scene}`, { stdio: 'ignore' });
const { chromium } = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
await page.goto('file://' + scene.replace(/\.json$/, '.html'));
await page.waitForFunction(() => window.cozyScene && window.cozyBaked, null, { timeout: 280000 });
const cf = scene.replace(/\.json$/, '.cameras.json'), cam = shot !== 'home' && fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8'))[area]?.[shot] : null;
const r = await page.evaluate(([area, cam]) => {
  const c = window.cozyScene; c.loop(false); c.setArea(area, true); c.controls.enabled = false; c.tour.update = () => false;
  if (cam) { c.camera.fov = cam[2]; c.camera.updateProjectionMatrix(); c.at(cam[0], cam[1]); } c.advance(1.5);
  const vis = (m) => { for (let o = m; o; o = o.parent) if (!o.visible) return false; return true; };
  const sky = []; c.scene.traverse((m) => { if (m.name === 'outside-backdrop' && vis(m)) sky.push(m); });
  if (!sky.length) return { error: 'no visible outside picture in this view' };
  const s = sky[0]; s.material.map = null; s.material.color.set(0xff00ff); s.material.needsUpdate = true;
  const count = () => { const cv = c.draw(), k = document.createElement('canvas'); k.width = cv.width; k.height = cv.height; k.getContext('2d').drawImage(cv, 0, 0); const d = k.getContext('2d').getImageData(0, 0, k.width, k.height).data; let n = 0; for (let j = 0; j < d.length; j += 4) if (Math.min(d[j], d[j + 2]) - d[j + 1] > 40) n++; return n; };
  const base = count(), groups = new Map();
  c.scene.traverse((m) => { if (m.isMesh && m !== s && m.visible) { const mt = m.material, k = `${mt.type} renderOrder ${m.renderOrder} ${mt.transparent ? 'transparent' : 'opaque'}${mt.isShaderMaterial ? ' uniforms ' + Object.keys(mt.uniforms || {}).slice(0, 3) : ''}${m.name ? ' name ' + m.name : ''}`; (groups.get(k) || groups.set(k, []).get(k)).push(m); } });
  const rows = []; for (const [k, ms] of groups) { ms.forEach((m) => { m.visible = false; }); rows.push({ k, n: ms.length, magenta: count() }); ms.forEach((m) => { m.visible = true; }); }
  return { base, rows };
}, [area, cam]);
if (r.error) { console.log(r.error); } else {
  console.log(`picture shown as drawn: ${r.base} px`);
  for (const x of r.rows.sort((a, b) => b.magenta - a.magenta)) console.log(`${x.magenta > r.base + 50 ? 'MORE   ' : '       '} hiding ${String(x.n).padStart(3)} x ${x.k} -> ${x.magenta} px`);
  console.log('MORE marks a group that hides part of the picture. Frames, sashes and furniture in front do (they should). When the picture is gone altogether (0 px as drawn), the group whose hiding brings it back is the bug.');
}
await browser.close();
