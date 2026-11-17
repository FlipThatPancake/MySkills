#!/usr/bin/env node
// node checkall.mjs [--quick] [--no-selftest] scene.json ... → runs check-home on every scene at the same time (one process and browser each) and prints their reports in order; add --quick to skip the ghost renders while iterating. It also runs selftest.mjs (every asset's variants on a bare floor, parts through each other) so a new asset cannot land with crossings; --no-selftest skips it.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), noSelf = args.includes('--no-selftest'), flags = args.filter((a) => a.startsWith('--') && a !== '--no-selftest' && a !== '--regress'), scenes = args.filter((a) => !a.startsWith('--'));
if (!scenes.length) { console.log('usage: node checkall.mjs [--quick] <scene.json> ...'); process.exit(1); }
const runs = scenes.map((s) => new Promise((res) => { let out = ''; const p = spawn('node', [join(here, 'check-home.mjs'), s, ...flags]); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d)); p.on('close', (code) => res({ s, out, code })); }));
const self = noSelf ? null : new Promise((res) => { let out = ''; const p = spawn('node', [join(here, 'selftest.mjs'), '--variants=8']); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d)); p.on('close', (code) => res({ out, code })); });
const regress = args.includes('--regress') ? new Promise((res) => { let out = ''; const p = spawn('node', [join(here, 'regress.mjs')]); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d)); p.on('close', (code) => res({ out, code })); }) : null;   // --regress also replays the bug memory (about 2.5 minutes)
let bad = 0; for (const r of await Promise.all(runs)) { console.log(r.out.trimEnd()); if (!/No problems\.\s*$/.test(r.out)) bad++; }
if (self) { const r = await self; const lines = r.out.split('\n').filter((l) => /^\[parts\]|variant\(s\)|^no part|rror/i.test(l)); console.log('Assets on a bare floor (selftest):\n' + lines.join('\n')); if (!/^0 asset variant/m.test(r.out)) bad++; }
if (regress) { const r = await regress; console.log('Bug memory (regress):\n' + r.out.trimEnd()); if (r.code) bad++; }
process.exitCode = bad ? 1 : 0;
