#!/usr/bin/env node
// node build.mjs <scene.json> [out.html] → one self-contained page for any scene (src/page.html + page.js + run.js, the scene bundled in).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { globalPkg } from './needs.mjs';
import { execSync } from 'node:child_process';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'src');
const esbuild = globalPkg('esbuild');   // global install: npm i -g esbuild
if (!process.argv[2]) { console.error('usage: node build.mjs <scene.json> [out.html]'); process.exit(1); }
if (process.argv.includes('--deliver')) {   // node build.mjs <scene.json> <out.html> --deliver: refuses while what check-home found blocks a delivery (stages.mjs: physical faults, believability rules), or when its last full run is not of this exact scene file
  const { createHash } = await import('node:crypto'), { existsSync } = await import('node:fs'), sp = resolve(process.argv[2]), vp = sp.replace(/\.json$/, '.verdict.json'), fail = (m) => { console.error(`not delivered: ${m}`); process.exit(1); };
  if (!existsSync(vp)) fail(`no check result next to the scene: run  node check-home.mjs ${process.argv[2]}  in full (no --quick, no --until) first`);
  const v = JSON.parse(readFileSync(vp, 'utf8'));
  if (v.sceneSha !== createHash('sha256').update(readFileSync(sp)).digest('hex')) fail('the scene changed since the last check-home run: run it again in full');
  if (!v.full) fail('the last check-home run was --quick or --until: run it in full');
  if (v.blocking || v.errors) fail(`${v.blocking} finding(s) block a delivery${v.errors ? ` and ${v.errors} page error(s)` : ''} (a piece inside another, in a wall or in the air, or a believability rule: no waiver, fix them):\n${(v.blockingLines || []).slice(0, 12).join('\n')}`);
  console.log(`checks: ${v.issues} open finding(s), none blocking: say them in the delivery note`);
}
{
  const scenePath = resolve(process.argv[2]), scene = readFileSync(scenePath, 'utf8'), name = process.argv[2].replace(/^.*\//, '').replace(/\.json$/, '');
  JSON.parse(scene);
  const out = process.argv[3] ? resolve(process.argv[3]) : join(dirname(scenePath), name + '.html');
  const js = esbuild.buildSync({ entryPoints: [join(src, 'page.js')], bundle: true, format: 'iife', minify: !process.env.NOMIN, write: false, legalComments: 'none', define: { __SCENE__: scene } }).outputFiles[0].text;
  const html = readFileSync(join(src, 'page.html'), 'utf8').replace('@title', name).replace('<!-- @bundle:page.js -->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
  writeFileSync(out, html);
  console.log(out, (html.length / 1024).toFixed(0), 'KB');
  process.exit(0);
}
