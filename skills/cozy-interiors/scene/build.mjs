#!/usr/bin/env node
// node build.mjs <scene.json> [out.html] → one self-contained page for any scene (src/page.html + page.js + run.js, the scene bundled in).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'src');
const esbuild = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('esbuild');   // global install: npm i -g esbuild
if (!process.argv[2]) { console.error('usage: node build.mjs <scene.json> [out.html]'); process.exit(1); }
{
  const scenePath = resolve(process.argv[2]), scene = readFileSync(scenePath, 'utf8'), name = process.argv[2].replace(/^.*\//, '').replace(/\.json$/, '');
  JSON.parse(scene);
  const out = process.argv[3] ? resolve(process.argv[3]) : join(dirname(scenePath), name + '.html');
  const js = esbuild.buildSync({ entryPoints: [join(src, 'page.js')], bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none', define: { __SCENE__: scene } }).outputFiles[0].text;
  const html = readFileSync(join(src, 'page.html'), 'utf8').replace('@title', name).replace('<!-- @bundle:page.js -->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
  writeFileSync(out, html);
  console.log(out, (html.length / 1024).toFixed(0), 'KB');
  process.exit(0);
}
