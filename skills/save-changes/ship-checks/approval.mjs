#!/usr/bin/env node
// Approval check, run by ship before every commit: staged Markdown files need the user's ok first.
// "@approved" in the commit subject records that ok. Generated files (a "<!-- written by" line
// in their first five lines) need none.
//   node approval.mjs --msg "<commit subject>"
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const i = process.argv.indexOf('--msg');
if (/@approved\b/.test(i > 0 ? process.argv[i + 1] || '' : '')) process.exit(0);

const staged = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--cached', '--name-only', '--no-renames'],
  { encoding: 'utf8' }).split('\n').filter(f => /\.md$/i.test(f));
const generated = f => existsSync(f) && readFileSync(f, 'utf8').split('\n', 5).some(l => l.startsWith('<!-- written by'));
const waiting = staged.filter(f => !generated(f));
if (!waiting.length) process.exit(0);

console.error('ship: stopped. These files need the user\'s ok:');
for (const f of waiting) console.error('  ' + f);
console.error('ship: show the user these changes and wait for their ok; then ship again with @approved in the subject.');
process.exit(1);
