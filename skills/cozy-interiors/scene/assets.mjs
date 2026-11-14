#!/usr/bin/env node
// node assets.mjs → prints every asset in the registry with its origin, size, mount and params, from src/library/meta.js (checked against the registry, so the list cannot drift).
import { ASSETS } from './src/library/meta.js';
import { REGISTRY } from './src/library/index.js';
const missing = Object.keys(REGISTRY).filter((k) => !ASSETS[k]), extra = Object.keys(ASSETS).filter((k) => !REGISTRY[k]);
const rows = Object.entries(ASSETS).map(([k, a]) => `${k.padEnd(13)} ${a.origin.padEnd(12)} ${a.size.map((v) => v || '?').join(' x ').padEnd(16)} ${a.mount.padEnd(7)} ${a.y !== undefined ? 'y ' + a.y : ''}`.padEnd(66) + `| ${a.params}${a.note ? '  — ' + a.note : ''}`);
console.log('asset         origin       size (w x d x h) mount   y\n' + rows.join('\n'));
if (missing.length || extra.length) { console.log(`\nNOT IN SYNC: registry without meta: ${missing.join(', ') || '-'}; meta without registry: ${extra.join(', ') || '-'}`); process.exitCode = 1; }
