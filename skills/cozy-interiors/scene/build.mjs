#!/usr/bin/env node
// node build.mjs → kitchen-scene.html next to this file: one self-contained page.
// Markers in src/index.html: <!-- @inline:file.css|.js --> (wrapped in <style>/<script>), <!-- @bundle:main.js -->
// (esbuild bundles its imports), @asset:path (a base64 data URI, inside the inlined CSS too) and @build:datetime.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'src');
const esbuild = createRequire(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('esbuild');   // global install: npm i -g esbuild
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
// shell-test.html and runs-test.html: the room shell and the library runs on their own (open in a browser, or drive window.shellTest / window.runsTest).
const bundle = (entry) => safe(esbuild.buildSync({ entryPoints: [join(src, entry)], bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none' }).outputFiles[0].text);
for (const name of ['shell-test', 'runs-test']) {
  const page = `<!doctype html><html><head><meta charset="utf-8"><title>${name}</title><style>html,body{margin:0;height:100%;background:#f4f4f1}canvas{width:100%;height:100%;display:block}</style></head><body><canvas id="scene"></canvas><script>${bundle(name + '.js')}</script></body></html>`;
  writeFileSync(join(here, name + '.html'), page);
  console.log(name + '.html', (page.length / 1024).toFixed(0), 'KB');
}
