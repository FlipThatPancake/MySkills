#!/usr/bin/env node
// Writes .agents/skills/index.md: one line per skill (name, description, SKILL.md path).
// CLAUDE.md imports it so sessions and threads that load no skills themselves still see them.
//   node scripts/skill-index.mjs
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'skills', SHARED = '.agents/skills';

const field = (text, key) => {
  const fm = (text.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
  const v = (fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm')) || [])[1] || '';
  return v.replace(/^"(.*)"$/, (_, s) => s.replace(/\\"/g, '"')).replace(/^'(.*)'$/, '$1');
};

const names = readdirSync(join(ROOT, SRC)).filter(n => existsSync(join(ROOT, SRC, n, 'SKILL.md'))).sort();
const lines = names.map(n => {
  const text = readFileSync(join(ROOT, SRC, n, 'SKILL.md'), 'utf8');
  return `- \`${n}\`: ${field(text, 'description')} \`${SHARED}/${n}/SKILL.md\``;
});
writeFileSync(join(ROOT, SHARED, 'index.md'),
  ['# Skills', '', '<!-- written by scripts/skill-index.mjs -->', ...lines, ''].join('\n'));
console.log(`skill-index: wrote ${SHARED}/index.md (${names.length} skills)`);
