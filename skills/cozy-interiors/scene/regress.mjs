#!/usr/bin/env node
// node regress.mjs [--only=name,name] [--jobs=4] [--dir=<fixtures dir>] [--json out.json] [--keep] → the bug memory: builds every tiny fixture scene and runs check-home on it (the geometry core included, --quick: no ghost renders).
// A fixture of kind 'bug' must be reported by some check (expect.rules, naming expect.ids); 'good' must produce no physical finding; 'pending' waits for a rule that is not written yet. known: true marks a bug the checks still miss (XFAIL).
// x.deliver: after the full check-home run, `build.mjs --deliver` is tried; a refusal is the finding [deliver] (a bug fixture expects it, a good fixture must not get it).
// Result per fixture: CAUGHT | MISSED (exit 1) | XFAIL | XPASS (a known miss is now caught: remove known) | OK / BAD-ALARM (good, exit 1) / XFAIL-ALARM (a known false alarm) | PENDING | NOW-CAUGHT | ERROR (exit 1).
// Fixtures live in tests/cozy-interiors/regress/fixtures/*.mjs (default dir, found from the repo root) and export `fixtures`; see bugs.mjs for the shape. Needs Playwright and esbuild (global), like check-home.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { Home } from './compose.mjs';
import { ASSETS } from './src/library/meta.js';
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=').slice(1).join('=');
const dir = resolve(opt('dir', join(here, '../../../tests/cozy-interiors/regress/fixtures'))), jobs = Number(opt('jobs', 4)), only = opt('only', '').split(',').filter(Boolean), jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
// composition rules say whether a home looks rich enough or well framed: a bare fixture room always breaks them, so they are not what a fixture tests
import { COMP, COMP_TEXT, physical } from './geom/comp.mjs';
// rules that existed when the corpus was written: a 'pending' fixture counts as caught only by a rule name outside this list (the placement rules to come)
const OLD_RULES = new Set(['accent', 'bare', 'casing', 'cushion', 'depth', 'fill', 'floating', 'floor', 'foreground', 'frame', 'front', 'ghost', 'group', 'hidden', 'interest', 'kettle', 'lamps', 'lone', 'on-overlap', 'openings', 'overlap', 'path', 'physics', 'rug', 'rug-edge', 'rugs', 'sash', 'seat', 'seating', 'shot', 'sill', 'stool', 'support', 'surface', 'swing', 'table', 'tabletop', 'towel', 'units', 'variety', 'wall', 'overhangs', 'sunk', 'penetrates', 'parts', 'moves', 'shape-failed', 'passage']);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs') && f !== 'common.mjs').sort();
let list = []; for (const f of files) list.push(...(await import(pathToFileURL(join(dir, f)).href)).fixtures.map((x) => ({ ...x, file: join(dir, f) })));
if (only.length) list = list.filter((x) => only.includes(x.name));
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'regress-'));
// kind 'asset': a throwaway asset (fixture.asset = { meta, make(kit) }) is registered under its own name, laid out alone, and the geometry core looks inside it (geom/parts.mjs, in this process, no page)
const runAsset = async (x) => {
  try {
    const { REGISTRY } = await import('./src/library/index.js'), { checkParts } = await import('./geom/parts.mjs'), key = 'test_' + x.name.replace(/\W/g, '_'), json = join(tmp, x.name + '.json');
    REGISTRY[key] = (kit, p) => x.asset.make(kit, p); ASSETS[key] = x.asset.meta;
    const log = console.log; console.log = () => {}; try { const H = new Home({ seed: 1, floor: 'plain' }), a = H.area('t', 'T', { rect: [0, 0, 4000, 4000] }); a.put('thing', key, [2000, 2000], 0, { group: 'g' }); H.write(json, fs); } finally { console.log = log; }
    return { x, findings: (await checkParts(json)).map((f) => ({ rule: f.rule, text: f.text })), error: '' };
  } catch (e) { return { x, error: 'asset: ' + e.message, findings: [] }; }
};
const run = (x) => new Promise((res) => {
  const json = join(tmp, x.name + '.json');
  if (x.asset) return res(runAsset(x));
  if (x.replay) fs.copyFileSync(join(dir, x.replay), json);   // kind 'replay': a saved round home (a scene json); no build step

  if (x.refuses) { const log = console.log; console.log = () => {}; let msg = ''; try { x.build({ Home }); } catch (e) { msg = e.message; } finally { console.log = log; } return res({ x, findings: msg.includes(x.refuses) ? [{ rule: 'refused', text: msg }] : [], error: '' }); }   // fixture.refuses: the build must throw with this text (compose refuses it)
  if (!x.replay) try { const log = console.log; console.log = () => {}; let H; try { H = x.build({ Home }); H.write(json, fs); } finally { console.log = log; } if (x.patch) { const S = JSON.parse(fs.readFileSync(json, 'utf8')); x.patch(S); fs.writeFileSync(json, JSON.stringify(S)); } } catch (e) { return res({ x, error: 'build: ' + e.message, findings: [] }); }
  let out = ''; const p = spawn('node', [join(here, 'check-home.mjs'), json, '--all', ...((x.pairs || []).some(([r]) => r === 'visible') || x.deliver ? [] : ['--quick']), '--all']); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  p.on('close', () => { if (x.deliver) { const d = spawnSync('node', [join(here, 'build.mjs'), json, json.replace(/\.json$/, '.out.html'), '--deliver'], { encoding: 'utf8' }); out += d.status === 0 ? '' : `\n[deliver] ${String(d.stderr).trim().split('\n')[0]}\n`; } const findings = out.split('\n').map((l) => l.match(/^\[([\w-]+)\] (.*)$/)).filter(Boolean).map((m) => ({ rule: m[1], text: m[2] })), err = out.split('\n').filter((l) => /^PAGE ERROR|Error:/.test(l)).join(' | '); res({ x, findings, error: err || (/No problems|issue\(s\)/.test(out) ? '' : 'check-home printed no verdict: ' + out.slice(-200)) }); });
});
const queue = [...list], results = [];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) results.push(await run(queue.shift())); }));
results.sort((a, b) => list.indexOf(a.x) - list.indexOf(b.x));
const hit = (x, f) => (x.expect.rules.includes('*') ? !OLD_RULES.has(f.rule) : x.expect.rules.includes(f.rule)) && (x.expect.ids || []).every((id) => f.text.includes(id));
let bad = 0; const rows = [];
for (const { x, findings, error } of results) {
  let status, shown;
  if (error) { status = 'ERROR'; shown = [{ rule: 'error', text: error }]; bad++; }
  else if (x.kind === 'good') { shown = findings.filter((f) => physical(f, x)); status = shown.length ? (x.known ? 'XFAIL-ALARM' : 'BAD-ALARM') : x.known ? 'XPASS' : 'OK'; if (status === 'BAD-ALARM') bad++; }
  else if (x.pairs) { const miss = x.pairs.filter(([r, id]) => !findings.some((f) => f.rule === r && f.text.includes(id))); shown = miss.length ? miss.map(([r, id]) => ({ rule: 'missing', text: `${r} on ${id}` })) : findings.filter((f) => x.pairs.some(([r, id]) => f.rule === r && f.text.includes(id))); status = miss.length ? (x.known ? 'XFAIL' : 'MISSED') : (x.known ? 'XPASS' : 'CAUGHT'); if (status === 'MISSED') bad++; }   // a home replay: every (rule, object id) pair the fix list expects must fire on the saved home
  else { shown = findings.filter((f) => hit(x, f)); const caught = shown.length > 0;
    status = x.kind === 'pending' ? (caught ? 'NOW-CAUGHT' : 'PENDING') : caught ? (x.known ? 'XPASS' : 'CAUGHT') : x.known ? 'XFAIL' : 'MISSED'; if (status === 'MISSED') bad++;
    if (!caught) shown = findings.filter((f) => physical(f, x)); }
  rows.push({ name: x.name, kind: x.kind, status, from: x.from, rules: [...new Set(shown.map((f) => f.rule))], first: shown[0]?.text.slice(0, 160) || '' });
  console.log(`${status.padEnd(10)} ${x.name}${shown.length ? '  <- ' + shown.slice(0, 2).map((f) => `[${f.rule}] ${f.text.slice(0, 110)}`).join(' | ') : ''}`);
}
const count = (s) => rows.filter((r) => r.status === s).length;
console.log(`\n${rows.length} fixtures: ${['CAUGHT', 'XFAIL', 'XPASS', 'MISSED', 'OK', 'BAD-ALARM', 'XFAIL-ALARM', 'PENDING', 'NOW-CAUGHT', 'ERROR'].map((s) => `${count(s)} ${s}`).join(', ')}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));
if (!args.includes('--keep')) fs.rmSync(tmp, { recursive: true, force: true });
process.exitCode = bad ? 1 : 0;
