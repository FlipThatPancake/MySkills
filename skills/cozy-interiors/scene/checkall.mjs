#!/usr/bin/env node
// node checkall.mjs [--quick] scene.json ... → runs check-home on every scene at the same time (one process and browser each) and prints their reports in order; add --quick to skip the ghost renders while iterating.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), scenes = args.filter((a) => !a.startsWith('--'));
if (!scenes.length) { console.log('usage: node checkall.mjs [--quick] <scene.json> ...'); process.exit(1); }
const runs = scenes.map((s) => new Promise((res) => { let out = ''; const p = spawn('node', [join(here, 'check-home.mjs'), s, ...flags]); p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d)); p.on('close', (code) => res({ s, out, code })); }));
let bad = 0; for (const r of await Promise.all(runs)) { console.log(r.out.trimEnd()); if (!/No problems\.\s*$/.test(r.out)) bad++; }
process.exitCode = bad ? 1 : 0;
