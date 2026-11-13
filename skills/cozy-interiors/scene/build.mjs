#!/usr/bin/env node
// node build.mjs <scene.json> [out.html] → one self-contained page for any scene (src/page.html + page.js + run.js, the scene bundled in). Without an argument it builds the old kitchen:
// node build.mjs → kitchen-scene.html next to this file: one self-contained page.
// Markers in src/index.html: <!-- @inline:file.css|.js --> (wrapped in <style>/<script>), <!-- @bundle:main.js -->
// (esbuild bundles its imports), @asset:path (a base64 data URI, inside the inlined CSS too) and @build:datetime.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'src');
const esbuild = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('esbuild');   // global install: npm i -g esbuild
if (process.argv[2]) {   // scene mode
  const scenePath = resolve(process.argv[2]), scene = readFileSync(scenePath, 'utf8'), name = process.argv[2].replace(/^.*\//, '').replace(/\.json$/, '');
  JSON.parse(scene);
  const out = process.argv[3] ? resolve(process.argv[3]) : join(dirname(scenePath), name + '.html');
  const js = esbuild.buildSync({ entryPoints: [join(src, 'page.js')], bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none', define: { __SCENE__: scene } }).outputFiles[0].text;
  const html = readFileSync(join(src, 'page.html'), 'utf8').replace('@title', name).replace('<!-- @bundle:page.js -->', () => `<script>${js.replace(/<\/script/g, '<\\/script')}</script>`);
  writeFileSync(out, html);
  console.log(out, (html.length / 1024).toFixed(0), 'KB');
  process.exit(0);
}
const MIME = { '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const assets = (s) => s.replace(/@asset:([\w./-]+)/g, (_, p) => `data:${MIME[extname(p)]};base64,${readFileSync(join(src, p)).toString('base64')}`);
const now = new Date(), pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
const safe = (js) => js.replace(/<\/script/g, '<\\/script');
let html = readFileSync(join(src, 'index.html'), 'utf8')
  .replace(/<!-- @inline:([\w.-]+) -->/g, (_, f) => { const t = readFileSync(join(src, f), 'utf8'); return f.endsWith('.css') ? `<style>\n${t}</style>` : `<script>\n${safe(t)}</script>`; })
  .replace('<!-- @bundle:main.js -->', () => `<script>${safe(esbuild.buildSync({ entryPoints: [join(src, 'main.js')], bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none' }).outputFiles[0].text)}</script>`);
html = assets(html).replace(/@build:datetime/g, stamp);
if (/@(asset|inline|bundle|build):/.test(html)) { console.error('unresolved marker'); process.exit(1); }
writeFileSync(join(here, 'kitchen-scene.html'), html);
console.log('kitchen-scene.html', (html.length / 1024).toFixed(0), 'KB');
// shell-test.html: the room shell on its own (open in a browser, or drive window.shellTest).
const bundle = (entry) => safe(esbuild.buildSync({ entryPoints: [join(src, entry)], bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none' }).outputFiles[0].text);
for (const name of ['shell-test']) {
  const page = `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title><style>html,body{margin:0;height:100%;background:#f4f4f1}canvas{width:100%;height:100%;display:block}</style></head><body><canvas id="scene"></canvas><script>${bundle(name + '.js')}</script></body></html>`;
  writeFileSync(join(here, name + '.html'), page);
  console.log(name + '.html', (page.length / 1024).toFixed(0), 'KB');
}
